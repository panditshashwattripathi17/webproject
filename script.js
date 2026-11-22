/* ============ MindMetrics — script.js ============
   Shared by every page. Each feature only runs if its elements exist.
   NOTE: login + data are stored in this browser's localStorage (front-end
   demo only). It is NOT real security; a real site needs a backend.
================================================== */

var PAGE = window.location.pathname.split("/").pop() || "index.html";

/* ---------- Small helpers ---------- */
function $(id) { return document.getElementById(id); }
function pad(n) { return String(n).padStart(2, "0"); }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function loadJSON(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked */ }
}

/* ---------- Date helpers ---------- */
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayKey(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function parseKey(k) { var p = k.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function startOfWeek(d) { return addDays(d, -((d.getDay() + 6) % 7)); } // Monday start
function shortDate(d) { return MONTHS[d.getMonth()] + " " + d.getDate(); }

/* ============================================================
   AUTH (front-end demo)
   ============================================================ */
var SESSION_KEY = "mm_session";
function getSession() { return loadJSON(SESSION_KEY, null); }

var LOGGED_IN = !!getSession();
if (PAGE !== "login.html" && !LOGGED_IN) {
  window.location.replace("login.html");
}

/* Every user gets their own data, keyed by email */
function userKey(name) {
  var s = getSession();
  return "mm_u_" + (s ? s.email : "guest") + "_" + name;
}

function hashPassword(pw, salt) {
  var text = salt + ":" + pw;
  if (window.crypto && window.crypto.subtle && window.TextEncoder) {
    return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return b.toString(16).padStart(2, "0");
      }).join("");
    });
  }
  var h = 5381;
  for (var i = 0; i < text.length; i++) { h = ((h << 5) + h + text.charCodeAt(i)) | 0; }
  return Promise.resolve("x" + (h >>> 0).toString(16));
}

function initials(name) {
  var parts = name.trim().split(/\s+/);
  var s = parts[0].charAt(0) + (parts.length > 1 ? parts[parts.length - 1].charAt(0) : "");
  return s.toUpperCase();
}

function logout() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  window.location.replace("login.html");
}

function renderUserArea() {
  var area = $("user-area");
  var s = getSession();
  if (!area || !s) return;
  area.innerHTML = "";

  var av = document.createElement("div");
  av.className = "avatar";
  av.textContent = initials(s.name);
  av.title = s.name + " (" + s.email + ")";

  var nm = document.createElement("span");
  nm.className = "user-name";
  nm.textContent = s.name.split(" ")[0];

  var out = document.createElement("button");
  out.type = "button";
  out.className = "btn small secondary";
  out.textContent = "Log out";
  out.addEventListener("click", logout);

  area.appendChild(av);
  area.appendChild(nm);
  area.appendChild(out);
}

function initLogin() {
  var loginForm = $("login-form");
  if (!loginForm) return;
  if (getSession()) { window.location.replace("index.html"); return; }

  var signupForm = $("signup-form");
  var errBox = $("auth-error");

  function showError(msg) {
    errBox.textContent = msg;
    errBox.hidden = !msg;
  }
  document.querySelectorAll(".tab-btn").forEach(function (b) {
    b.addEventListener("click", function () { showError(""); });
  });

  loginForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    showError("");
    var email = $("login-email").value.trim().toLowerCase();
    var pw = $("login-password").value;
    var users = loadJSON("mm_users", {});
    var u = users[email];
    if (!u) { showError("No account found for that email. Please sign up first."); return; }
    hashPassword(pw, u.salt).then(function (h) {
      if (h !== u.hash) { showError("Incorrect password. Please try again."); return; }
      try { localStorage.removeItem("mm_new_user"); } catch (e) { /* ignore */ }
      saveJSON(SESSION_KEY, { email: email, name: u.name });
      window.location.replace("index.html");
    });
  });

  signupForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    showError("");
    var name = $("signup-name").value.trim();
    var email = $("signup-email").value.trim().toLowerCase();
    var pw = $("signup-password").value;
    var pw2 = $("signup-confirm").value;
    var users = loadJSON("mm_users", {});

    if (name.length < 2) { showError("Please enter your name."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError("Please enter a valid email address."); return; }
    if (pw.length < 6) { showError("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { showError("Passwords do not match."); return; }
    if (users[email]) { showError("An account with this email already exists. Try logging in."); return; }

    var salt = uid();
    hashPassword(pw, salt).then(function (h) {
      users[email] = { name: name, salt: salt, hash: h };
      saveJSON("mm_users", users);
      saveJSON("mm_new_user", email); // so the dashboard says "Welcome", not "Welcome back"
      saveJSON(SESSION_KEY, { email: email, name: name });
      window.location.replace("index.html");
    });
  });
}

