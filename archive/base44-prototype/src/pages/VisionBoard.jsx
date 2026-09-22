import { useState, useEffect } from "react";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import WidgetCard from "@/components/WidgetCard";
import DailyEvaluation from "@/components/visionboard/DailyEvaluation";
import WeeklyReview from "@/components/visionboard/WeeklyReview";
import ImageGallery from "@/components/visionboard/ImageGallery";
import PrivateImageUploader from "@/components/visionboard/PrivateImageUploader";
import Slideshow from "@/components/visionboard/Slideshow";
import LowScorePillars from "@/components/visionboard/LowScorePillars";
import AffirmationManager from "@/components/visionboard/AffirmationManager";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Printer, Share2, Sparkles, SlidersHorizontal, ChevronLeft, ChevronRight, CalendarIcon, Star, Save, Loader2, HelpCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PillarManager from "@/components/visionboard/PillarManager";
import DashboardSlideshow from "@/components/dashboard/DashboardSlideshow";
import OnboardingDialog from "@/components/visionboard/OnboardingDialog";

// Ordered by Maslow's hierarchy: Physiological → Safety → Love/Belonging → Esteem → Self-Actualization
const DEFAULT_PILLARS = [
  // Tier 1 – Physiological (basic physical survival)
  { name: "Nutrition", icon: "Apple", color: "#10b981" },
  { name: "Rest", icon: "Moon", color: "#06b6d4" },
  { name: "Fitness", icon: "Zap", color: "#f59e0b" },
  // Tier 2 – Safety & Security
  { name: "Financial", icon: "DollarSign", color: "#84cc16" },
  { name: "Home/Environment", icon: "Home", color: "#14b8a6" },
  // Tier 3 – Love & Belonging
  { name: "Relationships", icon: "Heart", color: "#ef4444" },
  // Tier 4 – Esteem
  { name: "Self-esteem", icon: "Star", color: "#f59e0b" },
  { name: "Career", icon: "Briefcase", color: "#6366f1" },
  // Tier 5 – Self-Actualization
  { name: "Education", icon: "BookOpen", color: "#3b82f6" },
  { name: "Mindset", icon: "Brain", color: "#8b5cf6" },
  { name: "Destress", icon: "Wind", color: "#ec4899" },
  { name: "Play", icon: "Smile", color: "#f97316" },
  { name: "Spirituality", icon: "Sparkles", color: "#a78bfa" }
];

