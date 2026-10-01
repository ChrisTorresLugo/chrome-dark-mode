# Tab-Scoped Dark Mode and Performance Design

## Goal

Make dark mode opt-in per browser tab, reduce work on ordinary and archive pages, and improve theme coverage including PDFs where Chrome permits injection.

## Current problems

- `storage.sync.enabled` is global, so one popup toggle controls every tab.
- Each page performs a `storage.sync` read during startup and recreates its stylesheet on theme changes.
- Archive pages synchronously compute styles for large DOM walks and rescan complete descendants for every mutation.
- The extension has no explicit PDF injection path.

## Design

The background service worker owns tab state in `chrome.storage.session`, using a `tabStates` object keyed by tab ID. A tab is disabled by default. The popup asks the background worker for the active tab's state and sends tab-scoped toggle/theme commands. Tab state survives navigation in the same tab and is deleted when the tab closes. The global sync setting remains only for the selected theme and whitelist preference; the old global `enabled` setting is ignored for runtime activation.

Content scripts request their tab state from the service worker before applying a theme. They keep one stylesheet link and update its URL only when the theme changes. Runtime messages are tab-scoped by Chrome's tab message routing.

The archive handler keeps original inline declarations in a `WeakMap`, processes only elements that carry inline style or are newly inserted, and batches MutationObserver work in one microtask. It stops observing while it applies changes and restores original declarations on disable, avoiding page reloads and repeated full-subtree scans.

PDFs use a best-effort `chrome.scripting.executeScript`/`insertCSS` path from the service worker for the active tab. Unsupported viewer pages are ignored without surfacing an error to the user.

## Compatibility and failure behavior

- Existing whitelist behavior remains domain-based.
- Theme selection remains synchronized across Chrome profiles; enablement is not synchronized.
- Restricted pages and built-in PDF viewer pages may reject injection; these failures are swallowed.
- Existing archive host coverage is retained.

## Verification

Pure tab-state, style-link, and archive-batch helpers will have Node tests. The extension will also be checked with JSON parsing and a JavaScript syntax check for every runtime file.
