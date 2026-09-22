import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Scheduled function: runs at midnight to pre-generate today's quote for all users.
// For each user, if they already have a quote for today, skip. Otherwise generate one.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Scheduled task: the platform runs this with the app owner's (admin) user context,
    // so authenticate and require admin — this stops anyone else from invoking it directly.
    const caller = await base44.auth.me();
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (caller.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD in UTC

    // Get all users
    const users = await sr.entities.User.list();

    let generated = 0;
    let skipped = 0;

    for (const user of users) {
      // Check if a quote already exists for today for this user
      const existing = await sr.entities.DailyQuote.filter({ date: today, created_by: user.email }, '-created_date', 1);
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      // Gather previously used quotes for this user to avoid repeats
      const allPast = await sr.entities.DailyQuote.filter({ created_by: user.email }, '-created_date', 200);
      const usedQuotes = new Set(allPast.map(q => q.quote?.trim().toLowerCase()).filter(Boolean));

      // Fetch a non-repeated quote from the Quotable API
      const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      let quote, author;
      let attempts = 0;
      while (!quote && attempts < 8) {
        attempts++;
        if (attempts > 1) await sleep(1000);
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

      // Fallback to LLM with recent quotes to avoid repeats
      if (!quote) {
        const recentTitles = allPast.slice(0, 20).map(q => `"${q.quote?.substring(0, 60)}"`).join(', ');
        const result = await sr.integrations.Core.InvokeLLM({
          prompt: `Generate a single unique inspirational or motivational quote. It must NOT be any of these recently used quotes: ${recentTitles || 'none'}. Pick from a wide variety of authors throughout history. Return ONLY a JSON object: {"quote": "...", "author": "Full Name"}`,
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

      if (quote) {
        await sr.entities.DailyQuote.create({
          quote,
          author,
          date: today,
          is_favorite: false,
          created_by: user.email,
        });
        generated++;
      }
    }

    return Response.json({ success: true, date: today, generated, skipped });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
});