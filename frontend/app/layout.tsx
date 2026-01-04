import "./globals.css";
import { Inter } from "next/font/google";
import DashboardLayoutClient from "./DashboardLayoutClient";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <DashboardLayoutClient>
          {children}
        </DashboardLayoutClient>
      </body>
    </html>
  );
}