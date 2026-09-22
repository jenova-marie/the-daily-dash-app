import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link as LinkIcon, Plus, Trash2, ExternalLink } from "lucide-react";

export default function ActivityLinksDialog({ activity, onSave }) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState([]);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    try {
      setLinks(activity?.resource_links ? JSON.parse(activity.resource_links) : []);
    } catch {
      setLinks([]);
    }
  }, [activity?.resource_links, open]);

  const addLink = () => {
    if (urlInput.trim()) {
      setLinks([...links, urlInput.trim()]);
      setUrlInput("");
    }
  };

  const removeLink = (index) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(JSON.stringify(links));
    setOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-primary transition-colors" title="Manage links">
              <LinkIcon className="w-3.5 h-3.5" />
            </button>
          </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Resources</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">Add Resource URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addLink()}
                placeholder="https://example.com/resource"
                className="flex-1 px-3 py-1.5 border border-input rounded-md text-sm bg-transparent"
              />
              <Button size="sm" onClick={addLink} disabled={!urlInput.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {links.length > 0 && (
            <div>
              <label className="text-sm font-medium block mb-2">Resources ({links.length})</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {links.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-xs text-primary hover:underline truncate flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      {url}
                    </a>
                    <button
                      onClick={() => removeLink(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive hover:text-destructive/80" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
        </Dialog>
        

      </div>
    </>
  );
}