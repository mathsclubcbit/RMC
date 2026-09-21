'use server'

import { cookies } from 'next/headers';

export async function loginToMplAdmin(password) {
    // We check against the env variable, defaulting to a fallback for local testing
    const correctPassword = process.env.MPL_ADMIN_PASSWORD || 'rmcmpl2026';
    
    if (password === correctPassword) {
        // Set a secure HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set('mpl_admin_auth', 'true', { 
            secure: process.env.NODE_ENV === 'production', 
            httpOnly: true,
            path: '/mpl/admin',
            maxAge: 60 * 60 * 24 // 1 day
        });
        return { success: true };
    }
    
    return { success: false, error: 'Incorrect password. Access denied.' };
}

export async function logoutFromMplAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete('mpl_admin_auth');
}
