import EventForm from "../EventForm";
import { isAdminAuthenticated } from "../../actions";
import { redirect } from "next/navigation";

export default async function NewEventPage() {
    if (!(await isAdminAuthenticated())) {
        redirect("/admin/login");
    }
    return <EventForm mode="create" />;
}
