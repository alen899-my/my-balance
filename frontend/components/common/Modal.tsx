"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────── */

export type ModalSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type ModalPosition = "center" | "top";

export interface ModalProps {
  /** Controls visibility */
  open: boolean;
  /** Called when the modal requests to close */
  onClose: () => void;

  /** Modal content */
  children: React.ReactNode;

  /** Width preset */
  size?: ModalSize;

  /** Vertical position */
  position?: ModalPosition;

  /** Title rendered in the built-in header */
  title?: React.ReactNode;

  /** Subtitle rendered below the title */
  description?: React.ReactNode;

  /** Completely replaces the built-in header */
  header?: React.ReactNode;

  /** Renders a sticky footer area (actions bar) */
  footer?: React.ReactNode;

  /** Hide the default close (×) button */
  hideCloseButton?: boolean;

  /** Prevent closing on backdrop click */
  disableBackdropClose?: boolean;

  /** Prevent closing on Escape key */
  disableEscapeClose?: boolean;

  /** Remove inner padding (for image / custom full-bleed content) */
  noPadding?: boolean;

  /** Extra classes for the modal panel */
  className?: string;

  /** Extra classes for the backdrop */
  backdropClassName?: string;

  /** aria-label for the dialog (falls back to title) */
  ariaLabel?: string;
  /** Renders a sidebar within the modal body */
  sidebar?: React.ReactNode;
  /** Extra classes for the sidebar container */
  sidebarClassName?: string;
}

/* ─── Size map ───────────────────────────────────────────── */

const sizeMap: Record<ModalSize, string> = {
  xs:   "max-w-xs",
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-xl",
  "2xl":"max-w-2xl",
  full: "max-w-full mx-4",
};

/* ─── Modal ──────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  position = "center",
  title,
  description,
  header,
  footer,
  hideCloseButton = false,
  disableBackdropClose = false,
  disableEscapeClose = false,
  noPadding = false,
  className,
  backdropClassName,
  ariaLabel,
  sidebar,
  sidebarClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  /* ── Escape key ── */
  useEffect(() => {
    if (!open || disableEscapeClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, disableEscapeClose, onClose]);

  /* ── Body scroll lock + focus management ── */
  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Move focus into the panel
      requestAnimationFrame(() => {
        panelRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* ── Focus trap ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    []
  );

  if (!open) return null;

  const hasBuiltInHeader = !header && (title || description || !hideCloseButton);

  return (
    /* ── Backdrop ── */
    <div
      role="presentation"
      className={cn(
        "fixed inset-0 z-50 flex px-4 py-6",
        position === "center" ? "items-center justify-center" : "items-start justify-center pt-16",
        // Backdrop
        "bg-foreground/25",
        backdropClassName
      )}
      onClick={(e) => {
        if (!disableBackdropClose && e.target === e.currentTarget) onClose();
      }}
    >
      {/* ── Panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === "string" ? title : undefined)}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          // Layout
          "relative w-full flex flex-col",
          // Sizing
          sizeMap[size],
          // Max height — scrollable body
          position === "center"
            ? "max-h-[calc(100dvh-3rem)]"
            : "max-h-[calc(100dvh-5rem)]",
          // Appearance — uses theme vars, no glassmorphism
          "bg-popover text-popover-foreground",
          "border border-border rounded-xl overflow-hidden",
          // Focus outline suppressed (we handle focus manually)
          "outline-none",
          className
        )}
      >
        {/* ── Custom header override ── */}
        {header && (
          <div className="shrink-0 border-b border-border">
            {header}
            {!hideCloseButton && (
              <CloseButton onClick={onClose} className="absolute top-3.5 right-3.5" />
            )}
          </div>
        )}

        {/* ── Built-in header ── */}
        {hasBuiltInHeader && (
          <div className="shrink-0 flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-border">
            <div className="min-w-0">
              {title && (
                <h2 className="text-base font-bold tracking-tight text-foreground leading-snug">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-[13px] text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {!hideCloseButton && <CloseButton onClick={onClose} />}
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div
          className={cn(
            "flex-1 overflow-y-auto min-h-0 custom-scrollbar",
            // Remove default padding here if using sidebar or noPadding is true
            (noPadding || sidebar) ? "p-0" : "px-5 py-5"
          )}
        >
          {sidebar ? (
            <div className="flex flex-col md:flex-row min-h-full">
              <aside className={cn(
                "md:w-[260px] shrink-0",
                "bg-muted/20 dark:bg-muted/5 border-b md:border-b-0 md:border-r border-border/60 p-5",
                sidebarClassName
              )}>
                {sidebar}
              </aside>
              <main className="flex-1 p-5">
                {children}
              </main>
            </div>
          ) : (
            children
          )}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div className="shrink-0 border-t border-border px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Close button ───────────────────────────────────────── */

function CloseButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className={cn(
        "shrink-0 flex items-center justify-center h-7 w-7 rounded-md",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted transition-colors duration-150",
        className
      )}
    >
      <X className="h-4 w-4" />
    </button>
  );
}

/* ─── Convenience sub-components ────────────────────────── */

/**
 * Pre-styled action row for use inside the `footer` prop.
 * Stacks vertically on mobile, horizontal on sm+.
 */
export function ModalFooterActions({
  children,
  align = "right",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right" | "between";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row gap-2",
        align === "right" && "sm:justify-end",
        align === "left" && "sm:justify-start",
        align === "between" && "sm:justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Thin horizontal divider for use inside modal body.
 */
export function ModalDivider({ className }: { className?: string }) {
  return <hr className={cn("border-border my-4", className)} />;
}