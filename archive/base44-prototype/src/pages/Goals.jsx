import { useState, useEffect } from "react";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import WidgetCard from "../components/WidgetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Target, Printer, Mail, ChevronDown, ChevronRight, Archive, RotateCcw, Users, Trash2, HelpCircle, Calendar as CalendarIcon, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import LabelPicker from "../components/LabelPicker";
import { saveLabelToHistory } from "../utils/labelHistory";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import SwipeableListItem from "../components/SwipeableListItem";
import GoalsOnboarding from "../components/onboarding/GoalsOnboarding";
import { uniqueCategories, groupByCategoryCI } from "@/lib/categoryUtils";

const timeframes = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "3_year", label: "3 Year" },
  { value: "5_year", label: "5 Year" },
  { value: "occurrences", label: "Occurrences" },
];

const statusColors = {
  not_started: "border-l-muted-foreground",
  in_progress: "border-l-blue-500",
  completed: "border-l-green-500",
  on_hold: "border-l-amber-500",
};

export default function Goals() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Goal Manager"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={() => setShowOnboarding(true)} title="Guide" className="h-8 w-8 text-sm font-medium"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const [goals, setGoals] = useState([]);
  const [members, setMembers] = useState([]);
  const [goalTasks, setGoalTasks] = useState({});
  const [expandedGoals, setExpandedGoals] = useState({});
  const [newTaskInputs, setNewTaskInputs] = useState({});
  const [newTaskOccurrences, setNewTaskOccurrences] = useState({});
  const [editingTask, setEditingTask] = useState(null); // { id, field: 'title'|'occurrences', value }

  const [activeTab, setActiveTab] = useState("active");
  const [sortBy, setSortBy] = useState("timeframe");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", timeframe: "monthly", occurrences: 1, target_date: "", member_name: "", category: "", category_color: "" });
  const [newMilestones, setNewMilestones] = useState([]);
  const [milestoneInput, setMilestoneInput] = useState("");
  const [memberDialog, setMemberDialog] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "" });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("goals_onboarding_done") === "true") return;
    base44.entities.ThemeSettings.list("-updated_date", 1).then(r => {
      if (!r.length) { setShowOnboarding(true); return; }
      const status = JSON.parse(r[0].onboarding_status || "{}");
      if (!status["goals_onboarding_done"]) setShowOnboarding(true);
      else localStorage.setItem("goals_onboarding_done", "true");
    }).catch(() => setShowOnboarding(true));
  }, []);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => { 
    loadGoals(); 
    loadMembers(); 
    loadAllGoalTasks();
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  const loadGoals = async () => {
    const data = await base44.entities.Goal.list("-created_date", 200);
    setGoals(data);
    // Build default collapsed state for all subcategories
    const collapsedSubs = {};
    timeframes.forEach(tf => {
      const tfGoals = data.filter(g => g.timeframe === tf.value);
      const labels = uniqueCategories(tfGoals.map(g => g.category || "(No Label)"));
      labels.forEach(lbl => { collapsedSubs[`tf-${tf.value}-${lbl}`] = true; });
    });
    const allLabels = uniqueCategories(data.map(g => g.category || "(No Label)"));
    allLabels.forEach(lbl => {
      const tfVals = [...new Set(data.filter(g => (g.category || "(No Label)").toLowerCase() === lbl.toLowerCase()).map(g => g.timeframe || "monthly"))];
      tfVals.forEach(tfVal => { collapsedSubs[`label-${lbl}-${tfVal}`] = true; });
    });
    setCollapsedSubcategories(collapsedSubs);
  };

  const loadAllGoalTasks = async () => {
    const data = await base44.entities.GoalTask.list("-created_date", 500);
    const byGoal = {};
    data.forEach((t) => {
      if (!byGoal[t.goal_id]) byGoal[t.goal_id] = [];
      byGoal[t.goal_id].push(t);
    });
    setGoalTasks(byGoal);
  };

  const addGoalTask = async (goalId) => {
    const title = (newTaskInputs[goalId] || "").trim();
    if (!title) return;
    const occ = parseInt(newTaskOccurrences[goalId]) || 1;
    await base44.entities.GoalTask.create({ goal_id: goalId, title, frequency: "once", completed: false, occurrences: occ, completed_count: 0 });
    setNewTaskInputs((prev) => ({ ...prev, [goalId]: "" }));
    setNewTaskOccurrences((prev) => ({ ...prev, [goalId]: "" }));
    await loadAllGoalTasks();
    await syncGoalProgress(goalId);
  };

  const toggleGoalTask = async (task) => {
    const occ = task.occurrences || 1;
    if (occ > 1) {
      const currentCount = task.completed_count || 0;
      const newCount = task.completed ? Math.max(0, currentCount - 1) : Math.min(occ, currentCount + 1);
      const newCompleted = newCount >= occ;
      await base44.entities.GoalTask.update(task.id, { completed_count: newCount, completed: newCompleted });
    } else {
      await base44.entities.GoalTask.update(task.id, { completed: !task.completed });
    }
    await loadAllGoalTasks();
    await syncGoalProgress(task.goal_id);
  };

  const saveEditingTask = async () => {
    if (!editingTask) return;
    const updates = {};
    if (editingTask.field === "title") {
      const trimmed = (editingTask.value || "").trim();
      if (!trimmed) { setEditingTask(null); return; }
      updates.title = trimmed;
    } else if (editingTask.field === "occurrences") {
      const occ = Math.max(1, parseInt(editingTask.value) || 1);
      updates.occurrences = occ;
      // If new occurrences is less than completed_count, clamp it
      const task = Object.values(goalTasks).flat().find(t => t.id === editingTask.taskId);
      if (task) {
        const clampedCount = Math.min(task.completed_count || 0, occ);
        updates.completed_count = clampedCount;
        updates.completed = clampedCount >= occ;
      }
    }
    await base44.entities.GoalTask.update(editingTask.taskId, updates);
    setEditingTask(null);
    await loadAllGoalTasks();
    const task = Object.values(goalTasks).flat().find(t => t.id === editingTask.taskId);
    if (task) await syncGoalProgress(task.goal_id);
  };

  const deleteGoalTask = async (task) => {
    await base44.entities.GoalTask.delete(task.id);
    await loadAllGoalTasks();
    await syncGoalProgress(task.goal_id);
  };

  const syncGoalProgress = async (goalId) => {
    const data = await base44.entities.GoalTask.filter({ goal_id: goalId });
    if (data.length === 0) return;
    const pct = Math.round((data.filter((t) => t.completed).length / data.length) * 100);
    const newStatus = pct === 100 ? "completed" : pct > 0 ? "in_progress" : "not_started";
    const existing = goals.find(g => g.id === goalId);
    const updates = { progress: pct, status: newStatus, archived: newStatus === "completed" };
    if (newStatus === "in_progress" && existing?.status === "not_started") updates.started_at = new Date().toISOString();
    if (newStatus === "completed" && existing?.status !== "completed") updates.completed_at = new Date().toISOString();
    await base44.entities.Goal.update(goalId, updates);
    await loadGoals();
  }

  const [allGoalsCollapsed, setAllGoalsCollapsed] = useState(true);
  const [collapsedSubcategories, setCollapsedSubcategories] = useState({});

  const toggleSubcategory = (key) => {
    setCollapsedSubcategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleExpanded = (goalId) => {
    setExpandedGoals((prev) => ({ ...prev, [goalId]: !prev[goalId] }));
  };

  const collapseAll = () => {
    const collapsed = {};
    goals.forEach(g => { collapsed[g.id] = false; });
    setExpandedGoals(collapsed);
    setAllGoalsCollapsed(true);
    // collapse all subcategory sections too
    const collapsedSubs = {};
    timeframes.forEach(tf => {
      const tfGoals = goals.filter(g => g.timeframe === tf.value);
      const labels = uniqueCategories(tfGoals.map(g => g.category || "(No Label)"));
      labels.forEach(lbl => { collapsedSubs[`tf-${tf.value}-${lbl}`] = true; });
      const allLabels = uniqueCategories(goals.map(g => g.category || "(No Label)"));
      allLabels.forEach(lbl => {
        const tfVals = [...new Set(goals.filter(g => (g.category || "(No Label)").toLowerCase() === lbl.toLowerCase()).map(g => g.timeframe || "monthly"))];
        tfVals.forEach(tfVal => { collapsedSubs[`label-${lbl}-${tfVal}`] = true; });
      });
    });
    setCollapsedSubcategories(collapsedSubs);
  };

  const expandAll = () => {
    const expanded = {};
    goals.forEach(g => { expanded[g.id] = true; });
    setExpandedGoals(expanded);
    setAllGoalsCollapsed(false);
    setCollapsedSubcategories({});
  };

  const tabs = [
    { label: "Active", value: "active", filter: (g) => !g.archived && g.status !== "completed" },
    { label: "Archive", value: "archive", filter: (g) => g.archived || g.status === "completed" },
  ];

  const archiveGoal = async (goalId) => {
    await base44.entities.Goal.update(goalId, { archived: true });
    await loadGoals();
  };

  const restoreGoal = async (goalId) => {
    await base44.entities.Goal.update(goalId, { archived: false, status: "in_progress" });
    await loadGoals();
  };

  const loadMembers = async () => {
    const data = await base44.entities.ChoreUser.list("name", 50);
    setMembers(data);
  };

  const createMember = async () => {
    if (!memberForm.name) return;
    await base44.entities.ChoreUser.create(memberForm);
    setMemberForm({ name: "" });
    loadMembers();
  };

  const deleteMember = async (memberId) => {
    await base44.entities.ChoreUser.delete(memberId);
    loadMembers();
  };

  const addMilestone = () => {
    const trimmed = milestoneInput.trim();
    if (!trimmed) return;
    setNewMilestones((prev) => [...prev, trimmed]);
    setMilestoneInput("");
  };

  const removeMilestone = (idx) => setNewMilestones((prev) => prev.filter((_, i) => i !== idx));

  const createGoal = async () => {
    if (!form.title) return;
    if (form.category) saveLabelToHistory(form.category, form.category_color);
    const goalData = { ...form };
    if (!goalData.member_name && currentUser) {
      goalData.member_name = currentUser.full_name;
    }
    const goal = await base44.entities.Goal.create(goalData);
    if (newMilestones.length > 0) {
      await Promise.all(newMilestones.map((title) =>
        base44.entities.GoalTask.create({ goal_id: goal.id, title, frequency: "once", completed: false })
      ));
    }
    setForm({ title: "", description: "", timeframe: "monthly", occurrences: 1, target_date: "", member_name: "", category: "", category_color: "" });
    setNewMilestones([]);
    setMilestoneInput("");
    setDialogOpen(false);
    loadGoals();
    loadAllGoalTasks();
  };

  const deleteGoal = async (id) => {
    await base44.entities.Goal.delete(id);
    loadGoals();
  };

  const openEditDialog = (goal) => {
    setEditingGoal(goal);
    setEditForm({
      title: goal.title || "",
      description: goal.description || "",
      timeframe: goal.timeframe || "monthly",
      occurrences: goal.occurrences || 1,
      target_date: goal.target_date || "",
      member_name: goal.member_name || "",
      category: goal.category || "",
      category_color: goal.category_color || "",
    });
    setEditDialogOpen(true);
  };

  const saveEditGoal = async () => {
    if (!editingGoal || !editForm.title) return;
    if (editForm.category) saveLabelToHistory(editForm.category, editForm.category_color);
    await base44.entities.Goal.update(editingGoal.id, editForm);
    setEditDialogOpen(false);
    setEditingGoal(null);
    loadGoals();
  };

  const handlePrint = () => {
    const label = activeTab === "all" ? "All Goals" : `${activeTab}'s Goals`;
    const win = window.open("", "_blank");
    const rows = filteredGoals.map((g) => {
      const tf = timeframes.find((t) => t.value === g.timeframe)?.label || g.timeframe;
      const milestones = g.milestones ? g.milestones.split("\n").filter(Boolean).map((m) => `<li>${m}</li>`).join("") : "";
      return `<div style="margin-bottom:16px;padding:12px;border-left:4px solid #6366f1;background:#f9fafb;border-radius:6px">
        <strong>${g.title}</strong> <span style="font-size:12px;color:#6b7280">[${tf}]</span>
        ${g.description ? `<p style="font-size:13px;margin:4px 0;color:#374151">${g.description}</p>` : ""}
        ${g.target_date ? `<p style="font-size:12px;color:#6b7280">Target: ${g.target_date}</p>` : ""}
        <p style="font-size:12px;color:#6b7280">Progress: ${g.progress || 0}%</p>
        ${milestones ? `<ul style="font-size:12px;color:#6b7280;margin:4px 0 0 16px">${milestones}</ul>` : ""}
      </div>`;
    }).join("");
    win.document.write(`<html><head><title>${label}</title><style>body{font-family:Inter,sans-serif;padding:24px;max-width:800px;margin:0 auto}</style></head><body><h2>${label}</h2>${rows}</body></html>`);
    win.document.close();
    win.print();
  };

  const handleEmail = async () => {
    const label = activeTab === "all" ? "All Goals" : `${activeTab}'s Goals`;
    const user = await base44.auth.me();
    const rows = filteredGoals.map((g) => {
      const tf = timeframes.find((t) => t.value === g.timeframe)?.label || g.timeframe;
      const milestones = g.milestones ? `<ul>${g.milestones.split("\n").filter(Boolean).map((m) => `<li>${m}</li>`).join("")}</ul>` : "";
      return `<div style="margin-bottom:16px;padding:12px;border-left:4px solid #6366f1;background:#f9fafb;border-radius:6px">
        <strong>${g.title}</strong> <span style="font-size:12px;color:#6b7280">[${tf}]</span>
        ${g.description ? `<p style="font-size:13px;margin:4px 0">${g.description}</p>` : ""}
        ${g.target_date ? `<p style="font-size:12px;color:#6b7280">Target: ${g.target_date}</p>` : ""}
        <p style="font-size:12px;color:#6b7280">Progress: ${g.progress || 0}%</p>
        ${milestones}
      </div>`;
    }).join("");
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: label,
      body: `<div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto;padding:24px"><h2>${label}</h2>${rows}</div>`,
    });
    alert("Goals sent to your email!");
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return null;
    const ms = new Date(end) - new Date(start);
    const hours = ms / (1000 * 60 * 60);
    const days = ms / (1000 * 60 * 60 * 24);
    const months = days / 30.44;
    const years = days / 365.25;
    if (hours < 24) return `${Math.round(hours)}h`;
    if (days < 30) return `${Math.round(days)}d`;
    if (months < 12) return `${Math.round(months)}mo`;
    return `${(years).toFixed(1)}yr`;
  };

  const filteredGoals = goals.filter((g) => {
    const tabFilter = tabs.find((t) => t.value === activeTab)?.filter || (() => true);
    if (!tabFilter(g)) return false;
    if (activeTab === "archive" || activeTab === "active") return true;
    return g.member_name === activeTab;
  });

  const renderGoalRow = (goal) => {
    const tasks = goalTasks[goal.id] || [];
    const isExpanded = !!expandedGoals[goal.id];
    const categoryColor = goal.category_color;
    return (
      <div key={goal.id} className="rounded-md border border-border overflow-hidden">
        <SwipeableListItem onDelete={() => deleteGoal(goal.id)}>
          <button onClick={() => toggleExpanded(goal.id)} className="text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0" onDoubleClick={() => openEditDialog(goal)}>
            <div className="text-sm font-medium">{goal.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {tasks.length > 0 ? `${goal.progress || 0}% • ${tasks.filter(t=>t.completed).length}/${tasks.length} tasks` : "No tasks yet"}
              {goal.timeframe === "occurrences" && goal.occurrences && ` • ${goal.occurrences}x`}
              {goal.target_date && ` • Due: ${goal.target_date}`}
              {goal.started_at && ` • Started: ${new Date(goal.started_at).toLocaleDateString()}`}
              {goal.completed_at && ` • Completed: ${new Date(goal.completed_at).toLocaleDateString()}`}
              {goal.started_at && goal.completed_at && ` • Duration: ${formatDuration(goal.started_at, goal.completed_at)}`}
            </div>
            {tasks.length > 0 && (
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${goal.progress || 0}%` }} />
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {goal.category && (
              <span className="text-xs font-medium shrink-0" style={{ color: categoryColor || undefined }}>
                {goal.category.toUpperCase()}
              </span>
            )}
            {goal.member_name && <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">{goal.member_name}</span>}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {activeTab === "archive" ? (
                <button className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => restoreGoal(goal.id)} title="Restore">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10" onClick={() => archiveGoal(goal.id)} title="Archive">
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </SwipeableListItem>
        {isExpanded && (
          <div className="px-4 pb-3 pt-1 border-t border-border bg-muted/20 space-y-1">
            {tasks.map((task) => {
              const isEditingTitle = editingTask?.taskId === task.id && editingTask?.field === "title";
              const isEditingOcc = editingTask?.taskId === task.id && editingTask?.field === "occurrences";
              const occ = task.occurrences || 1;
              return (
                <div key={task.id} className="group/task flex items-center gap-2 py-1">
                  <Checkbox checked={task.completed} onCheckedChange={() => toggleGoalTask(task)} />
                  {isEditingTitle ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm border border-primary rounded px-2 py-0.5 bg-background"
                      value={editingTask.value}
                      onChange={(e) => setEditingTask(t => ({ ...t, value: e.target.value }))}
                      onBlur={saveEditingTask}
                      onKeyDown={(e) => { if (e.key === "Enter") saveEditingTask(); if (e.key === "Escape") setEditingTask(null); }}
                    />
                  ) : (
                    <span
                      className={cn("text-sm flex-1 cursor-default", task.completed && "line-through text-muted-foreground")}
                      onDoubleClick={() => setEditingTask({ taskId: task.id, field: "title", value: task.title })}
                      title="Double-click to edit"
                    >{task.title}</span>
                  )}
                  {!isEditingOcc && (
                    <span
                      className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded shrink-0 cursor-default transition-colors",
                        occ > 1
                          ? "bg-muted text-muted-foreground hover:bg-secondary opacity-100"
                          : "bg-transparent text-muted-foreground/40 opacity-0 group-hover/task:opacity-100 hover:bg-muted"
                      )}
                      onDoubleClick={() => setEditingTask({ taskId: task.id, field: "occurrences", value: String(occ) })}
                      title="Double-click to edit occurrences"
                    >
                      {occ > 1 ? `${task.completed_count || 0}/${occ}` : `×${occ}`}
                    </span>
                  )}
                  {isEditingOcc && (
                    <div className="flex items-center rounded-full border border-primary overflow-hidden bg-background shrink-0 shadow-sm">
                      <button
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors text-sm leading-none"
                        onMouseDown={(e) => { e.preventDefault(); setEditingTask(t => ({ ...t, value: String(Math.max(1, (parseInt(t.value) || 1) - 1)) })); }}
                      >−</button>
                      <span className="w-6 text-xs text-center font-semibold text-primary select-none">{editingTask.value}</span>
                      <button
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors text-sm leading-none"
                        onMouseDown={(e) => { e.preventDefault(); setEditingTask(t => ({ ...t, value: String((parseInt(t.value) || 1) + 1) })); }}
                      >+</button>
                      <button
                        className="w-6 h-6 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors text-xs font-bold rounded-r-full"
                        onMouseDown={(e) => { e.preventDefault(); saveEditingTask(); }}
                        title="Confirm"
                      >✓</button>
                    </div>
                  )}
                  <button className="opacity-0 group-hover/task:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => deleteGoalTask(task)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <div className="flex gap-2 mt-2 items-center">
              <input
                className="flex-1 text-sm border border-border rounded px-2 py-1 bg-transparent"
                placeholder="Add a task..."
                value={newTaskInputs[goal.id] || ""}
                onChange={(e) => setNewTaskInputs((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addGoalTask(goal.id)}
              />
              {/* Modern stepper for occurrences */}
              <div className="flex items-center rounded border border-border overflow-hidden bg-muted/40 shrink-0">
                <button
                  className="w-6 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-base leading-none"
                  onClick={() => setNewTaskOccurrences(prev => ({ ...prev, [goal.id]: String(Math.max(1, (parseInt(prev[goal.id]) || 1) - 1)) }))}
                  tabIndex={-1}
                >−</button>
                <span className="w-6 text-xs text-center font-medium select-none">{newTaskOccurrences[goal.id] || 1}</span>
                <button
                  className="w-6 h-7 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-base leading-none"
                  onClick={() => setNewTaskOccurrences(prev => ({ ...prev, [goal.id]: String((parseInt(prev[goal.id]) || 1) + 1) }))}
                  tabIndex={-1}
                >+</button>
              </div>
              <Button size="sm" variant="outline" onClick={() => addGoalTask(goal.id)} title="Add task" className="bg-secondary/50"><Plus className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex gap-2 items-center">
          <Dialog open={memberDialog} onOpenChange={setMemberDialog}>
            <DialogTrigger asChild><Button size="icon" variant="outline" title="Manage family members" className="bg-secondary/50"><Users className="w-4 h-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Manage Family Members</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase mb-2 block">Add New Member</Label>
                  <div className="space-y-3 p-3 rounded bg-muted/50">
                    <div><Label>Name</Label><Input value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} /></div>
                    <Button onClick={createMember} className="w-full">Add Member</Button>
                  </div>
                </div>
                {members.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase mb-2 block">Family Members</Label>
                    <div className="space-y-2 border-t border-border pt-3">
                      {members.map((member) => (
                        <SwipeableListItem key={member.id} onDelete={() => deleteMember(member.id)}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: member.color }} />
                            <p className="text-sm font-medium">{member.name}</p>
                          </div>
                        </SwipeableListItem>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Timeframe</Label>
                    <Select value={form.timeframe} onValueChange={(v) => setForm({ ...form, timeframe: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {timeframes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {form.timeframe === "occurrences" ? (
                    <div>
                      <Label>How many times?</Label>
                      <Input
                        type="number"
                        min={1}
                        value={form.occurrences}
                        onChange={(e) => setForm({ ...form, occurrences: parseInt(e.target.value) || 1 })}
                        className="mt-1"
                      />
                    </div>
                  ) : (
                  <div>
                    <Label>Target Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal mt-1 bg-secondary/50">
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {form.target_date ? format(new Date(form.target_date + 'T00:00:00'), "MMM d, yyyy") : <span className="text-muted-foreground">Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.target_date ? new Date(form.target_date + 'T00:00:00') : undefined}
                          onSelect={(date) => setForm({ ...form, target_date: date ? format(date, "yyyy-MM-dd") : "" })}
                          initialFocus
                        />
                      </PopoverContent>
                      </Popover>
                      </div>
                      )}
                      </div>
                      <div>
                      <Label>Assign To</Label>
                  <Select value={form.member_name || (currentUser ? currentUser.full_name : "")} onValueChange={(v) => setForm({ ...form, member_name: v })}>
                    <SelectTrigger><SelectValue placeholder={currentUser?.full_name} /></SelectTrigger>
                    <SelectContent>
                      {currentUser && <SelectItem value={currentUser.full_name}>{currentUser.full_name}</SelectItem>}
                      {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <LabelPicker
                    label={form.category}
                    color={form.category_color}
                    onLabelChange={(v) => setForm(f => ({ ...f, category: v }))}
                    onColorChange={(v) => setForm(f => ({ ...f, category_color: v }))}
                    onSelect={(lbl, clr) => setForm(f => ({ ...f, category: lbl, category_color: clr }))}
                  />
                </div>
                <div>
                  <Label>Milestones (Tasks)</Label>
                  <div className="space-y-1.5 mt-1">
                    {newMilestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-muted text-sm">
                        <span className="flex-1">{m}</span>
                        <button onClick={() => removeMilestone(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input value={milestoneInput} onChange={(e) => setMilestoneInput(e.target.value)}
                        placeholder="Add milestone task..." className="h-8 text-sm"
                        onKeyDown={(e) => e.key === "Enter" && addMilestone()} />
                      <Button size="sm" variant="outline" className="h-8 bg-secondary/50" onClick={addMilestone} title="Add milestone"><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </div>
                <Button onClick={createGoal} className="w-full">Create Goal</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter + Sort Dropdowns */}
      <div className="no-print flex gap-2 flex-wrap">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-48 bg-primary text-primary-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
            ))}
            {members.length > 0 && members.map((m) => (
              <SelectItem key={m.id} value={m.name}>{m.name}'s Goals</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36 bg-primary text-primary-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timeframe">Timeframe</SelectItem>
            <SelectItem value="label">Label</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-primary">{(activeTab === "active" || activeTab === "archive" ? goals : filteredGoals).filter((g) => g.status === "in_progress" || g.status === "not_started").length}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="bg-card rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{(activeTab === "active" || activeTab === "archive" ? goals : filteredGoals).filter((g) => g.status === "completed").length}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
      </div>

      {sortBy === "label" && (() => {
        const grouped = groupByCategoryCI(filteredGoals, g => g.category);
        const sortedKeys = Object.keys(grouped).sort((a, b) => a === "(No Label)" ? 1 : b === "(No Label)" ? -1 : a.localeCompare(b));
        return sortedKeys.map(lbl => {
          const lblGoals = grouped[lbl];
          const labelColor = lblGoals[0]?.category_color;
          // sub-group by timeframe within each label card
          const subGrouped = {};
          lblGoals.forEach(g => {
            const tf = g.timeframe || "monthly";
            if (!subGrouped[tf]) subGrouped[tf] = [];
            subGrouped[tf].push(g);
          });
          const subKeys = timeframes.map(t => t.value).filter(v => subGrouped[v]);
          return (
            <WidgetCard key={lbl} title={lbl} id={`goals-label-${lbl}`}
              headerStyle={labelColor ? { borderTopColor: labelColor } : undefined}
            >
              <div className="space-y-3">
                {subKeys.map(tfVal => {
                  const subGoals = subGrouped[tfVal];
                  const subKey = `label-${lbl}-${tfVal}`;
                  const isCollapsed = collapsedSubcategories[subKey];
                  const tfLabel = timeframes.find(t => t.value === tfVal)?.label || tfVal;
                  return (
                    <div key={tfVal}>
                      <button
                        onClick={() => toggleSubcategory(subKey)}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground mb-1.5 w-full text-left"
                      >
                        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        {tfVal === "occurrences" ? "Occurrence-Based" : tfLabel} ({subGoals.length})
                      </button>
                      {!isCollapsed && (
                        <div className="space-y-2">
                          {subGoals.map(goal => renderGoalRow(goal))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </WidgetCard>
          );
        });
      })()}

      {sortBy === "timeframe" && timeframes.map((tf) => {
        const tfGoals = filteredGoals.filter((g) => g.timeframe === tf.value);
        if (tfGoals.length === 0) return null;
        // sub-group by category within each timeframe card
        const subGrouped = groupByCategoryCI(tfGoals, g => g.category);
        const subKeys = Object.keys(subGrouped).sort((a, b) => a === "(No Label)" ? 1 : b === "(No Label)" ? -1 : a.localeCompare(b));
        const hasMultipleSubcategories = subKeys.length > 1 || (subKeys.length === 1 && subKeys[0] !== "(No Label)");
        return (
          <WidgetCard key={tf.value} title={tf.value === "occurrences" ? "Occurrence-Based Goals" : `${tf.label} Goals`} id={`goals-${tf.value}`} headerRight={(
            <div className="flex items-center gap-1 no-print">
              <Button size="icon" variant="ghost" className="h-8 w-8" title={allGoalsCollapsed ? "Expand all" : "Collapse all"} onClick={() => {
                allGoalsCollapsed ? expandAll() : collapseAll();
              }}>
                {allGoalsCollapsed ? <ChevronsUpDown className="w-4 h-4" /> : <ChevronsDownUp className="w-4 h-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                const label = activeTab === 'all' ? `All ${tf.label} Goals` : `${activeTab}'s ${tf.label} Goals`;
                const el = document.getElementById(`goals-${tf.value}`);
                if (!el) return;
                const win = window.open('', '_blank');
                win.document.write(`<html><head><title>${label}</title><style>body{font-family:Inter,sans-serif;padding:24px;max-width:800px;margin:0 auto}</style></head><body><h2>${label}</h2>${el.innerHTML}</body></html>`);
                win.document.close();
                win.print();
              }} title="Print goals">
                <Printer className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={async () => {
                const label = activeTab === 'all' ? `All ${tf.label} Goals` : `${activeTab}'s ${tf.label} Goals`;
                const el = document.getElementById(`goals-${tf.value}`);
                if (!el) return;
                const user = await base44.auth.me();
                await base44.integrations.Core.SendEmail({
                  to: user.email,
                  subject: label,
                  body: `<div style="font-family:Inter,sans-serif;max-width:700px;margin:0 auto;padding:24px"><h2>${label}</h2>${el.innerHTML}</div>`,
                });
                alert('Goals sent to your email!');
              }} title="Email goals">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          )}>
            <div className="space-y-3">
              {hasMultipleSubcategories ? subKeys.map(lbl => {
                const subGoals = subGrouped[lbl];
                const subKey = `tf-${tf.value}-${lbl}`;
                const isCollapsed = collapsedSubcategories[subKey];
                const labelColor = subGoals[0]?.category_color;
                return (
                  <div key={lbl}>
                    <button
                      onClick={() => toggleSubcategory(subKey)}
                      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide hover:text-foreground mb-1.5 w-full text-left"
                      style={{ color: labelColor || undefined }}
                    >
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span style={{ color: labelColor || 'hsl(var(--muted-foreground))' }}>{lbl}</span>
                      <span className="text-muted-foreground font-normal normal-case tracking-normal">({subGoals.length})</span>
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-2">
                        {subGoals.map(goal => renderGoalRow(goal))}
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="space-y-2">
                  {tfGoals.map((goal) => renderGoalRow(goal))}
                </div>
              )}
            </div>
          </WidgetCard>
        );
      })}

      <GoalsOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Edit Goal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Timeframe</Label>
                <Select value={editForm.timeframe} onValueChange={(v) => setEditForm({ ...editForm, timeframe: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {timeframes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {editForm.timeframe === "occurrences" ? (
                <div>
                  <Label>How many times?</Label>
                  <Input type="number" min={1} value={editForm.occurrences} onChange={(e) => setEditForm({ ...editForm, occurrences: parseInt(e.target.value) || 1 })} className="mt-1" />
                </div>
              ) : (
                <div>
                  <Label>Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal mt-1 bg-secondary/50">
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {editForm.target_date ? format(new Date(editForm.target_date + 'T00:00:00'), "MMM d, yyyy") : <span className="text-muted-foreground">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editForm.target_date ? new Date(editForm.target_date + 'T00:00:00') : undefined}
                        onSelect={(date) => setEditForm({ ...editForm, target_date: date ? format(date, "yyyy-MM-dd") : "" })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={editForm.member_name || ""} onValueChange={(v) => setEditForm({ ...editForm, member_name: v })}>
                <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
                <SelectContent>
                  {currentUser && <SelectItem value={currentUser.full_name}>{currentUser.full_name}</SelectItem>}
                  {members.map((m) => <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <LabelPicker
                label={editForm.category}
                color={editForm.category_color}
                onLabelChange={(v) => setEditForm(f => ({ ...f, category: v }))}
                onColorChange={(v) => setEditForm(f => ({ ...f, category_color: v }))}
                onSelect={(lbl, clr) => setEditForm(f => ({ ...f, category: lbl, category_color: clr }))}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={saveEditGoal} className="flex-1">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {filteredGoals.length === 0 && (
        <WidgetCard title="Get Started" id="goals-empty">
          <div className="text-center py-12">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Set your first goal to start tracking your progress.</p>
          </div>
        </WidgetCard>
      )}
    </div>
  );
}