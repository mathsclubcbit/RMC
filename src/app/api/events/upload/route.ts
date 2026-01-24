import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();

        const eventId = formData.get('eventId') as string;
        const posterMobile = formData.get('posterMobile') as File | null;
        const posterDesktop = formData.get('posterDesktop') as File | null;

        if (!eventId) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        const uploadDir = path.join(process.cwd(), 'public', 'assets', 'events');

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Directory may already exist
        }

        const results: { posterMobile?: string; posterDesktop?: string } = {};

        // Process mobile poster
        if (posterMobile && posterMobile.size > 0) {
            const validation = validateFile(posterMobile);
            if (validation.error) {
                return NextResponse.json({ error: `Mobile poster: ${validation.error}` }, { status: 400 });
            }

            const ext = getExtension(posterMobile.type);
            const filename = `${eventId}-mobile.${ext}`;
            const filepath = path.join(uploadDir, filename);

            const buffer = Buffer.from(await posterMobile.arrayBuffer());
            await writeFile(filepath, buffer);

            results.posterMobile = `/assets/events/${filename}`;
        }

        // Process desktop poster
        if (posterDesktop && posterDesktop.size > 0) {
            const validation = validateFile(posterDesktop);
            if (validation.error) {
                return NextResponse.json({ error: `Desktop poster: ${validation.error}` }, { status: 400 });
            }

            const ext = getExtension(posterDesktop.type);
            const filename = `${eventId}-desktop.${ext}`;
            const filepath = path.join(uploadDir, filename);

            const buffer = Buffer.from(await posterDesktop.arrayBuffer());
            await writeFile(filepath, buffer);

            results.posterDesktop = `/assets/events/${filename}`;
        }

        if (Object.keys(results).length === 0) {
            return NextResponse.json({ error: 'At least one poster is required' }, { status: 400 });
        }

        return NextResponse.json({
            message: 'Posters uploaded successfully',
            ...results
        }, { status: 200 });

    } catch (error: any) {
        console.error('Poster upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}

function validateFile(file: File): { error?: string } {
    if (file.size > MAX_FILE_SIZE) {
        return { error: 'File size exceeds 5MB limit' };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
        return { error: 'Invalid file type. Only JPG, PNG, and WebP allowed' };
    }
    return {};
}

function getExtension(mimeType: string): string {
    switch (mimeType) {
        case 'image/jpeg': return 'jpg';
        case 'image/png': return 'png';
        case 'image/webp': return 'webp';
        default: return 'jpg';
    }
}
