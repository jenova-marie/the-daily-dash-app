import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Play, Star, Plus } from "lucide-react";
import SwipeableListItem from "@/components/SwipeableListItem";

const PILLARS = [
  "Nutrition", "Fitness", "Mindset", "Rest", "Destress", "Play",
  "Education", "Career", "Home/Environment", "Relationships",
  "Self-esteem", "Financial", "Spirituality"
];

export default function AffirmationManager({ onApplyToSlideshow }) {
  const [affirmations, setAffirmations] = useState([]);
  const [selectedAffirmations, setSelectedAffirmations] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [newPillar, setNewPillar] = useState("");
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [focusPillars, setFocusPillars] = useState([]);

  useEffect(() => {
    loadAffirmations();
    loadFocusPillars();
  }, []);

  const loadFocusPillars = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const tracking = await base44.entities.DailyPillarTracking.filter({ date: today });
      const focused = tracking.filter((t) => t.rating <= 3).map((t) => t.pillar_name);
      setFocusPillars([...new Set(focused)]);
    } catch (error) {
      console.error("Error loading focus pillars:", error);
    }
  };

  const loadAffirmations = async () => {
    try {
      const aff = await base44.entities.Affirmation.list("-updated_date", 50);
      setAffirmations(aff);
    } catch (error) {
      console.error("Error loading affirmations:", error);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newText.trim()) {
      alert("Please enter an affirmation");
      return;
    }

    setAdding(true);
    try {
      const lines = newText.split('\n')
        .map(line => line.replace(/^\s*\d+[\.\)]\s*/, '').trim())
        .filter(line => line.length > 0);

      await Promise.all(lines.map(line =>
        base44.entities.Affirmation.create({
          text: line,
          pillar_name: (newPillar && newPillar !== "none") ? newPillar : undefined,
        })
      ));
      setNewText("");
      setNewPillar("");
      await loadAffirmations();
    } catch (error) {
      console.error("Error adding affirmation:", error);
      alert("Failed to add affirmation");
    }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this affirmation?")) return;
    try {
      await base44.entities.Affirmation.delete(id);
      const newSelected = new Set(selectedAffirmations);
      newSelected.delete(id);
      setSelectedAffirmations(newSelected);
      await loadAffirmations();
    } catch (error) {
      console.error("Error deleting affirmation:", error);
    }
  };

  const handleToggleFavorite = async (aff) => {
    try {
      await base44.entities.Affirmation.update(aff.id, { is_favorite: !aff.is_favorite });
      await loadAffirmations();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Build a flat list of selectable items, favorites first
  const expandedItems = [...affirmations]
    .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0))
    .map(aff => ({ key: aff.id, text: aff.text, pillar_name: aff.pillar_name, parentId: aff.id, is_favorite: aff.is_favorite, affRef: aff }));

  const toggleItem = (key) => {
    setSelectedAffirmations(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleApplyToSlideshow = () => {
    if (selectedAffirmations.size === 0) {
      alert("Please select at least one affirmation");
      return;
    }
    const selected = expandedItems.filter(i => selectedAffirmations.has(i.key)).map(i => i.text);
    onApplyToSlideshow?.(selected);
  };

  const handleGenerate = async (pillarToUse) => {
    const pillar = pillarToUse || newPillar;
    if (!pillar || pillar === "none") {
      alert("Please select a pillar to generate affirmations for");
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 3 brief, positive affirmations written in first person (using "I am", "I can", "I will", etc.) for someone focusing on improving their ${pillar}. Each affirmation should be one sentence, max 15 words, personal, motivating, and actionable. Format as a numbered list.`,
      });
      setNewText(result);
      setNewPillar(pillar);
    } catch (error) {
      console.error("Error generating affirmations:", error);
      alert("Failed to generate affirmations");
    }
    setGenerating(false);
  };

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading affirmations...</div>;
  }

  return (
    <div className="space-y-4">
      {focusPillars.length > 0 && (
        <div className="p-3 bg-accent/10 rounded-lg border border-accent/30">
          <p className="text-sm font-medium mb-2">Focus Areas Today</p>
          <div className="flex flex-wrap gap-2">
            {focusPillars.map((pillar) => (
              <Button
                key={pillar}
                onClick={() => handleGenerate(pillar)}
                disabled={generating}
                variant="outline"
                size="sm"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Generate for {pillar}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Add New Affirmation</label>
        <Textarea
          placeholder="Enter a positive affirmation..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          disabled={adding}
          className="min-h-20"
        />
        <div className="flex gap-2">
         <Select value={newPillar} onValueChange={setNewPillar} disabled={adding || generating}>
           <SelectTrigger>
             <SelectValue placeholder="Select a pillar (optional)" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="none">No specific pillar</SelectItem>
             {PILLARS.map((p) => (
               <SelectItem key={p} value={p}>{p}</SelectItem>
             ))}
           </SelectContent>
         </Select>
         <Button
          onClick={() => handleGenerate()}
          disabled={generating || !newPillar || newPillar === "none"}
          variant="outline"
          size="sm"
         >
           <Sparkles className="w-4 h-4 mr-1" />
           {generating ? "Generating..." : "Generate"}
         </Button>
        </div>
        <Button
         onClick={handleAdd}
         disabled={adding || !newText.trim()}
         className="w-full"
        >
         <Plus className="w-4 h-4 mr-2" />
         {adding ? "Adding..." : "Add Affirmation"}
        </Button>
      </div>

      <div className="space-y-2">
         <h3 className="font-semibold text-sm">Your Affirmations ({expandedItems.length})</h3>
         {expandedItems.length === 0 ? (
           <p className="text-sm text-muted-foreground py-4 text-center">No affirmations yet. Add one to get started!</p>
         ) : (
           <>
             <div className="space-y-1.5 max-h-96 overflow-y-auto">
               {expandedItems.map((item) => (
                 <SwipeableListItem key={item.key} onDelete={() => handleDelete(item.parentId)} className="bg-muted rounded-lg border border-border px-3 py-2">
                   <div className="flex items-start gap-2">
                     <Checkbox
                       checked={selectedAffirmations.has(item.key)}
                       onCheckedChange={() => toggleItem(item.key)}
                       className="mt-0.5 flex-shrink-0"
                     />
                     <div className="flex-1 min-w-0">
                       <p className="text-sm text-foreground break-words">{item.text}</p>
                       {item.pillar_name && (
                         <p className="text-xs text-muted-foreground mt-1">{item.pillar_name}</p>
                       )}
                     </div>
                     <button
                       onClick={() => handleToggleFavorite(item.affRef)}
                       className="transition-colors flex-shrink-0"
                       title={item.is_favorite ? "Unfavorite" : "Favorite"}
                     >
                       <Star className={`w-4 h-4 ${item.is_favorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`} />
                     </button>
                   </div>
                 </SwipeableListItem>
               ))}
             </div>
             {selectedAffirmations.size > 0 && (
               <Button
                 onClick={handleApplyToSlideshow}
                 className="w-full"
               >
                 <Play className="w-4 h-4 mr-2" />
                 Apply {selectedAffirmations.size} to Slideshow
               </Button>
             )}
           </>
         )}
       </div>
    </div>
  );
}