/* ============================================================
   NAVIGATION + TABS
   ============================================================ */
function highlightNav() {
  document.querySelectorAll("nav a").forEach(function (link) {
    if (link.getAttribute("href") === PAGE) link.classList.add("active");
  });
}

function initTabs() {
  document.querySelectorAll(".tabs").forEach(function (group) {
    var btns = group.querySelectorAll(".tab-btn");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) {
          var on = x === b;
          x.classList.toggle("active", on);
          x.setAttribute("aria-selected", on ? "true" : "false");
          var panel = $("panel-" + x.dataset.tab);
          if (panel) panel.hidden = !on;
        });
      });
    });
  });
}

/* ============================================================
   STRESS SCORE ENGINE (used by check-in + dashboard)
   ============================================================ */
var MOOD_LABEL = { calm: "Calm 😌", moderate: "Moderate 😐", overwhelmed: "Overwhelmed 😣" };
var CAT_LABEL = { calm: "Low stress", moderate: "Moderate stress", overwhelmed: "High stress" };
var CAT_HINT = {
  calm: "You're doing well. Keep your routine going.",
  moderate: "Try a focus session and take real breaks.",
  overwhelmed: "Slow down. Talk to a friend, mentor or campus counsellor."
};

function categoryOf(score) { return score < 34 ? "calm" : (score < 67 ? "moderate" : "overwhelmed"); }

/* Score is 0 (very relaxed) to 100 (very stressed).
   Weights: stress 30, mood 20, sleep 20, workload 15, energy 15, minus up to 5 for exercise. */
function computeScore(e) {
  var moodVal = { calm: 0, moderate: 0.5, overwhelmed: 1 }[e.mood];
  var parts = [
    { name: "Stress level", max: 30, points: 30 * ((e.stress - 1) / 9) },
    { name: "Mood", max: 20, points: 20 * moodVal },
    { name: "Sleep", max: 20, points: 20 * clamp((8 - e.sleep) / 5, 0, 1) },
    { name: "Workload", max: 15, points: 15 * ((e.workload - 1) / 9) },
    { name: "Energy", max: 15, points: 15 * ((10 - e.energy) / 9) }
  ];
  var raw = 0;
  parts.forEach(function (p) { raw += p.points; });
  var bonus = (Math.min(e.exercise, 30) / 30) * 5;
  return { score: Math.round(clamp(raw - bonus, 0, 100)), parts: parts, bonus: bonus };
}

function withScore(e) {
  e.score = computeScore(e).score;
  return e;
}

function getEntries() { return loadJSON(userKey("entries"), {}); }
function setEntries(e) { saveJSON(userKey("entries"), e); }

