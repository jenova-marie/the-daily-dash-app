import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import WidgetCard from "../components/WidgetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save, RotateCcw, Palette, Plus, X, Upload } from "lucide-react";
import { useHeader } from "@/lib/HeaderContext";

const defaultTheme = {
  primary_color: "#1a9a7a",
  accent_color: "#e6930e",
  background_image: "",
  widget_bg_opacity: 90,
  font_size: "medium",
  heading_font: "Playfair Display",
  body_font: "Inter",
  dark_mode: false,
  widget_border_radius: 12,
  randomize_background: true,
};

const fontOptions = [
  { value: "Inter", label: "Inter" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Georgia", label: "Georgia" },
  { value: "Arial", label: "Arial" },
  { value: "Verdana", label: "Verdana" },
];

const fontSizeMap = {
  small: { base: "14px", heading: "1.75rem" },
  medium: { base: "16px", heading: "2rem" },
  large: { base: "18px", heading: "2.5rem" },
};

function hexToHSL(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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

const BG_HISTORY_KEY = "theme_bg_history";

export default function ThemeEditor() {
  const { setTitle } = useHeader();
  useEffect(() => { setTitle("Theme Editor"); return () => setTitle(""); }, []);
  const [theme, setTheme] = useState(defaultTheme);
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [defaultSet, setDefaultSet] = useState(false);
  const [bgHistory, setBgHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(BG_HISTORY_KEY) || "[]"); } catch { return []; }
  });
  const [themeId, setThemeId] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(loadTheme, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loaded) applyTheme(theme);
  }, [theme, loaded]);

  const loadTheme = async () => {
    const existing = await base44.entities.ThemeSettings.list("-updated_date", 1);
    if (existing.length === 0) { setLoaded(true); return; }
    if (existing.length > 0) {
      const t = existing[0];
      const clean = Object.fromEntries(Object.entries(t).filter(([, v]) => v !== null && v !== undefined));
      setTheme({ ...defaultTheme, ...clean });
      setThemeId(t.id);
      setLoaded(true);
      // Merge db library with localStorage, deduplicate, and sync back to localStorage
      const dbLib = Array.isArray(t.background_library) ? t.background_library : [];
      const localLib = (() => { try { return JSON.parse(localStorage.getItem(BG_HISTORY_KEY) || "[]"); } catch { return []; } })();
      const merged = [...new Set([...dbLib, ...localLib])];
      setBgHistory(merged);
      localStorage.setItem(BG_HISTORY_KEY, JSON.stringify(merged));
    }
  };

  const applyTheme = (t) => {
    const root = document.documentElement;
    if (t.primary_color) root.style.setProperty("--primary", hexToHSL(t.primary_color));
    if (t.accent_color) root.style.setProperty("--accent", hexToHSL(t.accent_color));
    if (t.dark_mode) root.classList.add("dark");
    else root.classList.remove("dark");
    const sizes = fontSizeMap[t.font_size] || fontSizeMap.medium;
    root.style.setProperty("--font-sans", `'${t.body_font || "Inter"}', sans-serif`);
    root.style.setProperty("--font-display", `'${t.heading_font || "Playfair Display"}', serif`);
    root.style.fontSize = sizes.base;
    root.style.setProperty("--widget-opacity", `${(t.widget_bg_opacity ?? 70) / 100}`);
    root.style.setProperty("--widget-radius", `${t.widget_border_radius ?? 12}px`);
    let bgUrl = t.background_image;
    if (t.randomize_background) {
      const activeBg = localStorage.getItem("theme_active_bg");
      if (activeBg) bgUrl = activeBg;
    }
    if (bgUrl) {
      document.body.style.backgroundImage = `url(${bgUrl})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      document.body.style.backgroundRepeat = "no-repeat";
    } else {
      document.body.style.backgroundImage = "";
    }
  };

  const addToBgHistory = (url) => {
    if (!url) return;
    setBgHistory(prev => {
      const updated = [url, ...prev.filter(u => u !== url)].slice(0, 20);
      localStorage.setItem(BG_HISTORY_KEY, JSON.stringify(updated));
      // Persist to db
      if (themeId) {
        base44.entities.ThemeSettings.update(themeId, { background_library: updated });
      }
      return updated;
    });
  };

  const removeFromBgHistory = (url) => {
    setBgHistory(prev => {
      const updated = prev.filter(u => u !== url);
      localStorage.setItem(BG_HISTORY_KEY, JSON.stringify(updated));
      // Persist to db
      if (themeId) {
        base44.entities.ThemeSettings.update(themeId, { background_library: updated });
      }
      // Delete from CollageImage if it's marked as default
      base44.entities.CollageImage.filter({ image_url: url, is_default: true }, "", 100).then(results => {
        results.forEach(img => base44.entities.CollageImage.delete(img.id));
      });
      return updated;
    });
  };

  const saveTheme = async () => {
    // Build updated library including the current background_image
    const updatedLibrary = theme.background_image
      ? [theme.background_image, ...bgHistory.filter(u => u !== theme.background_image)].slice(0, 20)
      : bgHistory;

    const themeToSave = { ...theme, background_library: updatedLibrary };

    if (themeId) {
      await base44.entities.ThemeSettings.update(themeId, themeToSave);
    } else {
      const created = await base44.entities.ThemeSettings.create(themeToSave);
      setThemeId(created.id);
    }

    // Sync library state
    setBgHistory(updatedLibrary);
    localStorage.setItem(BG_HISTORY_KEY, JSON.stringify(updatedLibrary));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const setAsDefault = async () => {
    localStorage.setItem("default_theme", JSON.stringify(theme));
    setDefaultSet(true);
    setTimeout(() => setDefaultSet(false), 2000);
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-end">
         <div className="flex gap-2">
            <Button variant="outline" onClick={resetTheme} className="bg-secondary/50"><RotateCcw className="w-4 h-4 mr-2" /> Reset</Button>
            <Button variant="outline" onClick={setAsDefault} className="bg-secondary/50">{defaultSet ? "Set as Default!" : "Set as Default"}</Button>
            <Button onClick={saveTheme}><Save className="w-4 h-4 mr-2" /> {saved ? "Saved!" : "Save Theme"}</Button>
          </div>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Colors */}
        <WidgetCard title="Colors" id="theme-colors">
          <div className="space-y-5">
            <div>
              <Label className="text-xs">Primary Color</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <Input type="color" value={theme.primary_color} onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={theme.primary_color} onChange={(e) => setTheme({ ...theme, primary_color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Accent Color</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <Input type="color" value={theme.accent_color} onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })} className="w-12 h-10 p-1 cursor-pointer" />
                <Input value={theme.accent_color} onChange={(e) => setTheme({ ...theme, accent_color: e.target.value })} className="flex-1" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <Label className="text-xs">Dark Mode</Label>
              <Switch checked={theme.dark_mode} onCheckedChange={(v) => setTheme({ ...theme, dark_mode: v })} />
            </div>
          </div>
        </WidgetCard>

        {/* Typography */}
        <WidgetCard title="Typography" id="theme-typography">
          <div className="space-y-5">
            <div>
              <Label className="text-xs">Heading Font</Label>
              <Select value={theme.heading_font} onValueChange={(v) => setTheme({ ...theme, heading_font: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{fontOptions.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Body Font</Label>
              <Select value={theme.body_font} onValueChange={(v) => setTheme({ ...theme, body_font: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{fontOptions.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Font Size</Label>
              <Select value={theme.font_size} onValueChange={(v) => setTheme({ ...theme, font_size: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </WidgetCard>

        {/* Widget Appearance */}
        <WidgetCard title="Widget Appearance" id="theme-widgets">
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs">Background Opacity</Label>
                <span className="text-xs text-muted-foreground">{theme.widget_bg_opacity}%</span>
              </div>
              <Slider value={[theme.widget_bg_opacity]} max={100} min={10} step={5} onValueChange={(v) => setTheme({ ...theme, widget_bg_opacity: v[0] })} />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-xs">Border Radius</Label>
                <span className="text-xs text-muted-foreground">{theme.widget_border_radius}px</span>
              </div>
              <Slider value={[theme.widget_border_radius]} max={24} min={0} step={2} onValueChange={(v) => setTheme({ ...theme, widget_border_radius: v[0] })} />
            </div>
          </div>
        </WidgetCard>

        {/* Background */}
        <WidgetCard title="Background Image" id="theme-background">
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Upload Image</Label>
              <div className="mt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    setTheme({ ...theme, background_image: file_url });
                    addToBgHistory(file_url);
                  }}
                />
                <Button type="button" variant="outline" size="sm" className="w-full cursor-pointer bg-secondary/50" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-2" /> Choose Image
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">Image URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={theme.background_image}
                  onChange={(e) => setTheme({ ...theme, background_image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
                {theme.background_image && (
                  <Button size="sm" variant="outline" onClick={() => { addToBgHistory(theme.background_image); }} className="bg-secondary/50">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs">Default Backgrounds</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[
                  "https://cdn.lifeofpix.com/214835/_w1800/310111/lifeofpix-caminhointegral-310111.webp",
                  "https://images.unsplash.com/photo-1775840535417-71811b19db5a?q=80&w=1716&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "https://images.unsplash.com/photo-1768409234914-96f61529b7e2?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "https://cdn.lifeofpix.com/122862/_w1800/305986/lifeofpix-felipe7096-305986.webp",
                  "https://cdn.lifeofpix.com/127295/_w1800/308669/lifeofpix-eberhardgross6384-308669.webp",
                  "https://images.pexels.com/photos/30309038/pexels-photo-30309038.jpeg",
                  "https://images.unsplash.com/photo-1773672726538-885c0d878033?q=80&w=2064&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "https://images.unsplash.com/photo-1771849146987-89a04383ae87?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "https://images.unsplash.com/photo-1772354011434-e6d5ff04c211?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "https://cdn.lifeofpix.com/214835/_w1800/310103/lifeofpix-caminhointegral-310103.webp",
                  "https://cdn.lifeofpix.com/220304/_w1800/310246/lifeofpix-photomarithe-310246.webp",
                  "https://cdn.lifeofpix.com/170780/_w1800/309560/lifeofpix-ranajabbarli2798-309560.webp",
                  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920",
                  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920",
                  "https://images.unsplash.com/photo-1772950399275-81eea958d92b?q=80&w=1886&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "https://images.pexels.com/photos/34643057/pexels-photo-34643057.jpeg",
                  "https://images.pexels.com/photos/9037438/pexels-photo-9037438.jpeg",
                  "https://images.pexels.com/photos/3157890/pexels-photo-3157890.jpeg",
                  "https://images.pexels.com/photos/36157569/pexels-photo-36157569.jpeg",
                  "https://images.unsplash.com/photo-1590301157284-ab2f8707bdc1?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  "https://cdn.lifeofpix.com/214835/_w1800/310117/lifeofpix-caminhointegral-310117.webp",
                ].map((url) => (
                  <div key={url} className="relative group">
                    <button onClick={() => setTheme({ ...theme, background_image: url })}
                      className={`w-full aspect-video rounded-md overflow-hidden border-2 transition-colors ${
                        theme.background_image === url ? "border-primary" : "border-transparent hover:border-primary"
                      }`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                    <button
                      onClick={() => addToBgHistory(url)}
                      title="Add to My Backgrounds"
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {bgHistory.length > 0 && (
              <div>
                <Label className="text-xs">My Backgrounds</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {bgHistory.map((url) => (
                    <div key={url} className="relative group">
                      <button onClick={() => setTheme({ ...theme, background_image: url })}
                        className={`w-full aspect-video rounded-md overflow-hidden border-2 transition-colors ${
                          theme.background_image === url ? "border-primary" : "border-transparent hover:border-primary"
                        }`}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                      <button onClick={() => removeFromBgHistory(url)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs">Randomize on app load</Label>
              <Switch
                checked={theme.randomize_background || false}
                onCheckedChange={(v) => setTheme({ ...theme, randomize_background: v })}
              />
            </div>
            {theme.randomize_background && bgHistory.length === 0 && (
              <p className="text-xs text-muted-foreground">Save some backgrounds to your library first.</p>
            )}

          </div>
        </WidgetCard>
      </div>

      {/* Preview */}
      <WidgetCard title="Preview" id="theme-preview">
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-bold">Heading Preview</h2>
          <p className="text-sm">This is body text preview. The quick brown fox jumps over the lazy dog.</p>
          <div className="flex gap-2">
            <Button>Primary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="secondary">Secondary</Button>
          </div>
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs">Primary</div>
            <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center text-accent-foreground text-xs">Accent</div>
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">Muted</div>
          </div>
        </div>
      </WidgetCard>
    </div>
  );
}