export const storage = {
    get(key, fallback){ try{ const v = localStorage.getItem(key); return v? JSON.parse(v): fallback; }catch{ return fallback; } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
    remove(key){ localStorage.removeItem(key); }
  };