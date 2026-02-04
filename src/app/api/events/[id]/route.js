import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';
import { getSecret } from '@/lib/jwt';
import bcrypt from 'bcrypt';
const SALT_ROUNDS = 12;

export const runtime = 'nodejs';

const STORAGE_BUCKET = 'event-images';

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
        const { payload } = await jwtVerify(token, getSecret());
        if (payload?.type !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return null;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

async function verifyAdminOrCoordinator(request, eventId) {
    // Check admin JWT
    const adminToken = request.cookies.get('admin_token')?.value;
    if (adminToken) {
        try {
            const { payload } = await jwtVerify(adminToken, getSecret());
            if (payload?.type === 'admin') return { authorized: true, isAdmin: true };
        } catch {
            // Invalid admin token, continue to check coordinator
        }
    }

    // Check coordinator JWT token (custom JWT, not Supabase auth)
    const coordinatorToken = request.cookies.get('coordinator_token')?.value;
    if (coordinatorToken) {
        try {
            const { payload } = await jwtVerify(coordinatorToken, getSecret());
            if (payload?.type === 'coordinator' && String(payload?.eventId) === String(eventId)) {
                return { authorized: true, isAdmin: false };
            }
        } catch {
            // Invalid coordinator token
        }
    }

    return { authorized: false };
}

export async function GET(_request, { params }) {
    if (!hasSupabaseConfig()) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    try {
        const { id } = await params;
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('events')
            .select('id,title,date,payload,created_at,updated_at')
            .eq('id', String(id))
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const event = {
            ...(data.payload || {}),
            id: String(data.id),
            title: data.title,
            date: data.date,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };

        return NextResponse.json(event);
    } catch (error) {
        console.error('Error reading event:', error);
        return NextResponse.json({ error: 'Failed to load event' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;

    // Authorization Check using JWT
    const { authorized } = await verifyAdminOrCoordinator(request, String(id));
    if (!authorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasSupabaseConfig()) {
        return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
    }

    try {
        const { id } = await params;

        const contentType = request.headers.get('content-type') || '';
        /** @type {any} */
        let patch;
        /** @type {{ imgFile?: File, posterDesktopFile?: File, posterMobileFile?: File }} */
        const files = {};

        if (contentType.includes('multipart/form-data')) {
            const form = await request.formData();
            const payloadRaw = form.get('payload');
            patch = typeof payloadRaw === 'string' ? JSON.parse(payloadRaw) : {};

            const imgFile = form.get('imgFile');
            if (imgFile instanceof File && imgFile.size > 0) files.imgFile = imgFile;

            const posterDesktopFile = form.get('posterDesktopFile');
            if (posterDesktopFile instanceof File && posterDesktopFile.size > 0) files.posterDesktopFile = posterDesktopFile;

            const samplePptFile = form.get('samplePptFile');
            if (samplePptFile instanceof File && samplePptFile.size > 0) files.samplePptFile = samplePptFile;
        } else {
            patch = await request.json();
        }

        const supabase = createAdminClient();

        const { data: existing, error: existingError } = await supabase
            .from('events')
            .select('id,title,date,payload')
            .eq('id', String(id))
            .single();

        if (existingError || !existing) {
            if (isMissingTableError(existingError)) {
                return NextResponse.json(
                    { error: "Supabase table 'public.events' is missing. Run the SQL in supabase/schema.sql to create it." },
                    { status: 500 }
                );
            }
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Handle password: if new password provided, hash it; otherwise preserve existing
        let passwordData = {};
        if (patch.password && patch.password.trim()) {
            // New password provided - hash it
            const hashedPassword = await bcrypt.hash(patch.password.trim(), SALT_ROUNDS);
            passwordData = {
                password: hashedPassword,
                passwordHashed: true
            };
            delete patch.password; // Remove plaintext from patch
        } else {
            // No new password - preserve existing password and flag
            passwordData = {
                password: existing.payload?.password,
                passwordHashed: existing.payload?.passwordHashed
            };
            delete patch.password; // Remove empty password from patch
        }

        // Merge existing payload with patch, then apply password data
        const next = {
            ...(existing.payload || {}),
            ...(patch || {}),
            ...passwordData,
            id: String(id)
        };

        const effectiveDate = next.startDate || next.date;
        if (!next.title || !effectiveDate) {
            return NextResponse.json({ error: 'title and date are required' }, { status: 400 });
        }
        next.date = effectiveDate;

        /** @type {string[]} */
        const uploadErrors = [];

        const uploadOne = async (file, field) => {
            const ext = String(file.name || 'image').split('.').pop() || 'png';
            const objectPath = `events/${String(id)}/${field}-${Date.now()}.${ext}`;
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

        if (files.imgFile) {
            const url = await uploadOne(files.imgFile, 'img');
            if (url) next.img = url;
        }
        if (files.posterDesktopFile) {
            const url = await uploadOne(files.posterDesktopFile, 'posterDesktop');
            if (url) next.posterDesktop = url;
        }
        if (files.samplePptFile) {
            const url = await uploadOne(files.samplePptFile, 'samplePpt');
            if (url) next.samplePpt = url;
        }

        const { data: updated, error } = await supabase
            .from('events')
            .update({
                title: next.title,
                date: next.date,
                payload: next,
            })
            .eq('id', String(id))
            .select('id,title,date,payload,created_at,updated_at')
            .single();

        if (error || !updated) {
            if (isMissingTableError(error)) {
                return NextResponse.json(
                    { error: "Supabase table 'public.events' is missing. Run the SQL in supabase/schema.sql to create it." },
                    { status: 500 }
                );
            }
            console.error('Error updating event (Supabase):', error);
            return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
        }

        const responseEvent = {
            ...(updated.payload || {}),
            id: String(updated.id),
            title: updated.title,
            date: updated.date,
            createdAt: updated.created_at,
            updatedAt: updated.updated_at,
        };

        if (uploadErrors.length) {
            return NextResponse.json({ ...responseEvent, uploadErrors });
        }

        return NextResponse.json(responseEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const auth = await requireAdmin(request);
    if (auth) return auth;

    if (!hasSupabaseConfig()) {
        return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
    }

    try {
        const { id } = await params;
        const supabase = createAdminClient();

        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', String(id));

        if (error) {
            if (isMissingTableError(error)) {
                return NextResponse.json(
                    { error: "Supabase table 'public.events' is missing. Run the SQL in supabase/schema.sql to create it." },
                    { status: 500 }
                );
            }
            console.error('Error deleting event (Supabase):', error);
            return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
