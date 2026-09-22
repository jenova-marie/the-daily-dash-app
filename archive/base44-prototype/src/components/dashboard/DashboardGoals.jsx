import { useState, useEffect, useRef } from "react";
import { ChevronRight, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Progress } from "@/components/ui/progress";
import { format, parseISO, isToday, startOfWeek, startOfMonth, startOfYear, isBefore, isAfter } from "date-fns";

function CollapsibleGroup({ label, goals, onCheckGoal }) {
  const [open, setOpen] = useState(false);

  const isGoalDue = (goal) => {
    const today = new Date();
    if (goal.target_date) {
      const dueDate = parseISO(goal.target_date);
      return isBefore(dueDate, today) || isToday(dueDate);
    }
    switch (goal.timeframe) {
      case 'daily':
        return true;
      case 'weekly':
        return true;
      case 'monthly':
        return true;
      case 'annual':
        return true;
      case 'occurrences':
        return true;
      default:
        return false;
    }
  };

  const dueSoonGoals = goals.filter(isGoalDue);

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 w-full text-left mb-1 group"
      >
        <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
        <span className="text-xs text-muted-foreground ml-1">({dueSoonGoals.length})</span>
      </button>
      {open && (
        <div className="space-y-2 pl-4">
          {dueSoonGoals.map((goal) => (
            <div key={goal.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate flex-1">{goal.title}</p>
                {goal.member_name && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{goal.member_name}</span>}
                <button
                  onClick={() => onCheckGoal(goal.id)}
                  className="p-1 hover:bg-primary/20 rounded transition-colors shrink-0"
                  title="Mark as complete"
                >
                  <Check className="w-4 h-4 text-primary" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={goal.progress || 0} className="h-1.5" />
                <span className="text-xs text-muted-foreground w-8">{goal.progress || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardGoals() {
   const [goals, setGoals] = useState([]);

   const loadGoals = async () => {
     const data = await base44.entities.Goal.filter({ archived: false }, "-created_date", 100);
     setGoals(data);
   };

   const debounceTimer = useRef(null);
   const lastLoadTime = useRef(0);

   useEffect(() => {
     loadGoals();
     const unsubscribe = base44.entities.Goal.subscribe(() => {
       clearTimeout(debounceTimer.current);
       debounceTimer.current = setTimeout(() => {
         const now = Date.now();
         if (now - lastLoadTime.current > 2000) {
           lastLoadTime.current = now;
           loadGoals();
         }
       }, 1000);
     });
     return () => {
       clearTimeout(debounceTimer.current);
       unsubscribe();
     };
   }, []);

  const timeframeLabels = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    annual: "Annual",
    "3_year": "3 Year",
    "5_year": "5 Year",
    occurrences: "Occurrences",
  };

  const handleCheckGoal = async (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    const updates = { status: "completed", progress: 100, completed_at: new Date().toISOString() };
    if (!goal?.started_at) updates.started_at = new Date().toISOString();
    await base44.entities.Goal.update(goalId, updates);
    loadGoals();
  };

  const activeGoals = goals.filter(g => g.status !== "completed");
  const grouped = {};
  activeGoals.forEach(goal => {
    if (!grouped[goal.timeframe]) grouped[goal.timeframe] = [];
    grouped[goal.timeframe].push(goal);
  });

  if (goals.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No goals</p>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([timeframe, goalsInGroup]) => (
        <CollapsibleGroup key={timeframe} label={timeframeLabels[timeframe]} goals={goalsInGroup} onCheckGoal={handleCheckGoal} />
      ))}
    </div>
  );
}