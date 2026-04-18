"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ScanningAnimationProps {
  status: string | null;
  error: string | null;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const TICKER =
  "HDFC BANK ↑ ₹1,24,000  |  Netflix -₹649  |  Salary +₹85,000  |  Swiggy -₹340  |  Amazon -₹1,299  |  Zomato -₹480  |  UPI Transfer +₹5,000  |  EMI -₹12,500";

const TRANSACTIONS = [
  { label: "Salary credit",       amount: "+₹85,000", cat: "Income",        color: "#639922" },
  { label: "Netflix subscription",amount: "-₹649",    cat: "Entertainment", color: "#378ADD" },
  { label: "Zomato order",        amount: "-₹480",    cat: "Food",          color: "#EF9F27" },
  { label: "Amazon purchase",     amount: "-₹1,299",  cat: "Shopping",      color: "#D85A30" },
  { label: "UPI – Transfer",      amount: "+₹5,000",  cat: "Transfer",      color: "#7F77DD" },
  { label: "Electricity bill",    amount: "-₹1,840",  cat: "Bills",         color: "#D4537E" },
];

const BAR_HEIGHTS = [38, 28, 44, 20, 36, 48];
const BAR_COLORS  = ["#378ADD","#639922","#EF9F27","#D85A30","#378ADD","#639922"];

// ─── sub-components ─────────────────────────────────────────────────────────

/** Floating ₹ coins that rise from the bottom */
function CoinField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const spawn = () => {
      const coin = document.createElement("div");
      const left = 20 + Math.random() * 200;
      Object.assign(coin.style, {
        position: "absolute",
        left: `${left}px`,
        bottom: "0",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "#EF9F27",
        border: "1.5px solid #BA7517",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "9px",
        color: "#412402",
        fontWeight: "600",
        animation: `scanCoinFly ${0.8 + Math.random() * 0.6}s ease forwards`,
        pointerEvents: "none",
      });
      coin.textContent = "₹";
      el.appendChild(coin);
      setTimeout(() => coin.remove(), 1_500);
    };

    const id = setInterval(spawn, 320);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      ref={ref}
      style={{ position: "relative", width: 260, height: 60, overflow: "visible", pointerEvents: "none" }}
    />
  );
}

/** Glowing scanline over the document mockup */
function DocumentScanner() {
  // highlight rows sequentially
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    rowRefs.current.forEach((row, i) => {
      const on  = setTimeout(() => { if (row) { row.style.background = "#97C459"; row.style.opacity = "1"; } }, i * 380);
      const off = setTimeout(() => { if (row) { row.style.background = ""; row.style.opacity = "0.45"; } }, i * 380 + 500);
      return () => { clearTimeout(on); clearTimeout(off); };
    });
  }, []);

  const docRows = Array.from({ length: 6 });

  return (
    <div style={{ position: "relative", width: 160, height: 200, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,.07)" }}>
      {/* header */}
      <div style={{ padding: "14px 12px 6px", display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ height: 8,  width: "70%", background: "#639922",                    borderRadius: 3, opacity: .75 }} />
        <div style={{ height: 6,  width: "90%", background: "var(--color-background-secondary)", borderRadius: 3 }} />
        <div style={{ height: 1,  width: "100%",background: "var(--color-border-tertiary)",borderRadius: 0, margin: "4px 0" }} />
      </div>

      {/* data rows */}
      <div style={{ paddingInline: 12, display: "flex", flexDirection: "column", gap: 7 }}>
        {docRows.map((_, i) => (
          <div
            key={i}
            ref={el => { rowRefs.current[i] = el; }}
            style={{ height: 6, width: `${[100,85,95,75,88,92][i]}%`, background: "var(--color-background-secondary)", borderRadius: 3, opacity: .45, transition: "background .25s, opacity .25s" }}
          />
        ))}
      </div>

      {/* totals row */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingInline: 12, marginTop: 8 }}>
        <div style={{ height: 6, width: "40%", background: "var(--color-background-secondary)", borderRadius: 3 }} />
        <div style={{ height: 6, width: "28%", background: "#97C459", borderRadius: 3, opacity: .9 }} />
      </div>

      {/* animated scanline */}
      <motion.div
        animate={{ top: ["8%", "88%", "8%"] }}
        transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
        style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#97C459,transparent)", boxShadow: "0 0 8px #97C459", zIndex: 10 }}
      />

      {/* floating data particles */}
      <DataParticles />
    </div>
  );
}

