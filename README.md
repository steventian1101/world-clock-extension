# World Clock — Chrome Side-Panel Extension

A multi-timezone world clock that lives in Chrome's side panel. Search any major
city or country, add it as a clock, and watch them all tick in sync.

## Features

- **Side-panel UI** — opens from the Chrome toolbar icon, stays out of the page.
- **Pin / unpin** — toggles `openPanelOnActionClick` so the panel re-opens on every
  toolbar click while pinned.
- **Dark / light theme** — persisted across launches.
- **12h / 24h format toggle** — header button.
- **Numeric clock display** — e.g. `5/13/2026 02:30:45 PM`, tabular monospace digits,
  ticks every second.
- **Global search** at the top of the panel:
  - Searches **283 cities across 108 countries** (any city or country name, partial
    matches, prefix-ranked first).
  - Selecting a result arms the `+` button; clicking `+` appends a new clock card
    pre-set to that location.
  - Keyboard: ↓/↑ to move, Enter to select, Esc to dismiss.
- **Multiple clocks** — each card has Country / City dropdowns and shows the time,
  timezone abbreviation, and GMT offset.
- **Save button** — writes all clocks + preferences to `chrome.storage.local`.
- **Custom clock icon** for the toolbar and side-panel tab.

## Install (load unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the folder `d:\Workspace\clock-extension`.
5. Click the World Clock icon in the toolbar to open the side panel.

Note: Chrome controls whether the side panel docks on the left or right of the
browser — extensions can't force a side. Right is the default on most installs.

## Usage

- Type in the search box at the top to filter the 391-entry index (108 countries +
  283 cities). Click a result, then click `+` to add it as a new clock.
- Click `+` without selecting anything to add a **Local Time** clock.
- Adjust an existing clock with its Country / City dropdowns.
- Click `×` on a card to remove it.
- Click **Save** at the bottom to persist all clocks and preferences.
- Pin button (📌) keeps the panel re-opening on toolbar click. Unpinning makes the
  panel ephemeral.

## Project layout

```
clock-extension/
├── manifest.json          # MV3 manifest
├── background.js          # service worker; manages sidePanel pin behavior
├── sidepanel.html         # panel UI shell
├── sidepanel.css          # light/dark themes via CSS variables
├── sidepanel.js           # clock state, search index, persistence, tick loop
├── timezones.js           # country → city → IANA timezone dataset
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
