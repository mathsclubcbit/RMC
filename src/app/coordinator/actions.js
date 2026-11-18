import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function getCoordinatorEventId() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('coordinator_token')?.value;
        if (!token) return null;

        const rawSecret = process.env.JWT_SECRET;
        if (!rawSecret) return null;
        
        const secret = new TextEncoder().encode(rawSecret);
        const { payload } = await jwtVerify(token, secret);
        
        if (payload.type === 'coordinator' && payload.eventId) {
            return payload.eventId;
        }
        return null;
    } catch {
        return null;
    }
}
