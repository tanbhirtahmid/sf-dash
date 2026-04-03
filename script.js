/* ============================================================
   SHIFAT'S DASHBOARD — script.js
   All interactivity: lock, clock, theme, focus, search,
   clipboard, notes, copy snippets, toast
   ============================================================ */

/* ============================================================
   CONFIG — CHANGE THESE TO PERSONALISE
   ============================================================ */
const CONFIG = {
  PASSWORD: "1234",           // <<< Change this to your password
  CLOCK_24H: true,            // true = 24h, false = 12h AM/PM
  SAVE_DEBOUNCE_MS: 600,      // ms delay before autosaving textarea
};

/* ============================================================
   ELEMENT REFERENCES
   ============================================================ */
const $ = id => document.getElementById(id);

const lockScreen     = $("lock-screen");
const dashboard      = $("dashboard");
const passwordInput  = $("password-input");
const unlockBtn      = $("unlock-btn");
const lockError      = $("lock-error");

const clockEl        = $("clock");
const dateEl         = $("date-display");
const themeToggle    = $("theme-toggle");
const focusBtn       = $("focus-btn");
const exitFocusBtn   = $("exit-focus-btn");
const focusBanner    = $("focus-banner");
const searchInput    = $("search-input");
const toast          = $("toast");
const noResults      = $("no-results");

const clipboardArea  = $("clipboard-area");
const clipboardStatus = $("clipboard-status");
const clearClipboard = $("clear-clipboard");

const notesArea      = $("notes-area");
const notesStatus    = $("notes-status");
const clearNotes     = $("clear-notes");

/* ============================================================
   STATE
   ============================================================ */
let isFocusMode = false;
let toastTimer  = null;
let searchDebounceTimer = null;

/* ============================================================
   PASSWORD LOCK
   ============================================================ */

/** Attempt to unlock the dashboard with the entered password */
function tryUnlock() {
  const entered = passwordInput.value.trim();

  if (entered === CONFIG.PASSWORD) {
    // Correct — show dashboard
    lockScreen.style.animation = "fadeIn 0.3s ease reverse forwards";
    setTimeout(() => {
      lockScreen.classList.add("hidden");
      dashboard.classList.remove("hidden");
      dashboard.style.animation = "fadeIn 0.4s ease";
    }, 280);
  } else {
    // Wrong — shake and show error
    lockError.textContent = "Incorrect password. Try again.";
    lockError.style.animation = "none";
    void lockError.offsetWidth; // reflow trick to restart animation
    lockError.style.animation = "shake 0.35s ease";
    passwordInput.value = "";
    passwordInput.focus();
  }
}

unlockBtn.addEventListener("click", tryUnlock);

passwordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") tryUnlock();
  // Clear error on typing
  if (lockError.textContent) lockError.textContent = "";
});

// Focus password input immediately
passwordInput.focus();

/* ============================================================
   REAL-TIME CLOCK
   ============================================================ */