/** Tiny ₹ / bit particles that fly off the right edge of the scanner */
function DataParticles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const bits = ["₹", "01", "42", "$", "%", "←"];
    const id = setInterval(() => {
      const p = document.createElement("div");
      Object.assign(p.style, {
        position: "absolute",
        top: `${10 + Math.random() * 80}%`,
        right: "0",
        fontSize: "8px",
        fontFamily: "var(--font-mono)",
        color: "#97C459",
        animation: `scanFadeUp ${0.8 + Math.random() * 0.5}s ease forwards`,
        whiteSpace: "nowrap",
        pointerEvents: "none",
      });
      p.textContent = bits[Math.floor(Math.random() * bits.length)];
      el.appendChild(p);
      setTimeout(() => p.remove(), 1_300);
    }, 280);
    return () => clearInterval(id);
  }, []);

  return <div ref={ref} style={{ position: "absolute", right: -10, top: 0, bottom: 0, width: 24, overflow: "visible", pointerEvents: "none" }} />;
}

/** Mini growing bar chart */
function BarChart() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 52, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 12px", border: "0.5px solid var(--color-border-tertiary)" }}>
      {BAR_HEIGHTS.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 4 }}
          animate={{ height: h }}
          transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
          style={{ width: 12, background: BAR_COLORS[i], borderRadius: "3px 3px 0 0" }}
        />
      ))}
    </div>
  );
}

