import { useState, useEffect, useRef } from "react";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { GripVertical, X, PlayCircle, Sparkles, SlidersHorizontal, Target, ArrowUpDown, HelpCircle, BarChart3, RefreshCw, Save, CheckSquare, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GenericOnboardingDialog from "@/components/GenericOnboardingDialog";
import WidgetCard from "../components/WidgetCard";
import WeatherWidget from "../components/WeatherWidget";
import DashboardChecklist from "../components/dashboard/DashboardChecklist";
import DashboardSchedule from "../components/dashboard/DashboardSchedule";
import DashboardGoals from "../components/dashboard/DashboardGoals";
import DashboardQuote from "../components/dashboard/DashboardQuote";
import DashboardTasks from "../components/dashboard/DashboardTasks";
import DashboardMenuChores from "../components/dashboard/DashboardMenuChores";
import DashboardFocalAreas from "../components/dashboard/DashboardFocalAreas";
import DashboardSlideshow from "../components/dashboard/DashboardSlideshow";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DEFAULT_WIDGET_ORDER = [
  "weather",
  "focal-areas",
  "checklist",
  "schedule",
  "tasks",
  "menu-chores",
  "goals",
  "quote"
];

const WIDGET_COMPONENTS = {
  weather: { title: "Weather", component: WeatherWidget },
  "focal-areas": { title: "Focal Areas", component: DashboardFocalAreas },
  checklist: { title: "Daily Checklist", component: DashboardChecklist },
  schedule: { title: "Today's Schedule", component: DashboardSchedule },
  tasks: { title: "TODAY'S TASKS", component: DashboardTasks },
  "menu-chores": { title: "Menu & Chores", component: DashboardMenuChores },
  goals: { title: "Goals Overview", component: DashboardGoals },
  quote: { title: "Daily Quote", component: DashboardQuote }
};

const ONBOARDING_STEPS = [
  { icon: <Target className="w-8 h-8 text-accent" />, title: "1. Your Daily Hub", desc: "Your personalized dashboard shows everything at a glance—weather, daily checklist, schedule, tasks, goals, and your daily quote. It's your command center for a productive day." },
  { icon: <RefreshCw className="w-8 h-8 text-blue-400" />, title: "2. Arrange Your Widgets", desc: "Click the reorder icon (⇅) in the header to drag and rearrange widgets in any order you like. Your layout is saved automatically so it's always just how you left it." },
  { icon: <PlayCircle className="w-8 h-8 text-primary" />, title: "3. Launch Your Vision Slideshow", desc: "Hit the Vision button to start an inspirational slideshow using your uploaded images and affirmations. Choose Auto-Generated for AI-powered suggestions based on your health pillars, or Custom for your curated content." },
  { icon: <BarChart3 className="w-8 h-8 text-green-400" />, title: "4. Track Progress in Real-Time", desc: "See your daily checklist progress, upcoming schedule, pending tasks, and active goals all in one view. Items update live as you complete them throughout the day." },
];

export default function Dashboard() {
  const { setTitle } = useHeader();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [themeSettings, setThemeSettings] = useState(null);
  const [focalAreasHighlight, setFocalAreasHighlight] = useState(false);
  const [widgetOrder, setWidgetOrder] = useState(DEFAULT_WIDGET_ORDER);
  const [isReordering, setIsReordering] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [slideshowMode, setSlideshowMode] = useState(null);
  const [visionMenuOpen, setVisionMenuOpen] = useState(false);
  const visionMenuRef = useRef(null);
  const [evalDoneToday, setEvalDoneToday] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("dashboard_onboarded"); } catch { return false; }
  });
  const [savingDefault, setSavingDefault] = useState(false);
  const [choreStatus, setChoreStatus] = useState({ hasOverdue: false, hasDue: false, count: 0 });
  const [educationStatus, setEducationStatus] = useState({ hasOverdue: false, hasDue: false, count: 0 });

  const resetOnboarding = () => setShowOnboarding(true);

  useEffect(() => {
    const checkStatuses = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const todayDayFull = format(new Date(), "EEEE");
      const todayDay = format(new Date(), "EEE").slice(0, 3);

      const [chores, eduActivities] = await Promise.all([
        base44.entities.Chore.filter({ status: "pending" }, "-created_date", 300),
        base44.entities.EducationActivity.filter({ completed: false }, "", 200)
      ]);

      const nonMealChores = chores.filter(c => c.chore_type !== "Meal");
      const dueChores = nonMealChores.filter(c => c.due_date === today ||
        (c.frequency === "daily") ||
        (c.frequency === "weekly" && c.day_of_week?.includes(todayDayFull)));
      const overdueChores = nonMealChores.filter(c => c.due_date && c.due_date < today);
      const allChoreIds = new Set([...dueChores.map(c => c.id), ...overdueChores.map(c => c.id)]);
      setChoreStatus({
        hasOverdue: overdueChores.length > 0,
        hasDue: dueChores.length > 0,
        count: allChoreIds.size
      });

      const dueEdu = eduActivities.filter(a => a.due_date === today ||
        a.frequency === "daily" ||
        (a.frequency === "weekly" && a.days_of_week?.includes(todayDay)));
      const overdueEdu = eduActivities.filter(a => a.due_date && a.due_date < today);
      const allEduIds = new Set([...dueEdu.map(a => a.id), ...overdueEdu.map(a => a.id)]);
      setEducationStatus({
        hasOverdue: overdueEdu.length > 0,
        hasDue: dueEdu.length > 0,
        count: allEduIds.size
      });
    };
    checkStatuses();
  }, []);

  useEffect(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    base44.entities.DailyPillarTracking.filter({ date: todayStr }).then((records) => {
      setEvalDoneToday(records.length > 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    base44.entities.ThemeSettings.list("-updated_date", 1).then((results) => {
      if (results.length) {
        const settings = results[0];
        setThemeSettings(settings);
        if (settings.widget_order) {
          try {
            const saved = JSON.parse(settings.widget_order);
            const merged = [...saved, ...DEFAULT_WIDGET_ORDER.filter(w => !saved.includes(w))];
            setWidgetOrder(merged);
          } catch {}
        }
      }
    }).catch(() => {});
  }, []);

  const handleDragEnd = (result) => {
    if (!isReordering) return;
    
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const newOrder = Array.from(widgetOrder);
    const [movedWidget] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, movedWidget);
    setWidgetOrder(newOrder);
    // Persist to ThemeSettings so order is saved across devices
    const orderStr = JSON.stringify(newOrder);
    if (themeSettings?.id) {
      base44.entities.ThemeSettings.update(themeSettings.id, { widget_order: orderStr });
    } else {
      base44.entities.ThemeSettings.create({ widget_order: orderStr }).then(setThemeSettings);
    }
  };

  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const greeting = `Good ${new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"}${themeSettings?.dashboard_header ? `, ${themeSettings.dashboard_header}` : user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}`;
  useEffect(() => { setTitle(greeting); return () => setTitle(""); }, [greeting]);

  const launchSlideshow = (mode) => {
    setSlideshowMode(mode);
    setShowSlideshow(true);
    setVisionMenuOpen(false);
  };

  const saveAsDefault = async () => {
    try {
      setSavingDefault(true);
      const orderStr = JSON.stringify(widgetOrder);
      if (themeSettings?.id) {
        await base44.entities.ThemeSettings.update(themeSettings.id, { widget_order: orderStr });
      } else {
        const created = await base44.entities.ThemeSettings.create({ widget_order: orderStr });
        setThemeSettings(created);
      }
      alert("Widget arrangement saved as default!");
    } catch (error) {
      console.error("Error saving default:", error);
      alert("Failed to save default arrangement");
    } finally {
      setSavingDefault(false);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto space-y-6">
         <div className="flex items-center justify-end gap-2">
           <Button size="sm" variant="outline" onClick={resetOnboarding} className="text-xs gap-1 bg-secondary/50">
             <HelpCircle className="w-3.5 h-3.5" /> Guide
           </Button>
          <div className="relative" ref={visionMenuRef}>
            <Button
              variant="default"
              size="sm"
              onClick={() => setVisionMenuOpen(o => !o)}
              className="gap-1.5"
            >
              <PlayCircle className="w-4 h-4" />
              Vision
            </Button>
            {visionMenuOpen && (
              <div className="fixed z-[9999] bg-popover border border-border rounded-lg shadow-xl overflow-hidden w-52"
                style={{
                  top: visionMenuRef.current ? visionMenuRef.current.getBoundingClientRect().bottom + 4 : 'auto',
                  right: visionMenuRef.current ? window.innerWidth - visionMenuRef.current.getBoundingClientRect().right : 'auto',
                }}
              >
                <button
                  onClick={() => launchSlideshow('auto')}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Auto-Generated</span>
                </button>
                <button
                  onClick={() => launchSlideshow('custom')}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors text-left"
                >
                  <SlidersHorizontal className="w-4 h-4 text-accent" />
                  <span>Custom Slideshow</span>
                </button>
              </div>
            )}
          </div>
          <Button
             variant={isReordering ? "destructive" : "outline"}
             size="icon"
             onClick={() => setIsReordering(!isReordering)}
             title={isReordering ? "Done Reordering" : "Reorder Widgets"}
             className={!isReordering ? "bg-secondary/50" : ""}
           >
             {isReordering ? <X className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
           </Button>
           {isReordering && (
             <Button
               size="sm"
               onClick={saveAsDefault}
               disabled={savingDefault}
               className="gap-1.5"
             >
               <Save className="w-4 h-4" />
               Save Default
             </Button>
           )}
             </div>

        <Droppable droppableId="dashboard-widgets" isDropDisabled={!isReordering}>
          {(provided) => (
            <div 
              className="space-y-5"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {widgetOrder.map((widgetId, index) => {
                const widget = WIDGET_COMPONENTS[widgetId];
                const Component = widget.component;
                return (
                  <Draggable key={widgetId} draggableId={widgetId} index={index} isDragDisabled={!isReordering}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...(isReordering && provided.dragHandleProps)}
                        className={snapshot.isDragging ? "opacity-50" : ""}
                      >
                        <WidgetCard
                           title={widget.title}
                           id={`dashboard-${widgetId}`}
                           headerRight={widgetId === "focal-areas" ? (
                             <Button
                               size="icon"
                               onClick={() => navigate("/visionboard?tab=evaluation")}
                               variant="default"
                               className={!evalDoneToday ? "bg-blue-500 hover:bg-blue-600 text-white h-7 w-7" : "bg-card hover:bg-muted text-muted-foreground h-7 w-7 border border-border"}
                             >
                               <Target className="w-3.5 h-3.5" />
                             </Button>
                           ) : widgetId === "tasks" ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() => navigate("/chores?filter=due")}
                                variant="default"
                                className={cn("h-7 px-2 text-xs gap-1",
                                  choreStatus.hasOverdue && choreStatus.hasDue ? "bg-purple-600/70 hover:bg-purple-600/90 text-white" :
                                  choreStatus.hasOverdue ? "bg-red-600/70 hover:bg-red-600/90 text-white" :
                                  choreStatus.hasDue ? "bg-blue-600/70 hover:bg-blue-600/90 text-white" :
                                  "bg-card hover:bg-muted text-muted-foreground border border-border opacity-50"
                                )}
                                title="Chores"
                              >
                                <CheckSquare className="w-3 h-3" />
                                {choreStatus.count > 0 && <span>{choreStatus.count}</span>}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => navigate("/education?filter=due")}
                                variant="default"
                                className={cn("h-7 px-2 text-xs gap-1",
                                  educationStatus.hasOverdue && educationStatus.hasDue ? "bg-purple-600/70 hover:bg-purple-600/90 text-white" :
                                  educationStatus.hasOverdue ? "bg-red-600/70 hover:bg-red-600/90 text-white" :
                                  educationStatus.hasDue ? "bg-blue-600/70 hover:bg-blue-600/90 text-white" :
                                  "bg-card hover:bg-muted text-muted-foreground border border-border opacity-50"
                                )}
                                title="Education"
                              >
                                <BookOpen className="w-3 h-3" />
                                {educationStatus.count > 0 && <span>{educationStatus.count}</span>}
                              </Button>
                            </div>
                           ) : undefined}
                           >
                           {widgetId === "focal-areas"
                            ? <Component onHighlightChange={setFocalAreasHighlight} />
                            : <Component />}
                        </WidgetCard>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
      {showSlideshow && (
        <DashboardSlideshow
          mode={slideshowMode}
          onClose={() => { setShowSlideshow(false); setSlideshowMode(null); }}
        />
      )}

      <GenericOnboardingDialog
       open={showOnboarding}
       onClose={() => setShowOnboarding(false)}
       storageKey="dashboard_onboarded"
       title="Welcome to Dashboard"
       steps={ONBOARDING_STEPS}
      />
      </DragDropContext>
      );
      }