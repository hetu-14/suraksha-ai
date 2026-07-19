"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ShieldCheck, ArrowRight, User, Cog, PhoneCall, ReceiptText,
  Megaphone, Timer, ShieldAlert, ScanEye, Sparkles,
  Activity, Zap, Shield, CheckCircle2, Layers, Workflow,
  BrainCircuit, IndianRupee, LineChart,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   AURORA BACKGROUND — CSS-only layered nebula
══════════════════════════════════════════════════════════════ */
function AuroraBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />
      <div className="aurora aurora-4" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   NEURAL NETWORK CANVAS — nodes, pulses, mouse repel
══════════════════════════════════════════════════════════════ */
function NeuralNetCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let frame = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const onMouse = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouse);

    type N = { x: number; y: number; vx: number; vy: number; r: number; bright: number; target: number; hue: number; phase: number; };
    type Pulse = { from: number; to: number; t: number; speed: number; hue: number; };

    const nodes: N[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.8 + 0.6, bright: Math.random() * 0.25 + 0.05,
      target: 0.15, hue: Math.random() > 0.78 ? 250 : 162,
      phase: Math.random() * Math.PI * 2,
    }));
    const pulses: Pulse[] = [];
    const MAX = 195;

    const fire = (i: number) => {
      nodes[i].target = 1;
      nodes.forEach((m, j) => {
        if (j === i) return;
        const dx = nodes[i].x - m.x, dy = nodes[i].y - m.y;
        if (Math.sqrt(dx*dx + dy*dy) < MAX)
          pulses.push({ from: i, to: j, t: 0, speed: 0.007 + Math.random()*0.013, hue: nodes[i].hue });
      });
    };

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (frame % 48 === 0) fire(Math.floor(Math.random() * nodes.length));
      if (frame % 75 === 0) fire(Math.floor(Math.random() * nodes.length));

      nodes.forEach((n, i) => {
        const mdx = mouse.current.x - n.x, mdy = mouse.current.y - n.y;
        const md = Math.sqrt(mdx*mdx + mdy*mdy);
        if (md < 130) { n.vx -= (mdx/md)*0.08; n.vy -= (mdy/md)*0.08; n.target = 1; }
        else n.target = 0.12 + Math.sin(frame*0.018 + n.phase) * 0.08;
        n.bright += (n.target - n.bright) * 0.055;
        n.vx *= 0.99; n.vy *= 0.99; n.x += n.vx; n.y += n.vy;
        if (n.x < 0) n.x = canvas.width; if (n.x > canvas.width) n.x = 0;
        if (n.y < 0) n.y = canvas.height; if (n.y > canvas.height) n.y = 0;

        nodes.forEach((m, j) => {
          if (j <= i) return;
          const dx = n.x - m.x, dy = n.y - m.y, d = Math.sqrt(dx*dx+dy*dy);
          if (d < MAX) {
            const a = (1 - d/MAX) * 0.2;
            const g = ctx.createLinearGradient(n.x, n.y, m.x, m.y);
            g.addColorStop(0, `hsla(${n.hue},80%,65%,${a})`);
            g.addColorStop(1, `hsla(${m.hue},80%,65%,${a})`);
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = g; ctx.lineWidth = 0.75; ctx.stroke();
          }
        });
      });

      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i]; p.t += p.speed;
        if (p.t >= 1) { pulses.splice(i, 1); continue; }
        const f = nodes[p.from], t = nodes[p.to];
        const px = f.x + (t.x - f.x) * p.t, py = f.y + (t.y - f.y) * p.t;
        const fade = Math.sin(p.t * Math.PI);
        const g = ctx.createRadialGradient(px, py, 0, px, py, 9);
        g.addColorStop(0, `hsla(${p.hue},95%,72%,${fade*0.95})`);
        g.addColorStop(1, `hsla(${p.hue},95%,72%,0)`);
        ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
      }

      nodes.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 11);
        g.addColorStop(0, `hsla(${n.hue},80%,68%,${n.bright*0.55})`);
        g.addColorStop(1, "hsla(162,80%,68%,0)");
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r*11, 0, Math.PI*2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fillStyle = `hsla(${n.hue},90%,78%,${n.bright})`; ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMouse); };
  }, []);
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-[1]" />;
}

