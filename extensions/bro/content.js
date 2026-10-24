// Bros the page at the level picked in the toolbar popup.
(function () {
  'use strict';

  const { LEVELS, DEFAULT_LEVEL, createPage } = globalThis.Bro;
  const page = createPage();

  const storage = globalThis.chrome && chrome.storage && chrome.storage.sync;
  if (!storage) {
    page.start();
    return;
  }

  storage.get({ level: DEFAULT_LEVEL }, (items) => {
    page.setLevel(items && items.level);
    page.start();
  });
  // Up or down, the open page follows the popup straight away.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.level || !LEVELS.includes(changes.level.newValue)) return;
    page.setLevel(changes.level.newValue);
    if (!page.running) page.start();
  });
})();
