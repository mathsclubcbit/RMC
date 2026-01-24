import { NextRequest, NextResponse } from 'next/server';
import { getAllRegistrations } from '@/lib/google';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
    try {
        const { registrationId, eventId, adminType } = await req.json();

        if (!registrationId) {
            return NextResponse.json({
                valid: false,
                error: 'Registration ID required'
            }, { status: 400 });
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (!spreadsheetId) {
            // Demo mode: return success for testing
            return NextResponse.json({
                valid: true,
                message: 'Demo Mode: Check-in recorded',
                registration: {
                    registrationId,
                    name: 'Demo Participant',
                    status: 'APPROVED',
                    checkedIn: false
                },
                alreadyCheckedIn: false
            });
        }

        // Fetch all registrations to find the one being verified
        let registration = null;
        let rowIndex = -1;

        try {
            const allRegistrations = await getAllRegistrations(spreadsheetId);

            for (let i = 0; i < allRegistrations.length; i++) {
                if (allRegistrations[i].registrationId === registrationId) {
                    registration = allRegistrations[i];
                    rowIndex = i + 2; // +2 for 1-indexed and header row
                    break;
                }
            }
        } catch (error) {
            console.error('Failed to fetch registrations:', error);
            return NextResponse.json({
                valid: false,
                error: 'Failed to verify registration'
            }, { status: 500 });
        }

        if (!registration) {
            return NextResponse.json({
                valid: false,
                error: 'Registration not found',
                registrationId
            });
        }

        // Check if event matches (if eventId provided)
        if (eventId && registration.eventId !== eventId) {
            return NextResponse.json({
                valid: false,
                error: 'This ticket is for a different event',
                registration: {
                    registrationId: registration.registrationId,
                    eventName: registration.eventName,
                    name: registration.name
                }
            });
        }

        // Check if already approved
        if (registration.status !== 'APPROVED') {
            return NextResponse.json({
                valid: false,
                error: `Registration is ${registration.status}`,
                registration: {
                    registrationId: registration.registrationId,
                    name: registration.name,
                    status: registration.status
                }
            });
        }

        // Check if already checked in (using column O)
        const isAlreadyCheckedIn = registration.checkedInAt ? true : false;

        if (isAlreadyCheckedIn) {
            return NextResponse.json({
                valid: true,
                alreadyCheckedIn: true,
                message: 'Already checked in',
                registration: {
                    registrationId: registration.registrationId,
                    name: registration.name,
                    email: registration.email,
                    department: registration.department,
                    eventName: registration.eventName,
                    checkedInAt: registration.checkedInAt
                }
            });
        }

        // Mark as checked in by updating Google Sheet
        try {
            const authClient = await getAuthClient();
            const sheets = google.sheets({ version: 'v4', auth: authClient as any });

            const now = new Date().toISOString();

            // Update column O (CheckedInAt) - column 15
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Sheet1!O${rowIndex}`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[now]]
                }
            });

            return NextResponse.json({
                valid: true,
                alreadyCheckedIn: false,
                message: 'Check-in successful!',
                registration: {
                    registrationId: registration.registrationId,
                    name: registration.name,
                    email: registration.email,
                    department: registration.department,
                    eventName: registration.eventName,
                    checkedInAt: now
                }
            });
        } catch (updateError) {
            console.error('Failed to update check-in status:', updateError);

            // Still return valid but note the update failed
            return NextResponse.json({
                valid: true,
                alreadyCheckedIn: false,
                message: 'Valid ticket (check-in logging failed)',
                registration: {
                    registrationId: registration.registrationId,
                    name: registration.name,
                    eventName: registration.eventName
                }
            });
        }

    } catch (error: any) {
        console.error('Attendance verification error:', error);
        return NextResponse.json({
            valid: false,
            error: error.message || 'Verification failed'
        }, { status: 500 });
    }
}

// Helper to get Google auth client
async function getAuthClient() {
    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
        : null;

    if (credentials) {
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        return auth.getClient();
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    return oauth2Client;
}
