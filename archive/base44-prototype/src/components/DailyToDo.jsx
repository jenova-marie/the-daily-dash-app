import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import WidgetCard from "./WidgetCard";
import { Button } from "@/components/ui/button";
import { Printer, Mail, Eye, EyeOff, CheckCheck } from "lucide-react";
import SwipeableToDoItem from "./SwipeableToDoItem";
import EventEditDialog from "./EventEditDialog";
import TaskEditDialog from "./TaskEditDialog";
import { format } from "date-fns";
import { renderToStaticMarkup } from "react-dom/server";
import PrintFormatDailySchedule from "./PrintFormatDailySchedule";

export default function DailyToDo({ date = new Date(), onItemsLoaded }) {
  const [items, setItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [showCompleted, setShowCompleted] = useState(() => localStorage.getItem("todo_showCompleted") === "true");
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskEditDialogOpen, setTaskEditDialogOpen] = useState(false);
  const debounceTimer = useRef(null);
  const lastDateStr = useRef(null);
  const lastLoadTime = useRef(0);
  const isUpdatingRef = useRef(false);
  const dateRef = useRef(date);
  const deletedIdsRef = useRef(new Set()); // track locally deleted items so they never bounce back
  useEffect(() => { dateRef.current = date; }, [date]);

  const loadItems = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastLoadTime.current < 800) return;
    lastLoadTime.current = now;
    const dateStr = format(dateRef.current, "yyyy-MM-dd");
    const scheduleItems = await base44.entities.ScheduleItem.filter({ date: dateStr });
    const tasks = await base44.entities.Task.filter({}, "-created_date", 200);
    
    // Build a map of tasks for quick lookup and a set of tasks already in schedule
    const taskMap = {};
    const scheduledTaskIds = new Set();
    tasks.forEach(t => { taskMap[t.id] = t; });
    
    // Add priority from task map to schedule items
    scheduleItems.forEach(item => {
      if ((item.source_type === "task" || item.source_type === "custom") && item.source_id && taskMap[item.source_id]) {
        item.priority = taskMap[item.source_id].priority;
        scheduledTaskIds.add(item.source_id);
      }
    });
    
    // Find tasks due on this date that aren't already in the schedule
    const dueTasks = tasks.filter(t => 
      t.due_date === dateStr && 
      !scheduledTaskIds.has(t.id)
    ).map(t => ({
      id: `due-task-${t.id}`,
      title: t.title,
      source_type: "task",
      source_id: t.id,
      date: dateStr,
      start_time: t.due_time || null,
      end_time: null,
      priority: t.priority,
      completed: t.status === "completed",
      notes: t.description || null,
    }));
    
    const allItems = [...scheduleItems.filter(s => !s.hidden_from_todo && !s.deleted_from_app), ...dueTasks]
      .filter(i => !deletedIdsRef.current.has(i.id) && !deletedIdsRef.current.has(i.source_id));
    setItems(allItems.sort((a, b) => {
      const ta = a.start_time || "99:99";
      const tb = b.start_time || "99:99";
      return ta.localeCompare(tb);
    }));
    setHiddenItems(scheduleItems.filter(s => s.hidden_from_todo));
    setLoading(false);
    if (onItemsLoaded) onItemsLoaded(allItems);
  };

  useEffect(() => {
    const dateStr = format(date, "yyyy-MM-dd");
    lastDateStr.current = dateStr;
    loadItems(true);
  }, [date]);

  useEffect(() => {
    let debounceTimer = null;
    const handler = () => {
      if (isUpdatingRef.current) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadItems();
      }, 300);
    };
    const unsubscribes = [
      base44.entities.ScheduleItem.subscribe(handler),
      base44.entities.Task.subscribe(handler),
      base44.entities.GoalTask.subscribe(handler),
    ];
    return () => {
      clearTimeout(debounceTimer);
      unsubscribes.forEach(u => u());
    };
  }, []);

  const completeItem = async (item) => {
    if (item.source_type === "goal") return;
    const newCompleted = !item.completed;

    // Optimistically update local state immediately
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: newCompleted } : i));

    isUpdatingRef.current = true;
    try {
      // Update the source entity
      if (item.source_type === "task" && item.source_id) {
        const todayStr = format(date, "yyyy-MM-dd");
        await base44.entities.Task.update(item.source_id, { 
          status: newCompleted ? "completed" : "pending",
          last_completed_date: newCompleted ? todayStr : null
        });
      } else if (item.source_type === "chore" && item.source_id) {
        await base44.entities.Chore.update(item.source_id, { status: newCompleted ? "completed" : "pending" });
      } else if (item.source_type === "education" && item.source_id) {
        await base44.entities.EducationActivity.update(item.source_id, { completed: newCompleted });
      } else if (item.source_type === "goal" && item.source_id) {
        await base44.entities.GoalTask.update(item.source_id, { completed: newCompleted });
      }
      // Update ScheduleItem if it's a real schedule item (not a due-task)
      if (!item.id.startsWith("due-task-")) {
        await base44.entities.ScheduleItem.update(item.id, { 
          completed: newCompleted,
          hidden_from_grid: newCompleted, // auto-hide from grid when checked off
        });
      }
    } catch (e) {
      // Revert on error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: item.completed } : i));
    } finally {
      isUpdatingRef.current = false;
      loadItems();
    }
  }

  const deleteItem = async (item, action = "library") => {
    // Immediately remove from UI and track so subscription reloads don't bring it back
    deletedIdsRef.current.add(item.id);
    if (item.source_id) deletedIdsRef.current.add(item.source_id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    isUpdatingRef.current = true;

    try {
      const isDueTask = item.id?.startsWith("due-task-");

      if (action === "library") {
        // Do task update directly from frontend — avoids backend auth issues
        if (item.source_id && item.source_type === "task") {
          await base44.entities.Task.update(item.source_id, {
            due_date: null,
            due_time: null,
            schedule_time: null,
            synced_to_schedule: false,
          });
        }
        // Delete the ScheduleItem if it's a real one
        if (!isDueTask) {
          try { await base44.entities.ScheduleItem.delete(item.id); } catch (_) {}
        }
        // Save to custom history
        if (item.source_type === "custom") {
          const history = JSON.parse(localStorage.getItem("schedule_custom_history") || "[]");
          const duration = item.end_time && item.start_time
            ? Math.ceil(((parseInt(item.end_time.split(":")[0]) * 60 + parseInt(item.end_time.split(":")[1])) -
                        (parseInt(item.start_time.split(":")[0]) * 60 + parseInt(item.start_time.split(":")[1]))) / 1)
            : 60;
          const updated = [{ title: item.title, duration }, ...history.filter(h => h.title !== item.title)].slice(0, 10);
          localStorage.setItem("schedule_custom_history", JSON.stringify(updated));
        }
      } else if (action === "keep_in_calendar") {
        if (!isDueTask) {
          await base44.entities.ScheduleItem.update(item.id, { hidden_from_todo: true });
        }
      } else if (action === "delete_app") {
        if (!isDueTask) {
          try { await base44.entities.ScheduleItem.delete(item.id); } catch (_) {}
        }
        if (item.source_id) {
          if (item.source_type === "task") await base44.entities.Task.delete(item.source_id);
          else if (item.source_type === "chore") await base44.entities.Chore.delete(item.source_id);
          else if (item.source_type === "education") await base44.entities.EducationActivity.delete(item.source_id);
          else if (item.source_type === "goal") await base44.entities.GoalTask.delete(item.source_id);
        }
      } else if (action === "delete_google") {
        // Only this case needs the backend function (for Google API access)
        if (!isDueTask) {
          try { await base44.entities.ScheduleItem.delete(item.id); } catch (_) {}
        }
        await base44.functions.invoke("deleteToDoItem", {
          scheduleItemId: item.id,
          action,
          sourceType: item.source_type,
          sourceId: item.source_id || null,
          googleEventId: item.google_event_id || null,
          googleCalendarId: item.google_calendar_id || null,
        });
      }
    } catch (e) {
      console.error("deleteItem failed:", e);
    } finally {
      setTimeout(() => { isUpdatingRef.current = false; }, 500);
    }
  };

  const unhideItem = async (item) => {
    await base44.entities.ScheduleItem.update(item.id, { hidden_from_todo: false });
    loadItems(true);
  };

  const getHtml = (mode = "todo") => {
    const dateStr = format(date, "yyyy-MM-dd");
    return renderToStaticMarkup(
      <PrintFormatDailySchedule todoItems={items} date={dateStr} mode={mode} />
    );
  };

  const handlePrint = () => {
    const html = getHtml("todo");
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>To Do</title></head><body>${html}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleEmail = async () => {
    const html = getHtml("todo");
    const user = await base44.auth.me();
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: "Daily To Do",
      body: html,
    });
    alert("Sent to your email!");
  };

  return (
    <WidgetCard
      title="TO DO"
      id="daily-todo"
      headerRight={
        <div className="flex items-center gap-1 no-print">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            title={showCompleted ? "Hide completed" : "Show completed"}
            onClick={() => { const next = !showCompleted; setShowCompleted(next); localStorage.setItem("todo_showCompleted", next); }}
          >
            <CheckCheck className={showCompleted ? "w-4 h-4 text-primary" : "w-4 h-4 text-muted-foreground"} />
          </Button>
          {hiddenItems.length > 0 && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowHidden(v => !v)} title={showHidden ? "Hide hidden items" : `Show ${hiddenItems.length} hidden item(s)`}>
              {showHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handlePrint} title="Print">
            <Printer className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleEmail} title="Email">
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No items to complete</p>
        ) : (
          items.filter(item => showCompleted || !item.completed).map((item) => (
            <SwipeableToDoItem
              key={item.id}
              item={item}
              onComplete={completeItem}
              onDelete={deleteItem}
              onHide={async (item) => {
                if (item.id?.startsWith("due-task-")) return;
                await base44.entities.ScheduleItem.update(item.id, { hidden_from_grid: true });
                loadItems();
              }}
              onEdit={(item) => {
                if (item.source_type === "task" && item.source_id) {
                  base44.entities.Task.filter({ id: item.source_id }).then(tasks => {
                    if (tasks[0]) { setEditingTask(tasks[0]); setTaskEditDialogOpen(true); }
                  });
                } else {
                  setEditingItem(item); setEditDialogOpen(true);
                }
              }}
            />
          ))
        )}

        {showHidden && hiddenItems.length > 0 && (
          <div className="mt-3 border-t border-border pt-3 space-y-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Hidden from To Do</p>
            {hiddenItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 px-2 rounded-md bg-muted/40 opacity-60">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  {item.start_time && <div className="text-xs text-muted-foreground">{item.start_time}</div>}
                </div>
                <Button size="sm" variant="ghost" className="shrink-0 h-7 px-2 text-xs gap-1" onClick={() => unhideItem(item)}>
                  <Eye className="w-3.5 h-3.5" /> Unhide
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <EventEditDialog
        event={editingItem}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={loadItems}
        onHide={async (item) => {
          await base44.entities.ScheduleItem.update(item.id, { hidden_from_grid: true });
          loadItems();
        }}
      />
      <TaskEditDialog
        task={editingTask}
        open={taskEditDialogOpen}
        onOpenChange={setTaskEditDialogOpen}
        onUpdate={loadItems}
        onHide={async (task) => {
          // Find the schedule item linked to this task and hide it from grid
          const dateStr = format(date, "yyyy-MM-dd");
          const scheduleItems = await base44.entities.ScheduleItem.filter({ date: dateStr, source_id: task.id });
          if (scheduleItems[0]) {
            await base44.entities.ScheduleItem.update(scheduleItems[0].id, { hidden_from_grid: true });
          }
          loadItems();
        }}
      />
    </WidgetCard>
  );
}