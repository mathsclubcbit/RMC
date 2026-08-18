import ParticipantProfileClient from "./ParticipantProfileClient";

export const dynamic = 'force-dynamic';

export default async function ParticipantProfilePage({ params }) {
    const eventId = (await params).eventId;
    return <ParticipantProfileClient eventId={eventId} />;
}
