"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LoadingProvider, useLoading } from "@/context/LoadingContext";
import NetworkLoading from "@/components/network/NetworkLoading";
import NetworkSidebar from "@/components/network/Sidebar";
import { AnimatePresence } from "framer-motion";

function NetworkLayoutInner({ children }) {
    const { authReady, user, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [timedOut, setTimedOut] = useState(false);

    const isLoginPage = pathname === "/network/login";

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
                    } catch (_e) {
                        console.error("Error clearing session on timeout:", _e);
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

    const { isPageLoading } = useLoading();

    // Show loading while auth is initializing (but not forever)
    if (!authReady && !timedOut) {
        return <NetworkLoading />;
    }

    return (
        <div className="h-screen bg-[#020617] relative overflow-hidden selection:bg-teal/20 selection:text-teal font-[family-name:var(--font-montserrat)]">
            {/* Cinematic Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Logic Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)] opacity-20" />

                {/* Global Radial Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal/10 blur-[120px] rounded-full opacity-30" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full opacity-30" />
            </div>

            <div className="relative z-10 w-full h-screen overflow-hidden">
                <AnimatePresence>
                    {isPageLoading && <NetworkLoading key="nav-loader" />}
                </AnimatePresence>
                {children}
            </div>
        </div>
    );
}

export default function NetworkLayout({ children }) {
    return (
        <AuthProvider>
            <LoadingProvider>
                <NetworkLayoutInner>{children}</NetworkLayoutInner>
            </LoadingProvider>
        </AuthProvider>
    );
}
