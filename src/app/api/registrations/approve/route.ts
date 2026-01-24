import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationById, updateRegistrationStatus } from '@/lib/google';
import { sendTicketEmail } from '@/lib/email';
import { upcomingEvents } from '@/data/upcomingEvents';

interface EventData {
    id: string;
    title: string;
    date?: string;
    time?: string;
    location?: string;
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { registrationId, action } = body;

        if (!registrationId) {
            return NextResponse.json(
                { success: false, error: 'Registration ID is required' },
                { status: 400 }
            );
        }

        if (!action || !['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Action must be APPROVE or REJECT' },
                { status: 400 }
            );
        }

        if (!SHEET_ID) {
            return NextResponse.json(
                { success: false, error: 'Google Sheet not configured' },
                { status: 500 }
            );
        }

        // Get the registration details
        const registration = await getRegistrationById(SHEET_ID, registrationId);

        if (!registration) {
            return NextResponse.json(
                { success: false, error: 'Registration not found' },
                { status: 404 }
            );
        }

        // Check if already processed
        if (registration.status === 'APPROVED' && action === 'APPROVE') {
            return NextResponse.json(
                { success: false, error: 'Registration is already approved' },
                { status: 400 }
            );
        }

        // Update status
        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const updateResult = await updateRegistrationStatus(SHEET_ID, registrationId, newStatus);

        if (!updateResult.success) {
            return NextResponse.json(
                { success: false, error: updateResult.error },
                { status: 500 }
            );
        }

        let emailSent = false;

        // Send ticket email only on approval
        if (action === 'APPROVE') {
            // Get event details
            const event = (upcomingEvents as EventData[]).find((e: EventData) => e.id === registration.eventId);

            // Format date nicely
            const eventDate = event?.date || 'TBD';
            const eventTime = event?.time || 'TBD';
            const eventVenue = event?.location || 'TBD';

            emailSent = await sendTicketEmail({
                toEmail: registration.email,
                participantName: registration.name,
                eventName: registration.eventName,
                eventDate: eventDate,
                eventTime: eventTime,
                eventVenue: eventVenue,
                registrationId: registration.registrationId,
                department: registration.department,
                rollNo: registration.rollNo,
            });
        }

        return NextResponse.json({
            success: true,
            message: action === 'APPROVE'
                ? 'Registration approved successfully'
                : 'Registration rejected',
            emailSent: action === 'APPROVE' ? emailSent : null,
            registration: {
                id: registrationId,
                name: registration.name,
                email: registration.email,
                status: newStatus
            }
        });

    } catch (error) {
        console.error('Registration approval error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET method to check approval status
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const registrationId = searchParams.get('registrationId');

    if (!registrationId) {
        return NextResponse.json(
            { success: false, error: 'Registration ID is required' },
            { status: 400 }
        );
    }

    if (!SHEET_ID) {
        return NextResponse.json(
            { success: false, error: 'Google Sheet not configured' },
            { status: 500 }
        );
    }

    try {
        const registration = await getRegistrationById(SHEET_ID, registrationId);

        if (!registration) {
            return NextResponse.json(
                { success: false, error: 'Registration not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            registration: {
                id: registration.registrationId,
                name: registration.name,
                email: registration.email,
                eventName: registration.eventName,
                status: registration.status
            }
        });
    } catch (error) {
        console.error('Error fetching registration:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