function makePill(score) {
  var cat = categoryOf(score);
  var s = document.createElement("span");
  s.className = "pill " + cat;
  s.textContent = { calm: "Low", moderate: "Moderate", overwhelmed: "High" }[cat];
  return s;
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function statsFor(entries, startDate, endDate) {
  var a = todayKey(startDate), b = todayKey(endDate);
  var n = 0, sc = 0, sl = 0, st = 0, sr = 0;
  Object.keys(entries).forEach(function (k) {
    if (k >= a && k <= b) {
      var e = entries[k];
      n++; sc += e.score; sl += e.sleep; st += e.study; sr += e.stress;
    }
  });
  if (!n) return { count: 0, score: null, sleep: null, study: null, stress: null };
  return { count: n, score: Math.round(sc / n), sleep: sl / n, study: st / n, stress: sr / n };
}

function fmt(v, d) { return v === null ? "–" : v.toFixed(d); }

function paintScore(prefix, st, emptyHint) {
  var circle = $(prefix + "-score"), label = $(prefix + "-label"), hint = $(prefix + "-hint");
  circle.classList.remove("low", "mid", "high");
  if (st.score === null) {
    circle.textContent = "--";
    label.textContent = "No data yet";
    hint.textContent = emptyHint;
    return;
  }
  var cat = categoryOf(st.score);
  circle.textContent = st.score;
  circle.classList.add(cat === "calm" ? "low" : (cat === "moderate" ? "mid" : "high"));
  label.textContent = CAT_LABEL[cat];
  hint.textContent = CAT_HINT[cat];
}

function paintBars(container, items) {
  container.innerHTML = "";
  items.forEach(function (it) {
    var col = document.createElement("div");
    col.className = "bar-col";
    var bar = document.createElement("div");
    bar.className = "bar";
    if (it.score !== null) {
      bar.classList.add(categoryOf(it.score));
      bar.style.height = Math.max(8, it.score * 1.05) + "px";
      bar.title = it.title + ": " + it.score + "/100";
    } else {
      bar.title = it.title + ": no check-in";
    }
    col.appendChild(bar);
    col.appendChild(document.createTextNode(it.label));
    container.appendChild(col);
  });
}

function paintTiles(container, st) {
  var tiles = [
    ["Check-ins", st.count],
    ["Avg sleep", fmt(st.sleep, 1) + (st.sleep === null ? "" : " h")],
    ["Avg study", fmt(st.study, 1) + (st.study === null ? "" : " h")],
    ["Avg stress", fmt(st.stress, 1) + (st.stress === null ? "" : "/10")]
  ];
  container.innerHTML = "";
  tiles.forEach(function (t) {
    var div = document.createElement("div");
    div.className = "tile";
    var v = document.createElement("div");
    v.className = "tile-val";
    v.textContent = t[1];
    var l = document.createElement("div");
    l.className = "tile-label";
    l.textContent = t[0];
    div.appendChild(v);
    div.appendChild(l);
    container.appendChild(div);
  });
}

function addCell(tr, content, cls) {
  var td = document.createElement("td");
  if (cls) td.className = cls;
  if (typeof content === "string" || typeof content === "number") td.textContent = content;
  else td.appendChild(content);
  tr.appendChild(td);
}

function changeCell(cur, prev) {
  var span = document.createElement("span");
  if (cur === null || prev === null) { span.className = "change flat"; span.textContent = "–"; return span; }
  var diff = cur - prev;
  if (diff < 0) { span.className = "change good"; span.textContent = "▼ " + Math.abs(diff); span.title = "Lower than before (better)"; }
  else if (diff > 0) { span.className = "change bad"; span.textContent = "▲ " + diff; span.title = "Higher than before"; }
  else { span.className = "change flat"; span.textContent = "▬ 0"; }
  return span;
}

function fillTable(tbody, rows) {
  tbody.innerHTML = "";
  var prevScore = null;
  rows.forEach(function (r, i) {
    var tr = document.createElement("tr");
    if (i === rows.length - 1) tr.className = "current-row";
    addCell(tr, r.label);
    addCell(tr, r.st.count, "num");
    addCell(tr, r.st.score === null ? "–" : r.st.score, "num");
    addCell(tr, r.st.score === null ? "–" : makePill(r.st.score));
    addCell(tr, r.st.sleep === null ? "–" : fmt(r.st.sleep, 1) + " h", "num");
    addCell(tr, r.st.study === null ? "–" : fmt(r.st.study, 1) + " h", "num");
    addCell(tr, changeCell(r.st.score, prevScore));
    tbody.appendChild(tr);
    if (r.st.score !== null) prevScore = r.st.score;
  });
}

function renderDashboard() {
  if (!$("w-score")) return;
  var entries = getEntries();
  var now = new Date();

  /* ---- Weekly (Mon–Sun, current week) ---- */
  var ws = startOfWeek(now);
  var wst = statsFor(entries, ws, addDays(ws, 6));
  paintScore("w", wst, "Do a daily check-in to see your weekly stress score.");
  var wBars = [];
  for (var i = 0; i < 7; i++) {
    var d = addDays(ws, i);
    var e = entries[todayKey(d)];
    wBars.push({ label: DAYS[d.getDay()], score: e ? e.score : null, title: shortDate(d) });
  }
  paintBars($("w-bars"), wBars);
  paintTiles($("w-stats"), wst);

  var weekRows = [];
  for (var w = 4; w >= 0; w--) {
    var s = addDays(ws, -7 * w);
    var en = addDays(s, 6);
    weekRows.push({
      label: shortDate(s) + " – " + shortDate(en) + (w === 0 ? " (this week)" : ""),
      st: statsFor(entries, s, en)
    });
  }
  fillTable($("week-table-body"), weekRows);

  /* ---- Monthly (current calendar month) ---- */
  var ms = new Date(now.getFullYear(), now.getMonth(), 1);
  var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  var mst = statsFor(entries, ms, new Date(now.getFullYear(), now.getMonth(), daysInMonth));
  paintScore("m", mst, "Do daily check-ins to see your monthly stress score.");
  var mBars = [];
  for (var j = 1; j <= daysInMonth; j++) {
    var dd = new Date(now.getFullYear(), now.getMonth(), j);
    var ee = entries[todayKey(dd)];
    mBars.push({ label: (j === 1 || j % 5 === 0) ? String(j) : " ", score: ee ? ee.score : null, title: shortDate(dd) });
  }
  var mBarsEl = $("m-bars");
  paintBars(mBarsEl, mBars);
  mBarsEl.classList.add("month-bars");
  paintTiles($("m-stats"), mst);

  var monthRows = [];
  for (var m = 2; m >= 0; m--) {
    var a = new Date(now.getFullYear(), now.getMonth() - m, 1);
    var b = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
    monthRows.push({
      label: MONTHS[a.getMonth()] + " " + a.getFullYear() + (m === 0 ? " (this month)" : ""),
      st: statsFor(entries, a, b)
    });
  }
  fillTable($("month-table-body"), monthRows);
}

/* ---- Demo data tools ---- */
function loadDemoData() {
  var existing = Object.keys(getEntries()).length;
  if (existing && !confirm("This replaces your current check-ins with sample data. Continue?")) return;
  var entries = {};
  var now = new Date();
  for (var i = 0; i < 110; i++) {
    if (Math.random() < 0.15) continue;
    var wave = Math.sin(i / 6);
    var stress = clamp(Math.round(5 + 2.2 * wave + (Math.random() * 3 - 1.5)), 1, 10);
    var workload = clamp(Math.round(5 + 2 * wave + (Math.random() * 2 - 1)), 1, 10);
    var entry = {
      mood: stress <= 4 ? "calm" : (stress <= 7 ? "moderate" : "overwhelmed"),
      stress: stress,
      energy: clamp(Math.round(6 - (stress - 5) * 0.5 + (Math.random() * 2 - 1)), 1, 10),
      workload: workload,
      sleep: clamp(Math.round((7 - (stress - 5) * 0.35 + (Math.random() * 2 - 1)) * 2) / 2, 3, 10),
      study: clamp(Math.round((4 + (workload - 5) * 0.5 + Math.random() * 2) * 2) / 2, 0, 14),
      exercise: Math.random() < 0.4 ? 0 : Math.round(Math.random() * 8) * 5
    };
    entries[todayKey(addDays(now, -i))] = withScore(entry);
  }
  setEntries(entries);
  renderDashboard();
}

function clearData() {
  if (!confirm("Delete all your check-in data? This cannot be undone.")) return;
  setEntries({});
  renderDashboard();
}

function initDemoTools() {
  var load = $("demo-load-btn"), clear = $("demo-clear-btn");
  if (load) load.addEventListener("click", loadDemoData);
  if (clear) clear.addEventListener("click", clearData);
}

/* ---- Deadlines (add / remove / tick) ---- */
function defaultDeadlines() {
  var now = new Date();
  return [
    { id: uid(), title: "Python lab evaluation", date: todayKey(addDays(now, 3)), done: false },
    { id: uid(), title: "Calculus assignment", date: todayKey(addDays(now, 8)), done: false },
    { id: uid(), title: "Web Development project demo", date: todayKey(addDays(now, 14)), done: false }
  ];
}
function getDeadlines() {
  var d = loadJSON(userKey("deadlines"), null);
  if (d === null) { d = defaultDeadlines(); saveJSON(userKey("deadlines"), d); }
  return d;
}
function setDeadlines(d) { saveJSON(userKey("deadlines"), d); }

function dueInfo(dl) {
  if (!dl.date) return { text: "No date", overdue: false };
  var today = parseKey(todayKey());
  var diff = Math.round((parseKey(dl.date) - today) / 86400000);
  if (diff < 0) return { text: "Overdue by " + Math.abs(diff) + (Math.abs(diff) === 1 ? " day" : " days"), overdue: !dl.done };
  if (diff === 0) return { text: "Due today", overdue: false };
  if (diff === 1) return { text: "Due tomorrow", overdue: false };
  return { text: "Due in " + diff + " days", overdue: false };
}

function renderDeadlines() {
  var list = $("deadline-list");
  if (!list) return;
  var items = getDeadlines().slice().sort(function (a, b) {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (a.date || "9999") < (b.date || "9999") ? -1 : 1;
  });
  list.innerHTML = "";
  var open = 0;
  if (!items.length) {
    var empty = document.createElement("li");
    empty.className = "empty-note";
    empty.textContent = "No deadlines. Add one below.";
    list.appendChild(empty);
  }
  items.forEach(function (dl) {
    if (!dl.done) open++;
    var li = document.createElement("li");
    if (dl.done) li.className = "done";

    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = "dl-" + dl.id;
    cb.checked = dl.done;
    cb.addEventListener("change", function () {
      var all = getDeadlines();
      all.forEach(function (x) { if (x.id === dl.id) x.done = cb.checked; });
      setDeadlines(all);
      renderDeadlines();
    });

    var label = document.createElement("label");
    label.setAttribute("for", cb.id);
    label.textContent = dl.title;

    var info = dueInfo(dl);
    var due = document.createElement("span");
    due.className = "due" + (info.overdue ? " overdue" : "");
    due.textContent = info.text;

    var del = document.createElement("button");
    del.type = "button";
    del.className = "icon-btn";
    del.title = "Remove deadline";
    del.setAttribute("aria-label", "Remove deadline: " + dl.title);
    del.textContent = "✕";
    del.addEventListener("click", function () {
      setDeadlines(getDeadlines().filter(function (x) { return x.id !== dl.id; }));
      renderDeadlines();
    });

    li.appendChild(cb);
    li.appendChild(label);
    li.appendChild(due);
    li.appendChild(del);
    list.appendChild(li);
  });
  var count = $("deadline-count");
  if (count) count.textContent = open + " open";
}

function initDeadlines() {
  var form = $("deadline-form");
  if (!form) return;
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var titleEl = $("dl-title"), dateEl = $("dl-date");
    var title = titleEl.value.trim();
    if (!title) { titleEl.focus(); return; }
    var all = getDeadlines();
    all.push({ id: uid(), title: title, date: dateEl.value, done: false });
    setDeadlines(all);
    titleEl.value = "";
    dateEl.value = "";
    renderDeadlines();
  });
  renderDeadlines();
}

