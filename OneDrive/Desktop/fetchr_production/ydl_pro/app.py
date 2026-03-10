"""
Universal Downloader Neo — Production Backend
FastAPI + yt-dlp | Thread-safe | Validated | Auto-cleanup
"""

import os
import uuid
import threading
import time
import logging
import re
from pathlib import Path
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from yt_dlp import YoutubeDL
import uvicorn

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR     = Path(__file__).parent.resolve()
STATIC_DIR   = BASE_DIR / "static"
TEMPLATE_DIR = BASE_DIR / "templates"
DOWNLOAD_DIR = BASE_DIR / "downloads"

for d in [STATIC_DIR, TEMPLATE_DIR, DOWNLOAD_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# ── In-memory state (thread-safe) ────────────────────────────────────────────
_store_lock  = threading.Lock()
progress_store: dict[str, dict] = {}   # task_id → {progress, status, filepath?, title?, thumbnail?}

# ── Cleanup worker (runs every 10 min, removes tasks >1 h old) ────────────────
def _cleanup_loop():
    while True:
        time.sleep(600)
        cutoff = time.time() - 3600
        with _store_lock:
            stale = [k for k, v in progress_store.items() if v.get("created_at", 0) < cutoff]
        for k in stale:
            with _store_lock:
                info = progress_store.pop(k, {})
            fp = info.get("filepath")
            if fp and Path(fp).exists():
                try:
                    Path(fp).unlink()
                    log.info("Cleaned up %s", fp)
                except OSError:
                    pass

threading.Thread(target=_cleanup_loop, daemon=True).start()

# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    ffmpeg_status = "found ✓" if _ffmpeg_available() else "NOT FOUND — muxed-only formats will be used"
    log.info("Universal Downloader Neo starting… (ffmpeg: %s)", ffmpeg_status)
    yield
    log.info("Shutting down.")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="Universal Downloader Neo", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
templates = Jinja2Templates(directory=TEMPLATE_DIR)

# ── Helpers ───────────────────────────────────────────────────────────────────
ALLOWED_HOSTS = re.compile(
    r"(youtube\.com|youtu\.be|instagram\.com|tiktok\.com|twitter\.com|"
    r"x\.com|facebook\.com|vimeo\.com|dailymotion\.com|twitch\.tv)",
    re.I,
)

def validate_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(ALLOWED_HOSTS.search(parsed.netloc))
    except Exception:
        return False

def detect_platform(url: str) -> dict:
    url_lower = url.lower()
    platforms = {
        "youtube":     ("YouTube",     "youtube"),
        "youtu.be":    ("YouTube",     "youtube"),
        "instagram":   ("Instagram",   "instagram"),
        "tiktok":      ("TikTok",      "tiktok"),
        "twitter":     ("Twitter",     "twitter"),
        "x.com":       ("Twitter",     "twitter"),
        "facebook":    ("Facebook",    "facebook"),
        "vimeo":       ("Vimeo",       "vimeo"),
        "dailymotion": ("Dailymotion", "dailymotion"),
        "twitch":      ("Twitch",      "twitch"),
    }
    for key, (name, slug) in platforms.items():
        if key in url_lower:
            return {"name": name, "slug": slug}
    return {"name": "Generic", "slug": "generic"}

QUALITY_MAP = {
    "2160p": "2160",
    "1080p": "1080",
    "720p":  "720",
    "480p":  "480",
    "360p":  "360",
}

import shutil

def _ffmpeg_available() -> bool:
    return shutil.which("ffmpeg") is not None

# ── Download worker ───────────────────────────────────────────────────────────
def download_worker(task_id: str, url: str, mode: str, quality: str):
    def _set(data: dict):
        with _store_lock:
            progress_store[task_id].update(data)

    def hook(d):
        if d["status"] == "downloading":
            total      = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            downloaded = d.get("downloaded_bytes", 0)
            speed      = d.get("speed") or 0
            eta        = d.get("eta") or 0
            pct        = round(downloaded / total * 100, 1) if total else 0
            _set({
                "progress": pct,
                "status":   "downloading",
                "speed":    _fmt_speed(speed),
                "eta":      _fmt_eta(eta),
            })
        elif d["status"] == "finished":
            _set({"progress": 99, "status": "processing"})

    height     = QUALITY_MAP.get(quality, "720")
    has_ffmpeg = _ffmpeg_available()
    outtmpl    = str(DOWNLOAD_DIR / f"{task_id}.%(ext)s")

    if mode == "audio":
        if has_ffmpeg:
            # Extract and convert to mp3
            fmt = "bestaudio/best"
            postprocessors = [{
                "key":              "FFmpegExtractAudio",
                "preferredcodec":   "mp3",
                "preferredquality": "192",
            }]
            out_ext = "mp3"
        else:
            # Download best audio as-is (m4a/webm) — no conversion needed
            fmt = "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio"
            postprocessors = []
            out_ext = None   # determined after download
    else:
        if has_ffmpeg:
            # Prefer pre-muxed mp4; fall back to merging only if ffmpeg present
            fmt = (
                f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]"
                f"/bestvideo[height<={height}]+bestaudio"
                f"/best[height<={height}]"
                f"/best"
            )
            out_ext = "mp4"
        else:
            # CRITICAL: only request formats that are already muxed (audio+video in one file)
            # This avoids any need for ffmpeg to merge streams
            fmt = (
                f"best[height<={height}][ext=mp4]"
                f"/best[height<={height}]"
                f"/best[ext=mp4]"
                f"/best"
            )
            out_ext = None  # determined after download

    ydl_opts = {
        "format":         fmt,
        "outtmpl":        outtmpl,
        "progress_hooks": [hook],
        "postprocessors": postprocessors if mode == "audio" and has_ffmpeg else [],
        "quiet":          True,
        "no_warnings":    True,
        "noplaylist":     True,
        "socket_timeout": 30,
        "retries":        3,
    }
    # Only set merge_output_format when ffmpeg is present AND we need merging
    if has_ffmpeg and mode == "video":
        ydl_opts["merge_output_format"] = "mp4"

    try:
        with YoutubeDL(ydl_opts) as ydl:
            info     = ydl.extract_info(url, download=True)
            title    = info.get("title", "download")
            thumb    = info.get("thumbnail", "")
            duration = info.get("duration_string", "")
            uploader = info.get("uploader", "")

            # Resolve actual output file
            if out_ext:
                filepath = str(DOWNLOAD_DIR / f"{task_id}.{out_ext}")
            else:
                filepath = ydl.prepare_filename(info)

            # Always fall back to scanning if the expected path doesn't exist
            if not Path(filepath).exists():
                candidates = sorted(DOWNLOAD_DIR.glob(f"{task_id}.*"))
                filepath   = str(candidates[0]) if candidates else filepath

            # Determine display extension from actual file
            actual_ext = Path(filepath).suffix.lstrip(".") if Path(filepath).exists() else (out_ext or "mp4")

        _set({
            "progress":  100,
            "status":    "done",
            "filepath":  filepath,
            "filename":  f"{_safe_filename(title)}.{actual_ext}",
            "title":     title,
            "thumbnail": thumb,
            "duration":  duration,
            "uploader":  uploader,
            "speed":     "",
            "eta":       "",
        })
        log.info("Task %s complete: %s (ffmpeg=%s)", task_id, title, has_ffmpeg)
    except Exception as exc:
        log.error("Task %s failed: %s", task_id, exc)
        _set({"progress": 0, "status": "error", "error": _friendly_error(str(exc))})

