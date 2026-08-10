import { useState, useEffect } from "react";
import { Plus, Trash2, Moon, SunMedium, Search, IndianRupee, ChevronDown, User, Check, FileDown, Home, ListPlus, AlertTriangle } from "lucide-react";


const API_URL = "https://mart-backend-vse7.onrender.com"; 
const PROFILE_KEY = "dmart_profile_v4";
const THEME_KEY = "dmart_theme_v4";
const UNITS = ["kg", "g", "litre", "ml", "packet", "piece", "dozen"];

const groceryCategories = [
  "Kitchen",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Bakery",
  "Grains & Pulses",
  "Spices & Masala",
  "Oil & Ghee",
  "Snacks",
  "Beverages",
  "Breakfast",
  "Frozen Food",
  "Personal Care",
  "Cleaning",
  "Baby Care",
  "Pet Care",
  "Other",
];




const ICON_RULES = [
  [["tea", "chai"], "🍵"], [["coffee"], "☕"], [["biscuit", "cookie"], "🍪"],
  [["shakkar", "sugar"], "🧂"], [["milk"], "🥛"], [["oil"], "🛢️"],
  [["rice"], "🍚"], [["atta", "flour"], "🌾"], [["soap"], "🧼"],
  [["shampoo"], "🧴"], [["bread"], "🍞"], [["egg"], "🥚"], [["salt"], "🧂"],
  [["dal", "lentil"], "🫘"], [["detergent", "surf"], "🫧"], [["toothpaste", "brush"], "🪥"],
  [["fruit", "apple", "banana"], "🍎"], [["vegetable"], "🥦"], [["ghee"], "🧈"],
  [["masala", "spice"], "🌶️"], [["towel", "bedsheet"], "🛏️"], [["curtain"], "🪟"],
];
function getIcon(name) {
  const n = name.toLowerCase();
  for (const [keys, icon] of ICON_RULES) if (keys.some((k) => n.includes(k))) return icon;
  return "🛒";
}

// ---------- Category auto-suggest ----------
const CATEGORY_RULES = [
  [["milk", "curd", "paneer", "cheese", "yogurt", "yoghurt", "butter"], "Dairy"],
  [["tea", "chai", "coffee", "juice", "cola", "soda", "drink"], "Beverages"],
  [["rice", "atta", "flour", "dal", "lentil", "wheat", "besan"], "Grains & Pulses"],
  [["oil", "ghee"], "Oil & Ghee"],
  [["masala", "spice", "salt", "chilli", "chili", "turmeric", "jeera"], "Spices & Masala"],
  [["bread", "bun", "cake", "pastry", "pav"], "Bakery"],
  [["biscuit", "cookie", "chips", "namkeen", "snack", "kurkure"], "Snacks"],
  [["apple", "banana", "mango", "orange", "grape", "fruit"], "Fruits"],
  [["onion", "potato", "tomato", "vegetable", "veggie", "carrot", "spinach"], "Vegetables"],
  [["soap", "shampoo", "toothpaste", "toothbrush", "lotion", "deodorant", "razor"], "Personal Care"],
  [["detergent", "surf", "cleaner", "phenyl", "dishwash", "harpic"], "Cleaning"],
  [["diaper", "baby"], "Baby Care"],
  [["pet", "dog food", "cat food"], "Pet Care"],
  [["frozen"], "Frozen Food"],
  [["cereal", "oats", "muesli", "cornflakes"], "Breakfast"],
  [["egg", "sugar", "shakkar"], "Kitchen"],
];
function suggestCategory(name) {
  const n = name.toLowerCase();
  for (const [keys, cat] of CATEGORY_RULES) if (keys.some((k) => n.includes(k))) return cat;
  return null;
}

// ---------- Validation helpers ----------
const MOBILE_REGEX = /^[6-9]\d{9}$/;
function validateMobile(mobile) {
  return MOBILE_REGEX.test(mobile);
}
function validateProfileName(name) {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required.";
  if (/^\d+$/.test(trimmed)) return "Name can't be only numbers.";
  if (trimmed.length > 40) return "Name is too long (max 40 characters).";
  return "";
}
function validateItemName(name, category, items, excludeId = null) {
  const trimmed = name.trim();
  if (!trimmed) return "Item name can't be empty.";
  if (trimmed.length > 40) return "Item name is too long (max 40 characters).";
  const dup = items.some(
    (i) => i.id !== excludeId && i.category === category && i.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (dup) return `"${trimmed}" is already in ${category}.`;
  return "";
}
function clampQty(qty) {
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 999) return 999;
  return n;
}
function clampPrice(price) {
  if (price === "" || price === null || price === undefined) return null;
  const n = Number(price);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(Math.min(n, 100000) * 100) / 100;
}

