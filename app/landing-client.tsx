"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ShieldCheck, ArrowRight, User, Cog, PhoneCall, ReceiptText,
  Megaphone, Timer, ShieldAlert, ScanEye, Sparkles,
  Activity, Zap, Shield,
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
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement[]>([]);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const TRAIL = 8;

  useEffect(() => {
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
    <div className="fixed inset-0 z-[25] pointer-events-none select-none">
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
          {alertCycle > 0 ? "⚠ ALERT ACTIVE" : "ALERTS 0"}
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
const PHRASES = ["humans miss.", "the naked eye.", "manual checks.", "legacy alerts.", "every anomaly."];
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
      className={`relative rounded-3xl overflow-hidden cursor-pointer card-anim ${accent === "brand" ? "card-anim-1" : "card-anim-2"}`}
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
   RADAR CANVAS
══════════════════════════════════════════════════════════════ */
function RadarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const S = 400; canvas.width = S; canvas.height = S;
    const C = S/2, R = S/2 - 20;
    let ang = 0, raf: number;
    const blips = [{ a: 0.7, d: 0.55 }, { a: 2.1, d: 0.73 }, { a: 3.9, d: 0.38 }, { a: 5.3, d: 0.61 }];

    const draw = () => {
      ctx.clearRect(0, 0, S, S);
      [1, 0.66, 0.33].forEach(s => {
        ctx.beginPath(); ctx.arc(C, C, R*s, 0, Math.PI*2);
        ctx.strokeStyle = "rgba(52,211,153,0.2)"; ctx.lineWidth = 2; ctx.stroke();
      });
      ctx.strokeStyle = "rgba(52,211,153,0.14)"; ctx.lineWidth = 1.2;
      [[C,C-R,C,C+R],[C-R,C,C+R,C]].forEach(([x1,y1,x2,y2]) => {
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      });
      // Sweep
      ctx.save(); ctx.translate(C, C);
      for (let i = 0; i < 28; i++) {
        const SPAN = 0.85;
        ctx.beginPath(); ctx.moveTo(0,0);
        ctx.arc(0, 0, R, ang - SPAN + (SPAN/28)*i, ang - SPAN + (SPAN/28)*(i+1));
        ctx.closePath();
        ctx.fillStyle = `rgba(52,211,153,${(i/28)*0.5})`;
        ctx.fill();
      }
      ctx.restore();
      // Sweep line
      ctx.beginPath(); ctx.moveTo(C, C);
      ctx.lineTo(C + Math.cos(ang)*R, C + Math.sin(ang)*R);
      ctx.strokeStyle = "rgba(52,211,153,0.75)"; ctx.lineWidth = 2.5; ctx.stroke();
      // Blips
      blips.forEach(({ a, d }) => {
        const diff = ((ang - a) % (Math.PI*2) + Math.PI*2) % (Math.PI*2);
        const fa = diff < 1.4 ? (1 - diff/1.4)*0.95 : 0;
        if (fa > 0) {
          const bx = C + Math.cos(a)*R*d, by = C + Math.sin(a)*R*d;
          ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI*2);
          ctx.fillStyle = `rgba(52,211,153,${fa})`; ctx.fill();
          ctx.beginPath(); ctx.arc(bx, by, 20, 0, Math.PI*2);
          ctx.fillStyle = `rgba(52,211,153,${fa*0.18})`; ctx.fill();
        }
      });
      ang = (ang + 0.024) % (Math.PI*2);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ width:200, height:200 }} className="mx-auto" />;
}

