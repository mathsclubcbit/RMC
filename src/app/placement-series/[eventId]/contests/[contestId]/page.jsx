import ParticipantContestPlayClient from "./ParticipantContestPlayClient";

export const dynamic = 'force-dynamic';

export default async function ParticipantContestPlayPage({ params }) {
    const eventId = (await params).eventId;
    const contestId = (await params).contestId;
    
    return <ParticipantContestPlayClient eventId={eventId} contestId={contestId} />;
}
