"use client";

import { LoadingProvider, useLoading } from "@/context/LoadingContext";
import MathLoading from "@/components/ui/MathLoading";
import { AnimatePresence } from "framer-motion";

export default function CoordinatorLayoutClient({ children, eventInfo, nav }) {
    return (
        <LoadingProvider>
            <CoordinatorLayoutInner eventInfo={eventInfo} nav={nav}>
                {children}
            </CoordinatorLayoutInner>
        </LoadingProvider>
    );
}

function CoordinatorLayoutInner({ children, eventInfo, nav }) {
    const { isPageLoading } = useLoading();

    return (
        <div className="min-h-screen bg-black text-white">
            <AnimatePresence>
                {isPageLoading && <MathLoading key="coord-nav-loader" message="Syncing Hub..." />}
            </AnimatePresence>
            {nav}
            <main className={eventInfo ? "pb-36 md:pb-0 md:pt-0" : ""}>
                {children}
            </main>
        </div>
    );
}
