"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
interface ScanningAnimationProps {
  status?: string | null;
  error?: string | null;
}

/* ═══════════════════════════════════════════════════════════
   STORY PHASES
   - walk phases  → person walks carrying briefcase
   - vehicle phases → vehicle only, no person
═══════════════════════════════════════════════════════════ */
const PHASES = [
  { id: "walk1", label: "Collecting your documents…",  sub: "Picking up files from source",    vehicle: null    },
  { id: "walk2", label: "Loading the next batch…",     sub: "Second round of data ready",      vehicle: null    },
  { id: "car",   label: "Express delivery in progress…", sub: "Rushing files over by car",     vehicle: "car"   },
  { id: "truck", label: "Bulk transfer underway…",     sub: "Heavy payload en route",           vehicle: "truck" },
  { id: "plane", label: "Final sync incoming…",        sub: "Airlifting the last batch",        vehicle: "plane" },
] as const;

/* ═══════════════════════════════════════════════════════════
   SVG: PERSON WALKING (briefcase in hand)
═══════════════════════════════════════════════════════════ */
function PersonWalker({ flip }: { flip: boolean }) {
  return (
    <svg
      width="48" height="68" viewBox="0 0 48 68" fill="none"
      style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}
    >
      {/* head */}
      <circle cx="24" cy="9" r="7.5" fill="#f5c97a" stroke="#c89535" strokeWidth="1.5" />
      {/* hair */}
      <path d="M16.5 6 Q24 -1 31.5 6" fill="#4a3000" />
      {/* body */}
      <rect x="16" y="18" width="16" height="19" rx="4" fill="#2E7D6B" />
      {/* collar */}
      <path d="M22 18 L24 22 L26 18" fill="#fff" opacity="0.6" />
      {/* left arm swinging */}
      <motion.g
        style={{ originX: "16px", originY: "22px" }}
        animate={{ rotate: [15, -15, 15] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="16" y1="22" x2="7" y2="34" stroke="#2E7D6B" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="7" cy="35" rx="3.5" ry="3.5" fill="#f5c97a" />
      </motion.g>
      {/* right arm with briefcase */}
      <motion.g
        style={{ originX: "32px", originY: "22px" }}
        animate={{ rotate: [-15, 15, -15] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="32" y1="22" x2="41" y2="32" stroke="#2E7D6B" strokeWidth="4" strokeLinecap="round" />
        {/* briefcase */}
        <rect x="37" y="30" width="12" height="9" rx="2" fill="#c9933a" stroke="#9a6e20" strokeWidth="1" />
        <rect x="40" y="28" width="6" height="3" rx="1" fill="#9a6e20" />
        <line x1="37" y1="34.5" x2="49" y2="34.5" stroke="#9a6e20" strokeWidth="0.8" />
        <text x="43" y="38" textAnchor="middle" fontSize="5" fill="#fff" fontWeight="bold">$</text>
      </motion.g>
      {/* left leg */}
      <motion.g
        style={{ originX: "19px", originY: "37px" }}
        animate={{ rotate: [22, -22, 22] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="19" y1="37" x2="14" y2="56" stroke="#1a5c4a" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="12.5" cy="58" rx="6" ry="3.5" fill="#1a2e22" />
      </motion.g>
      {/* right leg */}
      <motion.g
        style={{ originX: "29px", originY: "37px" }}
        animate={{ rotate: [-22, 22, -22] }}
        transition={{ duration: 0.65, repeat: Infinity, ease: "easeInOut" }}
      >
        <line x1="29" y1="37" x2="34" y2="56" stroke="#1a5c4a" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="35.5" cy="58" rx="6" ry="3.5" fill="#1a2e22" />
      </motion.g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG: CAR
═══════════════════════════════════════════════════════════ */
function CarSVG() {
  return (
    <svg width="120" height="64" viewBox="0 0 120 64" fill="none">
      {/* shadow */}
      <ellipse cx="60" cy="62" rx="50" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* body lower */}
      <rect x="6" y="30" width="108" height="22" rx="7" fill="#2E7D6B" />
      {/* body upper / cabin */}
      <path d="M26 30 Q32 10 50 10 H74 Q90 10 96 30Z" fill="#3a8c7a" />
      {/* windshield front */}
      <path d="M74 30 Q88 12 94 30Z" fill="#a8d8d0" opacity="0.85" />
      {/* windshield back */}
      <path d="M28 30 Q34 14 50 14 H58 V30Z" fill="#a8d8d0" opacity="0.85" />
      {/* side window */}
      <path d="M58 14 H74 Q87 14 93 30 H58Z" fill="#c0e8e2" opacity="0.65" />
      {/* window divider */}
      <line x1="58" y1="14" x2="58" y2="30" stroke="#1e6655" strokeWidth="2" />
      {/* door seam */}
      <line x1="58" y1="30" x2="58" y2="52" stroke="#1a5c4a" strokeWidth="1.5" />
      {/* door handles */}
      <rect x="38" y="42" width="11" height="3.5" rx="1.75" fill="#155244" />
      <rect x="68" y="42" width="11" height="3.5" rx="1.75" fill="#155244" />
      {/* headlights */}
      <ellipse cx="111" cy="39" rx="6" ry="5" fill="#ffe899" />
      <ellipse cx="111" cy="39" rx="3.5" ry="3" fill="#fff" opacity="0.8" />
      {/* taillight */}
      <ellipse cx="8"  cy="39" rx="5" ry="4" fill="#e05555" />
      <ellipse cx="8"  cy="39" rx="2.5" ry="2" fill="#ffaaaa" opacity="0.6" />
      {/* front bumper */}
      <rect x="108" y="44" width="8" height="4" rx="2" fill="#1a3d2b" />
      {/* rear bumper */}
      <rect x="4"  y="44" width="8" height="4" rx="2" fill="#1a3d2b" />
      {/* wheels */}
      {[28, 90].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="53" r="11" fill="#1a2520" />
          <circle cx={cx} cy="53" r="7"  fill="#2d3e36" />
          <circle cx={cx} cy="53" r="3"  fill="#8a9e96" />
          {/* spokes */}
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <line
              key={deg}
              x1={cx} y1={53}
              x2={cx + 6 * Math.cos((deg * Math.PI) / 180)}
              y2={53  + 6 * Math.sin((deg * Math.PI) / 180)}
              stroke="#4a6058" strokeWidth="1.2"
            />
          ))}
        </g>
      ))}
      {/* money bags on roof rack */}
      {[36, 52, 68].map((x) => (
        <g key={x}>
          <rect x={x} y="5" width="11" height="9" rx="2.5" fill="#c9933a" />
          <text x={x + 5.5} y="12.5" textAnchor="middle" fontSize="6" fill="#fff" fontWeight="bold">$</text>
        </g>
      ))}
      {/* roof rack bar */}
      <rect x="33" y="9" width="50" height="2" rx="1" fill="#0f3d2b" opacity="0.5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG: TRUCK
═══════════════════════════════════════════════════════════ */
function TruckSVG() {
  return (
    <svg width="168" height="76" viewBox="0 0 168 76" fill="none">
      {/* shadow */}
      <ellipse cx="84" cy="73" rx="72" ry="5" fill="rgba(0,0,0,0.2)" />
      {/* cargo box */}
      <rect x="4" y="12" width="100" height="48" rx="3" fill="#155244" />
      <rect x="6" y="14" width="96" height="44" rx="2" fill="#1a6655" />
      {/* container ribs */}
      {[28, 50, 72].map((x) => (
        <line key={x} x1={x} y1="14" x2={x} y2="58" stroke="#0f3d2b" strokeWidth="2" />
      ))}
      {/* SECURE TRANSFER label */}
      <rect x="12" y="26" width="80" height="16" rx="3" fill="#2E7D6B" />
      <text x="52" y="37.5" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#fff" fontFamily="monospace" letterSpacing="0.5">
        SECURE TRANSFER
      </text>
      {/* money $ on side */}
      <text x="10"  y="57" fontSize="12" fill="#c9933a" opacity="0.6">$</text>
      <text x="86"  y="57" fontSize="12" fill="#c9933a" opacity="0.6">$</text>
      {/* cab */}
      <rect x="104" y="20" width="58" height="38" rx="6" fill="#2E7D6B" />
      <rect x="104" y="20" width="6"  height="38" rx="0" fill="#1e6655" />
      {/* windshield */}
      <rect x="118" y="24" width="38" height="22" rx="4" fill="#a8d8d0" opacity="0.85" />
      <line x1="137" y1="24" x2="137" y2="46" stroke="#7cc8c0" strokeWidth="1" opacity="0.6" />
      {/* headlights */}
      <ellipse cx="158" cy="50" rx="6" ry="5"   fill="#ffe899" />
      <ellipse cx="158" cy="50" rx="3.5" ry="3" fill="#fff" opacity="0.8" />
      <ellipse cx="158" cy="40" rx="4" ry="3.5"  fill="#ffdd66" opacity="0.7" />
      {/* exhaust stack */}
      <rect x="106" y="10" width="6" height="12" rx="3" fill="#555" />
      <motion.div />
      {/* wheels — 4 axles */}
      {[22, 46, 116, 138].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="62" r="12" fill="#1a2218" />
          <circle cx={cx} cy="62" r="7.5" fill="#2d3830" />
          <circle cx={cx} cy="62" r="3"   fill="#8a9e8a" />
          {[0,45,90,135,180,225,270,315].map((deg) => (
            <line
              key={deg}
              x1={cx} y1={62}
              x2={cx + 6.5 * Math.cos((deg * Math.PI) / 180)}
              y2={62  + 6.5 * Math.sin((deg * Math.PI) / 180)}
              stroke="#3a4e38" strokeWidth="1"
            />
          ))}
        </g>
      ))}
      {/* cab door handle */}
      <rect x="114" y="42" width="9" height="3" rx="1.5" fill="#155244" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG: CARGO PLANE
═══════════════════════════════════════════════════════════ */
function PlaneSVG() {
  return (
    <svg width="180" height="80" viewBox="0 0 180 80" fill="none">
      {/* fuselage */}
      <ellipse cx="88" cy="38" rx="78" ry="16" fill="#2E7D6B" />
      {/* nose cone */}
      <ellipse cx="162" cy="38" rx="14" ry="10" fill="#3a9c7a" />
      {/* tail */}
      <ellipse cx="14"  cy="38" rx="12" ry="8"  fill="#1a6655" />
      {/* cockpit windows */}
      <ellipse cx="152" cy="32" rx="10" ry="7"  fill="#a8d8d0" opacity="0.9" />
      <ellipse cx="152" cy="32" rx="6"  ry="4"  fill="#c8eee8" opacity="0.65" />
      {/* cabin windows */}
      {[70, 90, 110, 130].map((cx) => (
        <ellipse key={cx} cx={cx} cy="30" rx="6" ry="4.5" fill="#a8d8d0" opacity="0.55" />
      ))}
      {/* SECURE cargo text */}
      <text x="88" y="43" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#c9933a" fontFamily="monospace">
        $$$ SECURE CARGO $$$
      </text>
      {/* main wings */}
      <path d="M60 40 L4 68 L96 50 Z"  fill="#1a6050" opacity="0.95" />
      <path d="M60 36 L4 8  L96 26 Z"  fill="#1a6050" opacity="0.95" />
      {/* wing highlight */}
      <line x1="60" y1="40" x2="4"  y2="68" stroke="#3a8c7a" strokeWidth="1" opacity="0.4" />
      <line x1="60" y1="36" x2="4"  y2="8"  stroke="#3a8c7a" strokeWidth="1" opacity="0.4" />
      {/* tail fin vertical */}
      <path d="M16 30 L6 8  L28 30 Z" fill="#155244" />
      {/* tail fins horizontal */}
      <path d="M14 40 L2  56 L32 44 Z" fill="#155244" opacity="0.9" />
      <path d="M14 36 L2  20 L32 32 Z" fill="#155244" opacity="0.85" />
      {/* engine pods under wings */}
      {[
        { cx: 46, cy: 56 },
        { cx: 46, cy: 20 },
      ].map(({ cx, cy }, i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx="14" ry="7" fill="#0f3d2b" />
          <ellipse cx={cx + 8} cy={cy} rx="6" ry="6" fill="#1a2a1a" />
          <ellipse cx={cx + 8} cy={cy} rx="3" ry="3" fill="#2d3e2d" />
        </g>
      ))}
      {/* contrail dots */}
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={6 - i * 12} cy={38} r={2 - i * 0.4} fill="white" opacity={0.5 - i * 0.12} />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG: BANK BUILDING
═══════════════════════════════════════════════════════════ */
function BankSVG() {
  return (
    <svg width="64" height="80" viewBox="0 0 64 80" fill="none">
      {/* base */}
      <rect x="2"  y="68" width="60" height="10" rx="2" fill="#0f3d2b" />
      {/* steps */}
      <rect x="6"  y="62" width="52" height="7"  rx="1" fill="#1a5040" />
      <rect x="10" y="57" width="44" height="6"  rx="1" fill="#1e5844" />
      {/* main body */}
      <rect x="12" y="24" width="40" height="34" rx="2" fill="#2E7D6B" />
      {/* columns */}
      {[15, 23, 31, 39, 47].map((x) => (
        <rect key={x} x={x} y="26" width="5" height="30" rx="2" fill="#3a9a80" />
      ))}
      {/* entablature */}
      <rect x="10" y="20" width="44" height="5" rx="1" fill="#1a6050" />
      {/* pediment */}
      <path d="M8 20 L32 4 L56 20Z" fill="#1a5244" />
      <path d="M12 20 L32 8 L52 20Z" fill="#1e5c4c" />
      {/* pediment text */}
      <text x="32" y="17" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#c9933a" fontFamily="monospace">
        BANK
      </text>
      {/* door */}
      <rect x="24" y="44" width="16" height="14" rx="2" fill="#0f3d2b" />
      <rect x="26" y="46" width="5"  height="10" rx="1" fill="#c9933a" opacity="0.45" />
      <rect x="33" y="46" width="5"  height="10" rx="1" fill="#c9933a" opacity="0.45" />
      {/* door knobs */}
      <circle cx="31" cy="53" r="1.5" fill="#c9933a" />
      <circle cx="33" cy="53" r="1.5" fill="#c9933a" />
      {/* windows */}
      {[15, 39].map((x) => (
        <rect key={x} x={x} y="30" width="10" height="10" rx="1.5" fill="#a8d8d0" opacity="0.6" />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SVG: SERVER RACK
═══════════════════════════════════════════════════════════ */
function ServerSVG({ glow }: { glow: boolean }) {
  return (
    <svg width="58" height="80" viewBox="0 0 58 80" fill="none">
      {/* cabinet */}
      <rect x="5" y="4"  width="48" height="70" rx="4" fill="#0f3d2b" />
      <rect x="8" y="7"  width="42" height="64" rx="3" fill="#1a2e22" />
      {/* server units */}
      {[0, 1, 2, 3, 4].map((i) => {
        const isTop = i === 0;
        const active = glow && isTop;
        return (
          <g key={i}>
            <rect
              x="10" y={10 + i * 12} width="38" height="10" rx="2"
              fill={active ? "#2E7D6B" : "#1e3828"}
              style={{ transition: "fill 0.3s" }}
            />
            {/* LED */}
            <circle
              cx="43" cy={15 + i * 12} r="2.5"
              fill={active ? "#3dd68c" : i % 2 === 0 ? "#2E7D6B" : "#0f3d2b"}
              style={{
                filter: active ? "drop-shadow(0 0 4px #3dd68c)" : "none",
                transition: "all 0.3s",
              }}
            />
            {/* drive slots */}
            <rect x="12" y={12 + i * 12} width="22" height="2" rx="1" fill="#0f2a1a" opacity="0.6" />
            <rect x="12" y={15 + i * 12} width="16" height="1.5" rx="0.75" fill="#0f2a1a" opacity="0.4" />
            {/* eject button */}
            <rect x="36" y={12 + i * 12} width="5" height="6" rx="1" fill="#0f2a1a" opacity="0.5" />
          </g>
        );
      })}
      {/* label */}
      <text x="29" y="78" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#2E7D6B" fontFamily="monospace">
        SERVER
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   COIN PARTICLE
═══════════════════════════════════════════════════════════ */
function CoinParticle({ onComplete }: { onComplete: () => void }) {
  const startX = Math.random() * 50 - 25;
  const startY = Math.random() * 20;
  return (
    <motion.div
      style={{
        position: "absolute",
        right: 58, bottom: 90,
        width: 18, height: 18,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 30%, #ffe899, #c9933a)",
        border: "1.5px solid #9a6e1a",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: "bold", color: "#6a4010",
        boxShadow: "0 0 8px rgba(201,147,58,0.7)",
        zIndex: 20,
        pointerEvents: "none",
      }}
      initial={{ x: startX, y: startY, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ x: 52, y: -72, opacity: 0, scale: 0.3, rotate: 540 }}
      transition={{ duration: 0.75, ease: "easeIn" }}
      onAnimationComplete={onComplete}
    >
      $
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROAD (moving dashes via Framer)
═══════════════════════════════════════════════════════════ */
function Road() {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48 }}>
      {/* asphalt */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #2d3436 0%, #1e272e 100%)",
        borderTop: "3px solid #4a5568",
      }} />
      {/* curb stripes top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 4,
        background: "repeating-linear-gradient(90deg, #fff 0,#fff 14px,#e17055 14px,#e17055 28px)",
        opacity: 0.45,
      }} />
      {/* lane dashes */}
      <motion.div
        style={{ position: "absolute", top: "50%", left: 0, display: "flex", gap: 0 }}
        animate={{ x: [0, -80] }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            style={{ width: 44, height: 3, background: "#fdcb6e", flexShrink: 0, marginRight: 36, borderRadius: 2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CLOUDS
═══════════════════════════════════════════════════════════ */
function Cloud({ x, y, scale, duration }: { x: number; y: number; scale: number; duration: number }) {
  return (
    <motion.div
      style={{ position: "absolute", top: y, left: x, opacity: 0.6, scale, pointerEvents: "none" }}
      animate={{ x: [0, -600] }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      <svg width="90" height="40" viewBox="0 0 90 40" fill="none">
        <ellipse cx="45" cy="26" rx="38" ry="16" fill="white" />
        <ellipse cx="30" cy="22" rx="22" ry="18" fill="white" />
        <ellipse cx="62" cy="21" rx="20" ry="16" fill="white" />
      </svg>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SPEED LINES (for vehicles)
═══════════════════════════════════════════════════════════ */
function SpeedLines() {
  return (
    <div style={{ position: "absolute", left: -120, top: 0, bottom: 0, width: 120, pointerEvents: "none" }}>
      {[0.3, 0.55, 0.75, 0.4, 0.6].map((op, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            top: `${15 + i * 14}%`,
            right: 0,
            height: i % 2 === 0 ? 2 : 1.5,
            background: "rgba(255,255,255,0.75)",
            borderRadius: 2,
          }}
          animate={{ width: [0, 60 + i * 12], opacity: [0, op, 0] }}
          transition={{ duration: 0.35, repeat: Infinity, ease: "easeOut", delay: i * 0.06 }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export function ScanningAnimation({ status, error }: ScanningAnimationProps) {
  const [phaseIdx,    setPhaseIdx]    = useState(0);
  const [received,    setReceived]    = useState(0);
  const [coins,       setCoins]       = useState<number[]>([]);
  const [serverGlow,  setServerGlow]  = useState(false);
  const [complete,    setComplete]    = useState(false);
  const [walkFlip,    setWalkFlip]    = useState(false);
  const coinId = useRef(0);

  const phase = PHASES[phaseIdx];
  const hasVehicle = !!phase.vehicle;

  /* detect completion */
  useEffect(() => {
    if (status === "Complete") setComplete(true);
  }, [status]);

  /* phase rotation */
  useEffect(() => {
    if (complete) return;
    const id = setInterval(() => {
      setPhaseIdx((p) => (p + 1) % PHASES.length);
      setWalkFlip((f) => !f);
    }, 3400);
    return () => clearInterval(id);
  }, [complete]);

  /* coin burst midway through each phase */
  useEffect(() => {
    if (complete) return;
    const id = setTimeout(() => {
      const ids = [0, 1, 2, 3].map(() => { coinId.current++; return coinId.current; });
      setCoins((c) => [...c, ...ids]);
      setServerGlow(true);
      setReceived((r) => r + 1);
      setTimeout(() => setServerGlow(false), 800);
    }, 2200);
    return () => clearTimeout(id);
  }, [phaseIdx, complete]);

  const removeCoin = useCallback((id: number) => {
    setCoins((c) => c.filter((x) => x !== id));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", minHeight: 380 }}>

      {/* ════ SCENE ════ */}
      <div style={{
        position: "relative",
        width: "100%", maxWidth: 480, height: 230,
        borderRadius: 18, overflow: "hidden",
        background: "linear-gradient(180deg, #74b9ff 0%, #a8d8ea 50%, #81ecec 100%)",
        border: "1.5px solid rgba(46,125,107,0.2)",
        boxShadow: "0 4px 28px rgba(0,0,0,0.13), inset 0 1px 0 rgba(255,255,255,0.55)",
      }}>

        {/* sky overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 60%, rgba(46,125,107,0.12) 100%)",
        }} />

        {/* clouds */}
        <Cloud x={380} y={6}  scale={1.0} duration={20} />
        <Cloud x={180} y={18} scale={0.65} duration={28} />
        <Cloud x={560} y={4}  scale={0.75} duration={24} />

        {/* grass */}
        <div style={{
          position: "absolute", bottom: 48, left: 0, right: 0, height: 24,
          background: "linear-gradient(180deg, #55efc4 0%, #00b894 100%)",
          borderTop: "2.5px solid #00a381",
        }} />

        {/* road */}
        <Road />

        {/* BANK left */}
        <div style={{ position: "absolute", bottom: 72, left: 10 }}>
          <BankSVG />
        </div>

        {/* SERVER right */}
        <div style={{ position: "absolute", bottom: 72, right: 10 }}>
          <ServerSVG glow={serverGlow} />
          {/* received counter */}
          <AnimatePresence>
            <motion.div
              key={received}
              initial={{ scale: 0.4, y: -6, opacity: 0 }}
              animate={{ scale: 1,   y: 0,  opacity: 1 }}
              style={{
                position: "absolute", top: -10, right: -10,
                background: "#2E7D6B", color: "#fff",
                borderRadius: 20, padding: "2px 8px",
                fontSize: 10, fontWeight: 800, minWidth: 24, textAlign: "center",
                boxShadow: "0 2px 8px rgba(46,125,107,0.55)",
              }}
            >
              {received}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* COIN PARTICLES */}
        {coins.map((id) => (
          <CoinParticle key={id} onComplete={() => removeCoin(id)} />
        ))}

        {/* ── PERSON (walk phases only) ── */}
        <AnimatePresence>
          {!hasVehicle && !complete && (
            <motion.div
              key={`person-${phaseIdx}`}
              style={{ position: "absolute", bottom: 68, zIndex: 10 }}
              initial={{ x: walkFlip ? 420 : -70 }}
              animate={{ x: walkFlip ? -70  : 420 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.4, ease: "linear" }}
            >
              <PersonWalker flip={walkFlip} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CAR ── */}
        <AnimatePresence>
          {phase.vehicle === "car" && !complete && (
            <motion.div
              key="car"
              style={{ position: "absolute", bottom: 48, zIndex: 10 }}
              initial={{ x: -140 }}
              animate={{ x: 520 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <SpeedLines />
              <CarSVG />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TRUCK ── */}
        <AnimatePresence>
          {phase.vehicle === "truck" && !complete && (
            <motion.div
              key="truck"
              style={{ position: "absolute", bottom: 48, zIndex: 10 }}
              initial={{ x: -185 }}
              animate={{ x: 520 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.6, ease: [0.18, 0.38, 0.48, 0.92] }}
            >
              <SpeedLines />
              <TruckSVG />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── PLANE (flies above road) ── */}
        <AnimatePresence>
          {phase.vehicle === "plane" && !complete && (
            <motion.div
              key="plane"
              style={{ position: "absolute", zIndex: 10 }}
              initial={{ x: -200, bottom: 100 }}
              animate={{ x: 530,  bottom: 140 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.2, ease: [0.12, 0.48, 0.5, 0.96] }}
            >
              {/* contrail */}
              <motion.div
                style={{
                  position: "absolute", right: "100%", top: "44%",
                  height: 2, borderRadius: 2,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8))",
                }}
                animate={{ width: [0, 100] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <PlaneSVG />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMPLETE OVERLAY ── */}
        <AnimatePresence>
          {complete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: "absolute", inset: 0, borderRadius: 18,
                background: "rgba(26,92,74,0.92)",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 16, delay: 0.1 }}
                style={{ fontSize: 58 }}
              >
                ✅
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{ margin: 0, color: "#fff", fontSize: 18, fontWeight: 800, letterSpacing: 0.3 }}
              >
                Upload Complete!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                transition={{ delay: 0.55 }}
                style={{ margin: 0, color: "#fff", fontSize: 12 }}
              >
                {received} batch{received !== 1 ? "es" : ""} transferred
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════ PHASE PROGRESS ════ */}
      {!complete && (
        <div style={{ width: "100%", maxWidth: 480, marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, padding: "0 2px" }}>
            {PHASES.map((p, i) => (
              <motion.div
                key={p.id}
                animate={{
                  scale: i === phaseIdx ? 1.28 : i < phaseIdx ? 1.05 : 1,
                  backgroundColor:
                    i < phaseIdx   ? "#2E7D6B" :
                    i === phaseIdx ? "#3dd68c" : "#d0e8e2",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 15,
                  border: i === phaseIdx ? "2.5px solid #1a5c4a" : "2px solid transparent",
                  boxShadow: i === phaseIdx ? "0 0 0 5px rgba(61,214,140,0.22)" : "none",
                  color: i <= phaseIdx ? "#fff" : "#8aada4",
                  fontWeight: 700, cursor: "default",
                }}
              >
                {i < phaseIdx
                  ? "✓"
                  : p.vehicle === "car"   ? "🚗"
                  : p.vehicle === "truck" ? "🚚"
                  : p.vehicle === "plane" ? "✈️"
                  : "🚶"}
              </motion.div>
            ))}
          </div>
          {/* progress bar */}
          <div style={{ height: 6, background: "#d0e8e2", borderRadius: 99, overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${((phaseIdx + 1) / PHASES.length) * 100}%` }}
              transition={{ duration: 0.65, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #2E7D6B, #3dd68c)",
                borderRadius: 99,
                boxShadow: "0 0 10px rgba(61,214,140,0.5)",
              }}
            />
          </div>
        </div>
      )}

      {/* ════ STATUS TEXT ════ */}
      <div style={{ marginTop: 16, textAlign: "center", width: "100%", maxWidth: 480 }}>
        <AnimatePresence mode="wait">
          {!complete ? (
            <motion.div
              key={phaseIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a3d2b", letterSpacing: 0.2 }}>
                {phase.label}
              </p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#2E7D6B", opacity: 0.78 }}>
                {status || phase.sub}
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 0.9, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#2E7D6B" }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a5c4a" }}
            >
              {status || "All done! Statement processed successfully."}
            </motion.p>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 8, fontSize: 12, color: "oklch(0.55 0.18 25)",
              background: "oklch(0.55 0.18 25 / 8%)",
              padding: "5px 14px", borderRadius: 8, display: "inline-block",
            }}
          >
            ⚠ {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}