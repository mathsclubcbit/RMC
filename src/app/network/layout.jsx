"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function NetworkLayoutInner({ children }) {
    const { loading, authReady, user, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [timedOut, setTimedOut] = useState(false);

    // Timeout fallback - if auth doesn't resolve in 8 seconds, redirect to login
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!authReady) {
                console.warn("Auth loading timed out, redirecting to login");
                setTimedOut(true);
            }
        }, 20000); // 20 second timeout

        return () => clearTimeout(timer);
    }, [authReady]);

    // Handle authentication redirects
    useEffect(() => {
        const handleRedirects = async () => {
            // Case 1: Timeout occurred - Force sign out and redirect to login
            if (timedOut) {
                if (pathname !== "/network/login") {
                    console.warn("Auth timeout - forcing sign out and redirect");
                    try {
                        await signOut();
                    } catch (e) {
                        console.error("Error clearing session on timeout:", e);
                    }
                    router.replace("/network/login");
                }
                return;
            }

            // Case 2: Auth is still loading -> Wait
            if (!authReady) return;

            const isLoginPage = pathname === "/network/login";

            // Case 3: Not logged in -> Redirect to login
            if (!user && !isLoginPage) {
                // User is already logged out (null), so just redirect.
                router.replace("/network/login");
            }

            // Case 4: Logged in and on login page -> Redirect to dashboard
            if (user && isLoginPage) {
                router.replace("/network/dashboard");
            }
        };

        handleRedirects();
    }, [authReady, timedOut, user, pathname, router, signOut]);

    // Show loading while auth is initializing (but not forever)
    if (!authReady && !timedOut) {
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
