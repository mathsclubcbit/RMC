"use client";

import dynamic from "next/dynamic";

const HomeEventsSection = dynamic(() => import("./HomeEventsSection"), {
    ssr: false,
});

export default function HomeEventsSectionClient({ initialEvents = [] }) {
    return <HomeEventsSection initialEvents={initialEvents} />;
}