const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function updateClock() {
  const now = new Date();
  let h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
  let suffix = "";

  if (!CONFIG.CLOCK_24H) {
    suffix = h >= 12 ? " PM" : " AM";
    h = h % 12 || 12;
  }

  const pad = n => String(n).padStart(2, "0");
  clockEl.textContent = `${pad(h)}:${pad(m)}:${pad(s)}${suffix}`;

  dateEl.textContent = `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

updateClock();
setInterval(updateClock, 1000);

/* ============================================================
   DARK / LIGHT THEME TOGGLE
   ============================================================ */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("dashboard-theme", theme);
  themeToggle.title = theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
}

// Load saved theme (default: dark)
const savedTheme = localStorage.getItem("dashboard-theme") || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

/* ============================================================
   FOCUS MODE
   ============================================================ */

/**
 * In focus mode, only the Coding card (compiler links) is
 * shown fully. All other cards are dimmed/hidden.
 * Elements with class "focus-keep" survive focus mode.
 */
function enterFocusMode() {
  isFocusMode = true;
  focusBanner.classList.remove("hidden");
  focusBtn.classList.add("focus-active");
  focusBtn.title = "Exit Focus Mode";

  // Hide non-essential cards
  document.querySelectorAll(".card").forEach(card => {
    if (!card.classList.contains("coding-card")) {
      card.style.opacity    = "0.06";
      card.style.pointerEvents = "none";
      card.style.userSelect = "none";
    }
  });
}

function exitFocusMode() {
  isFocusMode = false;
  focusBanner.classList.add("hidden");
  focusBtn.classList.remove("focus-active");
  focusBtn.title = "Focus Mode (F)";

  document.querySelectorAll(".card").forEach(card => {
    card.style.opacity       = "";
    card.style.pointerEvents = "";
    card.style.userSelect    = "";
  });
}

focusBtn.addEventListener("click", () => {
  isFocusMode ? exitFocusMode() : enterFocusMode();
});

exitFocusBtn.addEventListener("click", exitFocusMode);

/* Keyboard shortcut: F for focus, T for theme, Escape to clear search */
document.addEventListener("keydown", e => {
  // Don't fire shortcuts when typing in inputs
  const tag = document.activeElement.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") {
    if (e.key === "Escape") {
      searchInput.value = "";
      runSearch("");
      searchInput.blur();
    }
    return;
  }

  if (e.key === "f" || e.key === "F") {
    isFocusMode ? exitFocusMode() : enterFocusMode();
  }
  if (e.key === "t" || e.key === "T") {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  }
  if (e.key === "/" ) {
    e.preventDefault();
    searchInput.focus();
  }
});

/* ============================================================
   SEARCH / FILTER
   ============================================================ */

/**
 * Filters .searchable elements by query string.
 * Matches against element's data-label attribute.
 */
function runSearch(query) {
  const q = query.trim().toLowerCase();
  const searchables = document.querySelectorAll(".searchable");
  let matchCount = 0;

  searchables.forEach(el => {
    const label = (el.dataset.label || "").toLowerCase();
    const matches = !q || label.includes(q);

    el.classList.toggle("search-hidden", !matches);
    el.classList.toggle("search-match", !!(q && matches));

    if (matches) matchCount++;
  });

  // Show "no results" if nothing matches a non-empty query
  if (q && matchCount === 0) {
    noResults.classList.remove("hidden");
  } else {
    noResults.classList.add("hidden");
  }
}

searchInput.addEventListener("input", e => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => runSearch(e.target.value), 120);
});

/* ============================================================
   COPY SNIPPETS
   ============================================================ */

/**
 * Shows a brief "Copied!" toast notification.
 */
function showToast(msg = "✓ Copied to clipboard!") {
  toast.textContent = msg;
  toast.classList.remove("hidden");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2200);
}

// Attach copy button listeners
document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const codeEl   = document.getElementById(targetId);
    if (!codeEl) return;

    // Use Clipboard API, fall back to execCommand for older browsers
    const text = codeEl.innerText || codeEl.textContent;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        markCopied(btn);
        showToast();
      }).catch(() => fallbackCopy(text, btn));
    } else {
      fallbackCopy(text, btn);
    }
  });
});

function markCopied(btn) {
  btn.textContent = "✓ Done";
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = "Copy";
    btn.classList.remove("copied");
  }, 1600);
}

function fallbackCopy(text, btn) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    markCopied(btn);
    showToast();
  } catch (err) {
    showToast("Copy failed — select manually");
  }
  document.body.removeChild(ta);
}

/* ============================================================
   CLIPBOARD & NOTES — localStorage persistence
   ============================================================ */

const STORAGE_KEY_CLIP  = "dashboard-clipboard";
const STORAGE_KEY_NOTES = "dashboard-notes";

/** Load saved text from localStorage into textareas */
function loadSavedData() {
  clipboardArea.value = localStorage.getItem(STORAGE_KEY_CLIP)  || "";
  notesArea.value     = localStorage.getItem(STORAGE_KEY_NOTES) || "";
}

/** Show a transient "Saved" status label */
function flashSaved(statusEl) {
  statusEl.textContent = "✓ Saved";
  statusEl.classList.add("visible");
  clearTimeout(statusEl._timer);
  statusEl._timer = setTimeout(() => statusEl.classList.remove("visible"), 1800);
}

/** Debounced autosave for clipboard */
let clipSaveTimer;
clipboardArea.addEventListener("input", () => {
  clearTimeout(clipSaveTimer);
  clipSaveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY_CLIP, clipboardArea.value);
    flashSaved(clipboardStatus);
  }, CONFIG.SAVE_DEBOUNCE_MS);
});

/** Debounced autosave for notes */
let notesSaveTimer;
notesArea.addEventListener("input", () => {
  clearTimeout(notesSaveTimer);
  notesSaveTimer = setTimeout(() => {
    localStorage.setItem(STORAGE_KEY_NOTES, notesArea.value);
    flashSaved(notesStatus);
  }, CONFIG.SAVE_DEBOUNCE_MS);
});

/** Clear buttons with confirmation */
clearClipboard.addEventListener("click", () => {
  if (!clipboardArea.value) return;
  if (confirm("Clear clipboard content?")) {
    clipboardArea.value = "";
    localStorage.removeItem(STORAGE_KEY_CLIP);
    flashSaved(clipboardStatus);
    clipboardStatus.textContent = "Cleared";
  }
});

clearNotes.addEventListener("click", () => {
  if (!notesArea.value) return;
  if (confirm("Clear all notes?")) {
    notesArea.value = "";
    localStorage.removeItem(STORAGE_KEY_NOTES);
    flashSaved(notesStatus);
    notesStatus.textContent = "Cleared";
  }
});

// Load data on startup
loadSavedData();

/* ============================================================
   INIT COMPLETE — log for debug
   ============================================================ */
console.log(
  "%c⬡ DASHBOARD LOADED",
  "color:#f0a500;font-family:monospace;font-size:14px;font-weight:bold;"
);
console.log(
  "%cTip: Press / to search · F to toggle focus · T to toggle theme",
  "color:#8888a0;font-family:monospace;font-size:11px;"
);
