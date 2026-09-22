import { useState, useEffect } from "react";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import WidgetCard from "../components/WidgetCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, RefreshCw, Send, Printer, Mail, X, HelpCircle, MessageCircle, PenTool } from "lucide-react";
import GenericOnboardingDialog from "@/components/GenericOnboardingDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import SwipeableListItem from "../components/SwipeableListItem";

const ONBOARDING_STEPS = [
  { icon: <MessageCircle className="w-8 h-8 text-blue-400" />, title: "1. Get Your Daily Quote", desc: "A fresh inspirational quote is generated automatically every day at midnight. Click 'New Quote' anytime if you'd like a different one. Each quote is saved with the date so you can look back on past quotes anytime." },
  { icon: <PenTool className="w-8 h-8 text-purple-400" />, title: "2. Write a Reflection", desc: "Use the reflection area to write how the quote connects to your day or life goals. Save it and it'll be permanently linked to that quote. Over time, reflections become a meaningful journal of your personal growth." },
  { icon: <Heart className="w-8 h-8 text-red-400" />, title: "3. Save Your Favorites", desc: "Click the heart icon on any quote to mark it as a favorite. Favorited quotes appear in their own section at the top of the page so you can revisit them whenever you need a boost of inspiration or clarity." },
  { icon: <Mail className="w-8 h-8 text-accent" />, title: "4. Share & Print", desc: "Use the email button to send the quote and your reflection to yourself or others. Use the print button for a physical copy to keep in a journal. Both include the full quote text and your personal reflection." },
];

