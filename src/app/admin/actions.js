"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRegistrationById, markRegistrationAttendance, markRegistrationCheckedIn } from "@/lib/google";

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
        const cookieStore = await cookies();
        cookieStore.set("admin_session", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24,
            path: "/",
            sameSite: "lax",
        });

        redirect("/admin/scan");
    }

    return { error: "Invalid credentials" };
}

export async function adminLogoutAction() {
    (await cookies()).delete("admin_session");
    redirect("/admin/login");
}

export async function markCheckedInAction(formData) {
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_session")?.value === "true";
    if (!isAdmin) {
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
    const cookieStore = await cookies();
    const isAdmin = cookieStore.get("admin_session")?.value === "true";
    if (!isAdmin) {
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
