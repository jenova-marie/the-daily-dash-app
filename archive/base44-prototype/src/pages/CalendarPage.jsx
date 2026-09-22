import { useState, useEffect } from "react";
import { useHeader } from "@/lib/HeaderContext";
import WidgetCard from "../components/WidgetCard";
import SwipeableEventItem from "../components/SwipeableEventItem";
import DeletedItemReview from "../components/DeletedItemReview";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Printer, Mail, Plus, X, RefreshCw, ListTodo, ArrowRight, HelpCircle, Calendar, Search } from "lucide-react";
import CalendarOnboarding from "@/components/onboarding/CalendarOnboarding";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { base44 } from "@/api/base44Client";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { printComponent, emailComponent } from "@/lib/printUtils";
import PrintFormatCalendar from "@/components/PrintFormatCalendar";
import PrintRangeDialog from "@/components/PrintRangeDialog";

const ONBOARDING_STEPS = [
  { icon: <Calendar className="w-5 h-5 text-blue-500" />, title: "View Your Calendar", description: "See all your events, tasks, and activities organized in a beautiful monthly calendar view. Each colored dot represents an event—blue for Calendar events, purple for Education, amber for Chores, and more. Click any date to view or add events for that day." },
  { icon: <Plus className="w-5 h-5 text-primary" />, title: "Add Custom Events", description: "Create custom events directly on any date with start and end times, and optional notes. These events appear alongside your synced Google Calendar entries. Edit or delete them anytime—the choice to sync back to Google is yours." },
  { icon: <RefreshCw className="w-5 h-5 text-purple-500" />, title: "Sync with Google", description: "Click the sync button to pull in all your Google Calendar events and Google Tasks in real-time. Events are color-coded by source for easy identification. Delete events here or delete from Google—both options are available." },
  { icon: <Search className="w-5 h-5 text-accent" />, title: "Search & Manage", description: "Use the search bar to find events by title, time, or notes. Swipe left on any event to delete. Click the print or email buttons to export your calendar and events list. Everything stays organized and accessible." },
];

