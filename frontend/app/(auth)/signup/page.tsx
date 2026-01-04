"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";

export default function Signup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // Added for UI feedback

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });

  function update(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
async function handleSignup() {
    // ... existing validation checks ...

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        alert("Signup successful");
        router.push("/login");
      } else {
        const err = await res.json();
        
        // 🛠️ FIX: Check if 'detail' is an Array (Pydantic) or String (Manual)
        if (Array.isArray(err.detail)) {
            // It's a Pydantic validation error (422)
            alert(err.detail[0].msg); // Show the first validation error
        } else {
            // It's a manual HTTPException (400)
            alert(err.detail || "Signup failed");
        }
      }
    } catch (error) {
       alert("Something went wrong. Check console.");
       console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  // Shared input style
  const inputClass = "appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition duration-200 ease-in-out";

  return (
    <AuthCard title="Create Account">
      <div className="space-y-4">
        <input 
          name="name" 
          placeholder="Full Name" 
          onChange={update} 
          className={inputClass}
        />
        <input 
          name="email" 
          placeholder="Email Address" 
          onChange={update} 
          className={inputClass}
        />
        <input 
          name="phone" 
          placeholder="Phone Number" 
          onChange={update} 
          className={inputClass}
        />
        <input 
          type="password" 
          name="password" 
          placeholder="Password" 
          onChange={update} 
          className={inputClass}
        />
        <input 
          type="password" 
          name="confirm_password" 
          placeholder="Confirm Password" 
          onChange={update} 
          className={inputClass}
        />
      </div>

      <button
        onClick={handleSignup}
        disabled={isLoading}
        className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white 
        ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg'} 
        transition duration-150 ease-in-out transform active:scale-[0.98] mt-6`}
      >
        {isLoading ? "Signing up..." : "Sign Up"}
      </button>
    </AuthCard>
  );
}