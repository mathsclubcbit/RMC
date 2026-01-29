"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getRegistrationById, markRegistrationAttendance, markRegistrationCheckedIn } from "@/lib/google";
import { signToken, verifyToken } from "@/lib/jwt";
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

const getAdminCredentials = () => {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    const totpSecret = process.env.ADMIN_TOTP_SECRET || "";

    if (!username || !password) {
        throw new Error("CRITICAL: ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables.");
    }

    return { username, password, totpSecret };
};

export async function adminLoginAction(prevState, formData) {
    const { username: expectedUser, password: expectedPass, totpSecret } = getAdminCredentials();

    // If we are in step 2 (verifying OTP)
    const isStep2 = formData.get("step") === "2";

    if (isStep2) {
        const otp = String(formData.get("otp") || "").replace(/\s/g, "");

        // Verify OTP
        try {
            if (!totpSecret) {
                // Fallback if secret missing but somehow got to step 2
                return { error: "System configuration error. Contact developer.", step: 1 };
            }

            const isValid = authenticator.check(otp, totpSecret);
            if (!isValid) {
                return { error: "Invalid authenticator code", step: 2 };
            }

            // Success! Sign Token
            const token = await signToken({ type: 'admin', role: 'admin' }, '24h');
            const cookieStore = await cookies();
            cookieStore.set("admin_token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 60 * 24,
                path: "/",
                sameSite: "lax",
            });
        } catch (err) {
            console.error(err);
            return { error: "Verification failed", step: 2 };
        }

        redirect("/admin");
    }

    // Step 1: Verify Password Only
    const password = String(formData.get("password") || "");

    if (password === expectedPass) {
        // If TOTP is NOT configured, allow insecure login (fallback)
        if (!totpSecret) {
            console.warn("⚠️ ADMIN LOGGED IN WITHOUT 2FA (ADMIN_TOTP_SECRET not set) ⚠️");
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

        // If TOTP IS configured, move to step 2
        return { step: 2, error: "" };
    }

    return { error: "Invalid password", step: 1 };
}

export async function generateTotpSecretAction() {
    // Security check: Only authenticated admins can generate new secrets
    if (!(await isAdminAuthenticated())) {
        throw new Error("Unauthorized");
    }

    // Generate secure secret
    const secret = authenticator.generateSecret();
    const user = process.env.ADMIN_USERNAME || "admin";
    const service = "RMC Admin";

    // Create otpauth URL
    const otpauth = authenticator.keyuri(user, service, secret);

    // Generate QR Code
    const qrCode = await QRCode.toDataURL(otpauth);

    return { secret, qrCode };
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
