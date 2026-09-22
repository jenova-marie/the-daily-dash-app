import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ModernTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const [hour, setHour] = useState(() => {
    if (!value) return "09";
    return value.split(":")[0];
  });
  
  const [minute, setMinute] = useState(() => {
    if (!value) return "00";
    return value.split(":")[1];
  });

  const handleConfirm = () => {
    onChange(`${hour}:${minute}`);
    setIsOpen(false);
  };

  const displayTime = value ? (
    new Date(`2024-01-01T${value}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  ) : (
    "Select time"
  );

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  return (
    <div className="relative w-full">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between",
          value ? "text-foreground" : "text-muted-foreground"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {displayTime}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border border-border rounded-lg shadow-lg p-4 w-64">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Hours */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">
                  Hour
                </label>
                <div className="border border-border rounded-md overflow-y-auto max-h-32">
                  <div className="flex flex-col">
                    {hours.map((h) => (
                      <button
                        key={h}
                        onClick={() => setHour(h)}
                        className={cn(
                          "px-3 py-2 text-sm text-center hover:bg-accent transition-colors",
                          hour === h &&
                            "bg-primary text-primary-foreground font-semibold"
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Minutes */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-2">
                  Minute
                </label>
                <div className="border border-border rounded-md overflow-y-auto max-h-32">
                  <div className="flex flex-col">
                    {minutes.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMinute(m)}
                        className={cn(
                          "px-3 py-2 text-sm text-center hover:bg-accent transition-colors",
                          minute === m &&
                            "bg-primary text-primary-foreground font-semibold"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview and Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-sm font-medium">
                {`${hour}:${minute}`}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}