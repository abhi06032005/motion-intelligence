# MotionIQ: Production Deployment & Infrastructure Guide

This guide details deployment procedures, security requirements, WebSocket reverse proxy configurations, and Docker orchestration for **MotionIQ**.

---

## 1. Browser Security & HTTPS Requirements

### 1.1 Camera Access (`getUserMedia`)
Modern web browsers (Google Chrome, Mozilla Firefox, Apple Safari, Microsoft Edge) enforce the W3C Media Capture and Streams standard:
- Camera video streams (`navigator.mediaDevices.getUserMedia`) **only function within Secure Contexts** (`https://`) or on local loopback addresses (`http://localhost` or `http://127.0.0.1`).
- When deploying to production domains (e.g. `https://motioniq.example.com`), **valid TLS/SSL certificates are mandatory**.

### 1.2 Edge Landmark Privacy Architecture
- MediaPipe Pose Landmarker executes entirely on the client's device using WebAssembly (WASM) and WebGL hardware shaders.
- Raw video frames NEVER transit the network and are never written to server disks.
- Only anonymized 3D joint landmark coordinates $(x, y, z, \text{visibility})$ stream over WebSockets.

---

## 2. Docker & Containerized Deployment

MotionIQ provides a production multi-container setup via Docker Compose.

### 2.1 Quickstart with Docker Compose
```bash
# Clone the repository
git clone https://github.com/motioniq/motioniq.git
cd motioniq

# Configure environment variables
cp .env.example .env

# Build and start services
docker compose up -d --build

# Verify container health
docker compose ps
```
- **Frontend**: Accessible at `http://localhost:3000`
- **Backend API**: Accessible at `http://localhost:8000` (Swagger docs at `/docs`)

---

## 3. Reverse Proxy Configuration (Nginx / TLS / WSS)

When deploying behind Nginx or an Application Load Balancer, WebSocket connections require explicit protocol upgrade headers.

### 3.1 Recommended Nginx Configuration
```nginx
# Upstream Definitions
upstream motioniq_frontend {
    server 127.0.0.1:3000;
}

upstream motioniq_backend {
    server 127.0.0.1:8000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name motioniq.example.com;
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name motioniq.example.com;

    ssl_certificate /etc/letsencrypt/live/motioniq.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/motioniq.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Client upload limits for video analysis
    client_max_body_size 100M;

    # Frontend Next.js routes
    location / {
        proxy_pass http://motioniq_frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend REST API
    location /api/ {
        proxy_pass http://motioniq_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Real-Time Kinematics Stream
    location /api/ws/ {
        proxy_pass http://motioniq_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
```

---

## 4. Rate Limiting & Video Ingestion Limits

To safeguard against resource exhaustion:
1. **Frame Ingestion Rate Limiting**: The backend drops frames when inbound frequency exceeds `MAX_FRAMES_PER_SECOND=30` (`ConnectionManager.should_rate_limit`).
2. **File Upload Boundaries**: Video uploads for post-hoc analysis (`/api/upload`) enforce a strict `100 MB` cap and validate MIME types (`video/mp4`, `video/webm`, `video/quicktime`).
3. **Log Scrubbing**: Production logging is restricted to session lifecycle and state transitions; individual joint coordinates and video payloads are never logged.
