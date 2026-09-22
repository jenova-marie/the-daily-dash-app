import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CategoryFilter({ categories, selectedCategories, onSelectionChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategory = (cat) => {
    // Single-select: clicking the already-selected one deselects, otherwise select only this one
    if (selectedCategories.includes(cat)) {
      onSelectionChange([]);
    } else {
      onSelectionChange([cat]);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  return (
    <div className="space-y-3 no-print">
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-between w-full sm:w-auto px-3 py-2 transition-all duration-200",
            isOpen && "ring-2 ring-primary/30 border-primary"
          )}
        >
          <span className="text-sm font-medium">
            {selectedCategories.length > 0 ? selectedCategories[0] : "Filter by category"}
          </span>
          <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform duration-200", isOpen && "rotate-180")} />
        </Button>

        {isOpen && categories.length > 0 && (
          <div className="absolute top-full left-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 min-w-[240px] animate-in fade-in-0 zoom-in-95">
            <div className="p-3 space-y-1.5 max-h-64 overflow-y-auto">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150 cursor-pointer",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-border hover:border-primary/50"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {selectedCategories.map((cat) => (
            <Badge
              key={cat}
              className="flex items-center gap-1.5 px-3 py-1.5 cursor-pointer hover:bg-primary/90 transition-all duration-150 rounded-full"
              onClick={() => toggleCategory(cat)}
            >
              <span className="font-medium">{cat}</span>
              <X className="w-3.5 h-3.5" />
            </Badge>
          ))}
          <button
            onClick={clearAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}