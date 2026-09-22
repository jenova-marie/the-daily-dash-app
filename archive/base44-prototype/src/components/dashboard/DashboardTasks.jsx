import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { shouldTaskShowToday } from "@/lib/recurringTaskUtils";
import { Sunrise, Sun, Sunset, Moon, StickyNote, Printer, Mail } from "lucide-react";
import TaskEditDialog from "@/components/TaskEditDialog";
import { Button } from "@/components/ui/button";
import { printComponent, emailComponent } from "@/lib/printUtils";
import PrintFormatTasksByDay from "@/components/PrintFormatTasksByDay";
import PrintRangeDialog from "@/components/PrintRangeDialog";

const TIME_BUCKETS = [
  { key: "morning",   label: "Morning",   icon: Sunrise,  range: [0, 12],  color: "text-amber-400" },
  { key: "afternoon", label: "Afternoon", icon: Sun,      range: [12, 17], color: "text-orange-400" },
  { key: "evening",   label: "Evening",   icon: Sunset,   range: [17, 20], color: "text-purple-400" },
  { key: "night",     label: "Night",     icon: Moon,     range: [20, 24], color: "text-blue-400" },
  { key: "anytime",   label: "Anytime",   icon: null,     range: null,     color: "text-muted-foreground" },
];

function getTimeBucket(task) {
  if (!task.due_time) return "anytime";
  const [h] = task.due_time.split(":").map(Number);
  for (const b of TIME_BUCKETS) {
    if (b.range && h >= b.range[0] && h < b.range[1]) return b.key;
  }
  return "anytime";
}

const priorityColors = {
  urgent: "text-red-500",
  high: "text-orange-500",
  medium: "text-cyan-500",
  low: "text-green-600",
};

export default function DashboardTasks() {
  const [dueToday, setDueToday] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [rangeDialog, setRangeDialog] = useState(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    let allTasks;
    try {
      allTasks = await base44.entities.Task.filter({ status: "pending" }, "-created_date", 200);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      return;
    }

    const due = [];
    const late = [];

    for (const t of allTasks) {
      if (t.status === "completed") continue;

      if (t.due_date && t.due_date < today) {
        late.push(t);
      } else if (t.due_date === today || shouldTaskShowToday(t)) {
        due.push(t);
      }
    }

    setDueToday(due);
    setOverdue(late);
  };

  const toggleTask = async (task) => {
    await base44.entities.Task.update(task.id, {
      status: task.status === "completed" ? "pending" : "completed",
    });
    loadTasks();
  };

  const renderTask = (task) => (
    <div
      key={task.id}
      className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group"
      onDoubleClick={() => setEditingTask(task)}
      title="Double-click to edit notes"
    >
      <Checkbox
        checked={task.status === "completed"}
        onCheckedChange={() => toggleTask(task)}
      />
      <span className={cn("text-sm flex-1 cursor-pointer", task.status === "completed" && "line-through text-muted-foreground")}>
        {task.title}
        {task.description && (
          <span className="ml-1 text-muted-foreground/60"><StickyNote className="w-3 h-3 inline" /></span>
        )}
      </span>
      {task.priority && (
        <span className={cn("text-xs font-medium", priorityColors[task.priority])}>
          {task.priority}
        </span>
      )}
    </div>
  );

  // Group dueToday by time bucket
  const grouped = {};
  for (const b of TIME_BUCKETS) grouped[b.key] = [];
  for (const t of dueToday) grouped[getTimeBucket(t)].push(t);

  // Check if any tasks actually have a time assigned
  const hasTimedTasks = dueToday.some(t => t.due_time);

  if (dueToday.length === 0 && overdue.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No pending tasks for today</p>;
  }

  const allTasksForPrint = [...overdue, ...dueToday];

  const openRangeDialog = (mode) => {
    const t = format(new Date(), "yyyy-MM-dd");
    setRangeDialog({ mode, start: t, end: t });
  };

  const handleRangeConfirm = async (start, end) => {
    const { mode } = rangeDialog || {};
    const allTasks = await base44.entities.Task.filter({ status: "pending" }, "-created_date", 500);
    const rangeTasks = allTasks.filter((t) => t.status !== "completed" && t.due_date && t.due_date >= start && t.due_date <= end);
    const title = `Tasks (${start === end ? start : `${start} → ${end}`})`;
    if (mode === "print") printComponent(title, <PrintFormatTasksByDay tasks={rangeTasks} title={title} />);
    else emailComponent(title, <PrintFormatTasksByDay tasks={rangeTasks} title={title} />);
  };

  return (
    <>
      <div className="flex justify-end gap-1 no-print mb-2">
        <Button size="icon" variant="ghost" className="h-7 w-7 bg-secondary/50" onClick={() => openRangeDialog('print')} title="Print tasks"><Printer className="w-4 h-4" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 bg-secondary/50" onClick={() => openRangeDialog('email')} title="Email tasks"><Mail className="w-4 h-4" /></Button>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {overdue.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-1.5 px-2">
              Overdue ({overdue.length})
            </p>
            <div className="space-y-1">{overdue.map(renderTask)}</div>
          </div>
        )}

        {hasTimedTasks ? (
          TIME_BUCKETS.map(({ key, label, icon: BucketIcon, color }) => {
            const tasks = grouped[key];
            if (!tasks?.length) return null;
            return (
              <div key={key}>
                <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1.5 px-2 flex items-center gap-1.5", color)}>
                  {BucketIcon && <BucketIcon className="w-3 h-3" />}
                  {label} ({tasks.length})
                </p>
                <div className="space-y-1">{tasks.map(renderTask)}</div>
              </div>
            );
          })
        ) : (
          dueToday.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1.5 px-2">
                Due Today ({dueToday.length})
              </p>
              <div className="space-y-1">{dueToday.map(renderTask)}</div>
            </div>
          )
        )}
      </div>
      {editingTask && (
        <TaskEditDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => { if (!open) setEditingTask(null); }}
          onUpdate={() => { loadTasks(); setEditingTask(null); }}
        />
      )}
      <PrintRangeDialog
        open={!!rangeDialog}
        onOpenChange={(o) => !o && setRangeDialog(null)}
        title={rangeDialog?.mode === 'email' ? 'Email — Select Date Range' : 'Print — Select Date Range'}
        mode={rangeDialog?.mode || 'print'}
        defaultStart={rangeDialog?.start || format(new Date(), "yyyy-MM-dd")}
        defaultEnd={rangeDialog?.end || format(new Date(), "yyyy-MM-dd")}
        onConfirm={handleRangeConfirm}
      />
    </>
  );
}