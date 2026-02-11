import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
export const dynamic = 'force-dynamic';
import { jwtVerify } from 'jose';
import { createAdminClient } from '@/lib/supabase/server';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

export async function GET(request) {
    noStore();
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
        const admin = createAdminClient();

        const { data: regs, error: dbError } = await admin
            .from('registrations')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        // Map Supabase fields to frontend expectations (camelCase)
        const mapped = (regs || []).map(r => ({
            name: r.name,
            email: r.email,
            phone: r.phone,
            registrationId: r.registration_id,
            rollNo: r.roll_no,
            department: r.department,
            status: r.status,
            amount: r.amount,
            utrId: r.utr_id,
            teamMembers: r.team_members,
            abstract: r.abstract,
            pptLink: r.ppt_url,
            driveViewUrl: r.screenshot_url,
            timeSlot: r.time_slot,
            checkedInAt: r.checked_in_at,
            timestamp: r.created_at ? new Date(r.created_at).toLocaleString() : "N/A"
        }));

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Coordinator Participants API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch from database' }, { status: 500 });
    }
}
