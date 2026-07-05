"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, Badge } from "@/components/ui";
import {
  Video, HardHat, ShieldAlert, Flame, UserX, ScanEye, Camera,
  CheckCircle2, Bell, Wifi, WifiOff, AlertTriangle, User,
  Clock, ChevronRight, X, UserCheck, BarChart3, ClipboardList,
  Filter, ZapOff, Zap, Eye, Maximize2, Minimize2, Moon, Sun,
  ZoomIn, ZoomOut, Download, RotateCcw, Activity, Shield,
  Phone, FileText, Search, AlertOctagon, CalendarClock,
  TrendingUp, XSquare, Timer, MapPin, Siren, Radio,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type ThreatLevel = "normal" | "elevated" | "high" | "critical";
type Sev         = "High" | "Medium" | "Low";
type Cat         = "No helmet" | "No safety vest" | "Restricted area" | "Ignition source" | "Loitering" | "Person detected";
type AlertStatus = "open" | "acknowledged" | "assigned" | "investigating" | "resolved" | "false_positive";

type BBox = { x: number; y: number; w: number; h: number; label: string; conf: number; color: string };

type SafeAlert = {
  id: number; cat: Cat; cam: string; camId: number; zone: string;
  ts: number; status: AlertStatus; severity: Sev;
  officer?: string; notes: string[];
  acknowledgedAt?: number; assignedAt?: number; resolvedAt?: number;
  escalated?: boolean;
};

type Officer = {
  id: string; name: string; initials: string; zone: string; phone: string;
  status: "on-duty" | "responding" | "off-duty" | "break"; assigned: number;
};

type Incident = {
  id: string; alertId: number; cat: Cat; cam: string; zone: string;
  severity: Sev; openedAt: number; resolvedAt: number; durationSec: number;
  officer: string; notes: string[];
};

type PatrolEntry = { id: number; officer: string; cam: string; zone: string; ts: number; note: string; flagged: boolean };
type PatrolSlot  = { id: number; zone: string; officer: string; timeStr: string; status: "pending" | "in-progress" | "completed" | "missed" };

// ── Constants ─────────────────────────────────────────────────────────────────

// Verified Wikimedia Commons public-domain WebM videos (HTTP 200, CORS-open)
const VIDEO_SRCS = [
  "https://upload.wikimedia.org/wikipedia/commons/5/58/Gau-Bischofsheim_-_Eine_Minute_an_der_L_415.webm",
  "https://upload.wikimedia.org/wikipedia/commons/9/99/Ongoing_road_construction_in_the_21st_century_%28Duisburg%2C_Germany%29.webm",
  "https://upload.wikimedia.org/wikipedia/commons/b/b9/Autobahnkreuz_K%C3%B6ln_West_%E2%80%93_Video_aus_der_Luft_%E2%80%93_September_2020.webm",
  "https://upload.wikimedia.org/wikipedia/commons/d/d7/K%C3%B6ln_West%2C_Ausfahrt_A4_Klettenberg%2C_von_oben._M%C3%A4rz_2024.webm",
  "https://upload.wikimedia.org/wikipedia/commons/8/82/Cars_driving_at_night.webm",
  "https://upload.wikimedia.org/wikipedia/commons/2/2e/Aerial_video_of_the_aftermath_of_the_flood_in_Aqqala.webm",
];

const CAT_META: Record<Cat, { tone: "red" | "amber" | "sky"; icon: typeof HardHat; sev: Sev; color: string }> = {
  "No helmet":       { tone: "red",   icon: HardHat,    sev: "High",   color: "#ef4444" },
  "No safety vest":  { tone: "amber", icon: ShieldAlert, sev: "Medium", color: "#f59e0b" },
  "Restricted area": { tone: "red",   icon: UserX,       sev: "High",   color: "#ef4444" },
  "Ignition source": { tone: "red",   icon: Flame,       sev: "High",   color: "#dc2626" },
  "Loitering":       { tone: "sky",   icon: UserX,       sev: "Low",    color: "#0ea5e9" },
  "Person detected": { tone: "sky",   icon: User,        sev: "Low",    color: "#0ea5e9" },
};

const CAMERAS = [
  { id: 0, name: "Mother Station · Naroda",  zone: "Zone A", risk: "High",   fps: 25, res: "1080p" },
  { id: 1, name: "CNG Station · Vastral",    zone: "Zone B", risk: "Medium", fps: 20, res: "720p"  },
  { id: 2, name: "CGS · Odhav",              zone: "Zone C", risk: "High",   fps: 30, res: "1080p" },
  { id: 3, name: "CNG Station · Bopal",      zone: "Zone D", risk: "Low",    fps: 20, res: "720p"  },
  { id: 4, name: "Compressor Room · Naroda", zone: "Zone A", risk: "High",   fps: 25, res: "4K"    },
  { id: 5, name: "Gate Entry · Vatva",       zone: "Zone E", risk: "Medium", fps: 15, res: "720p"  },
];

const ZONES = [
  { id: "Zone A", label: "Naroda Station",  cameras: [0, 4], baseRisk: 72 },
  { id: "Zone B", label: "Vastral CNG",     cameras: [1],    baseRisk: 44 },
  { id: "Zone C", label: "Odhav CGS",       cameras: [2],    baseRisk: 63 },
  { id: "Zone D", label: "Bopal Station",   cameras: [3],    baseRisk: 28 },
  { id: "Zone E", label: "Vatva Gate",      cameras: [5],    baseRisk: 51 },
];

const SEED_OFFICERS: Officer[] = [
  { id: "OF-01", name: "Ramesh Patel",   initials: "RP", zone: "Zone A", phone: "+91 98765 43210", status: "on-duty",    assigned: 0 },
  { id: "OF-02", name: "Sunil Mehta",    initials: "SM", zone: "Zone B", phone: "+91 98765 43211", status: "responding", assigned: 1 },
  { id: "OF-03", name: "Kavita Shah",    initials: "KS", zone: "Zone C", phone: "+91 98765 43212", status: "on-duty",    assigned: 0 },
  { id: "OF-04", name: "Dinesh Kumar",   initials: "DK", zone: "Zone D", phone: "+91 98765 43213", status: "off-duty",   assigned: 0 },
  { id: "OF-05", name: "Anjali Trivedi", initials: "AT", zone: "Zone E", phone: "+91 98765 43214", status: "on-duty",    assigned: 0 },
];

const SEED_SCHEDULE: PatrolSlot[] = [
  { id: 1, zone: "Zone A", officer: "Ramesh Patel",   timeStr: "08:00", status: "completed"   },
  { id: 2, zone: "Zone C", officer: "Kavita Shah",    timeStr: "09:00", status: "completed"   },
  { id: 3, zone: "Zone B", officer: "Sunil Mehta",    timeStr: "10:00", status: "in-progress" },
  { id: 4, zone: "Zone E", officer: "Anjali Trivedi", timeStr: "11:00", status: "pending"     },
  { id: 5, zone: "Zone A", officer: "Ramesh Patel",   timeStr: "14:00", status: "pending"     },
  { id: 6, zone: "Zone D", officer: "Dinesh Kumar",   timeStr: "16:00", status: "pending"     },
];

const SEED_INCIDENTS: Incident[] = [
  { id: "INC-001", alertId: 101, cat: "Ignition source", cam: "Mother Station · Naroda", zone: "Zone A", severity: "High",   openedAt: Date.now()-7200000, resolvedAt: Date.now()-6793000, durationSec: 407, officer: "Ramesh Patel",   notes: ["Welding equipment found near gas line — contractor alerted", "Area cleared and permit revoked"] },
  { id: "INC-002", alertId: 102, cat: "No helmet",       cam: "CGS · Odhav",            zone: "Zone C", severity: "High",   openedAt: Date.now()-3600000, resolvedAt: Date.now()-3380000, durationSec: 220, officer: "Kavita Shah",    notes: ["Contract worker — PPE issued on site, warning logged"] },
  { id: "INC-003", alertId: 103, cat: "Restricted area", cam: "CNG Station · Vastral",  zone: "Zone B", severity: "Medium", openedAt: Date.now()-1800000, resolvedAt: Date.now()-1680000, durationSec: 120, officer: "Sunil Mehta",    notes: ["Unauthorized visitor — escorted out, access log updated"] },
];

const SIM_CATS: Cat[] = ["No helmet", "No safety vest", "Restricted area", "Ignition source", "Loitering"];
const HOURLY = [0, 0, 1, 0, 0, 2, 4, 8, 12, 15, 11, 9, 6, 10, 13, 16, 14, 9, 7, 4, 3, 1, 0, 0];
const API    = process.env.NEXT_PUBLIC_SAFEZONE_API || "http://localhost:8000";

const TONE_BG: Record<string, string> = {
  red:   "bg-red-50 text-red-600 border-red-200",
  amber: "bg-amber-50 text-amber-600 border-amber-200",
  sky:   "bg-sky-50 text-sky-600 border-sky-200",
};

const STATUS_META: Record<AlertStatus, { label: string; color: string; step: number }> = {
  open:          { label: "Open",          color: "text-red-600 bg-red-50 border-red-200",         step: 0 },
  acknowledged:  { label: "Acknowledged",  color: "text-orange-600 bg-orange-50 border-orange-200", step: 1 },
  assigned:      { label: "Assigned",      color: "text-amber-700 bg-amber-50 border-amber-200",    step: 2 },
  investigating: { label: "Investigating", color: "text-violet-600 bg-violet-50 border-violet-200", step: 3 },
  resolved:      { label: "Resolved",      color: "text-brand-600 bg-brand-50 border-brand-200",    step: 4 },
  false_positive:{ label: "False Positive",color: "text-ink-500 bg-ink-50 border-ink-200",          step: 4 },
};

const THREAT_META: Record<ThreatLevel, { label: string; dot: string; banner: string; kpi: string }> = {
  normal:   { label: "All Clear",  dot: "bg-brand-500", banner: "hidden",                                                         kpi: "text-brand-600"  },
  elevated: { label: "Elevated",   dot: "bg-amber-500", banner: "bg-amber-50 border-amber-200 text-amber-800",                    kpi: "text-amber-600"  },
  high:     { label: "High Alert", dot: "bg-orange-500",banner: "bg-orange-50 border-orange-300 text-orange-900",                 kpi: "text-orange-600" },
  critical: { label: "CRITICAL",   dot: "bg-red-600 animate-ping",    banner: "bg-red-600 text-white border-red-700 animate-pulse", kpi: "text-red-600"    },
};

let nextId       = 10;
let incidentSeq  = SEED_INCIDENTS.length + 1;

// ── Helpers ───────────────────────────────────────────────────────────────────

function rel(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

function durFmt(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  return m < 60 ? `${m}m ${sec % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtClock(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function computeThreatLevel(alerts: SafeAlert[]): ThreatLevel {
  const active     = alerts.filter((a) => !["resolved", "false_positive"].includes(a.status));
  const highCount  = active.filter((a) => a.severity === "High").length;
  const hasIgnition = active.some((a) => a.cat === "Ignition source");
  if (hasIgnition && highCount >= 2)         return "critical";
  if (hasIgnition || highCount >= 3)         return "high";
  if (highCount >= 1 || active.length >= 3)  return "elevated";
  return "normal";
}

const sevBadge: Record<Sev, "red" | "amber" | "sky"> = { High: "red", Medium: "amber", Low: "sky" };

// ── CameraFeed Component ──────────────────────────────────────────────────────

function CameraFeed({
  camId, videoUrl, flaggedColor, focused, nightVision, bboxes, offline,
}: {
  camId: number; videoUrl: string; flaggedColor: string | null;
  focused: boolean; nightVision: boolean; bboxes: BBox[]; offline: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [err,    setErr]    = useState(false);
  const [now,    setNow]    = useState(Date.now());
  const cam = CAMERAS[camId];

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const h          = focused ? "h-56 md:h-72" : "h-28 sm:h-32";
  const vidFilter  = nightVision
    ? "grayscale(1) brightness(0.5) contrast(1.6) sepia(0.3)"
    : "grayscale(0.65) contrast(1.25) brightness(0.78) saturate(0.6)";
  const nightTint  = nightVision ? "rgba(0,255,80,0.10)" : "transparent";

  return (
    <div className={`relative bg-black ${h} overflow-hidden select-none`}>
      {!err && (
        <video autoPlay muted loop playsInline
          onLoadedData={() => setLoaded(true)} onError={() => setErr(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          style={{ filter: vidFilter }}>
          <source src={videoUrl} type={videoUrl.endsWith(".webm") ? "video/webm" : "video/mp4"} />
        </video>
      )}
      {!loaded && !err && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-1.5">
          <div className="h-3.5 w-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-[9px] text-brand-400/80 font-mono animate-pulse">CONNECTING…</span>
        </div>
      )}
      {(err || offline) && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-1">
          <Camera className="w-4 h-4 text-slate-600" />
          <span className="text-[9px] text-slate-500 font-mono">SIGNAL LOST</span>
        </div>
      )}
      {/* overlays */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: nightTint }} />
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.55) 100%)" }} />
      {/* HUD text */}
      <div className={`absolute top-1.5 left-2 z-20 font-mono text-[9px] ${nightVision ? "text-green-400" : "text-white/80"}`}>{fmtClock(now)}</div>
      {loaded && <div className={`absolute top-1.5 right-7 z-20 font-mono text-[8px] ${nightVision ? "text-green-400/70" : "text-white/50"}`}>{cam.res}·{cam.fps}fps</div>}
      <div className="absolute top-1.5 right-2 z-20 flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        {focused && <span className={`text-[8px] font-bold ${nightVision ? "text-green-300" : "text-red-300"}`}>REC</span>}
      </div>
      <div className={`absolute bottom-1.5 left-2 z-20 font-mono text-[8px] ${nightVision ? "text-green-400/60" : "text-white/40"}`}>CAM-{String(camId+1).padStart(2,"0")}</div>
      {nightVision && <div className="absolute bottom-1.5 right-2 z-20 text-[8px] font-bold text-green-400 font-mono">NV</div>}
      {/* AI boxes */}
      {bboxes.map((b, i) => (
        <div key={i} className="absolute z-30 pointer-events-none transition-all duration-500"
          style={{ left:`${b.x}%`, top:`${b.y}%`, width:`${b.w}%`, height:`${b.h}%`, border:`2px solid ${b.color}`, boxShadow:`0 0 6px ${b.color}55` }}>
          <span className="absolute -top-4 left-0 text-[8px] font-bold px-1 py-0.5 rounded whitespace-nowrap" style={{ background:b.color, color:"#fff" }}>
            {b.label} {(b.conf*100).toFixed(0)}%
          </span>
          <span className="absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2" style={{ borderColor:b.color }} />
          <span className="absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2" style={{ borderColor:b.color }} />
          <span className="absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2" style={{ borderColor:b.color }} />
          <span className="absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2" style={{ borderColor:b.color }} />
        </div>
      ))}
      {flaggedColor && (
        <div className="absolute inset-0 pointer-events-none z-20 animate-pulse"
          style={{ boxShadow:`inset 0 0 14px ${flaggedColor}99`, border:`2px solid ${flaggedColor}` }} />
      )}
      {/* HUD corners */}
      <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-brand-400/50 z-10" />
      <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-brand-400/50 z-10" />
      <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-brand-400/50 z-10" />
      <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-brand-400/50 z-10" />
    </div>
  );
}

// ── Hourly chart ──────────────────────────────────────────────────────────────

function HourlyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const now = new Date().getHours();
  return (
    <div className="flex items-end gap-0.5 h-16 w-full">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center group relative">
          <div className={`w-full rounded-t transition-all ${i===now?"bg-brand-500":v>10?"bg-red-400/80":v>5?"bg-amber-400/80":"bg-slate-200"}`}
            style={{ height:`${(v/max)*100}%`, minHeight:v>0?2:0 }} />
          {v>0 && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[9px] px-1 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              {String(i).padStart(2,"0")}:00 — {v}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Alert lifecycle step bar ──────────────────────────────────────────────────

function StepBar({ status }: { status: AlertStatus }) {
  const steps = ["Open","Ack","Assigned","Active","Done"];
  const step  = STATUS_META[status].step;
  const done  = ["resolved","false_positive"].includes(status);
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`h-1.5 rounded-full transition-all ${i <= step ? (done?"bg-brand-400":i===step?"bg-amber-500":"bg-amber-300") : "bg-ink-100"}`}
            style={{ width: i === 0 ? 18 : 14 }} />
        </div>
      ))}
      <span className="text-[9px] text-ink-400 ml-1">{STATUS_META[status].label}</span>
    </div>
  );
}

function getCameraIdFromName(name: string): number {
  const normalized = name.toLowerCase();
  if (normalized.includes("naroda") && normalized.includes("mother")) return 0;
  if (normalized.includes("vastral") || normalized.includes("cng station")) return 1;
  if (normalized.includes("odhav")) return 2;
  if (normalized.includes("bopal")) return 3;
  if (normalized.includes("compressor") || normalized.includes("naroda")) return 4;
  if (normalized.includes("vatva")) return 5;
  return 1; // default to Vastral
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SafeZoneAdmin() {
  // ── Connection
  const [connected,     setConnected]     = useState(false);
  const [liveFeed,      setLiveFeed]      = useState(false);

  // ── Camera
  const [focusCam,      setFocusCam]      = useState(0);
  const [fullscreen,    setFullscreen]    = useState(false);
  const [nightVision,   setNightVision]   = useState(false);
  const [ptzZoom,       setPtzZoom]       = useState(1);
  const [sensitivity,   setSensitivity]   = useState(70);
  const [offlineCams,   setOfflineCams]   = useState<Set<number>>(new Set());
  const [camBboxes,     setCamBboxes]     = useState<Record<number, BBox[]>>({});

  // ── Alerts & incidents
  const [alerts,        setAlerts]        = useState<SafeAlert[]>([
    { id:1, cat:"No helmet",       camId:0, cam:CAMERAS[0].name, zone:CAMERAS[0].zone, ts:Date.now()-40000,  status:"open",         severity:"High",   notes:[] },
    { id:2, cat:"Restricted area", camId:2, cam:CAMERAS[2].name, zone:CAMERAS[2].zone, ts:Date.now()-120000, status:"investigating", severity:"High",   notes:["Officer on scene"], officer:"Kavita Shah", acknowledgedAt:Date.now()-110000, assignedAt:Date.now()-100000 },
    { id:3, cat:"No safety vest",  camId:1, cam:CAMERAS[1].name, zone:CAMERAS[1].zone, ts:Date.now()-300000, status:"assigned",     severity:"Medium", notes:[], officer:"Sunil Mehta", acknowledgedAt:Date.now()-290000, assignedAt:Date.now()-280000 },
    { id:4, cat:"Loitering",       camId:4, cam:CAMERAS[4].name, zone:CAMERAS[4].zone, ts:Date.now()-600000, status:"acknowledged", severity:"Low",   notes:[] },
    { id:5, cat:"Ignition source", camId:0, cam:CAMERAS[0].name, zone:CAMERAS[0].zone, ts:Date.now()-900000, status:"resolved",     severity:"High",   notes:["Torch removed"], officer:"Ramesh Patel", acknowledgedAt:Date.now()-890000, assignedAt:Date.now()-880000, resolvedAt:Date.now()-860000 },
  ]);
  const [incidents,     setIncidents]     = useState<Incident[]>(SEED_INCIDENTS);

  // ── Officers & patrol
  const [officers,      setOfficers]      = useState<Officer[]>(SEED_OFFICERS);
  const [patrol,        setPatrol]        = useState<PatrolEntry[]>([
    { id:1, officer:"Ramesh Patel", cam:CAMERAS[0].name, zone:"Zone A", ts:Date.now()-3600000, note:"All clear, valve checks done.",   flagged:false },
    { id:2, officer:"Kavita Shah",  cam:CAMERAS[2].name, zone:"Zone C", ts:Date.now()-7200000, note:"Gate secured after maintenance.",  flagged:false },
    { id:3, officer:"Sunil Mehta",  cam:CAMERAS[1].name, zone:"Zone B", ts:Date.now()-1200000, note:"Suspicious individual seen near fence — monitoring.", flagged:true },
  ]);
  const [schedule,      setSchedule]      = useState<PatrolSlot[]>(SEED_SCHEDULE);

  // ── UI state
  const [activeTab,     setActiveTab]     = useState<"alerts"|"incidents"|"analytics"|"patrol">("alerts");
  const [filterSev,     setFilterSev]     = useState<Sev|"All">("All");
  const [filterStatus,  setFilterStatus]  = useState<AlertStatus|"all">("all");
  const [searchQ,       setSearchQ]       = useState("");
  const [assignModal,   setAssignModal]   = useState<SafeAlert|null>(null);
  const [resolveModal,  setResolveModal]  = useState<SafeAlert|null>(null);
  const [resolveNote,   setResolveNote]   = useState("");
  const [noteModal,     setNoteModal]     = useState<SafeAlert|null>(null);
  const [noteText,      setNoteText]      = useState("");
  const [incidentModal, setIncidentModal] = useState<Incident|null>(null);
  const [patrolNote,    setPatrolNote]    = useState("");
  const [patrolFlagged, setPatrolFlagged] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [callingId,     setCallingId]     = useState<string|null>(null);
  const [exportFlash,   setExportFlash]   = useState(false);
  const [violations,    setViolations]    = useState(43);

  const tick = useRef(0);

  // ── Live detector poll ────────────────────────────────────────────────────
  useEffect(() => {
    let stop = false;
    async function poll() {
      try {
        const r = await fetch(`${API}/events`, { cache: "no-store" });
        if (!r.ok) {
          if (!stop) setConnected(false);
          return;
        }
        const data = await r.json();
        if (!stop) {
          setConnected(true);
          if (Array.isArray(data) && data.length > 0) {
            setAlerts((prev) => {
              const next = [...prev];
              data.forEach((evt: any) => {
                const matchedCamId = getCameraIdFromName(evt.cam);
                const camName = CAMERAS[matchedCamId].name;
                const camZone = CAMERAS[matchedCamId].zone;
                const evtTs = new Date(evt.ts).getTime() || Date.now();
                const evtCat = evt.cat as Cat;
                
                // Try matching by exact ID or very close timestamp (within 3 seconds) + same category + same camera
                const existingIdx = next.findIndex(
                  (a) => a.id === evt.id || (Math.abs(a.ts - evtTs) < 3000 && a.cat === evtCat && a.camId === matchedCamId)
                );

                if (existingIdx === -1) {
                  // Prepend the new alert
                  const newAlert: SafeAlert = {
                    id: evt.id || nextId++,
                    cat: evtCat,
                    camId: matchedCamId,
                    cam: camName,
                    zone: camZone,
                    ts: evtTs,
                    status: "open",
                    severity: CAT_META[evtCat]?.sev || "Medium",
                    notes: []
                  };
                  next.unshift(newAlert);
                  setViolations((v) => v + 1);
                }
              });
              // Sort by timestamp descending and keep last 40 items
              return next.sort((a, b) => b.ts - a.ts).slice(0, 40);
            });
          }
        }
      } catch (err) {
        if (!stop) setConnected(false);
      }
    }
    poll();
    const t = setInterval(poll, 3000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  // ── Simulation engine ─────────────────────────────────────────────────────
  const genBboxes = useCallback((camId: number, forcedCat?: Cat): BBox[] => {
    const prob = sensitivity / 100;
    if (Math.random() > prob * 0.55) return [];
    const cats = forcedCat ? [forcedCat] : SIM_CATS;
    const cat  = cats[Math.floor(Math.random() * cats.length)];
    const meta = CAT_META[cat];
    return [{ x:8+Math.random()*50, y:5+Math.random()*45, w:12+Math.random()*20, h:20+Math.random()*25, label:cat, conf:0.72+Math.random()*0.27, color:meta.color }];
  }, [sensitivity]);

  useEffect(() => {
    const t = setInterval(() => {
      tick.current += 1;
      // refresh bboxes
      setCamBboxes((prev) => {
        const next: Record<number, BBox[]> = {};
        CAMERAS.forEach((cam) => {
          const openAlert = alerts.find((a) => a.camId===cam.id && !["resolved","false_positive"].includes(a.status));
          next[cam.id] = genBboxes(cam.id, openAlert?.cat);
        });
        return next;
      });
      // spawn new alert every ~12s
      if (tick.current % 12 === 0) {
        const cat  = SIM_CATS[Math.floor(Math.random()*SIM_CATS.length)];
        const cam  = CAMERAS[Math.floor(Math.random()*CAMERAS.length)];
        const a: SafeAlert = { id:nextId++, cat, camId:cam.id, cam:cam.name, zone:cam.zone, ts:Date.now(), status:"open", severity:CAT_META[cat].sev, notes:[] };
        setAlerts((prev) => [a, ...prev].slice(0,30));
        setViolations((v) => v+1);
      }
      // auto-escalate open alerts > 5 min
      if (tick.current % 20 === 0) {
        setAlerts((prev) => prev.map((a) => {
          if (a.status==="open" && !a.escalated && Date.now()-a.ts > 5*60*1000)
            return { ...a, escalated:true };
          return a;
        }));
      }
      // occasional offline flip
      if (tick.current % 60 === 0) {
        setOfflineCams((prev) => {
          const next = new Set(prev);
          const id = Math.floor(Math.random()*CAMERAS.length);
          if (next.has(id)) next.delete(id); else if(next.size<1) next.add(id);
          return next;
        });
      }
    }, 1500);
    return () => clearInterval(t);
  }, [alerts, genBboxes]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function acknowledgeAlert(id: number) {
    setAlerts((prev) => prev.map((a) => a.id===id ? { ...a, status:"acknowledged", acknowledgedAt:Date.now() } : a));
  }

  function assignAlert(alertId: number, officerName: string) {
    setAlerts((prev) => prev.map((a) => a.id===alertId ? { ...a, status:"assigned", officer:officerName, assignedAt:Date.now() } : a));
    setOfficers((prev) => prev.map((o) => o.name===officerName ? { ...o, status:"responding", assigned:o.assigned+1 } : o));
    setAssignModal(null);
  }

  function investigateAlert(id: number) {
    setAlerts((prev) => prev.map((a) => a.id===id ? { ...a, status:"investigating" } : a));
  }

  function openResolveModal(alert: SafeAlert) {
    setResolveModal(alert);
    setResolveNote("");
  }

  function resolveAlert() {
    if (!resolveModal) return;
    const now    = Date.now();
    const durSec = Math.round((now - resolveModal.ts) / 1000);
    const notes  = resolveNote.trim() ? [...resolveModal.notes, resolveNote.trim()] : resolveModal.notes;

    setAlerts((prev) => prev.map((a) => a.id===resolveModal.id ? { ...a, status:"resolved", resolvedAt:now, notes } : a));
    if (resolveModal.officer) {
      setOfficers((prev) => prev.map((o) => o.name===resolveModal.officer ? { ...o, status:"on-duty", assigned:Math.max(0,o.assigned-1) } : o));
    }
    // Auto-generate incident report
    const inc: Incident = {
      id: `INC-${String(incidentSeq++).padStart(3,"0")}`,
      alertId:    resolveModal.id,
      cat:        resolveModal.cat,
      cam:        resolveModal.cam,
      zone:       resolveModal.zone,
      severity:   resolveModal.severity,
      openedAt:   resolveModal.ts,
      resolvedAt: now,
      durationSec:durSec,
      officer:    resolveModal.officer ?? "Unassigned",
      notes,
    };
    setIncidents((prev) => [inc, ...prev]);
    setResolveModal(null);
  }

  function markFalsePositive(id: number) {
    setAlerts((prev) => prev.map((a) => a.id===id ? { ...a, status:"false_positive" } : a));
  }

  function saveNote(alertId: number) {
    if (!noteText.trim()) return;
    setAlerts((prev) => prev.map((a) => a.id===alertId ? { ...a, notes:[...a.notes, noteText.trim()] } : a));
    setNoteModal(null); setNoteText("");
  }

  function addPatrol() {
    if (!patrolNote.trim()) return;
    setPatrol((prev) => [{ id:Date.now(), officer:"Ramesh Patel", cam:CAMERAS[focusCam].name, zone:CAMERAS[focusCam].zone, ts:Date.now(), note:patrolNote, flagged:patrolFlagged }, ...prev]);
    setPatrolNote(""); setPatrolFlagged(false);
  }

  function callOfficer(id: string) {
    setCallingId(id);
    setTimeout(() => setCallingId(null), 3500);
  }

  function handleExport() {
    setExportFlash(true);
    setTimeout(() => setExportFlash(false), 2000);
  }

  function toggleScheduleStatus(id: number) {
    setSchedule((prev) => prev.map((s) => {
      if (s.id!==id) return s;
      const cycle: PatrolSlot["status"][] = ["pending","in-progress","completed","missed"];
      const idx = cycle.indexOf(s.status);
      return { ...s, status:cycle[(idx+1)%cycle.length] };
    }));
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const threatLevel    = computeThreatLevel(alerts);
  const tm             = THREAT_META[threatLevel];
  const activeAlerts   = alerts.filter((a) => !["resolved","false_positive"].includes(a.status));
  const openCount      = activeAlerts.filter((a) => a.status==="open").length;
  const focusCamData   = CAMERAS[focusCam];
  const focusAlerts    = activeAlerts.filter((a) => a.camId===focusCam);
  const focusBboxes    = camBboxes[focusCam] ?? [];
  const focusFlag      = focusAlerts[0] ? CAT_META[focusAlerts[0].cat].color : null;
  const onDutyCount    = officers.filter((o) => o.status!=="off-duty").length;
  const respondingCount = officers.filter((o) => o.status==="responding").length;

  const catCounts = (Object.keys(CAT_META) as Cat[]).map((c) => ({
    cat:c, count:alerts.filter((a) => a.cat===c).length, ...CAT_META[c],
  }));

  const zoneStats = ZONES.map((z) => {
    const zAlerts = activeAlerts.filter((a) => a.zone===z.id).length;
    const risk    = Math.min(100, z.baseRisk + zAlerts * 12);
    return { ...z, risk, alertCount:zAlerts };
  });

  const filteredAlerts = alerts.filter((a) => {
    const sevOk  = filterSev==="All" || a.severity===filterSev;
    const stOk   = filterStatus==="all" || a.status===filterStatus;
    const qOk    = !searchQ || a.cat.toLowerCase().includes(searchQ.toLowerCase()) || a.cam.toLowerCase().includes(searchQ.toLowerCase()) || (a.officer||"").toLowerCase().includes(searchQ.toLowerCase());
    return sevOk && stOk && qOk;
  });

  const resolvedCount  = alerts.filter((a) => a.status==="resolved").length;
  const avgResTimeSec  = incidents.length
    ? Math.round(incidents.reduce((s,i) => s+i.durationSec,0) / incidents.length)
    : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-4 reveal ${emergencyMode ? "ring-4 ring-red-500 ring-offset-4 rounded-2xl" : ""}`}>

      {/* ── Emergency banner ── */}
      {(emergencyMode || threatLevel==="critical") && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border animate-pulse bg-red-600 text-white border-red-700">
          <Siren className="w-5 h-5 shrink-0" />
          <span className="font-bold text-sm flex-1">
            {emergencyMode ? "⚠ EMERGENCY PROTOCOL ACTIVE — All units respond to assigned zones" : "🔴 CRITICAL THREAT LEVEL — Immediate supervisor notification required"}
          </span>
          {emergencyMode && (
            <button onClick={() => setEmergencyMode(false)} className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
              Stand Down
            </button>
          )}
        </div>
      )}

      {/* ── Threat level banner (non-critical) ── */}
      {(threatLevel==="elevated"||threatLevel==="high") && !emergencyMode && (
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${tm.banner}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="font-semibold text-sm">Threat level: <b>{tm.label}</b> — {activeAlerts.length} active violation{activeAlerts.length!==1?"s":""} require attention.</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-500" />
            SafeZone AI — Live CCTV Monitoring
          </h2>
          <p className="text-sm text-ink-500 mt-0.5">Real-time detection · alert workflow · incident reports · patrol management</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Threat badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${tm.kpi} ${threatLevel==="normal"?"bg-brand-50 border-brand-200":threatLevel==="elevated"?"bg-amber-50 border-amber-200":threatLevel==="high"?"bg-orange-50 border-orange-200":"bg-red-50 border-red-200"}`}>
            <span className={`h-2 w-2 rounded-full ${tm.dot}`} />
            {tm.label}
          </span>
          {/* Night vision */}
          <button onClick={() => setNightVision((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${nightVision?"bg-green-900 border-green-700 text-green-300":"bg-ink-50 border-ink-200 text-ink-600 hover:bg-ink-100"}`}>
            {nightVision ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            {nightVision ? "NV ON" : "Night Vision"}
          </button>
          {/* Emergency */}
          <button onClick={() => setEmergencyMode((v) => !v)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${emergencyMode?"bg-red-600 border-red-700 text-white animate-pulse":"bg-red-50 border-red-200 text-red-700 hover:bg-red-100"}`}>
            <Siren className="w-3.5 h-3.5" />
            {emergencyMode ? "EMERGENCY ON" : "Emergency"}
          </button>
          {/* Connection */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${connected?"bg-brand-50 border-brand-200 text-brand-700":"bg-amber-50 border-amber-200 text-amber-700"}`}>
            {connected ? <Wifi className="w-3.5 h-3.5"/> : <WifiOff className="w-3.5 h-3.5"/>}
            {connected ? "Live detector" : "Simulation"}
          </span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label:"Cameras online",   val:`${CAMERAS.length-offlineCams.size}/${CAMERAS.length}`, sub:offlineCams.size>0?`${offlineCams.size} offline`:"All active", icon:<Camera className="w-4 h-4"/>, col:offlineCams.size>0?"text-amber-600":"text-brand-600" },
          { label:"Open cases",       val:openCount,         sub:activeAlerts.filter(a=>a.escalated).length>0?`${activeAlerts.filter(a=>a.escalated).length} escalated`:"", icon:<Bell className="w-4 h-4"/>, col:openCount>0?"text-red-600":"text-brand-600" },
          { label:"Violations today", val:violations,        sub:"since 00:00",     icon:<ScanEye className="w-4 h-4"/>,   col:"text-amber-600" },
          { label:"Incidents filed",  val:incidents.length,  sub:`avg ${durFmt(avgResTimeSec)} res.`, icon:<FileText className="w-4 h-4"/>, col:"text-violet-600" },
          { label:"Officers on duty", val:onDutyCount,       sub:`${respondingCount} responding`, icon:<User className="w-4 h-4"/>, col:"text-brand-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl shadow-soft border border-ink-100 p-4 lift">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">{k.label}</span>
              <span className={k.col}>{k.icon}</span>
            </div>
            <div className={`mt-1.5 text-2xl font-extrabold tabular-nums ${k.col}`}>{k.val}</div>
            {k.sub && <div className={`text-[11px] mt-0.5 font-medium ${k.col} opacity-80`}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-5 gap-5">

        {/* ── LEFT: Camera panel (col-span-2) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* 6-camera thumbnail grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {CAMERAS.map((cam) => {
              const openAlert = activeAlerts.find((a) => a.camId===cam.id);
              const isOff     = offlineCams.has(cam.id);
              const isFocus   = focusCam===cam.id;
              return (
                <button key={cam.id} onClick={() => setFocusCam(cam.id)}
                  className={`rounded-xl overflow-hidden border-2 transition-all duration-200 text-left ${isFocus?"border-brand-400 ring-2 ring-brand-100 scale-[1.02]":isOff?"border-red-400/40":"border-transparent hover:border-ink-200"}`}>
                  <div className={`px-2 py-1 flex items-center justify-between ${isOff?"bg-red-950":"bg-ink-950"}`}>
                    <span className="flex items-center gap-1 truncate text-white text-[10px] font-medium">
                      <Video className={`w-3 h-3 shrink-0 ${isFocus?"text-brand-300":"text-slate-400"}`} />
                      <span className="truncate">{cam.name.split("·")[1]?.trim()??cam.name}</span>
                    </span>
                    {isOff
                      ? <span className="text-red-400 text-[8px] font-bold shrink-0">OFF</span>
                      : openAlert
                      ? <AlertTriangle className={`w-2.5 h-2.5 shrink-0 ${openAlert.escalated?"text-red-400 animate-pulse":"text-amber-400"}`} />
                      : <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                    }
                  </div>
                  <CameraFeed camId={cam.id} videoUrl={VIDEO_SRCS[cam.id]}
                    flaggedColor={openAlert?CAT_META[openAlert.cat].color:null}
                    focused={false} nightVision={nightVision}
                    bboxes={camBboxes[cam.id]??[]} offline={isOff} />
                </button>
              );
            })}
          </div>

          {/* Focused camera */}
          {!fullscreen && (
            <Card className="overflow-hidden">
              <div className="bg-ink-950 text-white px-3 py-2 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold truncate">
                  <Maximize2 className="w-4 h-4 text-brand-300 shrink-0" />
                  <span className="truncate">{focusCamData.name}</span>
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${focusCamData.risk==="High"?"bg-red-500/20 text-red-300":focusCamData.risk==="Medium"?"bg-amber-500/20 text-amber-300":"bg-brand-500/20 text-brand-300"}`}>{focusCamData.risk}</span>
                  {connected && (
                    <button onClick={() => setLiveFeed(f => !f)}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${liveFeed ? "bg-red-600 text-white animate-pulse border border-red-500" : "bg-white/10 text-white/70 hover:bg-white/20"}`}>
                      <Radio className="w-3 h-3"/>{liveFeed ? "LIVE YOLO" : "GO LIVE"}
                    </button>
                  )}
                  <button onClick={handleExport}
                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${exportFlash?"bg-green-500 text-white":"bg-white/10 text-white/70 hover:bg-white/20"}`}>
                    <Download className="w-3 h-3" />{exportFlash?"Saved!":"Clip"}
                  </button>
                  <button onClick={() => setFullscreen(true)} className="text-white/60 hover:text-white transition-colors">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div style={{ transform:`scale(${ptzZoom})`, transformOrigin:"center", transition:"transform 0.3s" }}>
                <CameraFeed camId={focusCam} videoUrl={liveFeed && connected ? `${API}/video?cam=${focusCam}` : VIDEO_SRCS[focusCam]}
                  flaggedColor={focusFlag} focused nightVision={nightVision}
                  bboxes={focusBboxes} offline={offlineCams.has(focusCam)} />
              </div>
              {/* AI bar */}
              <div className="bg-ink-50 border-t border-ink-100 px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div><div className="text-ink-400 mb-0.5">Zone</div><div className="font-semibold text-ink-800">{focusCamData.zone}</div></div>
                <div><div className="text-ink-400 mb-0.5">Open alerts</div>
                  <div className={`font-semibold ${focusAlerts.length>0?"text-red-600":"text-brand-600"}`}>{focusAlerts.length>0?`${focusAlerts.length} active`:"None"}</div>
                </div>
                <div><div className="text-ink-400 mb-0.5">AI objects</div><div className="font-semibold text-ink-800">{focusBboxes.length}</div></div>
                <div><div className="text-ink-400 mb-0.5">Status</div>
                  <div className="flex items-center gap-1 font-semibold">
                    {focusAlerts.length>0 ? <><ZapOff className="w-3.5 h-3.5 text-red-500"/><span className="text-red-600">Alert</span></> : <><Zap className="w-3.5 h-3.5 text-brand-500"/><span className="text-brand-600">Clear</span></>}
                  </div>
                </div>
              </div>
              {/* PTZ + sensitivity */}
              <div className="bg-white border-t border-ink-100 px-4 py-2 flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-ink-600 flex items-center gap-1 shrink-0"><Eye className="w-3.5 h-3.5"/>PTZ</span>
                <button onClick={() => setPtzZoom(z=>Math.max(1,z-0.25))} className="h-6 w-6 rounded-lg bg-ink-100 grid place-items-center hover:bg-ink-200 transition-colors"><ZoomOut className="w-3.5 h-3.5 text-ink-600"/></button>
                <span className="text-xs font-bold text-ink-800 w-7 text-center">{ptzZoom.toFixed(1)}×</span>
                <button onClick={() => setPtzZoom(z=>Math.min(3,z+0.25))} className="h-6 w-6 rounded-lg bg-ink-100 grid place-items-center hover:bg-ink-200 transition-colors"><ZoomIn className="w-3.5 h-3.5 text-ink-600"/></button>
                <button onClick={() => setPtzZoom(1)} className="h-6 w-6 rounded-lg bg-ink-100 grid place-items-center hover:bg-ink-200 transition-colors"><RotateCcw className="w-3.5 h-3.5 text-ink-600"/></button>
                <div className="flex items-center gap-2 ml-auto">
                  <Activity className="w-3.5 h-3.5 text-ink-400"/>
                  <input type="range" min={20} max={100} value={sensitivity} onChange={e=>setSensitivity(+e.target.value)} className="w-20 accent-brand-500"/>
                  <span className="text-xs font-bold text-brand-600 w-8">{sensitivity}%</span>
                </div>
              </div>
            </Card>
          )}

          {/* AI analysis card */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink-900 flex items-center gap-1.5 text-sm"><Shield className="w-4 h-4 text-brand-500"/>AI Analysis · CAM-{String(focusCam+1).padStart(2,"0")}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${focusBboxes.length>0?"bg-red-100 text-red-700":"bg-brand-100 text-brand-700"}`}>
                {focusBboxes.length>0?`${focusBboxes.length} detected`:"Clear"}
              </span>
            </div>
            {focusBboxes.length>0 ? (
              <div className="space-y-2">
                {focusBboxes.map((b,i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-xl border" style={{ borderColor:b.color+"44", background:b.color+"0a" }}>
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background:b.color }}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-ink-800">{b.label}</div>
                      <div className="w-full bg-ink-100 rounded-full h-1 mt-1">
                        <div className="h-1 rounded-full" style={{ width:`${b.conf*100}%`, background:b.color }}/>
                      </div>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color:b.color }}>{(b.conf*100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-3 gap-1">
                <CheckCircle2 className="w-7 h-7 text-brand-400"/>
                <p className="text-xs text-ink-500">No violations detected</p>
              </div>
            )}
            <div className="border-t border-ink-100 pt-3 mt-3 space-y-1.5">
              {[
                ["Location", focusCamData.name], ["Zone", focusCamData.zone],
                ["Risk",     focusCamData.risk],  ["Resolution", focusCamData.res],
                ["Mode",     nightVision?"Night Vision":"Day Mode"],
              ].map(([l,v]) => (
                <div key={l} className="flex items-center justify-between text-xs">
                  <span className="text-ink-500">{l}</span>
                  <span className="font-semibold text-ink-800">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── RIGHT: Main work panel (col-span-3) ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* ── Tabbed panel ── */}
          <Card className="overflow-hidden">
            <div className="flex border-b border-ink-100 overflow-x-auto">
              {(["alerts","incidents","analytics","patrol"] as const).map((tab) => {
                const badge = tab==="alerts" ? activeAlerts.length : tab==="incidents" ? incidents.length : 0;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab===tab?"border-b-2 border-brand-500 text-brand-600 bg-brand-50/40":"text-ink-500 hover:text-ink-800"}`}>
                    {tab==="alerts"    && <Bell className="w-3.5 h-3.5"/>}
                    {tab==="incidents" && <FileText className="w-3.5 h-3.5"/>}
                    {tab==="analytics" && <BarChart3 className="w-3.5 h-3.5"/>}
                    {tab==="patrol"    && <ClipboardList className="w-3.5 h-3.5"/>}
                    {tab.charAt(0).toUpperCase()+tab.slice(1)}
                    {badge>0 && <span className="ml-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 grid place-items-center shrink-0">{badge>9?"9+":badge}</span>}
                  </button>
                );
              })}
            </div>

            {/* ── ALERTS TAB ── */}
            {activeTab==="alerts" && (
              <div className="p-4 space-y-3">
                {/* Search + filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-40">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400"/>
                    <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                      placeholder="Search alerts…"
                      className="w-full text-xs border border-ink-200 rounded-xl pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"/>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {(["All","High","Medium","Low"] as const).map((s) => (
                      <button key={s} onClick={() => setFilterSev(s)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${filterSev===s?"bg-ink-900 text-white border-ink-900":"border-ink-200 text-ink-600 hover:bg-ink-50"}`}>{s}</button>
                    ))}
                  </div>
                  <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as AlertStatus|"all")}
                    className="text-xs border border-ink-200 rounded-xl px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand-300 bg-white">
                    <option value="all">All status</option>
                    {(["open","acknowledged","assigned","investigating","resolved","false_positive"] as AlertStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                  </select>
                </div>

                {filteredAlerts.length===0 && (
                  <div className="text-center py-10 text-ink-400 text-sm">No alerts match the current filters.</div>
                )}

                <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {filteredAlerts.map((a) => {
                    const meta=CAT_META[a.cat]; const Icon=meta.icon;
                    const isActive=!["resolved","false_positive"].includes(a.status);
                    const elapsed=Date.now()-a.ts;
                    const elapsedMin=Math.floor(elapsed/60000);
                    return (
                      <li key={a.id} className={`p-3 rounded-xl border transition-all ${a.status==="open"?"border-red-100 bg-red-50/30":a.status==="investigating"?"border-violet-100 bg-violet-50/30":a.status==="resolved"?"border-ink-100 bg-white opacity-75":"border-ink-100 bg-white"}`}>
                        <div className="flex items-start gap-2.5">
                          <button onClick={() => setFocusCam(a.camId)} title="Focus camera"
                            className={`shrink-0 h-8 w-8 rounded-lg grid place-items-center border hover:scale-110 transition-transform ${TONE_BG[meta.tone]}`}>
                            <Icon className="w-4 h-4"/>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-sm font-semibold text-ink-800">{a.cat}</span>
                              <Badge tone={sevBadge[a.severity]}>{a.severity}</Badge>
                              {a.escalated && isActive && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Timer className="w-3 h-3"/>Escalated</span>}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_META[a.status].color}`}>{STATUS_META[a.status].label}</span>
                            </div>
                            <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <MapPin className="w-3 h-3 shrink-0"/>{a.cam}
                              <span>·</span><Clock className="w-3 h-3 shrink-0"/>{elapsedMin}m
                              {a.officer && <><span>·</span><UserCheck className="w-3 h-3 shrink-0"/>{a.officer}</>}
                            </div>
                            {/* Step progress bar */}
                            {isActive && <StepBar status={a.status}/>}
                            {/* Notes */}
                            {a.notes.length>0 && (
                              <div className="mt-1.5 space-y-0.5">
                                {a.notes.slice(-2).map((n,i) => (
                                  <p key={i} className="text-[11px] text-ink-500 italic">&ldquo;{n}&rdquo;</p>
                                ))}
                              </div>
                            )}
                          </div>
                          {/* Action buttons */}
                          <div className="flex flex-col gap-1 shrink-0">
                            {a.status==="open" && <>
                              <button onClick={() => acknowledgeAlert(a.id)} className="text-[11px] font-semibold text-white bg-orange-500 px-2 py-1 rounded-lg hover:bg-orange-600 transition-colors whitespace-nowrap">Acknowledge</button>
                              <button onClick={() => markFalsePositive(a.id)} className="text-[11px] font-semibold text-ink-500 border border-ink-200 px-2 py-1 rounded-lg hover:bg-ink-50 transition-colors">False+</button>
                            </>}
                            {a.status==="acknowledged" && <>
                              <button onClick={() => setAssignModal(a)} className="text-[11px] font-semibold text-white bg-red-600 px-2 py-1 rounded-lg hover:bg-red-700 transition-colors">Assign</button>
                              <button onClick={() => { setNoteModal(a); setNoteText(""); }} className="text-[11px] font-semibold text-ink-500 border border-ink-200 px-2 py-1 rounded-lg hover:bg-ink-50 transition-colors">Note</button>
                            </>}
                            {a.status==="assigned" && <>
                              <button onClick={() => investigateAlert(a.id)} className="text-[11px] font-semibold text-white bg-violet-600 px-2 py-1 rounded-lg hover:bg-violet-700 transition-colors whitespace-nowrap">Investigate</button>
                              <button onClick={() => { setNoteModal(a); setNoteText(""); }} className="text-[11px] font-semibold text-ink-500 border border-ink-200 px-2 py-1 rounded-lg hover:bg-ink-50 transition-colors">Note</button>
                            </>}
                            {a.status==="investigating" && <>
                              <button onClick={() => openResolveModal(a)} className="text-[11px] font-semibold text-white bg-brand-600 px-2 py-1 rounded-lg hover:bg-brand-700 transition-colors">Resolve</button>
                              <button onClick={() => { setNoteModal(a); setNoteText(""); }} className="text-[11px] font-semibold text-ink-500 border border-ink-200 px-2 py-1 rounded-lg hover:bg-ink-50 transition-colors">Note</button>
                            </>}
                            {a.status==="resolved" && <CheckCircle2 className="w-5 h-5 text-brand-500 mx-auto"/>}
                            {a.status==="false_positive" && <XSquare className="w-5 h-5 text-ink-400 mx-auto"/>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ── INCIDENTS TAB ── */}
            {activeTab==="incidents" && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-ink-800">{incidents.length} incidents on record</p>
                  <span className="text-xs text-ink-500">Avg resolution: <b>{durFmt(avgResTimeSec)}</b></span>
                </div>
                {incidents.length===0 && <div className="text-center py-8 text-ink-400 text-sm">No incidents yet — they appear when alerts are resolved.</div>}
                <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {incidents.map((inc) => {
                    const meta=CAT_META[inc.cat]; const Icon=meta.icon;
                    return (
                      <li key={inc.id} className="p-3 rounded-xl border border-ink-100 bg-white hover:border-brand-200 hover:shadow-soft transition-all cursor-pointer"
                        onClick={() => setIncidentModal(inc)}>
                        <div className="flex items-start gap-2.5">
                          <span className={`shrink-0 h-8 w-8 rounded-lg grid place-items-center border ${TONE_BG[meta.tone]}`}><Icon className="w-4 h-4"/></span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-ink-800">{inc.cat}</span>
                              <Badge tone={sevBadge[inc.severity]}>{inc.severity}</Badge>
                              <span className="text-xs text-brand-600 font-mono">{inc.id}</span>
                            </div>
                            <div className="text-xs text-ink-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <MapPin className="w-3 h-3 shrink-0"/>{inc.cam}
                              <span>·</span><UserCheck className="w-3 h-3 shrink-0"/>{inc.officer}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-ink-700">{durFmt(inc.durationSec)}</div>
                            <div className="text-[10px] text-ink-400">{rel(inc.resolvedAt)}</div>
                            <ChevronRight className="w-4 h-4 text-ink-300 ml-auto mt-1"/>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab==="analytics" && (
              <div className="p-4 space-y-5">
                {/* Quick stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label:"Total today",     val:violations,                                             col:"text-ink-900" },
                    { label:"Resolved",        val:resolvedCount,                                          col:"text-brand-600" },
                    { label:"False positives", val:alerts.filter(a=>a.status==="false_positive").length,  col:"text-amber-600" },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-ink-50 rounded-xl p-3">
                      <div className={`text-2xl font-extrabold tabular-nums ${s.col}`}>{s.val}</div>
                      <div className="text-[11px] text-ink-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Hourly chart */}
                <div>
                  <h4 className="text-sm font-bold text-ink-800 mb-2">Violations by hour</h4>
                  <HourlyChart data={HOURLY}/>
                  <div className="flex justify-between text-[10px] text-ink-400 mt-1 px-0.5">
                    <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
                  </div>
                </div>
                {/* Zone risk */}
                <div>
                  <h4 className="text-sm font-bold text-ink-800 mb-3">Zone risk index</h4>
                  <div className="space-y-2">
                    {zoneStats.sort((a,b)=>b.risk-a.risk).map((z) => (
                      <div key={z.id} className="flex items-center gap-3">
                        <span className="text-xs text-ink-600 w-20 shrink-0 font-medium">{z.id}</span>
                        <div className="flex-1 bg-ink-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${z.risk>=75?"bg-red-500":z.risk>=55?"bg-amber-500":"bg-brand-500"}`}
                            style={{ width:`${z.risk}%` }}/>
                        </div>
                        <span className={`text-xs font-bold w-8 text-right ${z.risk>=75?"text-red-600":z.risk>=55?"text-amber-600":"text-brand-600"}`}>{z.risk}</span>
                        {z.alertCount>0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold shrink-0">{z.alertCount}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Category breakdown */}
                <div>
                  <h4 className="text-sm font-bold text-ink-800 mb-3">Violations by category</h4>
                  <div className="space-y-2">
                    {catCounts.sort((a,b)=>b.count-a.count).map(({ cat,count,tone,icon:Icon }) => (
                      <div key={cat} className="flex items-center gap-3">
                        <span className={`h-7 w-7 rounded-lg grid place-items-center border shrink-0 ${TONE_BG[tone]}`}><Icon className="w-3.5 h-3.5"/></span>
                        <span className="text-xs text-ink-700 flex-1">{cat}</span>
                        <div className="w-24 bg-ink-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full ${tone==="red"?"bg-red-400":tone==="amber"?"bg-amber-400":"bg-sky-400"}`}
                            style={{ width:`${Math.max(4,(count/Math.max(...catCounts.map(c=>c.count),1))*100)}%` }}/>
                        </div>
                        <span className="text-xs font-bold text-ink-800 w-5 text-right">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Resolution trend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-ink-100">
                  <div className="bg-ink-50 rounded-xl p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-brand-500 mx-auto mb-1"/>
                    <div className="text-lg font-extrabold text-brand-700">{resolvedCount>0?Math.round((resolvedCount/(resolvedCount+activeAlerts.length))*100):0}%</div>
                    <div className="text-[11px] text-ink-500">Resolution rate</div>
                  </div>
                  <div className="bg-ink-50 rounded-xl p-3 text-center">
                    <Timer className="w-5 h-5 text-violet-500 mx-auto mb-1"/>
                    <div className="text-lg font-extrabold text-violet-700">{durFmt(avgResTimeSec)}</div>
                    <div className="text-[11px] text-ink-500">Avg resolution</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── PATROL TAB ── */}
            {activeTab==="patrol" && (
              <div className="p-4 space-y-4">
                {/* Quick log entry */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input value={patrolNote} onChange={e=>setPatrolNote(e.target.value)}
                      placeholder={`Log inspection for ${focusCamData.name}…`}
                      className="flex-1 text-sm border border-ink-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300"
                      onKeyDown={e=>e.key==="Enter"&&addPatrol()}/>
                    <button onClick={addPatrol} className="px-3 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors">Log</button>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-ink-600 cursor-pointer">
                    <input type="checkbox" checked={patrolFlagged} onChange={e=>setPatrolFlagged(e.target.checked)} className="accent-red-500"/>
                    Flag as suspicious / requires follow-up
                  </label>
                </div>

                {/* Patrol schedule */}
                <div>
                  <h4 className="text-sm font-bold text-ink-800 mb-2 flex items-center gap-1.5"><CalendarClock className="w-4 h-4 text-brand-500"/>Today&apos;s Schedule</h4>
                  <ul className="space-y-1.5">
                    {schedule.map((s) => (
                      <li key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-ink-100 hover:bg-ink-50 transition-colors">
                        <span className="font-mono text-xs text-ink-600 w-10 shrink-0">{s.timeStr}</span>
                        <span className="text-xs font-semibold text-ink-800 flex-1">{s.zone} — {s.officer.split(" ")[0]}</span>
                        <button onClick={() => toggleScheduleStatus(s.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${s.status==="completed"?"bg-brand-100 text-brand-700 border-brand-200":s.status==="in-progress"?"bg-amber-100 text-amber-700 border-amber-200 animate-pulse":s.status==="missed"?"bg-red-100 text-red-600 border-red-200":"bg-ink-100 text-ink-500 border-ink-200"}`}>
                          {s.status==="in-progress"?"● "+s.status.replace("-"," "):s.status}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Patrol log */}
                <div>
                  <h4 className="text-sm font-bold text-ink-800 mb-2 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-brand-500"/>Patrol Log</h4>
                  <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {patrol.map((p) => (
                      <li key={p.id} className={`flex items-start gap-3 p-2.5 rounded-xl border ${p.flagged?"border-amber-200 bg-amber-50/40":"border-ink-100 bg-ink-50/50"}`}>
                        {p.flagged && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5"/>}
                        {!p.flagged && <ClipboardList className="w-4 h-4 text-brand-500 shrink-0 mt-0.5"/>}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-ink-800">{p.officer}</span>
                            <ChevronRight className="w-3 h-3 text-ink-300"/>
                            <span className="text-xs text-ink-500 truncate">{p.cam}</span>
                          </div>
                          <p className="text-xs text-ink-600 mt-0.5">{p.note}</p>
                          <p className="text-[10px] text-ink-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3"/>{fmtTime(p.ts)} · {rel(p.ts)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>

          {/* ── Officer roster ── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink-900 text-sm">Officer Roster</h3>
              <span className="text-xs text-ink-500">{onDutyCount} on duty · {respondingCount} responding</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {officers.map((o) => (
                <div key={o.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-ink-100 hover:bg-ink-50 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white text-xs font-bold shrink-0">
                    {o.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink-800 truncate">{o.name}</div>
                    <div className="text-[11px] text-ink-400">{o.zone} · {o.id}</div>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${o.status==="off-duty"?"bg-ink-100 text-ink-400":o.status==="responding"?"bg-amber-100 text-amber-700":o.status==="break"?"bg-sky-100 text-sky-700":"bg-brand-100 text-brand-700"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${o.status==="off-duty"?"bg-ink-300":o.status==="responding"?"bg-amber-500 animate-pulse":o.status==="break"?"bg-sky-400":"bg-brand-500"}`}/>
                      {o.status==="off-duty"?"Off duty":o.status==="responding"?"Responding":o.status==="break"?"On break":"On duty"}
                    </span>
                  </div>
                  <button onClick={() => callOfficer(o.id)}
                    disabled={o.status==="off-duty"}
                    className={`shrink-0 h-8 w-8 rounded-lg grid place-items-center transition-all ${callingId===o.id?"bg-green-500 text-white animate-pulse":o.status==="off-duty"?"bg-ink-50 text-ink-300 cursor-not-allowed":"bg-brand-50 text-brand-600 hover:bg-brand-100"}`}
                    title={callingId===o.id?"Calling…":"Call officer"}>
                    <Phone className="w-3.5 h-3.5"/>
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Live event stream ── */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-ink-900 text-sm flex items-center gap-1.5"><Radio className="w-4 h-4 text-brand-500"/>Live Event Stream</h3>
              <span className="flex items-center gap-1.5 text-xs text-brand-600 font-medium">
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse"/>monitoring
              </span>
            </div>
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {alerts.slice(0,15).map((a) => {
                const meta=CAT_META[a.cat]; const Icon=meta.icon;
                return (
                  <li key={a.id} className={`p-2.5 rounded-xl border ${a.status==="open"?"border-red-100 bg-red-50/30":a.status==="investigating"?"border-violet-100 bg-violet-50/30":"border-ink-100 bg-white"}`}>
                    <div className="flex items-center gap-2.5">
                      <button onClick={() => setFocusCam(a.camId)}
                        className={`shrink-0 h-7 w-7 rounded-lg grid place-items-center border hover:scale-110 transition-transform ${TONE_BG[meta.tone]}`}>
                        <Icon className="w-3.5 h-3.5"/>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-ink-800 truncate">{a.cat}</div>
                        <div className="text-[10px] text-ink-400 truncate">{a.cam} · {rel(a.ts)}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_META[a.status].color}`}>
                        {a.status==="false_positive"?"FP":STATUS_META[a.status].label}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      {/* ── Fullscreen overlay ── */}
      {fullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-ink-950 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-semibold">{focusCamData.name} — Fullscreen</span>
            <button onClick={() => setFullscreen(false)} className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white transition-colors">
              <Minimize2 className="w-4 h-4"/>Exit
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <CameraFeed camId={focusCam} videoUrl={liveFeed && connected ? `${API}/video?cam=${focusCam}` : VIDEO_SRCS[focusCam]} flaggedColor={focusFlag} focused nightVision={nightVision} bboxes={focusBboxes} offline={offlineCams.has(focusCam)}/>
          </div>
        </div>
      )}

      {/* ── Assign modal ── */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink-900">Assign Alert</h3>
              <button onClick={() => setAssignModal(null)}><X className="w-5 h-5 text-ink-400"/></button>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <div className="text-sm font-semibold text-red-800">{assignModal.cat}</div>
              <div className="text-xs text-red-600 mt-0.5">{assignModal.cam} · {rel(assignModal.ts)}</div>
            </div>
            <ul className="space-y-2">
              {officers.filter(o=>o.status!=="off-duty").map((o) => (
                <li key={o.id}>
                  <button onClick={() => assignAlert(assignModal.id, o.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:border-brand-300 hover:bg-brand-50 transition-colors text-left">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center text-white text-xs font-bold shrink-0">{o.initials}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-ink-800">{o.name}</div>
                      <div className="text-xs text-ink-400">{o.zone} · {o.assigned} active case{o.assigned!==1?"s":""}</div>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${o.status==="responding"?"bg-amber-100 text-amber-700":"bg-brand-100 text-brand-700"}`}>
                      {o.status==="responding"?"Busy":"Available"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Resolve modal ── */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setResolveModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink-900">Resolve & File Incident</h3>
              <button onClick={() => setResolveModal(null)}><X className="w-5 h-5 text-ink-400"/></button>
            </div>
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-4 space-y-1">
              <div className="text-sm font-semibold text-violet-900">{resolveModal.cat}</div>
              <div className="text-xs text-violet-700">{resolveModal.cam} · opened {rel(resolveModal.ts)}</div>
              {resolveModal.officer && <div className="text-xs text-violet-700">Officer: {resolveModal.officer}</div>}
            </div>
            <p className="text-xs text-ink-600 mb-2">Enter closure note (will be saved to incident report):</p>
            <textarea value={resolveNote} onChange={e=>setResolveNote(e.target.value)} rows={3}
              placeholder="Describe what was found and action taken…"
              className="w-full text-sm border border-ink-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 resize-none mb-3"/>
            <div className="flex gap-2">
              <button onClick={resolveAlert}
                className="flex-1 bg-brand-600 text-white font-semibold py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm flex items-center justify-center gap-2">
                <FileText className="w-4 h-4"/>Resolve & Generate Incident Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Note modal ── */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setNoteModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-ink-900">Add Note</h3>
              <button onClick={() => setNoteModal(null)}><X className="w-5 h-5 text-ink-400"/></button>
            </div>
            <p className="text-xs text-ink-500 mb-2">{noteModal.cat} · {noteModal.cam}</p>
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={3}
              placeholder="Enter observation or action taken…"
              className="w-full text-sm border border-ink-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-brand-300 resize-none mb-3"/>
            <button onClick={() => saveNote(noteModal.id)} className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-xl hover:bg-brand-700 transition-colors text-sm">
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* ── Incident detail modal ── */}
      {incidentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIncidentModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-ink-900">Incident Report — {incidentModal.id}</h3>
                <p className="text-xs text-ink-500 mt-0.5">Auto-generated · {new Date(incidentModal.resolvedAt).toLocaleString("en-IN")}</p>
              </div>
              <button onClick={() => setIncidentModal(null)}><X className="w-5 h-5 text-ink-400"/></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Category",    incidentModal.cat],
                  ["Severity",    incidentModal.severity],
                  ["Camera",      incidentModal.cam],
                  ["Zone",        incidentModal.zone],
                  ["Officer",     incidentModal.officer],
                  ["Duration",    durFmt(incidentModal.durationSec)],
                  ["Opened",      fmtTime(incidentModal.openedAt)],
                  ["Resolved",    fmtTime(incidentModal.resolvedAt)],
                ].map(([l,v]) => (
                  <div key={l} className="bg-ink-50 rounded-xl p-3">
                    <div className="text-[11px] text-ink-500 mb-0.5">{l}</div>
                    <div className="text-sm font-semibold text-ink-800">{v}</div>
                  </div>
                ))}
              </div>
              {incidentModal.notes.length>0 && (
                <div className="bg-ink-50 rounded-xl p-3">
                  <div className="text-xs font-semibold text-ink-700 mb-2">Notes ({incidentModal.notes.length})</div>
                  <ul className="space-y-1.5">
                    {incidentModal.notes.map((n,i) => (
                      <li key={i} className="text-sm text-ink-700 flex gap-2">
                        <span className="text-ink-400 shrink-0">{i+1}.</span>{n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={handleExport}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${exportFlash?"bg-green-500 text-white":"bg-ink-900 text-white hover:bg-ink-800"}`}>
                <Download className="w-4 h-4"/>{exportFlash?"Report Exported!":"Export Report PDF"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