/* ---- Wellness tips (random on every load) ---- */
function initTips() {
  var textEl = $("tip-text");
  if (!textEl || typeof TIP_BANK === "undefined") return;
  var all = [];
  Object.keys(TIP_BANK).forEach(function (theme) {
    TIP_BANK[theme].forEach(function (t) { all.push({ theme: theme, text: t }); });
  });

  function show(item) {
    textEl.textContent = item.text;
    $("tip-theme").textContent = item.theme;
  }
  function pick() {
    var last = loadJSON("mm_lastTip", -1);
    var i;
    do { i = Math.floor(Math.random() * all.length); } while (i === last && all.length > 1);
    saveJSON("mm_lastTip", i);
    show(all[i]);
  }
  var note = $("tip-count");
  if (note) note.textContent = all.length + " tips in the bank. A new one shows on every visit.";
  var btn = $("new-tip-btn");
  if (btn) btn.addEventListener("click", pick);
  pick();
}

function initWelcome() {
  var el = $("welcome-name");
  var s = getSession();
  if (!el || !s) return;
  el.textContent = s.name.split(" ")[0];

  // First visit right after signing up: "Welcome". Every later visit: "Welcome back".
  var prefix = $("welcome-prefix");
  if (prefix && loadJSON("mm_new_user", null) === s.email) {
    prefix.textContent = "Welcome";
    try { localStorage.removeItem("mm_new_user"); } catch (e) { /* ignore */ }
  }
}

