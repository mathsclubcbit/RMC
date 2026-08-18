import QuizPlayClient from "./QuizPlayClient";

export default async function QuizPlayPage({ params }) {
    const { eventId } = await params;
    return <QuizPlayClient eventId={eventId} />;
}
