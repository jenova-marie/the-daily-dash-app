import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer, Mail } from "lucide-react";

export default function PrintRangeDialog({ open, onOpenChange, title, mode = "print", defaultStart, defaultEnd, onConfirm }) {
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  useEffect(() => {
    if (open) {
      setStart(defaultStart);
      setEnd(defaultEnd);
    }
  }, [open, defaultStart, defaultEnd]);

  const handleConfirm = () => {
    if (!start || !end) return;
    onConfirm(start, end);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Date Range</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input type="date" value={start || ""} onChange={(e) => setStart(e.target.value)} className="text-xs h-8" />
              <span className="text-muted-foreground text-xs shrink-0">to</span>
              <Input type="date" value={end || ""} onChange={(e) => setEnd(e.target.value)} className="text-xs h-8" />
            </div>
          </div>
          <Button className="w-full" onClick={handleConfirm} disabled={!start || !end}>
            {mode === "email" ? (
              <><Mail className="w-4 h-4 mr-1.5" />Email</>
            ) : (
              <><Printer className="w-4 h-4 mr-1.5" />Print</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}