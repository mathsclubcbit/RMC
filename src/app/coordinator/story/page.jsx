import { redirect } from "next/navigation";
import { getCoordinatorEventId } from "../actions";
import StoryClient from "./StoryClient";

export const dynamic = 'force-dynamic';

export default async function CoordinatorStoryPage() {
    const eventId = await getCoordinatorEventId();
    
    if (!eventId) {
        redirect("/coordinator/login");
    }

    return <StoryClient eventId={eventId} />;
}
