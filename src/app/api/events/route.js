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
