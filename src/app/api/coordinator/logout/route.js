import { NextResponse } from 'next/server';

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
        const host = request.headers.get('host') || '';
        const domain = getCookieDomain(host);
        const response = NextResponse.json({ success: true });
        response.cookies.delete({
            name: "coordinator_token",
            path: '/',
            ...(domain ? { domain } : {}),
        });

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
    response.cookies.delete({
        name: "coordinator_token",
        path: '/',
        ...(domain ? { domain } : {}),
    });

    return response;
}
