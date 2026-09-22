import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const hours = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, "0"));
const minutes = ["00", "15", "30", "45"];

function parseTime(timeStr) {
  if (!timeStr) return { h: "12", m: "00", ampm: "AM" };
  const [hh, mm] = timeStr.split(":");
  const h24 = parseInt(hh, 10);
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? "12" : String(h24 % 12).padStart(2, "0");
  return { h: h12, m: mm || "00", ampm };
}

function toTime24(h, m, ampm) {
  let h24 = parseInt(h, 10);
  if (ampm === "AM" && h24 === 12) h24 = 0;
  if (ampm === "PM" && h24 !== 12) h24 += 12;
  return `${String(h24).padStart(2, "0")}:${m}`;
}

function formatDisplay(timeStr) {
  if (!timeStr) return null;
  const { h, m, ampm } = parseTime(timeStr);
  return `${h}:${m} ${ampm}`;
}

export default function TimePicker({ value, onChange, placeholder = "Pick a time" }) {
  const { h, m, ampm } = parseTime(value);
  const [open, setOpen] = useState(false);

  const update = (newH, newM, newAmpm) => {
    onChange(toTime24(newH, newM, newAmpm));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <Clock className="mr-2 h-4 w-4 shrink-0" />
          <span className={value ? "" : "text-muted-foreground"}>{value ? formatDisplay(value) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="flex gap-2 items-start">
          {/* Hours */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground text-center mb-1">Hour</p>
            <div className="grid grid-cols-3 gap-1">
              {hours.map((hr) => (
                <button
                  key={hr}
                  onClick={() => update(hr, m, ampm)}
                  className={cn(
                    "px-2 py-1.5 rounded text-sm font-medium transition-colors",
                    h === hr ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {hr}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px bg-border self-stretch" />

          {/* Minutes */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground text-center mb-1">Min</p>
            <div className="flex flex-col gap-1">
              {minutes.map((min) => (
                <button
                  key={min}
                  onClick={() => update(h, min, ampm)}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    m === min ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  :{min}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px bg-border self-stretch" />

          {/* AM/PM */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground text-center mb-1">AM/PM</p>
            <div className="flex flex-col gap-1">
              {["AM", "PM"].map((period) => (
                <button
                  key={period}
                  onClick={() => update(h, m, period)}
                  className={cn(
                    "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                    ampm === period ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-border flex justify-between items-center">
          <span className="text-sm font-medium">{formatDisplay(value) || "—"}</span>
          <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}