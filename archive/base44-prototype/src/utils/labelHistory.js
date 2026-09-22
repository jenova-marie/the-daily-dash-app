const KEY = "app_label_history";

export function getLabelHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveLabelToHistory(label, color) {
  if (!label) return;
  const history = getLabelHistory().filter(h => h.label !== label);
  history.unshift({ label, color: color || "" });
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, 30)));
}

export function clearLabelHistory() {
  localStorage.removeItem(KEY);
}

export function deleteLabelFromHistory(label) {
  const history = getLabelHistory().filter(h => h.label !== label);
  localStorage.setItem(KEY, JSON.stringify(history));
}