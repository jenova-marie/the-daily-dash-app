import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, RefreshCw, Search } from "lucide-react";

const steps = [
  {
    icon: <Calendar className="w-8 h-8 text-primary" />,
    title: "1. Browse Your Calendar",
    desc: "The monthly grid shows colored dots for days with events. Click any date to see that day's events in the panel on the right. Dots are color-coded by source — blue for custom or Google Calendar events, purple for Education, amber for Chores."
  },
  {
    icon: <Plus className="w-8 h-8 text-accent" />,
    title: "2. Add Custom Events",
    desc: "Click the + button in the Events panel to create a custom event for any date. Set a title, start and end time, color, and optional notes. Custom events live only in this app unless synced back to Google Calendar."
  },
  {
    icon: <RefreshCw className="w-8 h-8 text-blue-400" />,
    title: "3. Sync with Google Calendar & Tasks",
    desc: "Connect Google Calendar or Google Tasks in Settings, then click the sync icon here to import events. Events sync for the past 30 days and forward. When you delete a synced item, you can choose to remove it from Google too or just from this app."
  },
  {
    icon: <Search className="w-8 h-8 text-green-400" />,
    title: "4. Search & Manage Events",
    desc: "Use the search bar in the Events panel to quickly find any event by title or notes. Swipe an event left (mobile) or hover to reveal the delete button. Use the print or email icons in the widget header to export your calendar for any date."
  }
];

export default function CalendarOnboarding({ open, onClose, onDontRemind }) {
  const dismiss = () => {
    localStorage.setItem("calendar_onboarded", "1");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Calendar</DialogTitle>
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