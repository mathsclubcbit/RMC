import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getCookieDomain(host) {
    if (!host) return undefined;
    const cleanHost = host.split(':')[0];
    if (cleanHost.endsWith('rmccbit.in')) {
        return '.rmccbit.in';
    }
    return undefined;
}

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const host = request.headers.get('host') || '';
        const domain = getCookieDomain(host);
        cookieStore.delete({
            name: "coordinator_token",
            path: '/',
            ...(domain ? { domain } : {}),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }
}

export async function GET(request) {
    // Support GET method for simpler redirect flows
    const cookieStore = await cookies();
    const host = request.headers.get('host') || '';
    const domain = getCookieDomain(host);
    cookieStore.delete({
        name: "coordinator_token",
        path: '/',
        ...(domain ? { domain } : {}),
    });

    // Use the request URL's origin to build the redirect - works on any domain
    const url = new URL('/coordinator/login', request.url);
    return NextResponse.redirect(url);
}
