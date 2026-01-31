import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify } from "jose";
import { getSecret } from "@/lib/jwt";
import CoordinatorScanClient from "./CoordinatorScanClient";
import { unstable_noStore as noStore } from 'next/cache';

async function isCoordinatorAuthenticated() {
    const cookieStore = await cookies();
    const token = cookieStore.get("coordinator_token")?.value;
    if (!token) return false;
    try {
        const { payload } = await jwtVerify(token, getSecret());
        return payload?.type === 'coordinator' && !!payload?.eventId;
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
