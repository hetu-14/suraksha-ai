# SafeZone Detector (Python + YOLO)

Real computer-vision safety monitoring for the SuRaksha AI **SafeZone AI** admin module.
Runs YOLO on a video/webcam, detects violations, logs each case, optionally fires a
WhatsApp alert, and streams the annotated video + events to the web app.

Detects out of the box:
- **No helmet** — via a hard-hat PPE model that auto-downloads on first run.
- **Restricted area** — a person inside the configured polygon.

## 1. Install
```bash
cd detector
python -m venv .venv
# Windows:  .venv\Scripts\activate     macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Run

**Webcam demo (nothing to source — best for a live demo):**
```bash
# Windows PowerShell
$env:FOOTAGE="0"; python detect.py
# macOS/Linux
FOOTAGE=0 python detect.py
```
Stand in frame → you're boxed as `person`. Step into the red **RESTRICTED** zone
(right side of frame) → a *Restricted area* case fires. Cover/uncover your head to
trigger the hard-hat model’s **No helmet** detection.

**Video file:**
```bash
# put a CNG clip here as footage.mp4 (or set FOOTAGE=/path/clip.mp4)
python detect.py
```

First run downloads two small models (needs internet once): `yolov8n.pt` (people) and
the hard-hat model (~6 MB) into `models/`.

Server: `http://localhost:8000` → `/video` (MJPEG), `/events` (JSON), `/health`.

## 3. Connect the web app
Add to the web app’s `.env.local`:
```
NEXT_PUBLIC_SAFEZONE_API=http://localhost:8000
```
`npm run dev` → SafeZone AI shows the **live** stream + real detections (badge → “Live
detector”). If the detector isn’t running, the page auto-falls back to a simulation.

## 4. End-to-end: notify the station over WhatsApp
Make each detection also send a WhatsApp alert through the app’s AutoNotify pipeline:
```bash
# configure a WhatsApp provider in the web app's .env.local first (see .env.local.example)
# then run the detector pointed at the app's notify API:
FOOTAGE=0 NOTIFY_WEBHOOK=http://localhost:3000/api/notify python detect.py
```
Every case → logged in `detections.log`, shown in the SafeZone feed, **and** a WhatsApp
message goes out. (If WhatsApp isn’t configured, the webhook call is a harmless no-op.)

## Options (env vars)
| Var | Meaning |
|---|---|
| `FOOTAGE` | `footage.mp4` (default), a path, or `0`/`webcam` for the camera |
| `CAM_NAME` | label shown on the stream/events |
| `RESTRICTED_ZONE` | JSON polygon in relative coords, e.g. `[[0.6,0.3],[1,0.3],[1,1],[0.6,1]]` |
| `HELMET_MODEL` | use your own PPE model instead of the auto-downloaded one |
| `HELMET_AUTODOWNLOAD` | set `0` to disable the hard-hat model download |
| `NOTIFY_WEBHOOK` | URL to POST `{message}` on each case (e.g. the app’s `/api/notify`) |
| `COOLDOWN_S` | seconds between repeat alerts for the same spot (default 8) |
