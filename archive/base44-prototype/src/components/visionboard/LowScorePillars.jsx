import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";

export default function LowScorePillars({ pillars }) {
  const [lowScorePillars, setLowScorePillars] = useState([]);

  useEffect(() => {
    const fetchTodayScores = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const trackingRecords = await base44.entities.DailyPillarTracking.filter({
        date: today,
      });

      const low = trackingRecords
        .filter((record) => record.rating <= 3)
        .map((record) => pillars.find((p) => p.name === record.pillar_name))
        .filter(Boolean);

      setLowScorePillars(low);
    };

    fetchTodayScores();
  }, [pillars]);

  if (lowScorePillars.length === 0) return null;

  return (
    <div className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800/50 dark:to-slate-700/30 rounded-xl border border-sky-200 dark:border-slate-600">
      <p className="text-lg font-bold text-sky-900 dark:text-sky-200 mb-4">✨ Focus Areas for Today</p>
      <div className="flex flex-wrap gap-3">
        {lowScorePillars.map((pillar) => (
          <div key={pillar.name} className="px-5 py-3 rounded-xl bg-white dark:bg-slate-700/60 text-slate-800 dark:text-sky-100 font-semibold text-base shadow-sm border border-sky-100 dark:border-slate-600">
            {pillar.name}
          </div>
        ))}
      </div>
    </div>
  );
}