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
}

export function StatCard({ 
  title, 
  subtitle,
  value, 
  icon, 
  colorType = "default", 
  loading, 
  tooltip 
}: StatCardProps) {

  const wrapperClasses = {
    primary: "bg-gradient-to-br from-primary/5 via-card to-background border-primary/20 hover:border-primary/40 dark:from-primary/10",
    emerald: "bg-gradient-to-br from-emerald-500/5 via-card to-background border-emerald-500/20 hover:border-emerald-500/40 dark:from-emerald-500/10",
    destructive: "bg-gradient-to-br from-destructive/5 via-card to-background border-destructive/20 hover:border-destructive/40 dark:from-destructive/10",
    amber: "bg-gradient-to-br from-amber-500/5 via-card to-background border-amber-500/20 hover:border-amber-500/40 dark:from-amber-500/10",
    indigo: "bg-gradient-to-br from-indigo-500/5 via-card to-background border-indigo-500/20 hover:border-indigo-500/40 dark:from-indigo-500/10",
    violet: "bg-gradient-to-br from-violet-500/5 via-card to-background border-violet-500/20 hover:border-violet-500/40 dark:from-violet-500/10",
    default: "bg-gradient-to-br from-muted/5 via-card to-background border-border hover:border-muted-foreground/30 dark:from-muted/10",
  };

  const topAccentClasses = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    destructive: "bg-destructive",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
    default: "bg-muted-foreground",
  };

  const glowClasses = {
    primary: "bg-primary",
    emerald: "bg-emerald-500",
    destructive: "bg-destructive",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
    default: "bg-muted-foreground",
  };

  const iconColorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400",
    destructive: "bg-destructive/10 text-destructive border-destructive/20 dark:text-destructive",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20 dark:text-amber-400",
    indigo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:text-indigo-400",
    violet: "bg-violet-500/10 text-violet-500 border-violet-500/20 dark:text-violet-400",
    default: "bg-muted/10 text-muted-foreground border-border",
  };

  const textColorClasses = {
    primary: "text-foreground drop-shadow-sm",
    emerald: "text-emerald-600 dark:text-emerald-400 drop-shadow-sm",
    destructive: "text-destructive drop-shadow-sm",
    amber: "text-foreground drop-shadow-sm", 
    indigo: "text-indigo-600 dark:text-indigo-400 drop-shadow-sm",
    violet: "text-violet-600 dark:text-violet-400 drop-shadow-sm",
    default: "text-foreground drop-shadow-sm"
  };

  return (
    <div 
      className={cn(
        "w-full h-full text-card-foreground p-5 md:p-6 rounded-none flex flex-col justify-between min-h-[130px]",
        "border border-white/5 shadow-md hover:shadow-xl transition-all duration-500",
        "relative group overflow-hidden hover:-translate-y-1",
        wrapperClasses[colorType]
      )}
    >
      {/* Accent top line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[3px] opacity-40 transition-opacity duration-500 group-hover:opacity-100",
        topAccentClasses[colorType]
      )} />

      {/* Decorative ambient glow */}
      <div className={cn(
        "absolute -bottom-8 -right-8 w-32 h-32 blur-[50px] rounded-full pointer-events-none opacity-20 transition-opacity duration-500 group-hover:opacity-40",
        glowClasses[colorType]
      )} />

      <div className="flex items-start justify-between mb-2 relative z-10">
        <div className="flex flex-col gap-1">
          <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.15em] opacity-80">{title}</h3>
          {subtitle && (
            <p className="text-[10px] font-bold text-foreground/60 uppercase tracking-tight line-clamp-1 max-w-[140px]">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-none flex items-center justify-center border shadow-sm transition-colors duration-300", 
          iconColorClasses[colorType]
        )}>
          {icon}
        </div>
      </div>
      
      <div className="flex-1 flex items-end relative z-10 mt-4">
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/50 mb-1" />
        ) : (
          <span 
            className={cn("text-[2rem] leading-none font-black tabular-nums tracking-tighter truncate w-full", textColorClasses[colorType])} 
            title={tooltip}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
