import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'event-images';

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key-replace-in-production');

function hasSupabaseConfig() {
    return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isMissingTableError(error) {
    return Boolean(error && (error.code === 'PGRST205' || String(error.message || '').includes("Could not find the table 'public.events'")));
}

async function requireAdmin(request) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        if (payload?.type !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return null;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

function generateEventId() {
    // Short, URL-friendly id.
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
    if (!hasSupabaseConfig()) {
        return NextResponse.json([], { status: 200 });
    }

    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('events')
            .select('id,title,date,payload,created_at,updated_at')
            .order('date', { ascending: false });

        if (error) {
            if (isMissingTableError(error)) {
                console.warn("Supabase table public.events is missing; returning empty events list.");
                return NextResponse.json([], { status: 200 });
            }
            console.error('Error loading events from Supabase:', error);
            return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
        }

        const events = (data || []).map((row) => ({
            ...(row.payload || {}),
            id: String(row.id),
            title: row.title,
            date: row.date,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        }));

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error reading events:', error);
        return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = await requireAdmin(request);
    if (auth) return auth;

    if (!hasSupabaseConfig()) {
        return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
    }

    try {
        const contentType = request.headers.get('content-type') || '';

        /** @type {any} */
        let payload;
        /** @type {{ imgFile?: File, posterDesktopFile?: File, posterMobileFile?: File }} */
        const files = {};

        if (contentType.includes('multipart/form-data')) {
            const form = await request.formData();
            const payloadRaw = form.get('payload');
            payload = typeof payloadRaw === 'string' ? JSON.parse(payloadRaw) : {};

            const imgFile = form.get('imgFile');
            if (imgFile instanceof File && imgFile.size > 0) files.imgFile = imgFile;

            const posterDesktopFile = form.get('posterDesktopFile');
            if (posterDesktopFile instanceof File && posterDesktopFile.size > 0) files.posterDesktopFile = posterDesktopFile;

            const posterMobileFile = form.get('posterMobileFile');
            if (posterMobileFile instanceof File && posterMobileFile.size > 0) files.posterMobileFile = posterMobileFile;
        } else {
            payload = await request.json();
        }

        const newEvent = {
            participants: 0,
            ...payload,
        };

        if (!newEvent.id) newEvent.id = generateEventId();
        newEvent.id = String(newEvent.id);

        const effectiveDate = newEvent.startDate || newEvent.date;
        if (!newEvent.title || !effectiveDate) {
            return NextResponse.json({ error: 'title and date are required' }, { status: 400 });
        }

        // Normalize date for sorting/filtering.
        newEvent.date = effectiveDate;

        const supabase = createAdminClient();

        // Create the event row first (so event creation doesn't depend on Storage bucket existence).
        const { data: inserted, error } = await supabase
            .from('events')
            .insert({
                id: newEvent.id,
                title: newEvent.title,
                date: newEvent.date,
                payload: newEvent,
            })
            .select('id,title,date,payload,created_at,updated_at')
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                return NextResponse.json(
                    {
                        error: "Supabase table 'public.events' is missing. Run the SQL in supabase/schema.sql to create it.",
                    },
                    { status: 500 }
                );
            }
            // Duplicate key or other constraint errors.
            const msg = String(error.message || '').toLowerCase();
            if (msg.includes('duplicate') || msg.includes('unique')) {
                return NextResponse.json({ error: 'id already exists' }, { status: 409 });
            }
            console.error('Error creating event (Supabase):', error);
            return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
        }

        /** @type {string[]} */
        const uploadErrors = [];

        // Upload images (if provided) and store public URLs into the payload.
        const uploadOne = async (file, field) => {
            const ext = String(file.name || 'image').split('.').pop() || 'png';
            const objectPath = `events/${newEvent.id}/${field}-${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(objectPath, file, {
                    contentType: file.type || 'application/octet-stream',
                    upsert: true,
                });

            if (uploadError) {
                const msg = String(uploadError.message || uploadError.error || uploadError);
                uploadErrors.push(`${field}: ${msg}`);
                return null;
            }

            const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
            return data?.publicUrl || null;
        };

        const patchedEvent = { ...(inserted?.payload || {}), id: String(inserted?.id || newEvent.id) };

        if (files.imgFile) {
            const url = await uploadOne(files.imgFile, 'img');
            if (url) patchedEvent.img = url;
        }
        if (files.posterDesktopFile) {
            const url = await uploadOne(files.posterDesktopFile, 'posterDesktop');
            if (url) patchedEvent.posterDesktop = url;
        }
        if (files.posterMobileFile) {
            const url = await uploadOne(files.posterMobileFile, 'posterMobile');
            if (url) patchedEvent.posterMobile = url;
        }

        // If any uploads succeeded (or attempted), persist patched payload.
        const anyUploadAttempted = Boolean(files.imgFile || files.posterDesktopFile || files.posterMobileFile);
        if (anyUploadAttempted) {
            await supabase
                .from('events')
                .update({
                    title: patchedEvent.title,
                    date: patchedEvent.date,
                    payload: patchedEvent,
                })
                .eq('id', String(inserted.id));
        }

        const responseEvent = {
            ...(patchedEvent || inserted?.payload || {}),
            id: String(inserted.id),
            title: inserted.title,
            date: inserted.date,
            createdAt: inserted.created_at,
            updatedAt: inserted.updated_at,
        };

        if (uploadErrors.length) {
            return NextResponse.json({ ...responseEvent, uploadErrors }, { status: 201 });
        }

        return NextResponse.json(responseEvent, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
