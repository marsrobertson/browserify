// The drop-in for sites with no build step:
//   <script src=".../browser.js" data-toggle data-level="ultra"></script>
// Bros the page, and with data-toggle adds an on/off switch in the top right.
// Also exposes window.BroMode: on(), off(), toggle(), setLevel(level).
(function () {
  'use strict';

  const { LEVELS, DEFAULT_LEVEL, createPage } = globalThis.Bro;

  // Only readable now, while the script tag is running.
  const data = (document.currentScript && document.currentScript.dataset) || {};
  const wantsToggle = data.toggle !== undefined && data.toggle !== 'false';
  const page = createPage(LEVELS.includes(data.level) ? data.level : DEFAULT_LEVEL);

  // The visitor's last choice, if their browser lets us keep it.
  const KEY = 'bro-mode';
  function remembered() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function remember(on) {
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* private mode */ }
  }

  let button = null;

  function set(on) {
    if (on) page.start();
    else page.stop();
    if (button) button.setAttribute('aria-checked', String(page.running));
  }

  const TOGGLE_CSS = `
    :host { all: initial; }
    button {
      --bg: #ffffff; --fg: #1a1a1a; --border: #d0d0d0; --track: #c4c4c4; --on: #1f7a4d;
      display: flex; align-items: center; gap: 8px; margin: 0;
      padding: 6px 12px 6px 8px; border: 1px solid var(--border); border-radius: 999px;
      background: var(--bg); color: var(--fg); cursor: pointer;
      font: 600 13px/1 system-ui, -apple-system, sans-serif;
      box-shadow: 0 1px 4px rgb(0 0 0 / 0.15);
    }
    @media (prefers-color-scheme: dark) {
      button { --bg: #222222; --fg: #f0f0f0; --border: #444444; --track: #555555; --on: #3fbf7f; }
    }
    button:focus-visible { outline: 2px solid var(--on); outline-offset: 2px; }
    .track {
      position: relative; width: 30px; height: 18px; border-radius: 999px;
      background: var(--track); transition: background 0.15s;
    }
    .thumb {
      position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
      border-radius: 50%; background: #ffffff; transition: transform 0.15s;
    }
    [aria-checked="true"] .track { background: var(--on); }
    [aria-checked="true"] .thumb { transform: translateX(12px); }
    @media (prefers-reduced-motion: reduce) { .track, .thumb { transition: none; } }
  `;

  function addToggle() {
    const host = document.createElement('bro-mode-toggle');
    // Inline !important so the page's own CSS can't move it.
    host.style.cssText =
      'position:fixed!important;top:12px!important;right:12px!important;' +
      'z-index:2147483647!important;display:block!important;';
    // A shadow root keeps the page's CSS out, and keeps the bros off the label.
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      `<style>${TOGGLE_CSS}</style>` +
      '<button type="button" role="switch" aria-label="Bro mode" title="Bro mode">' +
      '<span class="track"><span class="thumb"></span></span>bro</button>';
    button = shadow.querySelector('button');
    button.setAttribute('aria-checked', String(page.running));
    button.addEventListener('click', () => {
      set(!page.running);
      remember(page.running);
    });
    document.body.append(host);
  }

  function init() {
    // The Unbro extension is running here: no bros, so no switch either.
    if (document.documentElement.hasAttribute('data-unbro')) return;
    set(remembered() !== 'off');
    if (wantsToggle) addToggle();
  }

  globalThis.BroMode = {
    on() { set(true); remember(true); },
    off() { set(false); remember(false); },
    toggle() { this[page.running ? 'off' : 'on'](); },
    setLevel(level) { page.setLevel(level); },
    get level() { return page.level; },
    get isOn() { return page.running; },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
