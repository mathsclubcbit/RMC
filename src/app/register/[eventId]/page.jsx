import RegistrationClient from "@/components/events/RegistrationClient";
import { createAdminClient } from "@/lib/supabase/server";

function hasSupabaseConfig() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getEventById(eventId) {
    if (!hasSupabaseConfig()) {
        return null;
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('events')
            .select('id,title,date,payload,created_at,updated_at')
            .eq('id', eventId)
            .single();

        if (error || !data) {
            return null;
        }

        return {
            ...(data.payload || {}),
            id: String(data.id),
            title: data.title,
            date: data.date,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { eventId } = await params;
    const event = await getEventById(eventId);

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
            images: [event.posterDesktop || event.img || '/rmc-logo.png'],
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
