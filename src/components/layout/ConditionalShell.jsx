"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MathBackground from "@/components/ui/MathBackground";
import SmoothScroll from "@/components/ui/SmoothScroll";

export default function ConditionalShell({ children }) {
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