/** Transaction rows flying in */
function TxList({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [visible, setVisible] = React.useState<typeof TRANSACTIONS>([]);

  useEffect(() => {
    TRANSACTIONS.forEach((tx, i) => {
      const t = setTimeout(() => {
        setVisible(prev => {
          const next = [...prev, tx].slice(-4); // keep last 4 visible
          onCountChange(i + 1);
          return next;
        });
      }, i * 440);
      return () => clearTimeout(t);
    });
  }, [onCountChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 360 }}>
      <AnimatePresence>
        {visible.map((tx) => (
          <motion.div
            key={tx.label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: tx.color, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)", margin: 0 }}>{tx.label}</p>
                <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>{tx.cat}</p>
              </div>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: tx.amount.startsWith("+") ? "#639922" : "#D85A30" }}>{tx.amount}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── keyframes injected once ─────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes scanCoinFly {
  0%   { opacity:0; transform:translateY(0) scale(.6) }
  40%  { opacity:1; transform:translateY(-32px) scale(1) }
  100% { opacity:0; transform:translateY(-72px) scale(.7) }
}
@keyframes scanFadeUp {
  0%   { opacity:0; transform:translateY(6px) }
  50%  { opacity:1 }
  100% { opacity:0; transform:translateY(-28px) }
}
@keyframes scanTickerScroll {
  from { transform:translateX(0) }
  to   { transform:translateX(-50%) }
}
@keyframes scanCheckDraw {
  from { stroke-dashoffset:60 }
  to   { stroke-dashoffset:0 }
}
@keyframes scanRing {
  0%   { transform:scale(.7); opacity:1 }
  100% { transform:scale(2.2); opacity:0 }
}
@keyframes scanNumberRoll {
  from { transform:translateY(10px); opacity:0 }
  to   { transform:translateY(0);    opacity:1 }
}
`;

// ─── main component ──────────────────────────────────────────────────────────

export function ScanningAnimation({ status, error }: ScanningAnimationProps) {
  const [txCount, setTxCount] = React.useState(0);

  // Inject keyframes once
  useEffect(() => {
    if (document.getElementById("scan-anim-kf")) return;
    const s = document.createElement("style");
    s.id = "scan-anim-kf";
    s.textContent = KEYFRAMES;
    document.head.appendChild(s);
  }, []);

  const getStage = () => {
    if (error) return "error";
    if (!status) return "idle";
    const s = status.toLowerCase();
    if (s.includes("uploading")) return "uploading";
    if (s.includes("processing") || s.includes("scanning")) return "scanning";
    if (s.includes("parsing") || s.includes("reading")) return "parsing";
    if (s.includes("success") || s.includes("complete")) return "complete";
    return "scanning";
  };

  const stage = getStage();

  const wrap: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: "2.5rem 1rem",
    minHeight: 360,
    background: "var(--color-background-secondary)",
    borderRadius: "var(--border-radius-lg)",
    border: "0.5px solid var(--color-border-tertiary)",
    overflow: "hidden",
    position: "relative",
  };

  return (
    <div style={wrap}>
      <AnimatePresence mode="wait">

        {/* ── IDLE ──────────────────────────────────────────────────────── */}
        {stage === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 32 }}>📄</div>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: 0 }}>Upload your bank statement to begin</p>
          </motion.div>
        )}

        {/* ── UPLOADING ─────────────────────────────────────────────────── */}
        {stage === "uploading" && (
          <motion.div key="uploading"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .92 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>

            {/* floating doc icon */}
            <div style={{ position: "relative" }}>
              <motion.div
                animate={{ y: [0, -10, 0], scale: [1, 1.03, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: 88, height: 88, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
                  <rect x="4" y="2" width="24" height="32" rx="3" fill="#E6F1FB"/>
                  <rect x="4" y="2" width="24" height="32" rx="3" stroke="#378ADD" strokeWidth="1"/>
                  <line x1="9" y1="12" x2="23" y2="12" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="9" y1="17" x2="23" y2="17" stroke="#B5D4F4" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="9" y1="22" x2="19" y2="22" stroke="#B5D4F4" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="30" cy="30" r="7" fill="#639922"/>
                  <text x="30" y="33.5" fontSize="8" fill="white" fontWeight="600" textAnchor="middle">₹</text>
                </svg>
              </motion.div>
              {/* spinner badge */}
              <div style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, background: "#639922", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: .8, repeat: Infinity, ease: "linear" }}
                  style={{ width: 14, height: 14, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
              </div>
            </div>

            {/* ticker tape */}
            <div style={{ width: "100%", maxWidth: 340, overflow: "hidden", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", padding: "7px 0" }}>
              <div style={{ display: "flex", gap: 32, whiteSpace: "nowrap", animation: "scanTickerScroll 9s linear infinite" }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{TICKER}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{TICKER}</span>
              </div>
            </div>

            {/* coin field */}
            <CoinField />

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 4px" }}>Uploading your statement</p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Securing your financial data...</p>
            </div>

            {/* shimmer bar */}
            <div style={{ width: 220, height: 4, background: "var(--color-border-tertiary)", borderRadius: 99, overflow: "hidden", position: "relative" }}>
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0, background: "#97C459", borderRadius: 99 }}
              />
            </div>
          </motion.div>
        )}

        {/* ── SCANNING ──────────────────────────────────────────────────── */}
        {stage === "scanning" && (
          <motion.div key="scanning"
            initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -16 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>

            <DocumentScanner />
            <BarChart />

            <div style={{ textAlign: "center" }}>
              <motion.p animate={{ opacity: [.6, 1, .6] }} transition={{ duration: 1.8, repeat: Infinity }}
                style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 4px" }}>
                Reading transactions
              </motion.p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>
                {status ?? "Identifying debits, credits & patterns…"}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── PARSING ───────────────────────────────────────────────────── */}
        {stage === "parsing" && (
          <motion.div key="parsing"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%" }}>

            <TxList onCountChange={setTxCount} />

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 4px" }}>Parsing transactions</p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Categorizing your spending automatically…</p>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>transactions found</span>
              <motion.span key={txCount} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                style={{ fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)", minWidth: 36, textAlign: "right" }}>
                {txCount}
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* ── COMPLETE ──────────────────────────────────────────────────── */}
        {stage === "complete" && (
          <motion.div key="complete"
            initial={{ opacity: 0, scale: .7 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 120 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>

            {/* checkmark with rings */}
            <div style={{ position: "relative", width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0, .2].map(delay => (
                <motion.div key={delay}
                  initial={{ scale: .7, opacity: 1 }} animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1, delay, ease: "easeOut" }}
                  style={{ position: "absolute", inset: 0, border: "2px solid #639922", borderRadius: "50%" }}
                />
              ))}
              <motion.div
                animate={{ boxShadow: ["0 0 0 0 rgba(99,153,34,.25)", "0 0 0 10px rgba(99,153,34,0)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 64, height: 64, background: "#639922", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M7 16 L13 22 L25 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="60" strokeDashoffset="60"
                    style={{ animation: "scanCheckDraw .5s .3s ease forwards" }} />
                </svg>
              </motion.div>
            </div>

            {/* summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, width: "100%", maxWidth: 360 }}>
              {[
                { label: "Total in",  value: "₹1.2L", color: "#639922" },
                { label: "Total out", value: "₹48K",  color: "#D85A30" },
                { label: "Txns",      value: "47",    color: "var(--color-text-primary)" },
              ].map((c, i) => (
                <motion.div key={c.label}
                  initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: .4 + i * .12 }}
                  style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "10px", textAlign: "center", border: "0.5px solid var(--color-border-tertiary)" }}>
                  <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: "0 0 3px" }}>{c.label}</p>
                  <p style={{ fontSize: 15, fontWeight: 500, color: c.color, margin: 0 }}>{c.value}</p>
                </motion.div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 4px" }}>All done! Saved to table.</p>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Your transactions are ready to review.</p>
            </div>
          </motion.div>
        )}

        {/* ── ERROR ─────────────────────────────────────────────────────── */}
        {stage === "error" && (
          <motion.div key="error"
            initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ width: 72, height: 72, background: "var(--color-background-danger)", border: "0.5px solid var(--color-border-danger)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={32} style={{ color: "var(--color-text-danger)" }} />
            </div>
            <div style={{ textAlign: "center", paddingInline: 16 }}>
              <p style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)", margin: "0 0 6px" }}>Something went wrong</p>
              <p style={{ fontSize: 13, color: "var(--color-text-danger)", margin: "0 0 16px", maxWidth: 280 }}>{error}</p>
              <button onClick={() => window.location.reload()}
                style={{ fontSize: 12, fontWeight: 500, color: "#639922", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Try again
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}