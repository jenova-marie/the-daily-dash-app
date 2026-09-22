import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calendar as CalendarIcon, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { format, parse } from "date-fns";
import TimePicker from "@/components/TimePicker";

export default function EventEditDialog({ event, open, onOpenChange, onUpdate, onHide }) {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(event?.date || "");
  const [startTime, setStartTime] = useState(event?.start_time || "");
  const [endTime, setEndTime] = useState(event?.end_time || "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [syncToGoogle, setSyncToGoogle] = useState(event?.google_event_id ? true : false);

  useEffect(() => {
    if (event) {
      setDate(event.date || "");
      setStartTime(event.start_time || "");
      setEndTime(event.end_time || "");
    }
  }, [event, open]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await base44.entities.ScheduleItem.update(event.id, {
        date,
        start_time: startTime,
        end_time: endTime
      });

      // Sync to Google Calendar if linked and user enabled sync
      if (event.google_event_id && syncToGoogle) {
        await base44.functions.invoke('syncAppEventToGoogle', {
          event: { ...event, date, start_time: startTime, end_time: endTime },
          eventAction: 'update'
        }).catch(err => console.error('Google sync failed:', err));
      }

      onUpdate?.();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">{event.title}</p>
            {event.google_event_id && <p className="text-xs text-muted-foreground">Synced with Google Calendar</p>}
          </div>
          <div>
             <Label>Date</Label>
             <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
               <PopoverTrigger asChild>
                 <Button variant="outline" className="w-full justify-start text-left font-normal">
                   <CalendarIcon className="mr-2 h-4 w-4" />
                   {date ? format(parse(date, "yyyy-MM-dd", new Date()), "MMM d, yyyy") : "Pick a date"}
                 </Button>
               </PopoverTrigger>
               <PopoverContent className="w-auto p-0">
                 <Calendar
                   mode="single"
                   selected={date ? parse(date, "yyyy-MM-dd", new Date()) : undefined}
                   onSelect={(d) => {
                     setDate(format(d, "yyyy-MM-dd"));
                     setCalendarOpen(false);
                   }}
                   disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                 />
               </PopoverContent>
             </Popover>
           </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Time</Label>
              <TimePicker value={startTime} onChange={setStartTime} placeholder="Start time" />
            </div>
            <div>
              <Label>End Time</Label>
              <TimePicker value={endTime} onChange={setEndTime} placeholder="End time" />
            </div>
          </div>
          {event.google_event_id && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Checkbox checked={syncToGoogle} onCheckedChange={setSyncToGoogle} id="sync-google-event" />
              <label htmlFor="sync-google-event" className="text-sm cursor-pointer">Apply permanent changes to Google Calendar</label>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {onHide && (
              <Button variant="outline" className="gap-1.5" onClick={() => { onHide(event); onOpenChange(false); }}>
                <EyeOff className="w-4 h-4" /> Hide from Schedule
              </Button>
            )}
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}