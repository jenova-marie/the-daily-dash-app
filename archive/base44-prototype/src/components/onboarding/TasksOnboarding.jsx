import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Tag, RotateCw, ListTodo } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "tasks_onboarded";

const steps = [
  {
    icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
    title: "1. Create & Prioritize Tasks",
    desc: "Click 'Add Task' to create a task with a title, description, priority (Low, Medium, High, Urgent), due date, and time. Click the checkbox to mark it complete. Double-tap or double-click any task to edit it inline."
  },
  {
    icon: <Tag className="w-8 h-8 text-blue-400" />,
    title: "2. Use Labels & Categories",
    desc: "Assign a custom label and color to each task for easy grouping. The app remembers your recently used labels so you can quickly reapply them. Switch the sort view to 'Group by Label' to focus on one area at a time."
  },
  {
    icon: <RotateCw className="w-8 h-8 text-purple-400" />,
    title: "3. Set Recurring Tasks",
    desc: "Set a task to repeat Daily, Weekly, or Monthly. Weekly tasks let you pick specific days of the week. When you complete a recurring task it automatically resets for the next due period — perfect for habits and routines."
  },
  {
    icon: <ListTodo className="w-8 h-8 text-accent" />,
    title: "4. Filter, Sort & Add to Schedule",
    desc: "Filter by Active, Due Today, Overdue, Upcoming, or Completed. Use 'Select' for batch deletion. Swipe left on any task to delete it. Tasks with a due date and time can be pushed directly to the Daily Schedule — they'll appear as time blocks on the grid."
  }
];

export default function TasksOnboarding({ open, onClose }) {
  const dismiss = async () => {
    localStorage.setItem(STORAGE_KEY, "true");
    try {
      const themeSettings = await base44.entities.ThemeSettings.list("-updated_date", 1);
      let settings = themeSettings[0];
      if (!settings) {
        settings = await base44.entities.ThemeSettings.create({ onboarding_status: "{}" });
      }
      const status = JSON.parse(settings.onboarding_status || "{}");
      status[STORAGE_KEY] = true;
      await base44.entities.ThemeSettings.update(settings.id, { onboarding_status: JSON.stringify(status) });
    } catch {}
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Task Manager</DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Here's how to get the most out of this page — it only takes a minute!
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2 overflow-y-auto flex-1 pr-1">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="shrink-0 mt-0.5">{step.icon}</div>
              <div>
                <p className="font-semibold text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button className="w-full" onClick={dismiss}>
            Got it — Don't Remind Me Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}