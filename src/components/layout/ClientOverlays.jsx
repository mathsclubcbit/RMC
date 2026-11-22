"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamically import non-critical UI components to reduce initial bundle
const CustomCursor = dynamic(() => import("@/components/ui/CustomCursor"), {
    ssr: false,
});

const Preloader = dynamic(() => import("@/components/ui/Preloader"), {
    ssr: false,
});

export default function ClientOverlays() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            window.addEventListener("load", () => {
                navigator.serviceWorker
                    .register("/sw.js")
                    .then((registration) => {
                        console.log("SW registered:", registration.scope);
                    })
                    .catch((error) => {
                        console.error("SW registration failed:", error);
                    });
            });
        }
    }, []);

    return (
        <>
            <CustomCursor />
            <Preloader />
        </>
    );
}
