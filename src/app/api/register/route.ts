import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { uploadToDrive, checkDuplicateRegistrationId, checkDuplicateUTR, appendRowToSheet, getOrCreateFolder } from '@/lib/google';
import { createAdminClient } from '@/lib/supabase/server';

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
        const teamMembersStr = formData.get('teamMembers') as string | null; // Optional team members
        const teamSizeStr = formData.get('teamSize') as string | null;

        const abstract = formData.get('abstract') as string | null;

        const pptFile = formData.get('ppt') as File | null;

        // 1. Validation
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

        // Validate Screenshot File Type
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(screenshot.type)) {
            return NextResponse.json({ error: 'Invalid screenshot file type. Only JPEG, PNG, and PDF allowed.' }, { status: 400 });
        }

        const normalizedUTR = utrId.trim().toUpperCase();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!spreadsheetId || !driveFolderId) {
            console.error('Missing env configuration');
            return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
        }

        // 1b. Determine team size and compute expected amount from event config.
        let teamMembers: Array<{ name?: string; rollNo?: string; phone?: string }> = [];
        if (teamMembersStr) {
            try {
                const parsed = JSON.parse(teamMembersStr);
                if (Array.isArray(parsed)) teamMembers = parsed;
            } catch {
                return NextResponse.json({ error: 'Invalid teamMembers payload.' }, { status: 400 });
            }
        }

        const computedTeamSize = 1 + (Array.isArray(teamMembers) ? teamMembers.length : 0);
        if (teamSizeStr) {
            const declared = Number(teamSizeStr);
            if (Number.isFinite(declared) && declared !== computedTeamSize) {
                return NextResponse.json({ error: 'TEAM_SIZE_MISMATCH' }, { status: 400 });
            }
        }

        // Default fallback: accept client amount (legacy behavior) if we cannot load event.
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

        try {
            const supabase = createAdminClient();
            const { data: eventRow, error: eventError } = await supabase
                .from('events')
                .select('payload, event_type, category')
                .eq('id', String(eventId))
                .single();

            if (!eventError && eventRow) {
                // Check if event is Hackathon or Ideathon
                const row = eventRow as any;
                const eType = row.event_type || row.eventType || '';
                const eCat = row.category || '';
                isHackathonOrIdeathon =
                    eType === 'Hackathon' || eType === 'Ideathon' ||
                    eCat === 'Hackathon' || eCat === 'Ideathon';

                const payload = row.payload as EventPayload;

                // If Hackathon/Ideathon, validate PPT
                if (isHackathonOrIdeathon) {
                    if (!pptFile) {
                        return NextResponse.json({ error: 'Presentation file (PPT/PDF) is required for this event.' }, { status: 400 });
                    }
                    if (pptFile.size > 10 * 1024 * 1024) { // 10MB limit for PPT
                        return NextResponse.json({ error: 'Presentation file size too large. Max 10MB.' }, { status: 400 });
                    }

                    const pptName = pptFile.name.toLowerCase();
                    const validExtensions = ['.pdf', '.ppt', '.pptx'];
                    const hasValidExt = validExtensions.some(ext => pptName.endsWith(ext));

                    if (!hasValidExt) {
                        return NextResponse.json({ error: 'Invalid presentation file type. Only PPT, PPTX, and PDF allowed.' }, { status: 400 });
                    }
                }

                if (payload) {
                    const legacyTeamSize = Number(payload?.teamSize);
                    const minTeamSize = Number(payload?.minTeamSize);
                    const maxTeamSize = Number(payload?.maxTeamSize);

                    const resolvedMin = Number.isFinite(minTeamSize) && minTeamSize > 0
                        ? minTeamSize
                        : (Number.isFinite(legacyTeamSize) && legacyTeamSize > 0 ? legacyTeamSize : 1);

                    const resolvedMax = Number.isFinite(maxTeamSize) && maxTeamSize > 0
                        ? maxTeamSize
                        : (Number.isFinite(legacyTeamSize) && legacyTeamSize > 0 ? legacyTeamSize : resolvedMin);

                    if (computedTeamSize < resolvedMin) {
                        return NextResponse.json({ error: 'TEAM_SIZE_TOO_SMALL', minTeamSize: resolvedMin }, { status: 400 });
                    }
                    if (computedTeamSize > resolvedMax) {
                        return NextResponse.json({ error: 'TEAM_SIZE_TOO_LARGE', maxTeamSize: resolvedMax }, { status: 400 });
                    }

                    if (Boolean(payload?.variablePricingEnabled)) {
                        const tiersRaw = Array.isArray(payload?.pricingTiers) ? (payload.pricingTiers as unknown[]) : [];
                        const tiers: PricingTier[] = tiersRaw.filter((t) => typeof t === 'object' && t !== null) as PricingTier[];
                        const tier = tiers.find((t) => Number(t?.teamSize) === computedTeamSize);
                        const price = parseAmount(tier?.price);
                        if (!Number.isFinite(price) || price < 0) {
                            return NextResponse.json({ error: 'PRICE_NOT_CONFIGURED', teamSize: computedTeamSize }, { status: 400 });
                        }
                        expectedAmount = price;
                    } else {
                        const fee = parseAmount(payload?.registrationFee);
                        expectedAmount = Number.isFinite(fee) && fee >= 0 ? fee : 0;
                    }
                }
            }
        } catch (err) {
            // Keep fallback behavior, but log for diagnostics.
            console.warn('Could not compute expected amount from Supabase event payload:', err);
        }

        if (!Number.isFinite(expectedAmount) || expectedAmount < 0) {
            return NextResponse.json({ error: 'INVALID_AMOUNT' }, { status: 400 });
        }

        if (process.env.NODE_ENV !== 'production') {
            console.info('Register target sheet', {
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
                tab: process.env.GOOGLE_SHEET_TAB || 'Sheet1',
                driveFolderId,
            });
        }

        // 2. Duplicate Check
        const isDuplicate = await checkDuplicateUTR(spreadsheetId, normalizedUTR);
        if (isDuplicate) {
            return NextResponse.json({ error: 'UTR_ALREADY_USED', message: 'This UTR ID has already been submitted.' }, { status: 409 });
        }

        // 3. Upload Screenshot
        // Get specific event folder inside the main Drive folder
        const eventFolderId = await getOrCreateFolder(eventName, driveFolderId);

        const buffer = Buffer.from(await screenshot.arrayBuffer());
        const fileExtension = screenshot.name.split('.').pop() || 'png';
        const fileName = `${eventId}_${name}_${normalizedUTR}.${fileExtension}`;

        const driveFile = await uploadToDrive(buffer, screenshot.type, fileName, eventFolderId);

        // 3b. Upload PPT if applicable
        let pptDriveFile: any = null;
        if (isHackathonOrIdeathon && pptFile) {
            const pptBuffer = Buffer.from(await pptFile.arrayBuffer());
            const pptExt = pptFile.name.split('.').pop() || 'pptx';
            const pptName = `${eventId}_${name}_PPT.${pptExt}`;
            pptDriveFile = await uploadToDrive(pptBuffer, pptFile.type, pptName, eventFolderId);
        }

        // 4. Append to Google Sheet
        const { ensureRegistrationSheet } = await import('@/lib/google');
        await ensureRegistrationSheet(spreadsheetId);

        // Generate a 6-digit ticket code (stored as Registration ID) and ensure it is unique.
        let registrationId = '';
        for (let attempt = 0; attempt < 10; attempt++) {
            const candidate = generateTicketCode();
            const exists = await checkDuplicateRegistrationId(spreadsheetId, candidate);
            if (!exists) {
                registrationId = candidate;
                break;
            }
        }
        if (!registrationId) {
            return NextResponse.json({ error: 'Failed to generate ticket code. Please retry.' }, { status: 500 });
        }
        const timestamp = new Date().toISOString();
        const status = 'PENDING';

        /*
            New Optimized Column Structure (A-T):
            A: Timestamp
            B: Ticket Code
            C: Event Name
            D: Name
            E: Email
            F: Phone
            G: Roll No
            H: Department
            I: Team Members (JSON)
            J: UTR ID
            K: Amount
            L: Status
            M: Screenshot Link
            N: Abstract
            O: PPT Link
            P: Check-In Time
            Q: Member Attendance
            R: Event ID
            S: File ID
            T: Download Link
        */
        const rowData = [
            timestamp,              // A
            registrationId,         // B
            eventName,              // C
            name,                   // D
            email,                  // E
            phone,                  // F
            rollNo,                 // G
            department,             // H
            teamMembersStr || '',   // I
            normalizedUTR,          // J
            String(expectedAmount), // K
            status,                 // L
            driveFile.webViewLink || '', // M
            abstract || '',         // N
            pptDriveFile?.webViewLink || '', // O
            '',                     // P (Check-In)
            '',                     // Q (Member Attendance)
            eventId,                // R
            driveFile.id || '',     // S
            driveFile.webContentLink || '' // T
        ];

        await appendRowToSheet(spreadsheetId, rowData);

        // 5. Generate QR Code and Send Ticket Email

        // Generate QR code
        const { generateQRCode } = await import('@/lib/qrcode');
        const qrCode = await generateQRCode(registrationId);

        // Import event details for email
        const eventDate = 'TBD'; // Will be shown in ticket page
        const eventTime = 'TBD';
        const eventVenue = 'CBIT Campus';

        // Send QR ticket email (non-blocking)
        const { sendTicketEmail } = await import('@/lib/email');
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
        }).catch(err => console.error('Email send failed:', err));

        return NextResponse.json({
            message: 'Registration successful',
            registrationId,
            qrCode, // QR code as data URL
            driveViewUrl: driveFile.webViewLink
        }, { status: 201 });

    } catch (error: unknown) {
        console.error('Registration Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
