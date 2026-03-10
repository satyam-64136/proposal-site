# Fetchr — Universal Media Downloader
### Production-ready · FastAPI + yt-dlp · No client installs needed

---

## How It Works

**Users just visit your website and click download. That is it.**

All downloading happens on your server. The server processes the video and sends
the file directly to the browser. Users never install anything.

---

## Server Setup (One Time)

### 1 — Install system dependencies

    # Ubuntu / Debian VPS
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv ffmpeg

ffmpeg runs on your server, not the user machine. It merges video+audio for 1080p/4K.
Without it the app still works — it auto-falls back to pre-muxed formats (720p and below).

### 2 — Deploy

    cd fetchr
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    python app.py
    # App running at http://YOUR_SERVER_IP:8000

### 3 — Keep it running (systemd)

    sudo tee /etc/systemd/system/fetchr.service << EOF
    [Unit]
    Description=Fetchr
    After=network.target
    [Service]
    User=www-data
    WorkingDirectory=/opt/fetchr
    ExecStart=/opt/fetchr/.venv/bin/uvicorn app:app --host 127.0.0.1 --port 8000
    Restart=always
    [Install]
    WantedBy=multi-user.target
    EOF

    sudo systemctl daemon-reload
    sudo systemctl enable --now fetchr

### 4 — Nginx + HTTPS

    sudo apt install -y nginx certbot python3-certbot-nginx

    # /etc/nginx/sites-available/fetchr
    server {
        listen 80;
        server_name yourdomain.com;
        location / {
            proxy_pass http://127.0.0.1:8000;
            proxy_read_timeout 300s;
            proxy_buffering off;
        }
    }

    sudo certbot --nginx -d yourdomain.com

---

## Without ffmpeg

The app auto-detects whether ffmpeg is installed and adjusts format selection:

  360p / 480p / 720p  -> works always
  1080p / 4K          -> needs ffmpeg on server, otherwise falls back
  Audio               -> downloads as .m4a without ffmpeg, .mp3 with ffmpeg

---

## Project Structure

    fetchr/
    app.py               FastAPI backend
    requirements.txt
    templates/index.html Page template
    static/css/          Styles
    static/js/           Frontend JS
    static/icons/        Platform SVGs
    downloads/           Auto-created, files cleaned after 1 hour
