import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

const sourceColors = {
  calendar: "bg-blue-500",
  event: "bg-blue-600",
  custom: "bg-muted-foreground",
};

export default function SwipeableEventItem({ event, sourceColors: customSourceColors, onDelete, onUpdate, onReAddToTodo, hiddenFromTodo }) {
  const [swiped, setSwiped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    title: event.title,
    date: event.date,
    start_time: event.start_time,
    end_time: event.end_time,
    notes: event.notes || ""
  });
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTapTime = useRef(0);
  const colors = customSourceColors || sourceColors;

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    // Track double tap
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      setShowEditDialog(true);
    }
    lastTapTime.current = now;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - touchEndX;
    const deltaY = Math.abs(touchStartY.current - touchEndY);

    if (Math.abs(deltaX) > 50 && deltaY < 50) {
      if (deltaX > 0) {
        setSwiped(true);
      } else if (swiped) {
        setSwiped(false);
      }
    }
  };

  const handleConfirmDelete = async (deleteFromGoogle = false) => {
    setDeleting(true);
    try {
      await onDelete(event.id, deleteFromGoogle);
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    await base44.entities.ScheduleItem.update(event.id, {
      title: editForm.title,
      date: editForm.date,
      start_time: editForm.start_time,
      end_time: editForm.end_time,
      notes: editForm.notes
    });
    // Cross over edits to the signed-in Google Calendar if the event is linked
    if (event.google_event_id) {
      try {
        await base44.functions.invoke('syncAppEventToGoogle', {
          event: { ...event, ...editForm },
          eventAction: 'update'
        });
      } catch (err) {
        console.error('Google Calendar sync failed:', err);
      }
    }
    setShowEditDialog(false);
    setSaving(false);
    if (onUpdate) onUpdate();
  };

  return (
    <>
      <div
        className={cn(
          "p-3 rounded-lg transition-all overflow-hidden",
          swiped && "bg-red-50",
          hovered && !swiped && "bg-muted/60",
          !swiped && !hovered && "hover:bg-muted/60"
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={() => setShowEditDialog(true)}
      >
        <div className="flex items-center justify-between group">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", colors[event.source_type] || colors.custom)} />
              <span className="font-medium text-sm">{event.title}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(new Date(event.date + "T00:00:00"), "MMM d")} · {event.start_time} — {event.end_time}
            </div>
            {event.notes && <p className="text-xs mt-1">{event.notes.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()}</p>}
          </div>

          {(swiped || hovered) && (
            <div className="flex gap-1">
              {hiddenFromTodo && onReAddToTodo && (
                <button
                  onClick={() => onReAddToTodo(event.id)}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs transition-colors text-muted-foreground hover:bg-muted hover:text-primary"
                  title="Re-add to To Do"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                </button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0 opacity-100"
                onClick={() => setShowDeleteDialog(true)}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Delete Event?</DialogTitle>
             <DialogDescription>
               {event.google_event_id
                 ? "This event is synced with Google Calendar. Would you also like to delete it from Google?"
                 : "This action cannot be undone."}
             </DialogDescription>
           </DialogHeader>
           <div className="flex gap-2 justify-end flex-wrap">
             <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
               Cancel
             </Button>
             <Button variant="outline" onClick={() => handleConfirmDelete(false)} disabled={deleting}>
               Delete here only
             </Button>
             {event.google_event_id && (
               <Button variant="destructive" onClick={() => handleConfirmDelete(true)} disabled={deleting}>
                 Delete from Google too
               </Button>
             )}
             {!event.google_event_id && (
               <Button variant="destructive" onClick={() => handleConfirmDelete(false)} disabled={deleting}>
                 Delete
               </Button>
             )}
           </div>
         </DialogContent>
       </Dialog>

       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Edit Event</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <Label>Title</Label>
               <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
             </div>
             <div>
               <Label>Date</Label>
               <Popover>
                 <PopoverTrigger asChild>
                   <Button variant="outline" className="w-full justify-start">
                     {format(new Date(editForm.date + "T00:00:00"), "MMM d, yyyy")}
                   </Button>
                 </PopoverTrigger>
                 <PopoverContent align="start">
                   <Calendar
                     mode="single"
                     selected={new Date(editForm.date + "T00:00:00")}
                     onSelect={(date) => {
                       if (date) setEditForm({ ...editForm, date: format(date, "yyyy-MM-dd") });
                     }}
                   />
                 </PopoverContent>
               </Popover>
             </div>
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label>Start</Label>
                 <Input type="time" value={editForm.start_time} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} />
               </div>
               <div>
                 <Label>End</Label>
                 <Input type="time" value={editForm.end_time} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} />
               </div>
             </div>
             <div className="flex gap-2 justify-end">
               <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                 Cancel
               </Button>
               <Button onClick={handleSaveEdit} disabled={saving}>
                 {saving ? "Saving..." : "Save"}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
      </>
      );
      }