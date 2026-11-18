import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import QuizLeaderboardClient from "./QuizLeaderboardClient";

export const dynamic = "force-dynamic";

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

export default async function QuizLeaderboardPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("coordinator_token")?.value;
    let eventId = null;

    if (token) {
        try {
            const secret = getJwtSecret();
            if (secret) {
                const { payload } = await jwtVerify(token, secret);
                eventId = payload.eventId;
            }
        } catch {}
    }

    if (!eventId) {
        return <div className="min-h-screen bg-black text-white flex items-center justify-center">Unauthorized</div>;
    }

    return <QuizLeaderboardClient eventId={eventId} />;
}
