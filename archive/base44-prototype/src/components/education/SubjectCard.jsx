import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import WidgetCard from "../WidgetCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookMarked, ChevronDown, ChevronRight, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import ActivityLinksDialog from "./ActivityLinksDialog";

// Single activity row with tap-to-reveal actions
function ActivityRow({ act, toggleActivity, deleteActivity, handleActivityDoubleClick }) {
  const [expanded, setExpanded] = useState(false);

  const handleRowClick = (e) => {
    if (e.target.closest('input[type="checkbox"]') || e.target.closest('button') || e.target.closest('a')) return;
    setExpanded(o => !o);
  };

  return (
    <div className="rounded-md overflow-hidden">
      <div
        className={cn("flex items-center gap-2 py-1.5 px-1 cursor-pointer transition-colors", expanded ? "bg-muted/60" : "hover:bg-muted/30")}
        onClick={handleRowClick}
      >
        <Checkbox checked={act.completed} onCheckedChange={() => toggleActivity(act)} className="shrink-0" />
        <span className={cn("flex-1 text-sm leading-snug truncate", act.completed && "line-through text-muted-foreground")}>
          {act.title}
        </span>
        {act.due_date && (
          <span className="text-xs text-muted-foreground/60 whitespace-nowrap shrink-0">{act.due_date}</span>
        )}
      </div>

      {expanded && (
        <div className="bg-muted/40 border-t border-border/30">
          {(act.notes || act.description) && (
            <p className="px-3 py-2 text-xs text-muted-foreground leading-relaxed">
              {act.notes || act.description}
            </p>
          )}
          <div className="flex items-center gap-2 px-2 py-1.5 border-t border-border/20">
            <ActivityLinksDialog
              activity={act}
              onSave={(links) => base44.entities.EducationActivity.update(act.id, { resource_links: links })}
            />
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleActivityDoubleClick(act); setExpanded(false); }}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-secondary hover:bg-secondary/80 active:scale-95 transition-all shadow-md"
                title="Edit"
              >
                <Pencil className="w-4 h-4 text-foreground" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteActivity(act.id); }}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-red-800 hover:bg-red-700 active:scale-95 transition-all shadow-md"
                title="Delete"
              >
                <X className="w-4 h-4 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// A collapsible section for Assignments or Activities
