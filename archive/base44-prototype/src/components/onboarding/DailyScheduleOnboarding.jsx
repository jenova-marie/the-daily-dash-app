import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, BookOpen, Eye, Plus, CheckCircle2, ListTodo } from "lucide-react";

const steps = [
  {
    icon: <Clock className="w-8 h-8 text-primary" />,
    title: "1. Your Visual Day Organizer",
    desc: "The Daily Schedule is your visual canvas for the day — a planner, not a task manager. Lay out your hours intentionally so you can see exactly how your day is structured at a glance. Events, tasks, goals, chores, and education items all appear color-coded by source. The schedule loads only items for the selected date, so it's fast and focused."
  },
  {
    icon: <BookOpen className="w-8 h-8 text-blue-400" />,
    title: "2. The Item Library",
    desc: "The library panel contains all your tasks and goal milestone tasks. Items already placed on today's schedule are highlighted — so you can instantly see what's scheduled vs. what still needs a time slot. Items due today appear in blue; overdue in red. Pin items to the top of the library for quick access."
  },
  {
    icon: <Plus className="w-8 h-8 text-accent" />,
    title: "3. Placing Items on the Grid",
    desc: "Tap any library item, choose a start time and duration, and it drops onto the timeline. Use the + button to create a brand-new custom item directly on the schedule. Items snap into place side-by-side when they overlap so nothing gets hidden."
  },
  {
    icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
    title: "4. Completing Items",
    desc: "Mark items complete directly on the schedule grid by tapping the checkmark. Completing a task here also marks it complete in Tasks — and vice versa. They stay in sync so you never update two places."
  },
  {
    icon: <ListTodo className="w-8 h-8 text-purple-400" />,
    title: "5. Works with Your To-Do List",
    desc: "The schedule and the To-Do list (on the dashboard) work together. Scheduled items appear in your To-Do list for the day. When you complete something in either place it's reflected in both. Items removed from the schedule return to the library and can be rescheduled at any time."
  },
  {
    icon: <ListTodo className="w-8 h-8 text-blue-300" />,
    title: "6. How Tasks Work Here",
    desc: "Tasks from your Task Manager appear in the Item Library. Placing a task gives it a time slot for the day. Completing it on the schedule marks it done in Tasks too. Recurring tasks reset automatically and reappear each day they're due."
  },
  {
    icon: <Eye className="w-8 h-8 text-muted-foreground" />,
    title: "7. Control Your View",
    desc: "Toggle completed items on/off with the eye icon to keep the grid clean. Hide items from the grid without deleting them — they move to a hidden panel and can be restored anytime. Adjust your active day hours using the clock icon in the header. Use the print or email icons to export your schedule."
  }
];

export default function DailyScheduleOnboarding({ open, onClose, onDontRemind }) {
  const dismiss = () => {
    localStorage.setItem("schedule_onboarded", "1");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Daily Schedule</DialogTitle>
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