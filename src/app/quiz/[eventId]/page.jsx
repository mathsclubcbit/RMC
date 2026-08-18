import QuizLandingClient from "./QuizLandingClient";

export default async function QuizLandingPage({ params, searchParams }) {
    const { eventId } = await params;
    const { entryCode } = await searchParams;
    return <QuizLandingClient eventId={eventId} entryCode={entryCode} />;
}
