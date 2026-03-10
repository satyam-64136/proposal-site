"use strict";

/* ── Canvas mesh background ─────────────────────────────── */
(function () {
  const canvas = document.getElementById("bgCanvas");
  const ctx    = canvas.getContext("2d");
  let W, H, orbs;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeOrbs() {
    return [
      { x: W * 0.15, y: H * 0.15, r: 420, vx:  0.18, vy:  0.12, color: "rgba(240,180,41,0.13)"  },
      { x: W * 0.85, y: H * 0.75, r: 380, vx: -0.14, vy: -0.10, color: "rgba(100,80,255,0.07)"  },
      { x: W * 0.55, y: H * 0.45, r: 300, vx:  0.10, vy:  0.16, color: "rgba(52,211,153,0.06)"  },
    ];
  }

  function drawOrb(o) {
    const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
    g.addColorStop(0,   o.color);
    g.addColorStop(1,   "transparent");
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    orbs.forEach(o => {
      o.x += o.vx; o.y += o.vy;
      if (o.x - o.r < 0 || o.x + o.r > W) o.vx *= -1;
      if (o.y - o.r < 0 || o.y + o.r > H) o.vy *= -1;
      drawOrb(o);
    });
    requestAnimationFrame(tick);
  }

  resize();
  orbs = makeOrbs();
  window.addEventListener("resize", () => { resize(); orbs = makeOrbs(); });
  tick();
})();

/* ── DOM refs ───────────────────────────────────────────── */
const $  = id => document.getElementById(id);
const urlInput         = $("urlInput");
const pasteBtn         = $("pasteBtn");
const inputWrap        = $("inputWrap");
const inputError       = $("inputError");
const modeToggle       = $("modeToggle");
const qualityWrap      = $("qualityWrap");
const qualitySelect    = $("qualitySelect");
const downloadBtn      = $("downloadBtn");
const platformIconWrap = $("platformIconWrap");
const platformLabel    = $("platformLabel");
const progressPanel    = $("progressPanel");
const progressFill     = $("progressFill");
const progressPct      = $("progressPct");
const progressStatus   = $("progressStatus");
const progressSpeed    = $("progressSpeed");
const progressEta      = $("progressEta");
const progressTitle    = $("progressTitle");
const progressUploader = $("progressUploader");
const thumbImg         = $("thumbImg");
const successPanel     = $("successPanel");
const successTitle     = $("successTitle");
const successSub       = $("successSub");
const saveBtn          = $("saveBtn");
const resetBtn         = $("resetBtn");
const errorPanel       = $("errorPanel");
const errorMsg         = $("errorMsg");
const retryBtn         = $("retryBtn");

/* ── State ──────────────────────────────────────────────── */
let state = { mode: "video", taskId: null, polling: null, phase: "idle" };

/* ── Platform map ───────────────────────────────────────── */
const PLATFORMS = [
  { key: "youtube.com",     name: "YouTube",     slug: "youtube"     },
  { key: "youtu.be",        name: "YouTube",     slug: "youtube"     },
  { key: "instagram.com",   name: "Instagram",   slug: "instagram"   },
  { key: "tiktok.com",      name: "TikTok",      slug: "tiktok"      },
  { key: "twitter.com",     name: "Twitter",     slug: "twitter"     },
  { key: "x.com",           name: "Twitter · X", slug: "twitter"     },
  { key: "facebook.com",    name: "Facebook",    slug: "facebook"    },
  { key: "vimeo.com",       name: "Vimeo",       slug: "vimeo"       },
  { key: "dailymotion.com", name: "Dailymotion", slug: "dailymotion" },
  { key: "twitch.tv",       name: "Twitch",      slug: "twitch"      },
];

function detectPlatform(url) {
  const l = url.toLowerCase();
  return PLATFORMS.find(p => l.includes(p.key)) || { name: "Generic", slug: "generic" };
}

function isValidUrl(url) {
  try { const u = new URL(url); return ["http:", "https:"].includes(u.protocol); }
  catch { return false; }
}

/* ── UI helpers ─────────────────────────────────────────── */
function showInputError(msg) {
  inputError.textContent = msg;
  inputError.classList.remove("shake");
  void inputError.offsetWidth;
  inputError.classList.add("shake");
  inputWrap.classList.add("is-error");
}
function clearInputError() {
  inputError.textContent = "";
  inputError.classList.remove("shake");
  inputWrap.classList.remove("is-error");
}

function setPhase(phase) {
  state.phase = phase;
  const loading = phase === "loading";
  downloadBtn.disabled = loading;
  downloadBtn.classList.toggle("loading", loading);
  progressPanel.classList.toggle("visible", phase === "loading");
  successPanel.style.display = phase === "done"  ? "flex" : "none";
  errorPanel.style.display   = phase === "error" ? "flex" : "none";
}

function updatePlatform(platform) {
  document.body.className = document.body.className.replace(/\bplatform-\S+/g, "").trim();
  if (platform.slug !== "generic") document.body.classList.add(`platform-${platform.slug}`);
  platformLabel.textContent = platform.name;

  const img = document.createElement("img");
  img.src = `/static/icons/${platform.slug}.svg`;
  img.alt = platform.name;
  img.onerror = () => img.remove();
  platformIconWrap.innerHTML = "";
  platformIconWrap.appendChild(img);
}

