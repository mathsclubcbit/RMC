"use client";

import { useState, useEffect } from "react";
import NetworkSidebar from "@/components/network/Sidebar";
import CalendarClient from "@/components/network/CalendarClient";

export default function CalendarPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="flex h-full bg-gray-900" />;
    }

    return (
        <div className="flex h-full">
            <NetworkSidebar />
            <CalendarClient />
        </div>
    );
}
