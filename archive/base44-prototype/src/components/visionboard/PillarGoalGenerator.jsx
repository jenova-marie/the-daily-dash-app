import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, Check, Plus } from "lucide-react";

export default function PillarGoalGenerator({ pillar, open, onClose, onActivitiesAdded }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState("");
  const [generated, setGenerated] = useState(false);

  const generate = async () => {
    setLoading(true);
    setGenerated(false);
    setSelected(new Set());
    try {
      // Fetch the last daily assessment for this pillar
      const allTracking = await base44.entities.DailyPillarTracking.filter({ pillar_id: pillar.id }, "-date", 1);
      const lastAssessment = allTracking[0] || null;
      const assessmentContext = lastAssessment
        ? `The user's last daily assessment for this pillar (date: ${lastAssessment.date}): Rating ${lastAssessment.rating}/5.${lastAssessment.notes ? ` Notes: "${lastAssessment.notes}"` : ""}`
        : "";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a life coach. Suggest 5 specific, actionable activities for the "${pillar.name}" life pillar.
${pillar.description ? `Pillar description: ${pillar.description}` : ""}
${assessmentContext ? `\n${assessmentContext}\nTailor your suggestions to address the user's current state and rating.` : ""}
${context ? `Additional user context: ${context}` : ""}

Return exactly 5 activities. Each activity should be:
- Concrete and achievable
- Specific to the "${pillar.name}" area of life
- Written as a short, actionable activity (e.g. "Run for 30 minutes", "Practice gratitude journaling", "Call a friend")

Respond ONLY with a JSON object in this format:
{
  "activities": [
    {"title": "..."},
    ...
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" }
                }
              }
            }
          }
        }
      });
      setSuggestions(result.activities || []);
      setSelected(new Set(result.activities?.map((_, i) => i) || []));
      setGenerated(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleSelect = (idx) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const saveActivities = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    const toCreate = suggestions.filter((_, i) => selected.has(i));
    const existingActivities = await base44.entities.PillarActivity.list() || [];
    const pillarActivities = existingActivities.filter(a => a.pillar_id === pillar.id);
    const nextOrder = pillarActivities.length;

    const created = await base44.entities.PillarActivity.bulkCreate(
      toCreate.map((a, idx) => ({
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        activity: a.title,
        order: nextOrder + idx
      }))
    );

    setSaving(false);
    onActivitiesAdded?.(created);
    onClose();
    alert(`${selected.size} activity(ies) added to ${pillar.name}!`);
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setSuggestions([]);
      setSelected(new Set());
      setContext("");
      setGenerated(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Activity Ideas — {pillar.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Any specific focus? (optional)</Label>
            <Input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder={`e.g. "I want to sleep better"`}
              className="mt-1"
            />
          </div>

          <Button onClick={generate} disabled={loading} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> {generated ? "Regenerate" : "Generate Ideas"}</>
            )}
          </Button>

          {suggestions.length > 0 && (
            <>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {suggestions.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selected.has(i)
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                        selected.has(i) ? "bg-primary border-primary" : "border-border"
                      }`}>
                        {selected.has(i) && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <p className="text-sm font-medium leading-snug">{a.title}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={saveActivities}
                  disabled={selected.size === 0 || saving}
                  className="flex-1"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add {selected.size}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}