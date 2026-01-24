import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'src/data/events.json');

export async function DELETE(request) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        // Read existing events
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        let events = JSON.parse(fileContents);

        // Filter out event
        const newEvents = events.filter(e => e.id !== id);

        if (newEvents.length === events.length) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        await fs.writeFile(dataFilePath, JSON.stringify(newEvents, null, 4), 'utf8');

        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
