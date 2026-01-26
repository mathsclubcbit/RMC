"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function NetworkLayoutInner({ children }) {
    const { loading, user, profile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [timedOut, setTimedOut] = useState(false);

    // Timeout fallback - if loading takes more than 5 seconds, stop waiting
    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) {
                console.warn("Auth loading timed out");
                setTimedOut(true);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [loading]);

    // Redirect if not logged in (except for login page)
    useEffect(() => {
        if ((timedOut || !loading) && !user && pathname !== "/network/login") {
            router.push("/network/login");
        }
    }, [timedOut, loading, user, pathname, router]);

    // Show loading only if still loading and not timed out
    if (loading && !timedOut) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-teal/30 border-t-teal rounded-full animate-spin" />
                    <p className="text-white/50 text-sm font-mono">Loading Network...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617]">
            {children}
        </div>
    );
}

export default function NetworkLayout({ children }) {
    return (
        <AuthProvider>
            <NetworkLayoutInner>{children}</NetworkLayoutInner>
        </AuthProvider>
    );
}

