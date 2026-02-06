import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

/**
 * Creates a Supabase client for use in Server Components, Route Handlers, and Server Actions.
 * This client reads cookies to maintain the user session.
 */
export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, {
                                ...options,
                                path: '/',
                                secure: process.env.NODE_ENV === 'production',
                                sameSite: 'lax',
                            })
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing sessions.
                    }
                },
            },
        }
    );
}

/**
 * Creates a Supabase Admin client with service role access.
 * Use this ONLY in secure server-side contexts (never expose to client).
 */
export function createAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

/**
 * Cached getter for events.
 * Uses Next.js native caching with tag-based invalidation.
 */
export const getCachedEvents = unstable_cache(
    async () => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('events')
            .select('id,title,date,payload,created_at,updated_at')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching cached events:', error);
            return [];
        }

        return (data || []).map((row) => ({
            ...(row.payload || {}),
            id: String(row.id),
            title: row.title,
            date: row.date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));
    },
    ['events-list'],
    {
        revalidate: 3600, // 1 hour revalidation
        tags: ['events']
    }
);
