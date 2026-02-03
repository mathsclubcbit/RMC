import { NextResponse } from 'next/server';
import { getAnnouncements } from '@/lib/google';
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function GET() {
    try {
        if (!SPREADSHEET_ID) {
            // Fallback for demo if no sheet ID
            return NextResponse.json([{
                id: 'demo-1',
                title: 'System Initialized',
                content: 'Welcome to the RMC Portal. This is a demo announcement.',
                category: 'System',
                date: new Date().toISOString().split('T')[0],
                postedBy: 'System'
            }]);
        }

        const data = await getAnnouncements(SPREADSHEET_ID);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Announcements API Error:', error);
        return NextResponse.json([], { status: 200 });
    }
}
