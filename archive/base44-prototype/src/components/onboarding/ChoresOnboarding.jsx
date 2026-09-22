import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Home, Users, RotateCw, CheckCircle2, UtensilsCrossed } from "lucide-react";

const steps = [
  {
    icon: <Home className="w-8 h-8 text-primary" />,
    title: "1. Add Your Household Chores",
    desc: "Click 'Add Chore' to create tasks for your home — like cleaning, laundry, or yard work. Chores are automatically assigned to you, but you can add household members anytime to share responsibility."
  },
  {
    icon: <UtensilsCrossed className="w-8 h-8 text-orange-400" />,
    title: "2. Generate Meal Ideas with AI",
    desc: "Use the AI Wand button and select 'Meal' as the type. Choose Breakfast, Lunch, Dinner, or Snack — and pick an age group (including ages 3–5 for young children) to get personalized, age-appropriate meal suggestions."
  },
  {
    icon: <Users className="w-8 h-8 text-accent" />,
    title: "3. Invite Household Members",
    desc: "Use the people icon to add household members and reassign chores or meal tasks to them. Optionally organize by room and priority level so everyone knows what's expected."
  },
  {
    icon: <RotateCw className="w-8 h-8 text-blue-400" />,
    title: "4. Set Frequencies & Due Dates",
    desc: "Configure chores as daily, weekly, biweekly, or monthly. The app tracks when each was last completed so nothing slips through the cracks. Overdue items are highlighted automatically."
  },
  {
    icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
    title: "5. Track Completion",
    desc: "Mark chores as complete, skip, or pending. Completed chores show their last-done date. Use filters to view by member or status — keeping everyone accountable."
  }
];

export default function ChoresOnboarding({ open, onClose, onDontRemind }) {
  const dismiss = () => {
    localStorage.setItem("chores_onboarded", "1");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Chores</DialogTitle>
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