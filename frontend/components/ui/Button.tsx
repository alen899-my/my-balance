"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "bg-primary text-primary-foreground",
    "hover:brightness-110 active:brightness-95",
    "shadow-[0_2px_12px_0_oklch(0.700_0.210_47_/_0.35)]",
    "hover:shadow-[0_4px_20px_0_oklch(0.700_0.210_47_/_0.50)]",
    "border border-transparent",
  ].join(" "),

  secondary: [
    "bg-secondary text-secondary-foreground",
    "hover:bg-secondary/80 active:bg-secondary/60",
    "border border-border",
  ].join(" "),

  outline: [
    "bg-transparent text-primary",
    "border border-primary",
    "hover:bg-primary/8 active:bg-primary/15",
  ].join(" "),

  ghost: [
    "bg-transparent text-foreground",
    "hover:bg-muted active:bg-muted/80",
    "border border-transparent",
  ].join(" "),

  destructive: [
    "bg-destructive text-white",
    "hover:brightness-110 active:brightness-95",
    "border border-transparent",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
  icon: "h-10 w-10 rounded-lg",
};

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          "relative inline-flex items-center justify-center font-medium",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "select-none cursor-pointer",
          // Disabled
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Full width
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {/* Loading overlay */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </span>
        )}

        {/* Content */}
        <span
          className={cn(
            "inline-flex items-center justify-center gap-inherit",
            loading && "opacity-0"
          )}
          style={{ gap: "inherit" }}
        >
          {leftIcon && (
            <span className="shrink-0 flex items-center">{leftIcon}</span>
          )}
          {children && <span>{children}</span>}
          {rightIcon && (
            <span className="shrink-0 flex items-center">{rightIcon}</span>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";