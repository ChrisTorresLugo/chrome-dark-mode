const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getTabState,
  setTabEnabled,
  removeTabState,
  isPdfUrl,
} = require('../state.js');

test('tabs are disabled unless explicitly enabled', () => {
  assert.deepEqual(getTabState({}, 12), { enabled: false });
  assert.deepEqual(getTabState({ 12: { enabled: true } }, 12), { enabled: true });
});

test('enabling one tab does not change another tab', () => {
  const updated = setTabEnabled({ 1: { enabled: false } }, 2, true);
  assert.deepEqual(updated, {
    1: { enabled: false },
    2: { enabled: true },
  });
});

test('removing a tab drops only its state', () => {
  assert.deepEqual(removeTabState({ 1: { enabled: true }, 2: { enabled: true } }, 1), {
    2: { enabled: true },
  });
});

test('PDF URLs are recognized without matching ordinary pages', () => {
  assert.equal(isPdfUrl('https://example.com/report.pdf'), true);
  assert.equal(isPdfUrl('https://example.com/report.pdf?download=1'), true);
  assert.equal(isPdfUrl('https://example.com/report.html'), false);
});