def _fmt_speed(bps: float) -> str:
    if not bps:
        return ""
    if bps > 1_000_000:
        return f"{bps/1_000_000:.1f} MB/s"
    return f"{bps/1_000:.0f} KB/s"

def _fmt_eta(sec: int) -> str:
    if not sec:
        return ""
    m, s = divmod(int(sec), 60)
    return f"{m}:{s:02d}"

def _safe_filename(name: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "_", name)[:80]

def _friendly_error(msg: str) -> str:
    m = msg.lower()
    if "sign in" in m or "login" in m or "confirm your age" in m:
        return "This video requires sign-in or age verification. Only public videos are supported."
    if "private video" in m or "is private" in m:
        return "This video is private."
    if "video unavailable" in m or "has been removed" in m or "no longer available" in m:
        return "This video is unavailable or has been removed."
    if "geo" in m or "not available in your country" in m or "blocked" in m:
        return "This video is geo-restricted and cannot be downloaded from this server."
    if "unable to extract" in m or "unsupported url" in m:
        return "This URL is not supported. Make sure it is a direct video link."
    if "http error 429" in m or "too many requests" in m:
        return "Rate limited by the platform. Please wait a minute and try again."
    if "http error 403" in m:
        return "Access denied by the platform. This video may be restricted."
    if "no video formats found" in m or "requested format is not available" in m:
        return "No downloadable format found at this quality. Try a lower quality setting."
    if "merge" in m or "ffmpeg" in m:
        return "Could not process video streams. Try selecting 720p or lower quality."
    if "network" in m or "connection" in m or "timed out" in m:
        return "Network error while downloading. Please try again."
    log.error("Unhandled yt-dlp error: %s", msg)
    return "Download failed. The video may be restricted or the URL invalid."

# ── Routes ────────────────────────────────────────────────────────────────────
@app.middleware("http")
async def no_cache_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"]        = "no-cache"
    response.headers["Expires"]       = "0"
    return response

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/start_task")
async def start_task(
    url:     str = Form(...),
    mode:    str = Form(...),
    quality: str = Form(...),
):
    url     = url.strip()
    mode    = mode.strip().lower()
    quality = quality.strip()

    if not url:
        raise HTTPException(400, "URL is required.")
    if not validate_url(url):
        raise HTTPException(400, "URL not supported. Paste a valid YouTube, Instagram, TikTok, or Vimeo link.")
    if mode not in ("audio", "video"):
        raise HTTPException(400, "Invalid mode.")
    if quality not in QUALITY_MAP:
        raise HTTPException(400, "Invalid quality.")

    task_id  = str(uuid.uuid4())
    platform = detect_platform(url)

    with _store_lock:
        progress_store[task_id] = {
            "progress":   0,
            "status":     "starting",
            "created_at": time.time(),
            "speed":      "",
            "eta":        "",
        }

    threading.Thread(
        target=download_worker,
        args=(task_id, url, mode, quality),
        daemon=True,
    ).start()

    return {"task_id": task_id, "platform": platform}

@app.get("/progress/{task_id}")
async def get_progress(task_id: str):
    with _store_lock:
        data = progress_store.get(task_id)
    if data is None:
        raise HTTPException(404, "Task not found.")
    # Don't expose internal filepath to client
    safe = {k: v for k, v in data.items() if k not in ("filepath", "created_at")}
    return safe

@app.get("/download/{task_id}")
async def download_file(task_id: str):
    with _store_lock:
        info = progress_store.get(task_id)
    if not info or info.get("status") != "done":
        raise HTTPException(404, "File not ready or task unknown.")
    fp = info.get("filepath")
    if not fp or not Path(fp).exists():
        raise HTTPException(404, "File missing on server.")
    return FileResponse(
        fp,
        media_type="application/octet-stream",
        filename=info.get("filename", Path(fp).name),
    )

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
