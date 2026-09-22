import { Toaster } from "@/components/ui/toaster"
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import Dashboard from './pages/Dashboard';
import DailyChecklist from './pages/DailyChecklist';
import Tasks from './pages/Tasks';
import CalendarPage from './pages/CalendarPage';
import DailySchedule from './pages/DailySchedule';
import Chores from './pages/Chores';
import Education from './pages/Education';
import Goals from './pages/Goals';
import Quotes from './pages/Quotes';
import ThemeEditor from './pages/ThemeEditor';
import Settings from './pages/Settings';
import Links from './pages/Links';
import Auth from './pages/Auth';
import AcceptTerms from './pages/AcceptTerms';
import ResetPassword from './pages/ResetPassword';
import UserManual from './pages/UserManual';
import VisionBoard from './pages/VisionBoard';

function hexToHSL(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const DEFAULT_BG = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920";

const DEFAULT_BG_LIBRARY = [
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920",
  "https://images.unsplash.com/photo-1771849146987-89a04383ae87?q=80&w=1740&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1773672726538-885c0d878033?q=80&w=2064&auto=format&fit=crop",
  "https://cdn.lifeofpix.com/127295/_w1800/308669/lifeofpix-eberhardgross6384-308669.webp",
];

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Apply dark mode by default
    document.documentElement.classList.add("dark");
    // Instantly apply last known background from cache to prevent black flash on refresh
    const cachedBg = localStorage.getItem("theme_last_bg");
    if (cachedBg) {
      document.body.style.backgroundImage = `url(${cachedBg})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundRepeat = "no-repeat";
    }
  }, []);

  // Load theme after authentication is complete
  useEffect(() => {
    console.log("[THEME] Auth state check:", { isAuthenticated, isLoadingAuth, isLoadingPublicSettings });
    if (!isAuthenticated || isLoadingAuth || isLoadingPublicSettings) return;

    const loadTheme = async () => {
      try {
        console.log("[THEME] Fetching theme...");
        const results = await base44.entities.ThemeSettings.list("-updated_date", 1);
        console.log("[THEME] Got results:", results.length);
        if (!results.length) return;
        
        const t = results[0];
        const root = document.documentElement;
        if (t.primary_color) root.style.setProperty("--primary", hexToHSL(t.primary_color));
        if (t.accent_color) root.style.setProperty("--accent", hexToHSL(t.accent_color));
        if (t.dark_mode === false) root.classList.remove("dark");
        if (t.body_font) root.style.setProperty("--font-sans", `'${t.body_font}', sans-serif`);
        if (t.heading_font) root.style.setProperty("--font-display", `'${t.heading_font}', serif`);
        root.style.setProperty("--widget-opacity", `${(t.widget_bg_opacity ?? 70) / 100}`);
        root.style.setProperty("--widget-radius", `${t.widget_border_radius ?? 12}px`);
        
        const library = (t.background_library && t.background_library.length) ? t.background_library : DEFAULT_BG_LIBRARY;
        const shouldRandomize = t.randomize_background !== false; // default true

        let bgUrl;
        if (shouldRandomize) {
          bgUrl = library[Math.floor(Math.random() * library.length)];
        } else {
          bgUrl = t.background_image || DEFAULT_BG;
        }

        // Cache for inline script on next refresh
        localStorage.setItem("theme_bg_library", JSON.stringify(library));
        if (shouldRandomize) {
          localStorage.setItem("theme_randomize", "1");
        } else {
          localStorage.removeItem("theme_randomize");
        }

        if (bgUrl) {
          document.body.style.backgroundImage = `url(${bgUrl})`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundAttachment = "fixed";
          document.body.style.backgroundRepeat = "no-repeat";
          localStorage.setItem("theme_last_bg", bgUrl);
        }
      } catch (err) {
        console.error("[THEME] Load error:", err);
      }
    };

    loadTheme();
  }, [isAuthenticated, isLoadingAuth, isLoadingPublicSettings]);

  useEffect(() => {
    if (location.pathname !== '/' && location.pathname !== '/auth' && location.pathname !== '/accept-terms') {
      localStorage.setItem('lastLocation', location.pathname);
    }
  }, [location]);

  useEffect(() => {
    const lastLocation = localStorage.getItem('lastLocation');
    const publicPaths = ['/', '/auth', '/accept-terms', '/privacy-policy', '/terms-of-use', '/reset-password'];

    // Detect if this is a page refresh (same tab) vs a fresh open (new tab/window)
    const isRefresh = window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload'
      || window.performance?.navigation?.type === 1;

    if (isRefresh) {
      // Refresh: restore last visited page
      if (lastLocation && publicPaths.includes(location.pathname)) {
        base44.auth.isAuthenticated().then((authed) => {
          if (authed) navigate(lastLocation, { replace: true });
        });
      }
    } else {
      // Fresh open: always go to dashboard
      base44.auth.isAuthenticated().then((authed) => {
        if (authed) navigate('/dashboard', { replace: true });
      });
    }

    // On direct refresh of an app page, save it as last location so it persists
    if (!publicPaths.includes(location.pathname)) {
      localStorage.setItem('lastLocation', location.pathname);
    }
  }, []);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-transparent">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors (but allow access to /accept-terms for newly authenticated users)
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/auth', '/accept-terms', '/privacy-policy', '/terms-of-use', '/reset-password'];
      if (!publicPaths.includes(currentPath)) {
        navigateToLogin();
        return null;
      }
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/accept-terms" element={<AcceptTerms />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/checklist" element={<DailyChecklist />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/schedule" element={<DailySchedule />} />
        <Route path="/chores" element={<Chores />} />
        <Route path="/education" element={<Education />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/theme" element={<ThemeEditor />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/links" element={<Links />} />
        <Route path="/manual" element={<UserManual />} />
        <Route path="/visionboard" element={<VisionBoard />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App