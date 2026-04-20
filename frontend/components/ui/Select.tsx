"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
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
  searchable?: boolean;
}

export function Select({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select...", 
  className, 
  disabled,
  searchable = false
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

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
        <div className="absolute z-[100] w-full min-w-[200px] mt-1.5 bg-background/95 backdrop-blur-md border border-border/80 rounded-md shadow-xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 overflow-hidden">
          
          {searchable && (
            <div className="p-2 border-b border-border/50 bg-muted/10 sticky top-0 z-10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input 
                  type="text"
                  autoFocus
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/40 transition-shadow"
                />
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-auto p-1 custom-scrollbar">
            {/* Placeholder / Clear Option */}
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
              <Check className={cn("w-4 h-4", value === "" ? "opacity-100" : "opacity-0")} />
            </button>

            {filteredOptions.length > 0 && <div className="h-px w-full bg-border/50 my-1"></div>}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground italic">No matches found</div>
            ) : (
              filteredOptions.map((opt) => (
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
                  <Check className={cn("w-4 h-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
