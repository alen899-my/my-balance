"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const useAuthProxy = () => {
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);
};
