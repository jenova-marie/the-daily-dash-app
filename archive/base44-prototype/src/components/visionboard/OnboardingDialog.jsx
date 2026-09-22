import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ClipboardCheck, BarChart2, Image } from "lucide-react";

const steps = [
  {
    icon: <LayoutGrid className="w-8 h-8 text-primary" />,
    title: "1. Set Up Your Pillars",
    desc: "Start on the Pillars tab. These are the key life areas you want to track — like Nutrition, Fitness, Mindset, and more. You can hide pillars you don't want to track in daily evaluations. Add personal activities to each pillar and check activities to turn them into daily goals."
  },
  {
    icon: <ClipboardCheck className="w-8 h-8 text-accent" />,
    title: "2. Do Your Daily Evaluation",
    desc: "Each day, rate how well you showed up for each pillar on a scale of 1–5. If you score 3 or below, you'll see your pillar activities as optional goals to create. Add notes and pick activities you did."
  },
  {
    icon: <BarChart2 className="w-8 h-8 text-blue-400" />,
    title: "3. Review Your Week",
    desc: "The Weekly Review tab summarizes your pillar scores over the week so you can spot trends and areas to improve."
  },
  {
    icon: <Image className="w-8 h-8 text-pink-400" />,
    title: "4. Build Your Vision Collage & Slideshow",
    desc: "Upload inspiring images and affirmations to the Collage tab. Create custom slideshows for meditation, or let AI auto-generate one based on your pillar weaknesses. The slideshow includes at least one affirmation from each pillar. Double-click to hide the control bar, navigate with swipes or buttons, customize audio/voice, and affirmations won't repeat until all are cycled."
  }
];

export default function OnboardingDialog({ open, onClose, onDontRemind }) {
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) onClose();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Your Vision Board 🌟</DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Here's how to get the most out of this page — it only takes a minute to set up!
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
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
        <div className="space-y-2 mt-4">
          <Button className="w-full" onClick={onClose}>
            Got it — Let's Start with Pillars →
          </Button>
          <Button variant="ghost" className="w-full text-xs" onClick={onDontRemind}>
            Don't remind me again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}