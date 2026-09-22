import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Eye, EyeOff, Loader2, Lock } from "lucide-react";

async function getFreshSignedUrl(image) {
  const now = Date.now();
  if (image.signed_url && image.signed_url_expires && image.signed_url_expires > now + 60000) {
    return image.signed_url;
  }
  const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
    file_uri: image.file_uri,
    expires_in: 3600,
  });
  await base44.entities.UserCollageImage.update(image.id, {
    signed_url,
    signed_url_expires: now + 3600 * 1000,
  });
  return signed_url;
}

export default function PrivateImageUploader({ onImagesChanged }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resolvedUrls, setResolvedUrls] = useState({});
  const loadingRef = useRef(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await base44.entities.UserCollageImage.list("order", 500);
      setImages(data);
      // Resolve URLs lazily in background — don't block render
      resolveUrls(data);
    } catch (e) {
      console.error("Failed to load private images", e);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const resolveUrls = async (imgs) => {
    if (!imgs.length) return;
    const now = Date.now();
    // Batch: separate images that need refresh from those that are still valid
    const needsRefresh = imgs.filter(img => !img.signed_url || !img.signed_url_expires || img.signed_url_expires < now + 60000);
    const stillValid = imgs.filter(img => img.signed_url && img.signed_url_expires && img.signed_url_expires >= now + 60000);

    // Immediately show valid cached URLs
    if (stillValid.length) {
      setResolvedUrls(prev => {
        const next = { ...prev };
        stillValid.forEach(img => { next[img.id] = img.signed_url; });
        return next;
      });
    }

    // Refresh stale ones in parallel, then update state + DB in one batch
    if (needsRefresh.length) {
      const results = await Promise.allSettled(
        needsRefresh.map(async (img) => {
          const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: img.file_uri, expires_in: 3600 });
          return { id: img.id, url: res.signed_url };
        })
      );
      const freshUrls = {};
      const dbUpdates = [];
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          freshUrls[needsRefresh[i].id] = r.value.url;
          dbUpdates.push(base44.entities.UserCollageImage.update(needsRefresh[i].id, {
            signed_url: r.value.url,
            signed_url_expires: now + 3600 * 1000,
          }));
        }
      });
      setResolvedUrls(prev => ({ ...prev, ...freshUrls }));
      // Fire DB updates in background, don't await
      Promise.allSettled(dbUpdates).catch(() => {});
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        const now = Date.now();
        const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri,
          expires_in: 3600,
        });
        await base44.entities.UserCollageImage.create({
          file_uri,
          signed_url,
          signed_url_expires: now + 3600 * 1000,
          title: file.name.split(".")[0],
          include_in_slideshow: true,
        });
      }
      await loadImages();
      onImagesChanged?.();
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const toggleSlideshow = async (img) => {
    await base44.entities.UserCollageImage.update(img.id, {
      include_in_slideshow: !img.include_in_slideshow,
    });
    setImages((prev) =>
      prev.map((i) =>
        i.id === img.id ? { ...i, include_in_slideshow: !i.include_in_slideshow } : i
      )
    );
    onImagesChanged?.();
  };

  const deleteImage = async (img) => {
    if (!confirm("Delete this private image?")) return;
    await base44.entities.UserCollageImage.delete(img.id);
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    onImagesChanged?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1.5 rounded-md border border-border">
          <Lock className="w-3.5 h-3.5" />
          <span>Private — only visible to you</span>
        </div>
        <label className="relative cursor-pointer">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <Button asChild variant="outline" disabled={uploading} className="cursor-pointer">
            <span className="flex items-center gap-2">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Uploading..." : "Upload My Images"}
            </span>
          </Button>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No private images yet. Upload your personal vision images here.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              {resolvedUrls[img.id] ? (
                <img
                  src={resolvedUrls[img.id]}
                  alt={img.title || "Private image"}
                  className={`w-full h-32 object-cover rounded-lg border-2 transition-all ${
                    img.include_in_slideshow ? "border-primary/60" : "border-transparent opacity-50"
                  }`}
                />
              ) : (
                <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-all" />
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleSlideshow(img)}
                  className="p-1 bg-black/60 hover:bg-black/80 rounded transition-colors"
                  title={img.include_in_slideshow ? "Remove from slideshow" : "Add to slideshow"}
                >
                  {img.include_in_slideshow
                    ? <Eye className="w-3.5 h-3.5 text-primary" />
                    : <EyeOff className="w-3.5 h-3.5 text-white/60" />}
                </button>
                <button
                  onClick={() => deleteImage(img)}
                  className="p-1 bg-destructive hover:bg-destructive/80 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

              {/* Slideshow badge */}
              {img.include_in_slideshow && (
                <div className="absolute bottom-1 left-1 text-[10px] bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded font-medium">
                  In slideshow
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}