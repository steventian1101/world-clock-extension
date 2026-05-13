# ScorpioN — Chrome Side-Panel World Clock

A multi-timezone world clock that lives in Chrome's side panel, with a friendly
walking-scorpion mascot. Search any major city or country, add it as a clock,
reorder cards by drag, and watch them all tick in sync.

(Internally the extension is still registered as "World Clock Side Panel" — the
ScorpioN branding lives in the UI.)

## Features

- **Side-panel UI** — opens from the Chrome toolbar icon, stays out of the page.
- **Pin / unpin** — toggles `openPanelOnActionClick` so the panel re-opens on every
  toolbar click while pinned.
- **Dark / light theme** — persisted across launches.
- **12h / 24h format toggle** — header button.
- **Per-clock display** — large `HH:MM` with optional seconds, weekday + date,
  timezone abbreviation, and GMT offset. Tabular monospace digits, ticks every
  second.
- **Time-of-day color dot** — a small dot next to each clock changes color based
  on local time (e.g. yellow for dawn/dusk, green for daytime, red for late
  night). Zones are user-editable in Settings.
- **Global search** at the top of the panel:
  - Searches **283 cities across 108 countries** (any city or country name, partial
    matches, prefix-ranked first).
  - Selecting a result arms the `+` button; clicking `+` appends a new clock card
    pre-set to that location.
  - Keyboard: ↓/↑ to move, Enter to select, Esc to dismiss.
- **Multiple clocks** — each card has Country / City dropdowns. Drag the handle on
  the left edge to reorder; click `×` to remove.
- **Settings panel** (⚙) — font family (System / Mono / Serif / Rounded), font
  size, date format (M/D/YYYY, D/M/YYYY, YYYY-MM-DD), toggles for seconds and
  timezone meta, mascot options, and custom time-of-day color zones.
- **Walking scorpion mascot** in the footer with **12 models** (Classic, Cute,
  Royal, Ninja, Battle, Slim, Coiled, Sharp, Outline, Pixel, Top View, Pup) and
  **12 colors**. Optional greeting bubbles tied to local time.
- **Save button** — writes all clocks + preferences to `chrome.storage.local`.
- **Custom clock icon** for the toolbar and side-panel tab.

## Install (load unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the folder [d:\Workspace\clock-extension](.).
5. Click the ScorpioN icon in the toolbar to open the side panel.

Note: Chrome controls whether the side panel docks on the left or right of the
browser — extensions can't force a side. Right is the default on most installs.

## Usage

- Type in the search box at the top to filter the 391-entry index (108 countries +
  283 cities). Click a result, then click `+` to add it as a new clock.
- Click `+` without selecting anything to add a **Local Time** clock.
- Adjust an existing clock with its Country / City dropdowns.
- Drag the handle (⤢) on a card's left edge to reorder clocks.
- Click `×` on a card to remove it.
- Click **Save** (header) to persist all clocks and preferences.
- Pin button (📌) keeps the panel re-opening on toolbar click. Unpinning makes the
  panel ephemeral.
- Open **Settings** (⚙) to change typography, date format, mascot model/color, or
  the time-of-day dot color zones.

## Project layout

```
clock-extension/
├── manifest.json          # MV3 manifest
├── background.js          # service worker; manages sidePanel pin behavior
├── sidepanel.html         # panel UI shell (header, list, footer mascot, settings)
├── sidepanel.css          # light/dark themes via CSS variables
├── sidepanel.js           # clock state, search, settings, mascot, persistence, tick loop
├── timezones.js           # country → city → IANA timezone dataset
├── scorpions.js           # scorpion mascot SVG models + color palette
└── icons/                 # extension icons (16/32/48/128) + generator script
    ├── icon16.png, icon32.png, icon48.png, icon128.png
    └── make-icons.ps1     # regenerate icon set any time
```

This project is fully self-contained. The companion Windows desktop app lives at
`d:\Workspace\clock-desktop\` and is built/distributed independently — there is no
shared code or shared build between the two.

## Adding more cities

Open [timezones.js](timezones.js) and append entries under the appropriate country,
or add a new country block:

```js
"Country Name": {
  "City Name": "IANA/Timezone_Id"
}
```

Reload the unpacked extension in `chrome://extensions` to pick up changes.

## Adding more scorpion models

Open [scorpions.js](scorpions.js) and append a new entry to `SCORPION_MODELS`:

```js
M("my-id", "My Name", `<g fill="currentColor"> ...svg paths... </g>`)
```

Use `currentColor` for fills you want recolored by the **Scorpion color** picker.
Add `class="leg leg-a"` (b/c/d) to leg `<rect>`s so the walk animation drives them.
Reload the extension to see the new model in Settings.
