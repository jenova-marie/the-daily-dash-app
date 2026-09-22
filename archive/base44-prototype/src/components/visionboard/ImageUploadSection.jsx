import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Link } from "lucide-react";

export default function ImageUploadSection({ onImageAdded }) {
  const [loading, setLoading] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: file,
      });

      await base44.entities.CollageImage.create({
        image_url: file_url,
        title: file.name.split(".")[0],
        is_default: true,
      });

      onImageAdded?.();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!imageUrl.trim()) {
      alert("Please enter a valid URL");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.CollageImage.create({
        image_url: imageUrl,
        title: new URL(imageUrl).pathname.split("/").pop() || "Image",
        is_default: true,
      });

      setImageUrl("");
      setUrlMode(false);
      onImageAdded?.();
    } catch (error) {
      console.error("Failed to add image:", error);
      alert("Failed to add image from URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {!urlMode ? (
        <div className="flex items-center gap-2">
          <label className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={loading}
              className="hidden"
            />
            <Button
              asChild
              variant="outline"
              disabled={loading}
              className="cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {loading ? "Uploading..." : "Add Image"}
              </span>
            </Button>
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUrlMode(true)}
            className="text-muted-foreground"
          >
            <Link className="w-4 h-4 mr-1" /> or use URL
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={loading}
          />
          <Button
            onClick={handleAddUrl}
            disabled={loading || !imageUrl.trim()}
            size="sm"
          >
            {loading ? "Adding..." : "Add"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setUrlMode(false);
              setImageUrl("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}