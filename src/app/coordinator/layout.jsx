import { createAdminClient } from "@/lib/supabase/server";
import CoordinatorNav from "./CoordinatorNav";
import CoordinatorLayoutClient from "./CoordinatorLayoutClient";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// Prevent Next.js from caching this layout's auth state
export const dynamic = 'force-dynamic';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

async function getEventInfo() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('coordinator_token')?.value;
        if (!token) return null;

        const secret = getJwtSecret();
        if (!secret) return null;

        const { payload } = await jwtVerify(token, secret);
        if (payload.type !== 'coordinator' || !payload.eventId) {
            return null;
        }

        // Fetch event title from database
        const admin = createAdminClient();
        const { data: event } = await admin
            .from("events")
            .select("title, payload")
            .eq("id", payload.eventId)
            .single();

        return {
            eventId: payload.eventId,
            eventTitle: event?.title || null,
            eventType: event?.payload?.eventType || null
        };
    } catch {
        return null;
    }
}

export default async function CoordinatorLayout({ children }) {
    const eventInfo = await getEventInfo();

    return (
        <CoordinatorLayoutClient
            eventInfo={eventInfo}
            nav={eventInfo ? <CoordinatorNav eventTitle={eventInfo.eventTitle} eventType={eventInfo.eventType} /> : null}
        >
            {children}
        </CoordinatorLayoutClient>
    );
}
