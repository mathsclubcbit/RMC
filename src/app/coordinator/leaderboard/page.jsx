import { redirect } from "next/navigation";
import { getCoordinatorEventId } from "../actions";
import LeaderboardClient from "./LeaderboardClient";

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
    const eventId = await getCoordinatorEventId();
    
    if (!eventId) {
        redirect("/coordinator/login");
    }

    return <LeaderboardClient eventId={eventId} />;
}
