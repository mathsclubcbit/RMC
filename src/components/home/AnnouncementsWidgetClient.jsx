"use client";

import dynamic from "next/dynamic";

const AnnouncementsWidget = dynamic(() => import("./AnnouncementsWidget"), {
    ssr: false,
});

export default function AnnouncementsWidgetClient({ initialData = [] }) {
    return <AnnouncementsWidget initialData={initialData} />;
}
