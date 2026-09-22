import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import WidgetCard from "../WidgetCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Utensils, CheckSquare, ChevronRight, ChevronDown } from "lucide-react";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Meal"];
const isMealType = (t) => MEAL_TYPES.includes(t);
const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = { Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday" };

const MEAL_TYPE_COLORS = {
  Breakfast: "text-amber-400",
  Lunch: "text-green-400",
  Dinner: "text-blue-400",
  Snack: "text-purple-400",
  Meal: "text-orange-400",
};

const calculateNextDueDate = (frequency, fromDate = new Date()) => {
  const newDate = new Date(fromDate);
  if (frequency === "daily") newDate.setDate(newDate.getDate() + 1);
  else if (frequency === "weekly") newDate.setDate(newDate.getDate() + 7);
  else if (frequency === "biweekly") newDate.setDate(newDate.getDate() + 14);
  else if (frequency === "monthly") newDate.setMonth(newDate.getMonth() + 1);
  else if (frequency === "quarterly") newDate.setMonth(newDate.getMonth() + 3);
  else if (frequency === "yearly") newDate.setFullYear(newDate.getFullYear() + 1);
  return newDate.toISOString().split("T")[0];
};

export default function DashboardMenuChores() {
  const [chores, setChores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collapsedUsers, setCollapsedUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dashboard_menuchores_collapsed")) || {}; } catch { return {}; }
  });
  const lastLoadTime = useRef(0);
  const isUpdatingRef = useRef(false);

  const toggleUserCollapse = (uid) => {
    setCollapsedUsers((prev) => {
      const next = { ...prev, [uid]: !prev[uid] };
      try { localStorage.setItem("dashboard_menuchores_collapsed", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const loadData = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastLoadTime.current < 800) return;
    lastLoadTime.current = now;
    try {
      const [c, u] = await Promise.all([
        base44.entities.Chore.list("-created_date", 500),
        base44.entities.ChoreUser.list(),
      ]);
      setChores(c);
      setUsers(u);
    } catch (e) {
      console.error("DashboardMenuChores load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const handler = () => {
      if (isUpdatingRef.current) return;
      setTimeout(() => loadData(true), 300);
    };
    const unsub = base44.entities.Chore.subscribe(handler);
    return () => unsub();
  }, []);

  const getUserName = (id) => users.find((u) => u.id === id)?.name || "Unassigned";
  const getUserColor = (id) => users.find((u) => u.id === id)?.color;

  const today = new Date();
  const todayShort = DAYS_SHORT[today.getDay()];
  const todayDayFull = DAY_FULL[todayShort];
  const todayStr = format(today, "yyyy-MM-dd");
  const todayDayOfMonth = today.getDate();

  // Menu: today through Sunday
  const dayOfWeek = today.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const weekDays = [];
  for (let i = 0; i <= daysUntilSunday; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    weekDays.push(d);
  }

  const allMeals = chores.filter((c) => isMealType(c.chore_type) && c.status !== "completed");
  const getMealsForDay = (shortDay) =>
    allMeals.filter((m) => m.frequency === "daily" || m.day_of_week?.includes(shortDay));
  const getMealType = (m) => (MEAL_TYPES.includes(m.room) ? m.room : "Other");

  const isChoreDueToday = (c) => {
    if (c.status === "completed") return false;
    if (isMealType(c.chore_type)) return false;
    if (!c.assigned_to) return false;
    if (c.frequency === "daily") return true;
    if (c.frequency === "weekly" && c.day_of_week?.includes(todayDayFull)) return true;
    if (c.due_date === todayStr) return true;
    if (c.frequency === "monthly" && c.due_date) return parseInt(c.due_date.split("-")[2]) === todayDayOfMonth;
    return false;
  };

  const dueChores = chores.filter(isChoreDueToday);

  const byUser = {};
  dueChores.forEach((c) => {
    if (!byUser[c.assigned_to]) byUser[c.assigned_to] = {};
    const room = c.room || "No Location";
    if (!byUser[c.assigned_to][room]) byUser[c.assigned_to][room] = [];
    byUser[c.assigned_to][room].push(c);
  });

  const toggleChore = async (chore) => {
    const wasCompleted = chore.status === "completed";
    // Optimistic update
    setChores((prev) =>
      prev.map((c) =>
        c.id === chore.id
          ? { ...c, status: wasCompleted ? "pending" : "completed", last_completed_date: wasCompleted ? null : todayStr }
          : c
      )
    );
    isUpdatingRef.current = true;
    try {
      if (!wasCompleted) {
        const nextDue = chore.frequency !== "as_needed" ? calculateNextDueDate(chore.frequency) : null;
        await base44.entities.Chore.update(chore.id, {
          status: "completed",
          last_completed_date: todayStr,
          ...(nextDue ? { due_date: nextDue } : {}),
        });
      } else {
        await base44.entities.Chore.update(chore.id, { status: "pending", last_completed_date: null });
      }
    } catch (e) {
      // Revert on error
      setChores((prev) =>
        prev.map((c) =>
          c.id === chore.id ? { ...c, status: chore.status, last_completed_date: chore.last_completed_date } : c
        )
      );
      console.error("Toggle chore failed:", e);
    } finally {
      setTimeout(() => { isUpdatingRef.current = false; }, 500);
    }
  };

  return (
    <WidgetCard title="Menu & Chores" id="dashboard-menu-chores">
      <div className="space-y-4">
        {/* MENU */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Menu</h4>
          </div>
          {loading ? (
            <p className="text-xs text-muted-foreground/50 italic py-1">Loading...</p>
          ) : allMeals.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 italic py-1">No meals planned this week</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {weekDays.map((d) => {
                const shortDay = DAYS_SHORT[d.getDay()];
                const dayMeals = getMealsForDay(shortDay);
                if (dayMeals.length === 0) return null;
                const isToday = shortDay === todayShort;
                const byType = {};
                dayMeals.forEach((m) => {
                  const t = getMealType(m);
                  if (!byType[t]) byType[t] = [];
                  byType[t].push(m);
                });
                const activeTypes = [...MEAL_TYPES, "Other"].filter((t) => byType[t]?.length > 0);
                return (
                  <div
                    key={shortDay}
                    className={cn("rounded-lg border", isToday ? "border-primary/50 bg-primary/5" : "border-border/40 bg-muted/20")}
                  >
                    <div className="flex items-center px-2.5 py-1.5">
                      <span className={cn("text-xs font-bold uppercase tracking-wider flex-1", isToday ? "text-primary" : "text-muted-foreground")}>
                        {DAY_FULL[shortDay]}
                        {isToday && <span className="ml-1 text-[10px] normal-case font-normal opacity-70">today</span>}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {dayMeals.length} meal{dayMeals.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="px-2.5 pb-2 space-y-1.5">
                      {activeTypes.map((type) => (
                        <div key={type}>
                          <div className={cn("text-[10px] font-semibold uppercase tracking-wide mb-0.5", MEAL_TYPE_COLORS[type] || "text-foreground")}>
                            {type}
                          </div>
                          <div className="space-y-0.5">
                            {byType[type].map((meal) => (
                              <div key={meal.id} className="text-xs flex items-center gap-1.5">
                                <span className={cn(meal.status === "completed" && "line-through text-muted-foreground")}>{meal.title}</span>
                                {meal.assigned_to && users.length > 1 && (
                                  <span className="text-[10px] text-muted-foreground/50">· {getUserName(meal.assigned_to)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border" />

        {/* CHORES */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Chores Due Today</h4>
          </div>
          {loading ? (
            <p className="text-xs text-muted-foreground/50 italic py-1">Loading...</p>
          ) : dueChores.length === 0 ? (
            <p className="text-xs text-muted-foreground/50 italic py-1">No chores due today</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Object.entries(byUser).map(([uid, rooms]) => {
                const userName = getUserName(uid);
                const userColor = getUserColor(uid);
                const choreCount = Object.values(rooms).reduce((s, arr) => s + arr.length, 0);
                return (
                  <div key={uid} className="rounded-lg border border-border/40 bg-muted/20">
                    <button
                      onClick={() => toggleUserCollapse(uid)}
                      className="flex items-center gap-1.5 w-full px-2.5 py-1.5 border-b border-border/30 text-left hover:bg-muted/40 transition-colors"
                    >
                      {userColor && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: userColor }} />}
                      <span className="text-xs font-semibold flex-1">{userName}</span>
                      <span className="text-[10px] text-muted-foreground">{choreCount}</span>
                      {collapsedUsers[uid] ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60" />}
                    </button>
                    {!collapsedUsers[uid] && (
                    <div className="px-2.5 py-1.5 space-y-1.5">
                      {Object.entries(rooms).map(([room, roomChores]) => (
                        <div key={room}>
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 mb-0.5">
                            {room}
                          </div>
                          <div className="space-y-0.5">
                            {roomChores.map((chore) => {
                              const isCompleted = chore.status === "completed";
                              return (
                                <div key={chore.id} className="text-xs flex items-center gap-1.5">
                                  <Checkbox
                                    checked={isCompleted}
                                    onCheckedChange={() => toggleChore(chore)}
                                    className="h-3.5 w-3.5 shrink-0"
                                  />
                                  <span className={cn(isCompleted && "line-through text-muted-foreground")}>
                                    {chore.title}
                                  </span>
                                  {chore.time_estimate > 0 && (
                                    <span className="text-[10px] text-muted-foreground/50">{chore.time_estimate}m</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}