const STORAGE = {
  clocks: "wc_clocks",
  theme: "wc_theme",
  pinned: "wc_pinned",
  hour12: "wc_hour12"
};

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const state = {
  clocks: [],
  theme: "light",
  pinned: true,
  hour12: true,
  dirty: false
};

const $list = document.getElementById("clockList");
const $addBtn = document.getElementById("addBtn");
const $saveBtn = document.getElementById("saveBtn");
const $themeBtn = document.getElementById("themeBtn");
const $themeIcon = document.getElementById("themeIcon");
const $pinBtn = document.getElementById("pinBtn");
const $hourBtn = document.getElementById("hourFormatBtn");
const $hourLabel = document.getElementById("hourFormatLabel");
const $status = document.getElementById("statusText");
const $tpl = document.getElementById("clockTemplate");
const $search = document.getElementById("globalSearch");
const $searchClear = document.getElementById("globalSearchClear");
const $searchResults = document.getElementById("globalSearchResults");

let pendingSelection = null;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function newClock(overrides = {}) {
  return {
    id: uid(),
    country: "",
    city: "",
    ...overrides
  };
}

function resolveTimezone(clock) {
  if (!clock.country || clock.country === "Local") return LOCAL_TZ;
  const cities = window.TIMEZONES[clock.country];
  if (!cities) return LOCAL_TZ;
  if (clock.city && cities[clock.city]) return cities[clock.city];
  const first = Object.values(cities)[0];
  return first || LOCAL_TZ;
}

const dateFmtCache = new Map();
function getFormatter(tz, hour12) {
  const key = `${tz}|${hour12}`;
  if (!dateFmtCache.has(key)) {
    dateFmtCache.set(
      key,
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12
      })
    );
  }
  return dateFmtCache.get(key);
}

function formatDateTime(date, tz, hour12) {
  // Produces "5/12/2026 02:30:45 PM" (no comma).
  return getFormatter(tz, hour12).format(date).replace(",", "");
}

function getTzMeta(tz) {
  const now = new Date();
  let abbr = "";
  let offset = "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short"
    }).formatToParts(now);
    abbr = parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch (_) {}
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset"
    }).formatToParts(now);
    offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch (_) {}
  return { abbr, offset };
}

let SEARCH_INDEX = null;
function buildSearchIndex() {
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const out = [];
  for (const country of Object.keys(window.TIMEZONES)) {
    out.push({
      country,
      city: "",
      label: country,
      sub: "Country",
      hay: country.toLowerCase()
    });
    for (const city of Object.keys(window.TIMEZONES[country])) {
      out.push({
        country,
        city,
        label: city,
        sub: country,
        hay: (city + " " + country).toLowerCase()
      });
    }
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  SEARCH_INDEX = out;
  return out;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let out = "";
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      out += escapeHtml(text.slice(i));
      break;
    }
    out += escapeHtml(text.slice(i, idx));
    out += "<mark>" + escapeHtml(text.slice(idx, idx + q.length)) + "</mark>";
    i = idx + q.length;
  }
  return out;
}

function searchEntries(query, limit = 20) {
  const idx = buildSearchIndex();
  const q = query.trim().toLowerCase();
  if (!q) return idx.slice(0, limit);
  const starts = [];
  const contains = [];
  for (const entry of idx) {
    const pos = entry.hay.indexOf(q);
    if (pos === -1) continue;
    if (pos === 0 || entry.hay[pos - 1] === " ") starts.push(entry);
    else contains.push(entry);
    if (starts.length + contains.length > limit * 3) break;
  }
  return starts.concat(contains).slice(0, limit);
}

function populateCountrySelect(select, currentCountry) {
  select.innerHTML = "";
  const opts = [["Local", "Local Time"]];
  Object.keys(window.TIMEZONES)
    .sort((a, b) => a.localeCompare(b))
    .forEach((c) => opts.push([c, c]));
  for (const [val, label] of opts) {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = label;
    if (val === (currentCountry || "Local")) o.selected = true;
    select.appendChild(o);
  }
}

