"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function Select({ value, onChange, options = [], placeholder = "Select...", className, disabled }: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={cn("relative w-full min-w-[140px]", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full h-8 px-2.5 text-sm bg-background border rounded-md transition-all duration-200",
          disabled 
            ? "opacity-50 cursor-not-allowed border-border/50 text-muted-foreground bg-muted/20" 
            : "border-border hover:border-primary/50 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 hover:bg-accent/40",
          open && "ring-1 ring-primary/50 border-primary/50 bg-accent/30 box-shadow-sm"
        )}
      >
        <span className="truncate pr-4 leading-none">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground/70 transition-transform duration-300", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-[100] w-full min-w-max mt-1.5 bg-background/95 backdrop-blur-md border border-border/80 rounded-md shadow-xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-auto p-1 custom-scrollbar">
            <button
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 text-sm rounded transition-colors group cursor-pointer",
                value === "" ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent/60"
              )}
            >
              <span className="truncate pr-4">{placeholder}</span>
              <Check className={cn("w-4 h-4", value === "" ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:text-muted-foreground")} />
            </button>

            {options.length > 0 && <div className="h-px w-full bg-border/50 my-1"></div>}

            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 text-sm rounded transition-colors group cursor-pointer",
                  value === opt.value ? "bg-primary/10 text-primary font-medium" : "text-foreground hover:bg-accent/60"
                )}
              >
                <span className="truncate pr-4 leading-none">{opt.label}</span>
                <Check className={cn("w-4 h-4", value === opt.value ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:text-muted-foreground")} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
