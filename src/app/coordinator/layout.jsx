import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/server";
import CoordinatorNav from "./CoordinatorNav";

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-replace-in-production');

async function getEventInfo() {
    const cookieStore = await cookies();
    const token = cookieStore.get("coordinator_token")?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
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

    // Don't show nav on login page
    const isLoginPage = false; // We can't check pathname in server component, so nav will handle this

    return (
        <div className="min-h-screen bg-black text-white">
            {eventInfo && (
                <CoordinatorNav eventTitle={eventInfo.eventTitle} />
            )}
            <main className={eventInfo ? "pb-24 md:pb-0 md:pt-0" : ""}>
                {children}
            </main>
        </div>
    );
}
