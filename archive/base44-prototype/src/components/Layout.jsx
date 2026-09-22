import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import {
  LayoutDashboard, CheckSquare, ListTodo, Calendar, Sparkles,
  GraduationCap, Target, Quote, Clock, Palette, Menu, X, ChevronLeft, Library, Settings, BookOpen, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderProvider, useHeader } from "@/lib/HeaderContext";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/checklist", label: "Daily Checklist", icon: CheckSquare },
  { path: "/tasks", label: "Tasks", icon: ListTodo },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/schedule", label: "Daily Schedule", icon: Clock },
  { path: "/chores", label: "Chores", icon: Sparkles },
  { path: "/education", label: "Education", icon: GraduationCap },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/visionboard", label: "Vision Board", icon: Eye },
  { path: "/quotes", label: "Daily Quotes", icon: Quote },
  { path: "/links", label: "Link Library", icon: Library },
  { path: "/theme", label: "Theme Editor", icon: Palette },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/manual", label: "User Manual", icon: BookOpen },
];

function LayoutInner() {
  const { title, headerRight } = useHeader();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState({ vision_board: true, education: true, chores: true });
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  useEffect(() => {
    base44.auth.me().then((user) => {
      if (!user?.terms_accepted || !user?.privacy_accepted) {
        navigate('/accept-terms');
      }
    }).catch(() => {});

    // Initialize default collage images for all users
    base44.functions.invoke('initializeDefaultCollageImages', {}).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    const handleFeaturesToggled = (e) => {
      setEnabledFeatures(e.detail);
    };

    window.addEventListener('featuresToggled', handleFeaturesToggled);
    return () => window.removeEventListener('featuresToggled', handleFeaturesToggled);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileOpen(!mobileOpen);
  };

  const [touchStartY, setTouchStartY] = useState(null);
  const [touchTarget, setTouchTarget] = useState(null);

  const isSwipeBlocked = () => {
    // Disable swipe if daily evaluation is in progress
    if (window.__evalInProgress) return true;
    // Disable swipe if an input/textarea/select is focused
    const activeTag = document.activeElement?.tagName;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return true;
    // Disable swipe if any dialog/modal is open (Radix sets data-state="open" on overlays)
    if (document.querySelector('[role="dialog"]')) return true;
    // Disable swipe if a slider/range input is being interacted with
    const activeType = document.activeElement?.type;
    if (activeType === 'range') return true;
    // Disable swipe if touch started on a slider element
    if (touchTarget?.closest('[role="slider"]') || touchTarget?.closest('input[type="range"]')) return true;
    return false;
  };

  const handleTouchStart = (e) => {
    // Check if touch started on a slider by examining the touch target
    const touchElement = e.targetTouches[0];
    const elementAtTouch = document.elementFromPoint(touchElement.clientX, touchElement.clientY);
    
    // Check if element is a slider or inside a slider
    if (elementAtTouch?.closest('[role="slider"]') || elementAtTouch?.closest('input[type="range"]') || elementAtTouch?.closest('.slider')) {
      return;
    }
    
    setTouchTarget(elementAtTouch);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    setTouchEnd(e.changedTouches[0].clientX);
    if (!touchStart || !touchStartY) return;
    if (isSwipeBlocked()) return;

    // Check if touch occurred on a slider
    const elementAtEnd = document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    if (elementAtEnd?.closest('[role="slider"]') || elementAtEnd?.closest('input[type="range"]') || elementAtEnd?.closest('.slider') || touchTarget?.closest('[role="slider"]') || touchTarget?.closest('input[type="range"]') || touchTarget?.closest('.slider')) {
      return;
    }

    const distanceX = touchStart - e.changedTouches[0].clientX;
    const distanceY = touchStartY - e.changedTouches[0].clientY;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(distanceX) < Math.abs(distanceY)) return;

    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;

    if (!isLeftSwipe && !isRightSwipe) return;

    const visibleItems = navItems.filter(item => {
      if (item.path === '/visionboard' && !enabledFeatures.vision_board) return false;
      if (item.path === '/education' && !enabledFeatures.education) return false;
      if (item.path === '/chores' && !enabledFeatures.chores) return false;
      return true;
    });

    const currentIndex = visibleItems.findIndex(item => item.path === location.pathname);
    let nextIndex;

    if (isLeftSwipe) {
      nextIndex = (currentIndex + 1) % visibleItems.length;
    } else if (isRightSwipe) {
      nextIndex = (currentIndex - 1 + visibleItems.length) % visibleItems.length;
    }

    if (nextIndex !== undefined) {
      navigate(visibleItems[nextIndex].path);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
      className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-72",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
      >
      <div className={cn("flex items-center gap-3 p-4 border-b border-sidebar-border", collapsed && "justify-center")}>
        {!collapsed && (
          <h1 className="font-display text-lg font-bold text-sidebar-primary leading-tight">
            Dash it, Dash it ALL!
            </h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const isHidden = 
              (item.path === '/visionboard' && !enabledFeatures.vision_board) ||
              (item.path === '/education' && !enabledFeatures.education) ||
              (item.path === '/chores' && !enabledFeatures.chores);
            
            if (isHidden) return null;

            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between no-print">
           <button
             onClick={handleMenuClick}
             className="lg:hidden p-3 -ml-3 shrink-0 touch-manipulation"
             aria-label="Open menu"
           >
             <Menu className="w-7 h-7" />
           </button>
           <div className="flex-1 flex flex-col items-center justify-center">
             {title && (
               <h1 className="font-display text-2xl font-semibold tracking-tight">
                 {title}
               </h1>
             )}
             <div className="text-xs text-muted-foreground text-center mt-1">
               {format(currentTime, 'EEE, MMM d')} · {format(currentTime, 'h:mm a')}
             </div>
           </div>
           {headerRight ? (
             <div className="shrink-0 ml-4">
               {headerRight}
             </div>
           ) : (
             <div className="lg:hidden w-10 shrink-0" />
           )}
         </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <HeaderProvider>
      <LayoutInner />
    </HeaderProvider>
  );
}