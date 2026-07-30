import { redirect } from "next/navigation";
import { getCoordinatorEventId } from "../actions";
import QuestionsClient from "./QuestionsClient";

export const dynamic = 'force-dynamic';

export default async function QuestionsPage() {
    const eventId = await getCoordinatorEventId();
    
    if (!eventId) {
        redirect("/coordinator/login");
    }

    return <QuestionsClient eventId={eventId} />;
}
