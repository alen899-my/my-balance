import "./globals.css";
import { Inter } from "next/font/google";
import DashboardLayoutClient from "./DashboardLayoutClient";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {/* No DashboardLayoutClient here! */}
        {children} 
      </body>
    </html>
  );
}