export default function CalendarPage() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Calendar"); return () => setTitle(""); }, []);
  const [calView, setCalView] = useState("month"); // "month" | "week"
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [scheduleItems, setScheduleItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", start_time: "09:00", end_time: "10:00", notes: "" });
  const [syncNewToGoogle, setSyncNewToGoogle] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [eventDatePickerOpen, setEventDatePickerOpen] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("calendar_onboarded"); } catch { return false; }
  });

  const resetOnboarding = () => setShowOnboarding(true);
  const [rangeDialog, setRangeDialog] = useState(null);

  const handleRangeConfirm = (start, end) => {
    const { source, mode } = rangeDialog || {};
    const events = scheduleItems.filter((s) => s.date >= start && s.date <= end);
    const title = source === "calendar" ? `Calendar (${start === end ? start : `${start} → ${end}`})` : `Events (${start === end ? start : `${start} → ${end}`})`;
    if (mode === "print") printComponent(title, <PrintFormatCalendar events={events} title={title} />);
    else emailComponent(title, <PrintFormatCalendar events={events} title={title} />);
  };

  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={resetOnboarding} title="Guide" className="h-8 w-8"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);

  useEffect(() => {
    loadEvents();
  }, [currentMonth, currentWeek]);

  useEffect(() => {
    const unsubscribe = base44.entities.ScheduleItem.subscribe(() => {
      loadEvents();
    });
    return unsubscribe;
  }, []);

  const loadEvents = async () => {
    setLoadingEvents(true);
    try {
      const [calItems, eventItems] = await Promise.all([
        base44.entities.ScheduleItem.filter({ source_type: "calendar", deleted_from_app: false }, "-date", 1000),
        base44.entities.ScheduleItem.filter({ source_type: "event", deleted_from_app: false }, "-date", 500),
      ]);
      const items = [...calItems, ...eventItems];
      setScheduleItems(items);
    } catch (error) {
      console.error("Failed to load events:", error);
      setScheduleItems([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const reAddToTodo = async (eventId) => {
    await base44.entities.ScheduleItem.update(eventId, { hidden_from_todo: false });
    loadEvents();
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getEventsForDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return scheduleItems.filter((e) => e.date === dateStr);
  };

  const selectedEvents = getEventsForDay(selectedDate).sort((a, b) => {
    const ta = a.start_time || "99:99";
    const tb = b.start_time || "99:99";
    return ta.localeCompare(tb);
  });
  
  const filteredEvents = eventSearch.trim()
    ? scheduleItems.filter(e => {
        const searchLower = eventSearch.toLowerCase();
        return (
          (e.title || '').toLowerCase().includes(searchLower) ||
          (e.notes || '').toLowerCase().includes(searchLower) ||
          (e.source_type || '').toLowerCase().includes(searchLower) ||
          (e.start_time || '').includes(searchLower) ||
          (e.end_time || '').includes(searchLower)
        );
      }).sort((a, b) => {
        const today = new Date();
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        const distA = Math.abs(dateA - today);
        const distB = Math.abs(dateB - today);
        return distA - distB;
      })
    : selectedEvents;

  const sourceColors = {
    calendar: "bg-blue-500",
    event: "bg-blue-600",
    task: "bg-primary",
    education: "bg-purple-500",
    chore: "bg-amber-500",
    custom: "bg-muted-foreground",
  };

  const addCustomEvent = async () => {
    if (!form.title) return;
    const created = await base44.entities.ScheduleItem.create({
      title: form.title,
      date: format(selectedDate, "yyyy-MM-dd"),
      start_time: form.start_time,
      end_time: form.end_time,
      source_type: "event",
      notes: form.notes,
    });
    setForm({ title: "", start_time: "09:00", end_time: "10:00", notes: "" });
    setDialogOpen(false);
    loadEvents();
    // Cross over to the signed-in Google Calendar
    if (syncNewToGoogle) {
      try {
        await base44.functions.invoke('syncAppEventToGoogle', { event: created, eventAction: 'create' });
        loadEvents();
      } catch (err) {
        console.error('Google Calendar sync failed:', err);
      }
    }
  };

  const requestDeleteEvent = async (eventId, deleteFromGoogle = false) => {
    await deleteEvent(eventId, deleteFromGoogle);
  };

  const deleteEvent = async (eventId, deleteFromGoogle) => {
    const event = scheduleItems.find(e => e.id === eventId);
    if (deleteFromGoogle && event?.google_event_id) {
      try {
        await base44.functions.invoke('syncAppEventToGoogle', { event, eventAction: 'delete' });
      } catch (err) {
        console.error('Google delete failed:', err);
      }
    }
    if (event?.source_type === 'calendar') {
      await base44.entities.ScheduleItem.update(eventId, { deleted_from_app: true });
    } else {
      await base44.entities.ScheduleItem.delete(eventId);
    }
    loadEvents();
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      // Respect sync_sources setting from ThemeSettings
      const settingsList = await base44.entities.ThemeSettings.list("-updated_date", 1);
      const syncSources = settingsList.length > 0 && settingsList[0].sync_sources
        ? JSON.parse(settingsList[0].sync_sources)
        : ["calendar", "tasks"];

      const promises = [];
      if (syncSources.includes('calendar')) promises.push(base44.functions.invoke('syncGoogleCalendarToApp', {}));
      if (syncSources.includes('tasks')) promises.push(base44.functions.invoke('syncGoogleTasks', {}));
      if (promises.length === 0) {
        setSyncMessage('No sync sources selected. Check Settings.');
        setTimeout(() => setSyncMessage(''), 3000);
        return;
      }
      const results = await Promise.all(promises);
      setSyncMessage(`✓ Sync complete`);
      loadEvents();
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      setSyncMessage(`✗ Sync failed: ${error.message}`);
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <DeletedItemReview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <WidgetCard title={
            <button
              onClick={() => setDatePickerOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer"
              title="Pick a date"
            >
              {format(selectedDate, "EEEE, MMM d")}
            </button>
          } id="calendar-view" headerRight={(
            <div className="flex items-center gap-1 no-print">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-secondary/50"
                onClick={handleSync}
                disabled={syncing}
                title="Sync calendar and tasks"
              >
                <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              </Button>

              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={() => setRangeDialog({ source: 'calendar', mode: 'print', start: calView === 'month' ? format(startOfMonth(currentMonth), 'yyyy-MM-dd') : format(startOfWeek(currentWeek), 'yyyy-MM-dd'), end: calView === 'month' ? format(endOfMonth(currentMonth), 'yyyy-MM-dd') : format(endOfWeek(currentWeek), 'yyyy-MM-dd') })} title="Print calendar">
                <Printer className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={() => setRangeDialog({ source: 'calendar', mode: 'email', start: calView === 'month' ? format(startOfMonth(currentMonth), 'yyyy-MM-dd') : format(startOfWeek(currentWeek), 'yyyy-MM-dd'), end: calView === 'month' ? format(endOfMonth(currentMonth), 'yyyy-MM-dd') : format(endOfWeek(currentWeek), 'yyyy-MM-dd') })} title="Email calendar">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          )}>
            {datePickerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDatePickerOpen(false)}>
                <div className="bg-background border border-border rounded-lg p-4 shadow-lg" onClick={e => e.stopPropagation()}>
                  <p className="text-sm font-semibold mb-3">Select Date</p>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentMonth(date);
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                      }
                    }}
                    className="rounded-md border"
                  />
                </div>
              </div>
            )}
            {/* View toggle + navigation */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <Button variant="ghost" size="icon" className="bg-secondary/50" onClick={() => {
                if (calView === "month") setCurrentMonth(subMonths(currentMonth, 1));
                else { const prev = subWeeks(currentWeek, 1); setCurrentWeek(prev); }
              }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm">
                  {calView === "month"
                    ? format(currentMonth, "MMMM yyyy")
                    : `${format(startOfWeek(currentWeek), "MMM d")} – ${format(endOfWeek(currentWeek), "MMM d, yyyy")}`
                  }
                </h2>
                <div className="flex rounded-md overflow-hidden border border-border ml-2">
                  <button
                    onClick={() => setCalView("month")}
                    className={cn("px-2 py-1 text-xs transition-colors", calView === "month" ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-muted")}
                  >Month</button>
                  <button
                    onClick={() => setCalView("week")}
                    className={cn("px-2 py-1 text-xs transition-colors", calView === "week" ? "bg-primary text-primary-foreground" : "bg-secondary/50 hover:bg-muted")}
                  >Week</button>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="bg-secondary/50" onClick={() => {
                if (calView === "month") setCurrentMonth(addMonths(currentMonth, 1));
                else { const next = addWeeks(currentWeek, 1); setCurrentWeek(next); }
              }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {calView === "month" ? (
              <div className="grid grid-cols-7 gap-px">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
                {calDays.map((day, i) => {
                  const dayEvents = getEventsForDay(day);
                  const selected = isSameDay(day, selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square p-1 rounded-lg text-sm relative transition-all",
                        !isSameMonth(day, currentMonth) && "text-muted-foreground/40",
                        isToday(day) && "ring-2 ring-primary",
                        selected && "bg-primary text-primary-foreground",
                        !selected && "hover:bg-muted"
                      )}
                    >
                      <span className="text-xs">{format(day, "d")}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 justify-center mt-0.5 absolute bottom-1 left-0 right-0">
                          {dayEvents.slice(0, 3).map((e, j) => (
                            <div key={j} className={cn("w-1 h-1 rounded-full", sourceColors[e.source_type] || sourceColors.custom)} />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              // Weekly view
              (() => {
                const weekStart = startOfWeek(currentWeek);
                const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentWeek) });
                return (
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map((day) => (
                      <div key={day.toISOString()} className="text-center text-xs font-medium text-muted-foreground pb-1">
                        {format(day, "EEE")}
                      </div>
                    ))}
                    {weekDays.map((day) => {
                      const dayEvents = getEventsForDay(day);
                      const selected = isSameDay(day, selectedDate);
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "flex flex-col rounded-lg p-1.5 min-h-24 text-left transition-all border border-transparent",
                            isToday(day) && "ring-2 ring-primary",
                            selected && "bg-primary/20 border-primary",
                            !selected && "hover:bg-muted/60"
                          )}
                        >
                          <span className={cn("text-sm font-semibold mb-1 self-center w-6 h-6 flex items-center justify-center rounded-full",
                            selected && "bg-primary text-primary-foreground",
                            isToday(day) && !selected && "text-primary"
                          )}>
                            {format(day, "d")}
                          </span>
                          <div className="space-y-0.5 w-full overflow-hidden">
                            {dayEvents.slice(0, 4).map((e, j) => (
                              <div key={j} className={cn("text-xs px-1 py-0.5 rounded truncate text-white/90", sourceColors[e.source_type] || sourceColors.custom)}>
                                {e.title}
                              </div>
                            ))}
                            {dayEvents.length > 4 && (
                              <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 4} more</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </WidgetCard>
        </div>

        <div>
          <WidgetCard title={`Events — ${format(selectedDate, "MMM d")}`} id="calendar-events" headerRight={(
            <div className="flex items-center gap-1 no-print">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" title="Add event">
                     <Plus className="w-4 h-4" />
                   </Button>
                </DialogTrigger>
                <DialogContent>
                   <DialogHeader><DialogTitle>Add Calendar Event</DialogTitle></DialogHeader>
                   <div className="space-y-4">
                     <div>
                       <Label>Title</Label>
                       <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" />
                     </div>
                     <div>
                       <Label>Date</Label>
                       <button
                         onClick={() => setEventDatePickerOpen(true)}
                         className="w-full px-3 py-2 border border-input rounded-md bg-transparent text-left hover:bg-muted transition-colors"
                       >
                         {format(selectedDate, "EEEE, MMM d, yyyy")}
                       </button>
                       {eventDatePickerOpen && (
                         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEventDatePickerOpen(false)}>
                           <div className="bg-background border border-border rounded-lg p-4 shadow-lg" onClick={e => e.stopPropagation()}>
                             <CalendarComponent
                               mode="single"
                               selected={selectedDate}
                               onSelect={(date) => {
                                 if (date) {
                                   setSelectedDate(date);
                                   setEventDatePickerOpen(false);
                                 }
                               }}
                               className="rounded-md"
                             />
                           </div>
                         </div>
                       )}
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <Label>Start</Label>
                         <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                       </div>
                       <div>
                         <Label>End</Label>
                         <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                       </div>
                     </div>
                     <div>
                       <Label>Notes</Label>
                       <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Add notes..." />
                     </div>
                     <div className="flex items-center gap-2">
                       <Checkbox checked={syncNewToGoogle} onCheckedChange={setSyncNewToGoogle} id="sync-new-google" />
                       <label htmlFor="sync-new-google" className="text-sm cursor-pointer">Sync to Google Calendar</label>
                     </div>
                     <Button onClick={addCustomEvent} className="w-full">Add Event</Button>
                   </div>
                 </DialogContent>
              </Dialog>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={() => setRangeDialog({ source: 'events', mode: 'print', start: format(selectedDate, 'yyyy-MM-dd'), end: format(selectedDate, 'yyyy-MM-dd') })} title="Print events">
                <Printer className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-secondary/50" onClick={() => setRangeDialog({ source: 'events', mode: 'email', start: format(selectedDate, 'yyyy-MM-dd'), end: format(selectedDate, 'yyyy-MM-dd') })} title="Email events">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          )}>
            <div className="space-y-3">
             <Input
               placeholder="Search events..."
               value={eventSearch}
               onChange={(e) => setEventSearch(e.target.value)}
               className="h-8"
             />
             {loadingEvents ? (
               <p className="text-sm text-muted-foreground text-center py-6 flex items-center justify-center gap-2">
                 <RefreshCw className="w-4 h-4 animate-spin" /> Loading events...
               </p>
             ) : selectedEvents.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-6">No events for this day</p>
             ) : filteredEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No matching events</p>
              ) : (
                filteredEvents.map((event) => {
                  let lastTapTime = 0;
                  const handleEventTap = () => {
                    const now = Date.now();
                    if (now - lastTapTime < 300) {
                      // Trigger edit dialog for the event (using existing edit functionality)
                      // SwipeableEventItem doesn't expose edit directly, but double-click will still work
                    }
                    lastTapTime = now;
                  };
                  return (
                    <div key={event.id} className="relative" onDoubleClick={() => { /* SwipeableEventItem handles edit internally */ }} onClick={handleEventTap}>
                      <SwipeableEventItem
                        event={event}
                        sourceColors={sourceColors}
                        onDelete={requestDeleteEvent}
                        onUpdate={loadEvents}
                        onReAddToTodo={reAddToTodo}
                        hiddenFromTodo={event.hidden_from_todo}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </WidgetCard>
        </div>
      </div>
      {syncMessage && (
        <div className="fixed bottom-4 right-4 p-3 rounded-lg bg-card border border-border text-sm shadow-lg">
          {syncMessage}
        </div>
      )}



            <PrintRangeDialog
              open={!!rangeDialog}
              onOpenChange={(o) => !o && setRangeDialog(null)}
              title={rangeDialog?.mode === 'email' ? 'Email — Select Date Range' : 'Print — Select Date Range'}
              mode={rangeDialog?.mode || 'print'}
              defaultStart={rangeDialog?.start || format(new Date(), 'yyyy-MM-dd')}
              defaultEnd={rangeDialog?.end || format(new Date(), 'yyyy-MM-dd')}
              onConfirm={handleRangeConfirm}
            />
            <CalendarOnboarding
            open={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            onDontRemind={() => { setShowOnboarding(false); localStorage.setItem("calendar_onboarded", "1"); }}
            />
            </div>
            );
            }