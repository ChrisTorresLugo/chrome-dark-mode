# Tab-Scoped Performance and PDF Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scope dark mode to individual tabs, reduce DOM work, and add best-effort PDF support.

**Architecture:** The MV3 service worker owns session-persistent tab state and mediates popup/content-script commands. Content scripts apply one stable stylesheet per page; archive handling is batched and incremental.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript, CSS, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-09-14-tab-scoped-performance-design.md`

## Global Constraints

- Enablement is tab-local and defaults to disabled.
- Theme and whitelist preferences remain in `chrome.storage.sync`.
- Restricted pages and unsupported PDF viewers fail quietly.
- Use no runtime dependencies.

---

### Task 1: Add tested tab-state and injection helpers

**Files:**
- Create: `state.js`
- Create: `tests/state.test.js`

- [ ] **Step 1: Write failing tests** for default disabled state, per-tab updates, tab removal, and PDF URL detection.
- [ ] **Step 2: Run `node --test tests/state.test.js` and verify it fails because helpers do not exist.**
- [ ] **Step 3: Implement pure helpers in `state.js`.**
- [ ] **Step 4: Run the focused test and verify it passes.**

### Task 2: Move runtime ownership to the service worker

**Files:**
- Modify: `background.js`
- Modify: `popup.js`
- Modify: `popup.html`

- [ ] **Step 1: Add tests for the message/state contract using the pure helpers.**
- [ ] **Step 2: Run the tests and observe the contract test fail.**
- [ ] **Step 3: Implement session-backed `getTabState`, `setTabEnabled`, `setTheme`, `removeTabState`, active-tab badge updates, and best-effort PDF injection.**
- [ ] **Step 4: Update the popup to query and mutate only the active tab; remove the global enable and auto-enable writes.**
- [ ] **Step 5: Run focused tests and syntax checks.**

### Task 3: Make normal page application cheap and state-aware

**Files:**
- Modify: `content.js`
- Modify: `styles/dark-default.css`
- Modify: `styles/dark-dim.css`
- Modify: `styles/dark-custom.css`

- [ ] **Step 1: Add failing tests for stable stylesheet reuse and disabled cleanup.**
- [ ] **Step 2: Implement a state request, one link element, and clean enable/disable transitions.**
- [ ] **Step 3: Improve selectors for form controls, media, SVG, and embedded content without adding per-node JavaScript work.**
- [ ] **Step 4: Run tests and syntax checks.**

### Task 4: Batch archive processing and restore inline styles

**Files:**
- Modify: `archive-handler.js`
- Create: `tests/archive-handler.test.js`

- [ ] **Step 1: Write failing tests for deduplicated pending elements and original-style restoration.**
- [ ] **Step 2: Run the focused tests and verify they fail.**
- [ ] **Step 3: Implement an incremental queue, a `WeakMap` of original declarations, and enable/disable handling without reload.**
- [ ] **Step 4: Run focused tests, then all tests.**

### Task 5: Verify the packaged extension surface

**Files:**
- Modify: `manifest.json`
- Modify: `README.md`

- [ ] **Step 1: Update permissions/host behavior only as required by the implemented PDF path.**
- [ ] **Step 2: Document per-tab enablement and PDF limitations.**
- [ ] **Step 3: Run `node --test`, JSON parsing, and `node --check` for all JavaScript files.**
