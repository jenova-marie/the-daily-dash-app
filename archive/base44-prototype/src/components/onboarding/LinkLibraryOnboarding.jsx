import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link2, Tag, Palette, Pencil } from "lucide-react";

const steps = [
  {
    icon: <Link2 className="w-8 h-8 text-primary" />,
    title: "1. Save Your Favorite Links",
    desc: "Click 'Add Link' to store any website or resource. Give it a title, paste the URL, and optionally assign a category. All your links live in one place so you never lose a useful site again."
  },
  {
    icon: <Tag className="w-8 h-8 text-accent" />,
    title: "2. Organize with Categories",
    desc: "Create custom categories like Productivity, Learning, or Entertainment. Use the dropdown to filter your view to a single category. Categories are stored locally so they persist across sessions."
  },
  {
    icon: <Palette className="w-8 h-8 text-pink-400" />,
    title: "3. Personalize with Icons & Thumbnails",
    desc: "Each link can show a thumbnail image from a URL, or you can choose from 40+ icons with 10 color options. Pick a style that makes each link instantly recognizable at a glance."
  },
  {
    icon: <Pencil className="w-8 h-8 text-blue-400" />,
    title: "4. Enter Management Mode",
    desc: "Click the link icon button in the top right to switch into management mode. From there you can add, edit, or delete links and categories. Switch back to view mode when you're done."
  }
];

export default function LinkLibraryOnboarding({ open, onClose, onDontRemind }) {
  const dismiss = () => {
    localStorage.setItem("links_onboarded", "1");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(newOpen) => { if (!newOpen) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to Link Library</DialogTitle>
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