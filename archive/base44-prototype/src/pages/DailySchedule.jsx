import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import WidgetCard from "../components/WidgetCard";
import DailyToDo from "../components/DailyToDo";
import CondensedChecklist from "../components/CondensedChecklist";
import MenuChoresWidget from "../components/MenuChoresWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { renderToStaticMarkup } from "react-dom/server";
import PrintFormatDailySchedule from "../components/PrintFormatDailySchedule";

import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X, ArrowRight, Clock, ListTodo, Sparkles, Printer, Mail, ChevronDown, ChevronRight, ChevronLeft, EyeOff, Eye, Pin, HelpCircle, BookOpen, CheckSquare } from "lucide-react";
import DailyScheduleOnboarding from "@/components/onboarding/DailyScheduleOnboarding";
import SwipeableListItem from "../components/SwipeableListItem";
import EventEditDialog from "../components/EventEditDialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return m === 0 ? String(h > 12 ? h - 12 : h === 0 ? 12 : h) : `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, "0")}`;
};

const ONBOARDING_STEPS = [
  { icon: <Clock className="w-5 h-5 text-blue-500" />, title: "Visual Schedule", description: "View your entire day hour-by-hour on a beautiful timeline grid. All activities—calendar events, tasks, goals, chores, and education—are color-coded by source for quick identification. Click any time block to see details." },
  { icon: <Plus className="w-5 h-5 text-primary" />, title: "Quick Add Items", description: "Use the + button to create quick tasks on the fly. Add items from the library by choosing a time and duration. Items are automatically added to your schedule for that day with color-coded visual blocks." },
  { icon: <BookOpen className="w-5 h-5 text-purple-500" />, title: "Smart Library", description: "Browse all available tasks, goals, and education items in the sidebar. Pin your favorites for quick access. Sort by Recent, Tasks, or Goals. Overdue items highlight in red—click to add them to your schedule immediately." },
  { icon: <Eye className="w-5 h-5 text-accent" />, title: "Manage Visibility", description: "Hide completed items to keep your view clean. Access the hidden panel to restore items. Adjust your active schedule hours with the clock icon. Toggle completed items on/off to focus on what's pending." },
];

const sourceColors = {
  calendar: "bg-blue-500/25 border-l-blue-500 text-white hover:bg-blue-500/35 transition-colors",
  event: "bg-blue-500/25 border-l-blue-500 text-white hover:bg-blue-500/35 transition-colors",
  task: "bg-emerald-500/25 border-l-emerald-500 text-white hover:bg-emerald-500/35 transition-colors",
  education: "bg-purple-500/25 border-l-purple-500 text-white hover:bg-purple-500/35 transition-colors",
  chore: "bg-amber-500/25 border-l-amber-500 text-white hover:bg-amber-500/35 transition-colors",
  custom: "bg-muted/60 border-l-muted-foreground text-white hover:bg-muted/70 transition-colors",
};

const sourceColorsOverlap = {
  calendar: "bg-blue-500/60 border-l-blue-500 text-white hover:bg-blue-500/70 transition-colors",
  event: "bg-blue-500/60 border-l-blue-500 text-white hover:bg-blue-500/70 transition-colors",
  task: "bg-emerald-500/60 border-l-emerald-500 text-white hover:bg-emerald-500/70 transition-colors",
  education: "bg-purple-500/60 border-l-purple-500 text-white hover:bg-purple-500/70 transition-colors",
  chore: "bg-amber-500/60 border-l-amber-500 text-white hover:bg-amber-500/70 transition-colors",
  custom: "bg-muted/80 border-l-muted-foreground text-white hover:bg-muted/90 transition-colors",
};

const priorityColors = {
  urgent: "bg-red-600/25 border-l-red-600 text-white hover:bg-red-600/35 transition-colors",
  high:   "bg-orange-500/25 border-l-orange-500 text-white hover:bg-orange-500/35 transition-colors",
  medium: "bg-yellow-400/25 border-l-yellow-400 text-white hover:bg-yellow-400/35 transition-colors",
  low:    "bg-green-600/25 border-l-green-600 text-white hover:bg-green-600/35 transition-colors",
};

const priorityColorsOverlap = {
  urgent: "bg-red-600/60 border-l-red-600 text-white hover:bg-red-600/70 transition-colors",
  high:   "bg-orange-500/60 border-l-orange-500 text-white hover:bg-orange-500/70 transition-colors",
  medium: "bg-yellow-400/60 border-l-yellow-400 text-white hover:bg-yellow-400/70 transition-colors",
  low:    "bg-green-600/60 border-l-green-600 text-white hover:bg-green-600/70 transition-colors",
};

const getEntryColor = (item, overlapping = false) => {
  const pColors = overlapping ? priorityColorsOverlap : priorityColors;
  const sColors = overlapping ? sourceColorsOverlap : sourceColors;
  if ((item.source_type === 'task' || item.source_type === 'custom') && item.priority && pColors[item.priority]) {
    return pColors[item.priority];
  }
  return sColors[item.source_type] || sColors.custom;
};

