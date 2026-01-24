import { NextRequest, NextResponse } from 'next/server';
import { generateQRCode, generateStyledQRCode } from '@/lib/qrcode';
import { getAllRegistrations } from '@/lib/google';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ registrationId: string }> }
) {
    try {
        const { registrationId } = await params;

        if (!registrationId) {
            return NextResponse.json({ error: 'Registration ID required' }, { status: 400 });
        }

        // Try to fetch registration from Google Sheets
        let registration = null;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (spreadsheetId && (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_SERVICE_ACCOUNT_JSON)) {
            try {
                const allRegistrations = await getAllRegistrations(spreadsheetId);
                registration = allRegistrations.find(r => r.registrationId === registrationId);
            } catch (error) {
                console.error('Failed to fetch registration:', error);
            }
        }

        // Get event details
        let event = null;
        if (registration) {
            try {
                const eventsPath = path.join(process.cwd(), 'src/data/events.json');
                const eventsData = await fs.readFile(eventsPath, 'utf8');
                const events = JSON.parse(eventsData);
                event = events.find((e: any) => e.id === registration.eventId);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        }

        // Generate QR code with teal color
        const qrCodeDataUrl = await generateStyledQRCode(registrationId, {
            size: 300,
            darkColor: '#0D9488' // Teal-600
        });

        return NextResponse.json({
            registrationId,
            qrCode: qrCodeDataUrl,
            registration: registration ? {
                name: registration.name,
                email: registration.email,
                rollNo: registration.rollNo,
                department: registration.department,
                eventId: registration.eventId,
                eventName: registration.eventName,
                amount: registration.amount,
                status: registration.status,
                timestamp: registration.timestamp,
                teamMembers: registration.teamMembers
            } : null,
            event: event ? {
                id: event.id,
                title: event.title,
                date: event.date,
                time: event.time,
                venue: event.venue,
                img: event.img
            } : null,
            isValid: registration?.status === 'APPROVED'
        });
    } catch (error: any) {
        console.error('Ticket API Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate ticket' }, { status: 500 });
    }
}