export default function Quotes() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Daily Quotes & Reflection"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={resetOnboarding} title="Guide" className="h-8 w-8"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);
  const [todayQuote, setTodayQuote] = useState(null);
  const [reflection, setReflection] = useState("");
  const [pastQuotes, setPastQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailingQuoteId, setEmailingQuoteId] = useState(null);
  const [deleteAllDialog, setDeleteAllDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };

  useEffect(() => {
    if (localStorage.getItem("quotes_onboarded") === "true") return;
    base44.entities.ThemeSettings.list("-updated_date", 1).then(r => {
      if (!r.length) { setShowOnboarding(true); return; }
      const status = JSON.parse(r[0].onboarding_status || "{}");
      if (!status["quotes_onboarded"]) setShowOnboarding(true);
      else localStorage.setItem("quotes_onboarded", "true");
    }).catch(() => setShowOnboarding(true));
  }, []);

  const resetOnboarding = () => setShowOnboarding(true);

  useEffect(() => { 
    loadData();
    const checkMidnight = setInterval(() => {
      const newDate = format(new Date(), "yyyy-MM-dd");
      if (newDate !== getToday()) {
        window.location.reload();
      }
    }, 60000);
    return () => clearInterval(checkMidnight);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Race against a 15s timeout to prevent infinite spinner on slow mobile networks
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000));
      const result = await Promise.race([
        base44.functions.invoke('fetchDailyQuote', { date: getToday(), force: false }),
        timeoutPromise
      ]);
      const quoteData = result?.data || result;
      if (quoteData?.quote) {
        setTodayQuote(quoteData);
        setReflection(quoteData.reflection || "");
      }
      const past = await base44.entities.DailyQuote.list("-date", 50);
      setPastQuotes(past || []);
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewQuote = async () => {
    setLoading(true);
    setTodayQuote(null);
    try {
      const result = await base44.functions.invoke('fetchDailyQuote', { date: getToday(), force: true, _t: Date.now() });
      const quoteData = result?.data || result;
      if (quoteData?.quote) {
        const past = await base44.entities.DailyQuote.list("-date", 50);
        setPastQuotes(past);
        const fresh = past.find(q => q.id === quoteData.id) || quoteData;
        setTodayQuote(fresh);
        setReflection(fresh.reflection || "");
      }
    } catch (error) {
      console.error('Failed to generate new quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveReflection = async () => {
    if (!todayQuote) return;
    if (todayQuote.id) {
      await base44.entities.DailyQuote.update(todayQuote.id, { reflection });
      setTodayQuote({ ...todayQuote, reflection });
    } else {
      const saved = await base44.entities.DailyQuote.create({ quote: todayQuote.quote, author: todayQuote.author, date: getToday(), reflection });
      setTodayQuote(saved);
    }
    // saved
  };

  const toggleFavorite = async (quote) => {
    if (!quote) return;
    const newVal = !quote.is_favorite;

    // If quote has no id yet (edge case), save it first
    if (!quote.id) {
      try {
        const saved = await base44.entities.DailyQuote.create({
          quote: quote.quote, author: quote.author, date: getToday(), is_favorite: true,
        });
        setTodayQuote(saved);
        setPastQuotes(prev => [saved, ...prev]);
      } catch (err) {
        console.error('Failed to save quote for favoriting:', err);
      }
      return;
    }

    // Optimistic update
    setTodayQuote(prev => prev?.id === quote.id ? { ...prev, is_favorite: newVal } : prev);
    setPastQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, is_favorite: newVal } : q));
    try {
      await base44.entities.DailyQuote.update(quote.id, { is_favorite: newVal });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      setTodayQuote(prev => prev?.id === quote.id ? { ...prev, is_favorite: !newVal } : prev);
      setPastQuotes(prev => prev.map(q => q.id === quote.id ? { ...q, is_favorite: !newVal } : q));
    }
  };

  const sendEmail = async (quote) => {
    const user = await base44.auth.me();
    const refl = quote?.id === todayQuote?.id ? reflection : (quote?.reflection || "");
    
    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Daily Reflection — ${quote?.date || format(new Date(), "MMMM d, yyyy")}`,
      body: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:40px 20px">
        <h2 style="color:#333;margin-bottom:24px">Daily Reflection</h2>
        <blockquote style="font-size:20px;font-style:italic;color:#444;border-left:4px solid #10b981;padding-left:16px;margin:24px 0">"${quote?.quote}"</blockquote>
        <p style="color:#666;text-align:right">— ${quote?.author}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <h3 style="color:#333">My Reflection</h3>
        <p style="color:#555;white-space:pre-wrap">${refl || "No reflection written."}</p>
        <p style="color:#999;font-size:12px;margin-top:24px">${quote?.date || format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>`,
    });
    // sent
  };

  const deleteQuote = async (quoteId) => {
    await base44.entities.DailyQuote.delete(quoteId);
    setPastQuotes(pastQuotes.filter(q => q.id !== quoteId));
  };

  const deleteAllPastQuotes = async (includeFavorites) => {
    const quotesToDelete = includeFavorites ? pastQuotes : pastQuotes.filter(q => !q.is_favorite);
    await Promise.all(quotesToDelete.map(q => base44.entities.DailyQuote.delete(q.id)));
    setPastQuotes(pastQuotes.filter(q => !quotesToDelete.find(d => d.id === q.id)));
    setDeleteAllDialog(false);
  };

  const printReflectionQuote = (quote = todayQuote, refl = reflection) => {
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Daily Reflection</title><style>body{font-family:Georgia,serif;max-width:600px;margin:40px auto;padding:0 20px}blockquote{font-size:20px;font-style:italic;border-left:4px solid #10b981;padding-left:16px;margin:24px 0}hr{border:none;border-top:1px solid #eee;margin:24px 0}</style></head><body>
      <h2>Daily Reflection</h2>
      <blockquote>"${quote?.quote}"</blockquote>
      <p style="text-align:right">— ${quote?.author}</p>
      <hr>
      <h3>My Reflection</h3>
      <p style="white-space:pre-wrap">${refl || "No reflection written."}</p>
      <p style="color:#999;font-size:12px">${quote?.date || format(new Date(), "EEEE, MMMM d, yyyy")}</p>
    </body></html>`);
    win.document.close();
    win.print();
  };

  if (loading && !todayQuote) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your quote...</p>
      </div>
    );
  }

  if (!loading && !todayQuote) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Could not load quote.</p>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Today's Quote */}
      <div className="bg-gradient-to-br from-primary/10 via-card to-accent/10 rounded-2xl border border-border p-8 md:p-12">
        <blockquote className="font-display text-2xl md:text-3xl italic leading-relaxed text-foreground/90">
          "{todayQuote?.quote}"
        </blockquote>
        <p className="text-lg text-muted-foreground mt-4">— {todayQuote?.author}</p>
        <div className="flex gap-2 mt-6 no-print">
          <Button variant="outline" size="sm" onClick={generateNewQuote} disabled={loading} className="bg-secondary/50">
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} /> New Quote
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleFavorite(todayQuote)} className="bg-secondary/50">
            <Heart className={cn("w-3.5 h-3.5 mr-1.5", todayQuote?.is_favorite && "fill-red-500 text-red-500")} />
            {todayQuote?.is_favorite ? "Favorited" : "Favorite"}
          </Button>
        </div>
      </div>

      {/* Reflection */}
       <WidgetCard title="Today's Reflection" id="reflection" headerRight={(
        <div className="flex items-center gap-1 no-print">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => sendEmail(todayQuote)} title="Email reflection">
            <Mail className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => printReflectionQuote(todayQuote, reflection)} title="Print reflection">
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      )}>
        <div className="space-y-4">
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What does this quote mean to you today? How can you apply it..."
            className="min-h-[120px] resize-none"
          />
          <Button onClick={saveReflection} className="w-full"><Send className="w-3.5 h-3.5 mr-1.5" /> Save</Button>
        </div>
      </WidgetCard>

      {/* Favorited Quotes */}
      {pastQuotes.some(q => q.is_favorite) && (
        <WidgetCard title="Favorited Quotes" id="favorited-quotes">
          <div className="space-y-4">
            {pastQuotes.filter(q => q.is_favorite).map((q) => (
              <SwipeableListItem key={q.id} onDelete={() => deleteQuote(q.id)}>
                <div className="flex flex-col flex-1">
                  <blockquote className="text-sm italic flex-1">"{q.quote}"</blockquote>
                  <p className="text-xs text-muted-foreground mt-1">— {q.author} · {q.date}</p>
                  {q.reflection && (
                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      <strong>Reflection:</strong> {q.reflection}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3 no-print">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => sendEmail(q)} title="Email quote">
                      <Mail className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => printReflectionQuote(q, q.reflection)} title="Print quote">
                      <Printer className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </SwipeableListItem>
            ))}
          </div>
        </WidgetCard>
      )}

      {/* Delete All Dialog */}
      <Dialog open={deleteAllDialog} onOpenChange={setDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Past Quotes</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">What would you like to delete?</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => deleteAllPastQuotes(false)} className="flex-1 bg-secondary/50">
              Without Favorites
            </Button>
            <Button variant="destructive" onClick={() => deleteAllPastQuotes(true)} className="flex-1">
              All Including Favorites
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GenericOnboardingDialog
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        storageKey="quotes_onboarded"
        title="Welcome to Daily Quotes"
        steps={ONBOARDING_STEPS}
      />

      {/* Past Quotes */}
      <WidgetCard title="Past Quotes" id="past-quotes" headerRight={pastQuotes.length > 0 ? (
        <button onClick={() => setDeleteAllDialog(true)} title="Delete past quotes" className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/20 text-destructive">
          <X className="w-3 h-3" />
        </button>
      ) : null}>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {pastQuotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No past quotes yet</p>
          ) : (
            pastQuotes.map((q) => (
              <SwipeableListItem key={q.id} onDelete={() => deleteQuote(q.id)}>
                <div className="flex items-start justify-between gap-2 flex-1">
                  <div className="flex flex-col flex-1 min-w-0">
                    <blockquote className="text-sm italic">"{q.quote}"</blockquote>
                    <p className="text-xs text-muted-foreground mt-1">— {q.author} · {q.date}</p>
                    {q.reflection && (
                      <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                        <strong>Reflection:</strong> {q.reflection}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3 no-print">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleFavorite(q)}>
                        <Heart className={cn("w-3.5 h-3.5", q.is_favorite && "fill-red-500 text-red-500")} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => sendEmail(q)} title="Email quote">
                        <Mail className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => printReflectionQuote(q, q.reflection)} title="Print quote">
                        <Printer className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </SwipeableListItem>
            ))
          )}
        </div>
      </WidgetCard>
    </div>
  );
}