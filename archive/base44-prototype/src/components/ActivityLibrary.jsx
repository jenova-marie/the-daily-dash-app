import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Trash2, Plus, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActivityLibrary({ learners, plans, onSaveActivity, onActivitiesSelected, onCreateGoal }) {
  const [open, setOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFavIds, setSelectedFavIds] = useState(new Set());
  const [assignStep, setAssignStep] = useState("list"); // "list" | "assign"
  const [assignPlanId, setAssignPlanId] = useState("");
  const [assignLearnerId, setAssignLearnerId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [educationStatus, setEducationStatus] = useState({ hasOverdue: false, hasDue: false });
  const [newActivity, setNewActivity] = useState({
    learner_id: "",
    title: "",
    description: "",
    type: "activity",
    duration: "",
    materials: ""
  });

  useEffect(() => {
    const checkStatus = async () => {
      const today = new Date().toISOString().split('T')[0];
      const activities = await base44.entities.EducationActivity.list("-updated_date", 500);
      const overdueActivities = activities.filter(a => a.due_date && a.due_date < today && !a.completed);
      const dueActivities = activities.filter(a => a.due_date === today && !a.completed);
      setEducationStatus({ hasOverdue: overdueActivities.length > 0, hasDue: dueActivities.length > 0 });
    };
    checkStatus();
  }, []);

  useEffect(() => {
    if (open) loadFavorites();
  }, [open]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favs = await base44.entities.FavoriteActivity.list("-updated_date", 100);
      setFavorites(favs);
    } catch (error) {
      console.error("Failed to load favorites:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveFavorite = async () => {
    if (!newActivity.learner_id || !newActivity.title) return;
    try {
      await base44.entities.FavoriteActivity.create(newActivity);
      setNewActivity({
        learner_id: "",
        title: "",
        description: "",
        type: "activity",
        duration: "",
        materials: ""
      });
      loadFavorites();
    } catch (error) {
      console.error("Failed to save favorite:", error);
    }
  };

  const deleteFavorite = async (id) => {
    try {
      await base44.entities.FavoriteActivity.delete(id);
      loadFavorites();
    } catch (error) {
      console.error("Failed to delete favorite:", error);
    }
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedFavIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedFavIds(newSelected);
  };

  const assignSelected = () => {
    if (selectedFavIds.size === 0) return;
    setAssignStep("assign");
  };

  const doAssign = async () => {
    if (!assignPlanId) return;
    setAssigning(true);
    try {
      const plan = plans?.find(p => p.id === assignPlanId);
      if (!plan) return;
      const selected = favorites.filter(f => selectedFavIds.has(f.id));
      for (const fav of selected) {
        await base44.entities.EducationActivity.create({
          plan_id: plan.id,
          learner_id: plan.learner_id,
          subject: plan.subject,
          title: fav.title,
          type: fav.type || "activity",
          frequency: "once",
          notes: [fav.description, fav.duration ? `Duration: ${fav.duration}` : "", fav.materials ? `Materials: ${fav.materials}` : ""].filter(Boolean).join("\n"),
        });
      }
      onSaveActivity?.();
      onActivitiesSelected?.(selected);
      setSelectedFavIds(new Set());
      setAssignStep("list");
      setAssignPlanId("");
      setAssignLearnerId("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to assign:", err);
    } finally {
      setAssigning(false);
    }
  };

  const getButtonClass = () => "bg-secondary/50";

  const handleCreateGoal = (learnerId, subject) => {
    const learner = learners.find(l => l.id === learnerId);
    if (onCreateGoal && learner) {
      onCreateGoal(subject, learner.name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setAssignStep("list"); setAssignPlanId(""); setAssignLearnerId(""); setSelectedFavIds(new Set()); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Activity Library" className={getButtonClass()}>
          <BookOpen className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Activity Library</DialogTitle></DialogHeader>

        <div className="space-y-4">
          {/* Add new favorite */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold">Save New Activity</h3>
            <div>
              <Label className="text-xs">Learner</Label>
              <Select value={newActivity.learner_id} onValueChange={(value) => setNewActivity({ ...newActivity, learner_id: value })}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a learner" />
                </SelectTrigger>
                <SelectContent>
                  {learners.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={newActivity.title}
                onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                placeholder="Activity title"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={newActivity.description}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                placeholder="Brief description"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={newActivity.type} onValueChange={(value) => setNewActivity({ ...newActivity, type: value })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity">Activity</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Duration</Label>
                <Input
                  value={newActivity.duration}
                  onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                  placeholder="e.g. 30 min"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Materials</Label>
                <Input
                  value={newActivity.materials}
                  onChange={(e) => setNewActivity({ ...newActivity, materials: e.target.value })}
                  placeholder="e.g. Paper, pencil"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <Button onClick={saveFavorite} disabled={!newActivity.learner_id || !newActivity.title} size="sm" className="w-full">
              <Plus className="w-3 h-3 mr-1" /> Save to Library
            </Button>
          </div>

          {/* Favorites list */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Saved Activities ({favorites.length})</h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : favorites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved activities yet.</p>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {(() => {
                  const grouped = {};
                  favorites.forEach(fav => {
                    const learnerId = fav.learner_id;
                    if (!grouped[learnerId]) grouped[learnerId] = [];
                    grouped[learnerId].push(fav);
                  });

                  return Object.entries(grouped).map(([learnerId, activities]) => {
                    const learner = learners.find(l => l.id === learnerId);
                    return (
                      <div key={learnerId}>
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">{learner?.name}</p>
                        <div className="space-y-2">
                          {activities.map(fav => (
                            <div
                              key={fav.id}
                              className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer ml-2 border border-border/50"
                              onClick={() => toggleSelection(fav.id)}
                            >
                              <Checkbox checked={selectedFavIds.has(fav.id)} onCheckedChange={() => toggleSelection(fav.id)} className="mt-0.5" />
                              <div className="flex-1 text-sm">
                                <p className="font-medium">{fav.title}</p>
                                <p className="text-xs text-muted-foreground">{fav.type}</p>
                                {fav.description && <p className="text-xs text-muted-foreground mt-1">{fav.description}</p>}
                                {(fav.duration || fav.materials) && (
                                  <p className="text-xs text-muted-foreground mt-1">⏱ {fav.duration || '-'} • 📦 {fav.materials || '-'}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {onCreateGoal && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-primary hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateGoal(fav.learner_id, fav.title);
                                    }}
                                    title="Create goal"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFavorite(fav.id);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {assignStep === "list" ? (
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={assignSelected}
                disabled={selectedFavIds.size === 0 || !plans?.length}
                className="flex-1"
              >
                Next: Assign {selectedFavIds.size > 0 ? `${selectedFavIds.size}` : ""} to Plan →
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">Assign {selectedFavIds.size} activity(ies) to a plan</h3>
              <div>
                <Label className="text-xs">Learner</Label>
                <Select value={assignLearnerId} onValueChange={(v) => { setAssignLearnerId(v); setAssignPlanId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select learner" /></SelectTrigger>
                  <SelectContent>
                    {learners.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Subject / Plan</Label>
                <Select value={assignPlanId} onValueChange={setAssignPlanId} disabled={!assignLearnerId}>
                  <SelectTrigger><SelectValue placeholder={assignLearnerId ? "Select plan" : "Select learner first"} /></SelectTrigger>
                  <SelectContent>
                    {plans?.filter(p => p.learner_id === assignLearnerId).map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAssignStep("list")} className="flex-1">Back</Button>
                <Button onClick={doAssign} disabled={!assignPlanId || assigning} className="flex-1">
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add to Plan
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}