function populateCitySelect(select, country, currentCity) {
  select.innerHTML = "";
  if (!country || country === "Local") {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = "— System —";
    select.appendChild(o);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  const cities = window.TIMEZONES[country] || {};
  const names = Object.keys(cities).sort((a, b) => a.localeCompare(b));
  names.forEach((city) => {
    const o = document.createElement("option");
    o.value = city;
    o.textContent = city;
    if (city === currentCity) o.selected = true;
    select.appendChild(o);
  });
  if (!names.includes(currentCity) && names.length) {
    select.value = names[0];
  }
}

function renderClock(clock) {
  const node = $tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = clock.id;

  const countrySel = node.querySelector(".country-select");
  const citySel = node.querySelector(".city-select");
  const removeBtn = node.querySelector(".remove-btn");

  populateCountrySelect(countrySel, clock.country || "Local");
  populateCitySelect(citySel, clock.country || "Local", clock.city || "");

  countrySel.addEventListener("change", () => {
    clock.country = countrySel.value === "Local" ? "" : countrySel.value;
    clock.city = "";
    populateCitySelect(citySel, countrySel.value, "");
    if (citySel.value) clock.city = citySel.value;
    tickClock(node, clock);
    markDirty();
  });

  citySel.addEventListener("change", () => {
    clock.city = citySel.value;
    tickClock(node, clock);
    markDirty();
  });

  removeBtn.addEventListener("click", () => {
    state.clocks = state.clocks.filter((c) => c.id !== clock.id);
    node.remove();
    markDirty();
  });

  $list.appendChild(node);
  tickClock(node, clock);
}

function tickClock(node, clock) {
  const tz = resolveTimezone(clock);
  const now = new Date();
  node.querySelector(".datetime").textContent = formatDateTime(now, tz, state.hour12);
  const { abbr, offset } = getTzMeta(tz);
  const tzName = clock.country && clock.country !== "Local"
    ? `${clock.city || ""}${clock.city ? ", " : ""}${clock.country} · ${abbr || tz}`
    : `Local · ${abbr || tz}`;
  node.querySelector(".tz-name").textContent = tzName;
  node.querySelector(".tz-offset").textContent = offset;
}

function tickAll() {
  const cards = $list.querySelectorAll(".clock-card");
  cards.forEach((node) => {
    const id = node.dataset.id;
    const clock = state.clocks.find((c) => c.id === id);
    if (clock) tickClock(node, clock);
  });
}

function render() {
  $list.innerHTML = "";
  state.clocks.forEach(renderClock);
}

function addClock() {
  const sel = pendingSelection;
  const clock = newClock(
    sel ? { country: sel.country, city: sel.city } : {}
  );
  state.clocks.push(clock);
  renderClock(clock);
  clearPendingSelection();
  // Scroll new card into view.
  const node = $list.querySelector(`[data-id="${clock.id}"]`);
  if (node) node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  markDirty();
}

function setPendingSelection(entry) {
  pendingSelection = { country: entry.country, city: entry.city };
  $search.value = entry.city
    ? `${entry.city}, ${entry.country}`
    : entry.country;
  $searchClear.hidden = false;
  $addBtn.classList.add("armed");
  $addBtn.title = `Add ${entry.city ? entry.city + ", " : ""}${entry.country}`;
}

function clearPendingSelection() {
  pendingSelection = null;
  $search.value = "";
  $searchClear.hidden = true;
  $addBtn.classList.remove("armed");
  $addBtn.title = "Add selected as new clock";
  hideSearchResults();
}

let searchActiveIdx = -1;
let searchEntriesCurrent = [];

function renderSearchResults(query) {
  searchEntriesCurrent = searchEntries(query, 30);
  searchActiveIdx = -1;
  if (!searchEntriesCurrent.length) {
    $searchResults.innerHTML = '<li class="empty">No matches</li>';
    $searchResults.hidden = false;
    return;
  }
  const q = query.trim();
  $searchResults.innerHTML = searchEntriesCurrent
    .map((e, i) => {
      const main = highlight(e.label, q);
      const sub = highlight(e.sub, q);
      return `<li role="option" data-i="${i}"><span class="sr-main">${main}</span><span class="sr-country">${sub}</span></li>`;
    })
    .join("");
  $searchResults.hidden = false;
}

function hideSearchResults() {
  $searchResults.hidden = true;
  searchActiveIdx = -1;
}

function setSearchActive(i) {
  const items = $searchResults.querySelectorAll("li[data-i]");
  items.forEach((el) => el.classList.remove("active"));
  if (i >= 0 && i < items.length) {
    items[i].classList.add("active");
    items[i].scrollIntoView({ block: "nearest" });
    searchActiveIdx = i;
  } else {
    searchActiveIdx = -1;
  }
}

function initGlobalSearch() {
  $search.addEventListener("input", () => {
    // Any typing invalidates a previously committed selection.
    if (pendingSelection) {
      pendingSelection = null;
      $addBtn.classList.remove("armed");
      $addBtn.title = "Add selected as new clock";
    }
    const v = $search.value;
    $searchClear.hidden = !v;
    renderSearchResults(v);
  });

  $search.addEventListener("focus", () => {
    if (!pendingSelection) renderSearchResults($search.value);
  });

  $search.addEventListener("blur", () => {
    setTimeout(hideSearchResults, 120);
  });

  $search.addEventListener("keydown", (e) => {
    if ($searchResults.hidden) {
      if (e.key === "Enter" && pendingSelection) {
        e.preventDefault();
        addClock();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchActive(Math.min(searchActiveIdx + 1, searchEntriesCurrent.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchActive(Math.max(searchActiveIdx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = searchActiveIdx >= 0 ? searchActiveIdx : 0;
      const entry = searchEntriesCurrent[idx];
      if (entry) {
        setPendingSelection(entry);
        hideSearchResults();
      }
    } else if (e.key === "Escape") {
      hideSearchResults();
      $search.blur();
    }
  });

  $searchResults.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li) return;
    e.preventDefault();
    const i = Number(li.dataset.i);
    const entry = searchEntriesCurrent[i];
    if (entry) {
      setPendingSelection(entry);
      hideSearchResults();
    }
  });

  $searchClear.addEventListener("click", () => {
    clearPendingSelection();
    $search.focus();
  });
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  $themeIcon.innerHTML = theme === "dark" ? "&#9728;" : "&#9789;";
  $themeBtn.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

function applyPinned(pinned) {
  state.pinned = pinned;
  $pinBtn.classList.toggle("pinned", pinned);
  $pinBtn.title = pinned ? "Unpin side panel" : "Pin side panel";
}

function applyHour12(hour12) {
  state.hour12 = hour12;
  $hourLabel.textContent = hour12 ? "12h" : "24h";
  dateFmtCache.clear();
  tickAll();
}

function markDirty() {
  state.dirty = true;
  $status.textContent = "Unsaved changes";
  $status.classList.add("dirty");
}

function clearDirty() {
  state.dirty = false;
  $status.textContent = "Saved";
  $status.classList.remove("dirty");
  setTimeout(() => {
    if (!state.dirty) $status.textContent = "";
  }, 2000);
}

async function loadState() {
  const data = await chrome.storage.local.get([
    STORAGE.clocks,
    STORAGE.theme,
    STORAGE.pinned,
    STORAGE.hour12
  ]);

  applyTheme(data[STORAGE.theme] === "dark" ? "dark" : "light");
  applyPinned(data[STORAGE.pinned] !== false);
  applyHour12(data[STORAGE.hour12] !== false);

  const saved = Array.isArray(data[STORAGE.clocks]) ? data[STORAGE.clocks] : null;
  if (saved && saved.length) {
    state.clocks = saved.map((c) => ({
      id: c.id || uid(),
      country: c.country || "",
      city: c.city || ""
    }));
  } else {
    state.clocks = [newClock()];
  }
  render();
  $status.textContent = "";
}

async function saveState() {
  await chrome.storage.local.set({
    [STORAGE.clocks]: state.clocks.map((c) => ({
      id: c.id,
      country: c.country,
      city: c.city
    })),
    [STORAGE.theme]: state.theme,
    [STORAGE.pinned]: state.pinned,
    [STORAGE.hour12]: state.hour12
  });
  clearDirty();
}

$addBtn.addEventListener("click", addClock);
$saveBtn.addEventListener("click", saveState);

$themeBtn.addEventListener("click", async () => {
  const next = state.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  await chrome.storage.local.set({ [STORAGE.theme]: next });
});

$pinBtn.addEventListener("click", async () => {
  const next = !state.pinned;
  applyPinned(next);
  await chrome.storage.local.set({ [STORAGE.pinned]: next });
});

$hourBtn.addEventListener("click", async () => {
  const next = !state.hour12;
  applyHour12(next);
  await chrome.storage.local.set({ [STORAGE.hour12]: next });
});

window.addEventListener("beforeunload", () => {
  // Best-effort warning indicator only; storage save is explicit via button.
});

initGlobalSearch();

loadState().then(() => {
  tickAll();
  setInterval(tickAll, 1000);
});
