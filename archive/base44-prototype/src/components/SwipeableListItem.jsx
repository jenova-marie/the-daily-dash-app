import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SwipeableListItem({ children, onDelete, className, isBatchMode, isSelected, onBatchToggle, onToggleBatchMode }) {
  const [showDelete, setShowDelete] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const touchStartX = useRef(0);
  const isTouchDevice = useRef(false);
  const longPressTimer = useRef(null);
  const touchMoved = useRef(false);

  const handleTouchStart = (e) => {
    isTouchDevice.current = true;
    touchStartX.current = e.touches[0].clientX;
    touchMoved.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!touchMoved.current) setShowDelete(true);
    }, 500);
  };

  const handleTouchMove = (e) => {
    const diff = Math.abs(e.touches[0].clientX - touchStartX.current);
    if (diff > 10) {
      touchMoved.current = true;
      clearTimeout(longPressTimer.current);
    }
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice.current) setHovered(true);
  };

  const handleMouseLeave = () => {
    if (!isTouchDevice.current) setHovered(false);
  };

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    setShowConfirm(false);
    setShowDelete(false);
    await onDelete();
  };

  const handleBatchToggle = (e) => {
    e.stopPropagation();
    onBatchToggle?.();
  };

  const deleteVisible = (showDelete || hovered) && !isBatchMode;

  const itemRef = useRef(null);

  useEffect(() => {
    if (!showDelete) return;
    const handler = (e) => {
      if (itemRef.current && !itemRef.current.contains(e.target)) {
        setShowDelete(false);
      }
    };
    document.addEventListener("touchstart", handler, true);
    document.addEventListener("mousedown", handler, true);
    return () => {
      document.removeEventListener("touchstart", handler, true);
      document.removeEventListener("mousedown", handler, true);
    };
  }, [showDelete]);

  return (
    <>
      <div
        ref={itemRef}
        className={cn(
          "flex items-start gap-2 py-2 px-2 rounded-md transition-all overflow-hidden",
          hovered && !showDelete && "bg-muted/60",
          showDelete && "bg-red-500/10",
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
        {isBatchMode && (
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              variant={isSelected ? "default" : "outline"}
              size="icon"
              className="h-8 w-8 rounded-sm"
              onClick={handleBatchToggle}
            >
              <Checkbox checked={isSelected} onCheckedChange={() => {}} className="pointer-events-none" />
            </Button>
          </div>
        )}
        {deleteVisible && (
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              variant="destructive"
              size="sm"
              className="shrink-0 opacity-100"
              onClick={handleDeleteClick}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showConfirm} onOpenChange={(open) => { setShowConfirm(open); if (!open) setShowDelete(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowConfirm(false); setShowDelete(false); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}