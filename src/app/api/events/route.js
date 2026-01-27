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

function generateEventId() {
    // Short, URL-friendly id.
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileContents);
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading events:", error);
        return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
    }
}

export async function POST(request) {
    const auth = requireAdmin(request);
    if (auth) return auth;

    try {
        const body = await request.json();
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const data = JSON.parse(fileContents);
        const events = Array.isArray(data) ? data : [];

        const newEvent = {
            participants: 0,
            ...body,
        };

        if (!newEvent.id) newEvent.id = generateEventId();
        newEvent.id = String(newEvent.id);

        if (!newEvent.title || !newEvent.date) {
            return NextResponse.json({ error: 'title and date are required' }, { status: 400 });
        }

        const exists = events.some(e => String(e?.id) === String(newEvent.id));
        if (exists) {
            return NextResponse.json({ error: 'id already exists' }, { status: 409 });
        }

        events.push(newEvent);
        await fs.writeFile(dataFilePath, JSON.stringify(events, null, 4) + '\n', 'utf8');

        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
