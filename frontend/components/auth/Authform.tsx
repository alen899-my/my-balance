"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, User, Lock, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui";
import { FormInput } from "@/components/ui/Forminput";
import { PasswordInput } from "@/components/ui/Passwordinput";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────── */

export type AuthMode = "login" | "signup";

export interface AuthFormValues {
  name?: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthFormErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
}

export interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (values: AuthFormValues) => Promise<void> | void;
  defaultValues?: Partial<AuthFormValues>;
  submitLabel?: string;
  showGoogle?: boolean;
  onGoogleClick?: () => void;
  className?: string;
}

/* ─── Validators ─────────────────────────────────────────── */

function validate(values: AuthFormValues, mode: AuthMode): AuthFormErrors {
  const errors: AuthFormErrors = {};
  const isSignup = mode === "signup";

  if (isSignup && !values.name?.trim()) errors.name = "Full name is required.";
  if (isSignup && !values.phone?.trim()) errors.phone = "Phone number is required.";

  if (!values.email.trim()) {
    errors.email = isSignup ? "Email address is required." : "Email or phone is required.";
  } else if (isSignup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (isSignup && values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (isSignup) {
    if (!values.confirmPassword) errors.confirmPassword = "Please confirm your password.";
    else if (values.password !== values.confirmPassword) errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

/* ─── Google Icon ────────────────────────────────────────── */

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ─── AuthForm ───────────────────────────────────────────── */

export function AuthForm({
  mode,
  onSubmit,
  defaultValues = {},
  submitLabel,
  showGoogle = true,
  onGoogleClick,
  className,
}: AuthFormProps) {
  const isSignup = mode === "signup";

  const [values, setValues] = useState<AuthFormValues>({
    name: defaultValues.name ?? "",
    email: defaultValues.email ?? "",
    phone: defaultValues.phone ?? "",
    password: defaultValues.password ?? "",
    confirmPassword: defaultValues.confirmPassword ?? "",
  });

  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [loading, setLoading] = useState(false);

  function set(field: keyof AuthFormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(values, mode);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await onSubmit(values);
    } catch (err: unknown) {
      setErrors({ form: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const label = submitLabel ?? (isSignup ? "Create account" : "Sign in");

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("flex flex-col w-full gap-5", className)}
    >
      {/* Form-level error */}
      {errors.form && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border-l-4 border-destructive bg-destructive/8 px-4 py-3 text-sm text-destructive"
        >
          <span className="mt-px shrink-0">⚠</span>
          <span>{errors.form}</span>
        </div>
      )}

      {/* Name + Phone — signup only */}
      {isSignup && (
        <>
          <FormInput
            label="Full name"
            placeholder="Jane Doe"
            autoComplete="name"
            leftIcon={<User className="h-3.5 w-3.5" />}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            error={errors.name}
            required
          />
          <FormInput
            label="Phone number"
            type="tel"
            placeholder="+1 234 567 8900"
            autoComplete="tel"
            leftIcon={<Phone className="h-3.5 w-3.5" />}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            error={errors.phone}
            required
          />
        </>
      )}

      {/* Email / identifier */}
      <FormInput
        label={isSignup ? "Email address" : "Email or phone"}
        type={isSignup ? "email" : "text"}
        placeholder={isSignup ? "you@company.com" : "Email or phone number"}
        autoComplete={isSignup ? "email" : "username"}
        leftIcon={isSignup ? <Mail className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
        value={values.email}
        onChange={(e) => set("email", e.target.value)}
        error={errors.email}
        required
      />

      {/* Password */}
      <PasswordInput
        label="Password"
        placeholder={isSignup ? "Min. 8 characters" : "Enter your password"}
        autoComplete={isSignup ? "new-password" : "current-password"}
        leftIcon={<Lock className="h-3.5 w-3.5" />}
        value={values.password}
        onChange={(e) => set("password", e.target.value)}
        error={errors.password}
        required
      />

      {/* Confirm password — signup only */}
      {isSignup && (
        <PasswordInput
          label="Confirm password"
          placeholder="Repeat password"
          autoComplete="new-password"
          leftIcon={<Lock className="h-3.5 w-3.5" />}
          value={values.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          error={errors.confirmPassword}
          required
        />
      )}

      {/* Forgot password — login only */}
      {!isSignup && (
        <div className="flex justify-end -mt-2">
          <Link
            href="/forgot-password"
            className="text-[11px] font-medium text-primary hover:underline underline-offset-2 tracking-wide"
          >
            Forgot password?
          </Link>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={loading}
        rightIcon={!loading && <ArrowRight className="h-4 w-4" />}
        className="mt-2"
      >
        {label}
      </Button>

      {/* Google SSO */}
      {showGoogle && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">or</span>
            <span className="flex-1 h-px bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            leftIcon={<GoogleIcon />}
            onClick={onGoogleClick}
          >
            Continue with Google
          </Button>
        </div>
      )}

      {/* Mode switch */}
      <p className="text-center text-[12px] text-muted-foreground">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline underline-offset-2">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline underline-offset-2">
              Create one
            </Link>
          </>
        )}
      </p>
    </form>
  );
}