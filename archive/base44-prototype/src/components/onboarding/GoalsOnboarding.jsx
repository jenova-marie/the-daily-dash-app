import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Target, CheckSquare, TrendingUp, Users, Archive } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STORAGE_KEY = "goals_onboarding_done";

const steps = [
  {
    icon: <Target className="w-8 h-8 text-primary" />,
    title: "1. Set Goals",
    desc: "Create goals with a timeframe (daily, weekly, monthly, annual, 3-year, or 5-year), an optional target date, and a member name. Goals are assigned to you by default."
  },
  {
    icon: <CheckSquare className="w-8 h-8 text-green-400" />,
    title: "2. Add Milestone Tasks",
    desc: "Break each goal into actionable milestone tasks. Check them off as you complete them — the goal's progress bar updates automatically."
  },
  {
    icon: <Users className="w-8 h-8 text-accent" />,
    title: "3. Add Family Members",
    desc: "Use the people icon to add family members and assign goals to them. Filter the view by individual to track personal, household, or shared goals side by side."
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-blue-400" />,
    title: "4. Track Progress",
    desc: "A progress bar reflects how far along each goal is. Goals created from your Vision Board Daily Evaluation appear here automatically."
  },
  {
    icon: <Archive className="w-8 h-8 text-purple-400" />,
    title: "5. Archive & Restore",
    desc: "Manually archive goals to keep your list clean, or restore them from the Archive tab at any time using the restore button."
  },
];

export default function GoalsOnboarding({ open, onClose }) {
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
          <DialogTitle className="text-xl">Welcome to Goal Manager</DialogTitle>
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