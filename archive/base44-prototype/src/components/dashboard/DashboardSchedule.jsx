import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { printComponent, emailComponent } from "@/lib/printUtils";
import PrintFormatDailySchedule from "@/components/PrintFormatDailySchedule";
import PrintFormatCalendar from "@/components/PrintFormatCalendar";
import PrintRangeDialog from "@/components/PrintRangeDialog";

const isEvent = (item) => item.source_type === 'calendar' || item.source_type === 'event';

const borderColors = {
  calendar: "border-l-blue-500",
  event: "border-l-blue-500",
  task: "border-l-emerald-500",
  education: "border-l-purple-500",
  chore: "border-l-amber-500",
  custom: "border-l-muted-foreground",
};

const eventBgColors = {
  calendar: "bg-blue-500/20",
  event: "bg-blue-500/20",
};

const priorityBorderColors = {
  urgent: "border-l-red-600",
  high:   "border-l-orange-500",
  medium: "border-l-cyan-500",
  low:    "border-l-green-600",
};

const getEntryColor = (item) => {
  if ((item.source_type === 'task' || item.source_type === 'custom') && item.priority && priorityBorderColors[item.priority]) {
    return priorityBorderColors[item.priority];
  }
  return borderColors[item.source_type] || borderColors.custom;
};

export default function DashboardSchedule() {
  const [items, setItems] = useState([]);
  const [rangeDialog, setRangeDialog] = useState(null);
  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    base44.entities.ScheduleItem.filter({ date: today }).then((scheduleItems) => {
      const eventItems = scheduleItems.filter(i => (i.source_type === 'calendar' || i.source_type === 'event') && !i.deleted_from_app);
      setItems(eventItems);
    });
  }, []);

  const sortedItems = [...items].sort((a, b) => {
    const timeA = a.start_time || "00:00";
    const timeB = b.start_time || "00:00";
    return timeA.localeCompare(timeB);
  });

  const openRangeDialog = (mode) => setRangeDialog({ mode, start: today, end: today });

  const handleRangeConfirm = async (start, end) => {
    const { mode } = rangeDialog || {};
    const allItems = await base44.entities.ScheduleItem.filter({}, "-date", 1000);
    const rangeItems = allItems.filter((s) =>
      s.date >= start && s.date <= end &&
      (s.source_type === "calendar" || s.source_type === "event") &&
      !s.deleted_from_app && s.start_time
    );
    const title = `Daily Schedule (${start === end ? start : `${start} → ${end}`})`;
    if (mode === "print") printComponent(title, <PrintFormatCalendar events={rangeItems} title={title} />);
    else emailComponent(title, <PrintFormatCalendar events={rangeItems} title={title} />);
  };

  return (
    <>
    <div className="flex justify-end gap-1 no-print mb-2">
      <Button size="icon" variant="ghost" className="h-7 w-7 bg-secondary/50" onClick={() => openRangeDialog('print')} title="Print schedule"><Printer className="w-4 h-4" /></Button>
      <Button size="icon" variant="ghost" className="h-7 w-7 bg-secondary/50" onClick={() => openRangeDialog('email')} title="Email schedule"><Mail className="w-4 h-4" /></Button>
    </div>
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {sortedItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No items scheduled for today. Add items from Tasks, Education, or Calendar.
        </p>
      ) : (
        sortedItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 text-xs px-3 py-2 rounded-md border-l-4",
              isEvent(item) ? (eventBgColors[item.source_type] || "bg-blue-500/20") : "bg-muted/30",
              getEntryColor(item)
            )}
          >
            <p className="font-medium flex-1">{item.title}</p>
            <p className="text-muted-foreground/70 text-right shrink-0">{item.start_time}{item.end_time ? `–${item.end_time}` : ""}</p>
          </div>
        ))
      )}
    </div>
    <PrintRangeDialog
      open={!!rangeDialog}
      onOpenChange={(o) => !o && setRangeDialog(null)}
      title={rangeDialog?.mode === 'email' ? 'Email — Select Date Range' : 'Print — Select Date Range'}
      mode={rangeDialog?.mode || 'print'}
      defaultStart={rangeDialog?.start || today}
      defaultEnd={rangeDialog?.end || today}
      onConfirm={handleRangeConfirm}
    />
    </>
  );
}