export default function DailySchedule() {
  const navigate = useNavigate();
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Daily Schedule"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={resetOnboarding} title="Guide" className="h-8 w-8"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const [items, setItems] = useState([]);
  const [allScheduleItems, setAllScheduleItems] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [eduPlans, setEduPlans] = useState([]);
  const [chores, setChores] = useState([]);
  const [choreUsers, setChoreUsers] = useState([]);
  const [goals, setGoals] = useState([]);
  const [goalTasks, setGoalTasks] = useState([]);
  const [learners, setLearners] = useState([]);
  const [eduActivities, setEduActivities] = useState([]);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [form, setForm] = useState({ title: "", start_time: "09:00", end_time: "10:00", source_type: "custom", notes: "", priority: "medium" });
  const [scheduleStart, setScheduleStart] = useState(5);
  const [scheduleEnd, setScheduleEnd] = useState(22);
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const [showCompletedItems, setShowCompletedItems] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("schedule_onboarded"); } catch { return false; }
  });
  const [now, setNow] = useState(() => new Date());

  const resetOnboarding = () => setShowOnboarding(true);
  const [customHistory, setCustomHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("schedule_custom_history") || "[]"); } catch { return []; }
  });
  const [pinnedItems, setPinnedItems] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("pinned_library_items") || "[]")); } catch { return new Set(); }
  });
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [themeSettings, setThemeSettings] = useState({ enable_chores: true, enable_education: true });
  const [checklistHideCompleted, setChecklistHideCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem("checklist_hide_completed") || "false"); } catch { return false; }
  });
  const [todoItemsForPrint, setTodoItemsForPrint] = useState([]);
  const [choresDueToday, setChoresDueToday] = useState(0);
  const [eduDueToday, setEduDueToday] = useState(0);
  const [choreStatus, setChoreStatus] = useState({ hasOverdue: false, hasDue: false });
  const [educationStatus, setEducationStatus] = useState({ hasOverdue: false, hasDue: false });
  const checklistRef = useRef(null);
  const dateInputRef = useRef(null);
  const selectedDateRef = useRef(selectedDate);
  const loadAllRef = useRef(null);
  const isLoadingRef = useRef(false);
  const debounceTimerRef = useRef(null);

  const hours = Array.from({ length: scheduleEnd - scheduleStart + 1 }, (_, i) => i + scheduleStart);

  useEffect(() => {
    const savedStart = localStorage.getItem('scheduleStart');
    const savedEnd = localStorage.getItem('scheduleEnd');
    if (savedStart) setScheduleStart(parseInt(savedStart));
    if (savedEnd) setScheduleEnd(parseInt(savedEnd));
    base44.entities.ThemeSettings.list("-updated_date", 1).then(results => {
      if (results.length > 0) setThemeSettings(results[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    selectedDateRef.current = selectedDate;
    loadAll();
  }, [selectedDate]);

  useEffect(() => {
    let debounceTimer = null;
    let pendingDeletes = [];

    // Task/ScheduleItem changes reload immediately (no debounce) for instant UI sync
    const immediateHandler = () => {
      loadAllRef.current && loadAllRef.current();
    };

    const handler = (event) => {
      if (event?.type === 'delete' && event?.id) {
        pendingDeletes.push(event.id);
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        if (pendingDeletes.length > 0) {
          const ids = [...pendingDeletes];
          pendingDeletes = [];
          const orphans = await base44.entities.ScheduleItem.filter({ source_id: ids[0] });
          await Promise.all(orphans.map(o => base44.entities.ScheduleItem.delete(o.id)));
        }
        loadAllRef.current && loadAllRef.current();
      }, 500);
    };
    const unsubscribes = [
      base44.entities.ScheduleItem.subscribe(immediateHandler),
      base44.entities.Task.subscribe(immediateHandler),
      base44.entities.Chore.subscribe(handler),
      base44.entities.Goal.subscribe(handler),
      base44.entities.EducationPlan.subscribe(handler),
      base44.entities.EducationActivity.subscribe(handler),
      base44.entities.GoalTask.subscribe(handler),
    ];
    return () => {
      clearTimeout(debounceTimer);
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('scheduleStart', scheduleStart.toString());
    localStorage.setItem('scheduleEnd', scheduleEnd.toString());
  }, [scheduleStart, scheduleEnd]);

  const autoSyncEventsToSchedule = async (dateStr, scheduleItems) => {
    // Find calendar events for this date that have a start_time and are not yet in the schedule
    const eventItems = await base44.entities.ScheduleItem.filter({ date: dateStr }, "-updated_date", 200);
    const calendarEvents = eventItems.filter(s =>
      (s.source_type === 'calendar' || s.source_type === 'event') &&
      !s.deleted_from_app &&
      s.start_time
    );
    // Check which ones are already shown in the schedule (by id)
    const existingIds = new Set(scheduleItems.map(s => s.id));
    // All calendar events with start_time for this date are already ScheduleItems themselves,
    // so they just need to be included in the display — no separate entry needed.
    // The schedule only needs to include them when filtering.
    return calendarEvents;
  };

  const loadAll = async () => {
    if (isLoadingRef.current) {
      // Schedule a re-run after current load finishes
      setTimeout(() => loadAllRef.current && loadAllRef.current(), 200);
      return;
    }
    isLoadingRef.current = true;
    try {
      // Parallel requests for faster loading
      const dateStr = selectedDateRef.current;
      // Compute previous day string for carry-over detection
      const prevDate = new Date(dateStr + "T00:00:00");
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];

      const [taskList, choreList, goalList, scheduleItems, goalTaskList, learnerList, eduActivities, prevDayItems] = await Promise.all([
        base44.entities.Task.filter({}, "-updated_date", 100),
        base44.entities.Chore.filter({}, "-updated_date", 100),
        base44.entities.Goal.filter({}, "-updated_date", 100),
        base44.entities.ScheduleItem.filter({ date: dateStr }, "-updated_date", 200),
        base44.entities.GoalTask.filter({}, "created_date", 500),
        base44.entities.Learner.filter({}, "-updated_date", 50),
        base44.entities.EducationActivity.filter({ due_date: dateStr }, "-updated_date", 100),
        base44.entities.ScheduleItem.filter({ date: prevDateStr }, "-updated_date", 100),
      ]);

      // Count chores due today (only Chores tab items: not Meal, must be assigned)
      const todayDay = format(new Date(), "EEEE");
      const choreCount = choreList.filter(c => {
        if (c.status === "completed") return false;
        if (c.chore_type === "Meal") return false;
        if (!c.assigned_to) return false;
        if (c.frequency === "daily") return true;
        if (c.frequency === "weekly" && c.day_of_week?.includes(todayDay)) return true;
        if (c.due_date && c.due_date === dateStr) return true;
        if (c.frequency === "monthly" && c.due_date) {
          return parseInt(c.due_date.split('-')[2]) === new Date(dateStr + "T00:00:00").getDate();
        }
        return false;
      }).length;
      setChoresDueToday(choreCount);

      // Track chore status (overdue/due) - always check against TODAY, not selected date
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayDayNum = new Date().getDate();
      const isChoreActiveToday = (c) => {
        if (c.status === "completed") return false;
        if (c.chore_type === "Meal") return false;
        if (!c.assigned_to) return false;
        if (c.frequency === "daily") return true;
        if (c.frequency === "weekly" && c.day_of_week?.includes(todayDay)) return true;
        if (c.due_date && c.due_date === todayStr) return true;
        if (c.frequency === "monthly" && c.due_date) {
          return parseInt(c.due_date.split('-')[2]) === todayDayNum;
        }
        return false;
      };
      const overdueChores = choreList.filter(c => c.chore_type !== "Meal" && c.due_date && c.due_date < todayStr && c.status !== "completed" && c.assigned_to);
      const dueChores = choreList.filter(c => isChoreActiveToday(c));
      setChoreStatus({ hasOverdue: overdueChores.length > 0, hasDue: dueChores.length > 0 });

      // eduActivities is already filtered by due_date === dateStr, exclude completed-today
      const eduCount = eduActivities.filter(a => !a.completed && a.last_completed_date !== dateStr).length;
      setEduDueToday(eduCount);

      // Track education status (overdue/due) - always check against TODAY, not selected date
      const allEduActivities = await base44.entities.EducationActivity.list("-updated_date", 500);
      const overdueActivities = allEduActivities.filter(a => a.due_date && a.due_date < todayStr && !a.completed);
      const dueActivities = allEduActivities.filter(a => a.due_date === todayStr && !a.completed);
      setEducationStatus({ hasOverdue: overdueActivities.length > 0, hasDue: dueActivities.length > 0 });

      // Filter and set state
      const taskMap = {};
      taskList.forEach(t => { taskMap[t.id] = t; });

      // Find carry-over items from previous day that span into current day
      const carryOverItems = prevDayItems
        .filter(s => {
          if (s.hidden_from_grid || s.deleted_from_app || !s.start_time || !s.end_time) return false;
          const [sh, sm] = s.start_time.split(":").map(Number);
          const [eh, em] = s.end_time.split(":").map(Number);
          const startMins = sh * 60 + sm;
          const endMins = eh * 60 + em;
          // Spans midnight: end_time <= start_time means it overflows into next day
          return endMins <= startMins;
        })
        .map(s => {
          const [, em] = s.end_time.split(":").map(Number);
          const [eh] = s.end_time.split(":").map(Number);
          return {
            ...s,
            id: `carryover-${s.id}`,
            date: dateStr,
            start_time: "00:00",
            end_time: s.end_time, // original end time (e.g. 07:00)
            _isCarryOver: true,
            _carryOverFrom: prevDateStr,
          };
        });

      const filteredSchedule = [
        ...scheduleItems
          .filter(s => {
            if (s.date !== selectedDateRef.current) return false;
            if (s.hidden_from_grid) return false;
            if (s.source_type === 'calendar' || s.source_type === 'event') {
              return !s.deleted_from_app && !!s.start_time;
            }
            return true;
          })
          .map(s => {
            if ((s.source_type === 'task' || s.source_type === 'custom') && s.source_id && taskMap[s.source_id]) {
              return { ...s, priority: taskMap[s.source_id].priority };
            }
            return s;
          }),
        ...carryOverItems,
      ].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

      setAllScheduleItems(scheduleItems);
      setItems(filteredSchedule);
      setTasks(taskList);
      setChores(choreList);
      setGoals(goalList);
      setGoalTasks(goalTaskList);
      setLearners(learnerList);
      setEduActivities(eduActivities);
    } finally {
      isLoadingRef.current = false;
    }
  };

  loadAllRef.current = loadAll;

  const debouncedLoadAll = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(loadAll, 300);
  }, []);

  const [scheduleRemoveInfo, setScheduleRemoveInfo] = useState(null);

  const hiddenItems = allScheduleItems.filter(s => s.hidden_from_grid);

  const removeFromSchedule = async (item) => {
    await base44.entities.ScheduleItem.update(item.id, { hidden_from_grid: true });
    debouncedLoadAll();
  };

  const moveItemToNow = async (item) => {
    const n = new Date();
    const startMins = n.getHours() * 60 + n.getMinutes();
    let durMins = 60;
    if (item.start_time && item.end_time) {
      const [sh, sm] = item.start_time.split(":").map(Number);
      const [eh, em] = item.end_time.split(":").map(Number);
      const d = (eh * 60 + em) - (sh * 60 + sm);
      if (d > 0) durMins = d;
    }
    const endMins = Math.min(startMins + durMins, 24 * 60 - 1);
    const fmt = (m) => `${Math.floor(m / 60).toString().padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
    await base44.entities.ScheduleItem.update(item.id, { start_time: fmt(startMins), end_time: fmt(endMins) });
    setSelectedEntry(null);
    loadAll();
  };

  const openEditDialog = (item) => {
    setEditingEvent(item);
    setEditDialogOpen(true);
    setSelectedEntry(null);
  };

  const restoreHiddenItem = async (item) => {
    await base44.entities.ScheduleItem.update(item.id, { hidden_from_grid: false });
    debouncedLoadAll();
  };

  const addCustomItem = async () => {
    if (!form.title) return;
    await base44.entities.Task.create({
      title: form.title,
      status: "pending",
      category: "Custom",
    });
    const historyItem = { title: form.title, duration: 60 };
    const updated = [historyItem, ...customHistory.filter(h => h.title !== form.title)].slice(0, 10);
    setCustomHistory(updated);
    localStorage.setItem("schedule_custom_history", JSON.stringify(updated));
    setForm({ title: "", start_time: "09:00", end_time: "10:00", source_type: "custom", notes: "", priority: "medium" });
    debouncedLoadAll();
  };

  const addFromLibrary = async (item, type, time, durationMins, priority = "medium") => {
    const [h, m] = time.split(":").map(Number);
    const totalMins = h * 60 + m + durationMins;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    const end_time = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}`;

    let sourceId = item.id;
    // For custom items (history or defaults), create a Task record
    if (type === "custom") {
      const task = await base44.entities.Task.create({
        title: item.title,
        status: "pending",
        priority: priority,
        category: "Custom",
      });
      sourceId = task.id;
    }

    await base44.entities.ScheduleItem.create({
      title: item.title,
      date: selectedDate,
      start_time: time,
      end_time,
      source_type: type,
      source_id: sourceId,
    });
    
    // If it's a task, update it with the due_date and schedule_time
    if (type === "task" && sourceId) {
      await base44.entities.Task.update(sourceId, { due_date: selectedDate, schedule_time: time });
    }
    loadAll();
  };

  const HOUR_PX = 60;

  const getItemStyle = (item) => {
    if (!item.start_time) return null;
    const [sh, sm] = item.start_time.split(":").map(Number);
    const [eh, em] = item.end_time ? item.end_time.split(":").map(Number) : [sh + 1, sm];
    const startMins = sh * 60 + sm;
    // If end_time <= start_time, the event runs past midnight into next day
    let endMins = eh * 60 + em;
    const spansNextDay = item.end_time && endMins <= startMins;
    if (spansNextDay) endMins = 24 * 60; // clip to end of day
    const durationMins = Math.max(endMins - startMins, 15);
    const top = ((sh - scheduleStart) * 60 + sm) * (HOUR_PX / 60);
    const height = durationMins * (HOUR_PX / 60);
    return { top, height, startMins, endMins, spansNextDay };
  };

  const getPositionedItems = useMemo(() => {
    return () => {
      const sorted = items
        .filter(item => item.start_time && (showCompletedItems || !item.completed))
        .map(item => ({ item, style: getItemStyle(item), col: 0, totalCols: 1, isOnTop: false }))
        .sort((a, b) => a.style.startMins - b.style.startMins);

      // Assign columns: greedy interval packing
      const colEnds = []; // tracks end time of last item in each column
      sorted.forEach(p => {
        let col = colEnds.findIndex(end => p.style.startMins >= end);
        if (col === -1) col = colEnds.length;
        p.col = col;
        colEnds[col] = p.style.endMins;
      });

      // Now determine totalCols for each item (max col count among overlapping peers)
      sorted.forEach(a => {
        const peers = sorted.filter(b =>
          a.style.startMins < b.style.endMins && a.style.endMins > b.style.startMins
        );
        const maxCol = Math.max(...peers.map(p => p.col));
        const totalCols = maxCol + 1;
        peers.forEach(p => { p.totalCols = Math.max(p.totalCols, totalCols); });
      });

      return sorted;
    };
  }, [items, scheduleStart, scheduleEnd, showCompletedItems]);
  
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const isDueToday = (task) => {
    if (!task.due_date) return false;
    return task.due_date === selectedDate;
  };

  const isOverdue = (task) => {
    if (task.status === "completed") return false;
    if (!task.due_date && !task.schedule_time && !task.due_time) return false;
    // Overdue if due_date is in the past
    if (task.due_date && task.due_date < selectedDate) return true;
    // Overdue if due today and time has passed
    if (task.due_date === selectedDate && (task.schedule_time || task.due_time)) {
      const now = new Date();
      const timeStr = task.schedule_time || task.due_time;
      const [h, m] = timeStr.split(":").map(Number);
      const taskTime = h * 60 + m;
      const currentTime = now.getHours() * 60 + now.getMinutes();
      return currentTime > taskTime;
    }
    return false;
  };

  const isDueTodayOrOverdue = (task) => {
    if (!task.due_date) return false;
    return task.due_date <= selectedDate;
  };

  const togglePin = (itemId) => {
    const updated = new Set(pinnedItems);
    if (updated.has(itemId)) {
      updated.delete(itemId);
    } else {
      updated.add(itemId);
    }
    setPinnedItems(updated);
    localStorage.setItem("pinned_library_items", JSON.stringify(Array.from(updated)));
  };

  const todayStr = format(now, "yyyy-MM-dd");
  const isToday = selectedDate === todayStr;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const nowTop = (currentMins / 60 - scheduleStart) * HOUR_PX;
  const showNowLine = isToday && nowTop >= 0 && nowTop <= (scheduleEnd - scheduleStart + 1) * HOUR_PX;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-2">
          <WidgetCard title={
            <span className="flex items-center gap-1">
              <button onClick={() => {
                const d = new Date(selectedDate + "T00:00:00");
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded" title="Previous day">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setDatePickerOpen(true)} className="hover:text-foreground transition-colors cursor-pointer px-1" title="Pick a date">
                {format(new Date(selectedDate + "T00:00:00"), "EEEE, MMM d")}
              </button>
              <button onClick={() => {
                const d = new Date(selectedDate + "T00:00:00");
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded" title="Next day">
                <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={() => setHoursDialogOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors ml-1" title="Set schedule hours">
                <Clock className="w-3.5 h-3.5" />
              </button>
            </span>
          } id="daily-schedule" headerRight={(
            <div className="flex items-center gap-1 no-print">
              {hiddenItems.length > 0 && (
                <button
                  onClick={() => setShowHiddenPanel(p => !p)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded-md hover:bg-muted/50"
                  title={`${hiddenItems.length} hidden item${hiddenItems.length > 1 ? 's' : ''}`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="font-medium">{hiddenItems.length}</span>
                </button>
              )}
              <button
                onClick={() => setShowCompletedItems(!showCompletedItems)}
                className="h-8 w-8 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                title={showCompletedItems ? "Hide completed items" : "Show completed items"}
              >
                <Eye className={cn("w-4 h-4", !showCompletedItems && "opacity-50")} />
              </button>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={() => {
                const printSchedule = (mode) => {
                  const html = renderToStaticMarkup(
                    <PrintFormatDailySchedule scheduleItems={items} todoItems={todoItemsForPrint} date={selectedDate} mode={mode} />
                  );
                  const win = window.open('', '_blank');
                  win.document.write(`<html><head><title>Daily Schedule</title></head><body>${html}</body></html>`);
                  win.document.close();
                  win.print();
                };
                const choice = window.confirm("Print Schedule + To Do together?\n\nOK = Both together\nCancel = Schedule only");
                printSchedule(choice ? "both" : "schedule");
               }} title="Print schedule">
                 <Printer className="w-4 h-4" />
               </Button>
               <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={async () => {
                const choice = window.confirm("Email Schedule + To Do together?\n\nOK = Both together\nCancel = Schedule only");
                const html = renderToStaticMarkup(
                  <PrintFormatDailySchedule scheduleItems={items} todoItems={todoItemsForPrint} date={selectedDate} mode={choice ? "both" : "schedule"} />
                );
                const user = await base44.auth.me();
                await base44.integrations.Core.SendEmail({
                  to: user.email,
                  subject: 'Daily Schedule',
                  body: html,
                });
                alert('Sent to your email!');
              }} title="Email schedule">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          )}>


            {showHiddenPanel && hiddenItems.length > 0 && (
              <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <div className="h-8 w-8 rounded-full bg-muted/50 text-muted-foreground flex items-center justify-center">
                      <EyeOff className="w-4 h-4" />
                    </div>
                    Hidden items
                  </span>

                </div>
                <div className="space-y-1">
                  {hiddenItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-xs py-1 px-1 rounded hover:bg-muted/50">
                      <span className="truncate flex-1">{item.title}</span>
                      <span className="text-muted-foreground shrink-0">{fmtTime(item.start_time)}</span>
                      <button
                        onClick={() => restoreHiddenItem(item)}
                        className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors shrink-0"
                        title="Restore to grid"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hoursDialogOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setHoursDialogOpen(false)}>
                <div className="bg-background border border-border rounded-lg p-4 shadow-lg w-64" onClick={e => e.stopPropagation()}>
                  <p className="text-sm font-semibold mb-3">Active Schedule Hours</p>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">Start</label>
                      <select value={scheduleStart} onChange={e => setScheduleStart(Number(e.target.value))}
                        className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1">
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">End</label>
                      <select value={scheduleEnd} onChange={e => setScheduleEnd(Number(e.target.value))}
                        className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1">
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => setHoursDialogOpen(false)}
                    className="w-full h-8 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    Done
                  </button>
                </div>
              </div>
            )}
            {datePickerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDatePickerOpen(false)}>
                <div className="bg-background border border-border rounded-lg p-4 shadow-lg" onClick={e => e.stopPropagation()}>
                  <p className="text-sm font-semibold mb-3">Select Date</p>
                  <CalendarComponent
                    mode="single"
                    selected={new Date(selectedDate + "T00:00:00")}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date.toISOString().split('T')[0]);
                        setDatePickerOpen(false);
                      }
                    }}
                    className="rounded-md border"
                  />
                </div>
              </div>
            )}
            <div className="relative overflow-hidden">
              {hours.map((hour) => {
                const t = `${hour > 12 ? hour - 12 : hour === 0 ? 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`;
                const isPastHour = isToday && hour < currentMins / 60;
                return (
                  <div key={hour} className={cn("flex gap-3 transition-opacity", isPastHour && "opacity-30")} style={{ height: `${HOUR_PX}px` }}>
                    <span className="text-xs text-muted-foreground w-16 shrink-0 pt-1 text-right">{t}</span>
                    <div className={cn("flex-1 border-t", isPastHour ? "border-border/20" : "border-border/50")} />
                  </div>
                );
              })}
              <div className="absolute top-0 left-0 right-0" style={{ marginLeft: "76px" }} onClick={() => setSelectedEntry(null)}>
                {getPositionedItems().map(({ item, style, col, totalCols }) => {
                  const color = getEntryColor(item, false);
                  const widthPct = 100 / totalCols;
                  const leftPct = col * widthPct;
                  const GAP = 2;
                  const isOpen = selectedEntry === item.id;

                  const totalGridPx = (scheduleEnd - scheduleStart + 1) * HOUR_PX;
                  const rawTop = style.top;
                  const rawBottom = style.top + Math.max(style.height, 20);
                  const clampedTop = Math.max(rawTop, 0);
                  const clampedBottom = Math.min(rawBottom, totalGridPx);
                  const clampedHeight = Math.max(clampedBottom - clampedTop, 20);
                  const clipsTop = rawTop < 0;
                  const clipsBottom = rawBottom > totalGridPx;

                  const spansNextDay = style.spansNextDay;
                  const isCarryOver = item._isCarryOver;
                  const isPastItem = isToday && style.endMins <= currentMins && !item.completed;

                  return (
                  <div key={item.id}
                    className={cn("absolute text-xs rounded-md border-l-2 group/block cursor-pointer overflow-hidden", color, isCarryOver && "border-t-2 border-t-yellow-400")}
                    style={{
                      top: clampedTop,
                      height: clampedHeight,
                      left: `calc(${leftPct}% + ${col > 0 ? GAP : 0}px)`,
                      width: `calc(${widthPct}% - ${col > 0 ? GAP : 0}px - 2px)`,
                      zIndex: isOpen ? 100 : 10,
                      opacity: item.completed ? 0.5 : (isPastItem ? 0.6 : 1),
                      filter: item.completed ? 'grayscale(1)' : 'none',
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedEntry(isOpen ? null : item.id); }}
                    onDoubleClick={(e) => { e.stopPropagation(); if (item.notes) setSelectedEntry(item.id); }}
                  >
                      {/* Label pinned to visible edge when clipped */}
                      {clipsTop ? (
                        <div className="absolute top-0 left-0 right-0 px-2 py-1 flex items-start justify-between">
                          <span className={cn("font-medium truncate flex-1", item.completed && "line-through opacity-60")}>
                            {item.title}
                          </span>
                          <span className="opacity-60 text-xs shrink-0 ml-1">{fmtTime(item.start_time)}{item.end_time ? `–${fmtTime(item.end_time)}` : ""}</span>
                        </div>
                      ) : (
                        <div className="px-2 py-1 w-full h-full overflow-hidden">
                          <span className={cn("font-medium block truncate", item.completed && "line-through opacity-60")}>
                            {isCarryOver && <span className="opacity-70 mr-1">↑</span>}{item.title}
                          </span>
                          {(clampedHeight > 25 || clipsBottom || spansNextDay) && (
                            <span className="opacity-60 text-xs">
                              {isCarryOver
                                ? `ends ${fmtTime(item.end_time)}`
                                : `${fmtTime(item.start_time)}${item.end_time ? ` – ${fmtTime(item.end_time)}` : ""}${spansNextDay ? " → next day" : ""}`
                              }
                            </span>
                          )}
                        </div>
                      )}
                      {/* Click detail popup */}
                      {isOpen && (
                        <div className={cn("absolute z-50 left-0 w-56 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl px-3 py-2 text-xs", clipsBottom ? "bottom-full mb-1" : "top-full mt-1")}>
                          <p className="font-semibold text-sm mb-1 whitespace-normal break-words">{item.title}</p>
                          {isCarryOver ? (
                            <p className="text-yellow-400 font-medium">↑ Continued from previous day — ends {fmtTime(item.end_time)}</p>
                          ) : (
                            <p className="text-muted-foreground">
                              {fmtTime(item.start_time)}{item.end_time ? ` – ${fmtTime(item.end_time)}` : ""}
                              {spansNextDay && <span className="ml-1 text-yellow-400 font-medium">→ next day</span>}
                            </p>
                          )}
                          <p className="capitalize text-muted-foreground">{item.source_type}</p>
                          {item.notes && <p className="mt-2 text-foreground/90 whitespace-normal break-words border-t border-border/50 pt-2">{item.notes}</p>}
                          {item.completed && <p className="mt-1 text-green-500 font-medium">✓ Completed</p>}
                          {isPastItem && (
                            <div className="mt-2 flex gap-1">
                              <button onClick={(e) => { e.stopPropagation(); moveItemToNow(item); }} className="flex-1 h-7 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">↻ Move to now</button>
                              <button onClick={(e) => { e.stopPropagation(); openEditDialog(item); }} className="h-7 px-2 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors">Edit</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {showNowLine && (
                <div className="absolute left-0 right-0 z-40 pointer-events-none flex items-center" style={{ top: nowTop, marginLeft: "76px" }}>
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 shrink-0 shadow" />
                  <div className="flex-1 h-px bg-red-500/70" />
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        <div className="space-y-5">
           <DailyToDo date={new Date(selectedDate + "T00:00:00")} onItemsLoaded={setTodoItemsForPrint} />
           <WidgetCard 
             title="Daily Checklist" 
             id="schedule-checklist"
             headerRight={
               <button
                 onClick={() => {
                   const newHideState = !checklistHideCompleted;
                   setChecklistHideCompleted(newHideState);
                   if (checklistRef.current) {
                     checklistRef.current.setHideCompleted(newHideState);
                   }
                   localStorage.setItem("checklist_hide_completed", JSON.stringify(newHideState));
                 }}
                 className="h-9 px-3 rounded-md bg-transparent hover:bg-accent hover:text-accent-foreground flex items-center justify-center text-muted-foreground hover:text-accent-foreground transition-colors"
                 title={checklistHideCompleted ? "Show completed items" : "Hide completed items"}
               >
                 {checklistHideCompleted ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
               </button>
             }
           >
             <CondensedChecklist ref={checklistRef} date={new Date(selectedDate + "T00:00:00")} />
             </WidgetCard>
             <MenuChoresWidget chores={chores} />
             </div>

        <div>
          <WidgetCard title={
            <button onClick={() => setLibraryCollapsed(!libraryCollapsed)} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              {libraryCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Item Library
            </button>
          } id="schedule-library" headerRight={
            <div className="relative">
              <button
                onClick={() => { setShowQuickTask(p => !p); setQuickTaskTitle(""); }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                title="Quick Task"
              >
                <Plus className="w-4 h-4" />
              </button>
              {showQuickTask && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1.5 w-52">
                  <Input
                    autoFocus
                    placeholder="Task title..."
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    onKeyDown={async (e) => {
                       if (e.key === "Enter" && quickTaskTitle.trim()) {
                         await base44.entities.Task.create({
                           title: quickTaskTitle.trim(),
                           status: "pending",
                           category: "Quick Task",
                         });
                         const historyItem = { title: quickTaskTitle.trim(), duration: 60 };
                         const updated = [historyItem, ...customHistory.filter(h => h.title !== quickTaskTitle.trim())].slice(0, 10);
                         setCustomHistory(updated);
                         localStorage.setItem("schedule_custom_history", JSON.stringify(updated));
                         setQuickTaskTitle("");
                         setShowQuickTask(false);
                       }
                       if (e.key === "Escape") setShowQuickTask(false);
                     }}
                    className="h-7 text-xs flex-1"
                  />
                  <Button size="sm" className="h-7 px-2 text-xs" onClick={async () => {
                    if (!quickTaskTitle.trim()) return;
                    await base44.entities.Task.create({
                      title: quickTaskTitle.trim(),
                      status: "pending",
                      category: "Quick Task",
                    });
                    const historyItem = { title: quickTaskTitle.trim(), duration: 60 };
                    const updated = [historyItem, ...customHistory.filter(h => h.title !== quickTaskTitle.trim())].slice(0, 10);
                    setCustomHistory(updated);
                    localStorage.setItem("schedule_custom_history", JSON.stringify(updated));
                    setQuickTaskTitle("");
                    setShowQuickTask(false);
                  }}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          }>
            {!libraryCollapsed && (
            <Tabs defaultValue="recent">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="recent" className="flex-1 text-xs"><Clock className="w-3.5 h-3.5 mr-1" />Recent</TabsTrigger>
                <TabsTrigger value="tasks" className="flex-1 text-xs"><ListTodo className="w-3.5 h-3.5 mr-1" />Tasks</TabsTrigger>
                <TabsTrigger value="goals" className="flex-1 text-xs"><Sparkles className="w-3.5 h-3.5 mr-1" />Goals</TabsTrigger>
              </TabsList>
              <TabsContent value="recent">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                   {/* Quick links for Chores and Education */}
                   <div className="flex gap-1.5 pb-2 border-b border-border">
                     {themeSettings.enable_chores !== false && (
                      <Button
                        onClick={() => navigate("/chores?filter=due")}
                        variant="outline"
                        size="sm"
                        className={cn("flex-1 text-xs h-8", 
                          choreStatus.hasOverdue && choreStatus.hasDue ? "bg-purple-600/60 hover:bg-purple-600/80 text-white border-0" :
                          choreStatus.hasOverdue ? "bg-red-600/60 hover:bg-red-600/80 text-white border-0" :
                          choreStatus.hasDue ? "bg-blue-600/60 hover:bg-blue-600/80 text-white border-0" :
                          ""
                        )}
                      >
                        <CheckSquare className="w-3.5 h-3.5 mr-1" />
                        Chores {choresDueToday > 0 && `(${choresDueToday})`}
                      </Button>
                     )}
                     {themeSettings.enable_education !== false && (
                      <Button
                        onClick={() => navigate("/education?filter=due")}
                        variant="outline"
                        size="sm"
                        className={cn("flex-1 text-xs h-8", 
                          educationStatus.hasOverdue && educationStatus.hasDue ? "bg-purple-600/60 hover:bg-purple-600/80 text-white border-0" :
                          educationStatus.hasOverdue ? "bg-red-600/60 hover:bg-red-600/80 text-white border-0" :
                          educationStatus.hasDue ? "bg-blue-600/60 hover:bg-blue-600/80 text-white border-0" :
                          ""
                        )}
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1" />
                        Edu {eduDueToday > 0 && `(${eduDueToday})`}
                      </Button>
                     )}
                   </div>

                   {/* Pinned defaults */}
                   {themeSettings.enable_chores !== false && pinnedItems.has("default-chores") && <LibraryItem key="default-chores" item={{ id: "default-chores", title: "Chores" }} type="custom" onAdd={addFromLibrary} isPinned onPin={() => togglePin("default-chores")} />}
                   {themeSettings.enable_education !== false && pinnedItems.has("default-edu") && <LibraryItem key="default-edu" item={{ id: "default-edu", title: "Edu" }} type="custom" onAdd={addFromLibrary} isPinned onPin={() => togglePin("default-edu")} />}

                  {/* Pinned custom items */}
                  {customHistory.map((item, idx) => {
                    const itemId = `custom-${idx}`;
                    const deleteItem = () => {
                      const updated = customHistory.filter(h => h.title !== item.title);
                      setCustomHistory(updated);
                      localStorage.setItem("schedule_custom_history", JSON.stringify(updated));
                    };
                    return pinnedItems.has(itemId) ? (
                      <LibraryItem key={itemId} item={item} type="custom" onAdd={addFromLibrary} isPinned onPin={() => togglePin(itemId)} onDelete={deleteItem} />
                    ) : null;
                  })}

                  {/* Unpinned defaults */}
                  {themeSettings.enable_chores !== false && !pinnedItems.has("default-chores") && <LibraryItem key="default-chores" item={{ id: "default-chores", title: "Chores" }} type="custom" onAdd={addFromLibrary} onPin={() => togglePin("default-chores")} />}
                  {themeSettings.enable_education !== false && !pinnedItems.has("default-edu") && <LibraryItem key="default-edu" item={{ id: "default-edu", title: "Edu" }} type="custom" onAdd={addFromLibrary} onPin={() => togglePin("default-edu")} />}

                  {/* Unpinned custom items */}
                  {customHistory.map((item, idx) => {
                    const itemId = `custom-${idx}`;
                    const deleteItem = () => {
                      const updated = customHistory.filter(h => h.title !== item.title);
                      setCustomHistory(updated);
                      localStorage.setItem("schedule_custom_history", JSON.stringify(updated));
                    };
                    return !pinnedItems.has(itemId) ? (
                      <LibraryItem key={itemId} item={item} type="custom" onAdd={addFromLibrary} onPin={() => togglePin(itemId)} onDelete={deleteItem} />
                    ) : null;
                  })}
                </div>
              </TabsContent>
              <TabsContent value="tasks">
                <div className="space-y-1 max-h-96 overflow-y-auto">
                   {(() => {
                     const scheduledIds = new Set(allScheduleItems.filter(s => s.source_type === 'task').map(s => s.source_id));
                     const available = tasks.filter(t => 
                       !scheduledIds.has(t.id) && 
                       t.status !== 'completed' && 
                       (!t.due_date || t.due_date <= selectedDate)
                     );

                     if (available.length === 0) {
                       return <p className="text-xs text-muted-foreground text-center py-4">No unscheduled or overdue tasks</p>;
                     }

                     // Group by label/category
                     const grouped = {};
                     available.forEach(task => {
                       const label = task.category || "(No Label)";
                       if (!grouped[label]) grouped[label] = [];
                       grouped[label].push(task);
                     });

                     return (
                       <>
                         {Object.entries(grouped).sort(([a], [b]) => 
                           a === "(No Label)" ? 1 : b === "(No Label)" ? -1 : a.localeCompare(b)
                         ).map(([label, labelTasks]) => {
                           const overdueCount = labelTasks.filter(t => isOverdue(t)).length;
                           const dueTodayCount = labelTasks.filter(t => isDueToday(t) && !isOverdue(t)).length;
                           const totalDueCount = overdueCount + dueTodayCount;
                           const badgeColor = overdueCount > 0 ? "bg-red-600 text-white" : dueTodayCount > 0 ? "bg-blue-600 text-white" : "";
                           return (
                           <div key={label}>
                             <button 
                               onClick={() => toggleGroup(`task-${label}`)} 
                               className="w-full text-left p-1.5 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-2"
                             >
                               {totalDueCount > 0 && (
                                 <span className={`h-6 px-1.5 rounded-full ${badgeColor} text-xs font-medium flex items-center justify-center shrink-0`}>
                                   {totalDueCount}
                                 </span>
                               )}
                               <p className="text-xs font-semibold text-muted-foreground uppercase flex-1">{label}</p>
                             </button>
                             {expandedGroups[`task-${label}`] && (
                               <div className="space-y-1 ml-2">
                                 {labelTasks.map((task) => (
                                   <LibraryItem 
                                     key={task.id} 
                                     item={task} 
                                     type="task" 
                                     onAdd={addFromLibrary} 
                                     isDueToday={isDueToday(task)}
                                     isOverdue={isOverdue(task)}
                                     isDueTodayOrOverdue={isDueTodayOrOverdue(task)}
                                   />
                                 ))}
                               </div>
                             )}
                           </div>
                         );
                         })}
                       </>
                     );
                   })()}
                </div>
              </TabsContent>

              <TabsContent value="goals">
                 <div className="space-y-1 max-h-96 overflow-y-auto">
                   {goals.length === 0 ? (
                     <p className="text-xs text-muted-foreground text-center py-4">No active goals</p>
                   ) : (() => {
                     const scheduledGoalTaskIds = new Set(allScheduleItems.filter(s => s.source_type === 'goal').map(s => s.source_id));
                     const availableGoals = goals.filter(g => !g.archived && g.status !== 'completed');

                     // Build per-goal data
                     const goalsData = [];
                     availableGoals.forEach(goal => {
                       const incompleteTasks = goalTasks
                        .filter(gt => gt.goal_id === goal.id && !gt.completed)
                        .sort((a, b) => (a.created_date || "").localeCompare(b.created_date || ""));
                       const unscheduled = incompleteTasks.filter(gt => !scheduledGoalTaskIds.has(gt.id));
                       if (unscheduled.length > 0 || incompleteTasks.length === 0) {
                         goalsData.push({ goal, tasks: unscheduled.slice(0, 1) });
                       }
                     });

                     if (goalsData.length === 0) return (
                       <p className="text-xs text-muted-foreground text-center py-4">No available goals</p>
                     );

                     // Group by category
                     const byCategory = {};
                     goalsData.forEach(({ goal, tasks }) => {
                       const cat = goal.category || "(No Category)";
                       if (!byCategory[cat]) byCategory[cat] = { color: goal.category_color, items: [] };
                       byCategory[cat].items.push({ goal, tasks });
                     });
                     const catKeys = Object.keys(byCategory).sort((a, b) => a === "(No Category)" ? 1 : b === "(No Category)" ? -1 : a.localeCompare(b));

                     return catKeys.map(cat => {
                       const { color, items } = byCategory[cat];
                       const catKey = `goalcat-${cat}`;
                       const isExpanded = !!expandedGroups[catKey];
                       return (
                         <div key={cat}>
                           <button
                             onClick={() => toggleGroup(catKey)}
                             className="w-full text-left p-1.5 rounded-md hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                           >
                             {isExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
                             <span className="text-xs font-semibold uppercase tracking-wide flex-1" style={{ color: color || 'hsl(var(--muted-foreground))' }}>{cat}</span>
                             <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
                           </button>
                           {isExpanded && (
                             <div className="space-y-0.5 ml-3">
                               {items.map(({ goal, tasks }) => (
                                 <div key={goal.id}>
                                   <button onClick={() => toggleGroup(`goal-${goal.id}`)} className="w-full text-left px-1.5 py-1 rounded hover:bg-muted/40 transition-colors flex items-center gap-1">
                                     {expandedGroups[`goal-${goal.id}`] ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
                                     <span className="text-xs text-foreground/80 truncate flex-1">{goal.title}</span>
                                   </button>
                                   {expandedGroups[`goal-${goal.id}`] && (
                                     <div className="space-y-1 ml-4">
                                       {tasks.length > 0 ? tasks.map((task) => (
                                         <LibraryItem key={task.id} item={task} type="goal" onAdd={addFromLibrary} isDueToday={goal.target_date === selectedDate} isOverdue={goal.target_date && goal.target_date < selectedDate} />
                                       )) : (
                                         <LibraryItem key={goal.id} item={goal} type="goal" onAdd={addFromLibrary} isDueToday={goal.target_date === selectedDate} isOverdue={goal.target_date && goal.target_date < selectedDate} />
                                       )}
                                     </div>
                                   )}
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>
                       );
                     });
                   })()}
                 </div>
               </TabsContent>


            </Tabs>
            )}
          </WidgetCard>
        </div>
      </div>


      {scheduleRemoveInfo && (
         <div className="fixed bottom-4 right-4 z-50 max-w-sm p-3 rounded-lg bg-card border border-border text-sm shadow-lg flex items-start gap-2">
           <span className="flex-1">{scheduleRemoveInfo.message}</span>
           <button onClick={() => setScheduleRemoveInfo(null)} className="text-muted-foreground hover:text-foreground shrink-0">✕</button>
         </div>
       )}

       <EventEditDialog
          event={editingEvent}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={loadAll}
        />

       <DailyScheduleOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onDontRemind={() => { setShowOnboarding(false); localStorage.setItem("schedule_onboarded", "1"); }}
       />
       </div>
       );
       }

const TIME_SLOTS = Array.from({ length: 24 * 4 }, (_, i) => {
  const totalMins = i * 15;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  return { label, value };
});

const DURATIONS = [
  { label: "15 min", value: 15 }, { label: "30 min", value: 30 }, { label: "45 min", value: 45 },
  { label: "1 hr", value: 60 }, { label: "1.5 hr", value: 90 }, { label: "2 hr", value: 120 },
  { label: "2.5 hr", value: 150 }, { label: "3 hr", value: 180 }, { label: "4 hr", value: 240 },
  { label: "5 hr", value: 300 }, { label: "6 hr", value: 360 }, { label: "7 hr", value: 420 },
  { label: "8 hr", value: 480 }, { label: "9 hr", value: 540 }, { label: "10 hr", value: 600 },
  { label: "11 hr", value: 660 }, { label: "12 hr", value: 720 }, { label: "14 hr", value: 840 },
  { label: "16 hr", value: 960 }, { label: "18 hr", value: 1080 }, { label: "20 hr", value: 1200 },
  { label: "22 hr", value: 1320 }, { label: "24 hr", value: 1440 },
];

function LibraryItem({ item, type, onAdd, isDueToday, isOverdue, isDueTodayOrOverdue, isPinned, onPin, onDelete }) {
  const [timeHour, setTimeHour] = useState("9");
  const [timeMin, setTimeMin] = useState("00");
  const [ampm, setAmpm] = useState("AM");
  const [durValue, setDurValue] = useState("1");
  const [durUnit, setDurUnit] = useState("hr");
  const [priority, setPriority] = useState("medium");
  const [showTime, setShowTime] = useState(false);

  const getTime = () => {
    let h = parseInt(timeHour) || 0;
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${timeMin.padStart(2, "0")}`;
  };

  const getDuration = () => {
    const v = parseFloat(durValue) || 0;
    return durUnit === "hr" ? Math.round(v * 60) : Math.round(v);
  };

  const inputCls = "h-7 text-xs rounded-md border border-input bg-background px-1.5 focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="p-2 rounded-md hover:bg-muted/60 transition-colors group relative">
      <div className="flex items-center gap-2">
        <span className="text-sm flex-1 truncate">{item.title}</span>
        {!showTime ? (
          <div className={cn("flex items-center gap-1 transition-opacity", (isOverdue || isDueToday || isDueTodayOrOverdue || isPinned) ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
            {onPin && (
              <button
                onClick={onPin}
                className={cn("h-5 w-5 rounded-full flex items-center justify-center transition-all", isPinned ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/40")}
                title={isPinned ? "Unpin" : "Pin to top"}
              >
                <Pin className="w-2.5 h-2.5" fill={isPinned ? "currentColor" : "none"} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="h-5 w-5 rounded-full flex items-center justify-center bg-muted-foreground/20 text-muted-foreground hover:bg-destructive/80 hover:text-white transition-all"
                title="Remove from recent"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
            {isOverdue ? (
              <button
                onClick={() => setShowTime(true)}
                className="h-7 w-7 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                title="Overdue - Add to schedule"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            ) : isDueToday || isDueTodayOrOverdue ? (
              <button
                onClick={() => setShowTime(true)}
                className="h-7 w-7 rounded-full bg-blue-600/80 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
                title="Due today - Add to schedule"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowTime(true)}>
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 w-full mt-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-10">Time:</span>
              <input value={timeHour} onChange={e => setTimeHour(e.target.value)} placeholder="9"
                className={`${inputCls} w-8 text-center`} maxLength={2} />
              <span className="text-xs">:</span>
              <input value={timeMin} onChange={e => setTimeMin(e.target.value)} placeholder="00"
                className={`${inputCls} w-8 text-center`} maxLength={2} />
              <select value={ampm} onChange={e => setAmpm(e.target.value)} className={`${inputCls} w-14`}>
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground w-10">Dur:</span>
              <input value={durValue} onChange={e => setDurValue(e.target.value)} placeholder="1"
                className={`${inputCls} w-12 text-center`} />
              <select value={durUnit} onChange={e => setDurUnit(e.target.value)} className={`${inputCls} w-14`}>
                <option value="min">min</option>
                <option value="hr">hr</option>
              </select>
            </div>
            {type === "custom" && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-10">Pri:</span>
                <select value={priority} onChange={e => setPriority(e.target.value)} className={`${inputCls} flex-1`}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            )}
            <div className="flex justify-end">
              <Button size="sm" className="h-7 text-xs px-2" onClick={() => { onAdd(item, type, getTime(), getDuration(), priority); setShowTime(false); }}>
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}