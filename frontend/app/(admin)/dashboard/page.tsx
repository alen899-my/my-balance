"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (err) {
        console.error("Failed to parse user data", err);
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen p-8 bg-background flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-card text-card-foreground p-8 rounded-xl shadow border border-border text-center">
        <h1 className="text-2xl font-bold mb-2">Welcome to your Dashboard</h1>
        {user ? (
          <p className="text-muted-foreground mb-6">Signed in as {user.name} ({user.email})</p>
        ) : (
          <p className="text-muted-foreground mb-6">Loading your profile...</p>
        )}
        <Button onClick={handleLogout} variant="outline" className="w-full">
          Log out
        </Button>
      </div>
    </div>
  );
}
