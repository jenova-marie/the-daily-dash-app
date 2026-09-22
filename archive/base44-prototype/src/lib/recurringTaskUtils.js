import { format } from "date-fns";

export const shouldTaskShowToday = (task) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const todayDate = new Date(today);
  const dayOfWeek = todayDate.getDay(); // 0=Sun, 6=Sat

  // If task has explicit due_date and it's due/overdue, always show
  if (task.due_date && task.due_date <= today && task.status === "pending") {
    return true;
  }

  // Check recurring patterns
  if (!task.is_recurring) return false;

  if (task.recurrence_pattern === "daily") {
    return true;
  }

  if (task.recurrence_pattern === "weekly") {
    // For weekly: task should appear if today matches the due_date's day of week
    // or if it has explicit day_of_week info (if stored)
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      return dueDate.getDay() === dayOfWeek;
    }
    return true;
  }

  if (task.recurrence_pattern === "monthly") {
    // For monthly: check if today matches the day of month from due_date or last_completed_date
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      return dueDate.getDate() === todayDate.getDate();
    }
    if (task.last_completed_date) {
      const lastDate = new Date(task.last_completed_date);
      return lastDate.getDate() === todayDate.getDate();
    }
    return true;
  }

  return false;
};