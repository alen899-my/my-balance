"use client";

import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/Authlayout";
import { AuthForm } from "@/components/auth/Authform";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthLayout
      brandName="YourApp"
      tagline="Everything your team needs — in one place."
      heading="Welcome back"
      subheading="Sign in to your account to continue."
      imageSrc="/images/auth/login.jpg"
    >
      <AuthForm
        mode="login"
        showGoogle
        onSubmit={async (values) => {
          const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: values.email,
              password: values.password,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || data.message || "Login failed");
          }

          localStorage.setItem("token", data.token);
          if (data.user) {
             localStorage.setItem("user", JSON.stringify(data.user));
          }

          router.push("/dashboard");
        }}
        onGoogleClick={() => {
          // TODO: signIn("google")
        }}
      />
    </AuthLayout>
  );
}