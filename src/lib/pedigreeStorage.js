// src/lib/pedigreeStorage.js
const KEY = (familyId) => `cenagem-tree:v1:${familyId}`;

export function loadTree(familyId) {
  if (!familyId) return { pedigree: {}, members: [] };
  try {
    const raw = localStorage.getItem(KEY(familyId));
    if (!raw) return { pedigree: {}, members: [] };
    const data = JSON.parse(raw);
    return {
      pedigree: data.pedigree || {},
      members: Array.isArray(data.members) ? data.members : [],
    };
  } catch {
    return { pedigree: {}, members: [] };
  }
}

export function saveTree(familyId, data) {
  if (!familyId) return;
  try {
    const safe = {
      pedigree: data?.pedigree || {},
      members: Array.isArray(data?.members) ? data.members : [],
    };
    localStorage.setItem(KEY(familyId), JSON.stringify(safe));
  } catch {}
}

export function listenTree(familyId, onChange) {
  const handler = (e) => {
    if (e.key === KEY(familyId)) {
      try {
        onChange(e.newValue ? JSON.parse(e.newValue) : { pedigree: {}, members: [] });
      } catch {}
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}