export default function VisionBoard() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Vision Board"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={() => setShowOnboarding(true)} title="Guide" className="h-8 w-8"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const [searchParams] = useSearchParams();
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reviewDate, setReviewDate] = useState(startOfWeek(new Date()));

  const [showSlideshow, setShowSlideshow] = useState(false);
  const [slideshowMode, setSlideshowMode] = useState(null); // 'auto' | 'custom'
  const [slideshowImages, setSlideshowImages] = useState([]);
  const [slideshowAffirmations, setSlideshowAffirmations] = useState([]);
  const [refreshCollage, setRefreshCollage] = useState(0);
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [allCollageImages, setAllCollageImages] = useState([]);
  const [pickerSelected, setPickerSelected] = useState(new Set());
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "evaluation" ? "daily" : "pillars");
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [evalDates, setEvalDates] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [collageTabVisited, setCollageTabVisited] = useState(false);



  useEffect(() => {
    const initializePillars = async () => {
      try {
        const existing = await base44.entities.HealthPillar.list();
        const onboarded = localStorage.getItem("visionboard_onboarded");
        
        if (existing.length === 0) {
          const defaultPillars = DEFAULT_PILLARS.map((p, idx) => ({
            ...p,
            order: idx
          }));
          await base44.entities.HealthPillar.bulkCreate(defaultPillars);
          setPillars(defaultPillars);
          if (!onboarded) {
            setShowOnboarding(true);
            setActiveTab("pillars");
          }
        } else {
          setPillars(existing.sort((a, b) => (a.order || 0) - (b.order || 0)));
          if (!onboarded) {
            setShowOnboarding(true);
            setActiveTab("pillars");
          }
        }
      } catch (error) {
        console.error("Error loading pillars:", error);
        setPillars(DEFAULT_PILLARS);
      }
      setLoading(false);
    };

    initializePillars();
  }, []);

  useEffect(() => {
    base44.entities.DailyPillarTracking.list("-date", 200).then((records) => {
      const dates = [...new Set(records.map(r => r.date))].map(d => new Date(d + "T12:00:00"));
      setEvalDates(dates);
    }).catch(() => {});
  }, [activeTab]);

  const resolvePrivateImages = async () => {
    const privateImgs = await base44.entities.UserCollageImage.list("order", 500);
    const now = Date.now();
    return await Promise.all(
      privateImgs.map(async (img) => {
        let url = img.signed_url;
        if (!url || !img.signed_url_expires || img.signed_url_expires < now + 60000) {
          try {
            const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: img.file_uri, expires_in: 3600 });
            url = res.signed_url;
            await base44.entities.UserCollageImage.update(img.id, { signed_url: url, signed_url_expires: now + 3600 * 1000 });
          } catch { url = null; }
        }
        return url ? { ...img, image_url: url } : null;
      })
    ).then(results => results.filter(Boolean));
  };

  const openCustomPicker = async () => {
    const imgs = await base44.entities.CollageImage.list("order", 100);
    const privateResolved = await resolvePrivateImages();
    const combined = [
      ...imgs.filter(i => !i.hidden_from_slideshow),
      ...privateResolved.map(i => ({ ...i, _private: true }))
    ];
    setAllCollageImages(combined);
    setPickerSelected(new Set(combined.map(img => img.id)));
    setCustomPickerOpen(true);
  };

  const launchCustomSlideshow = async () => {
       const selected = allCollageImages.filter(img => pickerSelected.has(img.id));
       const saved = await base44.entities.Affirmation.list();
       const affirmationTexts = saved.length > 0 ? saved.map(a => a.text) : ["You are capable of achieving your vision."];
       setSlideshowImages(selected);
       setSlideshowAffirmations(affirmationTexts);
       setCustomPickerOpen(false);
       setSlideshowMode('custom');
       setShowSlideshow(true);
     };

     const createGoalFromPillar = async (pillarName) => {
       try {
         const currentUser = await base44.auth.me();
         const goal = await base44.entities.Goal.create({
           title: `${pillarName} Goal`,
           description: `Created from Vision Board - ${pillarName} pillar`,
           timeframe: "monthly",
           status: "not_started",
           member_name: currentUser?.full_name || "User",
         });
         if (goal) {
           alert(`"${pillarName}" goal created! View it in Goal Manager.`);
         }
       } catch (error) {
         console.error("Error creating goal:", error);
       }
     };



  const saveCurrentImagesAsDefaults = async () => {
    try {
      setSavingDefaults(true);
      const allImages = await base44.entities.CollageImage.list("order", 100);
      
      // Mark all as non-default first
      await Promise.all(
        allImages.map(img => 
          base44.entities.CollageImage.update(img.id, { is_default: false })
        )
      );

      // Then mark currently displayed images as default
      if (allCollageImages.length > 0) {
        await Promise.all(
          allCollageImages.map(img => 
            base44.entities.CollageImage.update(img.id, { is_default: true })
          )
        );
      }

      setRefreshCollage(refreshCollage + 1);
      alert('Current vision board images saved as defaults!');
    } catch (error) {
      console.error('Error saving defaults:', error);
      alert('Failed to save defaults');
    } finally {
      setSavingDefaults(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const resetOnboarding = () => {
    localStorage.removeItem("visionboard_onboarded");
    setShowOnboarding(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pillars">Pillars</TabsTrigger>
          <TabsTrigger value="daily">Daily Eval</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Review</TabsTrigger>
          <TabsTrigger value="collage" onClick={() => setCollageTabVisited(true)}>Collage</TabsTrigger>
        </TabsList>

        <TabsContent value="pillars" className="space-y-4">
           <WidgetCard title="Your Health Pillars" className="mb-6">
             <PillarManager pillars={pillars} setPillars={setPillars} onCreateGoal={createGoalFromPillar} />
           </WidgetCard>
         </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <WidgetCard title="Daily Evaluation" className="mb-6" headerRight={
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-secondary/50" title={format(selectedDate, "EEEE, MMM d")}>
                  <CalendarIcon className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => { if (date) setSelectedDate(date); }}
                  modifiers={{ hasEntry: evalDates }}
                  modifiersClassNames={{
                    hasEntry: "font-bold after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary relative"
                  }}
                  initialFocus
                />
                <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground border-t">
                  <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                  Days with evaluations
                </div>
              </PopoverContent>
            </Popover>
          }>
            <DailyEvaluation date={selectedDate} pillars={pillars.filter(p => !p.is_hidden)} onSaved={() => { base44.entities.DailyPillarTracking.list("-date", 200).then(records => { const dates = [...new Set(records.map(r => r.date))].map(d => new Date(d + "T12:00:00")); setEvalDates(dates); }); }} onCompleted={() => setActiveTab("pillars")} />
          </WidgetCard>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <WidgetCard title="Weekly Review" className="mb-6" id="weekly-review-content" headerRight={
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 bg-secondary/50"
                onClick={() => {
                  const el = document.getElementById('weekly-review-content');
                  if (!el) return;
                  const win = window.open('', '_blank');
                  win.document.write(`<html><head><title>Weekly Review</title><style>body{font-family:Inter,sans-serif;padding:24px;}</style></head><body>${el.innerHTML}</body></html>`);
                  win.document.close();
                  win.print();
                }}
                title="Print review"
              >
                <Printer className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 bg-secondary/50"
                onClick={async () => {
                  const el = document.getElementById('weekly-review-content');
                  if (!el) return;
                  const user = await base44.auth.me();
                  await base44.integrations.Core.SendEmail({
                    to: user.email,
                    subject: `Weekly Review - ${format(reviewDate, 'MMM d, yyyy')}`,
                    body: el.innerHTML,
                  });
                  alert('Sent to your email!');
                }}
                title="Email review"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          }>
            <div className="mb-6 flex items-center justify-between gap-3 bg-muted/50 rounded-xl px-4 py-3 border border-border">
              <button
                onClick={() => setReviewDate(subWeeks(reviewDate, 1))}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 group">
                    <p className="font-semibold text-foreground text-sm">
                      {format(reviewDate, "MMM d")} – {format(endOfWeek(reviewDate), "MMM d, yyyy")}
                    </p>
                    <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={reviewDate}
                    onSelect={(date) => date && setReviewDate(startOfWeek(date))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <button
                onClick={() => setReviewDate(addWeeks(reviewDate, 1))}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                disabled={startOfWeek(new Date()) <= reviewDate}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <WeeklyReview date={reviewDate} pillars={pillars} />
          </WidgetCard>
        </TabsContent>

        <TabsContent value="collage" className="space-y-4">
          <WidgetCard title="Vision Collage" className="mb-6">
            <div className="space-y-6">
              {/* Slideshow Mode Selector */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Play Slideshow:</span>
                <button
                  onClick={() => { setSlideshowMode('auto'); setShowSlideshow(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-sm shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  ▶ Auto-Generated
                </button>
                <button
                  onClick={openCustomPicker}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-sm shadow"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  ▶ Custom
                </button>
              </div>
              <LowScorePillars pillars={pillars} />
              {collageTabVisited && <ImageGallery refreshTrigger={refreshCollage} />}
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold">My Private Images</h4>
                </div>
                {collageTabVisited && <PrivateImageUploader onImagesChanged={() => setRefreshCollage(c => c + 1)} />}
              </div>
            </div>
          </WidgetCard>

          {/* Custom Slideshow Image Picker Dialog */}
          <Dialog open={customPickerOpen} onOpenChange={setCustomPickerOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Choose Images for Custom Slideshow</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPickerSelected(new Set(allCollageImages.map(i => i.id)))} className="bg-secondary/50">
                    All ({allCollageImages.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPickerSelected(new Set(allCollageImages.filter(i => i.is_default).map(i => i.id)))} className="bg-secondary/50">
                    Defaults ({allCollageImages.filter(i => i.is_default).length})
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {allCollageImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.image_url}
                        alt={img.title || "Image"}
                        className={`w-full h-20 object-cover rounded-lg border-2 transition-all ${
                          pickerSelected.has(img.id) ? "border-yellow-400" : "border-transparent"
                        }`}
                      />
                      <button
                        onClick={() => {
                          const next = new Set(pickerSelected);
                          next.has(img.id) ? next.delete(img.id) : next.add(img.id);
                          setPickerSelected(next);
                        }}
                        className="absolute top-1 left-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Star className={`w-4 h-4 ${pickerSelected.has(img.id) ? "text-yellow-400 fill-yellow-400" : "text-white/60"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <Button onClick={launchCustomSlideshow} className="w-full" disabled={pickerSelected.size === 0}>
                  Play ({pickerSelected.size} images)
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <WidgetCard title="Affirmations" className="mb-6">
            <AffirmationManager 
              onApplyToSlideshow={(affirmations) => {
                setSlideshowAffirmations(affirmations);
                // Scroll to collage section
                document.querySelector('[id*="collage"]')?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </WidgetCard>
        </TabsContent>
      </Tabs>

      <OnboardingDialog
        open={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem("visionboard_onboarded", "1");
          setActiveTab("pillars");
        }}
        onDontRemind={() => {
          setShowOnboarding(false);
          localStorage.setItem("visionboard_onboarded", "1");
          setActiveTab("pillars");
        }}
      />

      {showSlideshow && slideshowMode === 'auto' && (
        <DashboardSlideshow
          onClose={() => { setShowSlideshow(false); setSlideshowMode(null); }}
          resolvePrivateImages={resolvePrivateImages}
        />
      )}

      {showSlideshow && slideshowMode === 'custom' && (
        <Slideshow
          images={slideshowImages}
          affirmations={slideshowAffirmations}
          focusAreas={[]}
          onClose={() => { setShowSlideshow(false); setSlideshowMode(null); }}
        />
      )}
    </div>
  );
}