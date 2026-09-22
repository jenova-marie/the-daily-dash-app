import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { RefreshCw, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export default function DashboardQuote() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Do nothing until auth is fully resolved
    if (isLoadingAuth) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    loadQuote(false);
  }, [isAuthenticated, isLoadingAuth]);

  const loadQuote = async (force) => {
    setLoading(true);
    setError(null);
    if (force) setQuote(null);
    const today = getToday();
    try {
      // If not forcing, try loading from DB first — avoids calling the backend function at all
      if (!force) {
        const existing = await base44.entities.DailyQuote.filter({ date: today });
        if (existing?.length > 0) {
          setQuote(existing[0]);
          setLoading(false);
          return;
        }
      }
      // Otherwise call backend to generate (allow up to 30s for LLM fallback)
      const result = await base44.functions.invoke('fetchDailyQuote', { date: today, force: !!force });
      const data = result?.data || result;
      if (data?.quote) {
        setQuote(data);
        setError(null);
      } else {
        setError('No quote returned');
      }
    } catch (e) {
      console.error('DashboardQuote error:', e);
      setError(e?.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!quote?.id) return;
    const newVal = !quote.is_favorite;
    setQuote(prev => ({ ...prev, is_favorite: newVal }));
    await base44.entities.DailyQuote.update(quote.id, { is_favorite: newVal });
  };

  if (loading || isLoadingAuth) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-4 gap-2">
        <p className="text-sm text-red-500">{error}</p>
        <Button variant="ghost" size="sm" onClick={() => loadQuote(true)}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
        </Button>
      </div>
    );
  }

  if (!quote && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-4 gap-2">
        <p className="text-sm text-muted-foreground">No quote for today yet.</p>
        <Button variant="ghost" size="sm" onClick={() => loadQuote(false)}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Generate Quote
        </Button>
      </div>
    );
  }

  return (
    <div>
      <blockquote className="font-display text-lg italic leading-relaxed text-foreground/90">
        "{quote.quote}"
      </blockquote>
      <p className="text-sm text-muted-foreground mt-2">— {quote.author}</p>
      <div className="flex items-center gap-2 mt-3">
        <Button variant="ghost" size="sm" onClick={() => loadQuote(true)} disabled={loading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> New Quote
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleFavorite}>
          <Heart className={`w-3.5 h-3.5 mr-1.5 ${quote.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
          {quote.is_favorite ? "Favorited" : "Favorite"}
        </Button>
      </div>
    </div>
  );
}