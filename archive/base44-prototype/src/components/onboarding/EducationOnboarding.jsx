import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, ClipboardList, CalendarCheck } from "lucide-react";

const steps = [
  {
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    title: "1. Create Subject Plans",
    desc: "Start by creating subject plans like Math, Reading, Science, or Art. Plans are assigned to you by default, but you can add other learners anytime. Give each plan a title, materials needed, and a target due date."
  },
  {
    icon: <GraduationCap className="w-8 h-8 text-accent" />,
    title: "2. Add Other Learners",
    desc: "Use the people icon to add multiple learners and manage their individual education journeys. You can reassign plans to different learners or keep them organized by subject."
  },
  {
    icon: <ClipboardList className="w-8 h-8 text-blue-400" />,
    title: "3. Add Assignments & Activities",
    desc: "Under each subject plan, add individual assignments or recurring activities. Set frequency (once, daily, weekly) and track completion. Recurring activities automatically reset so the schedule stays current."
  },
  {
    icon: <CalendarCheck className="w-8 h-8 text-green-400" />,
    title: "4. Track Progress & Sync to Schedule",
    desc: "Mark assignments as complete to track progress. Items can be synced to the Daily Schedule for time-blocked planning. View completion rates and manage everything from one dashboard."
  }
];

export default function EducationOnboarding({ open, onClose, onDontRemind }) {
  const dismiss = () => {
    localStorage.setItem("education_onboarded", "1");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Education</DialogTitle>
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