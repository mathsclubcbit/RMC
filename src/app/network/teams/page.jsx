"use client";

import { useState, useEffect } from "react";
import NetworkSidebar from "@/components/network/Sidebar";
import TeamsClient from "@/components/network/TeamsClient";

export default function TeamsPage() {
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
            <TeamsClient />
        </div>
    );
}
