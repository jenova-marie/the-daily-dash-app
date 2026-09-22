import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function GenericOnboardingDialog({ open, onClose, onDontRemind, storageKey, title, steps }) {
  const dismiss = async () => {
    if (storageKey) {
      try {
        let settings = null;
        const themeSettings = await base44.entities.ThemeSettings.list("-updated_date", 1);
        
        if (themeSettings.length) {
          settings = themeSettings[0];
        } else {
          // Create new ThemeSettings if none exists
          const created = await base44.entities.ThemeSettings.create({ onboarding_status: "{}" });
          settings = created;
        }
        
        const onboardingStatus = JSON.parse(settings.onboarding_status || "{}");
        onboardingStatus[storageKey] = true;
        await base44.entities.ThemeSettings.update(settings.id, { onboarding_status: JSON.stringify(onboardingStatus) });
        localStorage.setItem(storageKey, "true");
      } catch (err) {
        console.error("Failed to save onboarding status:", err);
      }
    }
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) onClose();
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground pt-1">
            Here's how to get the most out of this page — it only takes a minute!
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
        <div className="mt-4">
          <Button className="w-full" onClick={dismiss}>
            Got it — Don't Remind Me Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}