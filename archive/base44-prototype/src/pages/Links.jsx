import { useState, useEffect } from "react";
import { useHeader } from "@/lib/HeaderContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, ExternalLink, Link2, Globe, Star, Heart, Bookmark,
  FileText, Image, Music, Video, Code, Terminal, Database, Cloud, Mail,
  Phone, Calendar, Clock, Map, ShoppingCart, CreditCard, Settings, Home,
  User, Users, Briefcase, Book, Newspaper, Rss, Youtube, Gamepad2, Camera,
  Palette, Wrench, Lightbulb, Zap, Flame, Leaf, Sun, Moon, HelpCircle, Tag, Folder
} from "lucide-react";
import LinkLibraryOnboarding from "@/components/onboarding/LinkLibraryOnboarding";

const ICON_OPTIONS = [
  { name: "Folder", icon: Folder },
  { name: "ExternalLink", icon: ExternalLink },
  { name: "Link2", icon: Link2 },
  { name: "Globe", icon: Globe },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Bookmark", icon: Bookmark },
  { name: "FileText", icon: FileText },
  { name: "Image", icon: Image },
  { name: "Music", icon: Music },
  { name: "Video", icon: Video },
  { name: "Code", icon: Code },
  { name: "Terminal", icon: Terminal },
  { name: "Database", icon: Database },
  { name: "Cloud", icon: Cloud },
  { name: "Mail", icon: Mail },
  { name: "Phone", icon: Phone },
  { name: "Calendar", icon: Calendar },
  { name: "Clock", icon: Clock },
  { name: "Map", icon: Map },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "CreditCard", icon: CreditCard },
  { name: "Settings", icon: Settings },
  { name: "Home", icon: Home },
  { name: "User", icon: User },
  { name: "Users", icon: Users },
  { name: "Briefcase", icon: Briefcase },
  { name: "Book", icon: Book },
  { name: "Newspaper", icon: Newspaper },
  { name: "Rss", icon: Rss },
  { name: "Youtube", icon: Youtube },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Camera", icon: Camera },
  { name: "Palette", icon: Palette },
  { name: "Wrench", icon: Wrench },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Zap", icon: Zap },
  { name: "Flame", icon: Flame },
  { name: "Leaf", icon: Leaf },
  { name: "Sun", icon: Sun },
  { name: "Moon", icon: Moon },
  { name: "Tag", icon: Tag },
];

const ICON_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#64748b"
];

function getIconComponent(name) {
  return ICON_OPTIONS.find(o => o.name === name)?.icon || Folder;
}

const CATEGORIES_KEY = "link_categories_v2";

// Migration: if old plain string format exists, convert it
function loadStoredCategories() {
  try {
    const v2 = localStorage.getItem(CATEGORIES_KEY);
    if (v2) return JSON.parse(v2);
    // Migrate from old v1 plain string format
    const v1 = localStorage.getItem("link_categories");
    if (v1) {
      const names = JSON.parse(v1);
      return names.map(n => ({ name: n, icon: "Folder", color: "#6366f1" }));
    }
    return [];
  } catch { return []; }
}

function saveStoredCategories(cats) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats));
}

