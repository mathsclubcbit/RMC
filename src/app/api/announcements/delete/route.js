import { NextResponse } from 'next/server';
import { deleteAnnouncement } from '@/lib/google';
import { isAdminAuthenticated } from '@/app/admin/actions';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

export async function POST(request) {
    // 1. Check Auth
    if (!(await isAdminAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
        }

        if (!SPREADSHEET_ID) {
            return NextResponse.json({ error: 'Google Sheet ID not configured' }, { status: 500 });
        }

        // 2. Delete from Google Sheets
        await deleteAnnouncement(SPREADSHEET_ID, id);

        return NextResponse.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Delete announcement error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to delete announcement'
        }, { status: 500 });
    }
}
