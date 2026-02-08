"use server";

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Simple admin check - verify admin session cookie exists
async function isAdmin() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_token');
    return adminSession?.value ? true : false;
}

// POST: Create new gallery event/album
export async function POST(request) {
    try {
        if (!await isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, description, category, event_date, cover_image } = body;

        if (!title) {
            return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('gallery_events')
            .insert({ title, description, category, event_date, cover_image })
            .select()
            .single();

        if (error) {
            console.error('Gallery event insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (err) {
        console.error('Gallery events API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove gallery event/album and its images
export async function DELETE(request) {
    try {
        if (!await isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // First delete all images in this event
        const { error: imagesError } = await supabase
            .from('gallery_images')
            .delete()
            .eq('event_id', id);

        if (imagesError) {
            console.error('Error deleting event images:', imagesError);
            return NextResponse.json({ error: 'Failed to delete album images: ' + imagesError.message }, { status: 500 });
        }

        // Then delete the event itself
        const { error: eventError } = await supabase
            .from('gallery_events')
            .delete()
            .eq('id', id);

        if (eventError) {
            console.error('Gallery event delete error:', eventError);
            return NextResponse.json({ error: eventError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Gallery events API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
