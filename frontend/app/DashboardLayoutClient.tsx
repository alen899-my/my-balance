"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default function DashboardLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    // Sidebar closed by default — hamburger opens/closes on all screen sizes
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-page)" }}>

            {/* Sidebar — always fixed overlay, never shifts content */}
            <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main content — never shifts, sidebar overlays on top */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    width: "100%",
                }}
            >
                <Header onMenuClick={() => setIsSidebarOpen((prev) => !prev)} />
                <main style={{ flex: 1, padding: "24px 24px 40px", overflowX: "hidden" }}>
                    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}