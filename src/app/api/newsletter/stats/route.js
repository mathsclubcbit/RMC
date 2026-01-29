import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/jwt';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Verify Admin Session
        const cookieStore = await cookies();
        const token = cookieStore.get('admin_token')?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const { payload } = await jwtVerify(token, getSecret());
            if (payload?.type !== 'admin') {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch (err) {
            return NextResponse.json({ error: "Invalid Session" }, { status: 401 });
        }

        // 2. Fetch Stats using Service Role (Bypassing RLS)
        const { count, error } = await supabase
            .from('newsletter_subscribers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

        if (error) throw error;

        return NextResponse.json({ count: count || 0 });

    } catch (error) {
        console.error("Newsletter Stats Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