// ---------- API error classification + timeout ----------
class ApiError extends Error {
  constructor(message, type) {
    super(message);
    this.type = type; // 'auth' | 'server' | 'network' | 'timeout'
  }
}
async function apiFetch(url, options = {}, timeoutMs = 10000) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ApiError("You're offline. Check your internet connection.", "network");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") throw new ApiError("Request timed out. Please try again.", "timeout");
    throw new ApiError("Network error. Check your internet connection.", "network");
  }
  clearTimeout(timer);
  if (res.status === 401 || res.status === 403) {
    throw new ApiError("Could not verify this profile. Try logging in again.", "auth");
  }
  if (!res.ok) {
    throw new ApiError(`Server error (${res.status}). Please try again.`, "server");
  }
  try {
    return await res.json();
  } catch (e) {
    throw new ApiError("Received an unexpected response from the server.", "server");
  }
}

// const [dark, setDark] = useState(() => {
//   const saved = localStorage.getItem(THEME_KEY);
//   return saved ? JSON.parse(saved) : false;
// });

// ---------- API helpers ----------
async function apiLogin(name, mobile) {
  return apiFetch(`${API_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mobile }),
  });
}
async function apiGetItems(mobile) {
  return apiFetch(`${API_URL}/api/items/${mobile}`);
}
async function apiAddItem(mobile, item) {
  return apiFetch(`${API_URL}/api/items/${mobile}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
}
async function apiUpdateItem(mobile, id, patch) {
  return apiFetch(`${API_URL}/api/items/${mobile}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}
async function apiDeleteItem(mobile, id) {
  return apiFetch(`${API_URL}/api/items/${mobile}/${id}`, { method: "DELETE" });
}

export default function DmartApp() {
  const [profile, setProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [mobileInput, setMobileInput] = useState("");

  const [items, setItems] = useState([]);
  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("add");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [error, setError] = useState("");
  const [retryAction, setRetryAction] = useState(null); // () => void
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [pendingDelete, setPendingDelete] = useState(null); // { item, timer }
  const [mobileError, setMobileError] = useState("");
  const [nameError, setNameError] = useState("");

  const [fName, setFName] = useState("");
  const [fQty, setFQty] = useState(1);
  const [fUnit, setFUnit] = useState("packet");
  const [fCategory, setFCategory] = useState("Kitchen");
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [itemNameError, setItemNameError] = useState("");

  const backendReady = API_URL && API_URL !== "YOUR_BACKEND_URL";

  // debounce search so filtering doesn't run on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // offline / online detection
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // clear any pending "undo delete" timer on unmount
  useEffect(() => {
    return () => {
      if (pendingDelete) clearTimeout(pendingDelete.timer);
    };
    // eslint-disable-next-line
  }, [pendingDelete]);

  // remembered profile + theme are local convenience only, not the shopping data itself
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(PROFILE_KEY, false);
        if (res && res.value) setProfile(JSON.parse(res.value));
      } catch (e) {}
      try {
        const t = await window.storage.get(THEME_KEY, false);
        if (t && t.value) setDark(JSON.parse(t.value));
      } catch (e) {}
      setProfileLoaded(true);
    })();
  }, []);

// useEffect(() => {
//   localStorage.setItem(THEME_KEY, JSON.stringify(dark));
// }, [dark]);

  // load items from Neon whenever profile is set
  useEffect(() => {
    if (!profile || !backendReady) return;
    loadItems();
    // eslint-disable-next-line
  }, [profile]);

  async function loadItems() {
    setError("");
    setRetryAction(null);
    setItemsLoaded(false);
    try {
      const rows = await apiGetItems(profile.mobile);
      setItems(rows.map((r) => ({ ...r, price: r.price === null ? "" : r.price })));
    } catch (e) {
      setError(e.message || "Could not reach the server.");
      setRetryAction(() => loadItems);
    }
    setItemsLoaded(true);
  }

  async function saveProfile(p) {
    if (!p) {
      setProfile(null);
      window.storage.set(PROFILE_KEY, JSON.stringify(null), false).catch(() => {});
      return;
    }
    if (!backendReady) {
      setError('Backend URL is not set yet — update API_URL at the top of this file.');
      return;
    }
    const nameErr = validateProfileName(p.name);
    const mobileOk = validateMobile(p.mobile);
    setNameError(nameErr);
    setMobileError(mobileOk ? "" : "Enter a valid 10-digit mobile number starting with 6-9.");
    if (nameErr || !mobileOk) return;

    setError("");
    setRetryAction(null);
    try {
      await apiLogin(p.name, p.mobile);
      setProfile(p);
      window.storage.set(PROFILE_KEY, JSON.stringify(p), false).catch(() => {});
    } catch (e) {
      setError(e.message || "Could not log in.");
      setRetryAction(() => () => saveProfile(p));
    }
  }

  const t = dark
    ? { bg: "#12141A", surface: "#1B1F27", surface2: "#232834", border: "#2C313D", text: "#EDEFF3", muted: "#8B92A3", accent: "#1FAD5C", accent2: "#F0A83A", danger: "#E5555E" }
    : { bg: "#FAF8F4", surface: "#FFFFFF", surface2: "#F1EEE6", border: "#E3DECF", text: "#20221F", muted: "#767267", accent: "#1B9552", accent2: "#C97F17", danger: "#C6444C" };

  if (!profileLoaded) return <Loader t={{ bg: "#12141A", muted: "#8B92A3" }} />;

  if (!backendReady) {
    return (
      <div style={{ background: t.bg, minHeight: "100dvh", width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: "20px" }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "18px", padding: "24px", maxWidth: "380px", width: "100%", color: t.text, boxSizing: "border-box" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", color: t.danger, fontWeight: 700, marginBottom: "8px" }}>
            <AlertTriangle size={18} /> Backend not connected
          </div>
          <p style={{ fontSize: "13px", marginTop: 0, marginBottom: "12px" }}>The app is not connected to a backend server yet. Update the <code style={{ background: t.surface2, padding: "2px 4px", borderRadius: "4px" }}>API_URL</code> variable at the top of <code style={{ background: t.surface2, padding: "2px 4px", borderRadius: "4px" }}>src/App.jsx</code> with your deployed backend URL.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ background: t.bg, minHeight: "100dvh", width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", padding: "20px" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; }
          html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100%; background: ${t.bg}; }
        `}</style>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "18px", padding: "28px", width: "100%", maxWidth: "360px", color: t.text, boxSizing: "border-box" }}>
          <div style={{ fontFamily: "'Baloo 2', cursive", fontSize: "24px", marginBottom: "6px" }}>🛒 D-Mart List</div>
          <p style={{ color: t.muted, fontSize: "13px", marginTop: 0, marginBottom: "18px" }}>Enter your name and mobile number — your list is saved in the cloud under this profile.</p>
          {!online && (
            <p style={{ color: t.accent2, fontSize: "12px", marginBottom: "10px" }}>You're offline — connect to the internet to continue.</p>
          )}
          {error && (
            <div style={{ marginBottom: "10px" }}>
              <p style={{ color: t.danger, fontSize: "12.5px", margin: 0 }}>{error}</p>
              {retryAction && (
                <button onClick={retryAction} style={{ marginTop: "6px", background: "none", border: `1px solid ${t.danger}`, color: t.danger, borderRadius: "8px", padding: "4px 10px", fontSize: "11.5px", cursor: "pointer" }}>Retry</button>
              )}
            </div>
          )}
          <input placeholder="Name" value={nameInput} maxLength={40}
            onChange={(e) => { setNameInput(e.target.value); if (nameError) setNameError(""); }}
            style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${nameError ? t.danger : t.border}`, background: t.surface2, color: t.text, marginBottom: nameError ? "4px" : "10px", fontSize: "14px" }} />
          {nameError && <p style={{ color: t.danger, fontSize: "11.5px", margin: "0 0 10px" }}>{nameError}</p>}
          <input placeholder="Mobile number" value={mobileInput}
            onChange={(e) => { setMobileInput(e.target.value.replace(/\D/g, "").slice(0, 10)); if (mobileError) setMobileError(""); }}
            maxLength={10} style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${mobileError ? t.danger : t.border}`, background: t.surface2, color: t.text, marginBottom: mobileError ? "4px" : "16px", fontSize: "14px" }} />
          {mobileError && <p style={{ color: t.danger, fontSize: "11.5px", margin: "0 0 16px" }}>{mobileError}</p>}
          <button
            disabled={!nameInput.trim() || mobileInput.length < 10 || !online}
            onClick={() => saveProfile({ name: nameInput.trim(), mobile: mobileInput })}
            style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "none", background: (!nameInput.trim() || mobileInput.length < 10 || !online) ? t.muted : t.accent, color: "#fff", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}
          >Get started</button>
        </div>
      </div>
    );
  }
  if (!itemsLoaded) return <Loader t={t} />;

  const filtered = items.filter((i) => i.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
  const searchMatch = debouncedSearch.trim() ? items.find((i) => i.name.toLowerCase() === debouncedSearch.trim().toLowerCase()) : null;
  const categories = [...new Set(items.map((i) => i.category))];
  const boughtItems = items.filter((i) => i.checked);
  const pendingItems = items.filter((i) => !i.checked);
  const boughtTotal = boughtItems.reduce((s, i) => s + Number(i.price || 0) * (Number(i.qty) || 1), 0);
  const pendingTotal = pendingItems.reduce((s, i) => s + Number(i.price || 0) * (Number(i.qty) || 1), 0);

  async function addItem() {
    if (!fName.trim()) return;

    // Support pasting/typing "milk, bread, eggs" to add several items at once
    const rawNames = fName.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
    if (rawNames.length === 0) return;

    const qty = clampQty(fQty);
    const category = (fCategory || "Kitchen").trim() || "Kitchen";

    // validate each name up front (against existing items + names already queued in this same batch)
    const seenInBatch = [];
    const errors = [];
    const toAdd = [];
    for (const name of rawNames) {
      const capped = name.length > 40 ? name.slice(0, 40) : name;
      const dupInBatch = seenInBatch.some((n) => n.toLowerCase() === capped.toLowerCase());
      const validationErr = validateItemName(capped, category, items);
      if (dupInBatch) {
        errors.push(`"${capped}" was entered twice.`);
        continue;
      }
      if (validationErr) {
        errors.push(validationErr);
        continue;
      }
      seenInBatch.push(capped);
      toAdd.push(capped);
    }

    if (toAdd.length === 0) {
      setItemNameError(errors[0] || "Enter a valid item name.");
      return;
    }
    setItemNameError("");

    setSyncing(true);
    setError("");
    setRetryAction(null);
    let failed = false;
    for (const name of toAdd) {
      try {
        await apiAddItem(profile.mobile, { name, category, qty, unit: fUnit, price: null });
      } catch (e) {
        failed = true;
        errors.unshift(e.message || "Could not add item.");
        setRetryAction(() => addItem);
        break; // stop the batch on first network failure, keep the rest of fName intact
      }
    }
    await loadItems();
    if (!failed) {
      setFName(""); setFQty(1); setCategoryTouched(false);
    }
    if (errors.length) setError(errors[0]);
    setSyncing(false);
  }

  async function updateItem(id, patch) {
    if (patch.qty !== undefined) patch = { ...patch, qty: clampQty(patch.qty) };
    if (patch.price !== undefined) patch = { ...patch, price: clampPrice(patch.price) };
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i))); // optimistic update
    setError("");
    try {
      await apiUpdateItem(profile.mobile, id, patch);
    } catch (e) {
      setError(e.message || "Could not save that change.");
      setRetryAction(() => () => updateItem(id, patch));
      loadItems(); // resync with server truth
    }
  }

  // optimistic delete with a 5s "Undo" window before it actually hits the server
  function deleteItem(item) {
    if (pendingDelete) {
      // a previous pending delete gets committed immediately if a new one starts
      clearTimeout(pendingDelete.timer);
      apiDeleteItem(profile.mobile, pendingDelete.item.id).catch(() => {});
    }
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    const timer = setTimeout(async () => {
      setPendingDelete(null);
      try {
        await apiDeleteItem(profile.mobile, item.id);
      } catch (e) {
        setError(e.message || "Could not delete item.");
        setRetryAction(() => () => deleteItem(item));
        loadItems();
      }
    }, 5000);
    setPendingDelete({ item, timer });
  }

  function undoDelete() {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timer);
    setItems((prev) => [...prev, pendingDelete.item]);
    setPendingDelete(null);
  }

  function toggleCollapse(cat) { setCollapsed((p) => ({ ...p, [cat]: !p[cat] })); }
  function exportPDF() { window.print(); }

  const inputStyle = { background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "9px 12px", color: t.text, fontSize: "14px" };

  return (
<div
  style={{
    background: t.bg,
    color: t.text,
    width: "100%",
    minHeight: "100dvh",
    fontFamily: "'Inter', sans-serif",
    overflowX: "hidden",
  }}
>      
<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          background: ${t.bg};
        }
        body { overflow-x: hidden; }
        .display { font-family: 'Baloo 2', cursive; }
        input, select, button { box-sizing: border-box; font-family: inherit; }
        input:focus, select:focus { outline: 2px solid ${t.accent}55; }
        #print-area { display: none; }
        @media print {
          .app-ui { display: none !important; }
          #print-area { display: block !important; }
        }
      `}</style>

      {/* ===== Normal app UI ===== */}
      <div className="app-ui" style={{ maxWidth: "560px", margin: "0 auto", padding: "16px 16px 90px", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="display" style={{ fontSize: "22px" }}>🛒 D-Mart List</div>
            <div style={{ fontSize: "12px", color: t.muted, display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
              <User size={11} /> {profile.name} · {profile.mobile}
              <button onClick={() => saveProfile(null)} style={{ background: "none", border: "none", color: t.accent, cursor: "pointer", fontSize: "11px", marginLeft: "6px", textDecoration: "underline" }}>switch</button>
              {syncing && <span style={{ color: t.accent2 }}>· saving…</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={exportPDF} title="Export as PDF" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "999px", width: "38px", height: "38px", cursor: "pointer", color: t.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileDown size={16} />
            </button>
            <button onClick={() => setDark((d) => !d)} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "999px", width: "38px", height: "38px", cursor: "pointer", color: t.text }}>
              {dark ? <SunMedium size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>

        {!online && (
          <div style={{ marginTop: "12px", background: `${t.accent2}22`, border: `1px solid ${t.accent2}55`, color: t.accent2, borderRadius: "10px", padding: "9px 12px", fontSize: "12.5px" }}>
            You're offline — changes will fail until you're back online.
          </div>
        )}

        {error && (
          <div style={{ marginTop: "12px", background: `${t.danger}22`, border: `1px solid ${t.danger}55`, color: t.danger, borderRadius: "10px", padding: "9px 12px", fontSize: "12.5px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <span>{error}</span>
            {retryAction && (
              <button onClick={() => { setError(""); retryAction(); }} style={{ flexShrink: 0, background: "none", border: `1px solid ${t.danger}`, color: t.danger, borderRadius: "8px", padding: "4px 10px", fontSize: "11.5px", cursor: "pointer" }}>Retry</button>
            )}
          </div>
        )}

        {pendingDelete && (
          <div style={{ marginTop: "12px", background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "10px", padding: "9px 12px", fontSize: "12.5px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
            <span>Deleted "{pendingDelete.item.name}"</span>
            <button onClick={undoDelete} style={{ flexShrink: 0, background: "none", border: "none", color: t.accent, cursor: "pointer", fontWeight: 600, fontSize: "12.5px" }}>Undo</button>
          </div>
        )}

        <div style={{ position: "relative", marginTop: "16px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: t.muted }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search a product..."
            style={{ ...inputStyle, width: "100%", paddingLeft: "34px" }} />
        </div>



        {tab === "home" && (
          <>
            <div style={{ marginTop: "14px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" }}>
              <div style={{ display: "flex", gap: "18px", fontSize: "13px", flexWrap: "wrap" }}>
                <div style={{ color: t.accent, display: "flex", alignItems: "center", gap: "4px" }}><IndianRupee size={12} /> {boughtTotal.toFixed(0)} bought ({boughtItems.length})</div>
                <div style={{ color: t.accent2, display: "flex", alignItems: "center", gap: "4px" }}><IndianRupee size={12} /> {pendingTotal.toFixed(0)} pending ({pendingItems.length})</div>
                <div style={{ color: t.text, fontWeight: 700, marginLeft: "auto" }}>Total ₹{(boughtTotal + pendingTotal).toFixed(0)}</div>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              {categories.length === 0 && <div style={{ textAlign: "center", color: t.muted, fontSize: "13px", padding: "20px 0" }}>Your list is empty — add items from the "Add" tab first.</div>}
              {categories.map((cat) => {
                const catItems = filtered.filter((i) => i.category === cat);
                if (catItems.length === 0) return null;
                const isCollapsed = collapsed[cat];
                return (
                  <div key={cat} style={{ marginBottom: "14px" }}>
                    <div onClick={() => toggleCollapse(cat)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "4px 2px" }}>
                      <span className="display" style={{ fontSize: "15px", color: t.accent }}>{cat}</span>
                      <ChevronDown size={15} style={{ transform: isCollapsed ? "rotate(-90deg)" : "none", color: t.muted }} />
                    </div>
                    {!isCollapsed && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
                        {catItems.map((item) => (
                          <div key={item.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", opacity: item.checked ? 0.55 : 1 }}>
                            <button onClick={() => updateItem(item.id, { checked: !item.checked })}
                              style={{ width: "22px", height: "22px", minWidth: "22px", borderRadius: "6px", border: `2px solid ${item.checked ? t.accent : t.border}`, background: item.checked ? t.accent : "transparent", cursor: "pointer", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {item.checked && <Check size={13} />}
                            </button>
                            <span style={{ fontSize: "17px" }}>{getIcon(item.name)}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 600, textDecoration: item.checked ? "line-through" : "none" }}>{item.name}</div>
                              <div style={{ fontSize: "11.5px", color: t.muted, fontFamily: "monospace" }}>{item.qty} {item.unit}</div>
                            </div>
                            <input type="number" min="0" max="100000" step="0.01" placeholder="₹" value={item.price} onChange={(e) => updateItem(item.id, { price: e.target.value })}
                              style={{ width: "56px", ...inputStyle, padding: "6px 8px", fontSize: "12.5px" }} />
                            <button onClick={() => deleteItem(item)} style={{ background: "none", border: "none", color: t.danger, cursor: "pointer", padding: "2px" }}><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
                {tab === "add" && (
          <>
            {debouncedSearch.trim() && (
              <div style={{ marginTop: "10px", fontSize: "12.5px", color: searchMatch ? t.accent : t.muted }}>
                {searchMatch ? `✅ "${searchMatch.name}" is already on your list (qty: ${searchMatch.qty} ${searchMatch.unit})` : `"${debouncedSearch}" is not on your list yet — add it below.`}
              </div>
            )}

            <div style={{ marginTop: "14px", background: t.surface, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "16px" }}>
              <div style={{ fontSize: "13px", color: t.muted, fontWeight: 600, marginBottom: "10px" }}>Add an item whenever you remember (tip: "milk, bread, eggs" adds all three)</div>
<div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
  <div style={{ flex: "1 1 140px" }}>
    <input
      value={fName}
      maxLength={200}
      onChange={(e) => {
        const val = e.target.value;
        setFName(val);
        if (itemNameError) setItemNameError("");
        if (!categoryTouched && !val.includes(",")) {
          const guess = suggestCategory(val);
          if (guess) setFCategory(guess);
        }
      }}
      onKeyDown={(e) => e.key === "Enter" && addItem()}
      placeholder="Item name (comma-separate for multiple)"
      style={{ ...inputStyle, width: "100%", border: `1px solid ${itemNameError ? t.danger : t.border}` }}
    />
  </div>

  <select
    value={fCategory}
    onChange={(e) => { setFCategory(e.target.value); setCategoryTouched(true); }}
    style={{ ...inputStyle, flex: "1 1 100px" }}
  >
    {groceryCategories.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>
</div>
              {itemNameError && <div style={{ color: t.danger, fontSize: "11.5px", marginTop: "4px" }}>{itemNameError}</div>}
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <input type="number" min="1" max="999" value={fQty} onChange={(e) => setFQty(e.target.value)} onBlur={(e) => setFQty(clampQty(e.target.value))} style={{ ...inputStyle, width: "70px" }} />
                <select value={fUnit} onChange={(e) => setFUnit(e.target.value)} style={inputStyle}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <button onClick={addItem} disabled={syncing || !online} style={{ marginLeft: "auto", background: t.accent, color: "#fff", border: "none", borderRadius: "10px", padding: "9px 16px", fontWeight: 600, fontSize: "14px", cursor: (syncing || !online) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px", opacity: (syncing || !online) ? 0.6 : 1 }}>
                  <Plus size={15} /> Add
                </button>
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.length === 0 && <div style={{ textAlign: "center", color: t.muted, fontSize: "13px", padding: "20px 0" }}>No items found.</div>}
              {filtered.map((item) => (
                <div key={item.id} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "17px" }}>{getIcon(item.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: "11.5px", color: t.muted, fontFamily: "monospace" }}>{item.category} · {item.qty} {item.unit}</div>
                  </div>
                  <button
                    onClick={() => updateItem(item.id, { qty: Math.max(1, Number(item.qty) - 1) })}
                    disabled={Number(item.qty) <= 1}
                    style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "6px",
                      width: "26px", height: "26px", cursor: Number(item.qty) <= 1 ? "not-allowed" : "pointer", color: t.text, opacity: Number(item.qty) <= 1 ? 0.5 : 1 }}>−</button>
                  <span style={{ minWidth: "24px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateItem(item.id, { qty: Math.min(999, Number(item.qty) + 1) })}
                    disabled={Number(item.qty) >= 999}
                    style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: "6px", width: "26px", height: "26px", cursor: Number(item.qty) >= 999 ? "not-allowed" : "pointer", color: t.text, opacity: Number(item.qty) >= 999 ? 0.5 : 1 }}>+</button>
                  <button onClick={() => deleteItem(item)} style={{ background: "none", border: "none", color: t.danger, cursor: "pointer", padding: "4px" }}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ===== Bottom tab bar ===== */}
      <div className="app-ui" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: t.surface, borderTop: `1px solid ${t.border}`,
        display: "flex", justifyContent: "center", zIndex: 10,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", width: "100%", maxWidth: "560px" }}>
          {[
            { id: "home", label: "Home / Buy", icon: Home },
            { id: "add", label: "Add List", icon: ListPlus },
 
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{
                flex: 1, padding: "12px 0 10px", background: "transparent", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                color: tab === id ? t.accent : t.muted,
              }}>
              <Icon size={19} />
              <span style={{ fontSize: "11.5px", fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== Printable PDF content (only visible when printing) ===== */}
      <div id="print-area" style={{ padding: "24px", color: "#111", background: "#fff", fontFamily: "Inter, sans-serif" }}>
        <h1 style={{ fontFamily: "'Baloo 2', cursive", fontSize: "24px", marginBottom: "2px" }}>D-Mart Shopping List</h1>
        <p style={{ fontSize: "12px", color: "#555", marginTop: 0 }}>{profile.name} · {profile.mobile} · {new Date().toLocaleDateString()}</p>

        <h3 style={{ marginBottom: "6px", marginTop: "20px" }}>Items to buy</h3>
        <PrintTable rows={pendingItems} />
        <p style={{ textAlign: "right", fontWeight: 700, fontSize: "13px" }}>Pending total: ₹{pendingTotal.toFixed(0)}</p>

        <h3 style={{ marginBottom: "6px", marginTop: "26px" }}>Purchased items</h3>
        <PrintTable rows={boughtItems} />
        <p style={{ textAlign: "right", fontWeight: 700, fontSize: "13px" }}>Bought total: ₹{boughtTotal.toFixed(0)}</p>

        <p style={{ textAlign: "right", fontWeight: 800, fontSize: "15px", marginTop: "16px", borderTop: "2px solid #111", paddingTop: "8px" }}>
          Grand total: ₹{(boughtTotal + pendingTotal).toFixed(0)}
        </p>
      </div>
    </div>
  );
}

function PrintTable({ rows }) {
  if (rows.length === 0) return <p style={{ fontSize: "12px", color: "#888" }}>None</p>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
      <thead>
        <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
          <th style={{ padding: "6px 4px" }}>Item</th>
          <th style={{ padding: "6px 4px" }}>Category</th>
          <th style={{ padding: "6px 4px" }}>Qty</th>
          <th style={{ padding: "6px 4px" }}>Price</th>
          <th style={{ padding: "6px 4px" }}>Line total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 4px" }}>{r.name}</td>
            <td style={{ padding: "6px 4px" }}>{r.category}</td>
            <td style={{ padding: "6px 4px" }}>{r.qty} {r.unit}</td>
            <td style={{ padding: "6px 4px" }}>{r.price !== "" && r.price != null ? `₹${r.price}` : "-"}</td>
            <td style={{ padding: "6px 4px" }}>{r.price !== "" && r.price != null ? `₹${(Number(r.price) * Number(r.qty)).toFixed(0)}` : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Loader({ t }) {
  return <div style={{ background: t.bg, minHeight: "300px", display: "flex", alignItems: "center", justifyContent: "center", color: t.muted, fontFamily: "sans-serif" }}>Loading...</div>;
}
