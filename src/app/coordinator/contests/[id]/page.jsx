import { redirect } from "next/navigation";
import { getCoordinatorEventId } from "../../actions";
import ContestDetailClient from "./ContestDetailClient";

export const dynamic = 'force-dynamic';

export default async function ContestDetailPage({ params }) {
    const id = (await params).id;
    const eventId = await getCoordinatorEventId();
    
    if (!eventId) {
        redirect("/coordinator/login");
    }

    return <ContestDetailClient contestId={id} eventId={eventId} />;
}
