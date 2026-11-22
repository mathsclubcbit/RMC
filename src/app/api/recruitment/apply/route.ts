import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendRecruitmentConfirmation } from '@/lib/email';
import { appendRecruitmentRowToSheet } from '@/lib/google';

type FieldSchema = {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number';
    label: string;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    options?: string[];
};

/**
 * POST /api/recruitment/apply
 * Handles new club membership applications.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            name,
            email,
            phone,
            rollNumber,
            branch,
            year,
            team,
            extraFields = {},
        } = body;

        // --- 1. Validate core fields ---
        if (!name?.trim() || !email?.trim() || !phone?.trim() || !rollNumber?.trim() || !branch?.trim() || !year?.trim() || !team?.trim()) {
            return NextResponse.json({ error: 'All core fields are required.' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return NextResponse.json({ error: 'Phone number must be exactly 10 digits.' }, { status: 400 });
        }

        if (!/^\d{12}$/.test(rollNumber)) {
            return NextResponse.json({ error: 'Roll number must be exactly 12 digits.' }, { status: 400 });
        }

        // --- 2. Fetch settings (open toggle + schema + academic year) ---
        const supabase = createAdminClient();

        const { data: settingsRows, error: settingsError } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['recruitment_open', 'recruitment_form_schema', 'recruitment_academic_year']);

        if (settingsError) throw settingsError;

        const settings: Record<string, unknown> = {};
        for (const row of settingsRows ?? []) {
            settings[row.key] = row.value;
        }

        const isOpen = settings['recruitment_open'] === true || settings['recruitment_open'] === 'true';
        if (!isOpen) {
            return NextResponse.json(
                { error: 'RECRUITMENT_CLOSED', message: 'Recruitment is currently closed. Check back later.' },
                { status: 403 }
            );
        }

        const schema: FieldSchema[] = Array.isArray(settings['recruitment_form_schema'])
            ? (settings['recruitment_form_schema'] as FieldSchema[])
            : [];

        const academicYear = String(settings['recruitment_academic_year'] ?? '2025-26');

        // --- 3. Validate dynamic fields against schema ---
        for (const field of schema) {
            if (!field.required) continue;

            const value = extraFields[field.id];
            const isEmpty =
                value === undefined ||
                value === null ||
                value === '' ||
                (Array.isArray(value) && value.length === 0);

            if (isEmpty) {
                return NextResponse.json(
                    { error: `Field "${field.label}" is required.` },
                    { status: 400 }
                );
            }

            if (field.type === 'textarea' || field.type === 'text') {
                const strVal = String(value);
                if (field.minLength && strVal.length < field.minLength) {
                    return NextResponse.json(
                        { error: `"${field.label}" must be at least ${field.minLength} characters.` },
                        { status: 400 }
                    );
                }
                if (field.maxLength && strVal.length > field.maxLength) {
                    return NextResponse.json(
                        { error: `"${field.label}" must not exceed ${field.maxLength} characters.` },
                        { status: 400 }
                    );
                }
            }
        }

        // --- 4. Check for duplicate active application ---
        const { data: existing } = await supabase
            .from('recruitment_applications')
            .select('id, status')
            .eq('email', email.trim().toLowerCase())
            .eq('academic_year', academicYear)
            .in('status', ['PENDING', 'APPROVED'])
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                {
                    error: 'DUPLICATE_APPLICATION',
                    message: existing.status === 'APPROVED'
                        ? 'You have already been approved as a member this year.'
                        : 'Your application is already under review. You can check your status at /join/status',
                },
                { status: 409 }
            );
        }

        // --- 5. Insert application ---
        const { data: inserted, error: insertError } = await supabase
            .from('recruitment_applications')
            .insert({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                roll_number: rollNumber.trim(),
                phone: phone.trim(),
                branch: branch.trim(),
                year: year.trim(),
                team: team.trim(),
                extra_fields: extraFields,
                academic_year: academicYear,
                status: 'PENDING',
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[recruitment/apply] Insert error:', insertError);
            throw new Error('Failed to save application.');
        }

        // --- 6. Send confirmation email (awaited to ensure delivery) ---
        await sendRecruitmentConfirmation({
            toEmail: email.trim(),
            name: name.trim(),
            applicationId: inserted.id,
        }).catch((e) => console.error('[recruitment/apply] Email failed:', e));


        // --- 7. Send to Google Sheets (awaited to ensure delivery) ---
        const sheetId = process.env.RECRUITMENT_GOOGLE_SHEET_ID || '1mpNl9ofBlr94LxBOjyrqQ84EbiHLMEav91iH89DmALM';
        const rowData = [
            new Date().toISOString(),
            inserted.id,
            name.trim(),
            email.trim().toLowerCase(),
            phone.trim(),
            rollNumber.trim(),
            branch.trim(),
            year.trim(),
            team.trim(),
            'PENDING',
            academicYear,
            JSON.stringify(extraFields)
        ];
        await appendRecruitmentRowToSheet(sheetId, rowData, 'Recruitment').catch(e => console.error('[recruitment/apply] Sheets sync failed:', e));

        return NextResponse.json(
            { success: true, applicationId: inserted.id },
            { status: 201 }
        );
    } catch (err: unknown) {
        const e = err as Error;
        console.error('[recruitment/apply] Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
