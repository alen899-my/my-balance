"use client";

import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/Authlayout";
import { AuthForm } from "@/components/auth/Authform";
import { useAuthProxy } from "@/hooks/proxy";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SignupPage() {
  const router = useRouter();
  useAuthProxy();

  return (
    <AuthLayout
      brandName="MyBalance"
      tagline="Take control of your money. Track every rupee."
      heading="Create your account"
      subheading="Get started for free — no credit card required."
      imageSide="left"
      imageSrc="/images/auth/signup.jpg"
    >
      <AuthForm
        mode="signup"
        onSubmit={async (values) => {
          const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
               name: values.name,
               email: values.email,
               phone: values.phone,
               password: values.password,
               confirm_password: values.confirmPassword,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.detail || data.message || "Signup failed");
          }

          router.push("/login");
        }}
      />
    </AuthLayout>
  );
}