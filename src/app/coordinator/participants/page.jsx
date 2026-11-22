import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/server";
import ParticipantsClient from "./ParticipantsClient";

export const dynamic = 'force-dynamic';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

async function verifyCoordinatorToken() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('coordinator_token')?.value;
        if (!token) return null;

        const secret = getJwtSecret();
        if (!secret) return null;

        const { payload } = await jwtVerify(token, secret);
        if (payload.type === 'coordinator' && payload.eventId) {
            return payload;
        }
        return null;
    } catch {
        return null;
    }
}

export default async function ParticipantsPage() {
    const coordinator = await verifyCoordinatorToken();
    if (!coordinator) {
        redirect("/coordinator/login");
    }

    const eventId = coordinator.eventId;
    const admin = createAdminClient();

    // Fetch Event details (Server-side metadata is fast)
    const { data: event, error: eventError } = await admin
        .from("events")
        .select("title, id")
        .eq("id", eventId)
        .single();

    if (eventError || !event) {
        redirect("/coordinator/dashboard");
    }

    // Heavy participant fetching is moved to Client-side SWR
    return (
        <div className="min-h-screen bg-black text-white px-4 py-8">
            <div className="max-w-7xl mx-auto">
                <ParticipantsClient event={event} />
            </div>
        </div>
    );
}
