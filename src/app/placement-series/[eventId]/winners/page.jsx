import WinnersClient from "./WinnersClient";

export const metadata = {
    title: "Hall of Fame | Placement Series",
    description: "Contest winners and podium finishers for the Placement Series."
};

export default async function WinnersPage({ params }) {
    const { eventId } = await params;
    return <WinnersClient eventId={eventId} />;
}