export default function Links() {
  const { setTitle, setHeaderRight } = useHeader();
  useEffect(() => { setTitle("Link Library"); return () => setTitle(""); }, []);
  useEffect(() => { setHeaderRight(<Button size="icon" variant="ghost" onClick={resetOnboarding} title="Guide" className="h-8 w-8"><HelpCircle className="w-4 h-4" /></Button>); return () => setHeaderRight(null); }, []);

  const [links, setLinks] = useState([]);
  const [customCategories, setCustomCategories] = useState(loadStoredCategories); // [{name, icon, color}]
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [form, setForm] = useState({ title: "", url: "", category: "", thumbnail_url: "" });
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("Folder");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [editingCategory, setEditingCategory] = useState(null); // {name, icon, color}
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem("links_onboarded"); } catch { return false; }
  });

  const resetOnboarding = () => setShowOnboarding(true);

  useEffect(() => { loadLinks(); }, []);

  const loadLinks = async () => {
    const data = await base44.entities.Link.list("-created_date");
    setLinks(data);
  };

  const saveCategories = (cats) => {
    setCustomCategories(cats);
    saveStoredCategories(cats);
  };

  const addCategory = () => {
    const name = newCategoryInput.trim();
    if (!name || customCategories.some(c => c.name === name)) return;
    saveCategories([...customCategories, { name, icon: newCategoryIcon, color: newCategoryColor }]);
    setNewCategoryInput("");
    setNewCategoryIcon("Folder");
    setNewCategoryColor("#6366f1");
  };

  const updateCategory = (oldName, updated) => {
    saveCategories(customCategories.map(c => c.name === oldName ? updated : c));
    setEditingCategory(null);
  };

  const deleteCategory = (categoryName) => {
    if (!confirm(`Delete category "${categoryName}"? Links in it will become uncategorized.`)) return;
    saveCategories(customCategories.filter(c => c.name !== categoryName));
    const affected = links.filter(l => l.category === categoryName);
    Promise.all(affected.map(l => base44.entities.Link.update(l.id, { category: "" }))).then(loadLinks);
    if (selectedCategory === categoryName) setSelectedCategory("All");
  };

  // Merge categories from links + custom stored categories
  const linkCategoryNames = Array.from(new Set(links.map(l => l.category).filter(Boolean)));
  // Build a full category map: name -> {icon, color}
  const categoryMap = {};
  customCategories.forEach(c => { categoryMap[c.name] = c; });
  linkCategoryNames.forEach(n => { if (!categoryMap[n]) categoryMap[n] = { name: n, icon: "Folder", color: "#6366f1" }; });
  const allCategoryNames = Object.keys(categoryMap).sort();
  const categories = ["All", ...allCategoryNames];

  const filteredLinks = selectedCategory === "All" ? links : links.filter(l => l.category === selectedCategory);

  const openAddLinkOnly = () => {
    setEditingLink(null);
    setForm({ title: "", url: "", category: "", thumbnail_url: "" });
    setShowAddModal(false);
    setDialogOpen(true);
  };

  const openEdit = (link) => {
    setEditingLink(link);
    setForm({ title: link.title, url: link.url, category: link.category || "", thumbnail_url: link.thumbnail_url || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.url) return;
    if (editingLink) {
      await base44.entities.Link.update(editingLink.id, form);
    } else {
      await base44.entities.Link.create(form);
    }
    setDialogOpen(false);
    loadLinks();
  };

  const handleDelete = async (id) => {
    await base44.entities.Link.delete(id);
    loadLinks();
  };

  const handleImportBookmarks = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportMessage("");
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/html");
      const anchors = doc.querySelectorAll("a[href]");
      const bookmarks = [];
      anchors.forEach(a => {
        const url = a.getAttribute("href");
        const title = a.textContent.trim();
        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
          bookmarks.push({ title: title || new URL(url).hostname, url, category: "Imported" });
        }
      });
      if (bookmarks.length === 0) { setImportMessage("No valid bookmarks found in the file."); setImportLoading(false); return; }
      for (const bookmark of bookmarks) await base44.entities.Link.create(bookmark);
      if (!customCategories.some(c => c.name === "Imported")) {
        saveCategories([...customCategories, { name: "Imported", icon: "Bookmark", color: "#6366f1" }]);
      }
      setImportMessage(`✓ Successfully imported ${bookmarks.length} bookmarks!`);
      loadLinks();
      setShowAddModal(false);
    } catch (error) {
      setImportMessage(`Error: ${error.message}`);
    } finally {
      setImportLoading(false);
      e.target.value = "";
    }
  };

  const groupedLinks = selectedCategory === "All"
    ? Object.fromEntries(
        [...allCategoryNames, "Uncategorized"]
          .sort((a, b) => a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b))
          .map(cat => [cat, cat === "Uncategorized" ? links.filter(l => !l.category) : links.filter(l => l.category === cat)])
      )
    : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => setShowAddModal(true)} size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Link2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 bg-primary text-primary-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => {
              const meta = categoryMap[cat];
              const CatIcon = meta ? getIconComponent(meta.icon) : null;
              return (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-2">
                    {CatIcon && cat !== "All" && <CatIcon className="w-3.5 h-3.5" style={{ color: meta.color }} />}
                    {cat}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* View Mode */}
      {selectedCategory === "All" ? (
        <div className="space-y-8">
          {Object.entries(groupedLinks).map(([cat, items]) => {
            const meta = categoryMap[cat];
            const CatIcon = meta ? getIconComponent(meta.icon) : Folder;
            return (
              <div key={cat}>
                <h2 className="text-base font-bold text-foreground mb-3 pb-1.5 border-b border-border flex items-center gap-2">
                  {cat !== "Uncategorized" && <CatIcon className="w-4 h-4" style={{ color: meta?.color || "#64748b" }} />}
                  {cat}
                </h2>
                {items.length > 0
                  ? <LinkGrid links={items} onEdit={openEdit} onDelete={handleDelete} />
                  : <p className="text-sm text-muted-foreground/50 italic">No links in this category</p>
                }
              </div>
            );
          })}
          {links.length === 0 && <EmptyState />}
        </div>
      ) : (
        <>
          {filteredLinks.length === 0
            ? <EmptyState />
            : <LinkGrid links={filteredLinks} onEdit={openEdit} onDelete={handleDelete} />
          }
        </>
      )}

      {/* Add/Edit Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLink ? "Edit Link" : "Add Link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="My Favorite Site" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">URL</label>
              <Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <CategoryComboInput
                value={form.category}
                onChange={v => setForm({ ...form, category: v })}
                categories={allCategoryNames}
                categoryMap={categoryMap}
              />
            </div>
            <ThumbnailPicker value={form.thumbnail_url} onChange={v => setForm({ ...form, thumbnail_url: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <LinkLibraryOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onDontRemind={() => { setShowOnboarding(false); localStorage.setItem("links_onboarded", "1"); }}
      />

      {/* Manage Links & Categories Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Links & Categories</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Create Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Create Category</label>
              <Input
                value={newCategoryInput}
                onChange={e => setNewCategoryInput(e.target.value)}
                placeholder="Category name..."
                onKeyDown={e => e.key === "Enter" && addCategory()}
              />
              <CategoryStylePicker
                icon={newCategoryIcon}
                color={newCategoryColor}
                onIconChange={setNewCategoryIcon}
                onColorChange={setNewCategoryColor}
              />
              <Button onClick={addCategory} disabled={!newCategoryInput.trim()} size="sm" className="w-full gap-2">
                <Plus className="w-4 h-4" /> Add Category
              </Button>
            </div>

            {/* Existing categories */}
            {allCategoryNames.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Edit / Delete Categories</label>
                <div className="space-y-1.5">
                  {allCategoryNames.map(cat => {
                    const meta = categoryMap[cat];
                    const CatIcon = getIconComponent(meta?.icon || "Folder");
                    return (
                      <div key={cat} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card/50">
                        <CatIcon className="w-4 h-4 shrink-0" style={{ color: meta?.color || "#6366f1" }} />
                        <span className="flex-1 text-sm truncate">{cat}</span>
                        <button
                          onClick={() => setEditingCategory({ ...meta, name: cat })}
                          className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCategory(cat)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-border my-2" />

            {/* Add Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Link</label>
              <Button onClick={openAddLinkOnly} className="w-full justify-start gap-2 h-auto py-2.5 bg-primary text-primary-foreground">
                <Plus className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium">Add Manually</p>
                  <p className="text-xs opacity-90">Enter title, URL, and details</p>
                </div>
              </Button>
              <input type="file" accept=".html" onChange={handleImportBookmarks} disabled={importLoading} className="hidden" id="bookmark-import" />
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-2.5 cursor-pointer bg-secondary/50"
                disabled={importLoading}
                onClick={() => document.getElementById("bookmark-import").click()}
              >
                <Globe className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium">{importLoading ? "Importing..." : "Import from Browser"}</p>
                  <p className="text-xs text-muted-foreground">Upload bookmark HTML file</p>
                </div>
              </Button>
              {importMessage && (
                <p className={`text-xs px-2 py-1.5 rounded ${importMessage.startsWith("✓") ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                  {importMessage}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      {editingCategory && (
        <EditCategoryDialog
          category={editingCategory}
          onSave={(updated) => updateCategory(editingCategory.name, updated)}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}

function CategoryStylePicker({ icon, color, onIconChange, onColorChange }) {
  const CurIcon = getIconComponent(icon);
  return (
    <div className="space-y-2 p-2 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center gap-2 mb-1">
        <CurIcon className="w-5 h-5" style={{ color }} />
        <span className="text-xs text-muted-foreground">Preview</span>
      </div>
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        {ICON_OPTIONS.map(({ name, icon: Icon }) => (
          <button key={name} type="button"
            onClick={() => onIconChange(name)}
            title={name}
            className={`p-1.5 rounded border transition-colors ${icon === name ? "border-primary bg-primary/10" : "border-transparent hover:border-border"}`}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Color:</span>
        <div className="flex gap-1.5 flex-wrap">
          {ICON_COLORS.map(c => (
            <button key={c} type="button"
              onClick={() => onColorChange(c)}
              className={`w-4 h-4 rounded-full border-2 transition-all ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EditCategoryDialog({ category, onSave, onClose }) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon || "Folder");
  const [color, setColor] = useState(category.color || "#6366f1");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <CategoryStylePicker icon={icon} color={color} onIconChange={setIcon} onColorChange={setColor} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave({ name: name.trim() || category.name, icon, color })} disabled={!name.trim()}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LinkGrid({ links, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {links.map(link => (
        <LinkCard key={link.id} link={link} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

function ThumbnailPicker({ value, onChange }) {
  const [tab, setTab] = useState(value?.startsWith("icon:") ? "icon" : "url");
  const isIcon = value?.startsWith("icon:");
  const parts = isIcon ? value.slice(5).split("|") : [];
  const selectedIconName = parts[0] || "ExternalLink";
  const selectedColor = parts[1] || "#6366f1";
  const setIcon = (name, color) => onChange(`icon:${name}|${color}`);

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">Thumbnail</label>
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => { setTab("url"); if (isIcon) onChange(""); }}
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${tab === "url" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
          Image URL
        </button>
        <button type="button" onClick={() => { setTab("icon"); if (!isIcon) onChange(`icon:ExternalLink|#6366f1`); }}
          className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${tab === "icon" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}>
          Icon
        </button>
      </div>
      {tab === "url" ? (
        <Input value={isIcon ? "" : (value || "")} onChange={e => onChange(e.target.value)} placeholder="https://..." />
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
            {ICON_OPTIONS.map(({ name, icon: Icon }) => (
              <button key={name} type="button"
                onClick={() => setIcon(name, selectedColor)}
                title={name}
                className={`p-2 rounded-lg border transition-colors ${selectedIconName === name ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                <Icon className="w-4 h-4" style={{ color: selectedColor }} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color:</span>
            <div className="flex gap-1.5 flex-wrap">
              {ICON_COLORS.map(c => (
                <button key={c} type="button"
                  onClick={() => setIcon(selectedIconName, c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${selectedColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkCard({ link, onEdit, onDelete }) {
  const isIcon = link.thumbnail_url?.startsWith("icon:");
  const parts = isIcon ? link.thumbnail_url.slice(5).split("|") : [];
  const IconComp = isIcon ? getIconComponent(parts[0]) : null;
  const iconColor = parts[1] || "#6366f1";

  return (
    <div className="group relative rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="aspect-video bg-muted overflow-hidden">
          {isIcon ? (
            <div className="w-full h-full flex items-center justify-center">
              <IconComp className="w-10 h-10" style={{ color: iconColor }} />
            </div>
          ) : link.thumbnail_url ? (
            <img src={link.thumbnail_url} alt={link.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="px-3 py-2 text-center">
          <p className="text-sm font-medium text-foreground truncate">{link.title}</p>
        </div>
      </a>
      <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
        <button onClick={(e) => { e.preventDefault(); onEdit(link); }} className="p-1 rounded-md bg-background/80 hover:bg-background shadow text-muted-foreground hover:text-foreground">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.preventDefault(); onDelete(link.id); }} className="p-1 rounded-md bg-background/80 hover:bg-background shadow text-muted-foreground hover:text-destructive">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <ExternalLink className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">No links yet. Add your first one!</p>
    </div>
  );
}

function CategoryComboInput({ value, onChange, categories, categoryMap }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const filtered = categories.filter(c => c.toLowerCase().includes(value.toLowerCase()));

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        placeholder="Type or select a category..."
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {filtered.map(cat => {
            const meta = categoryMap?.[cat];
            const CatIcon = meta ? getIconComponent(meta.icon) : Folder;
            return (
              <button
                key={cat}
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
                onMouseDown={() => { onChange(cat); setShowDropdown(false); }}
              >
                <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: meta?.color || "#6366f1" }} />
                {cat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}