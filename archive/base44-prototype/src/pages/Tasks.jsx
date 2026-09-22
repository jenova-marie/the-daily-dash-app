import { useState, useEffect, useRef } from "react";
import { useHeader } from "@/lib/HeaderContext";
import WidgetCard from "../components/WidgetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Printer, Mail, NotebookPen, Calendar as CalendarIcon, Trash2, HelpCircle, CheckCircle2, Tag, RotateCw, ListTodo, ExternalLink, X, ChevronsUpDown, ChevronsDownUp, ChevronDown, ChevronRight } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import PrintFormatTasks from "../components/PrintFormatTasks";
import TasksOnboarding from "@/components/onboarding/TasksOnboarding";
import ModernTimePicker from "@/components/ModernTimePicker";
import React from "react";
import TaskEditDialog from "../components/TaskEditDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";
import SwipeableListItem from "../components/SwipeableListItem";
import LabelPicker from "../components/LabelPicker";
import { saveLabelToHistory } from "../utils/labelHistory";
import CategoryFilter from "../components/CategoryFilter";
import { uniqueCategories, groupByCategoryCI, categoryMatchesCI } from "@/lib/categoryUtils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const priorityColors = {
  urgent: "border-l-4 border-l-red-600",
  high: "border-l-4 border-l-orange-500",
  medium: "border-l-4 border-l-yellow-400",
  low: "border-l-4 border-l-green-600",
};