/* ══════════════════════════════════════════════════════════════
   CUSTOM GLOW CURSOR
══════════════════════════════════════════════════════════════ */
function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement[]>([]);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const TRAIL = 8;

  useEffect(() => {
    // Only enable custom cursor on hoverable devices (desktop with mouse)
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mediaQuery.matches) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => { pos.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.1;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.1;
      if (dot.current) dot.current.style.transform = `translate(${pos.current.x-3}px,${pos.current.y-3}px)`;
      if (ring.current) ring.current.style.transform = `translate(${ringPos.current.x-18}px,${ringPos.current.y-18}px)`;
      trail.current.forEach((el, i) => {
        if (!el) return;
        const f = (i + 1) / TRAIL;
        const lag = 0.06 + f * 0.08;
        const prevX = parseFloat(el.dataset.x ?? String(pos.current.x));
        const prevY = parseFloat(el.dataset.y ?? String(pos.current.y));
        const nx = prevX + (pos.current.x - prevX) * lag;
        const ny = prevY + (pos.current.y - prevY) * lag;
        el.dataset.x = String(nx); el.dataset.y = String(ny);
        el.style.transform = `translate(${nx - 2}px,${ny - 2}px)`;
        el.style.opacity = String(f * 0.35);
      });
      raf.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf.current); };
  }, []);

  if (!enabled) return null;

  return (
    <>
      {/* Trail */}
      {Array.from({ length: TRAIL }).map((_, i) => (
        <div key={i} ref={el => { if (el) trail.current[i] = el; }}
          className="fixed top-0 left-0 w-1 h-1 rounded-full bg-brand-400 pointer-events-none z-[9997]"
          style={{ boxShadow: "0 0 6px 2px rgba(52,211,153,0.5)" }} />
      ))}
      {/* Dot */}
      <div ref={dot} className="fixed top-0 left-0 w-1.5 h-1.5 rounded-full pointer-events-none z-[9999] bg-brand-300"
        style={{ boxShadow: "0 0 12px 4px rgba(52,211,153,0.9), 0 0 25px 8px rgba(52,211,153,0.4)" }} />
      {/* Ring */}
      <div ref={ring} className="fixed top-0 left-0 w-9 h-9 rounded-full pointer-events-none z-[9998] border border-brand-400/50"
        style={{ boxShadow: "0 0 10px rgba(52,211,153,0.25), inset 0 0 10px rgba(52,211,153,0.05)" }} />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   CLICK RIPPLE
══════════════════════════════════════════════════════════════ */
function ClickRipple() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const id = Date.now();
      setRipples(r => [...r.slice(-6), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setRipples(r => r.filter(x => x.id !== id)), 900);
    };
    window.addEventListener("click", fn);
    return () => window.removeEventListener("click", fn);
  }, []);
  return (
    <div className="fixed inset-0 pointer-events-none z-[9990]">
      {ripples.map(r => <div key={r.id} className="click-ripple absolute" style={{ left: r.x, top: r.y }} />)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════════════════════════════════════════ */
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const el = document.documentElement;
    const fn = () => setPct(el.scrollTop / (el.scrollHeight - el.clientHeight) * 100 || 0);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[70]">
      <div className="h-full bg-gradient-to-r from-brand-400 via-cyan-300 to-indigo-400"
        style={{ width: `${pct}%`, boxShadow: "0 0 10px rgba(52,211,153,0.9), 0 0 20px rgba(52,211,153,0.5)", transition: "width 0.1s linear" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   HUD OVERLAY — sci-fi corner readouts
══════════════════════════════════════════════════════════════ */
function HUDOverlay() {
  const [tick, setTick] = useState(0);
  const [scan, setScan] = useState(0);
  useEffect(() => {
    const t1 = setInterval(() => setTick(p => p + 1), 1000);
    const t2 = setInterval(() => setScan(p => (p + 1) % 100), 38);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);
  const t = new Date();
  const timeStr = `${String(t.getUTCHours()).padStart(2,"0")}:${String(t.getUTCMinutes()).padStart(2,"0")}:${String(t.getUTCSeconds()).padStart(2,"0")}`;
  const alertCycle = [0, 0, 1, 0, 0, 1][tick % 6];

  return (
    <div className="fixed inset-0 z-[25] pointer-events-none select-none hidden md:block">
      {/* Corner brackets */}
      {[["top-3 left-3 border-t-2 border-l-2 rounded-tl","tl"],["top-3 right-3 border-t-2 border-r-2 rounded-tr","tr"],
        ["bottom-3 left-3 border-b-2 border-l-2 rounded-bl","bl"],["bottom-3 right-3 border-b-2 border-r-2 rounded-br","br"]].map(([cls, cornerId]) => (
        <div key={cornerId} className={`absolute w-8 h-8 border-brand-400/22 transition-all duration-300 hud-corner-${cornerId} ${cls}`} />
      ))}

      {/* TL */}
      <div className="absolute top-5 left-12 font-mono text-[9px] text-brand-400/38 leading-[1.7]">
        <div className="hud-blink">◉ SYS::ONLINE</div>
        <div>{timeStr} UTC</div>
        <div>NODES 6/6</div>
      </div>

      {/* TR */}
      <div className="absolute top-5 right-12 font-mono text-[9px] text-brand-400/38 text-right leading-[1.7]">
        <div>CGD.AI v2.6.1</div>
        <div>CONF 99.7%</div>
        <div className={alertCycle > 0 ? "text-red-400/70 hud-blink" : "text-brand-400/38"}>
          {alertCycle > 0 ? "ALERT ACTIVE" : "ALERTS 0"}
        </div>
      </div>

      {/* BL */}
      <div className="absolute bottom-5 left-12 font-mono text-[9px] text-brand-400/25 leading-[1.7]">
        <div>LAT 23.02°N</div>
        <div>LON 72.57°E</div>
      </div>

      {/* BR */}
      <div className="absolute bottom-5 right-12 font-mono text-[9px] text-brand-400/25 text-right leading-[1.7]">
        <div>SCAN {scan.toString().padStart(3,"0")}%</div>
        <div>{"■".repeat(Math.floor(scan/10))}{"░".repeat(10-Math.floor(scan/10))}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CIRCUIT SVG LINES — animated electricity traces
══════════════════════════════════════════════════════════════ */
function CircuitLines() {
  return (
    <svg className="fixed inset-0 z-[0] pointer-events-none w-full h-full" style={{ opacity: 0.05 }}>
      <defs>
        <linearGradient id="cg1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="cg2" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
          <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Static grid lines */}
      <line x1="0" y1="22%" x2="100%" y2="22%" stroke="rgba(52,211,153,0.28)" strokeWidth="1"/>
      <line x1="0" y1="78%" x2="100%" y2="78%" stroke="rgba(52,211,153,0.22)" strokeWidth="0.8"/>
      <line x1="10%" y1="0" x2="10%" y2="100%" stroke="rgba(52,211,153,0.18)" strokeWidth="0.8"/>
      <line x1="90%" y1="0" x2="90%" y2="100%" stroke="rgba(52,211,153,0.18)" strokeWidth="0.8"/>
      {/* Junction dots */}
      <circle cx="10%" cy="22%" r="3" fill="rgba(52,211,153,0.5)"/>
      <circle cx="90%" cy="22%" r="3" fill="rgba(52,211,153,0.5)"/>
      <circle cx="10%" cy="78%" r="2.5" fill="rgba(52,211,153,0.4)"/>
      <circle cx="90%" cy="78%" r="2.5" fill="rgba(52,211,153,0.4)"/>
      {/* Animated traces */}
      <rect height="2" width="18%" fill="url(#cg1)" y="21.2%">
        <animateTransform attributeName="transform" type="translate" from="-20% 0" to="120% 0" dur="3.8s" repeatCount="indefinite"/>
      </rect>
      <rect height="1.5" width="14%" fill="url(#cg2)" y="77.4%">
        <animateTransform attributeName="transform" type="translate" from="120% 0" to="-20% 0" dur="5s" repeatCount="indefinite" begin="1.5s"/>
      </rect>
      <rect height="1.5" width="1.5%" fill="rgba(52,211,153,0.9)" x="9.5%" y="0">
        <animateTransform attributeName="transform" type="translate" from="0 -10%" to="0 110%" dur="4.2s" repeatCount="indefinite" begin="0.8s"/>
      </rect>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   NOISE OVERLAY — film grain texture
══════════════════════════════════════════════════════════════ */
function NoiseOverlay() {
  return (
    <svg className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]" style={{ width:"100%",height:"100%" }}>
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
      <rect width="100%" height="100%" filter="url(#n)"/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   GLITCH TEXT
══════════════════════════════════════════════════════════════ */
function GlitchText({ text, className }: { text: string; className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const go = () => { setOn(true); setTimeout(() => setOn(false), 320); };
    const id = setInterval(go, 3200 + Math.random()*2000);
    return () => clearInterval(id);
  }, []);
  return <span className={`relative inline-block ${on ? "glitch" : ""} ${className ?? ""}`} data-text={text}>{text}</span>;
}

/* ══════════════════════════════════════════════════════════════
   TEXT SCRAMBLE REVEAL
══════════════════════════════════════════════════════════════ */
const SC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#∑≠∆√∞";
function ScrambleText({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  const [out, setOut] = useState(text.replace(/[^ ]/g, () => SC[Math.floor(Math.random()*SC.length)]));
  const done = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (done.current) return; done.current = true;
      let iter = 0;
      const id = setInterval(() => {
        setOut(text.split("").map((c, i) => {
          if (c === " ") return " ";
          if (i < iter) return c;
          return SC[Math.floor(Math.random()*SC.length)];
        }).join(""));
        iter += 0.55;
        if (iter > text.length) clearInterval(id);
      }, 32);
    }, delay);
    return () => clearTimeout(t);
  }, [text, delay]);
  return <span className={`font-mono ${className ?? ""}`}>{out}</span>;
}

/* ══════════════════════════════════════════════════════════════
   WORD-BY-WORD CINEMATIC REVEAL
══════════════════════════════════════════════════════════════ */
function WordReveal({ text, className, baseDelay = 0 }: { text: string; className?: string; baseDelay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), baseDelay); return () => clearTimeout(t); }, [baseDelay]);
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.3em] last:mr-0">
          <span className="inline-block" style={{
            transform: show ? "translateY(0) skewX(0deg)" : "translateY(115%) skewX(-6deg)",
            opacity: show ? 1 : 0,
            transition: `transform 0.8s cubic-bezier(.22,.61,.36,1) ${baseDelay + i*75}ms, opacity 0.6s ease ${baseDelay + i*75}ms`,
          }}>{w}</span>
        </span>
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   TYPEWRITER WITH GRADIENT
══════════════════════════════════════════════════════════════ */
const PHRASES = ["manual checks.", "legacy alerts.", "disconnected tools.", "delayed response.", "paper trails."];
function TypewriterWord() {
  const [idx, setIdx] = useState(0);
  const [txt, setTxt] = useState("");
  const [del, setDel] = useState(false);
  useEffect(() => {
    const target = PHRASES[idx];
    if (!del && txt === target) { const t = setTimeout(() => setDel(true), 2400); return () => clearTimeout(t); }
    if (del && txt === "") { setDel(false); setIdx(i => (i + 1) % PHRASES.length); return; }
    const t = setTimeout(() => setTxt(del ? txt.slice(0,-1) : target.slice(0, txt.length+1)), del ? 36 : 72);
    return () => clearTimeout(t);
  }, [txt, del, idx]);
  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-emerald-300 to-cyan-400 animate-gradient-shift bg-[length:200%_auto]">
      {txt}
      <span className="inline-block w-[3px] h-[0.8em] bg-brand-300 ml-1 align-middle animate-blink rounded-sm" />
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   HOLOGRAPHIC 3D TILT CARD
══════════════════════════════════════════════════════════════ */
function HoloCard({ children, accent = "brand" }: { children: React.ReactNode; accent?: "brand" | "indigo" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, shine: 0, over: false });

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rc = ref.current!.getBoundingClientRect();
    const x = (e.clientX - rc.left) / rc.width, y = (e.clientY - rc.top) / rc.height;
    setS({ rx: (y-0.5)*-18, ry: (x-0.5)*18, gx: x*100, gy: y*100, shine: Math.sqrt((x-0.5)**2+(y-0.5)**2), over: true });
  }, []);
  const onLeave = useCallback(() => setS({ rx:0, ry:0, gx:50, gy:50, shine:0, over:false }), []);

  const base = accent === "brand" ? "52,211,153" : "129,140,248";
  const H = s.gx * 3.6;

  return (
    <div ref={ref}
      className={`group relative rounded-3xl overflow-hidden cursor-pointer card-anim ${accent === "brand" ? "card-anim-1" : "card-anim-2"}`}
      style={{
        transform: `perspective(900px) rotateX(${s.rx}deg) rotateY(${s.ry}deg) scale(${s.over ? 1.025 : 1})`,
        transition: !s.over ? "transform 0.7s cubic-bezier(.22,.61,.36,1)" : "transform 0.08s linear",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
      }}
      onMouseMove={onMove} onMouseLeave={onLeave}>
      {/* Iridescent rainbow */}
      {s.over && (
        <div className="absolute inset-0 pointer-events-none z-[2]"
          style={{ background: `radial-gradient(ellipse at ${s.gx}% ${s.gy}%, hsla(${H},100%,70%,0.14), hsla(${H+70}deg,100%,70%,0.07) 38%, hsla(${H+140}deg,100%,70%,0.04) 58%, transparent 72%)` }} />
      )}
      {/* Specular glare */}
      <div className="absolute inset-0 pointer-events-none z-[2]"
        style={{ background: `radial-gradient(circle at ${s.gx}% ${s.gy}%, rgba(255,255,255,${s.shine*0.07}), transparent 55%)` }} />
      {/* Border glow */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none z-[1]" style={{
        boxShadow: s.over ? `0 0 35px -6px rgba(${base},0.35), inset 0 0 45px -22px rgba(${base},0.18)` : "none",
        transition: "box-shadow 0.35s ease",
      }}/>
      {/* Animated top shimmer line */}
      <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(${base},0.6)] to-transparent transition-opacity duration-500 ${s.over ? "opacity-100" : "opacity-0"}`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON WITH INNER RIPPLE
══════════════════════════════════════════════════════════════ */
function MagButton({ children, href, className, primary = false }: {
  children: React.ReactNode; href: string; className?: string; primary?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [rip, setRip] = useState<{ x: number; y: number } | null>(null);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rc = ref.current!.getBoundingClientRect();
    setPos({ x: (e.clientX - rc.left - rc.width/2)*0.32, y: (e.clientY - rc.top - rc.height/2)*0.32 });
  };
  const onLeave = () => setPos({ x:0, y:0 });
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rc = ref.current!.getBoundingClientRect();
    setRip({ x: e.clientX - rc.left, y: e.clientY - rc.top });
    setTimeout(() => setRip(null), 700);
  };

  return (
    <Link ref={ref} href={href} className={`relative overflow-hidden inline-flex items-center gap-2 ${className}`}
      onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}
      style={{ transform: `translate(${pos.x}px,${pos.y}px)`, transition: "transform 0.22s cubic-bezier(.22,.61,.36,1)" }}>
      {/* Shimmer sweep */}
      {primary && <span className="btn-shimmer absolute inset-0 pointer-events-none" />}
      {/* Inner ripple */}
      {rip && <span className="btn-ripple absolute rounded-full pointer-events-none" style={{ left: rip.x, top: rip.y }} />}
      {children}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════
   ECOSYSTEM RADAR — hierarchical platform map
   Core → 5 intelligence domains → 24 capabilities.
   Hover explores, click pins, Esc releases. Capabilities are
   progressively revealed so the map stays legible at any scale.
══════════════════════════════════════════════════════════════ */
type EcoFeature = { label: string; href: string; desc: string; sos?: boolean };
type EcoDomain = {
  id: string; label: string; deg: number; rgb: string; href: string;
  cta: string; tagline: string; chips: string[];
  icon: React.ReactNode; features: EcoFeature[];
};

const ECO_SIZE = 720, ECO_C = ECO_SIZE / 2, ECO_R1 = 175;
const ecoPos = (deg: number, r: number) => ({
  x: ECO_C + Math.cos(deg * Math.PI / 180) * r,
  y: ECO_C + Math.sin(deg * Math.PI / 180) * r,
});

const ECO_DOMAINS: EcoDomain[] = [
  {
    id: "customer", label: "Customer Intelligence", deg: -90, rgb: "52,211,153",
    href: "/customer", cta: "Open Customer Suite",
    tagline: "Every customer interaction — billing, safety, loyalty — made legible by AI.",
    chips: ["6 modules", "3 languages", "Leak detection from bills"],
    icon: <User className="w-5 h-5" />,
    features: [
      { label: "ExplainBill AI",   href: "/customer/explainbill",  desc: "Explains every rupee of a bill — and spots in-home leaks from usage patterns." },
      { label: "Customer Health",  href: "/customer/health",       desc: "A 0–100 safety & service index for every household." },
      { label: "Voice of Customer",href: "/customer/voice",        desc: "Feedback with a visible you-said-we-did loop." },
      { label: "TrustPoints",      href: "/customer/trustpoints",  desc: "Rewards safety behaviour, not spend." },
      { label: "PNG Status",       href: "/customer/connection",   desc: "Live tracker for new connections — who is waiting on whom." },
      { label: "Appointment AI",   href: "/customer/appointment",  desc: "Guided booking with live engineer tracking." },
    ],
  },
  {
    id: "safety", label: "Safety Operations", deg: -18, rgb: "251,191,36",
    href: "/safety", cta: "Open Safety Suite",
    tagline: "From live grid telemetry to one-tap SOS — a control room that never blinks.",
    chips: ["6 live zones", "1.2s AI pickup", "Auto-dispatch crews"],
    icon: <ShieldAlert className="w-5 h-5" />,
    features: [
      { label: "GasCare SOS",         href: "/customer/gascare",              desc: "One-tap trilingual emergency triage — voice-first, panic-proof.", sos: true },
      { label: "Pipeline Monitoring", href: "/safety/dashboard-gas-guard",    desc: "Live PPM, pressure & flow across six city zones." },
      { label: "Incident Response",   href: "/safety/emergency",              desc: "Acknowledge → dispatch → close, fully auditable." },
      { label: "Smart Notify",        href: "/safety/smartnotify",            desc: "PNGRB 48-hour notices over WhatsApp, with delivery proof." },
      { label: "Station Readiness",   href: "/safety/station-readiness",      desc: "Daily readiness scoring for every station." },
      { label: "SafeZone CCTV",       href: "/safety/emergency",              desc: "YOLOv8 vision flags PPE violations on site footage." },
    ],
  },
  {
    id: "revenue", label: "Revenue Intelligence", deg: 54, rgb: "34,211,238",
    href: "/intelligence/revenue-guard", cta: "Open in Intelligence Suite",
    tagline: "Finds hidden money in data the utility already has.",
    chips: ["₹27.3L risk flagged", "91% precision", "2.4L accounts scanned"],
    icon: <IndianRupee className="w-5 h-5" />,
    features: [
      { label: "Revenue Guard",        href: "/intelligence/revenue-guard", desc: "2.4L accounts continuously scanned for hidden revenue loss." },
      { label: "Theft Detection",      href: "/safety/rev-guard",           desc: "Flatlines, bypasses & night spikes, ranked by ₹ at risk." },
      { label: "Billing Intelligence", href: "/customer/explainbill",       desc: "Tariff, usage & cycle effects decomposed per bill." },
      { label: "Compensation Shield",  href: "/intelligence/sla",           desc: "Predicts PNGRB payouts before deadlines are missed." },
    ],
  },
  {
    id: "operations", label: "Operations", deg: 126, rgb: "167,139,250",
    href: "/safety", cta: "Open Safety Suite",
    tagline: "Predictive upkeep and regulatory clocks, always ahead of the breach.",
    chips: ["2,847 assets", "63 breaches prevented", "24h · 7d · 15d SLAs"],
    icon: <Cog className="w-5 h-5" />,
    features: [
      { label: "SLA Sentinel",           href: "/safety/sla-sentinel",      desc: "Live 24h / 7d / 15d compliance countdowns per ticket." },
      { label: "Asset Health",           href: "/safety/asset-health",      desc: "2,847 assets ranked by failure risk." },
      { label: "Contractor Safety",      href: "/safety/contractor-safety", desc: "Safety scorecards & expiring certifications." },
      { label: "Predictive Maintenance", href: "/safety/asset-health",      desc: "Fix-before-failure scheduling from sensor trends." },
    ],
  },
  {
    id: "executive", label: "Executive Intelligence", deg: 198, rgb: "129,140,248",
    href: "/intelligence", cta: "Open Intelligence Suite",
    tagline: "The whole utility on one screen — decisions, not dashboards.",
    chips: ["2.4M data points", "96.2% forecast accuracy", "99.97% uptime"],
    icon: <LineChart className="w-5 h-5" />,
    features: [
      { label: "Command Center", href: "/intelligence/command",  desc: "Network posture: 8 zones, 99.97% supply uptime." },
      { label: "AI Insights",    href: "/intelligence/insights", desc: "47 optimization insights mined from 2.4M data points." },
      { label: "Forecasting",    href: "/intelligence/insights", desc: "96.2% accurate demand & risk forecasts." },
      { label: "Business KPIs",  href: "/intelligence",          desc: "Money saved, breaches prevented, trust earned." },
    ],
  },
];

/** Fan a domain's features across an arc centred on the domain's angle. */
function ecoFeatureGeo(d: EcoDomain, i: number) {
  const n = d.features.length;
  const spacing = n > 4 ? 24 : 27;
  const deg = d.deg + (i - (n - 1) / 2) * spacing;
  const r = 265 + (i % 3) * 38; // three shells: neighbours always separate radially or angularly
  return { deg, r, ...ecoPos(deg, r) };
}

function EcosystemRadar() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [featHover, setFeatHover] = useState<{ d: string; i: number } | null>(null);
  const [coreHover, setCoreHover] = useState(false);
  const [attract, setAttract] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const glowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pulseRefs = useRef<(SVGCircleElement | null)[]>([]);
  const attractIdx = useRef(0);
  const resumeTimer = useRef<number | null>(null);

  const activeId = pinned ?? hovered;
  const activeDomain = ECO_DOMAINS.find(d => d.id === activeId) ?? null;
  const totalFeatures = ECO_DOMAINS.reduce((s, d) => s + d.features.length, 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPinned(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Entrance choreography + scroll depth (GSAP) ── */
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    // Keep the entrance on wall-clock time even when early frames are slow,
    // so it stays in sync with the attract-mode timers.
    gsap.ticker.lagSmoothing(0);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.25 });
      tl.from(".eco-entr-core", { scale: 0.3, opacity: 0, duration: 0.8, ease: "back.out(1.6)" })
        .fromTo(".eco-burst", { scale: 0.5, opacity: 0.6 }, { scale: 2.6, opacity: 0, duration: 1.2, ease: "power2.out" }, "-=0.45")
        .from(".eco-entr-rings", { opacity: 0, scale: 0.88, svgOrigin: "360 360", duration: 0.9 }, "-=0.75")
        .from(".eco-entr-ringdiv", { opacity: 0, duration: 0.9, stagger: 0.12 }, "<")
        .from(".eco-entr-sweep", { opacity: 0, duration: 0.9 }, "-=0.5")
        .from(".eco-entr-domain", {
          x: (_i: number, el: Element) => parseFloat((el as HTMLElement).dataset.dx ?? "0"),
          y: (_i: number, el: Element) => parseFloat((el as HTMLElement).dataset.dy ?? "0"),
          scale: 0.2, opacity: 0, duration: 0.85, ease: "back.out(1.3)", stagger: 0.09,
        }, "-=0.55")
        .from(".eco-entr-spines", { opacity: 0, duration: 0.7 }, "-=0.4")
        .from(".eco-entr-panel", { opacity: 0, y: 14, duration: 0.6 }, "-=0.35");
      gsap.to(".eco-scroll-scale", {
        scale: 1.05, opacity: 0.55, ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top 15%", end: "bottom top", scrub: 0.6 },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  /* ── Ambient life: sweep rotation + node illumination + spine energy + parallax ──
     One rAF loop, ref-writes only — zero React re-renders. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tgt = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const onMove = (e: MouseEvent) => {
      tgt.x = (e.clientX / window.innerWidth - 0.5) * -14;
      tgt.y = (e.clientY / window.innerHeight - 0.5) * -10;
    };
    window.addEventListener("mousemove", onMove);
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const t = (now - t0) / 1000;
      // Radar sweep — the conic wedge's bright edge points "up" at rotation 0
      const sweepDeg = ((t / 14) * 360) % 360;
      if (sweepRef.current) sweepRef.current.style.transform = `rotate(${sweepDeg}deg)`;
      const pointing = sweepDeg - 90; // math coords: -90° is up
      ECO_DOMAINS.forEach((d, i) => {
        // Illuminate a node as the sweep passes over it
        const delta = Math.abs((((d.deg - pointing) % 360) + 540) % 360 - 180);
        const g = Math.max(0, 1 - delta / 26);
        const glow = glowRefs.current[i];
        if (glow) glow.style.opacity = String(g * 0.6);
        // Energy pulse travelling from the core along each spine
        const f = (t * 0.16 + i * 0.23) % 1;
        const pp = ecoPos(d.deg, 74 + f * (ECO_R1 - 112));
        const dot = pulseRefs.current[i];
        if (dot) {
          dot.setAttribute("cx", String(pp.x));
          dot.setAttribute("cy", String(pp.y));
          dot.setAttribute("opacity", String(0.55 * Math.sin(f * Math.PI)));
        }
      });
      // Command-deck parallax, lerped, max ~7px
      cur.x += (tgt.x - cur.x) * 0.05;
      cur.y += (tgt.y - cur.y) * 0.05;
      if (parallaxRef.current) parallaxRef.current.style.transform = `translate3d(${cur.x}px,${cur.y}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); };
  }, []);

  /* ── Attract mode: auto-tour the domains while the visitor is idle ── */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setAttract(true), 4200);
    return () => {
      clearTimeout(t);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!attract || pinned) return;
    const advance = () => {
      setHovered(ECO_DOMAINS[attractIdx.current % ECO_DOMAINS.length].id);
      attractIdx.current += 1;
    };
    advance();
    const id = window.setInterval(advance, 4600);
    return () => clearInterval(id);
  }, [attract, pinned]);
  const engage = () => {
    setAttract(false);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  };
  const disengage = () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setAttract(true), 9000);
  };

  const hoveredFeature =
    featHover && activeDomain && featHover.d === activeDomain.id
      ? activeDomain.features[featHover.i] : null;

  return (
    <div ref={rootRef} className="flex flex-col items-center">
      <div className="eco-scroll-scale flex flex-col items-center will-change-transform">
        <div
          className="relative w-[340px] h-[350px] sm:w-[600px] sm:h-[580px] lg:w-[840px] lg:h-[720px] mx-auto flex items-center justify-center overflow-visible"
          onPointerEnter={engage}
          onMouseLeave={() => { setHovered(null); setFeatHover(null); disengage(); }}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setHovered(null); disengage(); }
          }}
          onFocusCapture={engage}
        >
          <div className="absolute w-[720px] h-[720px] scale-[0.45] sm:scale-[0.78] lg:scale-100 origin-center flex-shrink-0">
            <div ref={parallaxRef} className="relative w-full h-full will-change-transform">

              {/* ── SVG underlay: orbits + connection lines + energy pulses ── */}
              <svg width={ECO_SIZE} height={ECO_SIZE} className="absolute inset-0 overflow-visible" aria-hidden="true">
                <g className="eco-entr-rings">
                  <circle cx={ECO_C} cy={ECO_C} r={ECO_R1} fill="none" stroke="rgba(255,255,255,0.07)" strokeDasharray="2 7" />
                  <circle cx={ECO_C} cy={ECO_C} r={306} fill="none" stroke="rgba(255,255,255,0.045)" strokeDasharray="2 9" />
                </g>

                <g className="eco-entr-spines">
                  {ECO_DOMAINS.map((d, di) => {
                    const p = ecoPos(d.deg, ECO_R1);
                    const isActive = activeId === d.id;
                    const dimmed = activeId !== null && !isActive;
                    return (
                      <g key={d.id}>
                        {/* core → domain spine */}
                        <line
                          x1={ECO_C} y1={ECO_C} x2={p.x} y2={p.y}
                          stroke={`rgba(${d.rgb},${isActive ? 0.6 : dimmed ? 0.06 : coreHover ? 0.42 : 0.18})`}
                          strokeWidth={isActive ? 1.5 : 1}
                          strokeDasharray={isActive ? "4 10" : undefined}
                          className={isActive ? "eco-flow" : undefined}
                          style={{ transition: "stroke 0.35s ease" }}
                        />
                        {/* travelling energy pulse */}
                        <circle
                          ref={el => { pulseRefs.current[di] = el; }}
                          r={2.2} fill={`rgba(${d.rgb},0.9)`} opacity={0}
                        />
                        {/* domain → capability threads, drawn on reveal */}
                        {d.features.map((f, i) => {
                          const fp = ecoFeatureGeo(d, i);
                          return (
                            <line
                              key={f.label + i}
                              x1={p.x} y1={p.y} x2={fp.x} y2={fp.y}
                              pathLength={1} strokeDasharray="1"
                              strokeDashoffset={isActive ? 0 : 1}
                              stroke={`rgba(${f.sos ? "248,113,113" : d.rgb},0.35)`}
                              strokeWidth={1}
                              style={{ transition: `stroke-dashoffset 0.5s cubic-bezier(.22,.61,.36,1) ${isActive ? 90 + i * 45 : 0}ms` }}
                            />
                          );
                        })}
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* ── Radar sweep (rotation driven by the ambient rAF loop) ── */}
              <div className="eco-entr-sweep absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] pointer-events-none">
                <div ref={sweepRef} className="absolute inset-0 rounded-full will-change-transform"
                  style={{
                    background: "conic-gradient(from 0deg, transparent 0deg, transparent 288deg, rgba(52,211,153,0.05) 322deg, rgba(52,211,153,0.16) 357deg, transparent 360deg)",
                    maskImage: "radial-gradient(circle, black 30%, transparent 72%)",
                    WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 72%)",
                  }} />
              </div>

              {/* ── Slow structural rings ── */}
              <div className="eco-entr-ringdiv absolute inset-3 rounded-full border border-brand-400/[0.10] eco-spin-slow" style={{ borderStyle: "dashed" }} />
              <div className="eco-entr-ringdiv absolute inset-[152px] rounded-full border border-brand-400/[0.07] eco-spin-rev" style={{ borderStyle: "dashed" }} />

              {/* ── Core node ── */}
              <div className="absolute z-10 pointer-events-none" style={{ left: ECO_C, top: ECO_C }}>
                <div className="-translate-x-1/2 -translate-y-1/2 w-max">
                  <div className="eco-entr-core relative flex flex-col items-center">
                    {/* halo — brightens when the core is engaged */}
                    <div className="absolute left-1/2 top-[64px] -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full pointer-events-none"
                      style={{
                        background: "radial-gradient(circle, rgba(52,211,153,0.13), transparent 62%)",
                        opacity: coreHover ? 1 : 0.55, transition: "opacity 0.4s ease",
                      }} />
                    <button
                      type="button" aria-label="SuRaksha AI core — reset view"
                      onClick={() => { setPinned(null); setHovered(null); }}
                      onMouseEnter={() => setCoreHover(true)}
                      onMouseLeave={() => setCoreHover(false)}
                      className="pointer-events-auto relative w-[128px] h-[128px] rounded-full grid place-items-center focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70"
                      style={{ transform: `scale(${coreHover ? 1.045 : 1})`, transition: "transform 0.35s cubic-bezier(.22,.61,.36,1)" }}>
                      <span className="eco-core-breath absolute inset-0 rounded-full"
                        style={{
                          background: "radial-gradient(circle, rgba(52,211,153,0.18), rgba(2,6,23,0.7) 72%)",
                          border: "1px solid rgba(52,211,153,0.42)",
                          boxShadow: coreHover
                            ? "0 0 70px -10px rgba(52,211,153,0.6), inset 0 0 34px -8px rgba(52,211,153,0.4)"
                            : "0 0 54px -10px rgba(52,211,153,0.42), inset 0 0 30px -10px rgba(52,211,153,0.3)",
                          transition: "box-shadow 0.4s ease",
                        }} />
                      <span className="eco-burst absolute inset-0 rounded-full border-2 border-brand-300/45 pointer-events-none" />
                      <span className="absolute -inset-3 rounded-full border border-dashed border-brand-400/25 eco-spin-slow pointer-events-none" />
                      <span className="absolute -inset-[26px] rounded-full border border-brand-400/[0.12] eco-spin-rev pointer-events-none" style={{ borderStyle: "dashed" }} />
                      <span className="absolute inset-0 rounded-full border border-brand-400/30 animate-ping-slow pointer-events-none" />
                      <BrainCircuit className="w-10 h-10 text-brand-300 relative" />
                    </button>
                    <div className="mt-3 text-center pointer-events-none select-none">
                      <div className="text-[13px] font-bold tracking-[0.18em] text-white/90">
                        SURAKSHA <span className="text-brand-300">AI CORE</span>
                      </div>
                      <div className="text-[10px] font-mono text-brand-400/60 mt-0.5">
                        {totalFeatures} CAPABILITIES · ONLINE
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Domain nodes ── */}
              {ECO_DOMAINS.map((d, di) => {
                const p = ecoPos(d.deg, ECO_R1);
                const isActive = activeId === d.id;
                const dimmed = activeId !== null && !isActive;
                return (
                  <div key={d.id} className="absolute z-10 pointer-events-none" style={{ left: p.x, top: p.y }}>
                    <div className="-translate-x-1/2 -translate-y-1/2 w-max">
                      <div className="eco-entr-domain" data-dx={ECO_C - p.x} data-dy={ECO_C - p.y}>
                        <button
                          type="button"
                          aria-expanded={isActive} aria-label={`${d.label} — explore capabilities`}
                          onMouseEnter={() => setHovered(d.id)}
                          onFocus={() => setHovered(d.id)}
                          onClick={() => setPinned(prev => (prev === d.id ? null : d.id))}
                          className="pointer-events-auto flex flex-col items-center gap-2 cursor-pointer focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 rounded-full"
                          style={{
                            transform: `scale(${dimmed ? 0.92 : isActive ? 1.06 : coreHover ? 1.03 : 1})`,
                            opacity: dimmed ? 0.3 : 1,
                            transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(.22,.61,.36,1)",
                          }}>
                          <span className="eco-node-breath relative grid place-items-center w-[64px] h-[64px] rounded-full backdrop-blur-sm"
                            style={{
                              color: `rgb(${d.rgb})`,
                              border: `1px solid rgba(${d.rgb},${isActive ? 0.8 : coreHover ? 0.55 : 0.35})`,
                              background: `rgba(${d.rgb},${isActive ? 0.16 : 0.07})`,
                              boxShadow: isActive ? `0 0 30px -4px rgba(${d.rgb},0.55)` : "none",
                              transition: "border-color 0.3s, background 0.3s, box-shadow 0.3s",
                              animationDelay: `${di * 0.7}s`,
                            }}>
                            {/* sweep illumination layer, driven by the rAF loop */}
                            <span
                              ref={el => { glowRefs.current[di] = el; }}
                              className="absolute -inset-3 rounded-full pointer-events-none"
                              style={{ background: `radial-gradient(circle, rgba(${d.rgb},0.4), transparent 70%)`, opacity: 0 }} />
                            {d.icon}
                            {isActive && <span className="absolute inset-0 rounded-full border animate-ping-slow" style={{ borderColor: `rgba(${d.rgb},0.45)` }} />}
                            {pinned === d.id && <span className="eco-dot absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: `rgb(${d.rgb})` }} />}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: isActive ? `rgb(${d.rgb})` : "rgba(255,255,255,0.55)", transition: "color 0.3s" }}>
                            {d.label}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── Capability pills (revealed for the active domain) ── */}
              {ECO_DOMAINS.map(d => {
                const dp = ecoPos(d.deg, ECO_R1);
                const isActive = activeId === d.id;
                return d.features.map((f, i) => {
                  const fp = ecoFeatureGeo(d, i);
                  const inX = (dp.x - fp.x) * 0.2, inY = (dp.y - fp.y) * 0.2;
                  const isHot = isActive && featHover?.d === d.id && featHover.i === i;
                  const rgb = f.sos ? "248,113,113" : d.rgb;
                  // Donut-label anchoring: text extends away from the circle so
                  // neighbouring pills near the crown never collide.
                  const cosd = Math.cos(fp.deg * Math.PI / 180);
                  const anchor = cosd > 0.35 ? "left" : cosd < -0.35 ? "right" : "center";
                  const anchorT =
                    anchor === "left" ? "translate(-16px,-50%)"
                    : anchor === "right" ? "translate(calc(-100% + 16px),-50%)"
                    : "translate(-50%,-50%)";
                  return (
                    <Link
                      key={d.id + f.label + i} href={f.href}
                      tabIndex={isActive ? 0 : -1} aria-hidden={!isActive}
                      onMouseEnter={() => setFeatHover({ d: d.id, i })}
                      onMouseLeave={() => setFeatHover(h => (h && h.d === d.id && h.i === i ? null : h))}
                      onFocus={() => setFeatHover({ d: d.id, i })}
                      className={`eco-pill absolute z-20 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-medium whitespace-nowrap backdrop-blur-md focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 ${anchor === "right" ? "flex-row-reverse" : ""}`}
                      style={{
                        left: fp.x, top: fp.y,
                        background: isHot ? `rgba(${rgb},0.13)` : "rgba(2,6,23,0.72)",
                        border: `1px solid rgba(${rgb},${isHot ? 0.75 : 0.3})`,
                        color: isHot ? `rgb(${rgb})` : "rgba(255,255,255,0.82)",
                        boxShadow: isHot ? `0 0 20px -4px rgba(${rgb},0.6)` : "none",
                        opacity: isActive ? 1 : 0,
                        transform: `${anchorT} translate(${isActive ? 0 : inX}px, ${isActive ? 0 : inY}px) scale(${isActive ? (isHot ? 1.07 : 1) : 0.6})`,
                        pointerEvents: isActive ? "auto" : "none",
                        transition: `opacity 0.35s ease ${isActive ? 110 + i * 45 : 0}ms, transform 0.45s cubic-bezier(.22,.61,.36,1) ${isActive ? 110 + i * 45 : 0}ms, border-color 0.2s, color 0.2s, background 0.2s, box-shadow 0.2s`,
                      }}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: `rgb(${rgb})`, boxShadow: `0 0 7px rgba(${rgb},0.8)` }} />
                      {f.label}
                    </Link>
                  );
                });
              })}
            </div>
          </div>
        </div>

        {/* ── Intel panel ── */}
        <div className="eco-entr-panel mt-2 sm:mt-5 min-h-[186px] sm:min-h-[158px] w-full max-w-xl mx-auto text-center px-4">
          {activeDomain ? (
            <div key={activeDomain.id} className="anim-fade-up" style={{ animationDuration: "0.35s" }}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold" style={{ color: `rgb(${activeDomain.rgb})` }}>{activeDomain.label}</span>
                <span className="text-[10px] uppercase tracking-widest text-ink-500">
                  {activeDomain.features.length} capabilities
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-ink-400 mt-1.5 leading-relaxed min-h-[36px] flex items-center justify-center">
                {hoveredFeature ? (
                  <span><span className="font-semibold text-ink-200">{hoveredFeature.label}</span> — {hoveredFeature.desc}</span>
                ) : activeDomain.tagline}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
                {activeDomain.chips.map(c => (
                  <span key={c} className="text-[10px] font-medium text-ink-300 bg-white/[0.04] border border-white/[0.09] px-2.5 py-1 rounded-full tabular-nums">
                    {c}
                  </span>
                ))}
              </div>
              {/* Mobile: capabilities as tappable chips since orbit labels are scaled down */}
              <div className="flex sm:hidden flex-wrap items-center justify-center gap-1.5 mt-2.5">
                {activeDomain.features.map(f => (
                  <Link key={f.label} href={f.href}
                    className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border"
                    style={{ color: "rgba(255,255,255,0.8)", borderColor: `rgba(${f.sos ? "248,113,113" : activeDomain.rgb},0.35)`, background: "rgba(255,255,255,0.03)" }}>
                    <span className="w-1 h-1 rounded-full" style={{ background: `rgb(${f.sos ? "248,113,113" : activeDomain.rgb})` }} />
                    {f.label}
                  </Link>
                ))}
              </div>
              <Link href={activeDomain.href}
                className="group inline-flex items-center gap-1.5 mt-3 text-xs font-semibold hover:gap-2.5 transition-all duration-200"
                style={{ color: `rgb(${activeDomain.rgb})` }}>
                {activeDomain.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="pt-2">
              <p className="text-[13px] text-ink-300 font-medium">
                One AI core · 5 intelligence domains · {totalFeatures} live capabilities
              </p>
              <p className="text-[10px] text-ink-600 uppercase tracking-widest mt-2">
                <span className="hidden sm:inline">Hover a domain to explore · click to pin · Esc to release</span>
                <span className="sm:hidden">Tap a domain to explore the platform</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ANIMATED SVG PROGRESS RING + COUNTER
══════════════════════════════════════════════════════════════ */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let v = 0;
        const go = () => { v = Math.min(v + Math.ceil((to-v)*0.055)||1, to); setVal(v); if(v<to) requestAnimationFrame(go); };
        requestAnimationFrame(go);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

function StatCard({ value, suffix, label, icon, delay, pct }: {
  value: number; suffix?: string; label: string; icon: React.ReactNode; delay: number; pct: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const r = 22, circ = 2*Math.PI*r;
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting) setVisible(true); }, { threshold:0.3 });
    if(ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref}
      className="group relative text-center p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-brand-400/35 transition-all duration-500 overflow-hidden"
      style={{ opacity:visible?1:0, transform:visible?"translateY(0)":"translateY(30px)", transition:`opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms, border-color 0.3s` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative inline-flex items-center justify-center mb-3">
        <svg width="58" height="58" className="-rotate-90 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">
          <circle cx="29" cy="29" r={r} fill="none" stroke="rgba(52,211,153,0.1)" strokeWidth="3"/>
          <circle cx="29" cy="29" r={r} fill="none" stroke="url(#statRing)" strokeWidth="3"
            strokeDasharray={circ} strokeDashoffset={visible ? circ*(1-pct) : circ}
            strokeLinecap="round"
            style={{ transition:`stroke-dashoffset 1.8s cubic-bezier(.22,.61,.36,1) ${delay+300}ms` }}/>
          <defs>
            <linearGradient id="statRing" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#34d399"/>
              <stop offset="100%" stopColor="#06b6d4"/>
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute text-brand-300 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      </div>
      <div className="text-3xl font-extrabold text-white tabular-nums"><Counter to={value} suffix={suffix}/></div>
      <div className="text-xs text-ink-400 mt-1 font-medium">{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MORPHING BLOB BEHIND HERO
══════════════════════════════════════════════════════════════ */
function MorphBlob() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] pointer-events-none -z-10">
      <div className="morph-blob w-full h-full bg-gradient-to-br from-brand-500/[0.07] via-cyan-500/[0.04] to-indigo-500/[0.06] blur-2xl" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   FEATURE BADGE
══════════════════════════════════════════════════════════════ */
function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-300 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg hover:border-brand-400/45 hover:text-brand-300 hover:bg-brand-500/[0.06] transition-all duration-200 cursor-default">
      {icon} {label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Force dark background on body for the landing page to prevent mobile light leaks
    const prevBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#020617";

    const onMove = (e: MouseEvent) => setParallax({ x: e.clientX/window.innerWidth - 0.5, y: e.clientY/window.innerHeight - 0.5 });
    window.addEventListener("mousemove", onMove);

    return () => {
      document.body.style.backgroundColor = prevBg;
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-x-hidden cursor-none custom-cursor-active">
      <meta name="theme-color" content="#020617" />

      {/* ── Layer 0: Atmosphere ── */}
      <AuroraBackground />
      <NeuralNetCanvas />
      <CircuitLines />
      <NoiseOverlay />

      {/* ── Layer 0: Scan sweep ── */}
      <div className="fixed inset-0 z-[2] pointer-events-none overflow-hidden">
        <div className="scan-sweep absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-400/25 to-transparent" />
      </div>

      {/* ── Grid ── */}
      <div className="fixed inset-0 z-[0] pointer-events-none bg-grid-pattern opacity-[0.028]" />

      {/* ── Parallax orbs ── */}
      <div className="fixed w-[700px] h-[700px] -top-48 -right-40 rounded-full blur-[80px] bg-brand-500/[0.10] pointer-events-none z-[0]"
        style={{ transform:`translate(${parallax.x*-35}px,${parallax.y*-35}px)`, animation:"orbFloat1 20s ease-in-out infinite" }}/>
      <div className="fixed w-[500px] h-[500px] top-1/2 -left-36 rounded-full blur-[70px] bg-brand-600/[0.07] pointer-events-none z-[0]"
        style={{ transform:`translate(${parallax.x*22}px,${parallax.y*22}px)`, animation:"orbFloat2 26s ease-in-out infinite" }}/>
      <div className="fixed w-[380px] h-[380px] bottom-16 right-16 rounded-full blur-[60px] bg-indigo-500/[0.07] pointer-events-none z-[0]"
        style={{ transform:`translate(${parallax.x*-18}px,${parallax.y*18}px)`, animation:"orbFloat3 16s ease-in-out infinite" }}/>
      <div className="fixed w-[300px] h-[300px] top-24 left-1/4 rounded-full blur-[60px] bg-cyan-500/[0.05] pointer-events-none z-[0]"
        style={{ transform:`translate(${parallax.x*28}px,${parallax.y*-22}px)` }}/>

      {/* ── Interactive layers ── */}
      <ScrollProgress />
      <HUDOverlay />
      <CustomCursor />
      <ClickRipple />

      {/* ══ CONTENT ══ */}
      <div className="relative z-[30] max-w-6xl mx-auto px-6 pt-6 pb-10">

        {/* ── NAV ── */}
        <header className="flex items-center justify-between mb-5 anim-fade-down">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-lg shadow-brand-500/40 hover:scale-110 hover:shadow-brand-400/60 transition-all duration-300 logo-pulse">
              <ShieldCheck className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <div className="absolute inset-0 rounded-xl border-2 border-brand-300/40 animate-ping-slow" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight leading-none text-lg">
                SuRaksha<span className="text-brand-400 animate-flicker">AI</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 mt-0.5">The Intelligent Operating System for CGD</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-400 hidden sm:block">Torrent Gas • Spark Tank 2026</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand-300 bg-brand-500/10 border border-brand-400/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />LIVE
            </span>
          </div>
        </header>

        {/* ── HERO ── */}
        <div className="text-center max-w-3xl mx-auto mb-24 relative">
          <MorphBlob />

          {/* Badge with scramble */}
          <div className="anim-fade-up" style={{ animationDelay:"80ms" }}>
            <span className="inline-flex items-center gap-3 text-sm sm:text-base font-bold uppercase tracking-widest text-brand-300 bg-white/[0.09] border-2 border-brand-400/20 px-6 py-3 rounded-full hover:bg-white/[0.15] hover:border-brand-400/40 transition-all duration-300 group shadow-lg shadow-brand-500/10">
              <Sparkles className="w-5 h-5 animate-spin-slow group-hover:text-brand-200 flex-shrink-0" />
              <ScrambleText text="One AI core • 24 live capabilities" delay={400} />
            </span>
          </div>

          {/* Ecosystem map — hierarchical platform radar (breaks out of the text column) */}
          <div className="mt-0 mb-8 lg:-mx-40">
            <EcosystemRadar />
          </div>

          {/* Cinematic headline */}
          <div className="mt-6 anim-fade-up" style={{ animationDelay:"260ms" }}>
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
              <WordReveal text="The AI Operating System" baseDelay={300} className="inline" />
              <br />
              <WordReveal text="for" baseDelay={460} className="inline" />{" "}
              <GlitchText text="City Gas Distribution" className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-cyan-300" />
            </h1>
          </div>

          {/* Sub */}
          <div className="anim-fade-up" style={{ animationDelay:"500ms" }}>
            <WordReveal
              text="One platform for operations, safety, and customer teams — unifying billing intelligence, pipeline safety, and executive decision-making in real time."
              baseDelay={550}
              className="block text-ink-300 mt-5 text-lg max-w-xl mx-auto leading-relaxed"
            />
            <p className="text-sm text-ink-500 mt-3">
              Replacing <TypewriterWord />
            </p>
          </div>

          {/* Business value strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 mt-8 anim-fade-up" style={{ animationDelay:"620ms" }}>
            {[
              "Faster Emergency Response",
              "Better Customer Experience",
              "Revenue Protection",
              "Predictive Safety",
              "Executive Visibility",
            ].map((v) => (
              <span key={v} className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-medium text-ink-300 hover:text-brand-300 transition-colors duration-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                {v}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 anim-fade-up" style={{ animationDelay:"700ms" }}>
            <MagButton href="/customer"
              className="group font-semibold px-6 py-3.5 rounded-2xl text-brand-200 bg-brand-500/[0.08] border border-brand-400/25 hover:bg-brand-500/[0.14] hover:border-brand-400/45 hover:-translate-y-0.5 transition-all duration-300">
              <User className="w-4 h-4 flex-shrink-0" />
              Customer Suite
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </MagButton>

            <MagButton href="/safety"
              className="group font-semibold px-6 py-3.5 rounded-2xl text-amber-200 bg-amber-500/[0.08] border border-amber-400/25 hover:bg-amber-500/[0.14] hover:border-amber-400/45 hover:-translate-y-0.5 transition-all duration-300">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              Safety Suite
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </MagButton>

            <MagButton href="/intelligence"
              className="group font-semibold px-6 py-3.5 rounded-2xl text-indigo-200 bg-indigo-500/[0.08] border border-indigo-400/25 hover:bg-indigo-500/[0.14] hover:border-indigo-400/45 hover:-translate-y-0.5 transition-all duration-300">
              <Cog className="w-4 h-4 flex-shrink-0" />
              Intelligence Suite
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </MagButton>
          </div>

          {/* Scroll hint */}
          <div className="mt-12 flex flex-col items-center gap-1 anim-fade-up opacity-40" style={{ animationDelay:"900ms" }}>
            <div className="scroll-mouse" />
            <span className="text-[10px] text-ink-500 uppercase tracking-widest">scroll</span>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-16">
          <StatCard value={24} label="AI Capabilities"       icon={<Zap className="w-5 h-5"/>}      delay={0}   pct={1}    />
          <StatCard value={3}  label="Integrated Suites"     icon={<Layers className="w-5 h-5"/>}   delay={150} pct={0.65} />
          <StatCard value={5}  label="Intelligence Domains"  icon={<Workflow className="w-5 h-5"/>} delay={300} pct={0.83} />
        </div>

        {/* ── TRUST STRIP ── */}
        <div className="text-center mb-20 anim-fade-up" style={{ animationDelay:"100ms" }}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-ink-600 mb-4">Designed For</div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto">
            {["City Gas Distribution", "Operations Teams", "Emergency Response", "Customer Service", "Executive Leadership"].map((v) => (
              <span key={v} className="text-xs sm:text-[13px] text-ink-300 bg-white/[0.03] border border-white/[0.08] px-4 py-2 rounded-full hover:border-brand-400/35 hover:text-brand-300 hover:bg-white/[0.05] transition-all duration-200">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* ── PORTAL CARDS ── */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <HoloCard accent="brand">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-brand-500/20 border border-brand-400/20 grid place-items-center group-hover:scale-110 group-hover:bg-brand-500/30 transition-all duration-300">
                  <User className="w-5 h-5 text-brand-300" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-500" />
              </div>
              <h2 className="text-lg font-bold mt-4 text-brand-300">Customer Suite</h2>
              <p className="text-[11px] uppercase tracking-wider text-ink-500 mt-0.5">Customer Experience</p>
              <p className="text-xs text-ink-400 mt-2 leading-relaxed min-h-[48px]">
                Clear billing explanations, guided connection journeys, and instant AI safety support — fewer complaints, faster resolution, stronger trust.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <Feature icon={<ReceiptText className="w-3 h-3"/>} label="ExplainBill AI"/>
                <Feature icon={<Activity className="w-3 h-3"/>} label="Connection Journey"/>
                <Feature icon={<ShieldCheck className="w-3 h-3"/>} label="GasCare SOS"/>
              </div>
              <Link href="/customer" className="group mt-5 text-xs font-semibold text-brand-300 flex items-center gap-1.5 hover:gap-3 transition-all duration-200 w-fit">
                Enter Suite <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </HoloCard>

          <HoloCard accent="indigo">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-400/20 grid place-items-center group-hover:scale-110 group-hover:bg-amber-500/30 transition-all duration-300">
                  <Activity className="w-5 h-5 text-amber-300" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-500" />
              </div>
              <h2 className="text-lg font-bold mt-4 text-amber-300">Safety Suite</h2>
              <p className="text-[11px] uppercase tracking-wider text-ink-500 mt-0.5">Operational Safety</p>
              <p className="text-xs text-ink-400 mt-2 leading-relaxed min-h-[48px]">
                Real-time pipeline health, CNG readiness scoring, and contractor audits — giving field and safety teams earlier warning on risk.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <Feature icon={<Megaphone className="w-3 h-3"/>} label="Smart Notify"/>
                <Feature icon={<Zap className="w-3 h-3"/>} label="Asset Health"/>
                <Feature icon={<Shield className="w-3 h-3"/>} label="Emergency SOS"/>
              </div>
              <Link href="/safety" className="group mt-5 text-xs font-semibold text-amber-300 flex items-center gap-1.5 hover:gap-3 transition-all duration-200 w-fit">
                Enter Suite <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </HoloCard>

          <HoloCard accent="indigo">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/20 grid place-items-center group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300">
                  <Cog className="w-5 h-5 text-indigo-300 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-500" />
              </div>
              <h2 className="text-lg font-bold mt-4 text-indigo-300">Intelligence Suite</h2>
              <p className="text-[11px] uppercase tracking-wider text-ink-500 mt-0.5">Executive Decision-Making</p>
              <p className="text-xs text-ink-400 mt-2 leading-relaxed min-h-[48px]">
                Revenue tamper detection, PNGRB compliance tracking, and a predictive command view — built for faster, evidence-based decisions.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-4">
                <Feature icon={<ShieldAlert className="w-3 h-3"/>} label="Revenue Guard"/>
                <Feature icon={<Timer className="w-3 h-3"/>} label="SLA Sentinel"/>
                <Feature icon={<Activity className="w-3 h-3"/>} label="Command Center"/>
              </div>
              <Link href="/intelligence" className="group mt-5 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 hover:gap-3 transition-all duration-200 w-fit">
                Enter Suite <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </HoloCard>
        </div>

        {/* ── TICKER ── */}
        <div className="relative overflow-hidden mb-10 anim-fade-up" style={{ animationDelay:"850ms" }}>
          <div className="ticker-scroll inline-flex gap-5 whitespace-nowrap">
            {[...Array(2)].flatMap((_, groupIdx) =>
              ["Real-time Leak Detection","PNGRB Compliance","Emergency Dispatch AI",
               "Bill Anomaly Detection","AutoNotice Generator","Revenue Loss Guard",
               "SLA Monitoring","Pressure Analytics","AI Decision Engine","Pipeline Mapping"]
              .map((item, i) => (
                <span key={`${groupIdx}-${i}`} className="inline-flex items-center text-xs font-medium text-ink-400 bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full flex-shrink-0 hover:border-brand-400/30 hover:text-brand-300 transition-colors duration-200">
                  {item}
                </span>
              ))
            )}
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#020617] to-transparent pointer-events-none z-10"/>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#020617] to-transparent pointer-events-none z-10"/>
        </div>

        <p className="text-center text-xs text-ink-700 pb-8">
          Demo prototype · role selection illustrative · all figures placeholder
        </p>
      </div>
    </div>
  );
}
