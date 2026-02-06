import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAllRegistrations } from '@/lib/google';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

export async function GET(request) {
    try {
        const token = request.cookies.get('coordinator_token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = getJwtSecret();
        if (!secret) {
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const { payload } = await jwtVerify(token, secret);
        if (payload.type !== 'coordinator' || !payload.eventId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const eventId = payload.eventId;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!spreadsheetId) {
            return NextResponse.json([], { status: 200 });
        }

        const allRegs = await getAllRegistrations(spreadsheetId);
        const filtered = allRegs.filter(r => String(r.eventId || "").trim() === String(eventId).trim());

        return NextResponse.json(filtered);
    } catch (error) {
        console.error('Coordinator Participants API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
