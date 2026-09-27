// ComplianceCalendar.au — calendar renderer + theme toggle
let ENTRIES = [];

const $ = id => document.getElementById(id);

/* ---------- theme ---------- */
function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode === "dark" ? "dark" : "light");
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = mode === "dark" ? "☀ Light" : "🌙 Dark";
}
function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem("cc-theme"); } catch {}
  applyTheme(saved === "dark" ? "dark" : "light"); // default light
}

function daysAway(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (!m) return null;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  return Math.round((d - new Date()) / 86400000);
}

function dateLabel(e) {
  const n = daysAway(e.date);
  if (n === null) return e.date;
  if (n < 0) return `${e.date} (in force)`;
  if (n === 0) return `${e.date} (today)`;
  if (n < 120) return `${e.date} · in ${n} days`;
  return e.date;
}

function card(e) {
  const t = (e.type || "").toLowerCase();
  return `<article class="card" id="e-${e.id}">
    <div class="tags">
      <span class="tag type-${t}">${e.type}</span>
      <span class="tag">${e.jurisdiction}</span>
      <span class="tag">${e.regulator || ""}</span>
      <span class="tag date">${dateLabel(e)}</span>
    </div>
    <h3>${e.title}</h3>
    <p class="summary">${e.summary || ""}</p>
    <div class="what"><b>What to do:</b> ${e.whatToDo || "—"}</div>
    <div class="meta">
      <span><b>Affects:</b> ${e.whoItAffects || "—"}</span>
      ${e.penalty ? `<span class="pen"><b>Penalty:</b> ${e.penalty}</span>` : ""}
      ${e.sourceUrl ? `<span><a href="${e.sourceUrl}" target="_blank" rel="noopener">Source</a></span>` : ""}
    </div>
  </article>`;
}

function apply() {
  const q = $("q").value.trim().toLowerCase();
  const jur = $("jurisdiction").value;
  const type = $("type").value;
  const win = $("window").value;

  let rows = ENTRIES.filter(e => {
    if (jur && e.jurisdiction !== jur) return false;
    if (type && (e.type || "").toLowerCase() !== type) return false;
    if (q) {
      const hay = [e.title, e.summary, e.regulator, e.whoItAffects, e.whatToDo].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (win) {
      const n = daysAway(e.date);
      if (win === "30" || win === "90") {
        if (n === null || n < 0 || n > Number(win)) return false;
      } else if (!String(e.date).startsWith(win)) return false;
    }
    return true;
  });

  rows.sort((a, b) => {
    const na = daysAway(a.date), nb = daysAway(b.date);
    if (na === null && nb === null) return 0;
    if (na === null) return 1;
    if (nb === null) return -1;
    return na - nb;
  });

  $("counts").textContent = `${rows.length} of ${ENTRIES.length} items`;
  $("results").innerHTML = rows.length
    ? rows.map(card).join("")
    : `<div class="empty">Nothing matches those filters yet.</div>`;
}

async function boot() {
  initTheme();
  const tt = $("themeToggle");
  if (tt) {
    tt.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("cc-theme", next); } catch {}
      applyTheme(next);
    });
  }
  try {
    ENTRIES = await (await fetch("data/entries.json")).json();
  } catch {
    ENTRIES = [];
  }
  ["q", "jurisdiction", "type", "window"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener(id === "q" ? "input" : "change", apply);
  });
  const form = document.querySelector(".signup");
  if (form) form.addEventListener("submit", ev => {
    ev.preventDefault();
    const btn = ev.target.querySelector("button");
    btn.textContent = "Thanks — check your inbox";
    btn.disabled = true;
  });
  apply();
}

boot();