/* ============================================================
   POMODORO TIMER
   ============================================================ */
function initTimer() {
  var display = $("clock-display");
  if (!display) return;

  var modeLabel = $("mode-label"), fill = $("progress-fill"), countEl = $("session-count"), msg = $("timer-msg");
  var startBtn = $("start-btn"), pauseBtn = $("pause-btn"), resetBtn = $("reset-btn");
  var shortBtn = $("break-btn"), longBtn = $("long-break-btn");
  var presets = document.querySelectorAll(".preset-btn");
  var customInput = $("custom-min"), customBtn = $("custom-set-btn");

  var focusMin = loadJSON(userKey("focusMin"), 25);
  var mode = "focus";
  var totalSeconds = focusMin * 60;
  var remaining = totalSeconds;
  var intervalId = null;
  var endTime = 0;

  var sessions = loadJSON(userKey("sessions"), { date: todayKey(), count: 0, minutes: 0 });
  if (sessions.date !== todayKey()) sessions = { date: todayKey(), count: 0, minutes: 0 };

  function render() {
    var text = pad(Math.floor(remaining / 60)) + ":" + pad(remaining % 60);
    display.textContent = text;
    document.title = text + " · MindMetrics";
    fill.style.width = ((totalSeconds - remaining) / totalSeconds) * 100 + "%";
    countEl.textContent = "Focus sessions today: " + sessions.count + " · " + sessions.minutes + " min focused";
    presets.forEach(function (p) { p.classList.toggle("active", +p.dataset.min === focusMin); });
  }

  function stop() {
    if (intervalId !== null) { clearInterval(intervalId); intervalId = null; }
  }

  function setTimer(kind, minutes) {
    stop();
    mode = kind;
    totalSeconds = Math.round(minutes * 60);
    remaining = totalSeconds;
    if (kind === "focus") {
      modeLabel.textContent = "Focus time · " + minutes + " min";
      modeLabel.classList.remove("break");
    } else {
      modeLabel.textContent = minutes >= 15 ? "Long break" : "Short break";
      modeLabel.classList.add("break");
    }
    msg.textContent = "";
    render();
  }

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      var ctx = new Ctx();
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 660; g.gain.value = 0.08;
      o.start(); o.stop(ctx.currentTime + 0.6);
    } catch (e) { /* audio not available */ }
  }

  function complete() {
    stop();
    beep();
    if (mode === "focus") {
      sessions.count++;
      sessions.minutes += focusMin;
      saveJSON(userKey("sessions"), sessions);
      var brk = focusMin >= 90 ? 15 : (focusMin >= 50 ? 10 : 5);
      setTimer("break", brk);
      msg.textContent = "Focus session complete! A " + brk + "-minute break is ready. Press Start.";
    } else {
      setTimer("focus", focusMin);
      msg.textContent = "Break over. Ready for another focus block?";
    }
  }

  function tick() {
    remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    render();
    if (remaining === 0) complete();
  }

  function chooseFocus(min) {
    focusMin = min;
    saveJSON(userKey("focusMin"), min);
    setTimer("focus", min);
  }

  startBtn.addEventListener("click", function () {
    if (intervalId !== null || remaining <= 0) return;
    endTime = Date.now() + remaining * 1000;
    intervalId = setInterval(tick, 500);
  });
  pauseBtn.addEventListener("click", stop);
  resetBtn.addEventListener("click", function () {
    setTimer(mode, mode === "focus" ? focusMin : totalSeconds / 60);
  });
  shortBtn.addEventListener("click", function () { setTimer("break", 5); });
  longBtn.addEventListener("click", function () { setTimer("break", 15); });

  presets.forEach(function (p) {
    p.addEventListener("click", function () { chooseFocus(+p.dataset.min); });
  });
  customBtn.addEventListener("click", function () {
    var v = parseInt(customInput.value, 10);
    if (isNaN(v) || v < 1 || v > 180) { msg.textContent = "Enter a number between 1 and 180 minutes."; return; }
    chooseFocus(v);
  });

  setTimer("focus", focusMin);
}

