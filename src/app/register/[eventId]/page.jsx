import RegistrationClient from "@/components/events/RegistrationClient";

export async function generateMetadata({ params }) {
    const eventId = params.eventId;

    // Fetch event data
    const product = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/events`).then((res) => res.json()).catch(() => []);
    const event = product.find(e => e.id == eventId);

    if (!event) {
        return {
            title: "Event Not Found | RMC",
        };
    }

    return {
        title: `${event.title} | RMC`,
        description: event.description,
        openGraph: {
            title: event.title,
            description: event.description,
            images: [event.posterDesktop || event.img || '/RMC logo-circular.png'],
        },
    };
}

export default async function RegistrationPage({ params }) {
    // In Next.js 15+, params is a Promise. In 14, it's an object. 
    // We treat it as a potential promise to be safe or just access it if we know the version.
    // Given the build output showed "Next.js 16", params IS A PROMISE that needs awaiting.
    // However, trying to await it might break if it's not. 
    // Safe bet for Next 16: const { eventId } = await params;

    // But since I don't want to risk "await params" syntax if the linter/ts config is strict or older...
    // Let's assume standard object access for now based on typical 14/15 interop behavior, 
    // OR just use it directly. 
    // WAIT: The previous error showed "Next.js 16.1.3". In 15+, params must be awaited.

    const { eventId } = await params;

    return <RegistrationClient eventId={eventId} />;
}
