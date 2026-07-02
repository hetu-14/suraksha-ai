# SafeZone Detector (Python + YOLO)

Real computer-vision safety monitoring for the SuRaksha AI **SafeZone AI** admin module.
It runs YOLO on a looping CNG-station video, detects violations, logs each case,
optionally fires a WhatsApp notification, and streams the annotated video + events
to the web app.

## 1. Install
```bash
cd detector
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Add footage
Put a CNG-station clip in this folder as **`footage.mp4`** (any mp4 with people works
for the restricted-area demo). Or point to any file:
```bash
# Windows PowerShell
$env:FOOTAGE="C:\path\to\clip.mp4"
```

## 3. Run
```bash
python detect.py
```
Serves on `http://localhost:8000`:
- `GET /video`  — annotated MJPEG stream
- `GET /events` — recent detections (JSON)
- `GET /health` — status

The first run auto-downloads the small `yolov8n.pt` weights (needs internet once).

## 4. Connect the web app
In the web app root, add to `.env.local`:
```
NEXT_PUBLIC_SAFEZONE_API=http://localhost:8000
```
Run `npm run dev` — the SafeZone AI page shows the **live** stream + real detections
(badge flips to “Live detector”). If the detector isn’t running, the page falls back
to a simulated feed automatically.

## Options (env vars)
| Var | Meaning |
|---|---|
| `FOOTAGE` | video path (default `footage.mp4`) |
| `CAM_NAME` | label shown on the stream/events |
| `RESTRICTED_ZONE` | JSON polygon in relative coords, e.g. `[[0.6,0.3],[1,0.3],[1,1],[0.6,1]]` |
| `HELMET_MODEL` | path to a YOLO PPE model to enable **No helmet** detection |
| `NOTIFY_WEBHOOK` | URL to POST `{message}` on each case, e.g. `http://localhost:3000/api/notify` (sends WhatsApp) |
| `COOLDOWN_S` | seconds between repeat alerts for the same spot (default 8) |

### PPE / “No helmet”
The base COCO model detects people (→ restricted-area entry). For helmet/PPE
violations, plug a free hard-hat YOLO model (Roboflow / GitHub) via `HELMET_MODEL`;
boxes classified as `no-helmet`/`head` are logged as **No helmet**.

### Notify the station automatically
Set `NOTIFY_WEBHOOK=http://localhost:3000/api/notify` so every detection also sends
a WhatsApp alert through the app’s AutoNotify pipeline (configure a provider first).
