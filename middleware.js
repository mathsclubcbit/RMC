import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (Token Bucket-ish)
// Note: In a serverless environment (Vercel), this map might be reset frequently.
// For production scale, use Redis (Upstash) or a database.
const rateLimitMap = new Map();

export function middleware(request) {
    // Only rate limit API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
        const limit = 100; // Limit per window
        const windowMs = 60 * 1000; // 1 minute window

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, {
                count: 0,
                lastReset: Date.now()
            });
        }

        const ipData = rateLimitMap.get(ip);

        // Reset if window passed
        if (Date.now() - ipData.lastReset > windowMs) {
            ipData.count = 0;
            ipData.lastReset = Date.now();
        }

        if (ipData.count >= limit) {
            return new NextResponse(
                JSON.stringify({ error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.' }),
                { status: 429, headers: { 'Content-Type': 'application/json' } }
            );
        }

        ipData.count += 1;
    }

    // Default response
    const response = NextResponse.next();

    // CORS Headers for API
    if (request.nextUrl.pathname.startsWith('/api')) {
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    return response;
}

export const config = {
    matcher: [
        '/api/:path*',
    ],
};
