import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { randomInt } from 'crypto';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { uploadToSupabaseStorage } from '@/lib/supabase/storage';
import { createAdminClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/rate-limiter';
// We import Google logic dynamically or keep it for backup
import { checkDuplicateUTR as checkDuplicateUTRSheet, appendRowToSheet } from '@/lib/google';

// Type definitions matching our needs
type PricingTier = {
    teamSize?: unknown;
    price?: unknown;
};

type EventPayload = {
    teamSize?: unknown;
    minTeamSize?: unknown;
    maxTeamSize?: unknown;
    registrationFee?: unknown;
    variablePricingEnabled?: unknown;
    pricingTiers?: unknown;
};

const generateTicketCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const eventId = formData.get('eventId') as string;
        const eventName = formData.get('eventName') as string;
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const phone = formData.get('phone') as string;
        const rollNo = formData.get('rollNo') as string;
        const department = formData.get('department') as string;
        const utrId = formData.get('utrId') as string;
        const amountFromClient = formData.get('amount') as string;
        const screenshot = formData.get('screenshot') as File;
        const teamMembersStr = formData.get('teamMembers') as string | null;
        const teamSizeStr = formData.get('teamSize') as string | null;

        const abstract = formData.get('abstract') as string | null;
        const pptFile = formData.get('ppt') as File | null;

        // --- 1. Validation ---
        if (!eventId || !eventName || !name || !email || !phone || !rollNo || !department || !utrId || !screenshot) {
            return NextResponse.json({ error: 'Missing required fields or file.' }, { status: 400 });
        }

        // Validate Phone (10 digits)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
            return NextResponse.json({ error: 'Invalid phone number. Must be 10 digits.' }, { status: 400 });
        }

        // Validate Roll Number (Exactly 12 digits)
        if (!/^\d{12}$/.test(rollNo)) {
            return NextResponse.json({ error: 'Roll Number must be exactly 12 digits.' }, { status: 400 });
        }

        // Validate File Size (3MB for Screenshot)
        if (screenshot.size > 3 * 1024 * 1024) {
            return NextResponse.json({ error: 'Screenshot file size too large. Max 3MB.' }, { status: 400 });
        }

        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(screenshot.type)) {
            return NextResponse.json({ error: 'Invalid screenshot file type. Only JPEG, PNG, and PDF allowed.' }, { status: 400 });
        }

        const normalizedUTR = utrId.trim().toUpperCase();

        // --- 2. Team Parsing & Validation ---
        let teamMembers: Array<{ name?: string; email?: string; rollNo?: string; phone?: string }> = [];
        if (teamMembersStr) {
            try {
                const parsed = JSON.parse(teamMembersStr);
                if (Array.isArray(parsed)) teamMembers = parsed;
            } catch {
                return NextResponse.json({ error: 'Invalid teamMembers payload.' }, { status: 400 });
            }
        }

        // Validate team emails
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (let i = 0; i < teamMembers.length; i++) {
            if (teamMembers[i].email && !emailRegex.test(teamMembers[i].email as string)) {
                return NextResponse.json({ error: `Invalid email for team member ${i + 1}.` }, { status: 400 });
            }
        }

        const computedTeamSize = 1 + (Array.isArray(teamMembers) ? teamMembers.length : 0);
        if (teamSizeStr) {
            const declared = Number(teamSizeStr);
            if (Number.isFinite(declared) && declared !== computedTeamSize) {
                return NextResponse.json({ error: 'TEAM_SIZE_MISMATCH' }, { status: 400 });
            }
        }

        // --- 3. Supabase Setup & Event Config Check ---
        const supabase = createAdminClient();

        // Fetch event config to validate amounts
        const parseAmount = (value: unknown) => {
            if (value == null) return 0;
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            const raw = String(value);
            const cleaned = raw.replace(/[^0-9.]/g, '');
            const n = Number(cleaned);
            return Number.isFinite(n) ? n : 0;
        };

        let expectedAmount = parseAmount(amountFromClient);
        let isHackathonOrIdeathon = false;
        let isIdeathon = false;
        let eventDate = 'To be announced';
        let eventTime = '';
        let eventVenue = 'CBIT Campus';

        try {
            const { data: eventRow, error: eventError } = await supabase
                .from('events')
                .select('payload')
                .eq('id', String(eventId))
                .single();

            if (!eventError && eventRow) {
                const payload = eventRow.payload as EventPayload & {
                    eventType?: string; category?: string;
                    date?: string; startDate?: string;
                    time?: string; startTime?: string; endTime?: string;
                    location?: string; venue?: string;
                };
                // Determine type from payload (eventType is stored inside payload JSONB)
                const eType = payload?.eventType || '';
                const eCat = payload?.category || '';
                isHackathonOrIdeathon = eType === 'Hackathon' || eType === 'Ideathon' || eCat === 'Hackathon' || eCat === 'Ideathon';
                isIdeathon = eType === 'Ideathon' || eCat === 'Ideathon';

                // Extract details for email
                if (payload) {
                    // Date
                    const rawDate = payload.date || payload.startDate || '';
                    if (rawDate) eventDate = rawDate;

                    // Time
                    if (payload.time) eventTime = payload.time;
                    else if (payload.startTime) eventTime = payload.endTime ? `${payload.startTime} - ${payload.endTime}` : payload.startTime;

                    // Venue
                    if (payload.location || payload.venue) eventVenue = payload.location || payload.venue || eventVenue;
                }

                // PPT Validation
                if (isHackathonOrIdeathon) {
                    if (!pptFile) {
                        return NextResponse.json({ error: 'Presentation file (PPT/PDF) is required.' }, { status: 400 });
                    }
                    if (pptFile.size > 10 * 1024 * 1024) {
                        return NextResponse.json({ error: 'PPT size too large. Max 10MB.' }, { status: 400 });
                    }
                }

                // Price Validation
                if (payload && Boolean(payload?.variablePricingEnabled)) {
                    const tiersRaw = Array.isArray(payload?.pricingTiers) ? (payload.pricingTiers as unknown[]) : [];
                    const tiers: PricingTier[] = (tiersRaw.filter((t: any) => t !== null && typeof t === 'object') as unknown) as PricingTier[];
                    const tier = tiers.find((t) => Number(t?.teamSize) === computedTeamSize);
                    const price = parseAmount(tier?.price);
                    if (Number.isFinite(price) && price >= 0) expectedAmount = price;
                } else if (payload) {
                    const fee = parseAmount(payload?.registrationFee);
                    if (Number.isFinite(fee) && fee >= 0) expectedAmount = fee;
                }
            }
        } catch (err) {
            console.warn('Event fetch failed, using client values:', err);
        }

        // --- 4. Duplicate Check (Supabase) ---
        // We check Supabase for duplicates as primary source of truth.
        const { data: existingUTR } = await supabase
            .from('registrations')
            .select('id')
            .eq('utr_id', normalizedUTR)
            .single();

        if (existingUTR) {
            return NextResponse.json({ error: 'UTR_ALREADY_USED', message: 'This UTR ID has already been submitted.' }, { status: 409 });
        }

        // --- 5. File Uploads ---
        // Screenshot -> Cloudinary (image), PPT/Abstract -> Supabase Storage (document)
        const screenshotUrl = await uploadToCloudinary(screenshot);

        let pptUrl = '';
        if (isHackathonOrIdeathon && pptFile) {
            const folder = isIdeathon ? 'abstracts' : 'presentations';
            pptUrl = await uploadToSupabaseStorage(pptFile, folder);
        }

        // --- 6. Generate Ticket Code ---
        let registrationId = '';
        for (let i = 0; i < 5; i++) {
            const code = generateTicketCode();
            const { data: exists } = await supabase.from('registrations').select('id').eq('registration_id', code).single();
            if (!exists) {
                registrationId = code;
                break;
            }
        }
        if (!registrationId) throw new Error('Failed to generate unique ticket code');

        // --- 7. Save to Supabase (Primary) ---
        const { error: insertError } = await supabase.from('registrations').insert({
            event_id: eventId,
            event_name: eventName,
            registration_id: registrationId,
            name,
            email,
            phone,
            roll_no: rollNo,
            department,
            team_members: teamMembers,
            team_size: computedTeamSize,
            amount: expectedAmount,
            utr_id: normalizedUTR,
            screenshot_url: screenshotUrl,
            abstract: abstract || null,
            ppt_url: pptUrl || null,
            status: 'PENDING'
        });

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            throw new Error('Database insertion failed');
        }

        // --- 8. Append to Google Sheets (Backup / Mirror) ---
        // Non-blocking, try-catch
        // --- 8. Append to Google Sheets (Backup / Mirror) ---
        // We await this to ensure execution in serverless environments, but we catch errors so it doesn't fail the request.
        try {
            const sheetId = process.env.GOOGLE_SHEET_ID;
            if (sheetId) {
                const timestamp = new Date().toISOString();
                // For Ideathon, the uploaded file is the Abstract. For Hackathon, it's the PPT.
                // We map pptUrl to the correct column based on this.
                const abstractLink = isIdeathon ? pptUrl : (abstract || '');
                const pptLink = isIdeathon ? '' : pptUrl;

                const rowData = [
                    timestamp,
                    registrationId,
                    eventName,
                    name,
                    email,
                    phone,
                    rollNo,
                    department,
                    teamMembersStr || '',
                    normalizedUTR,
                    String(expectedAmount),
                    'PENDING',
                    screenshotUrl, // Cloudinary URL replacing Drive Link
                    abstractLink,  // Column N: Abstract (File URL for Ideathon, Text/Empty for others)
                    pptLink,       // Column O: PPT (File URL for Hackathon, Empty for Ideathon)
                    '', '', eventId, '', '' // Extra columns
                ];

                await appendRowToSheet(sheetId, rowData);
            }
        } catch (sheetErr) {
            console.warn('Google Sheet append failed (backup only):', sheetErr);
            // Do not fail the request
        }

        // --- 9. Email & QR ---
        const { generateQRCode } = await import('@/lib/qrcode');
        const qrCode = await generateQRCode(registrationId);

        const { sendTicketEmail } = await import('@/lib/email');
        // Non-blocking email
        sendTicketEmail({
            toEmail: email,
            participantName: name,
            eventName: eventName,
            eventDate,
            eventTime,
            eventVenue,
            registrationId,
            department,
            rollNo,
            phone
        }).catch(e => console.error('Email failed:', e));

        // @ts-ignore
        revalidateTag('registrations');

        return NextResponse.json({
            message: 'Registration successful',
            registrationId,
            qrCode,
            driveViewUrl: screenshotUrl // Compat with frontend
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
