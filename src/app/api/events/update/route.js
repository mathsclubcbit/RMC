import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

const dataFilePath = path.join(process.cwd(), 'src/data/events.json');

export async function PUT(request) {
    try {
        const updatedEvent = await request.json();

        if (!updatedEvent.id) {
            return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
        }

        // Read existing events
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const events = JSON.parse(fileContents);

        // Find and update
        const index = events.findIndex(e => e.id === updatedEvent.id);

        if (index === -1) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Update the event, preserving any fields not sent (though we expect full object usually)
        // Ensure special fields like participants aren't lost if not sent
        events[index] = { ...events[index], ...updatedEvent };

        await fs.writeFile(dataFilePath, JSON.stringify(events, null, 4), 'utf8');

        return NextResponse.json({ message: 'Event updated successfully', event: events[index] });
    } catch (error) {
        console.error("Error updating event:", error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}
