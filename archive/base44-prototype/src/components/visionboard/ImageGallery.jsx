import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { EyeOff, Eye, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const IMAGES_PER_PAGE = 12;

export default function ImageGallery({ refreshTrigger }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    loadImages();
  }, [refreshTrigger]);

  const loadImages = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await base44.entities.CollageImage.list("order", 1000);
      const deletedIds = JSON.parse(localStorage.getItem("deleted_collage_images") || "[]");
      const filtered = data.filter(img => !deletedIds.includes(img.id));
      setImages(filtered);
    } catch (error) {
      console.error("Failed to load images:", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const deleteImage = async (id) => {
    if (!window.confirm("Delete this image?")) return;
    await base44.entities.CollageImage.delete(id);
    setImages(prev => prev.filter(i => i.id !== id));
    const deletedIds = JSON.parse(localStorage.getItem("deleted_collage_images") || "[]");
    localStorage.setItem("deleted_collage_images", JSON.stringify([...deletedIds, id]));
  };

  const toggleHidden = async (id) => {
    const img = images.find(i => i.id === id);
    const newHidden = !img.hidden_from_slideshow;
    await base44.entities.CollageImage.update(id, { hidden_from_slideshow: newHidden });
    setImages(prev => prev.map(i => i.id === id ? { ...i, hidden_from_slideshow: newHidden } : i));
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>;
  }

  if (images.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No images yet. Upload some to get started!
      </p>
    );
  }

  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE);
  const startIdx = currentPage * IMAGES_PER_PAGE;
  const paginatedImages = images.slice(startIdx, startIdx + IMAGES_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {paginatedImages.map((image) => (
        <div key={image.id} className="relative group">
          <img
            src={image.image_url}
            alt={image.title || "Collage image"}
            loading="lazy"
            className={`w-full h-32 object-cover rounded-lg transition-opacity ${image.hidden_from_slideshow ? "opacity-40" : ""}`}
          />
          <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/20 transition-all" />
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => toggleHidden(image.id)}
              className="p-1 bg-black/60 hover:bg-black/80 rounded transition-colors"
              title={image.hidden_from_slideshow ? "Show in slideshow" : "Hide from slideshow"}
            >
              {image.hidden_from_slideshow
                ? <EyeOff className="w-4 h-4 text-white/60" />
                : <Eye className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={() => deleteImage(image.id)}
              className="p-1 bg-destructive hover:bg-destructive/80 rounded transition-colors"
              title="Delete image"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
          {image.hidden_from_slideshow && (
            <div className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white/70 px-1.5 py-0.5 rounded">Hidden</div>
          )}
        </div>
      ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}