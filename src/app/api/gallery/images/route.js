
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Simple admin check - verify admin session cookie exists
async function isAdmin() {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_token');
    return adminSession?.value ? true : false;
}

// POST: Insert new gallery image
export async function POST(request) {
    try {
        // Check admin auth
        if (!await isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { url, width, height, event_id } = body;

        if (!url || !event_id) {
            return NextResponse.json({ error: 'Missing required fields: url, event_id' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { data, error } = await supabase
            .from('gallery_images')
            .insert({ url, width, height, event_id })
            .select()
            .single();

        if (error) {
            console.error('Gallery image insert error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (err) {
        console.error('Gallery API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove gallery image by ID
export async function DELETE(request) {
    try {
        if (!await isAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing image id' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('gallery_images')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Gallery image delete error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Gallery API error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
