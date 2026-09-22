const STORAGE_KEY = "chore_custom_rooms";
const DELETED_KEY = "chore_deleted_rooms";

export const DEFAULT_ROOM_OPTIONS = ["Kitchen", "Bathroom", "Bedroom", "Living Room", "Dining Room", "Laundry Room", "Garage", "Entryway", "Yard"];

// Rooms the user has explicitly deleted (suppressed even if they appear in DB)
export const getDeletedRooms = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
    return raw.map(r => r.trim().toLowerCase()).filter(Boolean);
  } catch {
    return [];
  }
};

const addToDeleted = (room) => {
  const key = room.trim().toLowerCase();
  const existing = getDeletedRooms();
  if (!existing.includes(key)) {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...existing, key]));
  }
};

const removeFromDeleted = (room) => {
  const key = room.trim().toLowerCase();
  const existing = getDeletedRooms();
  localStorage.setItem(DELETED_KEY, JSON.stringify(existing.filter(r => r !== key)));
};

// Builds a unified, deduplicated, sorted room list from all sources
// Pass libraryRooms (array of room strings from ChoreLibrary/Chore entities) for canonical casing priority
export const buildRoomOptions = (libraryRooms = []) => {
  const deleted = getDeletedRooms();
  const seen = new Map();

  // Library data first (canonical casing priority), skip deleted
  [...libraryRooms].forEach(r => {
    if (r?.trim()) {
      const key = r.trim().toLowerCase();
      if (!seen.has(key) && !deleted.includes(key)) seen.set(key, r.trim());
    }
  });

  // Then defaults + localStorage, skip deleted
  [...DEFAULT_ROOM_OPTIONS, ...getStoredRooms()].forEach(r => {
    const key = r?.trim().toLowerCase();
    if (key && !seen.has(key) && !deleted.includes(key)) seen.set(key, r.trim());
  });

  return [...seen.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
};

export const getStoredRooms = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    // Deduplicate case-insensitively on read, keeping first occurrence
    const seen = new Map();
    raw.forEach(r => {
      if (r?.trim()) {
        const key = r.trim().toLowerCase();
        if (!seen.has(key)) seen.set(key, r.trim());
      }
    });
    return [...seen.values()];
  } catch {
    return [];
  }
};

export const saveCustomRoom = (room) => {
  if (!room?.trim()) return;
  const trimmed = room.trim();
  // If room is in the deleted list, don't re-add it (user explicitly deleted it)
  if (getDeletedRooms().includes(trimmed.toLowerCase())) return;
  const existing = getStoredRooms();
  if (!existing.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, trimmed]));
  }
};

export const deleteCustomRoom = (room) => {
  if (!room?.trim()) return;
  const trimmed = room.trim();
  // Remove from custom rooms list
  const existing = getStoredRooms();
  const filtered = existing.filter(r => r.toLowerCase() !== trimmed.toLowerCase());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  // Add to deleted set so library/default rooms with same name stay suppressed
  addToDeleted(trimmed);
};