import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { uploadToDrive, checkDuplicateUTR, appendRowToSheet, getOrCreateFolder } from '@/lib/google';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const eventId = formData.get('eventId') as string;
        const eventName = formData.get('eventName') as string;
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const rollNo = formData.get('rollNo') as string;
        const department = formData.get('department') as string;
        const utrId = formData.get('utrId') as string;
        const amount = formData.get('amount') as string;
        const screenshot = formData.get('screenshot') as File;
        const teamMembersStr = formData.get('teamMembers') as string | null; // Optional team members

        // 1. Validation
        // 1. Validation
        if (!eventId || !eventName || !name || !email || !rollNo || !department || !utrId || !amount || !screenshot) {
            return NextResponse.json({ error: 'Missing required fields or file.' }, { status: 400 });
        }

        // Validate Roll Number (Exactly 12 digits)
        if (!/^\d{12}$/.test(rollNo)) {
            return NextResponse.json({ error: 'Roll Number must be exactly 12 digits.' }, { status: 400 });
        }

        // Validate File Size (3MB)
        if (screenshot.size > 3 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size too large. Max 3MB.' }, { status: 400 });
        }

        // Validate File Type
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(screenshot.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and PDF allowed.' }, { status: 400 });
        }

        const normalizedUTR = utrId.trim().toUpperCase();
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (!spreadsheetId || !driveFolderId) {
            console.error('Missing env configuration');
            return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
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

        // 4. Append to Google Sheet
        const registrationId = uuidv4();
        const timestamp = new Date().toISOString();
        const status = 'PENDING';

        const rowData = [
            timestamp,
            registrationId,
            eventId,
            eventName,
            name,
            email,
            rollNo,
            department,
            normalizedUTR,
            amount,
            driveFile.id || '',
            driveFile.webViewLink || '',
            driveFile.webContentLink || '',
            status,
            '', // Column O - checkedInAt (empty initially)
            teamMembersStr || '' // Column P - Team Members JSON
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
            rollNo
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
