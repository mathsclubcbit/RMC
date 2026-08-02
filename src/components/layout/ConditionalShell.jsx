"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";
import MathBackground from "@/components/ui/MathBackground";
import SmoothScroll from "@/components/ui/SmoothScroll";

export default function ConditionalShell({ children }) {
    const pathname = usePathname();

    // Check if we're in specific specialized sections
    const isNetworkRoute = pathname?.startsWith("/network");
    const isCoordinatorRoute = pathname?.startsWith("/coordinator");
    const isAdminRoute = pathname?.startsWith("/admin");
    const isPlacementSeriesRoute = pathname?.startsWith("/placement-series");
    const isSpecialRoute = isNetworkRoute || isCoordinatorRoute || isAdminRoute || isPlacementSeriesRoute;

    // For these routes, render without public header/footer/smooth scroll
    if (isSpecialRoute) {
        return (
            <>
                {/* Math background disabled for performance and clean UI */}
                {/* <MathBackground /> */}
                <div className="fixed inset-0 pointer-events-none z-0 bg-[url('/noise.png')] opacity-[0.15] mix-blend-overlay" />
                <main className="flex-1 w-full overflow-x-hidden relative z-10">
                    {children}
                </main>
            </>
        );
    }

    // For all other routes, render with full shell
    return (
        <SmoothScroll>
            {/* Global Chaos Background - Site only */}
            <MathBackground />
            <div className="fixed inset-0 pointer-events-none z-0 bg-[url('/noise.png')] opacity-[0.15] mix-blend-overlay" />

            <Header />
            <main className="flex-1 w-full overflow-x-hidden relative z-10">
                {children}
            </main>
            <SiteFooter />
        </SmoothScroll>
    );
}
