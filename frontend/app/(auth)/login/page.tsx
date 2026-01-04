"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Added for UI feedback

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/transactions");
      } else {
        alert("Invalid credentials");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition duration-200 ease-in-out";

  return (
    <AuthCard title="Welcome Back">
      <div className="space-y-4">
        <div>
          <label className="sr-only">Email or Phone</label>
          <input
            placeholder="Email or Phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="sr-only">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        disabled={isLoading}
        className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white 
        ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg'} 
        transition duration-150 ease-in-out transform active:scale-[0.98] mt-6`}
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </AuthCard>
  );
}