import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string | React.ReactNode;
  icon: React.ReactNode;
  colorType?: "primary" | "emerald" | "destructive" | "amber" | "indigo" | "violet" | "default";
  loading?: boolean;
  tooltip?: string;
  data?: number[];
}

export function StatCard({
  title,
  subtitle,
  value,
  icon,
  colorType = "default",
  loading,
  tooltip,
  data = [],
}: StatCardProps) {

  const colorConfig = {
    primary: {
      border: "border-primary/10",
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      sparkline: "#3b82f6"
    },
    emerald: {
      border: "border-emerald-500/10",
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      sparkline: "#10b981"
    },
    destructive: {
      border: "border-red-500/10",
      bg: "bg-red-500/10",
      text: "text-red-500",
      sparkline: "#ef4444"
    },
    amber: {
      border: "border-amber-500/10",
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      sparkline: "#f59e0b"
    },
    indigo: {
      border: "border-indigo-500/10",
      bg: "bg-indigo-500/10",
      text: "text-indigo-500",
      sparkline: "#6366f1"
    },
    violet: {
      border: "border-violet-500/10",
      bg: "bg-violet-500/10",
      text: "text-violet-500",
      sparkline: "#8b5cf6"
    },
    default: {
      border: "border-border/50",
      bg: "bg-muted/10",
      text: "text-muted-foreground",
      sparkline: "#94a3b8"
    }
  };

  const config = colorConfig[colorType];

  // Helper to generate dynamic smooth path
  const generatePath = (points: number[]) => {
    if (!points || points.length < 2) {
      // Default placeholder path if no data
      return "M 0 50 Q 10 40 20 50 T 40 30 T 60 50 T 80 20 T 100 40";
    }
    
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min;
    
    const h = 25; // actual graph height
    const off = 15; // top offset
    
    const pts = points.map((p, i) => {
      const x = (i / (points.length - 1)) * 100;
      const normalizedY = range === 0 ? 0.5 : (p - min) / range;
      const y = off + (h - normalizedY * h);
      return { x, y };
    });

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const midX = (curr.x + next.x) / 2;
      d += ` Q ${curr.x} ${curr.y}, ${midX} ${(curr.y + next.y) / 2} T ${next.x} ${next.y}`;
    }
    return d;
  };

  const sparklinePath = generatePath(data);

  return (
    <div
      className={cn(
        "relative flex flex-col bg-white dark:bg-zinc-900 border transition-all duration-300 hover:shadow-lg group h-[160px]",
        config.border,
        "rounded-2xl"
      )}
      title={tooltip}
    >
      <div className="flex flex-col flex-1 p-5 pb-0 relative z-10">
        <div className="flex items-start justify-between w-full">
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
            {title}
          </span>
          <div className={cn("w-9 h-9 flex items-center justify-center rounded-full transition-transform group-hover:scale-110", config.bg, config.text)}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: "w-4 h-4" })}
          </div>
        </div>

        <div className="flex flex-col mt-1">
          {loading ? (
            <div className="h-8 w-24 bg-muted/20 animate-pulse rounded" />
          ) : (
            <h2 className={cn(
              "font-black tracking-tighter text-foreground leading-none transition-all duration-300",
              typeof value === "string" && value.length > 12 ? "text-lg sm:text-xl" : 
              typeof value === "string" && value.length > 9 ? "text-xl sm:text-2xl" : 
              "text-2xl sm:text-[28px]"
            )}>
              {value}
            </h2>
          )}
          {subtitle && (
            <p className="text-[10px] font-bold text-muted-foreground/40 mt-2 uppercase tracking-wider">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="h-16 w-full mt-auto relative overflow-hidden rounded-b-2xl">
        <svg className="w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${colorType}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={config.sparkline} stopOpacity="0.1" />
              <stop offset="100%" stopColor={config.sparkline} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <path
            d={`${sparklinePath} L 100 60 L 0 60 Z`}
            fill={`url(#grad-${colorType})`}
          />

          <path
            d={sparklinePath}
            fill="none"
            stroke={config.sparkline}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pulse-path"
          />
        </svg>
      </div>

      <style jsx>{`
        .pulse-path {
          stroke-dasharray: 200;
          animation: pulse-flow 10s linear infinite;
        }
        @keyframes pulse-flow {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}
