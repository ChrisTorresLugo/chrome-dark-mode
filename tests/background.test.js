const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createContext, runInContext } = require('node:vm');

const tabId = 42;
const tab = { id: tabId, url: 'https://example.com/' };

function loadWorker({ getTab = async () => tab, setBadgeColor = async () => {} } = {}) {
  const listeners = {};
  const badges = new Map();
  const event = (name) => ({
    addListener(listener) { listeners[name] = listener; },
  });
  const chrome = {
    action: {
      async setBadgeText({ tabId, text }) { badges.set(tabId, text); },
      setBadgeBackgroundColor: setBadgeColor,
    },
    runtime: { onInstalled: event('installed'), onMessage: event('message') },
    storage: {
      session: { async get() { return { tabStates: { [tabId]: { enabled: true } } }; } },
      sync: { async get(defaults) { return defaults; } },
    },
    tabs: {
      get: getTab,
      onRemoved: event('removed'),
      onActivated: event('activated'),
      onUpdated: event('updated'),
    },
  };
  const context = createContext({ chrome, URL, importScripts: evaluate });
  function evaluate(file) {
    runInContext(readFileSync(join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  evaluate('background.js');
  return { listeners, badges };
}

test('activation completes quietly if the tab closes before lookup', async () => {
  const { listeners } = loadWorker({
    async getTab() { throw new Error('No tab with id: 42.'); },
  });

  await assert.doesNotReject(() => listeners.activated({ tabId }));
});

test('a completed navigation can race with closing the tab during the badge update', async () => {
  const { listeners } = loadWorker({
    async setBadgeColor() { throw new Error('No tab with id: 42.'); },
  });

  await assert.doesNotReject(() => listeners.updated(tabId, { status: 'complete' }, tab));
});

test('a completed navigation still refreshes the badge for a live tab', async () => {
  const { listeners, badges } = loadWorker();

  await listeners.updated(tabId, { status: 'complete' }, tab);

  assert.equal(badges.get(tabId), 'ON');
});

test('tab event failures unrelated to closing the tab remain visible', async () => {
  const failure = new Error('Badge update failed');
  const { listeners } = loadWorker({
    async setBadgeColor() { throw failure; },
  });

  await assert.rejects(
    () => listeners.updated(tabId, { status: 'complete' }, tab),
    (error) => error === failure,
  );
});
