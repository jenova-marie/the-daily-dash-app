import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStoredRooms, saveCustomRoom, deleteCustomRoom, buildRoomOptions } from "@/lib/choreRooms";
const AGE_GROUPS = ["3-5", "5-7", "8-10", "11-13", "14-17", "18+", "Adult"];
const CHORE_TYPES = ["Cleaning", "Organizing", "Maintenance", "Meal", "Other"];
const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ChoreGenerator({ choreUsers, onChoresCreated }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [room, setRoom] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [choreType, setChoreType] = useState("");
  const [customChoreType, setCustomChoreType] = useState("");
  const [quantity, setQuantity] = useState("5");
  const [selectedChoreIndices, setSelectedChoreIndices] = useState(new Set());
  const [generatedChores, setGeneratedChores] = useState([]);
  const [choreOverrides, setChoreOverrides] = useState({});
  // Multi-user: Set of user IDs
  const [globalAssignTo, setGlobalAssignTo] = useState(new Set());
  const [step, setStep] = useState("config");
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [mealType, setMealType] = useState("");
  const [mealDays, setMealDays] = useState([]);
  const [customRoom, setCustomRoom] = useState(false);
  const [savedRooms, setSavedRooms] = useState(() => getStoredRooms());
  const allRoomOptions = buildRoomOptions();

  const toggleGlobalUser = (userId) => {
    setGlobalAssignTo(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const generate = async () => {
    if (!ageGroup) return;
    if (choreType !== "Meal" && !room) return;
    const finalChoreType = choreType === "Other" ? customChoreType : choreType;
    if (!finalChoreType) return;
    if (choreType === "Meal" && !mealType) return;

    setGenerating(true);
    try {
      const response = await base44.functions.invoke("generateChores", {
        room,
        choreType: finalChoreType,
        ageGroup,
        quantity: parseInt(quantity),
        mealType: choreType === "Meal" ? mealType : undefined
      });
      const chores = response.data?.chores || [];
      setGeneratedChores(chores);
      const validFrequencies = ["daily", "weekly", "biweekly", "monthly"];
      const overrides = {};
      chores.forEach((c, idx) => {
        const freq = choreType === "Meal" ? "weekly" : (validFrequencies.includes(c.frequency) ? c.frequency : "weekly");
        // Auto-select unassigned if no global users selected
        const assignTo = globalAssignTo.size > 0 ? new Set(globalAssignTo) : new Set(["__unassigned__"]);
        overrides[idx] = { assigned_to: assignTo, frequency: freq };
      });
      setChoreOverrides(overrides);
      setStep("selecting");
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate chores. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleChoreSelection = (idx) => {
    const newSelected = new Set(selectedChoreIndices);
    if (newSelected.has(idx)) newSelected.delete(idx);
    else newSelected.add(idx);
    setSelectedChoreIndices(newSelected);
  };

  const toggleAllChores = () => {
    if (selectedChoreIndices.size === generatedChores.length) {
      setSelectedChoreIndices(new Set());
    } else {
      setSelectedChoreIndices(new Set(generatedChores.map((_, idx) => idx)));
    }
  };

  const setOverride = (idx, field, value) => {
    setChoreOverrides(prev => ({ ...prev, [idx]: { ...prev[idx], [field]: value } }));
  };

  const toggleOverrideUser = (idx, userId) => {
    setChoreOverrides(prev => {
      const current = new Set(prev[idx]?.assigned_to || globalAssignTo);
      if (current.has(userId)) {
        current.delete(userId);
      } else {
        // Remove "unassigned" sentinel when a user is added
        current.delete("__unassigned__");
        current.add(userId);
      }
      return { ...prev, [idx]: { ...prev[idx], assigned_to: current } };
    });
  };

  const assignChores = async (libraryOnly = false) => {
    if (selectedChoreIndices.size === 0) return;

    // Save custom room to persistent storage
    if (customRoom && room?.trim()) {
      saveCustomRoom(room.trim());
      setSavedRooms(getStoredRooms());
    }

    try {
       const selectedChores = generatedChores.filter((_, idx) => selectedChoreIndices.has(idx));
        const existingLibraryChores = (saveToLibrary || libraryOnly) ? await base44.entities.ChoreLibrary.list() : [];

        // Capture room and chore type immediately to prevent state changes
        const roomValue = choreType === "Meal" ? (mealType || "Meal") : room;

        for (let i = 0; i < selectedChores.length; i++) {
          const chore = selectedChores[i];
          const origIdx = generatedChores.indexOf(chore);
          const override = choreOverrides[origIdx] || {};
          let assignedUserIds = override.assigned_to instanceof Set ? [...override.assigned_to] : (globalAssignTo.size > 0 ? [...globalAssignTo] : []);

          // If no users selected, default to unassigned
          if (assignedUserIds.length === 0) {
            assignedUserIds = [null];
          }

          // Filter out unassigned sentinel if user IDs are present
          const hasUnassigned = assignedUserIds.includes("__unassigned__");
          if (hasUnassigned && assignedUserIds.length > 1) {
            assignedUserIds = assignedUserIds.filter(id => id !== "__unassigned__");
          } else if (hasUnassigned) {
            assignedUserIds = [null];
          }

        if (!libraryOnly) {
            // Create one chore per assigned user
            for (const userId of assignedUserIds) {
            const user = userId ? choreUsers.find(u => u.id === userId) : null;
            const validFrequencies = ["daily", "weekly", "biweekly", "monthly"];
            const finalFreq = choreType === "Meal" ? "weekly"
              : (validFrequencies.includes(override.frequency) ? override.frequency
              : validFrequencies.includes(chore.frequency) ? chore.frequency : "weekly");
            const validPriorities = ["low", "medium", "high"];
            const finalPriority = validPriorities.includes(chore.priority?.toLowerCase()) ? chore.priority.toLowerCase() : "medium";
            await base44.entities.Chore.create({
               title: chore.title,
               description: chore.description,
               assigned_to: user ? user.id : "",
               frequency: finalFreq,
               day_of_week: choreType === "Meal" && override.days?.length ? override.days : undefined,
               room: roomValue,
               priority: finalPriority,
               status: "pending",
               time_estimate: parseInt(chore.time_estimate) || 30,
               chore_type: choreType === "Meal" ? "Meal" : undefined
             });
          }
        }

        if (saveToLibrary || libraryOnly) {
           const finalFreq = ["daily", "weekly", "biweekly", "monthly"].includes(override.frequency) ? override.frequency : (["daily", "weekly", "biweekly", "monthly"].includes(chore.frequency) ? chore.frequency : "weekly");
           const isDuplicate = existingLibraryChores.some(lib => 
             lib.title?.toLowerCase() === chore.title?.toLowerCase() && 
             lib.frequency === finalFreq &&
             (lib.room || "") === (roomValue || "") &&
             (lib.priority || "medium") === (["low", "medium", "high"].includes(chore.priority?.toLowerCase()) ? chore.priority.toLowerCase() : "medium") &&
             (lib.chore_type || "") === (choreType || "")
           );
           if (!isDuplicate) {
             const libPriority = ["low", "medium", "high"].includes(chore.priority?.toLowerCase()) ? chore.priority.toLowerCase() : "medium";
             const description = choreType === "Meal" ? `${chore.description}\nAge Group: ${ageGroup}` : chore.description;
             await base44.entities.ChoreLibrary.create({
               title: chore.title,
               description: description,
               frequency: finalFreq,
               time_estimate: parseInt(chore.time_estimate) || 30,
               priority: libPriority,
               room: roomValue,
               chore_type: choreType
             });
           }
         }
      }

      setOpen(false);
      resetState();
      onChoresCreated?.();
    } catch (error) {
      console.error("Assignment failed:", error);
      alert("Failed to assign chores. Please try again.");
    }
  };

  const resetState = () => {
    setStep("config");
    setGeneratedChores([]);
    setChoreOverrides({});
    setSelectedChoreIndices(new Set());
    setGlobalAssignTo(new Set());
    setRoom("");
    setAgeGroup("");
    setChoreType("");
    setCustomChoreType("");
    setMealType("");
    setMealDays([]);
    setSaveToLibrary(false);
    setQuantity("5");
    setCustomRoom(false);
    setSavedRooms(getStoredRooms());
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="AI Generator" className="bg-secondary/50">
          <Wand2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle>Generate Chores with AI</DialogTitle></DialogHeader>

        {step === "config" && (
          <div className="space-y-4">
            {/* Multi-user assign */}
            <div>
              <Label>Assign To</Label>
              {choreUsers?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {choreUsers.map(u => (
                    <button key={u.id} type="button" onClick={() => toggleGlobalUser(u.id)}
                      className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                        globalAssignTo.has(u.id) ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                      {u.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">No household members yet. Add members from the chores page to assign chores.</p>
              )}
            </div>

            <div>
              <Label>Age Group</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger><SelectValue placeholder="Select age group" /></SelectTrigger>
                <SelectContent position="popper">
                  {AGE_GROUPS.map(age => <SelectItem key={age} value={age}>{age} years</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type of Chore</Label>
              <Select value={choreType} onValueChange={setChoreType}>
                <SelectTrigger><SelectValue placeholder="Select chore type" /></SelectTrigger>
                <SelectContent position="popper">
                  {CHORE_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {choreType !== "Meal" && choreType !== "" && (
              <div>
                <Label>Room</Label>
                <Select
                  value={customRoom ? "__custom__" : room}
                  onValueChange={v => {
                    if (v === "__custom__") { setCustomRoom(true); setRoom(""); }
                    else { setCustomRoom(false); setRoom(v); }
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                  <SelectContent position="popper">
                    {allRoomOptions.map(r => (
                      <div key={r} className="flex items-center gap-1 px-2 py-1.5 hover:bg-muted/50 group">
                        <SelectItem value={r} className="flex-1 p-0">{r}</SelectItem>
                        {savedRooms.some(sr => sr.toLowerCase() === r.toLowerCase()) && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              deleteCustomRoom(r);
                              setSavedRooms(getStoredRooms());
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                            title="Delete custom room"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <SelectItem value="__custom__">Other (custom)…</SelectItem>
                  </SelectContent>
                </Select>
                {customRoom && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom room name…"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                  />
                )}
              </div>
            )}

            {choreType === "Other" && (
              <div>
                <Label>Describe the Type of Chore</Label>
                <Input
                  placeholder="e.g., Yard Work, Pet Care, etc."
                  value={customChoreType}
                  onChange={(e) => setCustomChoreType(e.target.value)}
                />
              </div>
            )}

            {choreType === "Meal" && (
              <div>
                <Label>Meal Type</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {MEAL_TYPES.map(m => (
                    <button key={m} type="button" onClick={() => setMealType(m)}
                      className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                        mealType === m ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Quantity</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity(q => String(Math.max(1, parseInt(q) - 1)))}
                  className="h-9 w-9 rounded-full border border-input bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-medium transition-colors"
                >−</button>
                <span className="w-8 text-center text-lg font-semibold tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => String(Math.min(50, parseInt(q) + 1)))}
                  className="h-9 w-9 rounded-full border border-input bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-medium transition-colors"
                >+</button>
              </div>
            </div>

            <Button onClick={generate} disabled={(!room && choreType !== "Meal") || (customRoom && !room) || !ageGroup || !choreType || (choreType === "Other" && !customChoreType) || (choreType === "Meal" && !mealType) || generating} className="w-full gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? "Generating..." : "Generate Chores"}
            </Button>
          </div>
        )}

        {step === "selecting" && generatedChores.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Generated Items ({generatedChores.length})</Label>
              <Button variant="ghost" size="sm" onClick={toggleAllChores} className="text-xs h-7">
                {selectedChoreIndices.size === generatedChores.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {/* Global multi-user assign all */}
            {choreUsers?.length > 0 && (
              <div>
                <Label className="text-xs mb-1.5 block">Assign all to:</Label>
                <div className="flex flex-wrap gap-2">
                  {choreUsers.map(u => (
                    <button key={u.id} type="button"
                      onClick={() => {
                        const next = new Set(globalAssignTo);
                        if (next.has(u.id)) next.delete(u.id); else next.add(u.id);
                        setGlobalAssignTo(next);
                        setChoreOverrides(prev => {
                          const updated = { ...prev };
                          generatedChores.forEach((_, idx) => { updated[idx] = { ...updated[idx], assigned_to: new Set(next) }; });
                          return updated;
                        });
                      }}
                      className={cn("px-3 py-1 rounded-full text-xs border transition-colors",
                        globalAssignTo.has(u.id) ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 -webkit-overflow-scrolling-touch">
              {generatedChores.map((chore, idx) => (
                <div key={idx} className={cn("border rounded-lg p-3 transition-colors", selectedChoreIndices.has(idx) ? "border-primary bg-primary/5" : "border-border bg-muted/20")}>
                  <div className="flex items-start gap-2 cursor-pointer" onClick={() => toggleChoreSelection(idx)}>
                    <Checkbox checked={selectedChoreIndices.has(idx)} onCheckedChange={() => toggleChoreSelection(idx)} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{chore.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{chore.description}</p>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <span>⏱ {chore.time_estimate} min</span>
                        <span className={cn("px-1.5 py-0.5 rounded text-white",
                          chore.priority === "high" ? "bg-red-500" : chore.priority === "medium" ? "bg-yellow-500" : "bg-green-500")}>
                          {chore.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedChoreIndices.has(idx) && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-border">
                      <div>
                        <Label className="text-xs mb-1 block">Assign To</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {/* Unassigned option */}
                          {choreUsers?.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setChoreOverrides(prev => {
                                  const current = new Set(prev[idx]?.assigned_to || globalAssignTo);
                                  if (current.has("__unassigned__")) {
                                    current.delete("__unassigned__");
                                  } else {
                                    current.clear();
                                    current.add("__unassigned__");
                                  }
                                  return { ...prev, [idx]: { ...prev[idx], assigned_to: current } };
                                });
                              }}
                              className={cn("px-2 py-0.5 rounded-full text-xs border transition-colors",
                                (choreOverrides[idx]?.assigned_to instanceof Set ? choreOverrides[idx].assigned_to : globalAssignTo).has("__unassigned__")
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted hover:bg-muted/80 border-transparent"
                              )}
                            >
                              Unassigned
                            </button>
                          )}
                          {choreUsers?.length > 0 && choreUsers.map(u => {
                            const itemUsers = choreOverrides[idx]?.assigned_to instanceof Set
                              ? choreOverrides[idx].assigned_to
                              : globalAssignTo;
                            return (
                              <button key={u.id} type="button" onClick={() => toggleOverrideUser(idx, u.id)}
                                className={cn("px-2 py-0.5 rounded-full text-xs border transition-colors",
                                  itemUsers.has(u.id) ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                                {u.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Frequency</Label>
                        <Select value={choreOverrides[idx]?.frequency || chore.frequency} onValueChange={(v) => setOverride(idx, "frequency", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {choreType === "Meal" && (
                        <div>
                          <Label className="text-xs mb-1 block">Days of the Week</Label>
                          <div className="flex flex-wrap gap-1">
                            {DAYS_OF_WEEK.map(d => {
                              const itemDays = choreOverrides[idx]?.days ?? [];
                              const selected = itemDays.includes(d);
                              return (
                                <button key={d} type="button"
                                  onClick={() => {
                                    const current = choreOverrides[idx]?.days ?? [];
                                    const next = current.includes(d) ? current.filter(x => x !== d) : [...current, d];
                                    setOverride(idx, "days", next);
                                  }}
                                  className={cn("px-2 py-0.5 rounded-full text-xs border transition-colors",
                                    selected ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                                  {d}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50 border border-border">
              <Checkbox id="save-library" checked={saveToLibrary} onCheckedChange={setSaveToLibrary} />
              <label htmlFor="save-library" className="text-sm cursor-pointer">Save selected to library for future use</label>
            </div>

            <div className="flex gap-2 pt-2 flex-wrap">
              <Button variant="outline" onClick={() => setStep("config")} className="flex-1">Back</Button>
              <Button
                variant="outline"
                onClick={() => assignChores(true)}
                disabled={selectedChoreIndices.size === 0}
                className="flex-1 gap-2"
              >
                Save to Library
              </Button>
              <Button onClick={() => assignChores(false)} disabled={selectedChoreIndices.size === 0} className="flex-1 gap-2">
                <Plus className="w-4 h-4" /> Add {selectedChoreIndices.size} Item(s)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}