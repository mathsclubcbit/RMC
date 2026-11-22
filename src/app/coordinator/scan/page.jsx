import { redirect } from "next/navigation";
import CoordinatorScanClient from "./CoordinatorScanClient";
import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

async function isCoordinatorAuthenticated() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('coordinator_token')?.value;
        if (!token) return false;
        
        const secret = getJwtSecret();
        if (!secret) return false;
        
        const { payload } = await jwtVerify(token, secret);
        return payload.type === 'coordinator' && !!payload.eventId;
    } catch {
        return false;
    }
}

export const metadata = {
    title: "Coordinator - Scan QR",
};

// Prevent Vercel from caching this page's auth state
export const dynamic = 'force-dynamic';

export default async function CoordinatorScanPage() {
    noStore(); // Completely disable caching for auth
    if (!(await isCoordinatorAuthenticated())) {
        redirect("/coordinator/login");
    }

    return <CoordinatorScanClient />;
}
