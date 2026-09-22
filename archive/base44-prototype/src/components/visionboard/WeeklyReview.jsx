import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export default function WeeklyReview({ date, pillars }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [dailyDetails, setDailyDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredData, setHoveredData] = useState(null);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [allTimeAverages, setAllTimeAverages] = useState({});
  const [threeMonthAverages, setThreeMonthAverages] = useState({});
  const [focalView, setFocalView] = useState("weekly"); // "weekly" | "3months" | "alltime"
  const [checklistSummary, setChecklistSummary] = useState([]); // [{item, count}]

  useEffect(() => {
    const loadChecklistSummary = async () => {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).map(d => format(d, "yyyy-MM-dd"));

      const [checklistItems, ...completionsByDay] = await Promise.all([
        base44.entities.DailyChecklist.filter({ is_active: true }),
        ...days.map(d => base44.entities.ChecklistCompletion.filter({ date: d })),
      ]);

      const allCompletions = completionsByDay.flat();
      const counts = {};
      allCompletions.forEach(c => {
        if (c.completed) counts[c.checklist_item_id] = (counts[c.checklist_item_id] || 0) + 1;
      });

      const summary = checklistItems
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(item => ({ item, count: counts[item.id] || 0 }));

      setChecklistSummary(summary);
    };
    loadChecklistSummary();
  }, [date]);

  useEffect(() => {
    const loadWeeklyData = async () => {
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

      const allRatings = await base44.entities.DailyPillarTracking.filter({});

      // Calculate all-time averages per pillar
      const allTimeAvgs = {};
      pillars.forEach((pillar) => {
        const ratings = allRatings.filter((r) => r.pillar_id === pillar.id && r.rating > 0).map((r) => r.rating);
        allTimeAvgs[pillar.name] = ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : 0;
      });
      setAllTimeAverages(allTimeAvgs);

      // Calculate 3-month averages per pillar
      const threeMonthsAgo = format(subMonths(date, 3), "yyyy-MM-dd");
      const threeMonthAvgs = {};
      pillars.forEach((pillar) => {
        const ratings = allRatings.filter((r) => r.pillar_id === pillar.id && r.rating > 0 && r.date >= threeMonthsAgo).map((r) => r.rating);
        threeMonthAvgs[pillar.name] = ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : 0;
      });
      setThreeMonthAverages(threeMonthAvgs);

      const data = days.map((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayLabel = format(day, "EEE");
        const entry = { date: dayLabel, dayFull: dayStr };

        pillars.forEach((pillar) => {
          const rating = allRatings.find(
            (r) => r.pillar_id === pillar.id && r.date === dayStr
          )?.rating || 0;
          entry[pillar.name] = rating;
        });

        return entry;
      });

      // Build daily details with notes and all pillar scores
      const details = {};
      days.forEach((day) => {
        const dayStr = format(day, "yyyy-MM-dd");
        const dayRatings = allRatings.filter((r) => r.date === dayStr);
        details[dayStr] = {
          ratings: dayRatings.reduce((acc, r) => {
            const pillar = pillars.find((p) => p.id === r.pillar_id);
            if (pillar) acc[pillar.name] = r.rating;
            return acc;
          }, {}),
          notes: dayRatings.map((r) => r.notes).filter(Boolean),
        };
      });

      setWeeklyData(data);
      setDailyDetails(details);
      setLoading(false);
    };

    loadWeeklyData();
  }, [date, pillars]);

  const calculateAverages = () => {
    const averages = {};
    pillars.forEach((pillar) => {
      const ratings = weeklyData
        .map((day) => day[pillar.name])
        .filter((r) => r > 0);
      averages[pillar.name] = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : 0;
    });
    return averages;
  };

  const averages = calculateAverages();

  // Only show pillars that have at least some data (handles hidden pillars with history)
  const visiblePillars = pillars.filter(p => allTimeAverages[p.name] > 0 || !p.is_hidden);

  const weeklyFocalAreas = Object.entries(averages)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);
  const threeMonthFocalAreas = Object.entries(threeMonthAverages)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);
  const allTimeFocalAreas = Object.entries(allTimeAverages)
    .filter(([, v]) => v > 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);
  const focalAreas = 
    focalView === "weekly" ? weeklyFocalAreas :
    focalView === "3months" ? threeMonthFocalAreas :
    allTimeFocalAreas;

  if (loading) return <div>Loading weekly data...</div>;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Weekly Review - {format(date, "MMM d")}</h3>

      <div className="p-4 bg-accent/10 border border-accent rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Focal Areas (Lowest Averages)</h4>
          <div className="flex rounded-full overflow-hidden border border-accent text-xs font-medium">
            <button
              onClick={() => setFocalView("weekly")}
              className={`px-3 py-1 transition-colors ${focalView === "weekly" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/20"}`}
            >
              This Week
            </button>
            <button
              onClick={() => setFocalView("3months")}
              className={`px-3 py-1 transition-colors ${focalView === "3months" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/20"}`}
            >
              3 Months
            </button>
            <button
              onClick={() => setFocalView("alltime")}
              className={`px-3 py-1 transition-colors ${focalView === "alltime" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/20"}`}
            >
              All Time
            </button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {focalAreas.length > 0 ? (
            focalAreas.map(([area, avg]) => (
              <span key={area} className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm flex items-center gap-1.5">
                {area}
                <span className="opacity-75 text-xs">{avg}</span>
              </span>
            ))
          ) : (
            <p className="text-muted-foreground">No data yet</p>
          )}
        </div>
      </div>

      {visiblePillars.length > 0 && (
       <div className="space-y-4">
         <div className="flex gap-2 flex-wrap">
           <button
             onClick={() => setSelectedPillar(null)}
             className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
               selectedPillar === null
                 ? "bg-primary text-primary-foreground"
                 : "bg-muted text-muted-foreground hover:bg-muted/80"
             }`}
           >
             All Pillars
           </button>
           {visiblePillars.map((pillar) => {
             const color = pillar.color || `hsl(${(visiblePillars.indexOf(pillar) * 360) / visiblePillars.length}, 70%, 55%)`;
             const isSelected = selectedPillar === pillar.id;
             return (
               <button
                 key={pillar.id}
                 onClick={() => setSelectedPillar(pillar.id)}
                 className={`px-3 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                   isSelected ? "text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                 }`}
                 style={isSelected ? { backgroundColor: color } : { borderLeft: `3px solid ${color}`, paddingLeft: "8px" }}
               >
                 {pillar.name}
               </button>
             );
           })}
         </div>

         <div className="flex gap-4">
           <div className="flex-1">
             <ResponsiveContainer width="100%" height={300}>
               <BarChart 
                 data={weeklyData}
                 onMouseMove={(state) => {
                   if (state.isTooltipActive && state.activeTooltipIndex !== undefined) {
                     setHoveredData(weeklyData[state.activeTooltipIndex]);
                   }
                 }}
                 onMouseLeave={() => setHoveredData(null)}
               >
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="date" />
                 <YAxis domain={[0, 5]} />
                 <Tooltip content={() => null} cursor={{ fill: 'rgba(0,0,0,0.1)' }} />
                 {selectedPillar
                   ? visiblePillars
                       .filter((p) => p.id === selectedPillar)
                       .map((pillar, idx) => (
                         <Bar
                           key={pillar.id}
                           dataKey={pillar.name}
                           fill={pillar.color || `hsl(${(idx * 360) / visiblePillars.length}, 70%, 55%)`}
                         />
                       ))
                   : visiblePillars.map((pillar, idx) => (
                       <Bar
                         key={pillar.id}
                         dataKey={pillar.name}
                         fill={pillar.color || `hsl(${(idx * 360) / visiblePillars.length}, 70%, 55%)`}
                       />
                     ))}
               </BarChart>
             </ResponsiveContainer>
           </div>

           {hoveredData && (
             <div className="w-56 bg-muted/50 border border-border rounded-lg p-4 h-fit sticky top-0 space-y-2">
               <p className="font-semibold text-sm mb-3">{hoveredData.date}</p>
               {[5, 4, 3, 2, 1].map((score) => {
                 const pillarsAtScore = (selectedPillar
                   ? visiblePillars.filter((p) => p.id === selectedPillar)
                   : visiblePillars
                 ).filter((p) => hoveredData[p.name] === score);
                 if (pillarsAtScore.length === 0) return null;
                 return (
                   <div key={score} className="bg-secondary/50 border border-border rounded-lg p-2">
                     <div className="flex items-start gap-2">
                       <span className="text-sm font-bold w-4 text-right shrink-0 pt-0.5">{score}</span>
                       <div className="flex gap-1 flex-wrap">
                         {pillarsAtScore.map((pillar) => (
                           <span
                             key={pillar.id}
                             className="px-2 py-0.5 rounded-full bg-muted text-foreground text-xs font-medium"
                           >
                             {pillar.name}
                           </span>
                         ))}
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
       </div>
      )}

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((score) => {
          const pillarsAtScore = visiblePillars.filter(
            (p) => averages[p.name] > 0 && Math.round(Number(averages[p.name])) === score
          );
          if (pillarsAtScore.length === 0) return null;
          return (
            <div key={score} className="bg-secondary/50 border border-border rounded-lg p-3">
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold w-5 text-right shrink-0 pt-0.5">{score}</span>
                <div className="flex gap-2 flex-wrap">
                  {pillarsAtScore.map((pillar) => (
                    <span
                      key={pillar.id}
                      className="px-3 py-1 rounded-full bg-muted text-foreground text-sm font-medium"
                    >
                      {pillar.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {checklistSummary.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-semibold">Daily Checklist — Week of {format(startOfWeek(date, { weekStartsOn: 0 }), "MMM d")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklistSummary.map(({ item, count }) => {
              const pct = count / 7;
              return (
                <div key={item.id} className="flex items-center gap-3 bg-secondary/40 border border-border rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", count === 7 ? "bg-green-500" : count >= 5 ? "bg-primary" : count >= 3 ? "bg-amber-500" : "bg-muted-foreground/40")}
                        style={{ width: `${pct * 100}%` }}
                      />
                    </div>
                    <span className={cn("text-sm font-mono tabular-nums font-semibold", count === 7 ? "text-green-500" : count >= 5 ? "text-primary" : count >= 3 ? "text-amber-500" : "text-muted-foreground")}>
                      {count}/7
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-4 border-t pt-4">
        <h4 className="font-semibold">Daily Breakdown</h4>
        {weeklyData.map((day) => (
          <div key={day.dayFull} className="border border-border rounded-lg p-4 space-y-3 transition-all duration-200 hover:border-primary hover:shadow-md hover:shadow-primary/20 hover:scale-[1.02]">
            <p className="font-medium text-foreground">{format(new Date(day.dayFull), "EEEE, MMM d, yyyy")}</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(dailyDetails[day.dayFull]?.ratings || {}).map(([pillarName, score]) => (
                <div key={pillarName} className="text-sm bg-muted/50 p-2 rounded transition-colors duration-150 hover:bg-primary/10">
                  <span className="text-muted-foreground">{pillarName}</span>
                  <span className="font-semibold ml-2 text-foreground">{score}</span>
                </div>
              ))}
            </div>
            {dailyDetails[day.dayFull]?.notes && dailyDetails[day.dayFull].notes.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                <div className="space-y-1">
                  {dailyDetails[day.dayFull].notes.map((note, idx) => (
                    <p key={idx} className="text-sm text-foreground/80">{note}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}