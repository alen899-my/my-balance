"use client";

import React, { useRef, useState } from "react";
import { Camera, Loader2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface ImageUploadProps {
  currentImage?: string;
  onUploadSuccess: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ currentImage, onUploadSuccess, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate type (Quick client-side check)
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, etc).");
      return;
    }

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large. Max size is 5MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      onUploadSuccess(data.url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const displayImage = currentImage 
    ? (currentImage.startsWith("http") || currentImage.startsWith("https") || currentImage.startsWith("data:") 
        ? currentImage 
        : `${API_BASE_URL}${currentImage}`)
    : null;

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />
      <div 
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        className={cn(
          "group relative flex items-center justify-center h-20 w-20 rounded-2xl border-2 border-dashed overflow-hidden transition-all",
          !disabled && !uploading && "cursor-pointer hover:border-primary/50 hover:bg-muted/50 border-border",
          (disabled || uploading) && "opacity-60 cursor-not-allowed border-border/50",
          !currentImage && !uploading && "bg-muted/30"
        )}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt="Profile Preview"
            className="h-full w-full object-cover"
          />
        ) : !uploading ? (
          <div className="flex flex-col items-center gap-1">
            <UploadCloud className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">Upload</span>
          </div>
        ) : null}

        {/* Hover overlay */}
        {displayImage && !disabled && !uploading && (
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
           </div>
        )}

        {/* Loading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-destructive font-semibold tracking-wide border-l-2 border-destructive pl-2 animate-in fade-in slide-in-from-left-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
