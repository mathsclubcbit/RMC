import { NextResponse } from 'next/server';
import { getAnnouncements, createAnnouncement } from '@/lib/google';
import { v4 as uuidv4 } from 'uuid';

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
        return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        // Basic Validation
        if (!body.title || !body.content || !body.category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newAnnouncement = {
            id: uuidv4(),
            title: body.title,
            content: body.content,
            category: body.category,
            date: new Date().toISOString().split('T')[0],
            postedBy: body.postedBy || 'President'
        };

        if (SPREADSHEET_ID) {
            await createAnnouncement(SPREADSHEET_ID, newAnnouncement);
        } else {
            console.log("Mock saved:", newAnnouncement);
        }

        return NextResponse.json({ success: true, data: newAnnouncement });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
    }
}
