import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLabelHistory, deleteLabelFromHistory, saveLabelToHistory } from "../utils/labelHistory";
import { X } from "lucide-react";

const PALETTE = [
  "", "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899", "#64748b", "#a16207",
];

export default function LabelPicker({ label, color, onLabelChange, onColorChange, onSelect }) {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(getLabelHistory());
  const [duplicateError, setDuplicateError] = useState(false);

  const handleDeleteLabel = (labelToDelete) => {
    deleteLabelFromHistory(labelToDelete);
    setHistory(getLabelHistory());
  };

  const handleLabelChange = (value) => {
    // Check for duplicate (case-insensitive) — allow if it's the exact same entry being edited
    const existing = getLabelHistory().find(
      h => h.label.toLowerCase() === value.toLowerCase() && h.label !== label
    );
    if (existing && value !== label) {
      // Auto-select the existing label's color to prevent divergent duplicates
      setDuplicateError(true);
      onLabelChange(existing.label); // normalize to existing casing
      onColorChange(existing.color || "");
      if (onSelect) onSelect(existing.label, existing.color || "");
      setShowHistory(false);
      return;
    }
    setDuplicateError(false);
    onLabelChange(value);
  };

  const handleLabelBlur = () => {
    // Auto-save to history when user finishes typing a label
    if (label && label.trim()) {
      saveLabelToHistory(label.trim(), color || "");
      setHistory(getLabelHistory());
    }
    setTimeout(() => setShowHistory(false), 150);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Label>Label</Label>
          <Input
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g. Health"
            onFocus={() => setShowHistory(true)}
            onBlur={handleLabelBlur}
            className={duplicateError ? "border-accent" : ""}
          />
          {duplicateError && (
            <p className="text-xs text-accent mt-1">Label already exists — using existing entry.</p>
          )}
          {showHistory && history.length > 0 && (
            <div
              className="absolute z-50 bg-background border border-border rounded-md shadow-md mt-1 max-h-40 overflow-y-auto w-full"
              onMouseDown={(e) => e.preventDefault()}
            >
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted group">
                  <button
                    type="button"
                    className="flex-1 text-left text-sm flex items-center gap-2"
                    onClick={() => { onLabelChange(h.label); onColorChange(h.color || ""); if (onSelect) onSelect(h.label, h.color || ""); setShowHistory(false); }}
                  >
                    {h.color && <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: h.color }} />}
                    {h.label}
                  </button>
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-opacity"
                    onClick={(e) => { e.stopPropagation(); handleDeleteLabel(h.label); }}
                    title="Delete label"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {PALETTE.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onColorChange(c);
                  if (label && label.trim()) {
                    saveLabelToHistory(label.trim(), c);
                    setHistory(getLabelHistory());
                  }
                }}
                className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c || "transparent",
                  borderColor: color === c ? "hsl(var(--foreground))" : (c || "hsl(var(--border))"),
                }}
                title={c || "No color"}
              />
            ))}
          </div>
        </div>
      </div>
      {label && color && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>{label}</span>
        </div>
      )}
    </div>
  );
}