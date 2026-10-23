(function () {
  'use strict';

  const { DEFAULT_LEVEL } = globalThis.Bro;
  const radios = document.querySelectorAll('input[name="level"]');

  chrome.storage.sync.get({ level: DEFAULT_LEVEL }, ({ level }) => {
    for (const r of radios) r.checked = r.value === level;
  });

  for (const r of radios) {
    r.addEventListener('change', () => chrome.storage.sync.set({ level: r.value }));
  }
})();
