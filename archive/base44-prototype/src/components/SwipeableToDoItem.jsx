import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Trash2, Library, CloudOff, Edit2, CalendarDays, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const sourceBackgroundColors = {
  event: "bg-blue-500/25 border-l-blue-500 text-white",
  calendar: "bg-blue-500/25 border-l-blue-500 text-white",
  goal: "bg-gray-500/25 border-l-gray-500",
};

const priorityBorderColors = {
  urgent: "border-l-4 border-l-red-600",
  high: "border-l-4 border-l-orange-500",
  medium: "border-l-4 border-l-cyan-500",
  low: "border-l-4 border-l-green-600",
};

export default function SwipeableToDoItem({ item, onComplete, onDelete, onEdit, onHide }) {
  const [swiped, setSwiped] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTapTime = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(deltaX) > 50 && deltaY < 50) {
      if (deltaX > 0) setSwiped(true);
      else if (swiped) setSwiped(false);
      return;
    }
    // Double tap detection
    const now = Date.now();
    if (now - lastTapTime.current < 350) {
      if (onEdit) onEdit(item);
    }
    lastTapTime.current = now;
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await onDelete(item, action);
      setShowDialog(false);
    } catch (e) {
      console.error("Delete action failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // Determine which options to show
  const isCalendarEvent = item.source_type === "calendar" || item.source_type === "event";
  const isGoogleTask = item.source_type === "task" && item.source_id;
  const isGoogleCalendar = isCalendarEvent && item.google_event_id;
  const hasGoogleOption = isGoogleTask || isGoogleCalendar;
  const hasAppEntityOption = ["task", "chore", "education", "goal"].includes(item.source_type) && item.source_id;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 py-2 px-2 rounded-md transition-all overflow-hidden",
          item.completed && "opacity-50 line-through",
          swiped && "bg-red-900/30",
          hovered && !swiped && !sourceBackgroundColors[item.source_type] && "bg-muted/60",
          (item.source_type === "task" || item.source_type === "custom") && item.priority && priorityBorderColors[item.priority],
          sourceBackgroundColors[item.source_type]
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={() => { if (onEdit) onEdit(item); }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {item.source_type !== "goal" && (
            <Checkbox checked={item.completed || false} onCheckedChange={() => onComplete(item)} />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-base font-medium">{item.title}</div>
            {item.start_time && (
              <div className="text-xs text-foreground opacity-60 mt-0.5">{item.start_time}</div>
            )}
          </div>
        </div>

        {(swiped || hovered) && !item.completed && (
          <div className="flex gap-1 shrink-0">
            <Button variant="destructive" size="sm" className="shrink-0" onClick={() => setShowDialog(true)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove "{item.title}"</DialogTitle>
            <DialogDescription>What would you like to do with this item?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-1">
            {isCalendarEvent ? (
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                disabled={loading}
                onClick={() => handleAction("keep_in_calendar")}
              >
                <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Keep in Calendar</div>
                  <div className="text-xs text-muted-foreground">Remove from To Do, keep visible on Calendar page</div>
                </div>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                disabled={loading}
                onClick={() => handleAction("library")}
              >
                <Library className="w-4 h-4 text-primary shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Send to Item Library</div>
                  <div className="text-xs text-muted-foreground">Keep it available to reschedule later</div>
                </div>
              </Button>
            )}

            {hasAppEntityOption && (
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 border-destructive/40 hover:bg-destructive/10"
                disabled={loading}
                onClick={() => handleAction("delete_app")}
              >
                <Trash2 className="w-4 h-4 text-destructive shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Delete from App</div>
                  <div className="text-xs text-muted-foreground">Permanently remove from this app</div>
                </div>
              </Button>
            )}

            {hasGoogleOption && (
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 border-destructive/40 hover:bg-destructive/10"
                disabled={loading}
                onClick={() => handleAction("delete_google")}
              >
                <CloudOff className="w-4 h-4 text-destructive shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Delete from Google</div>
                  <div className="text-xs text-muted-foreground">Permanently remove from Google Tasks / Calendar</div>
                </div>
              </Button>
            )}

            {!hasAppEntityOption && !hasGoogleOption && (
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 border-destructive/40 hover:bg-destructive/10"
                disabled={loading}
                onClick={() => handleAction("delete_app")}
              >
                <Trash2 className="w-4 h-4 text-destructive shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Delete Permanently</div>
                  <div className="text-xs text-muted-foreground">Remove this item entirely</div>
                </div>
              </Button>
            )}

            {onHide && !item.id?.startsWith("due-task-") && (
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3"
                disabled={loading}
                onClick={async () => { setLoading(true); await onHide(item); setShowDialog(false); setLoading(false); }}
              >
                <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="text-left">
                  <div className="font-medium text-sm">Hide from Schedule Grid</div>
                  <div className="text-xs text-muted-foreground">Keep in To Do list, but remove from the time grid</div>
                </div>
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowDialog(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}