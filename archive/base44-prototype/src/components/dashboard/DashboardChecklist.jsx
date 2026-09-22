import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Sunrise, Sun, Sunset, Moon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeeklyChecklistCounts } from "@/lib/useWeeklyChecklistCounts";

const CATEGORY_BUCKETS = [
  { key: "morning",   label: "Morning",   icon: Sunrise, color: "text-amber-400" },
  { key: "afternoon", label: "Afternoon", icon: Sun,     color: "text-yellow-400" },
  { key: "evening",   label: "Evening",   icon: Sunset,  color: "text-orange-400" },
  { key: "anytime",   label: "Anytime",   icon: Clock,   color: "text-blue-400" },
];

export default function DashboardChecklist() {
  const [items, setItems] = useState([]);
  const [completions, setCompletions] = useState([]);
  const today = format(new Date(), "yyyy-MM-dd");
  const { counts: weeklyCounts } = useWeeklyChecklistCounts();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [checklistItems, todayCompletions] = await Promise.all([
      base44.entities.DailyChecklist.filter({ is_active: true }),
      base44.entities.ChecklistCompletion.filter({ date: today }),
    ]);
    setItems(checklistItems);
    setCompletions(todayCompletions);
  };

  const isCompleted = (itemId) => {
    return completions.some((c) => c.checklist_item_id === itemId && c.completed);
  };

  const toggleItem = async (itemId) => {
    const existing = completions.find((c) => c.checklist_item_id === itemId);
    if (existing) {
      await base44.entities.ChecklistCompletion.update(existing.id, {
        completed: !existing.completed,
        completed_at: !existing.completed ? new Date().toISOString() : null,
      });
    } else {
      await base44.entities.ChecklistCompletion.create({
        checklist_item_id: itemId,
        date: today,
        completed: true,
        completed_at: new Date().toISOString(),
      });
    }
    loadData();
  };

  const completedCount = items.filter((i) => isCompleted(i.id)).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;
  const pendingItems = items.filter((i) => !isCompleted(i.id));

  // Group by category
  const hasCategorized = pendingItems.some(i => i.category && i.category !== "anytime");
  const grouped = {};
  for (const b of CATEGORY_BUCKETS) grouped[b.key] = [];
  for (const item of pendingItems) {
    const key = item.category || "anytime";
    if (grouped[key]) grouped[key].push(item);
    else grouped["anytime"].push(item);
  }
  // Sort by label within each category bucket
  for (const b of CATEGORY_BUCKETS) {
    grouped[b.key].sort((a, b) => {
      const labelCompare = (a.label || "\uFFFF").localeCompare(b.label || "\uFFFF");
      if (labelCompare !== 0) return labelCompare;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }

  const renderItem = (item) => (
    <label
      className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <Checkbox
        checked={isCompleted(item.id)}
        onCheckedChange={() => toggleItem(item.id)}
      />
      <span className={`text-sm flex-1 ${isCompleted(item.id) ? "line-through text-muted-foreground" : ""}`}>
        {item.title}
      </span>
      {item.label && (
        <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: `${item.label_color || '#3b82f6'}25`, color: item.label_color || '#3b82f6' }}>
          {item.label}
        </span>
      )}
      <span className="text-xs font-mono shrink-0 text-muted-foreground/70 tabular-nums">
        {weeklyCounts[item.id] || 0}/7
      </span>
      {item.time_of_day && (
        <span className="text-xs text-muted-foreground shrink-0">{item.time_of_day}</span>
      )}
    </label>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">
          {completedCount}/{items.length} completed
        </span>
        <div className="w-24">
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {pendingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">All done for today!</p>
        ) : (
          CATEGORY_BUCKETS.map(({ key, label, icon: BucketIcon, color }) => {
            const bucketItems = grouped[key];
            if (!bucketItems?.length) return null;
            return (
              <div key={key}>
                <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1.5 px-2", color)}>
                  {label} ({bucketItems.length})
                </p>
                <div className="space-y-1">
                  {bucketItems.map((item, idx) => {
                    const prevItem = idx > 0 ? bucketItems[idx - 1] : null;
                    const showLabelHeader = item.label && (!prevItem || prevItem.label !== item.label);
                    return (
                      <div key={item.id}>
                        {showLabelHeader && (
                          <div className="text-[10px] font-semibold uppercase tracking-wide pt-1 pb-0.5 px-2" style={{ color: item.label_color || '#3b82f6' }}>
                            {item.label}
                          </div>
                        )}
                        {renderItem(item)}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
  }