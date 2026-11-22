"use client";

import { useState, useEffect } from "react";
import NetworkSidebar from "@/components/network/Sidebar";
import MyTeamClient from "@/components/network/MyTeamClient";

export default function MyTeamPage() {
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
            <MyTeamClient />
        </div>
    );
}
