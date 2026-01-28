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

export async function GET() {
    // Support GET method for simpler redirect flows
    const cookieStore = await cookies();
    cookieStore.delete("coordinator_token");

    return NextResponse.redirect(new URL('/coordinator/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
}