function updateProgress(data) {
  const pct = Math.min(100, parseFloat(data.progress || 0));
  progressFill.style.width = pct + "%";
  progressPct.textContent  = pct.toFixed(0) + "%";

  const labels = { starting: "Starting…", downloading: "Downloading…", processing: "Processing…", done: "Complete" };
  progressStatus.textContent = labels[data.status] || data.status;
  progressSpeed.textContent  = data.speed || "";
  progressEta.textContent    = data.eta ? `ETA ${data.eta}` : "";

  if (data.title)    progressTitle.textContent    = data.title;
  if (data.uploader) progressUploader.textContent = data.uploader;

  if (data.thumbnail && !thumbImg.classList.contains("loaded")) {
    thumbImg.src = data.thumbnail;
    thumbImg.onload = () => thumbImg.classList.add("loaded");
  }
}

function showSuccess(data) {
  setPhase("done");
  successTitle.textContent = data.title || "File ready!";
  successSub.textContent   = data.uploader
    ? `${data.uploader}${data.duration ? "  ·  " + data.duration : ""}`
    : "";
  saveBtn.href = `/download/${state.taskId}`;
}

function showError(msg) {
  setPhase("error");
  errorMsg.textContent = msg || "An unexpected error occurred.";
}

function resetUI() {
  stopPolling();
  state.taskId = null;
  setPhase("idle");
  clearInputError();
  progressFill.style.width      = "0%";
  progressPct.textContent       = "0%";
  progressStatus.textContent    = "Starting…";
  progressSpeed.textContent     = "";
  progressEta.textContent       = "";
  progressTitle.textContent     = "Fetching info…";
  progressUploader.textContent  = "";
  thumbImg.src                  = "";
  thumbImg.classList.remove("loaded");
  platformLabel.textContent     = "Ready to fetch";
  platformIconWrap.innerHTML    = defaultIconSVG();
  document.body.className       = document.body.className.replace(/\bplatform-\S+/g, "").trim();
}

function defaultIconSVG() {
  return `<svg class="plat-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101"/>
    <path d="M10.172 13.828a4 4 0 0 0 5.656 0l4-4a4 4 0 1 0-5.656-5.656l-1.101 1.102"/>
  </svg>`;
}

/* ── Polling ────────────────────────────────────────────── */
function startPolling(taskId) {
  let fails = 0;
  state.polling = setInterval(async () => {
    try {
      const r = await fetch(`/progress/${taskId}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      updateProgress(data);
      fails = 0;
      if (data.status === "done")  { stopPolling(); showSuccess(data); return; }
      if (data.status === "error") { stopPolling(); showError(data.error); return; }
    } catch (e) {
      if (++fails >= 5) { stopPolling(); showError("Lost connection to server."); }
    }
  }, 800);
}
function stopPolling() {
  if (state.polling) { clearInterval(state.polling); state.polling = null; }
}

/* ── Core action ────────────────────────────────────────── */
async function startDownload() {
  if (state.phase === "loading") return;
  const url = urlInput.value.trim();
  if (!url)           { showInputError("Please paste a URL first."); urlInput.focus(); return; }
  if (!isValidUrl(url)) { showInputError("That doesn't look like a valid URL."); urlInput.focus(); return; }
  clearInputError();
  updatePlatform(detectPlatform(url));
  setPhase("loading");

  const fd = new FormData();
  fd.append("url",     url);
  fd.append("mode",    state.mode);
  fd.append("quality", qualitySelect.value);

  try {
    const res  = await fetch("/start_task", { method: "POST", body: fd });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server error ${res.status}`);
    }
    const data = await res.json();
    state.taskId = data.task_id;
    if (data.platform) updatePlatform(data.platform);
    startPolling(data.task_id);
  } catch (e) {
    showError(e.message || "Could not start download.");
  }
}

/* ── Events ─────────────────────────────────────────────── */
urlInput.addEventListener("input", () => {
  clearInputError();
  const v = urlInput.value.trim();
  if (v.length > 10) updatePlatform(detectPlatform(v));
});
urlInput.addEventListener("keydown", e => { if (e.key === "Enter") startDownload(); });

pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text) { urlInput.value = text.trim(); urlInput.dispatchEvent(new Event("input")); }
  } catch { urlInput.focus(); urlInput.select(); }
});

modeToggle.addEventListener("click", e => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  modeToggle.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  state.mode = btn.dataset.mode;
  qualityWrap.classList.toggle("hidden", state.mode === "audio");
});

downloadBtn.addEventListener("click", startDownload);
resetBtn.addEventListener("click", resetUI);
retryBtn.addEventListener("click", () => setPhase("idle"));

document.addEventListener("paste", e => {
  if (document.activeElement === urlInput) return;
  const text = (e.clipboardData || window.clipboardData)?.getData("text");
  if (text && isValidUrl(text)) { urlInput.value = text.trim(); urlInput.dispatchEvent(new Event("input")); }
});
