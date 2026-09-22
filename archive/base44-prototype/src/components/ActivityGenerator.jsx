import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const AGE_GROUPS = ["Preschool (3-5)", "K-1st Grade (5-7)", "2-3rd Grade (7-9)", "4-5th Grade (9-11)", "6-8th Grade (11-14)", "High School (14-18)", "18+"];
const ACTIVITY_TYPES = ["assignment", "activity"];

const frequencyLabels = { once: "Once", daily: "Daily", weekly: "Weekly", biweekly: "Biweekly", monthly: "Monthly" };
const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ActivityGenerator({ learners, plans, onActivitiesCreated }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("ai"); // "ai" | "manual"

  // AI mode state
  const [generating, setGenerating] = useState(false);
  const [ageGroup, setAgeGroup] = useState("");
  const [subject, setSubject] = useState("");
  const [activityType, setActivityType] = useState("activity");
  const [quantity, setQuantity] = useState("5");
  const [selectedPlanIds, setSelectedPlanIds] = useState(new Set());
  const [selectedLearnerIds, setSelectedLearnerIds] = useState(new Set());
  const [selectedActivityIndices, setSelectedActivityIndices] = useState(new Set());
  const [generatedActivities, setGeneratedActivities] = useState([]);
  const [createAsGoals, setCreateAsGoals] = useState(false);
  const [step, setStep] = useState("config"); // config, selecting, plans, assign

  // Manual mode state
  const [manualForm, setManualForm] = useState({ title: "", type: "assignment", frequency: "once", due_date: "", notes: "", days_of_week: [] });
  const [manualLearnerId, setManualLearnerId] = useState("");
  const [manualPlanId, setManualPlanId] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  const resetManual = () => {
    setManualForm({ title: "", type: "assignment", frequency: "once", due_date: "", notes: "", days_of_week: [] });
    setManualLearnerId("");
    setManualPlanId("");
  };

  const toggleManualDay = (day) => {
    setManualForm(f => ({
      ...f,
      days_of_week: f.days_of_week.includes(day) ? f.days_of_week.filter(d => d !== day) : [...f.days_of_week, day]
    }));
  };

  const saveManual = async () => {
    if (!manualForm.title || !manualPlanId) return;
    setManualSaving(true);
    const plan = Array.from(plans).find(p => p.id === manualPlanId);
    if (plan) {
      await base44.entities.EducationActivity.create({
        ...manualForm,
        plan_id: plan.id,
        learner_id: plan.learner_id,
        subject: plan.subject,
      });
      onActivitiesCreated?.();
    }
    setManualSaving(false);
    setOpen(false);
    resetManual();
  };

  const generate = async () => {
    if (!ageGroup || !subject) return;
    setGenerating(true);
    try {
      const response = await base44.functions.invoke("generateActivities", {
        ageGroup,
        subject,
        activityType,
        quantity: parseInt(quantity)
      });
      setGeneratedActivities(response.data?.activities || []);
      setStep("selecting");
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate activities. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleLearnerSelection = (learnerId) => {
    const newSelected = new Set(selectedLearnerIds);
    if (newSelected.has(learnerId)) newSelected.delete(learnerId);
    else newSelected.add(learnerId);
    setSelectedLearnerIds(newSelected);
  };

  const toggleActivitySelection = (idx) => {
    const newSelected = new Set(selectedActivityIndices);
    if (newSelected.has(idx)) newSelected.delete(idx);
    else newSelected.add(idx);
    setSelectedActivityIndices(newSelected);
  };

  const toggleAllActivities = () => {
    if (selectedActivityIndices.size === generatedActivities.length) {
      setSelectedActivityIndices(new Set());
    } else {
      setSelectedActivityIndices(new Set(generatedActivities.map((_, idx) => idx)));
    }
  };

  const togglePlanSelection = (planId) => {
    const newSelected = new Set(selectedPlanIds);
    if (newSelected.has(planId)) newSelected.delete(planId);
    else newSelected.add(planId);
    setSelectedPlanIds(newSelected);
  };

  const proceedToPlans = () => {
    if (selectedLearnerIds.size === 0 || selectedActivityIndices.size === 0) return;
    setStep("plans");
  };

  const assignActivities = async () => {
    if (selectedPlanIds.size === 0) return;

    try {
      const createdActivities = [];
      const createdGoals = [];
      const selectedActivities = generatedActivities.filter((_, idx) => selectedActivityIndices.has(idx));
      const selectedPlans = Array.from(plans).filter(p => selectedPlanIds.has(p.id));

      // Get existing activities for duplicate checking
      const existingActivities = await base44.entities.EducationActivity.list();

      for (const plan of selectedPlans) {
        for (const activity of selectedActivities) {
          // Check for duplicate activity
          const isDuplicate = existingActivities.some(existing =>
            existing.plan_id === plan.id &&
            existing.title.toLowerCase() === activity.title.toLowerCase() &&
            existing.learner_id === plan.learner_id
          );

          if (!isDuplicate) {
            const created = await base44.entities.EducationActivity.create({
              plan_id: plan.id,
              learner_id: plan.learner_id,
              subject: plan.subject,
              title: activity.title,
              type: activityType,
              frequency: "once",
              notes: `${activity.description}\n\nDuration: ${activity.duration}\nMaterials: ${activity.materials}`
            });
            createdActivities.push(created);

            // Create goal if checkbox is selected
            if (createAsGoals) {
              const goal = await base44.entities.Goal.create({
                title: activity.title,
                description: activity.description,
                timeframe: "weekly",
                status: "not_started",
                member_name: learners.find(l => l.id === plan.learner_id)?.name || "Unknown"
              });
              createdGoals.push(goal);
            }
          }
        }
      }

      setOpen(false);
      setStep("config");
      setGeneratedActivities([]);
      setSelectedLearnerIds(new Set());
      setSelectedActivityIndices(new Set());
      setSelectedPlanIds(new Set());
      setAgeGroup("");
      setSubject("");
      setCreateAsGoals(false);
      
      onActivitiesCreated?.(createdActivities);
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Failed to assign activities. Please try again.");
    }
  };

  const activePlans = Array.from(plans).filter(p => {
    const learner = learners.find(l => l.id === p.learner_id);
    return !!learner;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setStep("config"); resetManual(); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Add / Generate Activities" className="bg-secondary/50">
          <Wand2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Add Activities</DialogTitle></DialogHeader>

        {/* Mode switcher */}
        <div className="flex gap-2 p-1 rounded-lg bg-muted w-full">
          <button onClick={() => setMode("manual")} className={cn("flex-1 py-1.5 text-sm rounded-md transition-colors", mode === "manual" ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground")}>
            <Plus className="w-3.5 h-3.5 inline mr-1" />Manual Entry
          </button>
          <button onClick={() => setMode("ai")} className={cn("flex-1 py-1.5 text-sm rounded-md transition-colors", mode === "ai" ? "bg-background shadow font-medium" : "text-muted-foreground hover:text-foreground")}>
            <Wand2 className="w-3.5 h-3.5 inline mr-1" />AI Generator
          </button>
        </div>

        {/* Manual Entry */}
        {mode === "manual" && (
          <div className="space-y-4">
            <div>
              <Label>Learner</Label>
              <Select value={manualLearnerId} onValueChange={(v) => { setManualLearnerId(v); setManualPlanId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select a learner" /></SelectTrigger>
                <SelectContent>
                  {learners.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plan / Subject</Label>
              <Select value={manualPlanId} onValueChange={setManualPlanId} disabled={!manualLearnerId}>
                <SelectTrigger><SelectValue placeholder={manualLearnerId ? "Select a plan" : "Select a learner first"} /></SelectTrigger>
                <SelectContent>
                  {Array.from(
                    Array.from(plans)
                      .filter(p => p.learner_id === manualLearnerId)
                      .reduce((map, p) => { if (!map.has(p.subject)) map.set(p.subject, p); return map; }, new Map())
                      .values()
                  ).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-1.5">
                {["assignment", "activity"].map(t => (
                  <button key={t} onClick={() => setManualForm(f => ({ ...f, type: t }))}
                    className={cn("px-4 py-1.5 rounded-full text-xs border capitalize transition-colors", manualForm.type === t ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div><Label>Title</Label><Input value={manualForm.title} onChange={e => setManualForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 worksheet" /></div>
            <div>
              <Label>Frequency</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {Object.entries(frequencyLabels).map(([val, label]) => (
                  <button key={val} onClick={() => setManualForm(f => ({ ...f, frequency: val, days_of_week: [] }))}
                    className={cn("px-3 py-1 rounded-full text-xs border transition-colors", manualForm.frequency === val ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {(manualForm.frequency === "weekly" || manualForm.frequency === "biweekly") && (
              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {daysOfWeek.map(day => (
                    <button key={day} onClick={() => toggleManualDay(day)}
                      className={cn("w-10 h-10 rounded-full text-xs border transition-colors font-medium", manualForm.days_of_week.includes(day) ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div><Label>Due Date (Optional)</Label><Input type="date" value={manualForm.due_date} onChange={e => setManualForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            <div><Label>Notes</Label><Textarea value={manualForm.notes} onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button onClick={saveManual} disabled={!manualForm.title || !manualPlanId || manualSaving} className="w-full">
              {manualSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Add
            </Button>
          </div>
        )}

        {/* AI mode */}
        {mode === "ai" && step === "config" && (
          <div className="space-y-4">
            <div>
              <Label>Age Group</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                <SelectContent>
                  {AGE_GROUPS.map(group => <SelectItem key={group} value={group}>{group}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Math, Science, History"
              />
            </div>

            <div>
              <Label>Activity Type</Label>
              <div className="flex gap-2 mt-1.5">
                {ACTIVITY_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setActivityType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-colors capitalize",
                      activityType === type
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/80 border-transparent"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <Button onClick={generate} disabled={!ageGroup || !subject || generating} className="w-full gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate Activities"}
            </Button>
          </div>
        )}

        {mode === "ai" && step === "selecting" && generatedActivities.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Learners</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {learners.map(learner => (
                  <div key={learner.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => toggleLearnerSelection(learner.id)}>
                    <Checkbox
                      checked={selectedLearnerIds.has(learner.id)}
                      onCheckedChange={() => toggleLearnerSelection(learner.id)}
                    />
                    <span className="text-sm">{learner.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Generated Activities ({generatedActivities.length})</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllActivities}
                  className="text-xs h-7"
                >
                  {selectedActivityIndices.size === generatedActivities.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {generatedActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleActivitySelection(idx)}
                  >
                    <Checkbox checked={selectedActivityIndices.has(idx)} onCheckedChange={() => toggleActivitySelection(idx)} className="mt-0.5" />
                    <div className="flex-1 text-sm">
                         <p className="font-medium">{activity.title}</p>
                         <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                         <p className="text-xs text-muted-foreground mt-1">⏱ {activity.duration} • 📦 {activity.materials}</p>

                       </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("config")} className="flex-1">Back</Button>
              <Button
                onClick={proceedToPlans}
                disabled={selectedLearnerIds.size === 0 || selectedActivityIndices.size === 0}
                className="flex-1 gap-2"
              >
                Next: Select Plans →
              </Button>
            </div>
          </div>
        )}

        {mode === "ai" && step === "plans" && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Plans/Subjects</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(plans)
                  .filter(p => selectedLearnerIds.has(p.learner_id))
                  .map(plan => {
                    const learner = learners.find(l => l.id === plan.learner_id);
                    return (
                      <div
                        key={plan.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => togglePlanSelection(plan.id)}
                      >
                        <Checkbox
                          checked={selectedPlanIds.has(plan.id)}
                          onCheckedChange={() => togglePlanSelection(plan.id)}
                        />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{plan.subject}</p>
                          <p className="text-xs text-muted-foreground">{learner?.name}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
              <Checkbox
                id="create-goals"
                checked={createAsGoals}
                onCheckedChange={setCreateAsGoals}
              />
              <label htmlFor="create-goals" className="text-sm cursor-pointer">
                Also create these as goals for the learners
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("selecting")} className="flex-1">Back</Button>
              <Button
                onClick={assignActivities}
                disabled={selectedPlanIds.size === 0}
                className="flex-1 gap-2"
              >
                <Plus className="w-4 h-4" /> Assign to {selectedPlanIds.size} Plan(s)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}