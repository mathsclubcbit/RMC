"use client";

import dynamic from "next/dynamic";

// Dynamically import non-critical UI components to reduce initial bundle
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
    ssr: false,
});

const Preloader = dynamic(() => import("@/components/ui/Preloader"), {
    ssr: false,
});

export default function ClientOverlays() {
    return (
        <>
            <CustomCursor />
            <Preloader />
        </>
    );
}
