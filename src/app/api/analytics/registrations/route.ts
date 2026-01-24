import { NextRequest, NextResponse } from 'next/server';
import { getAllRegistrations, RegistrationData } from '@/lib/google';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get('eventId');
        const status = searchParams.get('status');
        const department = searchParams.get('department');
        const search = searchParams.get('search')?.toLowerCase();
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Try to fetch from Google Sheets
        let registrations: RegistrationData[] = [];
        let departments: string[] = [];
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (spreadsheetId && (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_SERVICE_ACCOUNT_JSON)) {
            try {
                registrations = await getAllRegistrations(spreadsheetId);
                departments = [...new Set(registrations.map(r => r.department).filter(Boolean))];
            } catch (googleError) {
                console.error('Google Sheets fetch failed:', googleError);
                // Continue with empty registrations
            }
        }

        // Apply filters
        if (eventId) {
            registrations = registrations.filter(r => r.eventId === eventId);
        }
        if (status && status !== 'all') {
            registrations = registrations.filter(r => r.status === status);
        }
        if (department && department !== 'all') {
            registrations = registrations.filter(r => r.department === department);
        }
        if (search) {
            registrations = registrations.filter(r =>
                r.name.toLowerCase().includes(search) ||
                r.email.toLowerCase().includes(search) ||
                r.eventName.toLowerCase().includes(search) ||
                r.rollNo.toLowerCase().includes(search)
            );
        }

        // Get total before pagination
        const total = registrations.length;

        // Sort by timestamp descending (newest first)
        registrations.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // Apply pagination
        const paginatedData = registrations.slice(offset, offset + limit);

        return NextResponse.json({
            registrations: paginatedData,
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
            departments,
            dataSource: total > 0 ? 'google_sheets' : 'no_data'
        });
    } catch (error: any) {
        console.error('Registrations Fetch Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch registrations' }, { status: 500 });
    }
}
