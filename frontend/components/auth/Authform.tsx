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

/* ─── AuthForm ───────────────────────────────────────────── */

export function AuthForm({
  mode,
  onSubmit,
  defaultValues = {},
  submitLabel,
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