"use client";

import Link from "next/link";
import dynamic from "next/dynamic"; // [OPTIMIZATION]
import LenisScroll from "@/components/ui/LenisScroll";
import AnnouncementsWidget from "@/components/home/AnnouncementsWidget";
import MathBackground from "@/components/ui/MathBackground";
import StatsSection from "@/components/home/StatsSection";
import HomeEventsSection from "@/components/home/HomeEventsSection";
import ParallaxGallery from "@/components/home/ParallaxGallery";

// [OPTIMIZATION] Defer heavy 3D scene
const ChaosHero = dynamic(() => import("@/components/home/ChaosHero"), {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-[#020617]" />
});

export default function Home() {
    return (
        <div className="relative overflow-x-hidden min-h-screen bg-[#020617] selection:bg-teal/30 selection:text-teal">
            <MathBackground />
            <LenisScroll />
            <AnnouncementsWidget /> {/* [NEW WIDGET] */}

            {/* Background Layer - Moved to Layout */}

            {/* Hero Section - The Chaos System */}
            <ChaosHero />



            {/* Live Data Module (Stats) */}
            <StatsSection />

            {/* Featured Events - Carousel */}
            <div className="relative">
                <HomeEventsSection />
            </div>

            {/* Gallery - Visual Proof */}
            <div className="relative pb-24">
                <ParallaxGallery />
            </div>
        </div>
    );
}
