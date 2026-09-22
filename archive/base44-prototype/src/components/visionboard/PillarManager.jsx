import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronDown, ChevronUp, Eye, EyeOff, ChevronsUpDown, ChevronsDownUp, Sparkles } from "lucide-react";
import PillarGoalGenerator from "./PillarGoalGenerator";

const DEFAULT_ACTIVITIES = {
  "Nutrition": ["Eat balanced meals", "Drink 8+ glasses of water", "Meal prep for week", "Limit processed foods", "Include vegetables in meals"],
  "Fitness": ["30 min cardio", "Strength training", "Stretching routine", "Walk outdoors", "Try a new exercise"],
  "Mindset": ["Practice gratitude", "Positive affirmations", "Visualize goals", "Journal reflections", "Read motivational content"],
  "Rest": ["Get 7-8 hours sleep", "Take power nap", "Relax before bed", "Avoid screens at night", "Morning meditation"],
  "Destress": ["Deep breathing exercise", "Take a walk", "Listen to music", "Yoga session", "Talk to someone"],
  "Play": ["Laugh and have fun", "Engage in hobby", "Play a game", "Spend time outdoors", "Try something new"],
  "Education": ["Learn something new", "Read article/book", "Watch tutorial", "Practice skill", "Take a course"],
  "Career": ["Complete work task", "Learn new skill", "Network with colleague", "Plan career goals", "Review progress"],
  "Home/Environment": ["Tidy one room", "Clean workspace", "Organize clutter", "Do laundry", "Cook a meal"],
  "Relationships": ["Call a friend", "Spend quality time", "Show appreciation", "Listen actively", "Plan time together"],
  "Self-esteem": ["Celebrate accomplishment", "Practice self-care", "Set personal boundary", "Accept compliment", "Challenge negative thought"],
  "Financial": ["Track spending", "Save money", "Review budget", "Pay a bill", "Research investment"],
  "Spirituality": ["Practice faith", "Meditate", "Connect with nature", "Help someone", "Reflect on values"]
};

