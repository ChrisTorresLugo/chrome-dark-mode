# Chrome Dark Mode

A Manifest V3 Chrome extension that applies dark mode to all websites, with special handling for archive.ph pages where standard dark mode extensions fail due to heavy inline styles.

## Features

- **3 theme modes**: Dark (full inversion), Dim (softer inversion), Custom (CSS overrides)
- **Per-site whitelist**: Exclude specific domains from dark mode
- **Per-tab enablement**: Turning dark mode on affects only the current tab and follows that tab across navigation
- **archive.ph support**: Walks the DOM to override inline styles that defeat standard CSS-based dark mode
- **Toolbar badge**: Shows ON/OFF state at a glance

## Installation

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `chrome-dark-mode` directory
5. The extension icon appears in your toolbar

## How It Works

**Standard sites** — The Dark and Dim themes use CSS `filter: invert() hue-rotate()` on the `<html>` element with counter-inversion on images, videos, canvases, SVGs, and embedded media to preserve their original colors. The Custom theme applies direct CSS overrides to common elements. Enablement is stored per tab for the current browser session; theme selection and the site whitelist remain synchronized preferences.

**archive.ph** — Archive pages convert all CSS to inline `style` attributes, which breaks filter-based approaches. A dedicated content script (`archive-handler.js`) processes only styled elements, batches dynamically inserted nodes, and restores original inline declarations when disabled.

**PDFs** — The service worker attempts to inject the selected theme into PDF URLs when Chrome permits scripting access. Chrome's built-in PDF viewer can reject extension injection; those pages are left unchanged rather than interfering with PDF viewing.

## Project Structure

```
chrome-dark-mode/
├── manifest.json          # MV3 extension manifest
├── background.js          # Service worker (badge, storage init)
├── state.js               # Pure per-tab state and PDF URL helpers
├── content.js             # Main content script (all sites)
├── archive-handler.js     # archive.ph inline style handler
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic (toggle, theme, whitelist)
├── styles/
│   ├── dark-default.css   # Full inversion theme
│   ├── dark-dim.css       # Softer inversion theme
│   └── dark-custom.css    # CSS override theme
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## License

[Apache License 2.0](LICENSE)
