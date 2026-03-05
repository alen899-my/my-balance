"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2, Save, Edit3 } from "lucide-react";
import { authFetch } from "@/lib/authFetch";

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialName: string;
    initialEmail: string;
    initialPhone: string;
    initialAvatar: string | null;
    onSaved: (newName: string, newEmail: string, newPhone: string, newAvatar: string | null) => void;
}

export default function ProfileSettingsModal({ isOpen, onClose, initialName, initialEmail, initialPhone, initialAvatar, onSaved }: ProfileSettingsModalProps) {
    const [name, setName] = useState(initialName);
    const [email, setEmail] = useState(initialEmail);
    const [phone, setPhone] = useState(initialPhone);
    const [avatar, setAvatar] = useState<string | null>(initialAvatar);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatar);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setEmail(initialEmail);
            setPhone(initialPhone);
            setAvatar(initialAvatar);
            setPreviewUrl(initialAvatar);
            setIsEditing(false);
            setErrorMsg(null);
        }
    }, [isOpen, initialName, initialEmail, initialPhone, initialAvatar]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleSave = async (e: React.FormEvent | React.MouseEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalAvatarUrl = avatar;

            // 1. Upload to Vercel Blob if a new file is selected
            if (selectedFile) {
                const res = await fetch(`/api/upload?filename=${encodeURIComponent(selectedFile.name)}`, {
                    method: "POST",
                    body: selectedFile,
                });

                if (!res.ok) {
                    const errRes = await res.json();
                    throw new Error(errRes.error || "Image upload failed");
                }
                const blobData = await res.json();
                finalAvatarUrl = blobData.url;
                setAvatar(finalAvatarUrl);
            }

            // 2. Save profile data to Python Backend via authFetch
            const profileRes = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    phone: phone,
                    profile_picture: finalAvatarUrl
                })
            });

            if (!profileRes.ok) {
                const errData = await profileRes.json();
                throw new Error(errData.detail || "Profile save failed");
            }

            onSaved(name, email, phone, finalAvatarUrl);
            setIsEditing(false);
            onClose();
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Failed to save profile.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
            <div className="gov-panel" style={{ width: "100%", maxWidth: "420px", padding: "24px", position: "relative" }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ margin: 0, fontSize: "18px" }}>Profile Settings</h2>
                    <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                    {/* Avatar Section */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                        <div
                            style={{
                                position: "relative", width: "80px", height: "80px", borderRadius: "50%",
                                background: "var(--brand-light)", display: "flex", alignItems: "center",
                                justifyContent: "center", overflow: "hidden",
                                cursor: isEditing ? "pointer" : "default", border: "2px solid var(--border-default)"
                            }}
                            onClick={() => isEditing && fileInputRef.current?.click()}
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                                <Camera size={24} style={{ color: "var(--brand)" }} />
                            )}

                            {isEditing && (
                                <div style={{ position: "absolute", bottom: 0, width: "100%", height: "30%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    <Camera size={12} color="white" />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        {isEditing && (
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                                Click photo to {previewUrl ? "change" : "upload"}
                            </span>
                        )}
                    </div>

                    {errorMsg && (
                        <div style={{ padding: "10px", background: "var(--danger-bg)", color: "var(--danger)", fontSize: "12px", borderRadius: "6px", textAlign: "center", border: "1px solid var(--danger)" }}>
                            {errorMsg}
                        </div>
                    )}

                    {/* Form Fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Full Name</label>
                            <input
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="gov-input"
                                style={{ width: "100%" }}
                                placeholder="e.g. Rahul Sharma"
                                disabled={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Email Address</label>
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="gov-input"
                                style={{ width: "100%" }}
                                placeholder="name@example.com"
                                disabled={!isEditing}
                            />
                        </div>
                        <div>
                            <label className="section-label" style={{ marginBottom: "6px", display: "block" }}>Phone Number</label>
                            <input
                                required
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="gov-input"
                                style={{ width: "100%" }}
                                placeholder="+1 (555) 000-0000"
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
                        {!isEditing ? (
                            <>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }} className="gov-btn-secondary">
                                    Close
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(true); }} className="gov-btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <Edit3 size={14} />
                                    Edit Profile
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(false); setErrorMsg(null); }} className="gov-btn-secondary" disabled={isSaving}>
                                    Cancel
                                </button>
                                <button type="button" onClick={handleSave} className="gov-btn-primary" disabled={isSaving} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </>
                        )}
                    </div>

                </form>
            </div>
        </div>
    );
}
