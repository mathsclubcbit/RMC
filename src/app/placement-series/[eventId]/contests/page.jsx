import ParticipantContestsClient from "./ParticipantContestsClient";

export const dynamic = 'force-dynamic';

export default async function ParticipantContestsPage({ params }) {
    const eventId = (await params).eventId;
    return <ParticipantContestsClient eventId={eventId} />;
}
