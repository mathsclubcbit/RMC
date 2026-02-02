import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function getCookieDomain(host) {
    if (!host) return undefined;
    const cleanHost = host.split(':')[0];
    if (cleanHost.endsWith('rmccbit.in')) {
        return '.rmccbit.in';
    }
    return undefined;
}

function createRouteSupabaseClient(request, response) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );
}

export async function POST(request) {
    try {
        const host = request.headers.get('host') || '';
        const domain = getCookieDomain(host);
        const response = NextResponse.json({ success: true });
        const supabase = createRouteSupabaseClient(request, response);
        await supabase.auth.signOut();
        // Delete host-only cookie
        response.cookies.delete({
            name: "coordinator_token",
            path: '/',
        });

        // Delete domain cookie
        if (domain) {
            response.cookies.delete({
                name: "coordinator_token",
                path: '/',
                domain,
            });
        }

        return response;
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }
}

export async function GET(request) {
    const host = request.headers.get('host') || '';
    const domain = getCookieDomain(host);
    // Support GET method for simpler redirect flows
    const response = NextResponse.redirect(new URL('/coordinator/login', request.url));
    const supabase = createRouteSupabaseClient(request, response);
    await supabase.auth.signOut();
    // Delete host-only cookie
    response.cookies.delete({
        name: "coordinator_token",
        path: '/',
    });

    // Delete domain cookie
    if (domain) {
        response.cookies.delete({
            name: "coordinator_token",
            path: '/',
            domain,
        });
    }

    return response;
}