/* ============================================================
   CHECK-IN (quantitative)
   ============================================================ */
var ADVICE = {
  calm: {
    title: "Nice. Keep the momentum 🌱",
    tips: [
      "Use this clear headspace for your hardest subject first.",
      "Plan tomorrow's top 3 tasks so the calm continues.",
      "Note what helped today, such as sleep, food or a walk, and repeat it."
    ]
  },
  moderate: {
    title: "A bit loaded. That's normal ⚖️",
    tips: [
      "Do one focus block on the task you are avoiding.",
      "Take a 10-minute walk away from your screen.",
      "Write down everything on your mind, then circle just one thing to do next."
    ]
  },
  overwhelmed: {
    title: "Pause. You're not alone 💙",
    tips: [
      "Try box breathing: in for 4, hold 4, out for 4, hold 4. Repeat 4 times.",
      "Drink water and eat something. A hungry brain exaggerates stress.",
      "Message a friend or call family. Saying it out loud helps.",
      "If this feeling lasts for days, please reach out to your campus counsellor."
    ]
  }
};

function buildAdvice(entry) {
  var cat = categoryOf(entry.score);
  var tips = ADVICE[cat].tips.slice();
  if (entry.sleep < 6) tips.push("You slept " + entry.sleep + " h. Aim for 7–9 h tonight; sleep is the fastest stress reducer.");
  if (entry.exercise === 0) tips.push("No movement today. Even a 10-minute walk helps your mood.");
  if (entry.study >= 9) tips.push("That was a long study day (" + entry.study + " h). Add proper breaks and stop on time.");
  if (entry.workload >= 8) tips.push("Workload feels heavy. List everything, then finish just one thing first.");
  return { title: ADVICE[cat].title, tips: tips };
}

