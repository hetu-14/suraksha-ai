"""
SuRaksha AI · SafeZone detector
--------------------------------
Runs a YOLO model on a looping CNG-station video, detects safety violations,
logs each case, (optionally) notifies the station over WhatsApp, and exposes:

  GET /video   -> annotated MJPEG stream  (embed in the SafeZone admin page)
  GET /events  -> recent detection events as JSON (the page polls this)
  GET /health  -> liveness

Detections out of the box (base COCO model, no extra weights):
  • "Restricted area"  — a person inside the configured restricted polygon
  • "Person detected"  — logged occasionally for demo visibility

Optional PPE / helmet detection: set HELMET_MODEL to a YOLO model whose classes
include something like 'no-helmet' / 'head' / 'helmet' (many free ones exist on
Roboflow / GitHub). Boxes classified as "no helmet"/"head" -> "No helmet" case.

Run:
  pip install -r requirements.txt
  # put your CNG footage here as footage.mp4 (or set FOOTAGE=/path/to/video.mp4)
  python detect.py
Then set NEXT_PUBLIC_SAFEZONE_API=http://localhost:8000 in the web app's .env.local
"""

import os
import json
import time
import threading
import collections
import datetime

import numpy as np
import cv2
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# ---------------- config ----------------
FOOTAGE = os.getenv("FOOTAGE", "footage.mp4")
CAM_NAME = os.getenv("CAM_NAME", "CNG Station · Cam 1")
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8n.pt")
HELMET_MODEL = os.getenv("HELMET_MODEL")  # optional PPE model path
NOTIFY_WEBHOOK = os.getenv("NOTIFY_WEBHOOK")  # e.g. http://localhost:3000/api/notify
COOLDOWN_S = float(os.getenv("COOLDOWN_S", "8"))
# restricted zone as relative [[x,y],...] (0..1). Default = right-hand strip.
RESTRICTED = json.loads(os.getenv("RESTRICTED_ZONE", "[[0.60,0.30],[0.98,0.30],[0.98,0.97],[0.60,0.97]]"))

LOG_FILE = os.getenv("LOG_FILE", "detections.log")

# ---------------- model ----------------
model = None
helmet = None
try:
    from ultralytics import YOLO
    model = YOLO(YOLO_MODEL)
    if HELMET_MODEL:
        helmet = YOLO(HELMET_MODEL)
    print(f"[SafeZone] model loaded: {YOLO_MODEL}" + (f" + helmet {HELMET_MODEL}" if helmet else ""))
except Exception as e:  # pragma: no cover
    print(f"[SafeZone] WARNING: could not load YOLO ({e}). Streaming without detections.")

# ---------------- shared state ----------------
events = collections.deque(maxlen=60)
_lock = threading.Lock()
_frame = None  # latest annotated jpeg bytes
_cooldown = {}


def _log_event(cat: str, conf: float):
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


def _notify(cat: str, ts: str):
    try:
        import requests
        requests.post(
            NOTIFY_WEBHOOK,
            json={"message": f"[SafeZone AI] {cat} detected at {CAM_NAME} ({ts}). Please take action."},
            timeout=6,
        )
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


def _throttled(key: str) -> bool:
    now = time.time()
    if now - _cooldown.get(key, 0) > COOLDOWN_S:
        _cooldown[key] = now
        return True
    return False


def _process_loop():
    global _frame
    frame_i = 0
    while True:
        cap = cv2.VideoCapture(FOOTAGE)
        if not cap.isOpened():
            print(f"[SafeZone] cannot open footage '{FOOTAGE}' — retrying in 3s")
            time.sleep(3)
            continue
        while True:
            ok, frame = cap.read()
            if not ok:
                break  # end of clip -> loop again
            frame_i += 1
            h, w = frame.shape[:2]
            annotated = frame.copy()

            # draw restricted polygon
            pts = np.array([[int(px * w), int(py * h)] for px, py in RESTRICTED], np.int32)
            cv2.polylines(annotated, [pts], True, (60, 60, 230), 2)
            cv2.putText(annotated, "RESTRICTED", (pts[0][0] + 4, pts[0][1] + 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (60, 60, 230), 1)

            if model is not None and frame_i % 2 == 0:  # detect every other frame for speed
                try:
                    res = model(frame, verbose=False)[0]
                    for box in res.boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        if cls == 0 and conf > 0.40:  # person (COCO id 0)
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

                    # optional PPE / helmet model
                    if helmet is not None:
                        hres = helmet(frame, verbose=False)[0]
                        names = hres.names
                        for box in hres.boxes:
                            conf = float(box.conf[0])
                            name = str(names.get(int(box.cls[0]), "")).lower()
                            if conf > 0.45 and ("no" in name and "helmet" in name or name == "head"):
                                x1, y1, x2, y2 = map(int, box.xyxy[0])
                                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
                                cv2.putText(annotated, "NO HELMET", (x1, y1 - 6),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                                if _throttled(f"helmet-{x1 // 60}"):
                                    _log_event("No helmet", conf)
                except Exception as e:
                    print(f"[SafeZone] inference error: {e}")

            # overlay banner
            cv2.rectangle(annotated, (0, 0), (w, 26), (17, 24, 39), -1)
            cv2.putText(annotated, f"SuRaksha AI  |  {CAM_NAME}", (8, 18),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (52, 211, 153), 1)

            ok2, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if ok2:
                with _lock:
                    _frame = buf.tobytes()
            time.sleep(0.03)  # ~30 fps cap
        cap.release()


threading.Thread(target=_process_loop, daemon=True).start()

# ---------------- API ----------------
app = FastAPI(title="SuRaksha SafeZone Detector")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"ok": True, "model": bool(model), "cam": CAM_NAME}


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
    print(f"[SafeZone] serving on http://localhost:{port}  (video/events)")
    uvicorn.run(app, host="0.0.0.0", port=port)
