import { isAdminAuthenticated } from "../actions";
import { redirect } from "next/navigation";
import NewsletterClient from "./NewsletterClient";

export const metadata = {
    title: "Admin - Newsletter",
};

export default async function NewsletterPage() {
    if (!(await isAdminAuthenticated())) {
        redirect("/admin/login");
    }

    return <NewsletterClient />;
}
