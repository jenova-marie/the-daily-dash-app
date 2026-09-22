import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Loader2, Plus, Trash2, ChevronDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildRoomOptions } from "@/lib/choreRooms";

const CHORE_TYPES = ["Cleaning", "Organizing", "Laundry", "Cooking/Dishes", "Yard Work", "Maintenance", "Meal"];

export default function ChoreLibraryDialog({ choreUsers, onChoresAssigned }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [libraryChores, setLibraryChores] = useState([]); // merged library + custom
  const [filteredChores, setFilteredChores] = useState([]);
  const [roomFilter, setRoomFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChoreIds, setSelectedChoreIds] = useState(new Set());
  // Global user selection (default for all chores)
  const [globalUserIds, setGlobalUserIds] = useState(new Set());
  // Per-chore user overrides: { [choreId]: Set<userId> }
  const [choreUserOverrides, setChoreUserOverrides] = useState({});
  // Per-chore frequency overrides: { [choreId]: string }
  const [choreFreqOverrides, setChoreFreqOverrides] = useState({});
  // Which chore has its user picker expanded
  const [expandedChoreId, setExpandedChoreId] = useState(null);
  const [userFilter, setUserFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  // Track existing chore assignments: { choreTitle: [userName, ...] }
  const [existingAssignments, setExistingAssignments] = useState({});
  const allRoomOptions = buildRoomOptions(libraryChores.map(c => c.room).filter(Boolean));

  useEffect(() => {
    if (open) {
      loadLibraryChores();
      loadExistingAssignments();
    }
  }, [open]);

  useEffect(() => {
    filterChores();
  }, [libraryChores, roomFilter, typeFilter, searchQuery, userFilter, ageFilter]);

  const loadLibraryChores = async () => {
    setLoading(true);
    try {
      const [libChores, customChores] = await Promise.all([
        base44.entities.ChoreLibrary.list("-updated_date", 100),
        base44.entities.Chore.list("-created_date", 500),
      ]);

      // Build existing assignments map from custom chores
      const map = {};
      customChores.forEach(c => {
        const key = c.title?.toLowerCase();
        if (!key) return;
        if (!map[key]) map[key] = [];
        const user = choreUsers.find(u => u.id === c.assigned_to);
        if (user && !map[key].includes(user.name)) map[key].push(user.name);
      });
      setExistingAssignments(map);

      // Deduplicate custom chores by title (keep one representative per unique title)
      const libTitles = new Set(libChores.map(c => c.title?.toLowerCase()));
      const seenCustomTitles = new Set();
      const customUnique = customChores
        .filter(c => {
          const key = c.title?.toLowerCase();
          if (!key || libTitles.has(key) || seenCustomTitles.has(key)) return false;
          seenCustomTitles.add(key);
          return true;
        })
        .map(c => ({ ...c, _isCustom: true })); // tag as custom so we don't show delete

      setLibraryChores([...libChores, ...customUnique]);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAssignments = async () => {
    // No-op: handled inside loadLibraryChores now
  };

  const filterChores = () => {
    let filtered = libraryChores;
    if (roomFilter) filtered = filtered.filter(c => (c.room || "").trim().toLowerCase() === roomFilter.trim().toLowerCase());
    if (typeFilter === "Meal") filtered = filtered.filter(c => c.chore_type === "Meal");
    else if (typeFilter === "Chores") filtered = filtered.filter(c => c.chore_type !== "Meal");
    if (typeFilter === "Meal" && ageFilter) filtered = filtered.filter(c => c.description?.includes(ageFilter));
    if (typeFilter !== "Meal" && userFilter) filtered = filtered.filter(c => c.assigned_to === userFilter);
    if (searchQuery) filtered = filtered.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredChores(filtered);
  };

  const toggleChoreSelection = (choreId) => {
    const newSelected = new Set(selectedChoreIds);
    if (newSelected.has(choreId)) newSelected.delete(choreId);
    else newSelected.add(choreId);
    setSelectedChoreIds(newSelected);
  };

  const toggleGlobalUser = (userId) => {
    setGlobalUserIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  // Get effective user ids for a chore (override or global)
  const getEffectiveUserIds = (choreId) => {
    return choreUserOverrides[choreId] ?? globalUserIds;
  };

  const toggleChoreUser = (choreId, userId) => {
    setChoreUserOverrides(prev => {
      const base = prev[choreId] ?? new Set(globalUserIds);
      const next = new Set(base);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return { ...prev, [choreId]: next };
    });
    // Auto-select the chore when any user is toggled on
    setSelectedChoreIds(prev => {
      const next = new Set(prev);
      next.add(choreId);
      return next;
    });
  };

  const isChoreOverridden = (choreId) => !!choreUserOverrides[choreId];

  const clearChoreOverride = (choreId) => {
    setChoreUserOverrides(prev => {
      const next = { ...prev };
      delete next[choreId];
      return next;
    });
  };

  const assignSelectedChores = async () => {
    if (selectedChoreIds.size === 0) return;
    const selectedChores = filteredChores.filter(c => selectedChoreIds.has(c.id));
    for (const chore of selectedChores) {
      const userIds = [...getEffectiveUserIds(chore.id)];
      if (userIds.length === 0) continue;
      for (const uid of userIds) {
        const choreData = {
          title: chore.title,
          description: chore.description,
          assigned_to: uid,
          frequency: choreFreqOverrides[chore.id] || chore.frequency,
          room: chore.room || "",
          priority: chore.priority || "medium",
          chore_type: chore.chore_type || "",
          status: "pending",
          time_estimate: chore.time_estimate || 0
        };
        if (Array.isArray(chore.day_of_week) && chore.day_of_week.length > 0) {
          choreData.day_of_week = chore.day_of_week;
        }
        await base44.entities.Chore.create(choreData);
      }
    }
    setOpen(false);
    setSelectedChoreIds(new Set());
    setGlobalUserIds(new Set());
    setChoreUserOverrides({});
    setChoreFreqOverrides({});
    setExpandedChoreId(null);
    setRoomFilter(""); setTypeFilter(""); setUserFilter(""); setAgeFilter(""); setSearchQuery("");
    onChoresAssigned?.();
  };

  const deleteChoreFromLibrary = async (choreId) => {
    if (!confirm("Delete this chore from the library?")) return;
    await base44.entities.ChoreLibrary.delete(choreId);
    setLibraryChores(libraryChores.filter(c => c.id !== choreId));
  };

  const totalAssignments = [...selectedChoreIds].reduce((acc, cid) => {
    return acc + getEffectiveUserIds(cid).size;
  }, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Chore Library" className="bg-secondary/50">
          <BookOpen className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Chore Library</DialogTitle></DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-xs">Search</Label>
                <Input placeholder="Search chores..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="text-sm" />
              </div>
              {typeFilter !== "Meal" && (
                <div>
                  <Label className="text-xs">Location</Label>
                  <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="All locations" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All Locations</SelectItem>
                      {allRoomOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Types</SelectItem>
                    <SelectItem value="Chores">Chores</SelectItem>
                    <SelectItem value="Meal">Meals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {typeFilter === "Meal" && (
                <div>
                  <Label className="text-xs">Meal Type</Label>
                  <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="All meals" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>All Meals</SelectItem>
                      <SelectItem value="Breakfast">Breakfast</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                      <SelectItem value="Dinner">Dinner</SelectItem>
                      <SelectItem value="Snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Global User Selection */}
            <div className="border border-border/50 rounded-lg p-3 bg-muted/20">
              <Label className="text-sm font-semibold mb-2 block">Default: Assign To</Label>
              <div className="flex flex-wrap gap-2">
                {choreUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => toggleGlobalUser(user.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      globalUserIds.has(user.id)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">You can override per-chore below</p>
            </div>

            {/* Chore List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Available Chores ({filteredChores.length})</Label>
                {filteredChores.length > 0 && (
                  <button
                    onClick={() => {
                      const allSelected = filteredChores.every(c => selectedChoreIds.has(c.id));
                      if (allSelected) {
                        setSelectedChoreIds(new Set());
                      } else {
                        setSelectedChoreIds(new Set(filteredChores.map(c => c.id)));
                      }
                    }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {filteredChores.every(c => selectedChoreIds.has(c.id)) ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredChores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No chores found</p>
                ) : filteredChores.map(chore => {
                  const isSelected = selectedChoreIds.has(chore.id);
                  const overridden = isChoreOverridden(chore.id);
                  const effectiveUsers = [...getEffectiveUserIds(chore.id)];
                  const effectiveUserNames = effectiveUsers.map(id => choreUsers.find(u => u.id === id)?.name).filter(Boolean);
                  const existingNames = existingAssignments[chore.title?.toLowerCase()] || [];
                  const isExpanded = expandedChoreId === chore.id;
                  // Only show "already assigned" if chore is selected AND all selected users already have it
                  const alreadyAdded = isSelected && effectiveUsers.length > 0 && existingNames.length > 0 && (
                    effectiveUsers.every(uid => {
                      const uName = choreUsers.find(u => u.id === uid)?.name;
                      return uName && existingNames.includes(uName);
                    })
                  );

                  return (
                    <div key={chore.id} className={cn("rounded-lg border transition-all", alreadyAdded ? "border-border/30 bg-muted/10 opacity-60" : isSelected ? "border-primary/40 bg-primary/5" : "border-border/50")}>
                      <div className="flex items-start gap-2 p-2.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => !alreadyAdded && toggleChoreSelection(chore.id)}
                          disabled={alreadyAdded}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium">{chore.title}</p>
                            {chore._isCustom && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/60 border border-border/50 text-muted-foreground font-medium">My Chore</span>
                            )}
                            {alreadyAdded && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-600 dark:text-green-400 font-medium">Already assigned</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                            {chore.room && <span>{chore.room}</span>}
                            {chore.time_estimate > 0 && <span>⏱ {chore.time_estimate}min</span>}
                            <span>📅 {chore.frequency}</span>
                            {chore.chore_type && <span>• {chore.chore_type}</span>}
                          </div>
                          {/* Currently assigned - highlight by user color */}
                          {existingNames.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground/60">Assigned:</span>
                              {existingNames.map(n => {
                                const u = choreUsers.find(u => u.name === n);
                                return (
                                  <span
                                    key={n}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border"
                                    style={u?.color
                                      ? { backgroundColor: u.color + "30", borderColor: u.color + "60", color: u.color }
                                      : { backgroundColor: "hsl(var(--primary)/0.15)", borderColor: "hsl(var(--primary)/0.4)", color: "hsl(var(--primary))" }
                                    }
                                  >{n}</span>
                                );
                              })}
                            </div>
                          )}
                          {/* Effective assignment preview */}
                          {isSelected && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              <span className="text-[10px] text-primary/70">→ Assigning to:</span>
                              {effectiveUserNames.length > 0
                                ? effectiveUserNames.map(n => (
                                    <span key={n} className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", overridden ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400" : "bg-primary/10 border-primary/30 text-primary")}>{n}</span>
                                  ))
                                : <span className="text-[10px] text-destructive">No user selected</span>
                              }
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setExpandedChoreId(isExpanded ? null : chore.id)}
                            className={cn("p-1 rounded text-xs flex items-center gap-1 transition-colors", isExpanded ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                            title="Override users for this chore"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <ChevronDown className={cn("w-3 h-3 transition-transform", isExpanded && "rotate-180")} />
                          </button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteChoreFromLibrary(chore.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Per-chore user override */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 border-t border-border/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground font-medium">Override users for this chore</span>
                            {overridden && (
                              <button onClick={() => clearChoreOverride(chore.id)} className="text-[10px] text-muted-foreground hover:text-foreground underline">Reset to default</button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {choreUsers.map(user => {
                              const checked = getEffectiveUserIds(chore.id).has(user.id);
                              return (
                                <button
                                  key={user.id}
                                  onClick={() => toggleChoreUser(chore.id, user.id)}
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                                    checked
                                      ? "bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-400"
                                      : "bg-muted/40 border-border text-muted-foreground hover:bg-muted"
                                  )}
                                >
                                  {user.name}
                                </button>
                              );
                            })}
                          </div>
                          <div className="mt-3">
                            <span className="text-xs text-muted-foreground font-medium block mb-1.5">Frequency</span>
                            <Select
                              value={choreFreqOverrides[chore.id] || chore.frequency}
                              onValueChange={(val) => setChoreFreqOverrides(prev => ({ ...prev, [chore.id]: val }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper">
                                <SelectItem value="once">Once</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                                <SelectItem value="as_needed">As Needed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button
                onClick={assignSelectedChores}
                disabled={selectedChoreIds.size === 0 || totalAssignments === 0}
                className="flex-1 gap-2"
              >
                <Plus className="w-4 h-4" />
                Assign {selectedChoreIds.size} Chore{selectedChoreIds.size !== 1 ? "s" : ""} ({totalAssignments} assignment{totalAssignments !== 1 ? "s" : ""})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}