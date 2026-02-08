import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Route Protection
 * Protects admin and coordinator routes by checking for auth tokens
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- Admin Route Protection ---
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
        const adminToken = request.cookies.get('admin_token');

        if (!adminToken?.value) {
            // Redirect to admin login if no token
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // --- Coordinator Route Protection ---
    if (pathname.startsWith('/coordinator') && !pathname.startsWith('/coordinator/login')) {
        const coordinatorSession = request.cookies.get('coordinator_session');

        if (!coordinatorSession?.value) {
            const loginUrl = new URL('/coordinator/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // --- Network Route Protection ---
    if (pathname.startsWith('/network') && !pathname.startsWith('/network/login')) {
        const networkToken = request.cookies.get('network_token');

        if (!networkToken?.value) {
            const loginUrl = new URL('/network/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
    matcher: [
        '/admin/:path*',
        '/coordinator/:path*',
        '/network/:path*'
    ]
};
