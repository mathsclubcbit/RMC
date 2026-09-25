import { cookies } from 'next/headers';

export async function isMplAdmin() {
    const cookieStore = await cookies();
    return cookieStore.get('mpl_admin_auth')?.value === 'true';
}

export async function requireMplAdmin() {
    if (!(await isMplAdmin())) {
        return Response.json({ error: 'MPL organiser authentication required.' }, { status: 401 });
    }
    return null;
}
