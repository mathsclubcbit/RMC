import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

export async function POST(req: NextRequest) {
    // Basic security: check for a secret or just allow for now since it's admin-only
    try {
        // @ts-ignore
        revalidateTag('registrations');
        // @ts-ignore
        revalidateTag('admin');
        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (err) {
        return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
    }
}
