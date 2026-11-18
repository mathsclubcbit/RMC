"use client";

import { useState, useEffect } from "react";
import LoginClient from "@/components/network/LoginClient";

export default function LoginPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="h-full bg-gray-900" />;
    }

    return (
        <div className="h-full">
            <LoginClient />
        </div>
    );
}
