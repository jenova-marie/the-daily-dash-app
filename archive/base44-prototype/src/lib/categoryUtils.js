// Deduplicate category names case-insensitively, preserving first-seen casing
export function uniqueCategories(categories) {
  const seen = new Map();
  for (const cat of categories) {
    if (!cat) continue;
    const key = cat.toLowerCase();
    if (!seen.has(key)) seen.set(key, cat);
  }
  return [...seen.values()];
}

// Group items by category case-insensitively, preserving first-seen casing as the group key
export function groupByCategoryCI(items, getCategory) {
  const grouped = {};
  const keyMap = {};
  items.forEach(item => {
    const cat = getCategory(item) || "(No Label)";
    const lowerKey = cat.toLowerCase();
    const displayKey = keyMap[lowerKey] || cat;
    keyMap[lowerKey] = displayKey;
    if (!grouped[displayKey]) grouped[displayKey] = [];
    grouped[displayKey].push(item);
  });
  return grouped;
}

// Check if a category matches any selected category (case-insensitive)
export function categoryMatchesCI(cat, selectedCategories) {
  if (!cat || !selectedCategories?.length) return false;
  const selectedLower = selectedCategories.map(c => c.toLowerCase());
  return selectedLower.includes(cat.toLowerCase());
}