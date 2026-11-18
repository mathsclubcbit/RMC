import QuizResultClient from "./QuizResultClient";

export default async function QuizResultPage({ params }) {
    const { eventId } = await params;
    return <QuizResultClient eventId={eventId} />;
}
