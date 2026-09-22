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
import { Plus, X, UserPlus, Clock, Printer, Mail, Pencil, Trash2, Users, Calendar as CalendarIcon, HelpCircle, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import SubjectCard from "../components/education/SubjectCard";
import EducationOnboarding from "@/components/onboarding/EducationOnboarding";
import SwipeableListItem from "../components/SwipeableListItem";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ActivityGenerator from "../components/ActivityGenerator";
import ActivityLibrary from "../components/ActivityLibrary";
import StatsBar from "@/components/StatsBar";

export default function Education() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Education Manager"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={() => setShowOnboarding(true)} title="Guide" className="h-8 w-8 text-sm font-medium"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("education_onboarded"); } catch { return false; }
  });
  const [learners, setLearners] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeLearner, setActiveLearner] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [learnerDialog, setLearnerDialog] = useState(false);
  const [planDialog, setPlanDialog] = useState(false);
  const [planError, setPlanError] = useState("");
  const [activityDialog, setActivityDialog] = useState(false);
  const [activityTarget, setActivityTarget] = useState(null); // {plan_id, learner_id, subject}
  const [learnerForm, setLearnerForm] = useState({ name: "", grade_level: "", color: "#8b5cf6" });
  const [planForm, setPlanForm] = useState({ learner_id: "", subjects: [], description: "", due_date: "", materials: "", notes: "" });
  const [activityForm, setActivityForm] = useState({ title: "", type: "assignment", due_date: "", frequency: "once", notes: "", days_of_week: [] });
  const [customSubject, setCustomSubject] = useState("");
  const [editPlanDialog, setEditPlanDialog] = useState(false);
  const [editPlanForm, setEditPlanForm] = useState(null);

  const [filterLearner, setFilterLearner] = useState("all");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("filter") === "due" ? "due-today" : "due-today";
  });
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [expandedExceptions, setExpandedExceptions] = useState(new Set());
  const today = new Date().toISOString().split('T')[0];
  const todayDayShort = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
  const todayDayOfMonth = new Date().getDate();

  const currentToday = new Date();
  currentToday.setHours(0, 0, 0, 0);

  const isActivityDueToday = (a) => {
    const activityDueDate = a.due_date ? new Date(a.due_date + 'T00:00:00') : null;
    const isSameDay = (d1, d2) => d1 && d2 &&
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
    // If completed today (last_completed_date = today), don't show as due
    const lastCompleted = a.last_completed_date ? new Date(a.last_completed_date + 'T00:00:00') : null;
    const completedToday = isSameDay(lastCompleted, currentToday);
    if (completedToday) return false;
    // For once-off completed items, never show as due
    if (a.completed && a.frequency === "once") return false;
    // Exact due date match (and not completed today)
    if (isSameDay(activityDueDate, currentToday)) return true;
    // Recurring: daily
    if (a.frequency === "daily") return true;
    // Recurring: weekly — check day of week match
    if (a.frequency === "weekly" && a.days_of_week?.includes(todayDayShort)) return true;
    // Recurring: biweekly — check day of week match or exact due date
    if (a.frequency === "biweekly") {
      if (a.days_of_week?.includes(todayDayShort)) return true;
      if (activityDueDate && isSameDay(activityDueDate, currentToday)) return true;
    }
    // Recurring: monthly — same day of month
    if (a.frequency === "monthly" && activityDueDate) return activityDueDate.getDate() === currentToday.getDate();
    return false;
  };

  const isActivityOverdue = (a) => {
    if (a.completed) return false;
    const activityDueDate = a.due_date ? new Date(a.due_date + 'T00:00:00') : null;
    if (activityDueDate && activityDueDate < currentToday) {
      // not due today
      const isSameDay = (d1, d2) => d1 && d2 &&
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
      if (!isSameDay(activityDueDate, currentToday)) return true;
    }
    if (a.frequency === "weekly" && a.days_of_week?.length > 0) {
      const todayIdx = currentToday.getDay();
      const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      return a.days_of_week.some(d => days.indexOf(d) < todayIdx) && !a.days_of_week.includes(todayDayShort);
    }
    if (a.frequency === "monthly" && activityDueDate) {
      return activityDueDate.getDate() < currentToday.getDate();
    }
    return false;
  };

  const [customSubjects, setCustomSubjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem("edu_custom_subjects") || "[]"); } catch { return []; }
  });
  const defaultSubjects = ["Math", "Reading", "Writing", "Science", "History", "Geography", "Art", "Music", "PE", "Foreign Language"];
  const allSubjects = [...defaultSubjects, ...customSubjects];
  const frequencyLabels = { once: "Once", daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly" };
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toggleDay = (day) => {
    setActivityForm((f) => ({
      ...f,
      days_of_week: f.days_of_week.includes(day) ? f.days_of_week.filter((d) => d !== day) : [...f.days_of_week, day],
    }));
  };

  const toggleSubject = (subject) => {
    setPlanForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject) ? f.subjects.filter((s) => s !== subject) : [...f.subjects, subject],
    }));
  };

  useEffect(() => { 
    loadData(); 
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  const loadData = async () => {
    const l = await base44.entities.Learner.list();
    const p = await base44.entities.EducationPlan.list("-created_date", 200);
    const a = await base44.entities.EducationActivity.list("-created_date", 500);
    setLearners(l);
    setPlans(p);
    setActivities(a);
    if (l.length > 0 && !activeLearner) setActiveLearner(l[0].id);
  };

  const createLearner = async () => {
    if (!learnerForm.name) return;
    const newLearner = await base44.entities.Learner.create(learnerForm);
    setLearnerForm({ name: "", grade_level: "", color: "#8b5cf6" });
    setLearnerDialog(false);
    setActiveLearner(newLearner.id);
    loadData();
  };

  const createPlan = async () => {
    if (planForm.subjects.length === 0) { setPlanError("Please select at least one subject."); return; }
    setPlanError("");
    const learnerId = planForm.learner_id || activeLearner || (learners.length === 0 && currentUser ? currentUser.full_name : null);
    if (!learnerId) return;
    await Promise.all(planForm.subjects.map((subject) =>
          base44.entities.EducationPlan.create({ ...planForm, title: subject, subject, learner_id: learnerId })
    ));
    setPlanForm({ learner_id: "", subjects: [], description: "", due_date: "", materials: "", notes: "" });
    setPlanDialog(false);
    loadData();
  };

  const deletePlan = async (id) => {
    await base44.entities.EducationPlan.delete(id);
    loadData();
  };

  const openEditPlan = (plan) => {
    setEditPlanForm({ ...plan });
    setEditPlanDialog(true);
  };

  const saveEditPlan = async () => {
    if (!editPlanForm) return;
    await base44.entities.EducationPlan.update(editPlanForm.id, {
      description: editPlanForm.description,
      materials: editPlanForm.materials,
      notes: editPlanForm.notes,
      due_date: editPlanForm.due_date,
    });
    setEditPlanDialog(false);
    loadData();
  };

  const deleteSubjectFromDialog = async () => {
    if (!editPlanForm) return;
    if (!confirm(`Delete the "${editPlanForm.subject}" subject and all its plans and activities?`)) return;
    const subjectPlans = plans.filter((p) => p.learner_id === activeLearner && p.subject === editPlanForm.subject);
    const subjectActivities = activities.filter((a) => a.learner_id === activeLearner && a.subject === editPlanForm.subject);
    await Promise.all([
      ...subjectPlans.map((p) => base44.entities.EducationPlan.delete(p.id)),
      ...subjectActivities.map((a) => base44.entities.EducationActivity.delete(a.id)),
    ]);
    setEditPlanDialog(false);
    loadData();
  };

  const deleteSubject = async (subject) => {
    const subjectPlans = plans.filter((p) => p.learner_id === activeLearner && p.subject === subject);
    await Promise.all(subjectPlans.map((p) => base44.entities.EducationPlan.delete(p.id)));
    loadData();
  };

  const deleteLearner = async (learnerId) => {
    const learnerPlans = plans.filter((p) => p.learner_id === learnerId);
    const learnerActivities = activities.filter((a) => a.learner_id === learnerId);
    await Promise.all([
      ...learnerPlans.map((p) => base44.entities.EducationPlan.delete(p.id)),
      ...learnerActivities.map((a) => base44.entities.EducationActivity.delete(a.id)),
      base44.entities.Learner.delete(learnerId)
    ]);
    if (activeLearner === learnerId) setActiveLearner(null);
    loadData();
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (!trimmed || allSubjects.includes(trimmed)) return;
    const updated = [...customSubjects, trimmed];
    setCustomSubjects(updated);
    localStorage.setItem("edu_custom_subjects", JSON.stringify(updated));
    setPlanForm(f => ({ ...f, subjects: [...f.subjects, trimmed] }));
    setCustomSubject("");
  };

  const openActivityDialog = (plan) => {
    setActivityTarget({ plan_id: plan.id || null, learner_id: plan.learner_id, subject: plan.subject });
    setActivityForm({ title: "", type: "assignment", due_date: "", frequency: "once", notes: "", days_of_week: [] });
    setActivityDialog(true);
  };

  const createActivity = async () => {
    if (!activityForm.title || !activityTarget) return;
    await base44.entities.EducationActivity.create({ ...activityForm, ...activityTarget });
    setActivityDialog(false);
    loadData();
  };

  const createGoalFromEducation = async (subject, learnerName) => {
    try {
      const goal = await base44.entities.Goal.create({
        title: `${subject} Education Goal`,
        description: `Created from Education Manager - ${subject}`,
        timeframe: "monthly",
        status: "not_started",
        member_name: learnerName,
      });
      if (goal) {
        alert(`"${subject}" goal created! View it in Goal Manager.`);
      }
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const deleteActivity = async (id) => {
    try { await base44.entities.EducationActivity.delete(id); } catch (e) {}
    loadData();
  };

  const calculateNextDueDate = (frequency) => {
    const today = new Date();
    const newDate = new Date(today);
    if (frequency === "daily") newDate.setDate(newDate.getDate() + 1);
    else if (frequency === "weekly") newDate.setDate(newDate.getDate() + 7);
    else if (frequency === "biweekly") newDate.setDate(newDate.getDate() + 14);
    else if (frequency === "monthly") newDate.setDate(newDate.getDate() + 30);
    return newDate.toISOString().split('T')[0];
  };

  const calculatePriorDueDate = (frequency) => {
    const today = new Date();
    const newDate = new Date(today);
    if (frequency === "daily") newDate.setDate(newDate.getDate() - 1);
    else if (frequency === "weekly") newDate.setDate(newDate.getDate() - 7);
    else if (frequency === "biweekly") newDate.setDate(newDate.getDate() - 14);
    else if (frequency === "monthly") newDate.setDate(newDate.getDate() - 30);
    return newDate.toISOString().split('T')[0];
  };

  const toggleActivity = async (activity) => {
    if (!activity.completed && activity.frequency !== "once") {
      const today = new Date().toISOString().split('T')[0];
      const nextDue = calculateNextDueDate(activity.frequency);
      await base44.entities.EducationActivity.update(activity.id, {
        completed: true,
        last_completed_date: today,
        due_date: nextDue
      });
    } else {
      await base44.entities.EducationActivity.update(activity.id, { completed: !activity.completed, last_completed_date: null });
    }
    loadData();
  };

  const handlePrintAllLearnerPlans = () => {
    // Determine which learner(s) are visible based on current filters
    const visibleLearnerIds = filterLearner === "all" ? learners.map(l => l.id) : [filterLearner];
    const printTitle = filterLearner === "all"
      ? "Weekly Education Schedule"
      : `${learners.find(l => l.id === filterLearner)?.name || ""} - Weekly Education Schedule`;

    // Filter plans and activities to what's currently displayed
    const learnerPlansToShow = plans
      .filter(p => visibleLearnerIds.includes(p.learner_id))
      .filter(p => !filterSubject || p.subject === filterSubject);

    // Determine activity filter based on current status filter
    const activityFilter = showDueToday ? isActivityDueToday
      : showOverdue ? isActivityOverdue
      : showUpcoming ? isActivityUpcoming
      : showCompleted ? (a) => a.completed && a.frequency === "once"
      : () => true;

    const learnerActivities = activities
      .filter(a => visibleLearnerIds.includes(a.learner_id))
      .filter(a => !filterSubject || a.subject === filterSubject)
      .filter(activityFilter);

    const learner = learners.find((l) => l.id === (filterLearner !== "all" ? filterLearner : activeLearner));
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayMap = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

    // Organize weekly activities by day
    const activitiesByDay = {};
    daysOfWeek.forEach(day => { activitiesByDay[day] = []; });
    learnerActivities
      .filter(a => a.frequency === 'weekly' && a.days_of_week?.length > 0)
      .forEach(activity => {
        activity.days_of_week.forEach(shortDay => {
          const fullDay = dayMap[shortDay] || shortDay;
          if (activitiesByDay[fullDay]) activitiesByDay[fullDay].push(activity);
        });
      });

    const dailyActivities = learnerActivities.filter(a => a.frequency === 'daily');
    const onceActivities = learnerActivities.filter(a => a.frequency === 'once');
    const otherActivities = learnerActivities.filter(a => ['biweekly', 'monthly'].includes(a.frequency));

    const win = window.open("", "_blank");
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
        h1 { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
        .date-line { color: #666; margin-bottom: 30px; font-size: 12px; }
        .section { margin-bottom: 35px; page-break-inside: avoid; }
        .section-title { font-size: 18px; font-weight: bold; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
        .day-title { font-size: 16px; font-weight: bold; margin-top: 25px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #333; }
        .activity-item { margin-bottom: 18px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; display: flex; gap: 8px; align-items: flex-start; }
        .activity-content { flex: 1; }
        .activity-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .activity-desc { font-size: 12px; color: #666; margin-bottom: 6px; line-height: 1.4; }
        .activity-meta { font-size: 11px; color: #777; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; }
        tr { border-bottom: 1px solid #ddd; }
        td { padding: 8px 0; vertical-align: top; }
        @media print { body { margin: 0; padding: 0; } }
      </style>
    `;

    win.document.write(`<html><head><title>${printTitle}</title>${styles}</head><body>`);
    win.document.write(`<h1>${printTitle}</h1>`);
    win.document.write(`<div class="date-line">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>`);

    // Learning Plans
    if (learnerPlansToShow.length > 0) {
      win.document.write(`<div class="section"><div class="section-title">Learning Plans</div>`);
      learnerPlansToShow.forEach(plan => {
        win.document.write(`
          <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
            <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px;">${plan.title}</div>
            ${plan.description ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px; line-height: 1.4;">${plan.description}</div>` : ''}
            <div style="font-size: 11px; color: #888; line-height: 1.5;">
              ${plan.materials ? `<div><strong>Materials:</strong> ${plan.materials}</div>` : ''}
              ${plan.due_date ? `<div><strong>Target Date:</strong> ${plan.due_date}</div>` : ''}
              ${plan.notes ? `<div><strong>Notes:</strong> ${plan.notes}</div>` : ''}
            </div>
          </div>
        `);
      });
      win.document.write(`</div>`);
    }

    // Daily Activities
    if (dailyActivities.length > 0) {
      win.document.write(`<div class="section"><div class="section-title">Daily Activities</div>`);
      dailyActivities.forEach(activity => {
        win.document.write(`
          <div class="activity-item">
            <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
            <div class="activity-content">
              <div class="activity-title">${activity.title}</div>
              ${activity.notes ? `<div class="activity-desc">${activity.notes}</div>` : ''}
            </div>
          </div>
        `);
      });
      win.document.write(`</div>`);
    }

    // Weekly Activities by Day
    if (Object.values(activitiesByDay).some(arr => arr.length > 0)) {
      win.document.write(`<div class="section"><div class="section-title">Weekly Activities</div>`);
      daysOfWeek.forEach(day => {
        const dayActivities = activitiesByDay[day];
        if (dayActivities.length === 0) return;
        win.document.write(`<div class="day-title">${day}</div>`);
        dayActivities.forEach(activity => {
          win.document.write(`
            <div class="activity-item">
              <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
              <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                ${activity.notes ? `<div class="activity-desc">${activity.notes}</div>` : ''}
              </div>
            </div>
          `);
        });
      });
      win.document.write(`</div>`);
    }

    // One-Time & Other Activities
    if (onceActivities.length > 0) {
      win.document.write(`<div class="section"><div class="section-title">One-Time Activities</div>`);
      onceActivities.forEach(activity => {
        win.document.write(`
          <div class="activity-item">
            <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
            <div class="activity-content">
              <div class="activity-title">${activity.title}</div>
              ${activity.notes ? `<div class="activity-desc">${activity.notes}</div>` : ''}
              ${activity.due_date ? `<div class="activity-meta"><strong>Due:</strong> ${activity.due_date}</div>` : ''}
            </div>
          </div>
        `);
      });
      win.document.write(`</div>`);
    }

    if (otherActivities.length > 0) {
      win.document.write(`<div class="section"><div class="section-title">Other Activities</div>`);
      otherActivities.forEach(activity => {
        const freqLabel = activity.frequency === 'biweekly' ? 'Bi-Weekly' : 'Monthly';
        win.document.write(`
          <div class="activity-item">
            <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
            <div class="activity-content">
              <div class="activity-title">${activity.title}</div>
              <div class="activity-meta"><strong>${freqLabel}</strong></div>
              ${activity.notes ? `<div class="activity-desc">${activity.notes}</div>` : ''}
              ${activity.due_date ? `<div class="activity-meta"><strong>Next Due:</strong> ${activity.due_date}</div>` : ''}
            </div>
          </div>
        `);
      });
      win.document.write(`</div>`);
    }

    win.document.write(`</body></html>`);
    win.document.close();
    win.print();
  };

  const handleEmailAllLearnerPlans = async () => {
    const visibleLearnerIds = filterLearner === "all" ? learners.map(l => l.id) : [filterLearner];
    const emailTitle = filterLearner === "all"
      ? "Weekly Education Schedule"
      : `${learners.find(l => l.id === filterLearner)?.name || ""} - Weekly Education Schedule`;

    const learnerPlansToShow = plans
      .filter(p => visibleLearnerIds.includes(p.learner_id))
      .filter(p => !filterSubject || p.subject === filterSubject);

    const activityFilter = showDueToday ? isActivityDueToday
      : showOverdue ? isActivityOverdue
      : showUpcoming ? isActivityUpcoming
      : showCompleted ? (a) => a.completed && a.frequency === "once"
      : () => true;

    const learnerActivities = activities
      .filter(a => visibleLearnerIds.includes(a.learner_id))
      .filter(a => !filterSubject || a.subject === filterSubject)
      .filter(activityFilter);

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayMap = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };

    let htmlBody = `<h1 style="font-size: 28px; margin-bottom: 8px;">${emailTitle}</h1>`;
    htmlBody += `<p style="color: #666; margin-bottom: 30px; font-size: 12px;">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>`;

    // Learning Plans
    if (learnerPlansToShow.length > 0) {
      htmlBody += `<h2 style="font-size: 18px; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 15px;">Learning Plans</h2>`;
      learnerPlansToShow.forEach(plan => {
        htmlBody += `
          <div style="margin-bottom: 15px; padding-bottom: 12px; border-bottom: 1px solid #e0e0e0;">
            <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px;">${plan.title}</div>
            ${plan.description ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">${plan.description}</div>` : ''}
            <div style="font-size: 11px; color: #888; line-height: 1.5;">
              ${plan.materials ? `<div><strong>Materials:</strong> ${plan.materials}</div>` : ''}
              ${plan.due_date ? `<div><strong>Target Date:</strong> ${plan.due_date}</div>` : ''}
              ${plan.notes ? `<div><strong>Notes:</strong> ${plan.notes}</div>` : ''}
            </div>
          </div>
        `;
      });
    }

    // Organize weekly activities by day
    const activitiesByDay = {};
    daysOfWeek.forEach(day => { activitiesByDay[day] = []; });
    learnerActivities
      .filter(a => a.frequency === 'weekly' && a.days_of_week?.length > 0)
      .forEach(activity => {
        activity.days_of_week.forEach(shortDay => {
          const fullDay = dayMap[shortDay] || shortDay;
          if (activitiesByDay[fullDay]) activitiesByDay[fullDay].push(activity);
        });
      });

    const dailyActivities = learnerActivities.filter(a => a.frequency === 'daily');
    const onceActivities = learnerActivities.filter(a => a.frequency === 'once');
    const otherActivities = learnerActivities.filter(a => ['biweekly', 'monthly'].includes(a.frequency));

    // Daily Activities
    if (dailyActivities.length > 0) {
      htmlBody += `<h2 style="font-size: 18px; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 15px;">Daily Activities</h2>`;
      dailyActivities.forEach(activity => {
        htmlBody += `
          <div style="margin-bottom: 18px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; display: flex; gap: 8px; align-items: flex-start;">
            <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px;">${activity.title}</div>
              ${activity.notes ? `<div style="font-size: 12px; color: #666;">${activity.notes}</div>` : ''}
            </div>
          </div>
        `;
      });
    }

    // Weekly Activities by Day
    if (Object.values(activitiesByDay).some(arr => arr.length > 0)) {
      htmlBody += `<h2 style="font-size: 18px; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 15px;">Weekly Activities</h2>`;
      daysOfWeek.forEach(day => {
        const dayActivities = activitiesByDay[day];
        if (dayActivities.length === 0) return;
        htmlBody += `<h3 style="font-size: 16px; font-weight: bold; margin-top: 25px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #333;">${day}</h3>`;
        dayActivities.forEach(activity => {
          htmlBody += `
            <div style="margin-bottom: 18px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; display: flex; gap: 8px; align-items: flex-start;">
              <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px;">${activity.title}</div>
                ${activity.notes ? `<div style="font-size: 12px; color: #666;">${activity.notes}</div>` : ''}
              </div>
            </div>
          `;
        });
      });
    }

    // One-Time Activities
    if (onceActivities.length > 0) {
      htmlBody += `<h2 style="font-size: 18px; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 15px;">One-Time Activities</h2>`;
      onceActivities.forEach(activity => {
        htmlBody += `
          <div style="margin-bottom: 18px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; display: flex; gap: 8px; align-items: flex-start;">
            <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px;">${activity.title}</div>
              ${activity.notes ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">${activity.notes}</div>` : ''}
              ${activity.due_date ? `<div style="font-size: 11px; color: #777;"><strong>Due:</strong> ${activity.due_date}</div>` : ''}
            </div>
          </div>
        `;
      });
    }

    // Other Activities
    if (otherActivities.length > 0) {
      htmlBody += `<h2 style="font-size: 18px; border-bottom: 3px solid #333; padding-bottom: 10px; margin-bottom: 15px;">Other Activities</h2>`;
      otherActivities.forEach(activity => {
        const freqLabel = activity.frequency === 'biweekly' ? 'Bi-Weekly' : 'Monthly';
        htmlBody += `
          <div style="margin-bottom: 18px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; display: flex; gap: 8px; align-items: flex-start;">
            <input type="checkbox" style="margin-top: 3px; min-width: 16px;" />
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px;">${activity.title}</div>
              <div style="font-size: 11px; color: #777; margin-bottom: 6px;"><strong>${freqLabel}</strong></div>
              ${activity.notes ? `<div style="font-size: 12px; color: #666; margin-bottom: 6px;">${activity.notes}</div>` : ''}
              ${activity.due_date ? `<div style="font-size: 11px; color: #777;"><strong>Next Due:</strong> ${activity.due_date}</div>` : ''}
            </div>
          </div>
        `;
      });
    }

    const user = await base44.auth.me();
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: emailTitle,
      body: htmlBody,
    });
    alert("Sent to your email!");
  };

  const learnerPlans = plans.filter((p) => p.learner_id === activeLearner);
  const allSubjectsForLearner = [...new Set(learnerPlans.map((p) => p.subject))];

  const showDueToday = filterStatus === "due-today";
  const showOverdue = filterStatus === "overdue";
  const showAll = filterStatus === "all";
  const showCompleted = filterStatus === "done";
  const showUpcoming = filterStatus === "next";

  const isActivityUpcoming = (a) => {
    if (a.completed) return false;
    const d = a.due_date ? new Date(a.due_date + 'T00:00:00') : null;
    if (!d) return false;
    const diff = (d - currentToday) / 86400000;
    return diff > 0 && diff <= 7;
  };

  const getFilteredItems = (filterFn, plansOnly = false) => {
    const planKeys = plans
      .filter(p => filterLearner === "all" || p.learner_id === filterLearner)
      .filter(p => !filterSubject || p.subject === filterSubject)
      .map(p => `${p.learner_id}||${p.subject}`);
    if (plansOnly) {
      return [...new Set(planKeys)]
        .map(key => { const [learnerId, subject] = key.split('||'); return { learnerId, subject }; });
    }
    const activityKeys = activities
      .filter(a => filterLearner === "all" || a.learner_id === filterLearner)
      .filter(a => !filterSubject || a.subject === filterSubject)
      .filter(filterFn)
      .map(a => `${a.learner_id}||${a.subject}`);
    return [...new Set(activityKeys)]
      .map(key => { const [learnerId, subject] = key.split('||'); return { learnerId, subject }; });
  };

  const dueItems = showDueToday ? getFilteredItems(isActivityDueToday)
    : showOverdue ? getFilteredItems(isActivityOverdue)
    : showUpcoming ? getFilteredItems(isActivityUpcoming)
    : showCompleted ? getFilteredItems(a => a.completed && a.frequency === "once")
    : null;

  // Build a flat list of {learnerId, subject} pairs for the "all" fallback render
  const subjectRows = (filterLearner !== "all"
    ? [...new Set(plans.filter(p => p.learner_id === filterLearner).map(p => p.subject))]
        .map(subject => ({ learnerId: filterLearner, subject }))
    : learners.flatMap(l =>
        [...new Set(plans.filter(p => p.learner_id === l.id).map(p => p.subject))]
          .map(subject => ({ learnerId: l.id, subject }))
      )
  ).filter(r => !filterSubject || r.subject === filterSubject);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <EducationOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onDontRemind={() => { setShowOnboarding(false); localStorage.setItem("education_onboarded", "1"); }}
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <Dialog open={learnerDialog} onOpenChange={setLearnerDialog}>
            <DialogTrigger asChild><Button size="icon" variant="outline" title="Manage learners" className="bg-secondary/50"><Users className="w-4 h-4" /></Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Manage Learners</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase mb-2 block">Add New Learner</Label>
                  <div className="space-y-3 p-3 rounded bg-muted/50">
                    <div><Label>Name</Label><Input value={learnerForm.name} onChange={(e) => setLearnerForm({ ...learnerForm, name: e.target.value })} /></div>
                    <div><Label>Grade Level</Label><Input value={learnerForm.grade_level} onChange={(e) => setLearnerForm({ ...learnerForm, grade_level: e.target.value })} placeholder="e.g. 5th Grade" /></div>
                    <Button onClick={createLearner} className="w-full">Add Learner</Button>
                  </div>
                </div>
                {learners.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase mb-2 block">Learners</Label>
                    <div className="space-y-2 border-t border-border pt-3">
                      {learners.map((learner) => (
                        <SwipeableListItem key={learner.id} onDelete={() => deleteLearner(learner.id)}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: learner.color }} />
                            <div>
                              <p className="text-sm font-medium">{learner.name}</p>
                              {learner.grade_level && <p className="text-xs text-muted-foreground">{learner.grade_level}</p>}
                            </div>
                          </div>
                        </SwipeableListItem>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <ActivityLibrary
            learners={learners}
            plans={plans}
            onSaveActivity={loadData}
            onCreateGoal={createGoalFromEducation}
          />

          <ActivityGenerator
            learners={learners}
            plans={plans}
            onActivitiesCreated={() => loadData()}
          />

          <Dialog open={planDialog} onOpenChange={setPlanDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" /> Edu Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New EDU Plan</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {planError && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{planError}</p>}
                <div>
                  <Label>Learner</Label>
                  <Select value={planForm.learner_id || activeLearner || ""} onValueChange={(v) => setPlanForm({ ...planForm, learner_id: v })}>
                    <SelectTrigger><SelectValue placeholder={learners.length === 0 && currentUser ? currentUser.full_name : undefined} /></SelectTrigger>
                    <SelectContent>
                      {learners.length === 0 && currentUser ? (
                        <SelectItem value={null}>{currentUser.full_name}</SelectItem>
                      ) : (
                        learners.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subject(s)</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {allSubjects.map((s) => (
                      <button key={s} type="button" onClick={() => toggleSubject(s)}
                        className={cn("px-3 py-1 rounded-full text-xs border transition-colors", planForm.subjects.includes(s) ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="Add custom subject..." className="h-8 text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addCustomSubject()} />
                      <Button size="sm" variant="outline" className="h-8 bg-secondary/500" onClick={addCustomSubject}><Plus className="w-3 h-3" /></Button>
                  </div>
                  {planForm.subjects.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{planForm.subjects.join(", ")} selected</p>
                  )}
                </div>

                <div>
                  <Label>Completion Date (Optional)</Label>
                  <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="outline" className="w-full justify-start bg-secondary/50">
                       <CalendarIcon className="w-4 h-4 mr-2" />
                       {planForm.due_date ? format(new Date(planForm.due_date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                     </Button>
                   </PopoverTrigger>
                    <PopoverContent align="start">
                      <Calendar
                        mode="single"
                        selected={planForm.due_date ? new Date(planForm.due_date + "T00:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) setPlanForm({ ...planForm, due_date: date.toISOString().split("T")[0] });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div><Label>Description</Label><Textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} /></div>
                <div><Label>Materials</Label><Input value={planForm.materials} onChange={(e) => setPlanForm({ ...planForm, materials: e.target.value })} placeholder="Textbook, worksheet..." /></div>
                <div><Label>Notes</Label><Textarea value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} /></div>
                <Button onClick={createPlan} className="w-full">Create EDU Plan</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>




      {/* Edit Plan Dialog */}
      <Dialog open={editPlanDialog} onOpenChange={setEditPlanDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Subject: {editPlanForm?.subject}</DialogTitle></DialogHeader>
          {editPlanForm && (
            <div className="space-y-4">
              <div>
                <Label>Completion Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="outline" className="flex-1 justify-start bg-secondary/50">
                       <CalendarIcon className="w-4 h-4 mr-2" />
                       {editPlanForm.due_date ? format(new Date(editPlanForm.due_date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                     </Button>
                   </PopoverTrigger>
                    <PopoverContent align="start">
                      <Calendar
                        mode="single"
                        selected={editPlanForm.due_date ? new Date(editPlanForm.due_date + "T00:00:00") : undefined}
                        onSelect={(date) => {
                          if (date) setEditPlanForm({ ...editPlanForm, due_date: date.toISOString().split("T")[0] });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {editPlanForm.due_date && <button onClick={() => setEditPlanForm({ ...editPlanForm, due_date: "" })} className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></button>}
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center"><Label>Description</Label>{editPlanForm.description && <button onClick={() => setEditPlanForm({ ...editPlanForm, description: "" })} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>}</div>
                <Textarea value={editPlanForm.description || ""} onChange={(e) => setEditPlanForm({ ...editPlanForm, description: e.target.value })} />
              </div>
              <div>
                <div className="flex justify-between items-center"><Label>Materials</Label>{editPlanForm.materials && <button onClick={() => setEditPlanForm({ ...editPlanForm, materials: "" })} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>}</div>
                <Input value={editPlanForm.materials || ""} onChange={(e) => setEditPlanForm({ ...editPlanForm, materials: e.target.value })} placeholder="Textbook, worksheet..." />
              </div>
              <div>
                <div className="flex justify-between items-center"><Label>Notes</Label>{editPlanForm.notes && <button onClick={() => setEditPlanForm({ ...editPlanForm, notes: "" })} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>}</div>
                <Textarea value={editPlanForm.notes || ""} onChange={(e) => setEditPlanForm({ ...editPlanForm, notes: e.target.value })} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={saveEditPlan} className="flex-1">Save Changes</Button>
                <Button variant="destructive" onClick={deleteSubjectFromDialog} className="flex items-center gap-1"><Trash2 className="w-4 h-4" /> Delete Subject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {activityForm.type === "assignment" ? "Assignment" : "Activity"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1.5">
                {["assignment", "activity"].map((t) => (
                  <button key={t} type="button" onClick={() => setActivityForm({ ...activityForm, type: t })}
                    className={cn("px-4 py-1.5 rounded-full text-xs border capitalize transition-colors", activityForm.type === t ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Title</Label><Input value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} placeholder="e.g. Chapter 5 worksheet" /></div>
            <div>
              <Label>Frequency</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {Object.entries(frequencyLabels).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setActivityForm({ ...activityForm, frequency: val, days_of_week: [] })}
                    className={cn("px-3 py-1 rounded-full text-xs border transition-colors", activityForm.frequency === val ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {(activityForm.frequency === "weekly" || activityForm.frequency === "biweekly") && (
              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {daysOfWeek.map((day) => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={cn("w-10 h-10 rounded-full text-xs border transition-colors font-medium", activityForm.days_of_week.includes(day) ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Due Date (Optional)</Label>
              <Popover>
               <PopoverTrigger asChild>
                 <Button variant="outline" className="w-full justify-start bg-secondary/50">
                   <CalendarIcon className="w-4 h-4 mr-2" />
                   {activityForm.due_date ? format(new Date(activityForm.due_date + "T00:00:00"), "MMM d, yyyy") : "Pick date"}
                 </Button>
               </PopoverTrigger>
                <PopoverContent align="start">
                  <Calendar
                    mode="single"
                    selected={activityForm.due_date ? new Date(activityForm.due_date + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) setActivityForm({ ...activityForm, due_date: date.toISOString().split("T")[0] });
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div><Label>Notes</Label><Textarea value={activityForm.notes} onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })} /></div>
            <Button onClick={createActivity} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* Learner Dropdown Filter */}
      {learners.length === 0 ? (
        <WidgetCard title="Getting Started" id="edu-empty">
          <p className="text-sm text-muted-foreground text-center py-8">Add a learner to get started with education planning.</p>
        </WidgetCard>
      ) : (
        <WidgetCard title="Education Plan" id="edu-main" headerRight={
          activeLearner ? (
            <div className="flex items-center gap-1 no-print">
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={handlePrintAllLearnerPlans} title="Print education schedule">
                <Printer className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={handleEmailAllLearnerPlans} title="Email education schedule">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          ) : null
        }>
          <div className="space-y-4">
            {/* Quick-jump filter pills */}
            <div className="no-print flex flex-wrap gap-2 items-center">
              {[
                { key: "due-today", label: "Due", value: activities.filter(a => filterLearner === "all" || a.learner_id === filterLearner).filter(isActivityDueToday).length, color: "text-blue-400", activeClass: "bg-blue-500/20 text-blue-300 border-blue-500/50" },
                { key: "overdue", label: "Past", value: activities.filter(a => filterLearner === "all" || a.learner_id === filterLearner).filter(isActivityOverdue).length, color: "text-red-400", activeClass: "bg-red-500/20 text-red-300 border-red-500/50" },
                { key: "next", label: "Next", value: activities.filter(a => filterLearner === "all" || a.learner_id === filterLearner).filter(a => { if (a.completed) return false; const d = a.due_date ? new Date(a.due_date + 'T00:00:00') : null; if (!d) return false; const diff = (d - currentToday) / 86400000; return diff > 0 && diff <= 7; }).length, color: "text-amber-400", activeClass: "bg-amber-500/20 text-amber-300 border-amber-500/50" },
                { key: "done", label: "Done", value: activities.filter(a => filterLearner === "all" || a.learner_id === filterLearner).filter(a => a.completed && a.frequency === "once").length, color: "text-green-400", activeClass: "bg-green-500/20 text-green-300 border-green-500/50" },
                { key: "all", label: "All", value: activities.filter(a => filterLearner === "all" || a.learner_id === filterLearner).length, color: "text-foreground", activeClass: "bg-primary text-primary-foreground border-primary" },
              ].map(({ key, label, value, color, activeClass }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    filterStatus === key
                      ? activeClass
                      : "bg-black/20 border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"
                  )}
                >
                  {label}
                  <span className={cn("font-bold tabular-nums", filterStatus === key ? "" : color)}>{value}</span>
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                {learners.length >= 2 && (
                  <Select value={filterLearner} onValueChange={(v) => { setFilterLearner(v); if (v !== "all") setActiveLearner(v); }}>
                    <SelectTrigger className="w-36 bg-primary text-primary-foreground h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Learners</SelectItem>
                      {learners.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}{l.grade_level ? ` (${l.grade_level})` : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {/* Subject filter */}
                {(() => {
                  const availableSubjects = filterLearner !== "all"
                    ? [...new Set(plans.filter(p => p.learner_id === filterLearner).map(p => p.subject))]
                    : [...new Set(plans.map(p => p.subject))];
                  return availableSubjects.length > 1 ? (
                    <Select value={filterSubject || "all"} onValueChange={v => setFilterSubject(v === "all" ? "" : v)}>
                      <SelectTrigger className="w-36 bg-secondary/80 h-8 text-xs">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {availableSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : null;
                })()}
                <button onClick={() => { setAllCollapsed(prev => !prev); setExpandedExceptions(new Set()); }} className="h-8 w-8 flex items-center justify-center rounded-md bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title={allCollapsed ? "Expand all" : "Collapse all"}>
                  {allCollapsed ? <ChevronsUpDown className="w-4 h-4" /> : <ChevronsDownUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {dueItems !== null && dueItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {showDueToday ? "Nothing due today." : showOverdue ? "No past items." : showUpcoming ? "Nothing due in the next 7 days." : showCompleted ? "No completed items." : "No items found."}
              </p>
            ) : dueItems !== null ? (
              learners
                .filter(l => dueItems.some(d => d.learnerId === l.id))
                .map(learner => {
                  const activityFilter = showDueToday ? isActivityDueToday : showOverdue ? isActivityOverdue : showUpcoming ? isActivityUpcoming : showCompleted ? (a) => a.completed && a.frequency === "once" : showAll ? () => true : () => true;
                  return (
                    <div key={learner.id} className="space-y-4">
                      <h2 className={cn(
                        "font-display text-xl font-semibold border-b border-border pb-2",
                        showDueToday ? "text-blue-400" :
                        showOverdue ? "text-red-400" :
                        showUpcoming ? "text-amber-400" :
                        showCompleted ? "text-green-400" :
                        "text-purple-400"
                      )}>{learner.name}</h2>
                      {dueItems.filter(d => d.learnerId === learner.id).map(({ learnerId, subject }) => {
                        const subjectPlans = plans.filter((p) => p.learner_id === learnerId && p.subject === subject);
                        const subjectActivities = activities.filter((a) =>
                          a.learner_id === learnerId && a.subject === subject && activityFilter(a)
                        );
                        const cardKey = `${learnerId}-${subject}`;
                        return <SubjectCard key={cardKey} learnerId={learnerId} subject={subject} subjectPlans={subjectPlans} subjectActivities={subjectActivities} frequencyLabels={frequencyLabels} openEditPlan={openEditPlan} openActivityDialog={openActivityDialog} deletePlan={deletePlan} deleteActivity={deleteActivity} toggleActivity={toggleActivity} forceCollapsed={allCollapsed && !expandedExceptions.has(cardKey)} defaultExpanded={showDueToday || showOverdue || showUpcoming} onIndividualToggle={(key) => setExpandedExceptions(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })} />;
                      })}
                    </div>
                  );
                })
            ) : subjectRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Add an EDU plan for this learner.</p>
            ) : (
              learners
                .filter(l => subjectRows.some(r => r.learnerId === l.id))
                .flatMap(learner => {
                  const rows = subjectRows.filter(r => r.learnerId === learner.id);
                  const showLearnerHeader = filterLearner === "all" && learners.length >= 2;
                  return [
                    showLearnerHeader && (
                      <h2 key={`header-${learner.id}`} className="font-display text-xl font-semibold border-b border-border pb-2 text-purple-400">
                        {learner.name}
                      </h2>
                    ),
                    ...rows.map(({ learnerId, subject }) => {
                      const subjectPlans = plans.filter((p) => p.learner_id === learnerId && p.subject === subject);
                      const subjectActivities = activities.filter((a) => a.learner_id === learnerId && a.subject === subject);
                      const cardKey = `${learnerId}-${subject}`;
                      return <SubjectCard key={cardKey} learnerId={learnerId} subject={subject} subjectPlans={subjectPlans} subjectActivities={subjectActivities} frequencyLabels={frequencyLabels} openEditPlan={openEditPlan} openActivityDialog={openActivityDialog} deletePlan={deletePlan} deleteActivity={deleteActivity} toggleActivity={toggleActivity} forceCollapsed={allCollapsed && !expandedExceptions.has(cardKey)} onIndividualToggle={(key) => setExpandedExceptions(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; })} />;
                    })
                  ].filter(Boolean);
                })
            )}
          </div>
        </WidgetCard>
        )}
      </div>
    );
}