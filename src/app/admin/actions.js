"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRegistrationById, markRegistrationAttendance, markRegistrationCheckedIn } from "@/lib/google";
import { signToken, verifyToken } from "@/lib/jwt";

const getAdminCredentials = () => {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    return { username, password };
};

export async function adminLoginAction(prevState, formData) {
    const { username: expectedUser, password: expectedPass } = getAdminCredentials();

    const username = String(formData.get("username") || "");
    const password = String(formData.get("password") || "");

    if (username === expectedUser && password === expectedPass) {
        // Sign JWT token
        const token = await signToken({ type: 'admin', role: 'admin' }, '24h');

        const cookieStore = await cookies();
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
            sameSite: "lax",
        });

        redirect("/admin");
    }

    return { error: "Invalid credentials" };
}

export async function adminLogoutAction() {
    (await cookies()).delete("admin_token");
    redirect("/admin/login");
}

// Helper to verify admin session
export async function isAdminAuthenticated() {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;

    const payload = await verifyToken(token);
    return payload?.type === 'admin';
}

export async function markCheckedInAction(formData) {
    if (!(await isAdminAuthenticated())) {
        return { error: "Unauthorized" };
    }

    const registrationId = String(formData.get("registrationId") || "").trim();
    if (!registrationId) {
        return { error: "Missing registrationId" };
    }

    if (!/^\d{6}$/.test(registrationId)) {
        return { error: "Invalid ticket code" };
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
        return { error: "Server misconfiguration: missing GOOGLE_SHEET_ID" };
    }

    const existing = await getRegistrationById(spreadsheetId, registrationId);
    if (!existing) {
        return { error: "Ticket not found" };
    }

    if (existing.checkedInAt) {
        return { error: "Already checked in" };
    }

    const result = await markRegistrationCheckedIn(spreadsheetId, registrationId);
    if (!result.success) {
        return { error: result.error || "Failed to check in" };
    }

    revalidatePath(`/admin/ticket/${registrationId}`);
    return { success: true };
}

export async function markAttendanceAction(ticketId, attendanceStatus) {
    if (!(await isAdminAuthenticated())) {
        return { error: "Unauthorized" };
    }

    const registrationId = String(ticketId || "").trim();
    if (!/^\d{6}$/.test(registrationId)) {
        return { error: "Invalid ticket code" };
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
        return { error: "Server misconfiguration: missing GOOGLE_SHEET_ID" };
    }

    const existing = await getRegistrationById(spreadsheetId, registrationId);
    if (!existing) {
        return { error: "Ticket not found" };
    }

    if (existing.checkedInAt) {
        return { error: "Already checked in" };
    }

    const checkedInAt = new Date().toLocaleString();
    const result = await markRegistrationAttendance(spreadsheetId, registrationId, {
        checkedInAt,
        memberAttendance: String(attendanceStatus || "").trim(),
        status: "ATTENDED",
    });

    if (!result.success) {
        return { error: result.error || "Failed to update attendance" };
    }

    revalidatePath(`/admin/ticket/${registrationId}`);
    return { success: true };
}
