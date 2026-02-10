"use client";

import dynamic from "next/dynamic";

// These components require ssr: false due to WebGL or DOM-heavy logic (framer-motion scroll)
// Moving dynamic imports here allows page.jsx to remain a clean Server Component

export const ChaosBackground = dynamic(() => import("./ChaosBackground"), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[#020617] z-0" />,
});

export const StatsSection = dynamic(() => import("./StatsSection"), {
    ssr: false,
    loading: () => <div className="min-h-[400px] bg-[#020617]" />,
});

export const HeroOverlay = dynamic(() => import("./HeroOverlay"), {
    ssr: false,
});

export const ParallaxGallery = dynamic(() => import("./ParallaxGallery"), {
    ssr: false,
    loading: () => <div className="min-h-[500px] bg-[#020617]" />,
});