/* ══════════════════════════════════════════════════════════════
   ORBIT BADGES
══════════════════════════════════════════════════════════════ */
function OrbitBadges() {
  const badges = [
    { label: "Leak Detected", deg: 0,   cls: "text-brand-300 border-brand-400/35 bg-brand-500/10 text-xs sm:text-sm px-3.5 py-1.5" },
    { label: "SLA Alert",     deg: 72,  cls: "text-yellow-300 border-yellow-400/35 bg-yellow-500/10 text-xs sm:text-sm px-3.5 py-1.5" },
    { label: "Bill Anomaly",  deg: 144, cls: "text-cyan-300 border-cyan-400/35 bg-cyan-500/10 text-xs sm:text-sm px-3.5 py-1.5" },
    { label: "PNGRB ✓",      deg: 216, cls: "text-indigo-300 border-indigo-400/35 bg-indigo-500/10 text-xs sm:text-sm px-3.5 py-1.5" },
    { label: "Emergency",     deg: 288, cls: "text-red-300 border-red-400/35 bg-red-500/10 text-xs sm:text-sm px-3.5 py-1.5" },
  ];
  return (
    <div className="relative w-[480px] h-[480px] mx-auto">
      <div className="absolute inset-0 rounded-full border-2 border-brand-400/[0.13] animate-[spin_24s_linear_infinite]" />
      <div className="absolute inset-12 rounded-full border border-brand-400/[0.07] animate-[spin_16s_linear_infinite_reverse]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><RadarCanvas /></div>
      {badges.map(({ label, deg, cls }) => {
        const rad = deg * Math.PI / 180;
        return (
          <div key={deg}
            className={`absolute font-semibold border rounded-full whitespace-nowrap orbit-badge ${cls}`}
            style={{ left:`calc(50% + ${Math.cos(rad)*230}px)`, top:`calc(50% + ${Math.sin(rad)*230}px)`, transform:"translate(-50%,-50%)", animationDelay:`${deg*8}ms` }}>
            {label}
          </div>
        );
      })}
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
    const onMove = (e: MouseEvent) => setParallax({ x: e.clientX/window.innerWidth - 0.5, y: e.clientY/window.innerHeight - 0.5 });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-x-hidden cursor-none">

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
      <div className="relative z-[30] max-w-6xl mx-auto px-6 py-10">

        {/* ── NAV ── */}
        <header className="flex items-center justify-between mb-16 anim-fade-down">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-lg shadow-brand-500/40 hover:scale-110 hover:shadow-brand-400/60 transition-all duration-300 logo-pulse">
              <ShieldCheck className="w-5 h-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <div className="absolute inset-0 rounded-xl border-2 border-brand-300/40 animate-ping-slow" />
            </div>
            <div>
              <div className="font-extrabold tracking-tight leading-none text-lg">
                SuRaksha<span className="text-brand-400 animate-flicker">AI</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-ink-500 mt-0.5">CGD Intelligence</div>
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
              <ScrambleText text="One platform • Six AI agents" delay={400} />
            </span>
          </div>

          {/* Orbit / Radar visualization */}
          <div className="mt-16 mb-12 anim-fade-up" style={{ animationDelay:"180ms" }}>
            <OrbitBadges />
          </div>

          {/* Cinematic headline */}
          <div className="mt-6 anim-fade-up" style={{ animationDelay:"260ms" }}>
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
              <WordReveal text="The" baseDelay={300} className="inline" />{" "}
              <GlitchText text="AI layer" className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-cyan-300" />{" "}
              <WordReveal text="that catches" baseDelay={420} className="inline" />
              <br />
              <TypewriterWord />
            </h1>
          </div>

          {/* Sub */}
          <div className="anim-fade-up" style={{ animationDelay:"500ms" }}>
            <WordReveal
              text="Safety, customer trust, revenue protection and PNGRB compliance — unified for City Gas Distribution."
              baseDelay={550}
              className="block text-ink-300 mt-5 text-lg max-w-xl mx-auto leading-relaxed"
            />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10 anim-fade-up" style={{ animationDelay:"700ms" }}>
            <MagButton href="/user" primary
              className="group font-semibold px-7 py-3.5 rounded-2xl text-white bg-brand-500 hover:bg-brand-400 shadow-lg shadow-brand-500/35 hover:shadow-brand-400/55 transition-all duration-300">
              <span className="btn-shimmer absolute inset-0" />
              Customer Portal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </MagButton>

            <MagButton href="/admin"
              className="group font-semibold px-7 py-3.5 rounded-2xl text-white bg-white/[0.06] hover:bg-white/[0.11] border border-white/15 hover:border-indigo-400/45 transition-all duration-300">
              Operations Admin
              <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all duration-200" />
            </MagButton>
          </div>

          {/* Scroll hint */}
          <div className="mt-12 flex flex-col items-center gap-1 anim-fade-up opacity-40" style={{ animationDelay:"900ms" }}>
            <div className="scroll-mouse" />
            <span className="text-[10px] text-ink-500 uppercase tracking-widest">scroll</span>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-20">
          <StatCard value={6}   label="AI Agents"       icon={<Zap className="w-5 h-5"/>}      delay={0}   pct={1}    />
          <StatCard value={999} suffix="%" label="Uptime SLA"  icon={<Activity className="w-5 h-5"/>} delay={150} pct={0.999} />
          <StatCard value={2}   suffix="s" label="Alert Speed" icon={<Shield className="w-5 h-5"/>}   delay={300} pct={0.85}  />
        </div>

        {/* ── PORTAL CARDS ── */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          <HoloCard accent="brand">
            <div className="p-7">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-brand-500/20 border border-brand-400/20 grid place-items-center">
                  <User className="w-6 h-6 text-brand-300" />
                </div>
                <ArrowRight className="w-5 h-5 text-ink-500" />
              </div>
              <h2 className="text-xl font-bold mt-5">Customer Portal</h2>
              <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">
                For PNG/CNG customers — track safety at your premises and understand every bill.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Feature icon={<ScanEye className="w-3.5 h-3.5"/>} label="SafeZone AI"/>
                <Feature icon={<ReceiptText className="w-3.5 h-3.5"/>} label="WhyMyBill"/>
              </div>
              <Link href="/user" className="group mt-6 text-sm font-semibold text-brand-300 flex items-center gap-1.5 hover:gap-3 transition-all duration-200 w-fit">
                Enter as customer <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </HoloCard>

          <HoloCard accent="indigo">
            <div className="p-7">
              <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/20 grid place-items-center">
                  <Cog className="w-6 h-6 text-indigo-300 hover:rotate-90 transition-transform duration-500" />
                </div>
                <ArrowRight className="w-5 h-5 text-ink-500" />
              </div>
              <h2 className="text-xl font-bold mt-5">Operations Admin</h2>
              <p className="text-sm text-ink-400 mt-1.5 leading-relaxed">
                For the control room — emergency response, notices, compliance and revenue intelligence.
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <Feature icon={<PhoneCall className="w-3.5 h-3.5"/>} label="GasGuard"/>
                <Feature icon={<Megaphone className="w-3.5 h-3.5"/>} label="AutoNotify"/>
                <Feature icon={<Timer className="w-3.5 h-3.5"/>} label="SLA Sentinel"/>
                <Feature icon={<ShieldAlert className="w-3.5 h-3.5"/>} label="RevGuard"/>
              </div>
              <Link href="/admin" className="group mt-6 text-sm font-semibold text-indigo-300 flex items-center gap-1.5 hover:gap-3 transition-all duration-200 w-fit">
                Enter as admin <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </HoloCard>
        </div>

        {/* ── TICKER ── */}
        <div className="relative overflow-hidden mb-10 anim-fade-up" style={{ animationDelay:"850ms" }}>
          <div className="ticker-scroll inline-flex gap-5 whitespace-nowrap">
            {[...Array(2)].flatMap((_, groupIdx) =>
              ["🔒 Real-time Leak Detection","📊 PNGRB Compliance","⚡ Emergency Dispatch AI",
               "🧾 Bill Anomaly Detection","📣 AutoNotice Generator","🛡️ Revenue Loss Guard",
               "📡 SLA Monitoring","🔍 Pressure Analytics","🤖 AI Decision Engine","🗺️ Pipeline Mapping"]
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
