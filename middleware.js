import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (Token Bucket-ish)
// Note: In a serverless environment (Vercel), this map might be reset frequently.
// For production scale, use Redis (Upstash) or a database.
const rateLimitMap = new Map();

export async function middleware(request) {
    let supabaseResponse = NextResponse.next({ request });

    // ==========================================
    // 1. RATE LIMITING FOR API ROUTES
    // ==========================================
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

        // CORS Headers for API
        supabaseResponse.headers.set('Access-Control-Allow-Origin', '*');
        supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // ==========================================
    // 2. AUTH PROTECTION FOR /network ROUTES
    // ==========================================
    if (request.nextUrl.pathname.startsWith('/network')) {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            request.cookies.set(name, value);
                        });
                        supabaseResponse = NextResponse.next({ request });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            supabaseResponse.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // Refresh session if expired
        const { data: { user } } = await supabase.auth.getUser();

        const isLoginPage = request.nextUrl.pathname === '/network/login';

        // Protected routes logic
        if (!isLoginPage && !user) {
            // Not logged in, redirect to login
            const url = request.nextUrl.clone();
            url.pathname = '/network/login';
            return NextResponse.redirect(url);
        }

        if (isLoginPage && user) {
            // Already logged in, redirect to dashboard
            const url = request.nextUrl.clone();
            url.pathname = '/network/dashboard';
            return NextResponse.redirect(url);
        }
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        '/api/:path*',
        '/network/:path*',
    ],
};
