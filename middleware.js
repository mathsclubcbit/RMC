import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Simple in-memory rate limiter (Token Bucket-ish)
// Note: In a serverless environment (Vercel), this map might be reset frequently.
// For production scale, use Redis (Upstash) or a database.
const rateLimitMap = new Map();

// JWT Secret for verification
const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) {
        throw new Error("JWT_SECRET environment variable is not defined");
    }
    return new TextEncoder().encode(rawSecret);
};

// Helper to verify JWT token
async function verifyJwt(token) {
    try {
        const { payload } = await jwtVerify(token, getJwtSecret());
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request) {
    let supabaseResponse = NextResponse.next({ request });

    // ==========================================
    // 0. ADMIN SESSION PROTECTION FOR /admin ROUTES
    // ==========================================
    if (request.nextUrl.pathname.startsWith('/admin')) {
        const isLoginPage = request.nextUrl.pathname === '/admin/login';
        const token = request.cookies.get('admin_token')?.value;
        const payload = token ? await verifyJwt(token) : null;
        const isLoggedIn = payload?.type === 'admin';

        if (!isLoginPage && !isLoggedIn) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin/login';
            return NextResponse.redirect(url);
        }

        if (isLoginPage && isLoggedIn) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin';
            return NextResponse.redirect(url);
        }
    }

    // ==========================================
    // 0.5. COORDINATOR SESSION PROTECTION
    // ==========================================
    if (request.nextUrl.pathname.startsWith('/coordinator')) {
        const isLoginPage = request.nextUrl.pathname === '/coordinator/login';
        const token = request.cookies.get('coordinator_token')?.value;

        // Debug logging for production
        console.log('[Middleware] Coordinator route:', request.nextUrl.pathname);
        console.log('[Middleware] Token exists:', !!token);
        console.log('[Middleware] Token length:', token?.length || 0);

        const payload = token ? await verifyJwt(token) : null;
        const isLoggedIn = payload?.type === 'coordinator';

        console.log('[Middleware] Payload type:', payload?.type);
        console.log('[Middleware] isLoggedIn:', isLoggedIn);

        if (!isLoginPage && !isLoggedIn) {
            console.log('[Middleware] Redirecting to login - not authenticated');
            const url = request.nextUrl.clone();
            url.pathname = '/coordinator/login';
            return NextResponse.redirect(url);
        }

        if (isLoginPage && isLoggedIn) {
            const url = request.nextUrl.clone();
            url.pathname = '/coordinator/dashboard';
            return NextResponse.redirect(url);
        }
    }

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
        const origin = request.headers.get('origin');
        const allowedOrigins = [
            'https://rmccbit.in',
            'https://www.rmccbit.in',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000'
        ];

        if (origin && allowedOrigins.includes(origin)) {
            supabaseResponse.headers.set('Access-Control-Allow-Origin', origin);
        } else if (!origin) {
            // Allow tools like Postman/curl if needed, or leave it restricted.
            // For browsers, if no origin is sent, it's usually a same-site request or direct navigation.
            // We set a safe default.
            supabaseResponse.headers.set('Access-Control-Allow-Origin', 'https://rmccbit.in');
        }

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
                        cookiesToSet.forEach(({ name, value }) => {
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
        '/admin/:path*',
        '/coordinator/:path*',
        '/network/:path*',
    ],
};
