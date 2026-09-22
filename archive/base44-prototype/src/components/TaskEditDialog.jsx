import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, EyeOff, CalendarIcon, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";

import ModernTimePicker from "@/components/ModernTimePicker";
import LabelPicker from "@/components/LabelPicker";
import { saveLabelToHistory } from "@/utils/labelHistory";
import { Link as LinkIcon, Plus, Trash2, ExternalLink } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TaskEditDialog({ task, open, onOpenChange, onUpdate, onHide }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(task?.title || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [dueDate, setDueDate] = useState(task?.due_date || "");
  const [dueTime, setDueTime] = useState(task?.due_time || "");
  const [category, setCategory] = useState(task?.category || "");
  const [categoryColor, setCategoryColor] = useState(task?.category_color || "");
  const [syncToGoogle, setSyncToGoogle] = useState(task?.google_task_id ? true : false);
  const [isRecurring, setIsRecurring] = useState(task?.is_recurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState(task?.recurrence_pattern || "weekly");
  const [selectedDays, setSelectedDays] = useState(task?.days_of_week || []);
  const [occurrences, setOccurrences] = useState(task?.occurrences || 1);
  const [links, setLinks] = useState(() => {
    try {
      return task?.links ? JSON.parse(task.links) : [];
    } catch {
      return [];
    }
  });
  const [notes, setNotes] = useState(task?.description || "");
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setPriority(task.priority || "medium");
      setDueDate(task.due_date || "");
      setDueTime(task.due_time || "");
      setCategory(task.category || "");
      setCategoryColor(task.category_color || "");
      setNotes(task.description || "");
      setIsRecurring(task.is_recurring || false);
      setRecurrencePattern(task.recurrence_pattern || "weekly");
      setSelectedDays(task.days_of_week || []);
      setOccurrences(task.occurrences || 1);
      try {
        setLinks(task.links ? JSON.parse(task.links) : []);
      } catch {
        setLinks([]);
      }
    }
  }, [task, open]);

  const toggleDay = (day) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const addLink = () => {
    if (urlInput.trim()) {
      setLinks([...links, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (category) saveLabelToHistory(category, categoryColor);
      await base44.entities.Task.update(task.id, {
        title,
        priority,
        due_date: dueDate,
        due_time: dueTime,
        category,
        category_color: categoryColor,
        description: notes,
        links: JSON.stringify(links),
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        days_of_week: (isRecurring && (recurrencePattern === "weekly" || recurrencePattern === "days_of_week")) ? selectedDays : [],
        occurrences: (isRecurring && recurrencePattern === "occurrences") ? occurrences : task.occurrences,
      });

      // Update linked ScheduleItems if due date or time changed
      if (dueDate !== task.due_date || dueTime !== task.due_time) {
        const scheduleItems = await base44.entities.ScheduleItem.filter({ source_id: task.id });
        for (const si of scheduleItems) {
          const updates = {};
          if (dueDate && dueDate !== task.due_date) updates.date = dueDate;
          if (dueTime !== task.due_time) updates.start_time = dueTime || si.start_time;
          if (Object.keys(updates).length > 0) {
            await base44.entities.ScheduleItem.update(si.id, updates);
          }
        }
      }
      
      // Sync to Google Tasks if linked and user enabled sync
      if (task.google_task_id && syncToGoogle) {
        await base44.functions.invoke('updateGoogleTask', {
          taskId: task.google_task_id,
          dueDate,
          dueTime
        }).catch(err => console.error('Google sync failed:', err));
      }
      
      onUpdate?.();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label>Task Name</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task name..." />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {task.google_task_id && <p className="text-xs text-muted-foreground">Synced with Google Tasks</p>}
          </div>
          <div>
            <Label>Category</Label>
            <LabelPicker
              label={category}
              color={categoryColor}
              onLabelChange={setCategory}
              onColorChange={setCategoryColor}
              onSelect={(lbl, clr) => { setCategory(lbl); setCategoryColor(clr); }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {dueDate ? format(parseISO(dueDate), "MMM d, yyyy") : <span className="text-muted-foreground">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate ? parseISO(dueDate) : undefined}
                    onSelect={(date) => setDueDate(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                  {dueDate && (
                    <div className="p-2 border-t border-border">
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setDueDate("")}>
                        Clear date
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Due Time</Label>
              <ModernTimePicker value={dueTime} onChange={setDueTime} />
            </div>
          </div>
          {/* Recurrence */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="edit-recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
              <label htmlFor="edit-recurring" className="text-sm cursor-pointer">Recurring task</label>
            </div>
            {isRecurring && (
              <div className="space-y-2 pl-6">
                <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Biweekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="days_of_week">Specific Days of Week</SelectItem>
                    <SelectItem value="occurrences">X Times Total</SelectItem>
                  </SelectContent>
                </Select>
                {(recurrencePattern === "weekly" || recurrencePattern === "days_of_week") && (
                  <div className="flex flex-wrap gap-1">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                          selectedDays.includes(day)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                )}
                {recurrencePattern === "occurrences" && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Total occurrences:</label>
                    <input
                      type="number"
                      min={1}
                      value={occurrences}
                      onChange={e => setOccurrences(parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 border border-input rounded text-sm bg-transparent"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {links.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={url}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs transition-colors group"
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.button === 1) return;
                    e.preventDefault();
                    e.currentTarget.target === "_blank" ? window.open(url) : (window.location.href = url);
                  }}
                >
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  {new URL(url).hostname.replace("www.", "")}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeLink(idx);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </a>
              ))}
            </div>
          )}
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add notes..."
              className="resize-none text-sm"
              rows={3}
            />
          </div>
          <div className="border-t border-border pt-3">
            <Label className="text-xs font-medium block mb-1.5">Add Link</Label>
            <div className="flex gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addLink()}
                placeholder="Paste URL..."
                className="flex-1 px-2.5 py-1.5 border border-input rounded text-xs bg-transparent"
              />
              <Button size="sm" onClick={addLink} disabled={!urlInput.trim()} className="px-2">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {task.google_task_id && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Checkbox checked={syncToGoogle} onCheckedChange={setSyncToGoogle} id="sync-google" />
              <label htmlFor="sync-google" className="text-sm cursor-pointer">Apply permanent changes to Google Tasks</label>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {onHide && (
              <Button variant="outline" className="gap-1.5" onClick={() => { onHide(task); onOpenChange(false); }}>
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