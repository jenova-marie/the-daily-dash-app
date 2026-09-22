import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Zap, Heart } from "lucide-react";

// Priority order for focal areas (lowest index = highest priority)
const PILLAR_PRIORITY_ORDER = [
  "nutrition", "rest", "fitness", "home", "environment", "financial", "finances",
  "destress", "stress", "self-esteem", "self esteem", "relationships", "play",
  "career", "education", "mindset", "spirituality"
];

const getPillarPriority = (name) => {
  const lower = name.toLowerCase();
  const idx = PILLAR_PRIORITY_ORDER.findIndex(p => lower.includes(p));
  return idx === -1 ? 999 : idx;
};

export default function DashboardFocalAreas({ onHighlightChange }) {
  const [focalAreas, setFocalAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [latestGratitude, setLatestGratitude] = useState(null);

  useEffect(() => {
    const loadFocalAreas = async () => {
      try {
        const today = format(new Date(), "yyyy-MM-dd");

        const [pillars, allRatings, reminders, gratitudeRecords] = await Promise.all([
          base44.entities.HealthPillar.list(),
          base44.entities.DailyPillarTracking.list("-date", 200),
          base44.entities.ReminderSettings.list().catch(() => []),
          base44.entities.DailyGratitude.filter({ date: today }).catch(() => []),
        ]);

        // Find the most recent assessment date
        const mostRecentDate = allRatings.length > 0 ? allRatings[0].date : null;

        let focalList = [];

        if (mostRecentDate) {
          const recentRatings = allRatings.filter(r => r.date === mostRecentDate);
          const ratingMap = {};
          recentRatings.forEach(r => { ratingMap[r.pillar_id] = r.rating; });

          const scored = pillars
            .filter(p => ratingMap[p.id] !== undefined)
            .map(p => ({ id: p.id, name: p.name, rating: ratingMap[p.id] }));

          scored.sort((a, b) => {
            if (a.rating !== b.rating) return a.rating - b.rating;
            return getPillarPriority(a.name) - getPillarPriority(b.name);
          });

          focalList = scored.slice(0, 3);
        }

        setFocalAreas(focalList);

        // Check if assessment is completed for today
        const todayRatings = allRatings.filter(r => r.date === today);
        const isCompletedToday = mostRecentDate === today && todayRatings.length > 0;

        let highlight = !isCompletedToday;
        if (reminders.length > 0 && reminders[0].enabled && reminders[0].times) {
          const currentTime = format(new Date(), "HH:mm");
          const hasPassedReminderTime = reminders[0].times.some(t => t <= currentTime);
          highlight = !isCompletedToday && hasPassedReminderTime;
        }
        onHighlightChange?.(highlight);

        if (gratitudeRecords.length > 0) {
          setLatestGratitude(gratitudeRecords[0].entry);
        } else {
          setLatestGratitude(null);
        }
      } catch (error) {
        console.error("Error loading focal areas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFocalAreas();
  }, [onHighlightChange]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Zap className="w-5 h-5 text-accent mt-0.5" />
        <div className="flex-1">
          {focalAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete a daily evaluation to see focal areas.</p>
          ) : (
            <div className="space-y-2">
              {focalAreas.map((area, idx) => (
                <div key={area.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{idx + 1}. {area.name}</span>
                  <span className="text-sm font-bold bg-secondary px-2 py-0.5 rounded">{area.rating}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {latestGratitude && (
        <div className="flex items-start gap-3 pt-2 border-t border-border/50">
          <Heart className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Grateful for</p>
            <p className="text-sm italic text-foreground/80">"{latestGratitude}"</p>
          </div>
        </div>
      )}
    </div>
  );
}