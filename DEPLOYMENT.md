# CodeLearn — Deployment Guide

**On-Premise Deployment for Schools & Classrooms**

This guide covers how to deploy CodeLearn in a classroom environment using a local Hub server (Raspberry Pi or school PC) with no internet required.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Raspberry Pi Hub Setup](#raspberry-pi-hub-setup)
3. [School PC Setup (Linux/Windows)](#school-pc-setup)
4. [Docker Deployment](#docker-deployment)
5. [WiFi Access Point Configuration](#wifi-access-point-configuration)
6. [How Students Connect](#how-students-connect)
7. [Content Management](#content-management)
8. [Offline Operation](#offline-operation)
9. [Sync Mechanism](#sync-mechanism)
10. [Security](#security)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/johnniedom/codelearn.git
cd codelearn

# Install dependencies
pnpm install

# Build for production
pnpm build

# Preview locally
pnpm preview
```

The production build is output to `dist/` — this is the entire application, ready to be served by any static file server.

---

## Raspberry Pi Hub Setup

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Board | Raspberry Pi 4 (2GB) | Raspberry Pi 5 (4GB) |
| Storage | 16GB microSD (Class 10) | 32GB+ microSD or USB SSD |
| Power | Official 5V/3A adapter | Official 5V/5A (Pi 5) |
| Network | USB WiFi adapter | Built-in WiFi + external WiFi AP |
| Cost | ~$35 | ~$60 |

### Step 1: Install Raspberry Pi OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Flash **Raspberry Pi OS Lite (64-bit)** to your microSD card
3. Enable SSH during setup (click the gear icon in Imager)
4. Insert the SD card and boot the Pi

### Step 2: Initial System Setup

```bash
# Update the system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git nginx
```

### Step 3: Install Node.js 18+

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Verify installation
node --version   # Should be 18.x or higher
pnpm --version
```

### Step 4: Clone and Build CodeLearn

```bash
# Clone the repository
cd /opt
sudo git clone https://github.com/johnniedom/codelearn.git
sudo chown -R $USER:$USER codelearn
cd codelearn

# Install dependencies and build
pnpm install
pnpm build
```

### Step 5: Configure Nginx

Create the Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/codelearn
```

Paste the following:

```nginx
server {
    listen 80;
    server_name codelearn.local _;

    root /opt/codelearn/dist;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # Cache static assets aggressively
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Cache Pyodide WASM files
    location ~* \.(wasm|data)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - never cache
    location /sw.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # SPA fallback - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/codelearn /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 6: Set Up as System Service

CodeLearn's frontend is fully static (served by Nginx). No additional Node.js service is needed for the PWA itself.

To enable automatic startup:

```bash
sudo systemctl enable nginx
```

The Hub server is now ready. Students can access CodeLearn at `http://<pi-ip-address>/` or `http://codelearn.local/` if mDNS is configured.

### Step 7: Configure mDNS (Optional)

Allow devices to find the Hub at `codelearn.local`:

```bash
sudo apt install -y avahi-daemon
sudo systemctl enable avahi-daemon

# The Pi will now be discoverable as codelearn.local
```

---

## School PC Setup

### Linux

Follow the same steps as the Raspberry Pi setup. Any Linux machine with Node.js 18+ and Nginx works.

### Windows

1. Install [Node.js 18+](https://nodejs.org/)
2. Install pnpm: `npm install -g pnpm`
3. Clone and build:
   ```powershell
   git clone https://github.com/johnniedom/codelearn.git
   cd codelearn
   pnpm install
   pnpm build
   ```
4. Serve the `dist/` folder using any static server:
   ```powershell
   # Option 1: Using the built-in preview server
   pnpm preview --host 0.0.0.0

   # Option 2: Using a lightweight static server
   npx serve dist -l 80
   ```
5. Students connect to `http://<pc-ip-address>/`

---

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS build

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf (for Docker)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /sw.js {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Build and Run

```bash
docker build -t codelearn .
docker run -d -p 80:80 --name codelearn --restart unless-stopped codelearn
```

### Docker Compose

```yaml
version: '3.8'
services:
  codelearn:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    volumes:
      - ./content:/usr/share/nginx/html/content
```

---

## WiFi Access Point Configuration

For a fully offline classroom, set up the Raspberry Pi (or a dedicated router) as a WiFi access point.

### Option A: Dedicated WiFi Router (Recommended)

1. Connect the Raspberry Pi to the router via Ethernet
2. Configure the router's WiFi:
   - **SSID:** `CodeLearn Classroom`
   - **Password:** Set a classroom password
   - **DHCP:** Enabled (automatic IP assignment)
3. Students connect to the WiFi and navigate to the Hub's IP

### Option B: Raspberry Pi as Access Point

```bash
# Install required packages
sudo apt install -y hostapd dnsmasq

# Configure hostapd
sudo nano /etc/hostapd/hostapd.conf
```

```
interface=wlan0
ssid=CodeLearn Classroom
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
wpa=2
wpa_passphrase=learntocode
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
```

```bash
# Configure dnsmasq for DHCP
sudo nano /etc/dnsmasq.conf
```

```
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.50,255.255.255.0,24h
address=/codelearn.local/192.168.4.1
```

```bash
# Configure static IP for wlan0
sudo nano /etc/dhcpcd.conf
```

Add:
```
interface wlan0
static ip_address=192.168.4.1/24
nohook wpa_supplicant
```

```bash
# Enable and start services
sudo systemctl unmask hostapd
sudo systemctl enable hostapd dnsmasq
sudo reboot
```

After reboot, students connect to **"CodeLearn Classroom"** WiFi and open `http://192.168.4.1/` or `http://codelearn.local/`.

---

## How Students Connect

1. **Join the classroom WiFi** — connect to the Hub's network (e.g., "CodeLearn Classroom")
2. **Open any browser** — Chrome, Firefox, Safari, or Edge
3. **Navigate to the Hub** — enter `http://codelearn.local/` or the Hub's IP address
4. **PWA auto-installs** — the Service Worker caches the entire application on first visit (~15MB)
5. **Create a profile** — set up name, PIN, and optional Pattern Lock
6. **Start learning** — all content is now available offline

### Shared Device Support

Multiple students can use the same device:
- Each student creates their own profile
- Switch profiles from the login screen
- Each profile has isolated progress and data
- PIN + Pattern Lock prevents unauthorized access

---

## Content Management

### Built-in CMS

Teachers and content authors can create content directly in CodeLearn:

1. Log in with an **author** or **admin** role
2. Navigate to **CMS** from the dashboard
3. Create lessons (Markdown), quizzes (MCQ/fill-blank), and code exercises
4. Publish content to make it available to students

### Loading Content Packages

Content can be distributed to Hubs via:
- **Direct download** — if the Hub has internet access temporarily
- **USB drive** — copy content packages to the Hub's content directory
- **SD card** — swap SD cards between Hubs to share content

Content packages are JSON bundles containing:
- Course structure and metadata
- Lesson content (Markdown)
- Quiz questions and answers
- Code exercise templates and test cases
- Associated assets (images, etc.)

### Pre-loaded Content

The default build includes sample content:
- **Python Basics Course** — 15 lessons from variables to functions
- **5 Quizzes** — fundamentals, control flow, and loops
- **Code Exercises** — Python and JavaScript challenges

---

## Offline Operation

CodeLearn is designed to work without internet for **30+ days**.

### What Works Offline

- ✅ All lessons and course content
- ✅ Code editor (Python via Pyodide, JavaScript)
- ✅ Quizzes and assessments
- ✅ Progress tracking
- ✅ Profile management and authentication
- ✅ Content authoring (CMS)
- ✅ Notifications (local)

### How Offline Storage Works

| Storage Type | Size | Purpose |
|-------------|------|---------|
| Service Worker Cache | ~15MB | Application code, Pyodide WASM, fonts |
| IndexedDB | ~100MB/user | User data, progress, content, sync queue |
| LocalStorage | ~1MB | Session state, HLC clock, preferences |

### Data Retention

- **Service Worker cache** — persists until manually cleared or storage pressure
- **IndexedDB data** — persists indefinitely (30+ days guaranteed)
- **Progress data** — never lost unless user explicitly deletes profile

---

## Sync Mechanism

When students reconnect to the Hub WiFi, their progress syncs automatically.

### How Sync Works

1. **Student makes a change** — completes a lesson, takes a quiz, writes code
2. **Delta created** — a SyncDelta is generated with an HLC timestamp and SHA-256 checksum
3. **Queued locally** — delta stored in IndexedDB SyncQueue (persists across sessions)
4. **Hub available?** — device checks for Hub connectivity
   - **Online:** Deltas sent to Hub via `POST /api/sync`
   - **Offline:** Deltas stay in queue, auto-sync when back online
5. **Hub processes** — accepts/rejects deltas, sends back changes from other devices
6. **Conflict resolution** — Last-Write-Wins (LWW) using HLC timestamps + device ID tiebreaking
7. **Complete** — local IndexedDB updated, sync queue cleared

### Sync Status Indicators

Students see friendly status icons:
- 💾 **Saved here** — data stored locally
- ⏳ **Waiting to share** — queued for sync
- 🔄 **Sharing now** — sync in progress
- ✅ **Shared with class** — synced to Hub
- ⚠️ **Problem sharing** — sync failed, will retry

### Sync Constraints

| Parameter | Value |
|-----------|-------|
| Max deltas per request | 50 |
| Max payload size | 512KB |
| Max retry attempts | 5 |
| Queue retention | 30 days |
| Max items per user | 1,000 |
| Auto-sync interval | 30 seconds |

---

## Security

### Authentication

- **PIN Authentication** — 4-8 digit PIN, hashed with Argon2id (OWASP recommended)
- **Pattern Lock MFA** — 9-dot grid pattern as second factor
- **Role-Based Access Control:**
  - `student` — access lessons, quizzes, workbench
  - `author` — all student permissions + CMS content creation
  - `admin` — full system access

### Data Protection

| Feature | Implementation |
|---------|---------------|
| Credential encryption | AES-256-GCM |
| Password hashing | Argon2id |
| Data integrity | SHA-256 hash chain + HMAC signatures |
| Sync integrity | SHA-256 checksums on all deltas |
| Profile isolation | Separate IndexedDB entries per user |

### Session Security

| Trigger | Action |
|---------|--------|
| 30 minutes idle | Lock (require PIN) |
| 8 hours max session | End session |
| Tab hidden > 5 minutes | Lock |
| 45-day credential age | Warning → Read-only → Locked |

### Network Security

- All data stays on the local network — no external cloud dependency
- Hub communicates only with devices on the classroom WiFi
- No student data leaves the school premises
- Optional: Configure the WiFi router with WPA2/WPA3 encryption

---

## Monitoring & Maintenance

### Updating CodeLearn

```bash
cd /opt/codelearn

# Pull latest changes
git pull origin main

# Rebuild
pnpm install
pnpm build

# Nginx serves the new build immediately (no restart needed for static files)
```

### Storage Management

Monitor SD card / disk usage:

```bash
# Check disk usage
df -h

# Check CodeLearn build size
du -sh /opt/codelearn/dist/

# Check IndexedDB data (stored in browser, not on disk)
# Students can check their storage usage in Settings
```

### Backup

```bash
# Backup the entire CodeLearn installation
tar -czf codelearn-backup-$(date +%Y%m%d).tar.gz /opt/codelearn/

# Backup content only
tar -czf codelearn-content-$(date +%Y%m%d).tar.gz /opt/codelearn/dist/content/
```

---

## Troubleshooting

### Students can't connect to the Hub

1. **Check WiFi** — ensure the student device is connected to the classroom WiFi
2. **Check Nginx** — `sudo systemctl status nginx`
3. **Check IP** — run `hostname -I` on the Pi to verify the IP address
4. **Try IP directly** — navigate to `http://<pi-ip>` instead of `codelearn.local`
5. **Firewall** — ensure port 80 is open: `sudo ufw allow 80`

### PWA not installing / updating

1. **Hard refresh** — Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache** — Browser Settings → Clear browsing data → Cached images and files
3. **Check Service Worker** — Browser DevTools → Application → Service Workers
4. **Check HTTPS note** — PWA install requires HTTPS in production, but works on `localhost` and local IPs for development

### Pyodide (Python) not loading

1. **First load requires ~10MB download** — ensure the device connected to Hub long enough
2. **Check RAM** — Pyodide needs 4GB+ RAM; older devices may struggle
3. **Check cache** — Browser DevTools → Application → Cache Storage → look for Pyodide files

### Sync not working

1. **Check Hub URL** — Settings → Hub URL should be set to the Hub's address
2. **Check connectivity** — sync only works when connected to Hub WiFi
3. **Check sync queue** — sync status indicator shows pending items
4. **Force retry** — Settings → Sync → Retry failed items

### Low storage warning

1. **Check IndexedDB usage** — Settings → Storage
2. **Clear old profiles** — remove unused student profiles
3. **Clear browser cache** — if storage is critically low

---

## Architecture Reference

For detailed technical architecture documentation, see:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Full system architecture
- [`docs/diagrams/`](docs/diagrams/) — Architecture diagrams

---

*CodeLearn — IEEE CS Africa Sustainable Classroom Challenge 2025*
*Modebe C. Johnnie & Bertrand R. Oluoma | Nnamdi Azikiwe University, Awka*