function renderHistory() {
  var list = $("history-list");
  if (!list) return;
  var entries = getEntries();
  var keys = Object.keys(entries).sort().reverse().slice(0, 7);
  list.innerHTML = "";
  if (!keys.length) {
    var li = document.createElement("li");
    li.className = "empty-note";
    li.textContent = "No check-ins yet. Fill in the form to start.";
    list.appendChild(li);
    return;
  }
  keys.forEach(function (k) {
    var e = entries[k];
    var item = document.createElement("li");
    var date = document.createElement("span");
    date.textContent = shortDate(parseKey(k));
    var mood = document.createElement("span");
    mood.textContent = MOOD_LABEL[e.mood];
    var right = document.createElement("span");
    right.appendChild(document.createTextNode(e.score + "  "));
    right.appendChild(makePill(e.score));
    item.appendChild(date);
    item.appendChild(mood);
    item.appendChild(right);
    list.appendChild(item);
  });
}

function showResult(entry) {
  var calc = computeScore(entry);
  var cat = categoryOf(entry.score);

  $("result-empty").hidden = true;
  $("result-box").hidden = false;

  var circle = $("res-score");
  circle.textContent = entry.score;
  circle.classList.remove("low", "mid", "high");
  circle.classList.add(cat === "calm" ? "low" : (cat === "moderate" ? "mid" : "high"));
  $("res-label").textContent = CAT_LABEL[cat];

  var sub = $("res-sub");
  if (entry.mood === cat) {
    sub.textContent = "Your numbers match how you said you feel. Nice self-awareness.";
  } else {
    sub.textContent = "You said you feel “" + entry.mood + "”, but your numbers point to “" + CAT_LABEL[cat].toLowerCase() + "”. Worth noticing.";
  }

  var box = $("res-breakdown");
  box.innerHTML = "";
  function row(name, pts, max, bonus) {
    var r = document.createElement("div");
    r.className = "break-row";
    var n = document.createElement("span");
    n.textContent = name;
    var track = document.createElement("div");
    track.className = "break-track";
    var f = document.createElement("div");
    f.className = "break-fill" + (bonus ? " bonus" : "");
    f.style.width = clamp((pts / max) * 100, 0, 100) + "%";
    track.appendChild(f);
    var p = document.createElement("span");
    p.className = "break-pts";
    p.textContent = (bonus ? "−" : "+") + Math.round(pts);
    r.appendChild(n); r.appendChild(track); r.appendChild(p);
    box.appendChild(r);
  }
  calc.parts.forEach(function (p) { row(p.name, p.points, p.max, false); });
  if (calc.bonus > 0) row("Exercise", calc.bonus, 5, true);

  var adv = buildAdvice(entry);
  var advBox = $("dynamic-advice-box");
  advBox.innerHTML = "";
  var h = document.createElement("h3");
  h.textContent = adv.title;
  var ul = document.createElement("ul");
  adv.tips.forEach(function (t) {
    var li = document.createElement("li");
    li.textContent = t;
    ul.appendChild(li);
  });
  advBox.appendChild(h);
  advBox.appendChild(ul);
  advBox.classList.add("show");
}

