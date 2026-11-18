import { redirect } from "next/navigation";
import { getCoordinatorEventId } from "../actions";
import DailyQuestionsClient from "./DailyQuestionsClient";

export const dynamic = 'force-dynamic';

export default async function DailyQuestionsPage() {
    const eventId = await getCoordinatorEventId();
    
    if (!eventId) {
        redirect("/coordinator/login");
    }

    return <DailyQuestionsClient eventId={eventId} />;
}
