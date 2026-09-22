import { useState, useEffect } from "react";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import WidgetCard from "../components/WidgetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, X, Trash2, CheckSquare, Clock, ListTodo, GripVertical, Eye, EyeOff, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import LabelPicker from "../components/LabelPicker";
import { saveLabelToHistory } from "../utils/labelHistory";
import { format } from "date-fns";
import { useWeeklyChecklistCounts } from "@/lib/useWeeklyChecklistCounts";
import { cn } from "@/lib/utils";
import SwipeableListItem from "../components/SwipeableListItem";
import GenericOnboardingDialog from "../components/GenericOnboardingDialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";



const ONBOARDING_STEPS = [
  {
    icon: <CheckSquare className="w-8 h-8 text-green-400" />,
    title: "1. Create Daily Items",
    desc: "Click 'Add Item' to create routines you want to complete every day. Choose a category (Morning, Afternoon, Evening, or Anytime), set an optional time, and add a color label to organize them."
  },
  {
    icon: <Clock className="w-8 h-8 text-purple-400" />,
    title: "2. Check Off Your Progress",
    desc: "Click the checkbox next to each item to mark it complete. Your progress resets automatically each day. Track your completion rate with the progress bar at the top."
  },
  {
    icon: <GripVertical className="w-8 h-8 text-blue-400" />,
    title: "3. Reorder by Dragging",
    desc: "Press and hold any item to drag and reorder it within its category. You can also drag items between categories (e.g. move a Morning item to Evening)."
  },
  {
    icon: <ListTodo className="w-8 h-8 text-orange-400" />,
    title: "4. Organize & Manage",
    desc: "Edit items by double-clicking them. Use the 'Select' button for batch deletion. Items are automatically grouped by category (Morning, Afternoon, Evening, Anytime)."
  }
];

