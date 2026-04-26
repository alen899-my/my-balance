"use client";

import React from "react";
import Link from "next/link";

export function LandingNavbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-6 lg:px-12 max-w-[1400px] w-full mx-auto relative z-20">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/images/logos/wallet.png" 
          alt="MyBalance Logo" 
          className="w-9 h-9 object-contain" 
        />
        <span className="text-xl font-bold tracking-tight">
          <span className="text-emerald-500">My</span>
          <span className="text-white">Balance</span>
        </span>
      </div>
      
      <div className="hidden md:flex items-center gap-8">
        <Link href="#" className="text-emerald-400 font-semibold border-b-2 border-emerald-400 pb-1">
          Home
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-white/90 font-semibold hover:text-white transition-colors hidden sm:block">
          Log In
        </Link>
        <Link href="/signup" className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}
