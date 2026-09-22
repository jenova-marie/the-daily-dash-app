import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

/**
 * Returns a map of { [checklist_item_id]: count } for the current Sun-Sat week.
 * Resets every Sunday at midnight (naturally, since dates are recomputed on each call).
 */
export function useWeeklyChecklistCounts() {
  const [counts, setCounts] = useState({});

  const load = async () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });     // Saturday
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(d => format(d, "yyyy-MM-dd"));

    // Fetch all completions for this week
    const allCompletions = await Promise.all(
      days.map(date => base44.entities.ChecklistCompletion.filter({ date }))
    );
    const flat = allCompletions.flat();

    const map = {};
    flat.forEach(c => {
      if (c.completed) {
        map[c.checklist_item_id] = (map[c.checklist_item_id] || 0) + 1;
      }
    });
    setCounts(map);
  };

  useEffect(() => {
    load();

    // Re-load at midnight Sunday to reset
    const scheduleReset = () => {
      const now = new Date();
      const nextSunday = new Date(now);
      const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(0, 0, 0, 0);
      const ms = nextSunday.getTime() - now.getTime();
      return setTimeout(() => { load(); scheduleReset(); }, ms);
    };

    const timer = scheduleReset();
    return () => clearTimeout(timer);
  }, []);

  return { counts, reload: load };
}