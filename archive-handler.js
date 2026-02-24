(() => {
  const PROCESSED_ATTR = "data-dark-mode-ext-processed";

  function isArchivePage() {
    const host = location.hostname;
    return /^archive\.(ph|today|is|li|vn|fo|md)$/.test(host);
  }

  if (!isArchivePage()) return;

  function invertColor(color) {
    // Parse rgb/rgba strings
    const match = color.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
    );
    if (!match) return null;
    const r = 255 - parseInt(match[1]);
    const g = 255 - parseInt(match[2]);
    const b = 255 - parseInt(match[3]);
    const a = match[4] !== undefined ? match[4] : "1";
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function isLightColor(color) {
    const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return false;
    const luminance =
      (0.299 * parseInt(match[1]) + 0.587 * parseInt(match[2]) + 0.114 * parseInt(match[3])) / 255;
    return luminance > 0.6;
  }

  function isDarkColor(color) {
    const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return true;
    const luminance =
      (0.299 * parseInt(match[1]) + 0.587 * parseInt(match[2]) + 0.114 * parseInt(match[3])) / 255;
    return luminance < 0.4;
  }

  function processElement(el) {
    if (el.nodeType !== 1) return;
    if (el.hasAttribute(PROCESSED_ATTR)) return;
    if (el.tagName === "IMG" || el.tagName === "VIDEO" || el.tagName === "CANVAS") return;

    const style = el.style;
    if (!style) return;

    const bgColor = style.backgroundColor || style.background;
    const textColor = style.color;

    let modified = false;

    if (bgColor) {
      const computed = getComputedStyle(el).backgroundColor;
      if (computed && isLightColor(computed)) {
        const inverted = invertColor(computed);
        if (inverted) {
          style.setProperty("background-color", inverted, "important");
          modified = true;
        }
      }
    }

    if (textColor) {
      const computed = getComputedStyle(el).color;
      if (computed && isDarkColor(computed)) {
        const inverted = invertColor(computed);
        if (inverted) {
          style.setProperty("color", inverted, "important");
          modified = true;
        }
      }
    }

    // Handle explicit white/light backgrounds without inline style
    if (!bgColor && !modified) {
      const computed = getComputedStyle(el).backgroundColor;
      if (computed && computed !== "rgba(0, 0, 0, 0)" && isLightColor(computed)) {
        const inverted = invertColor(computed);
        if (inverted) {
          style.setProperty("background-color", inverted, "important");
          modified = true;
        }
      }
    }

    if (modified) {
      el.setAttribute(PROCESSED_ATTR, "1");
    }
  }

  function processArchiveToolbar() {
    // archive.ph has a toolbar at the top
    const toolbar = document.getElementById("HEADER") || document.querySelector("#HEADER, .HEADER");
    if (toolbar) {
      toolbar.style.setProperty("background-color", "#1a1a2e", "important");
      toolbar.style.setProperty("color", "#e0e0e0", "important");
      toolbar.querySelectorAll("a").forEach((a) => {
        a.style.setProperty("color", "#8b8bff", "important");
      });
      toolbar.setAttribute(PROCESSED_ATTR, "1");
    }
  }

  function walkDOM(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      processElement(node);
      node = walker.nextNode();
    }
  }

  async function shouldApply() {
    const data = await chrome.storage.sync.get({
      enabled: true,
      whitelist: [],
    });
    const isWhitelisted = data.whitelist.includes(location.hostname);
    return data.enabled && !isWhitelisted;
  }

  async function init() {
    if (!(await shouldApply())) return;

    processArchiveToolbar();
    walkDOM(document.body || document.documentElement);

    // Watch for dynamically inserted content
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            processElement(node);
            if (node.querySelectorAll) {
              node.querySelectorAll("*").forEach(processElement);
            }
          }
        }
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "toggle") {
      if (msg.enabled) {
        init();
      } else {
        // Remove processed markers so they can be reprocessed on re-enable
        document.querySelectorAll(`[${PROCESSED_ATTR}]`).forEach((el) => {
          el.removeAttribute(PROCESSED_ATTR);
        });
        // Reload to clear inline style overrides
        location.reload();
      }
    }
  });

  init();
})();
