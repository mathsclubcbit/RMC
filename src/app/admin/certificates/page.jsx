import { isAdminAuthenticated } from "../actions";
import { redirect } from "next/navigation";
import AdminCertificatesClient from "./AdminCertificatesClient";

export const metadata = {
    title: "Admin - Certificates & Verification | RMC",
};

export default async function AdminCertificatesPage() {
    const isDev = process.env.NODE_ENV === 'development';
    const authed = await isAdminAuthenticated();

    if (!authed && !isDev) {
        redirect("/admin/login");
    }

    const defaultCertSheetId =
        process.env.GOOGLE_CERTIFICATES_SHEET_ID ||
        process.env.GOOGLE_SHEET_ID ||
        '1RAoU3gcyjm-pmIVveZ5MPWLXxmB-7G2Es_TzKsJkCR4';

    return (
        <AdminCertificatesClient
            isDevPreview={!authed && isDev}
            defaultCertSheetId={defaultCertSheetId}
        />
    );
}

