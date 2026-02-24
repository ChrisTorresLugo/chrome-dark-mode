# Chrome Dark Mode

A Manifest V3 Chrome extension that applies dark mode to all websites, with special handling for archive.ph pages where standard dark mode extensions fail due to heavy inline styles.

## Features

- **3 theme modes**: Dark (full inversion), Dim (softer inversion), Custom (CSS overrides)
- **Per-site whitelist**: Exclude specific domains from dark mode
- **Auto-enable**: Remembers your preference across sessions
- **archive.ph support**: Walks the DOM to override inline styles that defeat standard CSS-based dark mode
- **Toolbar badge**: Shows ON/OFF state at a glance

## Installation

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `chrome-dark-mode` directory
5. The extension icon appears in your toolbar

## How It Works

**Standard sites** — The Dark and Dim themes use CSS `filter: invert() hue-rotate()` on the `<html>` element with counter-inversion on images, videos, and canvases to preserve their original colors. The Custom theme applies direct CSS overrides to common elements.

**archive.ph** — Archive pages convert all CSS to inline `style` attributes, which breaks filter-based approaches. A dedicated content script (`archive-handler.js`) walks the DOM, detects light backgrounds and dark text via computed styles, inverts them, and uses a `MutationObserver` to handle dynamically loaded content.

## Project Structure

```
chrome-dark-mode/
├── manifest.json          # MV3 extension manifest
├── background.js          # Service worker (badge, storage init)
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
