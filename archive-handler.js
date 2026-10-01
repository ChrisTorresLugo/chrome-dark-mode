function createPendingQueue(processNodes) {
  const pending = new Set();
  let scheduled = false;

  async function flush() {
    if (!pending.size) return;
    const nodes = [...pending];
    pending.clear();
    scheduled = false;
    processNodes(nodes);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(flush);
  }

  return {
    add(node) {
      pending.add(node);
      schedule();
    },
    flush,
  };
}

function restoreInlineStyles(originals) {
  for (const [element, properties] of originals) {
    for (const [property, original] of Object.entries(properties)) {
      if (original.value) element.style.setProperty(property, original.value, original.priority);
      else element.style.removeProperty(property);
    }
  }
}

if (typeof module !== 'undefined') {
  module.exports = { createPendingQueue, restoreInlineStyles };
}

if (typeof window !== 'undefined') {
  (() => {
    const PROCESSED_ATTR = 'data-dark-mode-ext-processed';
    const ARCHIVE_HOST = /^archive\.(ph|today|is|li|vn|fo|md)$/;
    if (!ARCHIVE_HOST.test(location.hostname)) return;

    const originals = new Map();
    let observer = null;
    let active = false;

    function remember(element, property) {
      if (!originals.has(element)) originals.set(element, {});
      const saved = originals.get(element);
      if (!saved[property]) {
        saved[property] = {
          value: element.style.getPropertyValue(property),
          priority: element.style.getPropertyPriority(property),
        };
      }
    }

    function invertColor(color) {
      const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/);
      if (!match) return null;
      const alpha = match[4] === undefined ? '1' : match[4];
      return `rgba(${255 - Number(match[1])}, ${255 - Number(match[2])}, ${255 - Number(match[3])}, ${alpha})`;
    }

    function luminance(color) {
      const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!match) return null;
      return (0.299 * Number(match[1]) + 0.587 * Number(match[2]) + 0.114 * Number(match[3])) / 255;
    }

    function setInverted(element, property, computed, predicate) {
      if (computed && predicate(luminance(computed))) {
        const inverted = invertColor(computed);
        if (inverted) {
          remember(element, property);
          element.style.setProperty(property, inverted, 'important');
          return true;
        }
      }
      return false;
    }

    function processElement(element) {
      if (element.nodeType !== 1 || element.hasAttribute(PROCESSED_ATTR)) return;
      if (/^(IMG|VIDEO|CANVAS|SVG|PICTURE)$/.test(element.tagName)) return;
      if (!element.hasAttribute('style')) return;

      const style = element.style;
      const computed = getComputedStyle(element);
      const changedBackground = setInverted(element, 'background-color', computed.backgroundColor, (value) => value > 0.6);
      const changedText = setInverted(element, 'color', computed.color, (value) => value !== null && value < 0.4);
      if (changedBackground || changedText) element.setAttribute(PROCESSED_ATTR, '1');
    }

    function processNodes(nodes) {
      for (const node of nodes) {
        processElement(node);
        node.querySelectorAll?.('[style]').forEach(processElement);
      }
    }

    function processToolbar() {
      const toolbar = document.getElementById('HEADER') || document.querySelector('#HEADER, .HEADER');
      if (!toolbar) return;
      remember(toolbar, 'background-color');
      remember(toolbar, 'color');
      toolbar.style.setProperty('background-color', '#1a1a2e', 'important');
      toolbar.style.setProperty('color', '#e0e0e0', 'important');
      toolbar.querySelectorAll('a').forEach((link) => {
        remember(link, 'color');
        link.style.setProperty('color', '#8b8bff', 'important');
      });
    }

    function disable() {
      active = false;
      observer?.disconnect();
      restoreInlineStyles(originals);
      for (const element of originals.keys()) element.removeAttribute(PROCESSED_ATTR);
      originals.clear();
    }

    async function setEnabled(enabled) {
      if (!enabled) {
        disable();
        return;
      }
      if (active) return;
      active = true;
      processToolbar();
      processNodes([document.body || document.documentElement]);
      const queue = createPendingQueue(processNodes);
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => node.nodeType === 1 && queue.add(node));
        }
      });
      observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    }

    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'setTabState') setEnabled(message.enabled);
    });

    chrome.runtime.sendMessage({ action: 'getTabState' }).then((state) => setEnabled(Boolean(state?.enabled))).catch(() => {});
  })();
}
