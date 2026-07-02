"""
SuRaksha AI · SafeZone detector
--------------------------------
Runs YOLO on a CNG-station video (or your webcam), detects safety violations,
logs each case, optionally notifies the station over WhatsApp, and serves:

  GET /video   -> annotated MJPEG stream  (embedded in the SafeZone admin page)
  GET /events  -> recent detection events as JSON (the page polls this)
  GET /health  -> liveness

Detections:
  • "No helmet"       — via an auto-downloaded hard-hat YOLO model (PPE)
  • "Restricted area" — a person inside the configured restricted polygon
  • people are boxed live on the stream

Quick start (webcam — nothing to download but the models):
  pip install -r requirements.txt
  FOOTAGE=0 python detect.py          # uses your webcam; walk in / out of frame

Video file:
  # put a clip as footage.mp4 (or set FOOTAGE=/path/clip.mp4), then:
  python detect.py

Then set NEXT_PUBLIC_SAFEZONE_API=http://localhost:8000 in the web app's .env.local
"""

import os
import json
import time
import threading
import collections
import datetime
import urllib.request

import numpy as np
import cv2
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# ---------------- config ----------------
FOOTAGE = os.getenv("FOOTAGE", "footage.mp4")          # path, or "0"/"webcam" for camera
CAM_NAME = os.getenv("CAM_NAME", "CNG Station · Cam 1")
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")     # person detector (COCO)
NOTIFY_WEBHOOK = os.getenv("NOTIFY_WEBHOOK")           # e.g. http://localhost:3000/api/notify
COOLDOWN_S = float(os.getenv("COOLDOWN_S", "8"))
RESTRICTED = json.loads(os.getenv("RESTRICTED_ZONE", "[[0.60,0.30],[0.98,0.30],[0.98,0.97],[0.60,0.97]]"))
LOG_FILE = os.getenv("LOG_FILE", "detections.log")

# hard-hat / PPE model (auto-downloaded unless HELMET_AUTODOWNLOAD=0)
HELMET_MODEL = os.getenv("HELMET_MODEL")
HELMET_AUTODOWNLOAD = os.getenv("HELMET_AUTODOWNLOAD", "1") != "0"
HARDHAT_URL = os.getenv("HARDHAT_URL", "https://huggingface.co/keremberke/yolov8n-hard-hat-detection/resolve/main/best.pt")


def _resolve_helmet_model():
    if HELMET_MODEL:
        return HELMET_MODEL
    if not HELMET_AUTODOWNLOAD:
        return None
    os.makedirs("models", exist_ok=True)
    dest = os.path.join("models", "hardhat.pt")
    if not os.path.exists(dest):
        try:
            print(f"[SafeZone] downloading hard-hat model -> {dest} (once) ...")
            urllib.request.urlretrieve(HARDHAT_URL, dest)
        except Exception as e:  # pragma: no cover
            print(f"[SafeZone] hard-hat model download failed ({e}); 'No helmet' disabled.")
            return None
    return dest


# ---------------- models ----------------
model = None
helmet = None
try:
    from ultralytics import YOLO
    model = YOLO(YOLO_MODEL)
    hp = _resolve_helmet_model()
    if hp:
        helmet = YOLO(hp)
    print(f"[SafeZone] models ready: person={YOLO_MODEL}" + (f", helmet={hp}" if helmet else " (no helmet model)"))
except Exception as e:  # pragma: no cover
    print(f"[SafeZone] WARNING: could not load YOLO ({e}). Streaming without detections.")

# ---------------- shared state ----------------
events = collections.deque(maxlen=60)
_lock = threading.Lock()
_frame = None
_cooldown = {}


def _log_event(cat, conf):
    ev = {
        "id": int(time.time() * 1000) % 100_000_000,
        "cat": cat,
        "cam": CAM_NAME,
        "conf": round(float(conf), 2),
        "ts": datetime.datetime.now().isoformat(timespec="seconds"),
    }
    with _lock:
        events.appendleft(ev)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(ev) + "\n")
    except Exception:
        pass
    print(f"[SafeZone] {ev['ts']}  {cat}  ({conf:.2f})  @ {CAM_NAME}")
    if NOTIFY_WEBHOOK:
        threading.Thread(target=_notify, args=(cat, ev["ts"]), daemon=True).start()


