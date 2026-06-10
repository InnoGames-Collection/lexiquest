/* LexiQuest core: routing, registry, storage, shared UI. */
(function () {
  "use strict";

  const games = [];
  const byId = {};

  // ---------- utilities ----------
  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v);
      }
    }
    for (const c of children.flat()) {
      if (c == null) continue;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dayNumber() {
    return Math.floor(Date.now() / 86400000);
  }

  function shuffled(arr, rnd) {
    const a = arr.slice();
    const r = rnd || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr, rnd) {
    return arr[Math.floor((rnd || Math.random)() * arr.length)];
  }

  // ---------- storage / stats ----------
  const KEY = "lexiquest.v1";
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveStore(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ }
  }
  function getStats(gameId) {
    const s = loadStore();
    return s.stats && s.stats[gameId] || { played: 0, won: 0, best: 0, streak: 0 };
  }
  function recordResult(gameId, { won, score }) {
    const s = loadStore();
    s.stats = s.stats || {};
    const st = s.stats[gameId] || { played: 0, won: 0, best: 0, streak: 0 };
    st.played++;
    if (won) { st.won++; st.streak++; } else { st.streak = 0; }
    if (typeof score === "number" && score > st.best) st.best = score;
    s.stats[gameId] = st;
    saveStore(s);
  }

  // ---------- toast / modal ----------
  let toastTimer = null;
  function toast(msg, ms) {
    let t = document.getElementById("toast");
    if (!t) { t = el("div", { id: "toast" }); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), ms || 1800);
  }

  function modal({ title, body, actions }) {
    const back = el("div", { class: "modal-back" });
    const close = () => back.remove();
    const actionBtns = (actions || [{ label: "OK", primary: true }]).map((a) =>
      el("button", {
        class: "btn" + (a.primary ? " primary" : ""),
        text: a.label,
        onclick: () => { close(); if (a.onClick) a.onClick(); },
      })
    );
    const m = el("div", { class: "modal" },
      el("h3", { text: title }),
      el("div", { class: "body" }),
      el("div", { class: "actions" }, actionBtns)
    );
    const bodyEl = m.querySelector(".body");
    if (typeof body === "string") bodyEl.innerHTML = body;
    else if (body) bodyEl.appendChild(body);
    back.addEventListener("click", (e) => { if (e.target === back) close(); });
    back.appendChild(m);
    document.body.appendChild(back);
    return { close };
  }

  function statsRow(pairs) {
    return el("div", { class: "stats-row" },
      pairs.map(([num, lbl]) =>
        el("div", { class: "stat" },
          el("div", { class: "num", text: String(num) }),
          el("div", { class: "lbl", text: lbl }))
      )
    );
  }

  // ---------- on-screen keyboard ----------
  const KBD_ROWS = ["qwertyuiop", "asdfghjkl", "+zxcvbnm-"]; // + = enter, - = backspace
  function keyboard(onKey) {
    const keyEls = {};
    const wrap = el("div", { class: "kbd" },
      KBD_ROWS.map((row) =>
        el("div", { class: "kbd-row" },
          row.split("").map((ch) => {
            const isEnter = ch === "+", isBack = ch === "-";
            const label = isEnter ? "enter" : isBack ? "⌫" : ch;
            const key = isEnter ? "Enter" : isBack ? "Backspace" : ch;
            const btn = el("button", {
              class: "key" + (isEnter || isBack ? " wide" : ""),
              text: label,
              onclick: () => onKey(key),
            });
            if (!isEnter && !isBack) keyEls[ch] = btn;
            return btn;
          })
        )
      )
    );
    return {
      element: wrap,
      // state: 'good' | 'near' | 'bad' — never downgrade good
      setState(letter, state) {
        const b = keyEls[letter];
        if (!b) return;
        const rank = { bad: 1, near: 2, good: 3 };
        const cur = b.dataset.state;
        if (cur && rank[cur] >= rank[state]) return;
        b.dataset.state = state;
        b.classList.remove("good", "near", "bad");
        b.classList.add(state);
      },
      reset() {
        Object.values(keyEls).forEach((b) => {
          delete b.dataset.state;
          b.classList.remove("good", "near", "bad");
        });
      },
    };
  }

  // ---------- hidden input: summons the phone's native keyboard ----------
  // Mobile soft keyboards only open when a real text field is focused, and many
  // (e.g. GBoard) report key "Unidentified" on keydown — so letters are read by
  // diffing the input's value against a sentinel instead of from key events.
  const SENTINEL = " ";
  function typeCatcher(onKey, tapTarget) {
    const input = el("input", {
      class: "type-catcher",
      type: "text",
      autocapitalize: "none",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: "false",
      "aria-hidden": "true",
      tabindex: "-1",
      enterkeyhint: "go",
    });
    function reset() {
      input.value = SENTINEL;
      try { input.setSelectionRange(SENTINEL.length, SENTINEL.length); } catch (e) { /* unsupported */ }
    }
    input.addEventListener("focus", reset);
    input.addEventListener("input", () => {
      const v = input.value;
      if (v.length < SENTINEL.length) onKey("Backspace");
      else for (const ch of v.slice(SENTINEL.length)) {
        if (/^[a-z]$/i.test(ch)) onKey(ch.toLowerCase());
      }
      reset();
    });
    input.addEventListener("keydown", (e) => {
      // while the catcher is focused it owns all keys; without this, physical
      // keystrokes would also reach the games' document-level handlers
      e.stopPropagation();
      if (e.key === "Enter") { e.preventDefault(); onKey("Enter"); }
    });
    input.addEventListener("beforeinput", (e) => {
      if (e.inputType === "insertLineBreak") { e.preventDefault(); onKey("Enter"); }
    });
    if (getComputedStyle(tapTarget).position === "static") tapTarget.style.position = "relative";
    tapTarget.appendChild(input);
    tapTarget.addEventListener("click", () => input.focus({ preventScroll: true }));
    return input;
  }

  // ---------- registry & router ----------
  let activeCleanup = null;

  function register(def) {
    games.push(def);
    byId[def.id] = def;
  }

  function renderHub(app) {
    app.appendChild(el("div", { class: "hub-intro" },
      el("h1", { text: "LexiQuest Word Games" }),
      el("p", { text: "Ten free word games by InnoSphere Technologies. New challenges every day. No account, no ads." })
    ));
    const grid = el("div", { class: "hub-grid" });
    for (const g of games) {
      const st = getStats(g.id);
      const meta = st.played
        ? `Played ${st.played} · Won ${st.won}` + (st.best ? ` · Best ${st.best}` : "")
        : "Not played yet";
      const card = el("div", { class: "game-card", onclick: () => { location.hash = "#/g/" + g.id; } },
        el("div", { class: "icon", text: g.icon }),
        el("h3", { text: g.title }),
        el("p", { text: g.tagline }),
        el("div", { class: "meta", text: meta }),
        el("button", { class: "play", text: "Play" })
      );
      grid.appendChild(card);
    }
    app.appendChild(grid);
  }

  function renderGame(app, g) {
    app.appendChild(el("div", { class: "game-head" },
      el("h2", { text: g.icon + "  " + g.title }),
      el("p", { class: "tagline", text: g.tagline })
    ));
    const mount = el("div");
    app.appendChild(mount);
    activeCleanup = g.render(mount, api) || null;
  }

  function route() {
    if (typeof activeCleanup === "function") { activeCleanup(); }
    activeCleanup = null;
    const app = document.getElementById("app");
    app.innerHTML = "";
    const m = location.hash.match(/^#\/g\/([\w-]+)/);
    const g = m && byId[m[1]];
    const back = document.getElementById("backBtn");
    if (g) { back.style.visibility = "visible"; renderGame(app, g); }
    else { back.style.visibility = "hidden"; renderHub(app); }
    window.scrollTo(0, 0);
  }

  // ---------- theme ----------
  function initTheme() {
    const s = loadStore();
    const pref = s.theme ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = pref;
  }
  function toggleTheme() {
    const cur = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = cur;
    const s = loadStore(); s.theme = cur; saveStore(s);
  }

  // ---------- public API ----------
  const api = {
    el, toast, modal, keyboard, typeCatcher, statsRow,
    mulberry32, dayNumber, shuffled, pick,
    getStats, recordResult,
    register,
  };
  window.LQ = api;

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    document.getElementById("themeBtn").addEventListener("click", toggleTheme);
    document.getElementById("backBtn").addEventListener("click", () => { location.hash = "#/"; });
    document.querySelector(".brand").addEventListener("click", () => { location.hash = "#/"; });
    window.addEventListener("hashchange", route);
    route();
  });
})();
