import PlacementSeriesLandingClient from "./PlacementSeriesLandingClient";

export const dynamic = 'force-dynamic';

export default async function PlacementSeriesLandingPage({ params }) {
    const eventId = (await params).eventId;
    return <PlacementSeriesLandingClient eventId={eventId} />;
}
