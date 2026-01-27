import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'src/data/events.json');

function requireAdmin(request) {
    const isLoggedIn = request.cookies.get('admin_session')?.value === 'true';
    if (!isLoggedIn) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

async function readEvents() {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const data = JSON.parse(fileContents);
    return Array.isArray(data) ? data : [];
}

async function writeEvents(events) {
    await fs.writeFile(dataFilePath, JSON.stringify(events, null, 4) + '\n', 'utf8');
}

export async function GET(_request, { params }) {
    try {
        const { id } = await params;
        const events = await readEvents();
        const event = events.find(e => String(e?.id) === String(id));
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }
        return NextResponse.json(event);
    } catch (error) {
        console.error('Error reading event:', error);
        return NextResponse.json({ error: 'Failed to load event' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const auth = requireAdmin(request);
    if (auth) return auth;

    try {
        const { id } = await params;
        const patch = await request.json();

        const events = await readEvents();
        const idx = events.findIndex(e => String(e?.id) === String(id));
        if (idx === -1) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Prevent changing the primary key.
        const next = { ...events[idx], ...patch, id: String(id) };
        if (!next.title || !next.date) {
            return NextResponse.json({ error: 'title and date are required' }, { status: 400 });
        }

        events[idx] = next;
        await writeEvents(events);
        return NextResponse.json(next);
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const auth = requireAdmin(request);
    if (auth) return auth;

    try {
        const { id } = await params;
        const events = await readEvents();
        const nextEvents = events.filter(e => String(e?.id) !== String(id));
        if (nextEvents.length === events.length) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        await writeEvents(nextEvents);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