function TypeSection({ title, items, forceCollapsed, toggleActivity, deleteActivity, handleActivityDoubleClick }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(!forceCollapsed);
  }, [forceCollapsed]);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-border/40 pt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 w-full text-left py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        {title} <span className="font-normal normal-case tracking-normal text-muted-foreground/60">({items.length})</span>
      </button>

      {open && (
        <div className="mt-1 space-y-0.5">
          {items.map((act) => (
            <ActivityRow
              key={act.id}
              act={act}
              toggleActivity={toggleActivity}
              deleteActivity={deleteActivity}
              handleActivityDoubleClick={handleActivityDoubleClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubjectCard({ learnerId, subject, subjectPlans, subjectActivities, frequencyLabels, openEditPlan, openActivityDialog, deletePlan, deleteActivity, toggleActivity, forceCollapsed, defaultExpanded, onIndividualToggle }) {
  const cardId = `edu-${learnerId}-${subject}`;
  const defaultCollapsed = forceCollapsed ?? (defaultExpanded ? false : true);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    setCollapsed(forceCollapsed ?? (defaultExpanded ? false : true));
  }, [forceCollapsed]);
  const [editingActivity, setEditingActivity] = useState(null);
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleActivityDoubleClick = (activity) => {
    setEditingActivity({ ...activity, edit_days_of_week: activity.days_of_week || [] });
  };

  const saveActivityEdit = async () => {
    if (!editingActivity) return;
    const { id, edit_days_of_week, ...updateData } = editingActivity;
    if (edit_days_of_week) updateData.days_of_week = edit_days_of_week;
    await base44.entities.EducationActivity.update(id, updateData);
    setEditingActivity(null);
  };

  const saveActivityToLibrary = async () => {
    if (!editingActivity) return;
    try {
      await base44.entities.FavoriteActivity.create({
        learner_id: editingActivity.learner_id,
        title: editingActivity.title,
        description: editingActivity.notes || "",
        type: editingActivity.type,
        duration: "",
        materials: ""
      });
      alert("Saved to Activity Library!");
      setEditingActivity(null);
    } catch (error) {
      console.error("Failed to save to library:", error);
    }
  };

  const assignments = subjectActivities
    .filter(a => a.type === "assignment")
    .sort((a, b) => {
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    });

  const activities = subjectActivities.filter(a => a.type === "activity");

  return (
    <WidgetCard
      key={cardId}
      title={
        <button
          onClick={() => { setCollapsed(c => !c); onIndividualToggle?.(cardId); }}
          onDoubleClick={() => openEditPlan(subjectPlans[0])}
          className="flex items-center gap-1.5 font-semibold text-sm tracking-wide uppercase text-muted-foreground hover:text-foreground transition-colors"
          title="Double-click to edit plan"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {subject}
        </button>
      }
      headerRight={
        <button
          onClick={() => openActivityDialog({ id: subjectPlans[0]?.id, learner_id: learnerId, subject })}
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          title="Add Assignment / Activity"
        >
          <Plus className="w-4 h-4" />
        </button>
      }
      id={cardId}
    >
      {!collapsed && (
        <div className="space-y-1">
          <TypeSection
            title="Assignments"
            items={assignments}
            forceCollapsed={forceCollapsed}
            toggleActivity={toggleActivity}
            deleteActivity={deleteActivity}
            handleActivityDoubleClick={handleActivityDoubleClick}
          />
          <TypeSection
            title="Activities"
            items={activities}
            forceCollapsed={forceCollapsed}
            toggleActivity={toggleActivity}
            deleteActivity={deleteActivity}
            handleActivityDoubleClick={handleActivityDoubleClick}
          />
          {subjectActivities.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">No items yet. Click + to add.</p>
          )}
        </div>
      )}

      {/* Activity Edit Dialog */}
      <Dialog open={!!editingActivity} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editingActivity?.type === "assignment" ? "Assignment" : "Activity"}</DialogTitle>
          </DialogHeader>
          {editingActivity && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={editingActivity.title} onChange={(e) => setEditingActivity({...editingActivity, title: e.target.value})} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editingActivity.type} onValueChange={(v) => setEditingActivity({...editingActivity, type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={editingActivity.frequency} onValueChange={(v) => setEditingActivity({...editingActivity, frequency: v, edit_days_of_week: []})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(frequencyLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(editingActivity.frequency === "weekly" || editingActivity.frequency === "biweekly") && (
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {daysOfWeek.map((day) => (
                      <button key={day} type="button" onClick={() => setEditingActivity({...editingActivity, edit_days_of_week: editingActivity.edit_days_of_week.includes(day) ? editingActivity.edit_days_of_week.filter(d => d !== day) : [...editingActivity.edit_days_of_week, day]})}
                        className={cn("w-10 h-10 rounded-full text-xs border transition-colors font-medium", editingActivity.edit_days_of_week.includes(day) ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-muted/80 border-transparent")}>
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <Label>Due Date (Optional)</Label>
                <Input type="date" value={editingActivity.due_date || ""} onChange={(e) => setEditingActivity({...editingActivity, due_date: e.target.value})} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={editingActivity.notes || ""} onChange={(e) => setEditingActivity({...editingActivity, notes: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <Button onClick={saveActivityEdit} className="flex-1">Save Changes</Button>
                <Button onClick={saveActivityToLibrary} variant="outline" className="gap-1">
                  <BookMarked className="w-4 h-4" /> Save to Library
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </WidgetCard>
  );
}