function initCheckin() {
  var form = $("mood-form");
  if (!form) return;
  var buttons = form.querySelectorAll(".mood-btn");
  var sliders = form.querySelectorAll("input[type='range']");
  var errEl = $("ci-error");
  var selectedMood = null;

  function syncSlider(inp) {
    var out = inp.parentNode.querySelector(".slider-val");
    out.textContent = inp.value + (inp.dataset.unit || "");
  }
  sliders.forEach(function (inp) {
    syncSlider(inp);
    inp.addEventListener("input", function () { syncSlider(inp); });
  });

  function selectMood(m) {
    selectedMood = m;
    buttons.forEach(function (b) { b.classList.toggle("selected", b.dataset.mood === m); });
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () { selectMood(b.dataset.mood); errEl.hidden = true; });
  });

  var today = getEntries()[todayKey()];
  if (today) {
    selectMood(today.mood);
    ["stress", "energy", "workload", "sleep", "study", "exercise"].forEach(function (k) {
      var inp = $("ci-" + k);
      inp.value = today[k];
      syncSlider(inp);
    });
    showResult(today);
  }

  $("save-checkin").addEventListener("click", function () {
    if (!selectedMood) { errEl.textContent = "Please tap how you feel (Calm, Moderate or Overwhelmed) first."; errEl.hidden = false; return; }
    errEl.hidden = true;
    var entry = withScore({
      mood: selectedMood,
      stress: +$("ci-stress").value,
      energy: +$("ci-energy").value,
      workload: +$("ci-workload").value,
      sleep: +$("ci-sleep").value,
      study: +$("ci-study").value,
      exercise: +$("ci-exercise").value
    });
    var all = getEntries();
    all[todayKey()] = entry;
    setEntries(all);
    showResult(entry);
    renderHistory();
  });

  renderHistory();
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
  if (PAGE === "login.html") { initTabs(); initLogin(); return; }
  if (!LOGGED_IN) return; // redirecting to login

  highlightNav();
  renderUserArea();
  initTabs();
  initWelcome();
  renderDashboard();
  initDemoTools();
  initDeadlines();
  initTips();
  initTimer();
  initCheckin();
});
