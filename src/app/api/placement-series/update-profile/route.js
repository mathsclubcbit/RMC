export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireParticipant } from '@/lib/ps-auth';

const ALLOWED_FIELDS = ['name', 'year', 'branch', 'college'];

export async function PATCH(request) {
    try {
        const participant = await requireParticipant(request, false);
        if (participant.error) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Only allow editing safe fields — never email, roll_no, event_id, etc.
        const updates = {};
        for (const field of ALLOWED_FIELDS) {
            if (body[field] !== undefined) {
                const val = String(body[field]).trim();
                if (val.length > 0) updates[field] = val;
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        updates.updated_at = new Date().toISOString();

        const admin = createAdminClient();
        const { data: updated, error: dbError } = await admin
            .from('ps_participants')
            .update(updates)
            .eq('id', participant.participantId)
            .select('id, name, email, roll_no, year, branch, college, is_verified')
            .single();

        if (dbError) {
            console.error('Update profile DB error:', dbError);
            throw dbError;
        }

        return NextResponse.json({
            success: true,
            participant: {
                id: updated.id,
                name: updated.name,
                email: updated.email,
                rollNo: updated.roll_no,
                year: updated.year,
                branch: updated.branch,
                college: updated.college,
                isVerified: Boolean(updated.is_verified),
            }
        });

    } catch (error) {
        console.error('Update Profile API Error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
