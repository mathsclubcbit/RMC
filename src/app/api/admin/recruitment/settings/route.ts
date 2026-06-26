import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminAuthenticated } from '@/app/admin/actions';

/**
 * GET /api/admin/recruitment/settings
 * Returns current recruitment settings: open toggle, form schema, academic year.
 */
export async function GET(_req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['recruitment_open', 'recruitment_form_schema', 'recruitment_academic_year']);

        if (error) throw error;

        const settings: Record<string, unknown> = {};
        for (const row of data ?? []) {
            settings[row.key] = row.value;
        }

        return NextResponse.json({
            isOpen: settings['recruitment_open'] === true || settings['recruitment_open'] === 'true',
            schema: Array.isArray(settings['recruitment_form_schema'])
                ? settings['recruitment_form_schema']
                : [],
            academicYear: String(settings['recruitment_academic_year'] ?? '2025-26'),
        });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[admin/recruitment/settings GET]', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/recruitment/settings
 * Update one or more recruitment settings.
 *
 * Body (all optional):
 *   isOpen: boolean
 *   schema: FieldSchema[]
 *   academicYear: string
 */
export async function PATCH(req: NextRequest) {
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { isOpen, schema, academicYear } = body;

        const supabase = createAdminClient();
        const upserts: { key: string; value: unknown }[] = [];

        if (typeof isOpen === 'boolean') {
            upserts.push({ key: 'recruitment_open', value: isOpen });
        }
        if (Array.isArray(schema)) {
            upserts.push({ key: 'recruitment_form_schema', value: schema });
        }
        if (typeof academicYear === 'string' && academicYear.trim()) {
            upserts.push({ key: 'recruitment_academic_year', value: academicYear.trim() });
        }

        if (upserts.length === 0) {
            return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
        }

        for (const upsert of upserts) {
            const { error } = await supabase
                .from('settings')
                .upsert({ key: upsert.key, value: upsert.value });
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[admin/recruitment/settings PATCH]', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
