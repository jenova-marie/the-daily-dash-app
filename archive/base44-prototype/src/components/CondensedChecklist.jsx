import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CondensedChecklist = forwardRef(function CondensedChecklist({ date }, ref) {
  const [items, setItems] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [hideCompleted, setHideCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem("checklist_hide_completed") || "false"); } catch { return false; }
  });
  const dateStr = format(date, "yyyy-MM-dd");

  useEffect(() => {
    loadData();
  }, [dateStr]);

  const loadData = async () => {
    const [checkItems, comps] = await Promise.all([
      base44.entities.DailyChecklist.filter({ is_active: true }),
      base44.entities.ChecklistCompletion.filter({ date: dateStr }),
    ]);
    
    const completedIds = new Set(comps.filter(c => c.completed).map(c => c.checklist_item_id));
    
    const sorted = checkItems.sort((a, b) => {
      const categoryOrder = { morning: 0, afternoon: 1, evening: 2, anytime: 3 };
      const aCat = categoryOrder[a.category] ?? 3;
      const bCat = categoryOrder[b.category] ?? 3;
      if (aCat !== bCat) return aCat - bCat;

      const aTime = a.time_of_day || "99:99";
      const bTime = b.time_of_day || "99:99";
      if (aTime !== bTime) return aTime.localeCompare(bTime);

      return (a.order ?? 0) - (b.order ?? 0);
    });
    
    setItems(sorted);
    setCompletions(comps);
  };

  const isCompleted = (itemId) => {
    return completions.some((c) => c.checklist_item_id === itemId && c.completed);
  };

  const toggleItem = async (itemId) => {
    const existing = completions.find((c) => c.checklist_item_id === itemId);
    if (existing) {
      await base44.entities.ChecklistCompletion.update(existing.id, { 
        completed: !existing.completed,
        completed_at: !existing.completed ? new Date().toISOString() : null 
      });
    } else {
      await base44.entities.ChecklistCompletion.create({
        checklist_item_id: itemId,
        date: dateStr,
        completed: true,
        completed_at: new Date().toISOString()
      });
    }
    loadData();
  };

  const completedCount = items.filter((i) => isCompleted(i.id)).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const categoryLabels = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", anytime: "Anytime" };
  const categoryOrder = ["morning", "afternoon", "evening", "anytime"];

  const displayItems = hideCompleted ? items.filter(i => !isCompleted(i.id)) : items;

  // Group by category
  const grouped = categoryOrder.reduce((acc, cat) => {
    const group = displayItems.filter(i => (i.category || "anytime") === cat);
    if (group.length > 0) acc[cat] = group;
    return acc;
  }, {});

  useImperativeHandle(ref, () => ({
    hideCompleted,
    setHideCompleted: (value) => {
      setHideCompleted(value);
      localStorage.setItem("checklist_hide_completed", JSON.stringify(value));
    },
  }));

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }} 
        />
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {categoryOrder.filter(cat => grouped[cat]).map(cat => (
          <div key={cat}>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">
              {categoryLabels[cat]}
            </div>
            <div className="space-y-1">
              {grouped[cat].map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 transition-colors">
                  <Checkbox 
                    checked={isCompleted(item.id)} 
                    onCheckedChange={() => toggleItem(item.id)}
                    className="shrink-0"
                  />
                  <span className={cn("text-xs flex-1 truncate", isCompleted(item.id) && "line-through text-muted-foreground")}>
                    {item.title}
                  </span>
                  {item.label && (
                    <span className="text-xs font-medium shrink-0 px-1.5 py-0.5 rounded text-primary bg-primary/10">
                      {item.label.toUpperCase()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default CondensedChecklist;