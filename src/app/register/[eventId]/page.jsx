import RegistrationClient from "@/components/events/registration";
import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
            images: [event.posterDesktop || event.img || '/full logo.png'],
        },
    };
}

export default async function RegistrationPage({ params }) {
    const { eventId } = await params;
    const event = await getEventById(eventId);

    // Fallback Redirect Logic
    if (event?.useExternalRegistration && event?.externalRegistrationUrl) {
        let targetUrl = event.externalRegistrationUrl.trim();
        // If the URL doesn't start with a protocol, assume https
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
        }
        redirect(targetUrl);
    }

    if (eventId === 'mpl-2026') {
        redirect('/mpl/register');
    }

    return <RegistrationClient eventId={eventId} />;
}
