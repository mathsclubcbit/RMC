import { isAdminAuthenticated } from "../actions";
import { redirect } from "next/navigation";
import AdminAnnouncementsClient from "./AdminAnnouncementsClient";

export const metadata = {
    title: "Admin - Announcements",
};

export default async function AdminAnnouncementsPage() {
    if (!(await isAdminAuthenticated())) {
        redirect("/admin/login");
    }

    return <AdminAnnouncementsClient />;
}
