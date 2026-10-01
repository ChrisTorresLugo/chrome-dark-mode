const test = require('node:test');
const assert = require('node:assert/strict');
const { createPendingQueue, restoreInlineStyles } = require('../archive-handler.js');

test('pending queue deduplicates nodes before processing', async () => {
  const processed = [];
  const queue = createPendingQueue((nodes) => processed.push(...nodes));
  const node = {};
  queue.add(node);
  queue.add(node);
  await queue.flush();
  assert.deepEqual(processed, [node]);
});

test('inline style restoration removes extension overrides', () => {
  const style = {
    values: { color: 'black' },
    priorities: {},
    getPropertyValue(name) { return this.values[name] || ''; },
    getPropertyPriority(name) { return this.priorities[name] || ''; },
    setProperty(name, value, priority) { this.values[name] = value; this.priorities[name] = priority; },
    removeProperty(name) { delete this.values[name]; delete this.priorities[name]; },
  };
  const element = { style };
  const originals = new Map([[element, { 'background-color': { value: '', priority: '' } }]]);
  style.setProperty('background-color', 'rgb(0, 0, 0)', 'important');
  restoreInlineStyles(originals);
  assert.equal(style.getPropertyValue('background-color'), '');
});
