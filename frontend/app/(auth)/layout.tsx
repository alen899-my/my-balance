import "../globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter", // This line fixes the "variable does not exist" error
});

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // inter.variable now exists as a valid property
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 ${inter.variable} font-sans`}>
            {children}
        </div>
    );
}