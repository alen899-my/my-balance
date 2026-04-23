"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AuthLayoutProps {
  children: React.ReactNode;
  leftPanel?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  brandName?: string;
  tagline?: string;
  heading?: string;
  subheading?: string;
  imageSide?: "left" | "right";
  className?: string;
  formPanelClassName?: string;
}

/* ─── Brand mark ─────────────────────────────────────────── */

const BrandMark = ({ name = "MyBalance", small = false, light = false }: { name?: string; small?: boolean; light?: boolean }) => (
  <div className={cn("flex items-center gap-2.5", small && "gap-2")}>
    <span
      className={cn(
        "flex items-center justify-center shrink-0 overflow-hidden",
        small ? "h-7 w-7" : "h-9 w-9"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/logos/wallet.png"
        alt="MyBalance"
        className="h-full w-full object-contain drop-shadow-sm"
        draggable={false}
      />
    </span>
    <span className={cn(
      "font-bold tracking-tight text-primary",
      small ? "text-base" : "text-xl"
    )}>
      {name}
    </span>
  </div>
);

/* ─── Stat card ──────────────────────────────────────────── */

const StatCard = ({ label, value, delta }: { label: string; value: string; delta: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-none px-4 py-3.5 flex flex-col gap-1">
    <p className="text-[10px] uppercase tracking-widest text-white/40 font-medium">{label}</p>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    <p className="text-xs text-emerald-400 font-medium">{delta}</p>
  </div>
);

/* ─── Default left panel ─────────────────────────────────── */

function DefaultLeftPanel({
  imageSrc,
  imageAlt = "Authentication visual",
  brandName = "MyBalance",
  tagline = "Unify all your accounts. Track every dollar. Move money faster.",
}: Pick<AuthLayoutProps, "imageSrc" | "imageAlt" | "brandName" | "tagline">) {
  if (imageSrc) {
    return (
      <div className="relative w-full h-full bg-foreground">
        <Image src={imageSrc} alt={imageAlt ?? ""} fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute bottom-8 left-8 z-10 max-w-xs">
           <p className="text-white/80 text-lg font-medium leading-relaxed drop-shadow-md">{tagline}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full w-full overflow-hidden bg-foreground select-none">
      {/* Subtle warm gradient orbs — no blur, no glow gimmicks */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 15% 10%, oklch(0.700 0.210 47 / 0.22) 0%, transparent 70%), radial-gradient(ellipse 50% 45% at 85% 85%, oklch(0.840 0.183 78 / 0.18) 0%, transparent 65%)",
        }}
      />

      {/* Grid lines — very subtle */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Central content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 gap-8">
        {/* Tagline */}
        <div className="max-w-xs">
          <h2 className="text-3xl font-bold text-white leading-snug tracking-tight">
            Financial clarity,<br />
            <span className="text-primary">finally.</span>
          </h2>
          <p className="mt-3 text-sm text-white/50 leading-relaxed">{tagline}</p>
        </div>

        {/* Mini stat cards */}
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <StatCard label="Net worth" value="$84,320" delta="↑ 3.2% this month" />
          <StatCard label="Savings rate" value="28.4%" delta="↑ 1.1 pts vs last" />
        </div>
      </div>

      {/* Bottom tag */}
      <div className="relative z-10 p-8 pt-0 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <p className="text-[11px] text-white/35 tracking-wide">
          256-bit encrypted · SOC 2 Type II · Bank-grade security
        </p>
      </div>
    </div>
  );
}

/* ─── AuthLayout ─────────────────────────────────────────── */

export function AuthLayout({
  children,
  leftPanel,
  imageSrc,
  imageAlt,
  brandName = "MyBalance",
  tagline,
  heading,
  subheading,
  imageSide = "left",
  className,
  formPanelClassName,
}: AuthLayoutProps) {
  const bgPanel = leftPanel ?? (
    <DefaultLeftPanel
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      brandName={brandName}
      tagline={tagline}
    />
  );

  return (
    <div className={cn("min-h-screen w-full relative flex flex-col bg-background text-foreground", className)}>
      {/* Background layer for desktop */}
      <div className="hidden lg:block absolute inset-0 z-0">
        {bgPanel}
      </div>

      {/* Main container */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full min-h-screen">
        <div 
          className={cn(
            "w-full flex flex-col lg:items-center lg:justify-center px-5 py-12 sm:px-8",
            "lg:bg-transparent"
          )}
        >
          {/* The Sharp Card */}
          <div className={cn(
            "w-full max-w-md transition-all duration-500",
            "lg:bg-card lg:border lg:border-border lg:p-10 lg:rounded-2xl lg:shadow-[0_40px_100px_rgba(0,0,0,0.15)]",
            "dark:lg:shadow-[0_40px_100px_rgba(0,0,0,0.8)]",
            formPanelClassName
          )}>
            {/* Brand identifier */}
            <div className="mb-8 lg:mb-10">
               <BrandMark name={brandName} small />
               <div className="h-px w-12 bg-border mt-4" />
            </div>

            {(heading || subheading) && (
              <div className="mb-8">
                {heading && (
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-card-foreground">
                    {heading}
                  </h1>
                )}
                {subheading && (
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {subheading}
                  </p>
                )}
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}