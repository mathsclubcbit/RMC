import { Suspense } from "react";
import HeroOverlay from "@/components/home/HeroOverlay";
import AnnouncementsWidgetClient from "@/components/home/AnnouncementsWidgetClient";
import HomeEventsSectionClient from "@/components/home/HomeEventsSectionClient";
import { getAnnouncements } from "@/lib/google";
import { getCachedEvents } from "@/lib/supabase/server";

import { ChaosBackground, StatsSection, ParallaxGallery } from "@/components/home/HomeSections";

// [STRATEGY] Incremental Static Regeneration (ISR)
// Revalidate the page every 60 seconds on the edge
export const revalidate = 60;

// [STREAMING] Components to handle their own data fetching to prevent blocking LCP
async function AnnouncementsFeed() {
    const data = await getAnnouncements(process.env.GOOGLE_SHEET_ID || '').catch(() => []);
    return <AnnouncementsWidgetClient initialData={data} />;
}

async function EventsFeed() {
    const data = await getCachedEvents().catch(() => []);
    return <HomeEventsSectionClient initialEvents={data} />;
}

export default async function Home() {
    return (
        <div className="relative overflow-x-hidden min-h-screen bg-[#020617] selection:bg-teal/30 selection:text-teal">
            {/* MathBackground already rendered in ConditionalShell layout wrapper */}

            {/* Non-blocking data fetching with Suspense */}
            <Suspense>
                <AnnouncementsFeed />
            </Suspense>

            {/* Hero Section - CRITICAL Path (LCP) */}
            {/* These render immediately without waiting for the data above */}
            <section className="relative w-full min-h-[50vh] md:min-h-[70vh] overflow-hidden bg-transparent" style={{ touchAction: 'pan-y' }}>
                <HeroOverlay />
                <ChaosBackground />
            </section>

            {/* Live Data Module (Stats) */}
            <StatsSection />

            {/* Featured Events - Streams in later */}
            <div className="relative">
                <Suspense fallback={<div className="min-h-[400px] animate-pulse bg-white/5 mx-8 rounded-3xl" />}>
                    <EventsFeed />
                </Suspense>
            </div>

            {/* Gallery - Visual Proof */}
            <div className="relative pb-12">
                <ParallaxGallery />
            </div>
        </div>
    );
}

