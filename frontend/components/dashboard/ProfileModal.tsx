"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Save,
  Edit3,
  Loader2,
  Lock,
  ShieldCheck,
  Check,
  X,
  KeyRound,
  BadgeCheck,
} from "lucide-react";
import { Modal, ModalFooterActions } from "@/components/common/Modal";
import { FormInput } from "@/components/ui/Forminput";
import { PasswordInput } from "@/components/ui/Passwordinput";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  profile_picture?: string;
}

interface FormData extends UserProfile {
  password: string;
  confirmPassword: string;
}

/* ─── Avatar ─────────────────────────────────────────────── */

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : "??";

  const sizeClass = {
    sm: "h-10 w-10 text-sm rounded-xl",
    md: "h-16 w-16 text-xl rounded-2xl",
    lg: "h-20 w-20 text-2xl rounded-2xl",
  }[size];

  return (
    <span
      className={cn(
        "bg-primary flex items-center justify-center shrink-0",
        "font-bold text-primary-foreground select-none overflow-hidden",
        sizeClass
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={initials} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

/* ─── Read-only field row ────────────────────────────────── */

function FieldRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-border last:border-0">
      <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-secondary text-muted-foreground shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground truncate">
          {value || (
            <span className="text-muted-foreground font-normal italic text-xs">
              Not set
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

/* ─── Section heading ────────────────────────────────────── */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
        {children}
      </p>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    profile_picture: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEditMode(false);
      setSaveSuccess(false);
      setError(null);
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      const p: UserProfile = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        profile_picture: data.profile_picture || "",
      };
      setProfile(p);
      setFormData({ ...p, password: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const payload: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profile_picture: formData.profile_picture,
      };
      if (formData.password) payload.password = formData.password;

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update profile");
      }

      const existingUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...existingUser, ...payload }));
      window.dispatchEvent(new Event("user-updated"));

      const updated: UserProfile = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        profile_picture: formData.profile_picture,
      };
      setProfile(updated);
      setFormData({ ...updated, password: "", confirmPassword: "" });
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ...(profile || { name: "", email: "", phone: "", profile_picture: "" }),
      password: "",
      confirmPassword: "",
    });
    setError(null);
    setEditMode(false);
  };

  const set = (field: keyof FormData, value: string) => {
    setFormData((v) => ({ ...v, [field]: value }));
    if (error) setError(null);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      hideCloseButton
      noPadding
      footer={
        <ModalFooterActions align="right">
          {/* Actions */}
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                  leftIcon={<X className="h-3.5 w-3.5" />}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                  leftIcon={!saving ? <Save className="h-3.5 w-3.5" /> : undefined}
                >
                  Save changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Edit3 className="h-3.5 w-3.5" />}
                  onClick={() => setEditMode(true)}
                >
                  Edit profile
                </Button>
              </>
            )}
          </div>
        </ModalFooterActions>
      }
    >
      {/* ── Loading ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      ) : (
        <div className="flex flex-col">

          {/* ── Hero banner ── */}
          <div className="relative h-28 overflow-hidden">
            {/* Engraving texture background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/60 to-accent/50" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 7px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 40px)",
                backgroundSize: "40px 7px",
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 60% 80% at 100% 100%, oklch(0.840 0.183 78 / 0.25) 0%, transparent 60%)",
              }}
            />
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 h-7 w-7 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ── Avatar row (overlaps hero) ── */}
          <div className="px-6 -mt-10 mb-1 flex items-end justify-between gap-4">
            <div className="relative">
              {editMode ? (
                <div className="rounded-2xl overflow-hidden ring-4 ring-background">
                  <ImageUpload
                    currentImage={formData.profile_picture}
                    onUploadSuccess={(url) => set("profile_picture", url)}
                    disabled={false}
                  />
                </div>
              ) : (
                <div className="ring-4 ring-background rounded-2xl">
                  <Avatar name={profile?.name ?? ""} src={profile?.profile_picture} size="lg" />
                </div>
              )}
              {/* Online dot */}
              <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
            </div>
          </div>

          {/* ── Name + email summary ── */}
          <div className="px-6 mb-5">
            <h3 className="text-lg font-bold tracking-tight text-foreground leading-tight">
              {profile?.name || "—"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{profile?.email}</p>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="mx-6 mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg border-l-4 border-destructive bg-destructive/8">
              <span className="text-destructive mt-0.5 shrink-0">⚠</span>
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* ── Card body ── */}
          <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ── Personal information card ── */}
            <div className="md:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
              {/* Card header stripe */}
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
                <span className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/15 text-primary">
                  <User className="h-3.5 w-3.5" />
                </span>
                <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Personal Information
                </p>
              </div>

              <div className="px-5">
                {!editMode ? (
                  /* View mode */
                  <>
                    <FieldRow
                      icon={<User className="h-3.5 w-3.5" />}
                      label="Full name"
                      value={profile?.name ?? ""}
                    />
                    <FieldRow
                      icon={<Mail className="h-3.5 w-3.5" />}
                      label="Email address"
                      value={profile?.email ?? ""}
                    />
                    <FieldRow
                      icon={<Phone className="h-3.5 w-3.5" />}
                      label="Phone number"
                      value={profile?.phone ?? ""}
                    />
                  </>
                ) : (
                  /* Edit mode */
                  <div className="py-5 flex flex-col gap-5">
                    <FormInput
                      label="Full name"
                      placeholder="Jane Doe"
                      value={formData.name}
                      leftIcon={<User className="h-3.5 w-3.5" />}
                      onChange={(e) => set("name", e.target.value)}
                      autoComplete="name"
                    />
                    <FormInput
                      label="Email address"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      leftIcon={<Mail className="h-3.5 w-3.5" />}
                      onChange={(e) => set("email", e.target.value)}
                      autoComplete="email"
                    />
                    <FormInput
                      label="Phone number"
                      type="tel"
                      placeholder="+1 234 567 8900"
                      value={formData.phone}
                      leftIcon={<Phone className="h-3.5 w-3.5" />}
                      onChange={(e) => set("phone", e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── Security card — only in edit mode ── */}
            {editMode && (
              <div className="md:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
                  <span className="flex items-center justify-center h-6 w-6 rounded-md bg-primary/15 text-primary">
                    <KeyRound className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground">
                    Change Password
                  </p>
                  <span className="ml-auto text-[10px] text-muted-foreground font-medium">
                    Optional — leave blank to keep current
                  </span>
                </div>

                <div className="px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <PasswordInput
                    label="New password"
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    leftIcon={<Lock className="h-3.5 w-3.5" />}
                    onChange={(e) => set("password", e.target.value)}
                    autoComplete="new-password"
                  />
                  <PasswordInput
                    label="Confirm new password"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    leftIcon={<Lock className="h-3.5 w-3.5" />}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            
          </div>
        </div>
      )}
    </Modal>
  );
}