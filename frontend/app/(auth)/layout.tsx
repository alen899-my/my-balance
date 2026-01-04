import "../globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
    subsets: ["latin"],
});

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 ${inter.variable}`}>
            {children}
        </div>
    );
}