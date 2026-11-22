import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/recruitment/schema
 * Public endpoint — returns the current form schema + recruitment open status.
 * Used by the /join page to render the dynamic form.
 */
export async function GET(_req: NextRequest) {
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
            academicYear: settings['recruitment_academic_year'] ?? '2025-26',
        });
    } catch (err) {
        console.error('[recruitment/schema] Error:', err);
        return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 });
    }
}
