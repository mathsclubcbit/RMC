"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MathBackground from "@/components/ui/MathBackground";
import SmoothScroll from "@/components/ui/SmoothScroll";

export default function ConditionalShell({ children }) {
    const pathname = usePathname();

    // Check if we're in the network section
    const isNetworkRoute = pathname?.startsWith("/network");

    // For network routes, render without header/footer/smooth scroll
    if (isNetworkRoute) {
        return (
            <>
                {/* Math background disabled for network pages for performance */}
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
            <Footer />
        </SmoothScroll>
    );
}

