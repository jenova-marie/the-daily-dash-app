import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import Slideshow from "@/components/visionboard/Slideshow";
import { Loader2 } from "lucide-react";

// mode: 'auto' = generate from last recorded pillars, 'custom' = use saved affirmations
export default function DashboardSlideshow({ onClose, mode = 'auto', resolvePrivateImages }) {
  const [images, setImages] = useState([]);
  const [affirmations, setAffirmations] = useState([]);
  const [focusPillars, setFocusPillars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const allImgs = await base44.entities.CollageImage.list();
        let imgs = allImgs.filter(img => !img.hidden_from_slideshow);

        // Merge in private images that are enabled for slideshow
        if (resolvePrivateImages) {
          try {
            const privateImgs = await resolvePrivateImages();
            const slideshowPrivate = privateImgs.filter(i => i.include_in_slideshow !== false);
            imgs = [...imgs, ...slideshowPrivate];
          } catch {}
        } else {
          // Fallback: load private images directly
          try {
            const now = Date.now();
            const privateImgs = await base44.entities.UserCollageImage.filter({ include_in_slideshow: true }, "order", 500);
            const resolved = await Promise.all(
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
            );
            imgs = [...imgs, ...resolved.filter(Boolean)];
          } catch {}
        }
        setImages(imgs);

        if (mode === 'custom') {
           // Use saved affirmations
           const saved = await base44.entities.Affirmation.list();
           setAffirmations(saved.map(a => a.text));
         } else {
           // Auto: generate from last recorded pillar scores or provide defaults
           const DEFAULT_PILLARS = ["Physical Health", "Mental Health", "Relationships", "Career & Purpose", "Finances", "Personal Growth", "Spirituality"];

           const [allTrackings, allPillars] = await Promise.all([
             base44.entities.DailyPillarTracking.list("-date", 50),
             base44.entities.HealthPillar.list()
           ]);

           const pillarNames = allPillars.length > 0
             ? allPillars.map(p => p.name)
             : DEFAULT_PILLARS;

           setFocusPillars(allPillars);

           // Check if user has completed a daily assessment (has trackings)
           let lowPillarNames = [];
           let hasAssessment = false;

           if (allTrackings.length > 0) {
             hasAssessment = true;
             const mostRecentDate = allTrackings[0].date;
             const recentTrackings = allTrackings.filter(t => t.date === mostRecentDate);
             const lowIds = recentTrackings.filter(t => t.rating <= 3).map(t => t.pillar_id);
             lowPillarNames = allPillars.filter(p => lowIds.includes(p.id)).map(p => p.name);
           }

           // If assessment done and there are low pillars, focus ONLY on those (min 3 each)
           // If assessment done but no low pillars, generate for all pillars (min 3 each)
           // If no assessment, generate for all pillars (min 3 each)
           const targetPillars = (hasAssessment && lowPillarNames.length > 0) ? lowPillarNames : pillarNames;

           const result = await base44.integrations.Core.InvokeLLM({
             prompt: `Generate personal affirmations for these life areas: ${targetPillars.join(", ")}.
             Generate EXACTLY 3 unique, different affirmations for EACH life area listed. Do not repeat any affirmation.
             ${hasAssessment && lowPillarNames.length > 0 ? `These areas scored low (3 or below) in a recent self-assessment, so make the affirmations especially uplifting, healing, and encouraging for growth in these specific areas.` : ""}
             Use a mix of "I" statements (e.g. "I am", "I have", "I embrace") and "You" statements (e.g. "You are", "You have", "You deserve"). Each affirmation must start with either "I" or "You".
             Every affirmation must be completely unique — no two should be similar or repeat the same idea.
             Return a JSON object with key "by_pillar" where each sub-key is exactly one of the life area names above and the value is an array of exactly 3 affirmation strings.`,
             response_json_schema: {
               type: "object",
               properties: {
                 by_pillar: {
                   type: "object",
                   additionalProperties: { type: "array", items: { type: "string" } }
                 }
               }
             }
           });

           // Round-robin interleave so affirmations from different pillars alternate
           const byPillar = result.by_pillar || {};
           const groups = targetPillars.map(name => byPillar[name] || []).filter(g => g.length > 0);
           const interleaved = [];
           const maxLen = groups.length > 0 ? Math.max(...groups.map(g => g.length)) : 0;
           for (let i = 0; i < maxLen; i++) {
             groups.forEach(g => { if (g[i]) interleaved.push(g[i]); });
           }
           setAffirmations(interleaved);
         }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    load();
  }, [mode]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="text-sm opacity-70">Preparing your slideshow...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="text-center text-white space-y-3">
          <p className="text-lg">No collage images found.</p>
          <p className="text-sm opacity-60">Add images on your Vision Board page first.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <Slideshow
      images={images}
      affirmations={affirmations}
      focusAreas={focusPillars}
      onClose={onClose}
    />
  );
}