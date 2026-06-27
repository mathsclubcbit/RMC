import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// JWT Secret for verification
const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) {
        return null;
    }
    return new TextEncoder().encode(rawSecret);
};

// Helper to verify JWT token
async function verifyJwt(token) {
    try {
        const secret = getJwtSecret();
        if (!secret) return null;
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

function createSupabaseMiddlewareClient(request, supabaseResponse) {
    const url = new URL(request.url);
    const cookieDomain = process.env.NODE_ENV === 'production'
        ? (url.hostname.includes('rmccbit.in') ? '.rmccbit.in' : url.hostname)
        : undefined;

    return createServerClient(
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
                        supabaseResponse.cookies.set(name, value, {
                            ...options,
                            domain: cookieDomain,
                            path: '/',
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'lax',
                        });
                    });
                },
            },
        }
    );
}

export async function middleware(request) {
    try {
        // Handle Protocol Redirects (Production Only)
        if (process.env.NODE_ENV === 'production') {
            const forwardedProto = request.headers.get('x-forwarded-proto');
            if (forwardedProto === 'http') {
                const url = request.nextUrl.clone();
                url.protocol = 'https:';
                return NextResponse.redirect(url);
            }

            const host = request.headers.get('host') || '';
            if (host === 'rmccbit.in') {
                const url = request.nextUrl.clone();
                url.host = 'www.rmccbit.in';
                return NextResponse.redirect(url);
            }
        }

        let supabaseResponse = NextResponse.next({ request });

        // ==========================================
        // CORS HEADERS FOR API ROUTES (Simplified)
        // ==========================================
        if (request.nextUrl.pathname.startsWith('/api')) {
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
                supabaseResponse.headers.set('Access-Control-Allow-Origin', 'https://rmccbit.in');
            }

            supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

            // Handle Preflight
            if (request.method === 'OPTIONS') {
                return new NextResponse(null, { headers: supabaseResponse.headers });
            }
        }

        // ==========================================
        // ADMIN SESSION PROTECTION
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
        // TEAM SESSION PROTECTION
        // ==========================================
        if (request.nextUrl.pathname.startsWith('/team')) {
            const isLoginPage = request.nextUrl.pathname === '/team/login';
            const token = request.cookies.get('team_token')?.value;
            const payload = token ? await verifyJwt(token) : null;
            const isLoggedIn = payload?.type === 'team';

            if (!isLoginPage && !isLoggedIn) {
                const url = request.nextUrl.clone();
                url.pathname = '/team/login';
                return NextResponse.redirect(url);
            }

            if (isLoginPage && isLoggedIn) {
                const url = request.nextUrl.clone();
                url.pathname = '/team/dashboard';
                return NextResponse.redirect(url);
            }
        }

        // ==========================================
        // NETWORK AUTH PROTECTION
        // ==========================================
        if (request.nextUrl.pathname.startsWith('/network')) {
            try {
                const supabase = createSupabaseMiddlewareClient(request, supabaseResponse);
                const { data: { user } } = await supabase.auth.getUser();

                const isLoginPage = request.nextUrl.pathname === '/network/login';

                if (!isLoginPage && !user) {
                    const url = request.nextUrl.clone();
                    url.pathname = '/network/login';
                    return NextResponse.redirect(url);
                }

                if (isLoginPage && user) {
                    const url = request.nextUrl.clone();
                    url.pathname = '/network/dashboard';
                    return NextResponse.redirect(url);
                }
            } catch (e) {
                console.error("Supabase middleware error:", e);
                // Continue without auth if Supabase fails, or redirect to login?
                // Safest is to continue or redirect to login.
                // For now, continue to avoid crash.
            }
        }

        return supabaseResponse;
    } catch (e) {
        console.error("Middleware Fatal Error:", e);
        return NextResponse.next();
    }
}

export const config = {
    matcher: [
        '/api/:path*',
        '/admin/:path*',
        '/coordinator/:path*',
        '/network/:path*',
        '/team/:path*',
    ],
};
