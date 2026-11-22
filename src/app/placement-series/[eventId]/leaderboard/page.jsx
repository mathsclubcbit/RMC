import ParticipantLeaderboardClient from "./ParticipantLeaderboardClient";

export const dynamic = 'force-dynamic';

export default async function ParticipantLeaderboardPage({ params }) {
    const eventId = (await params).eventId;
    return <ParticipantLeaderboardClient eventId={eventId} />;
}
