import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/recruitment/status?email=
 * Public endpoint — lets applicants check their current application status.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email')?.trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get the most recent application for this email
        const { data, error } = await supabase
            .from('recruitment_applications')
            .select('id, name, status, review_note, applied_at, reviewed_at, academic_year')
            .eq('email', email)
            .order('applied_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            return NextResponse.json({ found: false }, { status: 200 });
        }

        return NextResponse.json({
            found: true,
            applicationId: data.id,
            name: data.name,
            status: data.status,
            reviewNote: data.review_note,
            appliedAt: data.applied_at,
            reviewedAt: data.reviewed_at,
            academicYear: data.academic_year,
        });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[recruitment/status] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
