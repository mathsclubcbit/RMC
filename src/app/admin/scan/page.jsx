import { isAdminAuthenticated } from "../actions";
import { redirect } from "next/navigation";
import AdminScanClient from "./AdminScanClient";

export const metadata = {
    title: "Admin - Ticket Scanner",
};

export default async function AdminScanPage() {
    // Strong Authentication Check
    if (!(await isAdminAuthenticated())) {
        redirect("/admin/login");
    }

    return <AdminScanClient />;
}
