import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete("coordinator_token");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
    }
}

export async function GET(request) {
    // Support GET method for simpler redirect flows
    const cookieStore = await cookies();
    cookieStore.delete("coordinator_token");

    // Use the request URL's origin to build the redirect - works on any domain
    const url = new URL('/coordinator/login', request.url);
    return NextResponse.redirect(url);
}
