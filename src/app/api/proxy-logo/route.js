export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Map of company key -> local filename in /public/logos/
// SVG preferred, PNG fallback
const LOCAL_LOGO_MAP = {
    amazon:      'amazon.svg',
    cognizant:   'cognizant.svg',
    deloitte:    'deloitte.png',
    goldman:     'goldman.svg',
    google:      'google.svg',
    hcl:         'hcl.png',
    ibm:         'ibm.svg',
    infosys:     'infosys.svg',
    microsoft:   'microsoft.svg',
    salesforce:  'salesforce.svg',
    tcs:         'tcs.png',
    wipro:       'wipro.svg',
};

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const company = searchParams.get('company');

    if (!company || !LOCAL_LOGO_MAP[company]) {
        return new NextResponse('Company not found', { status: 404 });
    }

    try {
        const filename = LOCAL_LOGO_MAP[company];
        const filePath = path.join(process.cwd(), 'public', 'logos', filename);

        if (!fs.existsSync(filePath)) {
            return new NextResponse('Logo file not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.svg' ? 'image/svg+xml' : 'image/png';

        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=604800',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (err) {
        console.error('Logo proxy error:', err);
        return new NextResponse('Failed to serve logo', { status: 500 });
    }
}
