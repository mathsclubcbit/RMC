import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/server";
import { getSecret } from "@/lib/jwt";
import CoordinatorNav from "./CoordinatorNav";
import CoordinatorLayoutClient from "./CoordinatorLayoutClient";

async function getEventInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get("coordinator_token")?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        if (payload?.type !== 'coordinator' || !payload?.eventId) {
            return null;
        }

        // Fetch event title
        const supabase = createAdminClient();
        const { data: event } = await supabase
            .from("events")
            .select("title")
            .eq("id", payload.eventId)
            .single();

        return {
            eventId: payload.eventId,
            eventTitle: event?.title || null
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
            nav={eventInfo ? <CoordinatorNav eventTitle={eventInfo.eventTitle} /> : null}
        >
            {children}
        </CoordinatorLayoutClient>
    );
}
