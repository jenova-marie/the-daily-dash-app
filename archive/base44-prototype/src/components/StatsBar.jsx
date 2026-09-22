import { cn } from "@/lib/utils";

export default function StatsBar({ stats }) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {stats.map(({ label, value, color }) => (
        <div
          key={label}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
            "bg-black/20 backdrop-blur-sm border border-white/10",
            color || "text-foreground"
          )}
        >
          <span className="text-muted-foreground">{label}</span>
          <span className={cn("font-bold tabular-nums", color)}>{value}</span>
        </div>
      ))}
    </div>
  );
}