export default function Tasks() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Task Manager"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={() => setShowOnboarding(true)} title="Guide" className="h-8 w-8 text-sm font-medium"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("active");
  const [sortBy, setSortBy] = useState("priority");
  const [selectedLabel, setSelectedLabel] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [noteTask, setNoteTask] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { task }
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", due_date: "", due_time: "", category: "", category_color: "", frequency: "one-time", days_of_week: [], occurrences: 1 });
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("tasks_onboarded") === "true") return;
    base44.entities.ThemeSettings.list("-updated_date", 1).then(r => {
      if (!r.length) { setShowOnboarding(true); return; }
      const status = JSON.parse(r[0].onboarding_status || "{}");
      if (!status["tasks_onboarded"]) setShowOnboarding(true);
      else localStorage.setItem("tasks_onboarded", "true");
    }).catch(() => setShowOnboarding(true));
  }, []);
  const [allCollapsed, setAllCollapsed] = useState(() => {
    try { return localStorage.getItem("tasks_default_collapsed") !== "0"; } catch { return true; }
  });
  // When allCollapsed=true, this tracks which groups are individually expanded (exceptions)
  // When allCollapsed=false, this tracks which groups are individually collapsed (exceptions)
  const [groupExceptions, setGroupExceptions] = useState(new Set());

  const toggleGroup = (key) => {
    setGroupExceptions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllCollapsed = () => {
    setAllCollapsed(prev => !prev);
    setGroupExceptions(new Set());
  };

  const resetOnboarding = () => setShowOnboarding(true);

  const deduplicateRecurringTasks = async () => {
    const all = await base44.entities.Task.filter({}, "-created_date", 200);
    // Group pending recurring tasks by title+pattern
    const pendingRecurring = all.filter(t => t.is_recurring && t.status === "pending");
    const seen = {};
    const toDelete = [];
    for (const t of pendingRecurring) {
      const key = `${t.title}||${t.recurrence_pattern}`;
      if (seen[key]) {
        // Keep the one with the earliest due_date, delete the rest
        if (!t.due_date || (seen[key].due_date && t.due_date > seen[key].due_date)) {
          toDelete.push(t.id);
        } else {
          toDelete.push(seen[key].id);
          seen[key] = t;
        }
      } else {
        seen[key] = t;
      }
    }
    if (toDelete.length > 0) {
      await Promise.all(toDelete.map(id => base44.entities.Task.delete(id)));
    }
    loadTasks();
    return toDelete.length;
  };

  // Run dedup on mount once
  useEffect(() => { deduplicateRecurringTasks(); }, []);

  useEffect(() => { loadTasks(); }, [filter]);

  const debounceTimer = useRef(null);
  
  useEffect(() => {
    const unsubscribe = base44.entities.Task.subscribe(() => {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        queryClientInstance.invalidateQueries({ queryKey: ['tasks', filter] });
      }, 500);
    });
    return () => {
      clearTimeout(debounceTimer.current);
      unsubscribe();
    };
  }, [filter]);

  const loadTasks = async () => {
    const data = await base44.entities.Task.filter({}, "-created_date", 100);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedThisPeriod = (t) => {
      if (!t.last_completed_date) return false;
      const lastDone = t.last_completed_date;
      if (t.recurrence_pattern === "daily") return lastDone === todayStr;
      if (t.recurrence_pattern === "weekly") {
        const lastDoneDate = new Date(lastDone + "T00:00:00");
        const diffDays = Math.floor((today - lastDoneDate) / (1000 * 60 * 60 * 24));
        return diffDays < 7 && lastDoneDate <= today;
      }
      if (t.recurrence_pattern === "biweekly") {
        const lastDoneDate = new Date(lastDone + "T00:00:00");
        const diffDays = Math.floor((today - lastDoneDate) / (1000 * 60 * 60 * 24));
        return diffDays < 14 && lastDoneDate <= today;
      }
      if (t.recurrence_pattern === "days_of_week") {
        // Completed today counts
        return lastDone === todayStr;
      }
      if (t.recurrence_pattern === "monthly") return lastDone.slice(0, 7) === todayStr.slice(0, 7);
      return false;
    };

    const isDueToday = (t) => {
      if (t.status === "completed") return false;
      return !!(t.due_date && t.due_date === todayStr);
    };

    const isOverdue = (t) => {
      if (t.status === "completed") return false;
      return !!(t.due_date && t.due_date < todayStr);
    };

    const isDueOrOverdue = (t) => isDueToday(t) || isOverdue(t);

    let filtered;
    if (filter === "active") {
      filtered = data.filter(t => t.status !== "completed");
    } else if (filter === "due") {
      filtered = data.filter(isDueOrOverdue);
    } else if (filter === "due-today") {
      filtered = data.filter(isDueToday);
    } else if (filter === "overdue") {
      filtered = data.filter(isOverdue);
    } else if (filter === "unscheduled") {
      // No due_date and not recurring
      filtered = data.filter(t => t.status !== "completed" && !t.due_date && !t.is_recurring);
    } else if (filter === "not-due-yet") {
      filtered = data.filter(t => t.status !== "completed" && t.due_date && t.due_date > todayStr);
    } else if (filter === "completed") {
       filtered = data.filter(t => t.status === "completed");
     } else {
       filtered = data.filter(t => t.status !== "completed");
     }
    setTasks(filtered);
  };

  const createTask = async () => {
    if (!form.title) return;
    if (form.category) saveLabelToHistory(form.category, form.category_color);
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    const isOccurrences = form.frequency === "occurrences";
    const taskData = {
      ...form,
      due_date: form.due_date || null,
      is_recurring: form.frequency !== "one-time",
      recurrence_pattern: form.frequency !== "one-time" ? form.frequency : null,
      occurrences: isOccurrences ? (form.occurrences || 1) : null,
      completed_count: isOccurrences ? 0 : null,
    };
    await base44.entities.Task.create(taskData);
    setForm({ title: "", description: "", priority: "medium", due_date: "", due_time: "", category: "", category_color: "", frequency: "one-time", days_of_week: [], occurrences: 1 });
    setDialogOpen(false);
    loadTasks();
  };

  const togglingRef = useRef(new Set());

  const toggleTask = async (task) => {
    if (togglingRef.current.has(task.id)) return;
    togglingRef.current.add(task.id);

    // Handle occurrence-based tasks
    if (task.recurrence_pattern === "occurrences" && task.is_recurring) {
      const currentCount = task.completed_count || 0;
      const total = task.occurrences || 1;
      const newCount = task.status === "completed" ? Math.max(0, currentCount - 1) : currentCount + 1;
      const newStatus = newCount >= total ? "completed" : "pending";
      await base44.entities.Task.update(task.id, {
        completed_count: newCount,
        status: newStatus,
        last_completed_date: newCount > currentCount ? todayStr : task.last_completed_date,
      });
      togglingRef.current.delete(task.id);
      loadTasks();
      return;
    }

    const newStatus = task.status === "completed" ? "pending" : "completed";
    await base44.entities.Task.update(task.id, {
      status: newStatus,
      last_completed_date: newStatus === "completed" ? todayStr : null,
    });
    
    // Update all linked ScheduleItems with the same completion status
    const linked = await base44.entities.ScheduleItem.filter({ source_id: task.id });
    await Promise.all(linked.map(item => 
      base44.entities.ScheduleItem.update(item.id, { completed: newStatus === "completed" })
    ));
    
    if (newStatus === "completed" && task.is_recurring) {
      // Check if a pending next-occurrence already exists to avoid duplicates
      const existingPending = await base44.entities.Task.filter({
        title: task.title,
        is_recurring: true,
        recurrence_pattern: task.recurrence_pattern,
        status: "pending",
      });
      // Only create next occurrence if no pending one exists for this recurring task
      if (existingPending.length === 0) {
        const dueDate = new Date(task.due_date || new Date());
        if (task.recurrence_pattern === "daily") dueDate.setDate(dueDate.getDate() + 1);
        else if (task.recurrence_pattern === "weekly") {
          if (task.days_of_week?.length > 0) {
            let nextDate = new Date(dueDate);
            let found = false;
            for (let i = 1; i <= 7; i++) {
              nextDate.setDate(nextDate.getDate() + 1);
              const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][nextDate.getDay()];
              if (task.days_of_week.includes(dayName)) {
                dueDate.setTime(nextDate.getTime());
                found = true;
                break;
              }
            }
            if (!found) dueDate.setDate(dueDate.getDate() + 7);
          } else dueDate.setDate(dueDate.getDate() + 7);
        }
        else if (task.recurrence_pattern === "biweekly") dueDate.setDate(dueDate.getDate() + 14);
        else if (task.recurrence_pattern === "days_of_week") {
          // Find next scheduled day
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const scheduledDays = task.days_of_week || [];
          let nextDate = new Date(dueDate);
          let found = false;
          for (let i = 1; i <= 7; i++) {
            nextDate.setDate(nextDate.getDate() + 1);
            const dayName = days[nextDate.getDay()];
            if (scheduledDays.includes(dayName)) {
              dueDate.setTime(nextDate.getTime());
              found = true;
              break;
            }
          }
          if (!found) dueDate.setDate(dueDate.getDate() + 1);
        }
        else if (task.recurrence_pattern === "monthly") dueDate.setMonth(dueDate.getMonth() + 1);

        await base44.entities.Task.create({
          title: task.title,
          description: task.description,
          priority: task.priority,
          category: task.category,
          category_color: task.category_color,
          due_date: dueDate.toISOString().split("T")[0],
          due_time: task.due_time,
          is_recurring: true,
          recurrence_pattern: task.recurrence_pattern,
          days_of_week: task.days_of_week || [],
        });
      }
    }
    togglingRef.current.delete(task.id);
    loadTasks();
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} task(s)?`)) return;
    await Promise.all(Array.from(selectedIds).map(id => base44.entities.Task.delete(id)));
    setSelectedIds(new Set());
    setIsBatchDeleteMode(false);
    loadTasks();
  };

  const requestDeleteTask = (task) => {
    if (task.google_task_id) {
      setDeleteConfirm({ task });
    } else {
      deleteTask(task, false);
    }
  };

  const deleteTask = async (task, deleteFromGoogle) => {
    if (deleteFromGoogle && task.google_task_id) {
      await base44.functions.invoke('syncGoogleTasks', { deleteTaskId: task.google_task_id });
    }
    // Save to trash before deleting
    const now = new Date().toISOString();
    await base44.entities.TrashBin.create({
      item_type: 'task',
      item_id: task.id,
      item_data: JSON.stringify(task),
      deleted_at: now
    });
    // Check if this task has any linked schedule entries
    const linked = await base44.entities.ScheduleItem.filter({ source_id: task.id });
    await base44.entities.Task.delete(task.id);
    if (linked.length > 0) {
      setDeleteInfo('Task deleted. It was also removed from the Daily Schedule.');
    }
    setDeleteConfirm(null);
    loadTasks();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         {isBatchDeleteMode && selectedIds.size > 0 ? (
           <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
             <Button variant="destructive" size="sm" onClick={deleteSelected} className="gap-2">
               <Trash2 className="w-4 h-4" /> Delete
             </Button>
             <Button variant="outline" size="sm" onClick={() => { setIsBatchDeleteMode(false); setSelectedIds(new Set()); }} className="bg-secondary/500">
               Cancel
             </Button>
           </div>
         ) : isBatchDeleteMode ? (
           <Button variant="outline" size="sm" onClick={() => setIsBatchDeleteMode(false)} className="bg-secondary/500">
             Cancel
           </Button>
         ) : (
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => setIsBatchDeleteMode(true)} className="bg-secondary/50">
               Select
             </Button>
             <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
             <DialogTrigger asChild>
               <Button><Plus className="w-4 h-4 mr-2" /></Button>
             </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Task title" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Due Date</Label>
                  <div className="flex gap-1">
                    <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start bg-secondary/50">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {form.due_date ? format(new Date(form.due_date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                      <PopoverContent align="start">
                        <Calendar
                          mode="single"
                          selected={form.due_date ? new Date(form.due_date + "T00:00:00") : undefined}
                          onSelect={(date) => {
                            if (date) setForm({ ...form, due_date: date.toISOString().split("T")[0] });
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    {form.due_date && (
                      <Button variant="outline" size="icon" className="shrink-0" onClick={() => setForm({ ...form, due_date: "" })}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                   <Label>Due Time</Label>
                   <ModernTimePicker value={form.due_time} onChange={(v) => setForm({ ...form, due_time: v })} />
                 </div>
              </div>
              <div className="col-span-2">
                <LabelPicker
                  label={form.category}
                  color={form.category_color}
                  onLabelChange={(v) => setForm(f => ({ ...f, category: v }))}
                  onColorChange={(v) => setForm(f => ({ ...f, category_color: v }))}
                  onSelect={(lbl, clr) => setForm(f => ({ ...f, category: lbl, category_color: clr }))}
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v, days_of_week: [] })}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="one-time">One-time</SelectItem>
                   <SelectItem value="daily">Daily</SelectItem>
                   <SelectItem value="weekly">Weekly</SelectItem>
                   <SelectItem value="biweekly">Biweekly (Every 2 Weeks)</SelectItem>
                   <SelectItem value="monthly">Monthly</SelectItem>
                   <SelectItem value="days_of_week">Specific Days of Week</SelectItem>
                   <SelectItem value="occurrences">X Times Total</SelectItem>
                 </SelectContent>
                </Select>
              </div>
              {form.frequency === "occurrences" && (
                <div>
                  <Label>How many times?</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.occurrences}
                    onChange={(e) => setForm({ ...form, occurrences: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}
              {(form.frequency === "weekly" || form.frequency === "days_of_week") && (
                <div>
                  <Label>{form.frequency === "days_of_week" ? "Select Days" : "Days of Week (optional)"}</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={form.days_of_week.includes(day)}
                          onCheckedChange={(checked) => {
                            if (checked) setForm({ ...form, days_of_week: [...form.days_of_week, day] });
                            else setForm({ ...form, days_of_week: form.days_of_week.filter((d) => d !== day) });
                          }}
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <Button onClick={createTask} className="w-full">Create Task</Button>
            </div>
            </DialogContent>
            </Dialog>
            </div>
            )}
            </div>

      <div className="space-y-3 no-print">
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48 bg-primary text-primary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="due-today">Due Today</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="not-due-yet">Pending (upcoming)</SelectItem>
              <SelectItem value="unscheduled">Unscheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setSelectedLabel("all"); }}>
            <SelectTrigger className="w-36 bg-primary text-primary-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="recurrence">Frequency</SelectItem>
              <SelectItem value="label">Label</SelectItem>
            </SelectContent>
          </Select>
          {sortBy === "label" && (() => {
            const allLabels = uniqueCategories(tasks.map(t => t.category)).sort();
            return (
              <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                <SelectTrigger className="w-40 bg-primary text-primary-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Labels</SelectItem>
                  {allLabels.map(lbl => (
                    <SelectItem key={lbl} value={lbl}>{lbl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>
        

      </div>

      <WidgetCard title={`Tasks (${tasks.length})`} id="tasks-list" headerRight={(
        <div className="flex items-center gap-1 no-print">
          <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={toggleAllCollapsed} title={allCollapsed ? "Expand all" : "Collapse all"}>
            {allCollapsed ? <ChevronsUpDown className="w-4 h-4" /> : <ChevronsDownUp className="w-4 h-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={() => {
            const html = renderToStaticMarkup(<PrintFormatTasks tasks={tasks} groupBy={sortBy === "label" ? "label" : "priority"} />);
            const win = window.open('', '_blank');
            win.document.write(`<html><head><title>Tasks</title></head><body>${html}</body></html>`);
            win.document.close();
            win.print();
          }} title="Print tasks">
            <Printer className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={async () => {
            const html = renderToStaticMarkup(<PrintFormatTasks tasks={tasks} groupBy={sortBy === "label" ? "label" : "priority"} />);
            const user = await base44.auth.me();
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: 'Task List',
              body: html,
            });
            alert('Sent to your email!');
          }} title="Email tasks">
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      )}>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks found</p>
          ) : (() => {
            let activeTasks = tasks.filter(t => t.status !== "completed");
            let completedTasks = tasks.filter(t => t.status === "completed");
            
            if (selectedCategories.length > 0) {
              activeTasks = activeTasks.filter(t => categoryMatchesCI(t.category, selectedCategories));
              completedTasks = completedTasks.filter(t => categoryMatchesCI(t.category, selectedCategories));
            }

            const sortByDate = (list) => [...list].sort((a, b) => {
              if (!a.due_date && !b.due_date) return 0;
              if (!a.due_date) return 1;
              if (!b.due_date) return -1;
              return new Date(a.due_date) - new Date(b.due_date);
            });

            const buildFreqGroups = (list) => {
              const grouped = { "one-time": [], daily: [], weekly: [], biweekly: [], monthly: [], days_of_week: [], occurrences: [] };
              list.forEach((t) => {
                const freq = !t.is_recurring ? "one-time" : (t.recurrence_pattern || "daily");
                grouped[freq]?.push(t);
              });
              Object.keys(grouped).forEach((key) => { grouped[key] = sortByDate(grouped[key]); });
              return grouped;
            };

            const buildLabelGroups = (list) => {
              const grouped = groupByCategoryCI(list, t => t.category);
              Object.keys(grouped).forEach((key) => { grouped[key] = sortByDate(grouped[key]); });
              return grouped;
            };

            const freqLabels = { "one-time": "One-time", daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", days_of_week: "Specific Days", occurrences: "X Times Total" };

            const buildPriorityGroups = (list) => {
              const order = ["urgent", "high", "medium", "low"];
              const grouped = { urgent: [], high: [], medium: [], low: [] };
              list.forEach((t) => {
                const p = t.priority || "medium";
                if (grouped[p]) grouped[p].push(t);
                else grouped["medium"].push(t);
              });
              order.forEach((key) => { grouped[key] = sortByDate(grouped[key]); });
              return grouped;
            };
            const priorityLabels = { urgent: "Urgent", high: "High", medium: "Medium", low: "Low" };

            const isFuture = (t) => !!(t.due_date && t.due_date > todayStr && t.status !== "completed");

            const renderTaskRow = (task) => {
                const categoryColor = task.category_color || "#06b6d4";
                const futureDimmed = filter === "active" && isFuture(task);
                let lastTapTime = 0;
                const handleTaskTap = () => {
                  const now = Date.now();
                  if (now - lastTapTime < 300) {
                    setEditingTask(task);
                    setEditDialogOpen(true);
                  }
                  lastTapTime = now;
                };
                let taskLinks = [];
                try {
                  taskLinks = task.links ? JSON.parse(task.links) : [];
                } catch {
                  taskLinks = [];
                }
                return (
                  <SwipeableListItem 
                   key={task.id} 
                   onDelete={() => requestDeleteTask(task)} 
                   className={cn(task.priority && priorityColors[task.priority], futureDimmed && "opacity-40 grayscale")}
                   isBatchMode={isBatchDeleteMode}
                   onToggleBatchMode={() => setIsBatchDeleteMode(!isBatchDeleteMode)}
                   isSelected={selectedIds.has(task.id)}
                   onBatchToggle={() => toggleSelection(task.id)}
                  >
                   <Checkbox
                     checked={task.status === "completed"}
                     onCheckedChange={() => toggleTask(task)}
                   />
                   <div className="flex-1 flex flex-col ml-2" onDoubleClick={() => { setEditingTask(task); setEditDialogOpen(true); }} onClick={handleTaskTap} style={{ cursor: 'pointer' }}>
                     <span className={cn("text-sm", task.status === "completed" && "line-through text-muted-foreground")}>
                       {task.title}
                     </span>
                     {taskLinks.length > 0 && (
                       <div className="flex flex-wrap gap-1 mt-1">
                         {taskLinks.slice(0, 2).map((url, idx) => (
                           <a
                             key={idx}
                             href={url}
                             target="_blank"
                             rel="noopener noreferrer"
                             title={url}
                             className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs transition-colors"
                             onClick={(e) => e.stopPropagation()}
                           >
                             <ExternalLink className="w-2.5 h-2.5" />
                             {new URL(url).hostname.replace("www.", "")}
                           </a>
                         ))}
                         {taskLinks.length > 2 && (
                           <span className="text-xs text-muted-foreground px-1.5 py-0.5">+{taskLinks.length - 2}</span>
                         )}
                       </div>
                     )}
                     {task.recurrence_pattern === "occurrences" && task.occurrences > 1 && (
                       <div className="text-xs text-muted-foreground mt-0.5">
                         {task.completed_count || 0}/{task.occurrences} done
                         <div className="mt-0.5 h-1 rounded-full bg-muted overflow-hidden w-20">
                           <div className="h-full bg-primary transition-all" style={{ width: `${Math.round(((task.completed_count || 0) / task.occurrences) * 100)}%` }} />
                         </div>
                       </div>
                     )}
                     {(task.due_date || task.due_time || task.schedule_time) && (
                       <div className="text-xs text-muted-foreground">
                         {task.due_date && <span>{format(new Date(task.due_date + "T00:00:00"), "MMM d")}</span>}
                         {task.due_time && <span className="ml-1">{task.due_time}</span>}
                         {task.schedule_time && !task.due_time && <span className="ml-1">{task.schedule_time}</span>}
                       </div>
                     )}
                   </div>
                   {task.category && (
                     <span 
                       className="text-xs font-medium shrink-0"
                       style={{ color: categoryColor }}
                     >
                       {task.category.toUpperCase()}
                     </span>
                   )}
                   {task.description && (
                     <button onClick={() => setNoteTask(task)} className="transition-colors text-primary hover:text-primary/70 shrink-0" title="View note">
                       <NotebookPen className="w-3.5 h-3.5" />
                     </button>
                   )}
                  </SwipeableListItem>
                );
              };

            const renderGroup = (key, label, groupTasks) => {
              const isCollapsed = allCollapsed ? !groupExceptions.has(key) : groupExceptions.has(key);
              return (
                <div key={key}>
                  <button
                    onClick={() => toggleGroup(key)}
                    className="flex items-center gap-1.5 w-full text-left mb-2 group"
                  >
                    {isCollapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase group-hover:text-foreground transition-colors">
                      {label} <span className="font-normal normal-case">({groupTasks.length})</span>
                    </h3>
                  </button>
                  {!isCollapsed && <div className="space-y-2">{groupTasks.map(renderTaskRow)}</div>}
                </div>
              );
            };

            if (sortBy === "recurrence") {
              const recurrenceOrder = ["daily", "weekly", "biweekly", "monthly", "days_of_week", "occurrences", "one-time"];
              const recurrenceLabels = { daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly", days_of_week: "Specific Days", occurrences: "X Times Total", "one-time": "One-time" };
              const recurrenceGroups = { daily: [], weekly: [], biweekly: [], monthly: [], days_of_week: [], occurrences: [], "one-time": [] };
              activeTasks.forEach((t) => {
                const key = !t.is_recurring ? "one-time" : (t.recurrence_pattern || "daily");
                if (recurrenceGroups[key]) recurrenceGroups[key].push(t);
                else recurrenceGroups["one-time"].push(t);
              });
              recurrenceOrder.forEach((k) => { recurrenceGroups[k] = sortByDate(recurrenceGroups[k]); });
              return (
                <>
                  {recurrenceOrder.map((k) => recurrenceGroups[k].length > 0 && renderGroup(k, recurrenceLabels[k], recurrenceGroups[k]))}
                  {filter === "completed" && completedTasks.length > 0 && renderGroup("completed", "Completed", completedTasks)}
                </>
              );
            }

            if (sortBy === "priority") {
              const priorityGroups = buildPriorityGroups(activeTasks);
              const priorityOrder = ["urgent", "high", "medium", "low"];
              return (
                <>
                  {priorityOrder.map((p) => priorityGroups[p].length > 0 && renderGroup(p, priorityLabels[p], priorityGroups[p]))}
                  {filter === "completed" && completedTasks.length > 0 && renderGroup("completed", "Completed", completedTasks)}
                </>
              );
            }

            if (sortBy === "label") {
              let labelFiltered = selectedLabel !== "all"
                ? activeTasks.filter(t => (t.category || "(No Label)").toLowerCase() === selectedLabel.toLowerCase())
                : activeTasks;
              const labelGroups = buildLabelGroups(labelFiltered);
              return (
                <>
                  {Object.entries(labelGroups).sort(([a], [b]) => a === "(No Label)" ? 1 : b === "(No Label)" ? -1 : a.localeCompare(b)).map(([lbl, lblTasks]) =>
                    lblTasks.length > 0 && renderGroup(lbl, lbl, lblTasks)
                  )}
                  {filter === "completed" && completedTasks.length > 0 && renderGroup("completed", "Completed", completedTasks)}
                </>
              );
            }

            const activeGroups = buildFreqGroups(activeTasks);
            return (
              <>
                {Object.entries(activeGroups).map(([freq, freqTasks]) => freqTasks.length > 0 && renderGroup(freq, freqLabels[freq], freqTasks))}
                {filter === "completed" && completedTasks.length > 0 && renderGroup("completed", "Completed", completedTasks)}
              </>
            );
          })()}
        </div>
      </WidgetCard>

      {noteTask && (
        <Dialog open={!!noteTask} onOpenChange={() => setNoteTask(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{noteTask.title}</DialogTitle></DialogHeader>
            <p className="text-sm whitespace-pre-wrap text-foreground">{noteTask.description}</p>
          </DialogContent>
        </Dialog>
      )}

      {deleteInfo && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm p-3 rounded-lg bg-card border border-border text-sm shadow-lg flex items-start gap-2">
          <span className="flex-1">{deleteInfo}</span>
          <button onClick={() => setDeleteInfo(null)} className="text-muted-foreground hover:text-foreground shrink-0">✕</button>
        </div>
      )}

      {deleteConfirm && (
         <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
           <AlertDialogContent>
             <AlertDialogHeader>
               <AlertDialogTitle>Delete Task</AlertDialogTitle>
               <AlertDialogDescription>
                 This task is synced with Google Tasks. Would you like to delete it from Google Tasks as well?
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
               <AlertDialogAction variant="outline" onClick={() => deleteTask(deleteConfirm.task, false)}>
                 Delete here only
               </AlertDialogAction>
               <AlertDialogAction onClick={() => deleteTask(deleteConfirm.task, true)}>
                 Delete from Google too
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>
       )}

       <TaskEditDialog 
          task={editingTask}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={loadTasks}
        />

       <TasksOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
       />
       </div>
       );
       }