export default function DailyChecklist() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Daily Checklist"); return () => setTitle(""); }, []);
  
  const resetOnboarding = async () => {
    try {
      const themeSettings = await base44.entities.ThemeSettings.list("-updated_date", 1);
      if (themeSettings.length) {
        const onboardingStatus = JSON.parse(themeSettings[0].onboarding_status || "{}");
        delete onboardingStatus.dailychecklist_onboarded;
        await base44.entities.ThemeSettings.update(themeSettings[0].id, { onboarding_status: JSON.stringify(onboardingStatus) });
      }
    } catch (err) {
      console.error("Failed to reset onboarding:", err);
    }
    setShowOnboarding(true);
  };

  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={resetOnboarding} title="Guide" className="h-8 w-8 text-sm font-medium"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const [items, setItems] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", time_of_day: "", category: "morning", order: 0, label: "", label_color: "#3b82f6" });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBatchDeleteMode, setIsBatchDeleteMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", time_of_day: "", category: "morning", label: "", label_color: "#3b82f6" });
  const [today, setToday] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(() => localStorage.getItem("checklist_hideCompleted") === "true");
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [pageIndex, setPageIndex] = useState(0);
  const { counts: weeklyCounts, reload: reloadWeeklyCounts } = useWeeklyChecklistCounts();



  useEffect(() => { 
    loadData(); // eslint-disable-line react-hooks/exhaustive-deps
    
    // Set up midnight reset
    const scheduleMidnightReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeUntilMidnight = tomorrow.getTime() - now.getTime();
      return setTimeout(() => {
        setToday(format(new Date(), "yyyy-MM-dd"));
        scheduleMidnightReset();
      }, timeUntilMidnight);
    };

    const timer = scheduleMidnightReset();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => { loadData(); }, [today]);

  const loadData = async () => {
    const [checkItems, comps] = await Promise.all([
      base44.entities.DailyChecklist.filter({ is_active: true }),
      base44.entities.ChecklistCompletion.filter({ date: today }),
    ]);
    
    const allItems = checkItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    setItems(allItems);
    setCompletions(comps);
  };

  const createItem = async () => {
    if (!form.title) return;
    if (form.label) saveLabelToHistory(form.label, form.label_color);
    await base44.entities.DailyChecklist.create({ ...form, is_active: true });
    setForm({ title: "", time_of_day: "", category: "morning", order: 0, label: "", label_color: "" });
    setDialogOpen(false);
    loadData();
  };

  const deleteItem = async (id) => {
    await base44.entities.DailyChecklist.delete(id);
    loadData();
  };

  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const deleteSelected = async () => {
    if (!confirm(`Delete ${selectedIds.size} item(s)?`)) return;
    await Promise.all(Array.from(selectedIds).map(id => base44.entities.DailyChecklist.delete(id)));
    setSelectedIds(new Set());
    setIsBatchDeleteMode(false);
    loadData();
  };

  const isCompleted = (itemId) => {
    return completions.some((c) => c.checklist_item_id === itemId && c.completed);
  };

  const toggleItem = async (itemId) => {
    const existing = completions.find((c) => c.checklist_item_id === itemId);
    if (existing) {
      await base44.entities.ChecklistCompletion.update(existing.id, { completed: !existing.completed, completed_at: !existing.completed ? new Date().toISOString() : null });
    } else {
      await base44.entities.ChecklistCompletion.create({ checklist_item_id: itemId, date: today, completed: true, completed_at: new Date().toISOString() });
    }
    loadData();
    reloadWeeklyCounts();
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setEditForm({ title: item.title, time_of_day: item.time_of_day || "", category: item.category || "morning", label: item.label || "", label_color: item.label_color || "#3b82f6" });
    setEditDialogOpen(true);
  };

  const updateItem = async () => {
    if (!editForm.title) return;
    if (editForm.label) saveLabelToHistory(editForm.label, editForm.label_color);
    await base44.entities.DailyChecklist.update(editingItem.id, editForm);
    setEditDialogOpen(false);
    setEditingItem(null);
    loadData();
  };

  const grouped = { morning: [], afternoon: [], evening: [], anytime: [] };
  items.forEach((item) => {
    const cat = item.category || "anytime";
    if (grouped[cat]) grouped[cat].push(item);
    else grouped.anytime.push(item);
  });
  // Sort by label (alphabetical), then by order within each label group
  Object.keys(grouped).forEach(cat => grouped[cat].sort((a, b) => {
    const labelCompare = (a.label || "\uFFFF").localeCompare(b.label || "\uFFFF");
    if (labelCompare !== 0) return labelCompare;
    return (a.order ?? 0) - (b.order ?? 0);
  }));
  
  // Filter out completed items if hideCompleted is true
  if (hideCompleted) {
    Object.keys(grouped).forEach(cat => {
      grouped[cat] = grouped[cat].filter(item => !isCompleted(item.id));
    });
  }

  // Build pages: "All" + categories that have items + unique labels
  const uniqueLabels = [...new Map(items.filter(i => i.label).map(i => [i.label.toLowerCase(), i.label])).values()].sort();
  const categoryPages = ["morning", "afternoon", "evening", "anytime"].filter(cat => grouped[cat]?.length > 0);
  const pages = ["all", ...categoryPages, ...uniqueLabels, "completed"];
  const currentPage = pages[Math.min(pageIndex, pages.length - 1)] || "all";
  const currentPageLabel = currentPage === "all" ? "All" : currentPage.charAt(0).toUpperCase() + currentPage.slice(1);

  // Filter grouped based on current page
  const visibleGrouped = {};
  if (currentPage === "all") {
    Object.assign(visibleGrouped, grouped);
  } else if (currentPage === "completed") {
    // Show all completed items grouped by category
    Object.entries(grouped).forEach(([cat, catItems]) => {
      // Use original items (before hideCompleted filter) to get completed ones
      const allCatItems = { morning: [], afternoon: [], evening: [], anytime: [] };
      items.forEach(item => { const c = item.category || "anytime"; if (allCatItems[c]) allCatItems[c].push(item); });
      const completedItems = (allCatItems[cat] || []).filter(i => isCompleted(i.id));
      if (completedItems.length > 0) visibleGrouped[cat] = completedItems;
    });
  } else if (["morning", "afternoon", "evening", "anytime"].includes(currentPage)) {
    visibleGrouped[currentPage] = grouped[currentPage] || [];
  } else {
    // Label page — group all items with that label under their category
    Object.entries(grouped).forEach(([cat, catItems]) => {
      const filtered = catItems.filter(i => i.label === currentPage);
      if (filtered.length > 0) visibleGrouped[cat] = filtered;
    });
  }

  // Sort visible items by label, then order within each category
  Object.keys(visibleGrouped).forEach(cat => visibleGrouped[cat].sort((a, b) => {
    const labelCompare = (a.label || "\uFFFF").localeCompare(b.label || "\uFFFF");
    if (labelCompare !== 0) return labelCompare;
    return (a.order ?? 0) - (b.order ?? 0);
  }));

  // Progress is based on ALL items in the current page/category filter (ignoring hideCompleted visibility),
  // but only counts completed ones. Build the unfiltered version of visibleGrouped for progress.
  const progressGrouped = {};
  if (currentPage === "all") {
    const allGrouped = { morning: [], afternoon: [], evening: [], anytime: [] };
    items.forEach(item => { const c = item.category || "anytime"; if (allGrouped[c]) allGrouped[c].push(item); else allGrouped.anytime.push(item); });
    Object.assign(progressGrouped, allGrouped);
  } else if (currentPage === "completed") {
    const allGrouped = { morning: [], afternoon: [], evening: [], anytime: [] };
    items.forEach(item => { const c = item.category || "anytime"; if (allGrouped[c]) allGrouped[c].push(item); else allGrouped.anytime.push(item); });
    Object.entries(allGrouped).forEach(([cat, catItems]) => {
      const completedItems = catItems.filter(i => isCompleted(i.id));
      if (completedItems.length > 0) progressGrouped[cat] = completedItems;
    });
  } else if (["morning", "afternoon", "evening", "anytime"].includes(currentPage)) {
    const allGrouped = { morning: [], afternoon: [], evening: [], anytime: [] };
    items.forEach(item => { const c = item.category || "anytime"; if (allGrouped[c]) allGrouped[c].push(item); else allGrouped.anytime.push(item); });
    progressGrouped[currentPage] = allGrouped[currentPage] || [];
  } else {
    // Label page
    const allGrouped = { morning: [], afternoon: [], evening: [], anytime: [] };
    items.forEach(item => { const c = item.category || "anytime"; if (allGrouped[c]) allGrouped[c].push(item); else allGrouped.anytime.push(item); });
    Object.entries(allGrouped).forEach(([cat, catItems]) => {
      const filtered = catItems.filter(i => i.label === currentPage);
      if (filtered.length > 0) progressGrouped[cat] = filtered;
    });
  }

  const visibleItems = Object.values(visibleGrouped).flat();
  const progressItems = Object.values(progressGrouped).flat();
  const completedCount = progressItems.filter((i) => isCompleted(i.id)).length;
  const progress = progressItems.length > 0 ? (completedCount / progressItems.length) * 100 : 0;

  const preventScroll = (e) => {
    if (e.type === 'wheel' || e.type === 'touchmove') {
      e.preventDefault();
    }
  };

  const handleDragStart = () => {
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
  };

  const handleMouseMove = (e) => {
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = async (result) => {
    document.removeEventListener('wheel', preventScroll);
    document.removeEventListener('touchmove', preventScroll);
    document.removeEventListener('mousemove', handleMouseMove);
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceCategory = source.droppableId;
    const destCategory = destination.droppableId;

    // Build a flat ordered list per category
    const newGrouped = { morning: [...grouped.morning], afternoon: [...grouped.afternoon], evening: [...grouped.evening], anytime: [...grouped.anytime] };
    const [moved] = newGrouped[sourceCategory].splice(source.index, 1);
    newGrouped[destCategory].splice(destination.index, 0, moved);

    // Assign new order values and persist
    const updates = [];
    Object.entries(newGrouped).forEach(([cat, catItems]) => {
      catItems.forEach((item, idx) => {
        const newOrder = idx;
        const newCategory = cat;
        if (item.order !== newOrder || item.category !== newCategory) {
          updates.push(base44.entities.DailyChecklist.update(item.id, { order: newOrder, category: newCategory }));
        }
      });
    });
    await Promise.all(updates);
    loadData();
  };

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const themeSettings = await base44.entities.ThemeSettings.list("-updated_date", 1);
        if (themeSettings.length) {
          const onboardingStatus = JSON.parse(themeSettings[0].onboarding_status || "{}");
          if (!onboardingStatus.dailychecklist_onboarded) {
            setShowOnboarding(true);
          }
        } else {
          setShowOnboarding(true);
        }
      } catch {
        setShowOnboarding(true);
      }
    };
    // Fast-path: if already dismissed, skip the async check
    if (localStorage.getItem("dailychecklist_onboarded") === "true") return;
    checkOnboarding();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none [&_input]:select-text [&_textarea]:select-text">
      <div className="flex items-center justify-between">
         <div className="flex gap-2">
          <Button
            onClick={() => { const next = !hideCompleted; setHideCompleted(next); localStorage.setItem("checklist_hideCompleted", next); }}
            size="sm"
            variant="outline"
            className="text-xs bg-secondary/50"
            title={hideCompleted ? "Show completed items" : "Hide completed items"}
          >
            {hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
         </div>
         {isBatchDeleteMode && selectedIds.size > 0 ? (
           <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
             <Button variant="destructive" size="sm" onClick={deleteSelected} className="gap-2">
               <Trash2 className="w-4 h-4" /> Delete
             </Button>
             <Button variant="outline" size="sm" onClick={() => { setIsBatchDeleteMode(false); setSelectedIds(new Set()); }} className="bg-secondary/50">
               Cancel
             </Button>
           </div>
         ) : isBatchDeleteMode ? (
           <Button variant="outline" size="sm" onClick={() => setIsBatchDeleteMode(false)} className="bg-secondary/50">
             Cancel
           </Button>
         ) : (
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={() => setIsBatchDeleteMode(true)} className="bg-secondary/50">
                 Select
               </Button>
             <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Checklist Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Make bed" /></div>
              <LabelPicker
                label={form.label}
                color={form.label_color}
                onLabelChange={(v) => setForm(f => ({ ...f, label: v }))}
                onColorChange={(v) => setForm(f => ({ ...f, label_color: v }))}
                onSelect={(lbl, clr) => setForm(f => ({ ...f, label: lbl, label_color: clr }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Time</Label><Input type="time" value={form.time_of_day} onChange={(e) => setForm({ ...form, time_of_day: e.target.value })} /></div>
              </div>
              <Button onClick={createItem} className="w-full">Add to Checklist</Button>
            </div>
            </DialogContent>
            </Dialog>
            </div>
            )}
            </div>

      {/* Page navigation */}
      <div className="flex items-center justify-between bg-secondary/50 border border-input rounded-xl px-4 py-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={pageIndex === 0}
          onClick={() => setPageIndex(i => Math.max(0, i - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold">{currentPageLabel}</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          disabled={pageIndex >= pages.length - 1}
          onClick={() => setPageIndex(i => Math.min(pages.length - 1, i + 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Today's Progress</span>
          <span className="text-muted-foreground">{completedCount} of {progressItems.length}</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} isDragAnimationOff={false} onDragUpdate={(update) => {
        const isDragging = !!update.draggableId;
        document.body.style.cursor = isDragging ? 'grabbing' : 'auto';
      }}>
        {Object.entries(visibleGrouped).map(([category, catItems]) => (
            <WidgetCard key={category} title={category.charAt(0).toUpperCase() + category.slice(1)} id={`checklist-${category}`}>
              <Droppable droppableId={category}>
               {(provided) => (
                 <div className="space-y-2 min-h-20" ref={provided.innerRef} {...provided.droppableProps}>
                    {catItems.map((item, index) => {
                       const labelColor = item.label_color || "#3b82f6";
                       const prevItem = index > 0 ? catItems[index - 1] : null;
                       const showLabelHeader = item.label && (!prevItem || prevItem.label !== item.label);
                       let lastTapTime = 0;
                       const handleItemTap = () => {
                         const now = Date.now();
                         if (now - lastTapTime < 300) openEditDialog(item);
                         lastTapTime = now;
                       };
                       return (
                         <div key={item.id}>
                         {showLabelHeader && (
                           <div className="text-xs font-semibold uppercase tracking-wide pt-1.5 pb-1 px-1" style={{ color: labelColor }}>
                             {item.label}
                           </div>
                         )}
                         <Draggable draggableId={item.id} index={index}>
                           {(dragProvided, dragSnapshot) => {
                             const isDragging = dragSnapshot.isDragging;
                             return (
                             <>
                             {isDragging && createPortal(
                               <div
                                 style={{
                                   position: 'fixed',
                                   pointerEvents: 'none',
                                   zIndex: 10000,
                                   left: '50%',
                                   transform: 'translateX(-50%)',
                                   top: `${dragPos.y - 20}px`,
                                   boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                                   borderRadius: '0.5rem',
                                   backgroundColor: 'hsl(var(--card))',
                                   border: '2px solid hsl(var(--primary) / 0.5)',
                                   width: '200px',
                                 }}
                                 className="p-3"
                               >
                                 <SwipeableListItem
                                   onDelete={() => deleteItem(item.id)}
                                   isBatchMode={isBatchDeleteMode}
                                   onToggleBatchMode={() => setIsBatchDeleteMode(!isBatchDeleteMode)}
                                   isSelected={selectedIds.has(item.id)}
                                   onBatchToggle={() => toggleSelection(item.id)}
                                 >
                                   <Checkbox checked={isCompleted(item.id)} onCheckedChange={() => toggleItem(item.id)} />
                                   <div className="flex-1 flex flex-col ml-2">
                                     <span className={cn("text-sm cursor-pointer", isCompleted(item.id) && "line-through text-muted-foreground")} onDoubleClick={() => openEditDialog(item)} onClick={handleItemTap}>{item.title}</span>
                                     {item.time_of_day && <span className="text-xs text-muted-foreground">{item.time_of_day}</span>}
                                   </div>
                                   <span className="text-xs font-mono shrink-0 text-muted-foreground/60 tabular-nums">{weeklyCounts[item.id] || 0}/7</span>
                                   {item.label && (
                                     <span className="text-xs font-medium shrink-0" style={{ color: labelColor }}>
                                       {item.label.toUpperCase()}
                                     </span>
                                   )}
                                 </SwipeableListItem>
                                 </div>,
                                 document.body
                                 )}
                             <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                style={{...dragProvided.draggableProps.style, opacity: isDragging ? 0 : 1}}
                                className={cn("transition-all")}
                              >
                               <div {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing select-none">
                                 <SwipeableListItem
                                   onDelete={() => deleteItem(item.id)}
                                   isBatchMode={isBatchDeleteMode}
                                   onToggleBatchMode={() => setIsBatchDeleteMode(!isBatchDeleteMode)}
                                   isSelected={selectedIds.has(item.id)}
                                   onBatchToggle={() => toggleSelection(item.id)}
                                 >
                                   <Checkbox checked={isCompleted(item.id)} onCheckedChange={() => toggleItem(item.id)} />
                                   <div className="flex-1 flex flex-col ml-2">
                                     <span className={cn("text-sm cursor-pointer", isCompleted(item.id) && "line-through text-muted-foreground")} onDoubleClick={() => openEditDialog(item)} onClick={handleItemTap}>{item.title}</span>
                                     {item.time_of_day && <span className="text-xs text-muted-foreground">{item.time_of_day}</span>}
                                   </div>
                                   <span className="text-xs font-mono shrink-0 text-muted-foreground/60 tabular-nums">{weeklyCounts[item.id] || 0}/7</span>
                                   {item.label && (
                                     <span className="text-xs font-medium shrink-0" style={{ color: labelColor }}>
                                       {item.label.toUpperCase()}
                                     </span>
                                   )}
                                 </SwipeableListItem>
                               </div>
                               </div>
                               </>
                               );
                               }}
                               </Draggable>
                               </div>
                               );
                               })}
                               {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </WidgetCard>
        ))}
      </DragDropContext>

      {editingItem && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Checklist Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Title</Label><Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="e.g. Make bed" /></div>
              <LabelPicker
                label={editForm.label}
                color={editForm.label_color}
                onLabelChange={(v) => setEditForm(f => ({ ...f, label: v }))}
                onColorChange={(v) => setEditForm(f => ({ ...f, label_color: v }))}
                onSelect={(lbl, clr) => setEditForm(f => ({ ...f, label: lbl, label_color: clr }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Time</Label><Input type="time" value={editForm.time_of_day} onChange={(e) => setEditForm({ ...editForm, time_of_day: e.target.value })} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditingItem(null); }} className="bg-secondary/50">Cancel</Button>
                <Button onClick={updateItem}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <GenericOnboardingDialog
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        storageKey="dailychecklist_onboarded"
        title="Welcome to Daily Checklist"
        steps={ONBOARDING_STEPS}
      />
    </div>
  );
}