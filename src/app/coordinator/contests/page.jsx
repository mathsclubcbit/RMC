import { redirect } from "next/navigation";
import { getCoordinatorEventId } from "../actions";
import ContestsClient from "./ContestsClient";

export const dynamic = 'force-dynamic';

export default async function ContestsPage() {
    const eventId = await getCoordinatorEventId();
    
    if (!eventId) {
        redirect("/coordinator/login");
    }

    return <ContestsClient eventId={eventId} />;
}
