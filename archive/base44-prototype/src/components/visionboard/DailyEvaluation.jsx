import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ChevronRight, ChevronDown, Edit2, Trash2, Check, Target } from "lucide-react";

export default function DailyEvaluation({ date, pillars, onSaved, onCompleted }) {
  const [ratings, setRatings] = useState({});
  const [notes, setNotes] = useState({});
  const [selectedActivities, setSelectedActivities] = useState({});
  const [activities, setActivities] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasExistingEval, setHasExistingEval] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [gratitude, setGratitude] = useState("");
  const [existingGratitudeId, setExistingGratitudeId] = useState(null);
  // activityId -> { occurrences, frequency } — queued until Complete
  const [goalSettings, setGoalSettings] = useState({});
  // activityId -> { goal, remaining, total } — already-saved active goals (from previous completions)
  const [savedGoals, setSavedGoals] = useState({});
  // pillarId -> Set<activityId> currently expanded for settings
  const [pendingGoalActivities, setPendingGoalActivities] = useState({});
  // activityId -> confirmed for creation on Complete (checkmark clicked)
  const [queuedGoals, setQueuedGoals] = useState({});
  const [suggestedGoalsOpen, setSuggestedGoalsOpen] = useState(false);
  const [activitiesExpanded, setActivitiesExpanded] = useState(false);

  const isGratitudeStep = currentIndex === pillars.length;
  const isActive = !hasExistingEval || isEditing;

  useEffect(() => {
    if (isActive) window.__evalInProgress = true;
    return () => { window.__evalInProgress = false; };
  }, [isActive]);

  const loadSavedGoals = async (allActivities) => {
    const [allGoals, allGoalTasks] = await Promise.all([
      base44.entities.Goal.list("-created_date", 200),
      base44.entities.GoalTask.list("-created_date", 500),
    ]);
    const tasksByGoal = {};
    allGoalTasks.forEach(t => {
      if (!tasksByGoal[t.goal_id]) tasksByGoal[t.goal_id] = [];
      tasksByGoal[t.goal_id].push(t);
    });
    const map = {};
    allActivities.forEach(act => {
      const matchingGoal = allGoals.find(
        g => g.title.toLowerCase() === act.activity.toLowerCase() && g.status !== "completed" && !g.archived
      );
      if (matchingGoal) {
        const tasks = tasksByGoal[matchingGoal.id] || [];
        const remaining = tasks.filter(t => !t.completed).length;
        map[act.id] = { goal: matchingGoal, remaining, total: tasks.length };
      }
    });
    setSavedGoals(map);
  };

  useEffect(() => {
    const loadData = async () => {
      const dateStr = format(date, "yyyy-MM-dd");
      const existing = await base44.entities.DailyPillarTracking.filter({ date: dateStr });
      const ratingMap = {};
      const notesMap = {};
      const activitiesMap = {};
      existing.forEach((item) => {
        ratingMap[item.pillar_id] = item.rating;
        notesMap[item.pillar_id] = item.notes || "";
        activitiesMap[item.pillar_id] = item.selected_activities || [];
      });
      setRatings(ratingMap);
      setNotes(notesMap);
      setSelectedActivities(activitiesMap);
      setHasExistingEval(existing.length > 0);

      const gratitudeRecords = await base44.entities.DailyGratitude.filter({ date: dateStr });
      if (gratitudeRecords.length > 0) {
        setGratitude(gratitudeRecords[0].entry);
        setExistingGratitudeId(gratitudeRecords[0].id);
      }

      const allActivities = await base44.entities.PillarActivity.list();
      const grouped = {};
      allActivities.forEach(act => {
        if (!grouped[act.pillar_id]) grouped[act.pillar_id] = [];
        grouped[act.pillar_id].push(act);
      });
      setActivities(grouped);
      await loadSavedGoals(allActivities);
    };
    loadData();
  }, [date]);

  const handleRating = (pillarId, rating) => {
    setRatings({ ...ratings, [pillarId]: rating });
    setSuggestedGoalsOpen(rating <= 3);
  };
  const handleNext = () => {
    if (currentIndex < pillars.length) {
      setCurrentIndex(currentIndex + 1);
      setActivitiesExpanded(false);
      const nextPillar = pillars[currentIndex + 1];
      setSuggestedGoalsOpen(nextPillar ? (ratings[nextPillar.id] || 0) <= 3 : false);
    }
  };
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setActivitiesExpanded(false);
      const prevPillar = pillars[currentIndex - 1];
      setSuggestedGoalsOpen(prevPillar ? (ratings[prevPillar.id] || 0) <= 3 : false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");

    // Save pillar ratings
    for (const pillar of pillars) {
      if (ratings[pillar.id]) {
        const existing = await base44.entities.DailyPillarTracking.filter({ pillar_id: pillar.id, date: dateStr });
        if (existing.length > 0) {
          await base44.entities.DailyPillarTracking.update(existing[0].id, {
            rating: ratings[pillar.id],
            notes: notes[pillar.id],
            selected_activities: selectedActivities[pillar.id] || []
          });
        } else {
          await base44.entities.DailyPillarTracking.create({
            pillar_id: pillar.id,
            pillar_name: pillar.name,
            date: dateStr,
            rating: ratings[pillar.id],
            notes: notes[pillar.id],
            selected_activities: selectedActivities[pillar.id] || []
          });
        }
      }
    }

    // Save gratitude
    if (gratitude.trim()) {
      if (existingGratitudeId) {
        await base44.entities.DailyGratitude.update(existingGratitudeId, { entry: gratitude.trim() });
      } else {
        const created = await base44.entities.DailyGratitude.create({ date: dateStr, entry: gratitude.trim() });
        setExistingGratitudeId(created.id);
      }
    }

    // Create queued goals + tasks now that assessment is complete
    if (Object.keys(queuedGoals).length > 0) {
      const user = await base44.auth.me();
      for (const [activityId, { activity, settings }] of Object.entries(queuedGoals)) {
        const occurrences = parseInt(settings.occurrences) || 1;
        const sourcePillar = pillars.find(p => p.id === activity.pillar_id);
        const goal = await base44.entities.Goal.create({
          title: activity.activity,
          description: `From ${activity.pillar_name}`,
          timeframe: settings.frequency,
          occurrences,
          status: "not_started",
          member_name: user?.full_name || "User",
          category: activity.pillar_name,
          category_color: sourcePillar?.color || "#3b82f6"
        });
        await Promise.all(
          Array.from({ length: occurrences }, (_, i) =>
            base44.entities.GoalTask.create({
              goal_id: goal.id,
              title: occurrences > 1 ? `${activity.activity} (${i + 1}/${occurrences})` : activity.activity,
              frequency: settings.frequency,
              completed: false,
            })
          )
        );
      }
    }

    setLoading(false);
    setIsEditing(false);
    setQueuedGoals({});
    window.__evalInProgress = false;
    onSaved?.();
    onCompleted?.();
  };

  const handleDeleteEval = async () => {
    if (!confirm("Delete this evaluation? This cannot be undone.")) return;
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const allRecords = await base44.entities.DailyPillarTracking.filter({ date: dateStr });
    for (const record of allRecords) await base44.entities.DailyPillarTracking.delete(record.id);
    const gratitudeRecords = await base44.entities.DailyGratitude.filter({ date: dateStr });
    for (const g of gratitudeRecords) await base44.entities.DailyGratitude.delete(g.id);
    setRatings({});
    setNotes({});
    setSelectedActivities({});
    setGratitude("");
    setExistingGratitudeId(null);
    setHasExistingEval(false);
    setIsEditing(false);
    setQueuedGoals({});
    setLoading(false);
    onSaved?.();
  };

  const toggleActivity = (activityId) => {
    setSelectedActivities(prev => ({
      ...prev,
      [currentPillar.id]: prev[currentPillar.id]?.includes(activityId)
        ? prev[currentPillar.id].filter(id => id !== activityId)
        : [...(prev[currentPillar.id] || []), activityId]
    }));
  };

  const togglePendingGoal = (pillarId, activityId) => {
    setPendingGoalActivities(prev => {
      const current = new Set(prev[pillarId] || []);
      current.has(activityId) ? current.delete(activityId) : current.add(activityId);
      return { ...prev, [pillarId]: current };
    });
  };

  // Queue a goal for creation when Complete is clicked (does NOT save to DB yet)
  const queueGoal = (pillarId, activity) => {
    const raw = goalSettings[activity.id] || { occurrences: "", frequency: "" };
    const settings = { ...raw, occurrences: Math.max(1, parseInt(raw.occurrences) || 1), frequency: raw.frequency || "daily" };
    setQueuedGoals(prev => ({ ...prev, [activity.id]: { activity, settings } }));
    // Close the settings panel
    setPendingGoalActivities(prev => {
      const current = new Set(prev[pillarId] || []);
      current.delete(activity.id);
      return { ...prev, [pillarId]: current };
    });
  };

  const unqueueGoal = (activityId) => {
    setQueuedGoals(prev => {
      const next = { ...prev };
      delete next[activityId];
      return next;
    });
  };

  const currentPillar = pillars[currentIndex];
  const totalSteps = pillars.length + 1;
  const progress = currentIndex + 1;

  if (hasExistingEval && !isEditing) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-accent/10 border border-accent rounded-lg">
          <p className="text-sm mb-3">You've already completed an evaluation for {format(date, "MMMM d, yyyy")}.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDeleteEval} disabled={loading} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="p-3 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">{pillar.name}</p>
              <p className="text-2xl font-bold">{ratings[pillar.id] || "-"}</p>
            </div>
          ))}
        </div>
        {Object.values(notes).some(note => note) && (
          <div className="space-y-2 border-t pt-4">
            <h4 className="font-semibold text-sm">Notes</h4>
            {pillars.map((pillar) => notes[pillar.id] && (
              <div key={pillar.id} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium mb-1">{pillar.name}</p>
                <p className="text-sm text-foreground/80">{notes[pillar.id]}</p>
              </div>
            ))}
          </div>
        )}
        {gratitude && (
          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Gratitude</h4>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-foreground/80">{gratitude}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Daily Evaluation for {format(date, "MMMM d, yyyy")}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isEditing ? "Editing evaluation • " : ""}Step {progress} of {totalSteps}
        </p>
      </div>

      <div className="w-full bg-secondary rounded-full h-2">
        <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(progress / totalSteps) * 100}%` }} />
      </div>

      <div className="min-h-64 flex items-center justify-center">
        {isGratitudeStep ? (
          <div className="w-full max-w-md p-6 border rounded-lg space-y-4">
            <div className="space-y-2 text-center">
              <h4 className="text-2xl font-semibold">Gratitude</h4>
              <p className="text-sm text-muted-foreground">What is one thing you are grateful for today?</p>
            </div>
            <Textarea
              placeholder="I am grateful for..."
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              className="text-sm h-24 mt-2"
              autoFocus
            />
            {Object.keys(queuedGoals).length > 0 && (
              <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-3">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">
                  Goals to be created on completion ({Object.keys(queuedGoals).length}):
                </p>
                <ul className="space-y-1">
                  {Object.values(queuedGoals).map(({ activity, settings }) => (
                    <li key={activity.id} className="flex items-center justify-between text-xs text-green-700 dark:text-green-300">
                      <span>{activity.activity} — {settings.occurrences}x {settings.frequency}</span>
                      <button onClick={() => unqueueGoal(activity.id)} className="text-muted-foreground hover:text-destructive ml-2">✕</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-md p-6 border rounded-lg space-y-4">
            <div className="space-y-2">
              <h4 className="text-2xl font-semibold text-center">{currentPillar.name}</h4>
              <p className="text-sm text-muted-foreground text-center">How would you rate this pillar today?</p>
            </div>

            <div className="flex gap-3 justify-center mt-6">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => handleRating(currentPillar.id, num)}
                  className={`w-12 h-12 rounded-lg text-lg font-bold transition-all transform ${
                    ratings[currentPillar.id] === num
                      ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                      : "bg-secondary hover:bg-secondary/80 hover:scale-105"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            {ratings[currentPillar.id] && (
              <div className="mt-6 space-y-3 animate-in fade-in">
                {(activities[currentPillar.id] || []).length > 0 && (
                  <div className="border border-green-500/30 bg-green-500/5 rounded-lg p-3 space-y-2">
                    <button
                      onClick={() => setActivitiesExpanded(o => !o)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Activities Used</span>
                        {(selectedActivities[currentPillar.id]?.length > 0) && (
                          <span className="text-xs text-green-500 font-normal">
                            ({selectedActivities[currentPillar.id].length} selected)
                          </span>
                        )}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-green-500 transition-transform ${activitiesExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {activitiesExpanded && (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(activities[currentPillar.id] || []).map((activity) => (
                          <button
                            key={activity.id}
                            onClick={() => toggleActivity(activity.id)}
                            className={`w-full p-2 rounded-lg text-left text-sm transition-all flex items-center justify-between ${
                              selectedActivities[currentPillar.id]?.includes(activity.id)
                                ? "bg-green-500/20 border border-green-500/40 text-green-700 dark:text-green-300"
                                : "bg-secondary hover:bg-secondary/80"
                            }`}
                          >
                            <span>{activity.activity}</span>
                            {selectedActivities[currentPillar.id]?.includes(activity.id) && <Check className="w-4 h-4 text-green-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Add any notes (optional)</label>
                  <Textarea
                    placeholder="What contributed to this rating..."
                    value={notes[currentPillar.id] || ""}
                    onChange={(e) => setNotes({ ...notes, [currentPillar.id]: e.target.value })}
                    className="text-sm h-16 mt-1"
                  />
                </div>

                {(activities[currentPillar.id] || []).length > 0 && (
                  <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-3 space-y-2">
                    <button
                      onClick={() => setSuggestedGoalsOpen(o => !o)}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Suggested Goals</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${suggestedGoalsOpen ? "rotate-180" : ""}`} />
                    </button>
                    {suggestedGoalsOpen && <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {(activities[currentPillar.id] || []).map((activity) => {
                        const alreadySaved = savedGoals[activity.id];
                        const isQueued = !!queuedGoals[activity.id];
                        const isPending = pendingGoalActivities[currentPillar.id]?.has(activity.id);
                        const settings = goalSettings[activity.id] || { occurrences: "", frequency: "daily" };

                        // Already has an active goal from a previous session → green
                        if (alreadySaved) {
                          return (
                            <div key={activity.id} className="p-2.5 rounded-lg bg-green-500/15 border border-green-500/40 flex items-center justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">{activity.activity}</span>
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-500/20 px-2 py-0.5 rounded-full">
                                {alreadySaved.remaining} left
                              </span>
                            </div>
                          );
                        }

                        // Queued for creation on Complete → green-ish confirmation
                        if (isQueued) {
                          return (
                            <div key={activity.id} className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                              <span className="text-sm text-green-700 dark:text-green-300">{activity.activity}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  {queuedGoals[activity.id].settings.occurrences}x {queuedGoals[activity.id].settings.frequency}
                                </span>
                                <button
                                  onClick={() => unqueueGoal(activity.id)}
                                  className="text-xs text-muted-foreground hover:text-destructive"
                                >✕</button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={activity.id} className={`p-2.5 rounded-lg transition-all ${isPending ? "bg-amber-500/20 border border-amber-500/50" : "bg-secondary"}`}>
                            <button
                              onClick={() => togglePendingGoal(currentPillar.id, activity.id)}
                              className="w-full text-left text-sm flex items-center justify-between"
                            >
                              <span>{activity.activity}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                isPending
                                  ? "bg-amber-500/30 border-amber-500/60 text-amber-700 dark:text-amber-300"
                                  : "border-muted-foreground/30 text-muted-foreground"
                              }`}>
                                {isPending ? "Cancel" : "+ Goal"}
                              </span>
                            </button>

                            {isPending && (
                              <div className="mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-amber-600 dark:text-amber-400 w-20">Occurrences:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 3"
                                    value={settings.occurrences}
                                    onChange={(e) => setGoalSettings(prev => ({
                                      ...prev,
                                      [activity.id]: { ...settings, occurrences: e.target.value ? parseInt(e.target.value) : "" }
                                    }))}
                                    className="w-16 px-2 py-1 rounded text-xs border border-amber-500/50 bg-transparent"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-amber-600 dark:text-amber-400">Frequency</label>
                                  <div className="grid grid-cols-4 gap-1 p-1 bg-black/20 rounded-lg">
                                    {["daily", "weekly", "monthly", "annual"].map(freq => (
                                      <button
                                        key={freq}
                                        type="button"
                                        onClick={() => setGoalSettings(prev => ({
                                          ...prev,
                                          [activity.id]: { ...settings, frequency: freq }
                                        }))}
                                        className={`py-1 rounded-md text-xs font-medium transition-all capitalize ${
                                          settings.frequency === freq
                                            ? "bg-amber-500 text-white shadow-sm"
                                            : "text-amber-600/70 dark:text-amber-400/70 hover:text-amber-600 dark:hover:text-amber-300"
                                        }`}
                                      >
                                        {freq}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => queueGoal(currentPillar.id, activity)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" /> Add to Plan
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline" className="flex-1">
          Previous
        </Button>

        <div className="text-sm text-muted-foreground text-center flex-1">
          {progress} / {totalSteps}
        </div>

        {isGratitudeStep ? (
          <div className="flex-1 flex gap-2">
            {isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading} className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Complete"}
            </Button>
          </div>
        ) : (
          <Button onClick={handleNext} disabled={!ratings[currentPillar?.id]} className="flex-1">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}