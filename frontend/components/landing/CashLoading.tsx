"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CashLoadingProps {
  onComplete: () => void;
}

const BILL_W = 110;
const BILL_H = 48;

class Bill {
  x: number; y: number;
  vx: number; vy: number; vr: number;
  rotation: number; gravity: number;
  life: number; maxLife: number;
  wobble: number; wobbleSpeed: number;
  scale: number; hue: number;
  alive: boolean; born: number;

  constructor(delay: number, cw: number, ch: number) {
    this.born = performance.now() + delay * 1000;
    this.alive = false;
    const cx = cw / 2, cy = ch / 2;
    this.x = cx + (Math.random() - 0.5) * 60;
    this.y = cy + (Math.random() - 0.5) * 60;
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.vr = (Math.random() - 0.5) * 6;
    this.rotation = Math.random() * 360;
    this.gravity = 0.08 + Math.random() * 0.05;
    this.life = 0;
    this.maxLife = 120 + Math.random() * 60;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = 0.08 + Math.random() * 0.06;
    this.scale = 0.4 + Math.random() * 0.5;
    this.hue = 142 + (Math.random() - 0.5) * 20;
  }

  update() {
    if (!this.alive) return;
    this.life++;
    this.x += this.vx; this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= 0.995; this.vr *= 0.99;
    this.rotation += this.vr;
    this.wobble += this.wobbleSpeed;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.alive) return;
    const t = this.life / this.maxLife;
    const alpha = t < 0.15 ? t / 0.15 : t > 0.75 ? 1 - (t - 0.75) / 0.25 : 1;
    if (alpha <= 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.scale, this.scale * (0.6 + 0.4 * Math.abs(Math.cos(this.wobble))));
    ctx.globalAlpha = alpha * 0.85;

    const w = BILL_W, h = BILL_H;
    ctx.shadowColor = `hsla(${this.hue}, 80%, 40%, 0.4)`;
    ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;

    const bg = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
    bg.addColorStop(0, `hsl(${this.hue}, 70%, 22%)`);
    bg.addColorStop(0.5, `hsl(${this.hue}, 60%, 28%)`);
    bg.addColorStop(1, `hsl(${this.hue}, 70%, 18%)`);
    ctx.fillStyle = bg;
    ctx.beginPath();
    (ctx as any).roundRect(-w/2, -h/2, w, h, 4);
    ctx.fill();

    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.strokeStyle = `hsla(${this.hue}, 80%, 55%, 0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath(); (ctx as any).roundRect(-w/2, -h/2, w, h, 4); ctx.stroke();

    ctx.strokeStyle = `hsla(${this.hue}, 60%, 50%, 0.2)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath(); (ctx as any).roundRect(-w/2+4, -h/2+4, w-8, h-8, 2); ctx.stroke();

    ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, 0.3)`;
    ctx.fillRect(-w/2+8, -h/2+8, 30, 2);
    ctx.fillRect(-w/2+8, -h/2+13, 20, 1.5);

    ctx.fillStyle = `hsl(${this.hue}, 80%, 75%)`;
    ctx.font = 'bold 18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = `hsla(${this.hue}, 100%, 60%, 0.8)`; ctx.shadowBlur = 8;
    ctx.fillText('$', 0, 2); ctx.shadowBlur = 0;

    ctx.fillStyle = `hsla(${this.hue}, 60%, 70%, 0.6)`;
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('100', w/2-14, -h/2+10);
    ctx.fillText('100', -w/2+14, h/2-10);

    const shimmer = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
    shimmer.addColorStop(0, 'rgba(255,255,255,0)');
    shimmer.addColorStop(0.5, 'rgba(255,255,255,0.1)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmer;
    ctx.beginPath(); (ctx as any).roundRect(-w/2, -h/2, w, h, 4); ctx.fill();

    ctx.restore();
  }

  isDead() { return this.alive && this.life >= this.maxLife; }
}

export const CashLoading = ({ onComplete }: CashLoadingProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let bills: Bill[] = [];
    for (let i = 0; i < 28; i++) {
      bills.push(new Bill(i * 0.08, canvas.width, canvas.height));
    }

    let raf: number;
    let running = true;

    const loop = () => {
      if (!running) return;
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bills.forEach(b => { if (!b.alive && now >= b.born) b.alive = true; b.update(); b.draw(ctx); });
      bills = bills.filter(b => !b.isDead());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const t1 = setTimeout(() => setShowContent(true), 900);
    const t2 = setTimeout(() => { running = false; onComplete(); }, 4200);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      clearTimeout(t1); clearTimeout(t2);
      window.removeEventListener('resize', resize);
    };
  }, [onComplete]);

  const titleChars = [
    ...'My'.split('').map((c, i) => ({ c, accent: false, delay: 1.0 + i * 0.07 })),
    ...'Balance'.split('').map((c, i) => ({ c, accent: true, delay: 1.14 + i * 0.07 })),
  ];

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.8 } }}
      className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Scan line */}
      <motion.div
        initial={{ top: '-2px' }} animate={{ top: '100%' }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute left-0 w-full h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(16,185,129,0.15),transparent)' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4"
            >
          

              {/* Title */}
              <div className="text-center">
                <div className="flex text-5xl font-black tracking-tight leading-none">
                  {titleChars.map(({ c, accent, delay }, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, y: 32 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
                      className={accent ? 'text-emerald-400' : 'text-white'}
                    >
                      {c}
                    </motion.span>
                  ))}
                </div>
               
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 4.2, ease: 'linear' }}
        className="absolute bottom-0 left-0 h-[2px] opacity-40"
        style={{ background: 'linear-gradient(90deg,transparent,#10b981,transparent)' }}
      />
    </motion.div>
  );
};