def _notify(cat, ts):
    try:
        import requests
        r = requests.post(
            NOTIFY_WEBHOOK,
            json={"message": f"[SafeZone AI] {cat} detected at {CAM_NAME} ({ts}). Please take action."},
            timeout=6,
        )
        print(f"[SafeZone] station notified ({cat}) -> {r.status_code}")
    except Exception as e:
        print(f"[SafeZone] notify failed: {e}")


def _point_in_poly(x, y, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi):
            inside = not inside
        j = i
    return inside


def _throttled(key):
    now = time.time()
    if now - _cooldown.get(key, 0) > COOLDOWN_S:
        _cooldown[key] = now
        return True
    return False


def _open_source():
    src = str(FOOTAGE).strip().lower()
    if src in ("0", "1", "2", "webcam", "cam"):
        idx = int(src) if src.isdigit() else 0
        print(f"[SafeZone] source: webcam #{idx}")
        return cv2.VideoCapture(idx), True
    print(f"[SafeZone] source: file '{FOOTAGE}'")
    return cv2.VideoCapture(FOOTAGE), False


def _process_loop():
    global _frame
    frame_i = 0
    while True:
        cap, is_webcam = _open_source()
        if not cap.isOpened():
            print(f"[SafeZone] cannot open source '{FOOTAGE}' — retrying in 3s")
            time.sleep(3)
            continue
        while True:
            ok, frame = cap.read()
            if not ok:
                break  # file: end -> loop; webcam: transient -> reopen
            frame_i += 1
            h, w = frame.shape[:2]
            annotated = frame.copy()

            pts = np.array([[int(px * w), int(py * h)] for px, py in RESTRICTED], np.int32)
            cv2.polylines(annotated, [pts], True, (60, 60, 230), 2)
            cv2.putText(annotated, "RESTRICTED", (pts[0][0] + 4, pts[0][1] + 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 60, 230), 1)

            if model is not None and frame_i % 2 == 0:
                try:
                    res = model(frame, verbose=False)[0]
                    for box in res.boxes:
                        if int(box.cls[0]) != 0:
                            continue
                        conf = float(box.conf[0])
                        if conf <= 0.40:
                            continue
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        cx, cy = (x1 + x2) / 2 / w, y2 / h
                        color, label = (0, 200, 0), "person"
                        if _point_in_poly(cx, cy, RESTRICTED):
                            color, label = (0, 0, 255), "RESTRICTED AREA"
                            if _throttled(f"restricted-{x1 // 60}"):
                                _log_event("Restricted area", conf)
                        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                        cv2.putText(annotated, f"{label} {conf:.2f}", (x1, y1 - 6),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                    if helmet is not None:
                        hres = helmet(frame, verbose=False)[0]
                        names = hres.names
                        for box in hres.boxes:
                            conf = float(box.conf[0])
                            if conf < 0.45:
                                continue
                            name = str(names.get(int(box.cls[0]), "")).lower()
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            no_helmet = (("no" in name) and ("helmet" in name or "hardhat" in name)) or name == "head"
                            is_helmet = ("helmet" in name or "hardhat" in name) and "no" not in name
                            if no_helmet:
                                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
                                cv2.putText(annotated, "NO HELMET", (x1, y1 - 6),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                                if _throttled(f"helmet-{x1 // 60}"):
                                    _log_event("No helmet", conf)
                            elif is_helmet:
                                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 200, 0), 1)
                except Exception as e:
                    print(f"[SafeZone] inference error: {e}")

            cv2.rectangle(annotated, (0, 0), (w, 26), (17, 24, 39), -1)
            cv2.putText(annotated, f"SuRaksha AI  |  {CAM_NAME}", (8, 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (52, 211, 153), 1)

            ok2, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if ok2:
                with _lock:
                    _frame = buf.tobytes()
            time.sleep(0.03)
        cap.release()
        if is_webcam:
            time.sleep(1)


threading.Thread(target=_process_loop, daemon=True).start()

# ---------------- API ----------------
app = FastAPI(title="SuRaksha SafeZone Detector")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"ok": True, "person_model": bool(model), "helmet_model": bool(helmet), "cam": CAM_NAME}


@app.get("/events")
def get_events():
    with _lock:
        return JSONResponse(list(events))


def _mjpeg():
    while True:
        with _lock:
            f = _frame
        if f is not None:
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + f + b"\r\n"
        time.sleep(0.05)


@app.get("/video")
def video():
    return StreamingResponse(_mjpeg(), media_type="multipart/x-mixed-replace; boundary=frame")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"[SafeZone] serving on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