export default function PillarManager({ pillars, setPillars, onCreateGoal }) {
  const [editingPillar, setEditingPillar] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activities, setActivities] = useState({});
  const [editingActivities, setEditingActivities] = useState({});
  const [newActivityText, setNewActivityText] = useState({});
  const [expandedPillars, setExpandedPillars] = useState({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState({});
  const [occurrenceDialogOpen, setOccurrenceDialogOpen] = useState(false);
  const [occurrences, setOccurrences] = useState("");
  const [frequency, setFrequency] = useState("");
  const [aiGoalPillar, setAiGoalPillar] = useState(null);
  const tapTimers = useRef({});
  const touchStartX = useRef({});

  useEffect(() => {
    if (pillars.length === 0) return;
    const loadAndSeedActivities = async () => {
      const allActivities = await base44.entities.PillarActivity.list();
      const grouped = {};
      allActivities.forEach(act => {
        if (!grouped[act.pillar_id]) grouped[act.pillar_id] = [];
        grouped[act.pillar_id].push(act);
      });

      // Seed default activities for any pillar that has none yet
      const pillarsWithoutActivities = pillars.filter(p => !grouped[p.id]?.length);
      for (const pillar of pillarsWithoutActivities) {
        const defaultActs = DEFAULT_ACTIVITIES[pillar.name] || [];
        if (defaultActs.length === 0) continue;
        const created = await base44.entities.PillarActivity.bulkCreate(
          defaultActs.map((act, idx) => ({
            pillar_id: pillar.id,
            pillar_name: pillar.name,
            activity: act,
            order: idx
          }))
        );
        grouped[pillar.id] = created;
      }

      setActivities(grouped);
    };
    loadAndSeedActivities();
  }, [pillars]);

  const initializePillarActivities = async (pillar) => {
    if (activities[pillar.id]?.length > 0) return;
    const defaultActs = DEFAULT_ACTIVITIES[pillar.name] || [];
    const created = await base44.entities.PillarActivity.bulkCreate(
      defaultActs.map((act, idx) => ({
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        activity: act,
        order: idx
      }))
    );
    setActivities(prev => ({
      ...prev,
      [pillar.id]: created
    }));
  };

  const toggleEditActivities = (pillar) => {
    if (!editingActivities[pillar.id]) {
      setEditingActivities(prev => ({
        ...prev,
        [pillar.id]: true
      }));
      if (!activities[pillar.id]?.length) {
        initializePillarActivities(pillar);
      }
    } else {
      setEditingActivities(prev => ({
        ...prev,
        [pillar.id]: false
      }));
    }
  };

  const addActivity = async (pillar) => {
    const text = newActivityText[pillar.id]?.trim();
    if (!text) return;
    const created = await base44.entities.PillarActivity.create({
      pillar_id: pillar.id,
      pillar_name: pillar.name,
      activity: text,
      order: (activities[pillar.id]?.length || 0)
    });
    setActivities(prev => ({
      ...prev,
      [pillar.id]: [...(prev[pillar.id] || []), created]
    }));
    setNewActivityText(prev => ({
      ...prev,
      [pillar.id]: ""
    }));
  };

  const deleteActivity = async (activityId, pillarId) => {
    await base44.entities.PillarActivity.delete(activityId);
    setActivities(prev => ({
      ...prev,
      [pillarId]: prev[pillarId].filter(a => a.id !== activityId)
    }));
  };

  const handleDoubleTap = (pillar) => {
    const now = Date.now();
    const timerId = tapTimers.current[pillar.id];
    
    if (timerId && now - timerId < 300) {
      clearTimeout(tapTimers.current[pillar.id]);
      delete tapTimers.current[pillar.id];
      setEditingPillar(pillar);
      setEditName(pillar.name);
      setEditColor(pillar.color);
      setEditDescription(pillar.description || "");
      setEditDialogOpen(true);
    } else {
      tapTimers.current[pillar.id] = now;
      setTimeout(() => {
        delete tapTimers.current[pillar.id];
      }, 300);
    }
  };

  const toggleHidden = async (pillar) => {
    const updated = await base44.entities.HealthPillar.update(pillar.id, { is_hidden: !pillar.is_hidden });
    setPillars(pillars.map(p => p.id === pillar.id ? { ...p, is_hidden: updated.is_hidden } : p));
  };

  const handleSaveEdit = async () => {
    if (!editingPillar) return;
    try {
      await base44.entities.HealthPillar.update(editingPillar.id, {
        name: editName,
        color: editColor,
        description: editDescription,
      });
      setPillars(pillars.map(p => p.id === editingPillar.id 
        ? { ...p, name: editName, color: editColor, description: editDescription }
        : p
      ));
      setEditDialogOpen(false);
      setEditingPillar(null);
    } catch (error) {
      console.error("Error saving pillar:", error);
    }
  };

  const togglePillar = (pillarId) => {
    setExpandedPillars(prev => ({
      ...prev,
      [pillarId]: !prev[pillarId]
    }));
  };

  const collapseAll = () => {
    setExpandedPillars({});
    setAllCollapsed(true);
  };

  const expandAll = () => {
    const allExpanded = {};
    pillars.forEach(p => {
      allExpanded[p.id] = true;
    });
    setExpandedPillars(allExpanded);
    setAllCollapsed(false);
  };

  const toggleActivitySelection = (activityId) => {
    setSelectedActivities(prev => ({
      ...prev,
      [activityId]: !prev[activityId]
    }));
  };

  const createGoalsFromActivities = async () => {
    const selectedIds = Object.keys(selectedActivities).filter(id => selectedActivities[id]);
    if (selectedIds.length === 0) return;

    const allActivities = await base44.entities.PillarActivity.list();
    const selectedActivityObjs = allActivities.filter(a => selectedIds.includes(a.id));

    const parsedOccurrences = Math.max(1, parseInt(occurrences) || 1);
    const resolvedFrequency = frequency || "daily";
    for (const activity of selectedActivityObjs) {
      const sourcePillar = pillars.find(p => p.id === activity.pillar_id);
      const goal = await base44.entities.Goal.create({
        title: activity.activity,
        description: `From ${activity.pillar_name}`,
        timeframe: resolvedFrequency,
        occurrences: parsedOccurrences,
        status: "not_started",
        member_name: "Self",
        category: activity.pillar_name,
        category_color: sourcePillar?.color || "#3b82f6"
      });
      await base44.entities.GoalTask.bulkCreate(
        Array.from({ length: parsedOccurrences }, (_, i) => ({
          goal_id: goal.id,
          title: parsedOccurrences > 1 ? `${activity.activity} (${i + 1}/${parsedOccurrences})` : activity.activity,
          frequency: resolvedFrequency,
          completed: false
        }))
      );
    }

    setSelectedActivities({});
    setOccurrenceDialogOpen(false);
    setOccurrences("");
    setFrequency("");
    alert(`Created ${selectedIds.length} goal(s) successfully!`);
  };

  const hasSelectedActivities = Object.values(selectedActivities).some(v => v);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <button
          onClick={() => allCollapsed ? expandAll() : collapseAll()}
          className="h-8 w-8 flex items-center justify-center rounded-md bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title={allCollapsed ? "Expand all" : "Collapse all"}
        >
          {allCollapsed ? <ChevronsUpDown className="w-4 h-4" /> : <ChevronsDownUp className="w-4 h-4" />}
        </button>
        {hasSelectedActivities && (
          <Button 
            variant="default"
            size="sm"
            onClick={() => setOccurrenceDialogOpen(true)}
            className="ml-auto"
          >
            Create {Object.values(selectedActivities).filter(v => v).length} Goal(s)
          </Button>
        )}
      </div>

      <Dialog open={occurrenceDialogOpen} onOpenChange={setOccurrenceDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Set Occurrences</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              How many times must each goal be completed? This applies to all {Object.values(selectedActivities).filter(v => v).length} selected goal(s).
            </p>
            <div>
              <Label className="text-sm">Frequency</Label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="" disabled>Select frequency...</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div>
              <Label className="text-sm">Number of occurrences</Label>
              <Input
                type="number"
                min={1}
                placeholder="e.g. 3"
                value={occurrences}
                onChange={(e) => setOccurrences(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOccurrenceDialogOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={createGoalsFromActivities} className="flex-1">Create Goals</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map((pillar) => (
          <div key={pillar.id}>
            <div
              className="p-4 rounded-lg border transition-all"
              style={{ borderColor: pillar.color, backgroundColor: `${pillar.color}15` }}
              onDoubleClick={() => handleDoubleTap(pillar)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold ${pillar.is_hidden ? "text-muted-foreground line-through" : ""}`}>{pillar.name}</h3>
                  {pillar.is_hidden && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">hidden</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleHidden(pillar); }}
                    title={pillar.is_hidden ? "Show in assessments" : "Hide from assessments"}
                    className={`p-1 rounded text-xs transition-colors ${pillar.is_hidden ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {pillar.is_hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => togglePillar(pillar.id)}
                    className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
                  >
                    {expandedPillars[pillar.id] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {pillar.description && (
                <p className="text-sm text-muted-foreground mb-3">{pillar.description}</p>
              )}
              
              {expandedPillars[pillar.id] && !editingActivities[pillar.id] && (
                <div className="space-y-2 text-left text-sm">
                  {(activities[pillar.id] || []).map((act) => (
                    <label key={act.id} className="flex items-start gap-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedActivities[act.id] || false}
                        onChange={() => toggleActivitySelection(act.id)}
                        className="mt-1 cursor-pointer"
                      />
                      <span>{act.activity}</span>
                    </label>
                  ))}
                </div>
              )}

              {expandedPillars[pillar.id] && editingActivities[pillar.id] && (
                <div className="space-y-2 text-left">
                  {(activities[pillar.id] || []).map((act) => (
                    <div key={act.id} className="flex items-center gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span className="flex-1 text-sm">{act.activity}</span>
                      <button
                        onClick={() => deleteActivity(act.id, pillar.id)}
                        className="p-1 hover:bg-destructive/10 rounded text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-1 pt-2">
                    <Input
                      placeholder="Add activity..."
                      value={newActivityText[pillar.id] || ""}
                      onChange={(e) => setNewActivityText(prev => ({
                        ...prev,
                        [pillar.id]: e.target.value
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") addActivity(pillar);
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => addActivity(pillar)}
                      className="h-8 px-2"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {expandedPillars[pillar.id] && (
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleEditActivities(pillar)}
                    className="flex-1 text-xs"
                  >
                    {editingActivities[pillar.id] ? "Done" : "Edit Activities"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAiGoalPillar(pillar)}
                    className="text-xs flex items-center gap-1"
                    title="Generate AI goal ideas for this pillar"
                  >
                    <Sparkles className="w-3 h-3" />
                    AI Goals
                  </Button>
                </div>
              )}
            </div>

            <Dialog open={editDialogOpen && editingPillar?.id === pillar.id} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Pillar</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Name</Label>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Description</Label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Optional description"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Color</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-9 w-16 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} className="flex-1">
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>


          </div>
        ))}
      </div>

      {aiGoalPillar && (
        <PillarGoalGenerator
          pillar={aiGoalPillar}
          open={!!aiGoalPillar}
          onClose={() => setAiGoalPillar(null)}
          onActivitiesAdded={(newActivities) => {
            setActivities(prev => ({
              ...prev,
              [aiGoalPillar.id]: [...(prev[aiGoalPillar.id] || []), ...newActivities]
            }));
          }}
        />
      )}
    </div>
  );
}