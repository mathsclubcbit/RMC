import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'src/data/events.json');

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
    try {
        const newEvent = await request.json();

        // Read existing
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const events = JSON.parse(fileContents);

        // Re-assign ID to be safe based on current length (or UUID)
        // If frontend sends an ID, we might override it or keep it.
        // The frontend logic used: id: `u${events.length + 1}`
        // Let's respect the object sent but ensure it's added.

        const updatedEvents = [...events, newEvent];

        await fs.writeFile(dataFilePath, JSON.stringify(updatedEvents, null, 4), 'utf8');

        return NextResponse.json({ message: 'Event created', event: newEvent });
    } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
