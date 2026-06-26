import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/app/admin/actions';
import { sendRecruitmentDecision } from '@/lib/email';

/**
 * GET /api/admin/recruitment
 * Admin only — paginated list of applications with filters.
 *
 * Query params:
 *   page (default 1), limit (default 20)
 *   status: PENDING | APPROVED | REJECTED | ALL
 *   branch: string
 *   year: string
 *   search: string (name/email/roll)
 */
export async function GET(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get('page') ?? 1));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));
        const status = searchParams.get('status') ?? 'ALL';
        const team = searchParams.get('team') ?? 'ALL';
        const branch = searchParams.get('branch') ?? '';
        const year = searchParams.get('year') ?? '';
        const search = searchParams.get('search')?.trim() ?? '';

        const supabase = createAdminClient();
        let query = supabase
            .from('recruitment_applications')
            .select('*', { count: 'exact' })
            .order('applied_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (status !== 'ALL') {
            query = query.eq('status', status);
        }
        if (team !== 'ALL') {
            query = query.eq('team', team);
        }
        if (branch) {
            query = query.eq('branch', branch);
        }
        if (year) {
            query = query.eq('year', year);
        }
        if (search) {
            query = query.or(
                `name.ilike.%${search}%,email.ilike.%${search}%,roll_number.ilike.%${search}%`
            );
        }

        const { data, error, count } = await query;
        if (error) throw error;

        // Also fetch summary counts
        const { data: counts } = await supabase
            .from('recruitment_applications')
            .select('status');

        const summary = { total: 0, pending: 0, approved: 0, rejected: 0 };
        for (const r of counts ?? []) {
            summary.total++;
            if (r.status === 'PENDING') summary.pending++;
            if (r.status === 'APPROVED') summary.approved++;
            if (r.status === 'REJECTED') summary.rejected++;
        }

        return NextResponse.json({
            applications: data ?? [],
            total: count ?? 0,
            page,
            limit,
            summary,
        });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[admin/recruitment GET] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/recruitment
 * Admin only — approve or reject an application.
 *
 * Body: { id, status: 'APPROVED' | 'REJECTED', reviewNote?: string }
 */
export async function PATCH(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, status, reviewNote } = body;

        if (!id || !['APPROVED', 'REJECTED'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request. Provide id and status (APPROVED|REJECTED).' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data: app, error: fetchErr } = await supabase
            .from('recruitment_applications')
            .select('name, email, status')
            .eq('id', id)
            .single();

        if (fetchErr || !app) {
            return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
        }

        const { error: updateErr } = await supabase
            .from('recruitment_applications')
            .update({
                status,
                review_note: reviewNote?.trim() || null,
                reviewed_at: new Date().toISOString(),
                reviewed_by: process.env.ADMIN_USERNAME || 'admin',
            })
            .eq('id', id);

        if (updateErr) throw updateErr;

        // Send decision email (non-blocking)
        sendRecruitmentDecision({
            toEmail: app.email,
            name: app.name,
            status,
            note: reviewNote?.trim() || '',
        }).catch((e) => console.error('[admin/recruitment PATCH] Decision email failed:', e));

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[admin/recruitment PATCH] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
