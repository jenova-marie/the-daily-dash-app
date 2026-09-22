import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const today = body.date || new Date().toLocaleDateString('en-CA');
    const force = body.force === true;

    const sr = base44.asServiceRole;

    // Gather ALL previously used quotes first (before any deletion) to avoid repeats
    const allPast = await base44.entities.DailyQuote.list('-created_date', 200);
    const usedQuotes = new Set(allPast.map(q => q.quote?.trim().toLowerCase()).filter(Boolean));

    // Get existing quotes for today
    const existing = allPast.filter(q => q.date === today);

    if (existing.length > 0 && !force) {
      // Return the most recent one; delete any duplicates silently
      if (existing.length > 1) {
        await Promise.all(existing.slice(1).map(q => base44.entities.DailyQuote.delete(q.id)));
      }
      return Response.json(existing[0]);
    }

    // Delete ALL existing quotes for today if forcing refresh
    if (existing.length > 0 && force) {
      await Promise.all(existing.map(q => base44.entities.DailyQuote.delete(q.id)));
    }

    // Fetch a non-repeated quote from the Quotable API
    let quote, author;
    let attempts = 0;
    while (!quote && attempts < 8) {
      attempts++;
      try {
        const response = await fetch('https://api.quotable.io/quotes/random?maxLength=220&limit=5');
        if (response.ok) {
          const data = await response.json();
          const candidates = Array.isArray(data) ? data : [data];
          for (const candidate of candidates) {
            if (candidate.content && !usedQuotes.has(candidate.content.trim().toLowerCase())) {
              quote = candidate.content;
              author = candidate.author;
              break;
            }
          }
        }
      } catch (_) { break; }
    }

    // Fallback: use LLM with explicit instruction to avoid repeats
    if (!quote) {
      const recentTitles = allPast.slice(0, 20).map(q => `"${q.quote?.substring(0, 60)}"`).join(', ');
      const result = await sr.integrations.Core.InvokeLLM({
        prompt: `Generate a single unique inspirational or motivational quote. It must NOT be any of these recently used quotes: ${recentTitles || 'none'}. Pick from a wide variety of authors, philosophers, scientists, writers, athletes, and leaders throughout history — choose someone different each time. Return ONLY a JSON object: {"quote": "...", "author": "Full Name"}`,
        response_json_schema: {
          type: "object",
          properties: {
            quote: { type: "string" },
            author: { type: "string" }
          }
        }
      });
      quote = result.quote;
      author = result.author;
    }

    if (!quote) {
      return Response.json({ error: 'Could not generate a quote' }, { status: 500 });
    }

    const saved = await base44.entities.DailyQuote.create({
      quote,
      author,
      date: today,
      is_favorite: false,
    });

    return Response.json(saved);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});