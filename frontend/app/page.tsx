"use client";

import React from 'react';
import { useAuthProxy } from "@/hooks/proxy";
import Link from 'next/link';

const Page = () => {
  useAuthProxy();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to BankApplication</h1>
      <p className="text-xl mb-8 text-muted-foreground">The most secure way to manage your finances.</p>
      <div className="flex gap-4">
        <Link 
          href="/login" 
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
        >
          Login
        </Link>
        <Link 
          href="/signup" 
          className="px-6 py-2 border border-input bg-background rounded-md hover:bg-accent transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}

export default Page;