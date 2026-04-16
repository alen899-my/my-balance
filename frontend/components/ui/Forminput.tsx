"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

export type InputSize = "sm" | "md" | "lg";

export interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  inputSlot?: React.ReactNode;
  containerClassName?: string;
}

const sizeMap: Record<InputSize, { input: string; label: string }> = {
  sm: { input: "h-8 text-xs", label: "text-xs mb-0.5" },
  md: { input: "h-10 text-sm", label: "text-sm mb-1" },
  lg: { input: "h-12 text-base", label: "text-sm mb-1" },
};

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      hint,
      error,
      size = "md",
      leftIcon,
      rightElement,
      inputSlot,
      id: idProp,
      className,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const id = idProp ?? autoId;
    const s = sizeMap[size];
    const hasError = Boolean(error);

    return (
      <div className={cn("flex flex-col w-full group", containerClassName)}>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "font-medium tracking-wide uppercase text-[10px] text-muted-foreground transition-colors duration-150",
              "group-focus-within:text-primary",
              hasError && "text-destructive group-focus-within:text-destructive",
              s.label,
              disabled && "opacity-40"
            )}
          >
            {label}
            {props.required && (
              <span className="ml-0.5 text-primary" aria-hidden="true">*</span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className={cn(
                "absolute left-0 flex items-center justify-center text-muted-foreground pointer-events-none shrink-0 transition-colors duration-150",
                "group-focus-within:text-primary",
                hasError && "text-destructive",
                "w-5 h-full"
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          {inputSlot ? (
            <div className="w-full">{inputSlot}</div>
          ) : (
            <input
              ref={ref}
              id={id}
              disabled={disabled}
              aria-invalid={hasError}
              aria-describedby={
                error ? `${id}-error` : hint ? `${id}-hint` : undefined
              }
              className={cn(
                // Underline-only style
                "w-full bg-transparent text-foreground outline-none",
                "border-b-2 transition-colors duration-200",
                "placeholder:text-muted-foreground/50",
                "py-2",
                // Left icon offset
                leftIcon ? "pl-7" : "pl-0",
                rightElement ? "pr-7" : "pr-0",
                // Default state
                !hasError && [
                  "border-border",
                  "focus:border-primary",
                ],
                // Error state
                hasError && "border-destructive focus:border-destructive",
                // Disabled
                "disabled:opacity-40 disabled:cursor-not-allowed",
                s.input,
                className
              )}
              {...props}
            />
          )}

          {rightElement && (
            <span className="absolute right-0 flex items-center justify-center shrink-0 w-6 h-full">
              {rightElement}
            </span>
          )}
        </div>

        {/* Animated underline accent */}
        <div
          className={cn(
            "h-px w-0 bg-primary transition-all duration-300 -mt-px",
            "group-focus-within:w-full",
            hasError && "bg-destructive"
          )}
        />

        {hasError && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-1.5 text-[11px] text-destructive font-medium tracking-wide"
          >
            {error}
          </p>
        )}

        {!hasError && hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[11px] text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";