import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // 1. Check Supabase (Admins)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            return NextResponse.json({
                hasUser: true,
                role: user?.app_metadata?.role,
                eventId: user?.app_metadata?.event_id,
                email: user?.email,
                isCoordinator: user?.app_metadata?.role === 'coordinator' && !!user?.app_metadata?.event_id
            });
        }

        // 2. Check Custom JWT (Coordinators)
        const cookieStore = await cookies();
        const token = cookieStore.get('coordinator_token')?.value;
        if (token) {
            const payload = await verifyToken(token);
            if (payload?.type === 'coordinator') {
                return NextResponse.json({
                    hasUser: true,
                    role: 'coordinator',
                    eventId: payload.eventId,
                    email: payload.email,
                    isCoordinator: true
                });
            }
        }

        return NextResponse.json({
            hasUser: false,
            isCoordinator: false
        });
    } catch (error) {
        return NextResponse.json({
            error: error.message,
            hasUser: false
        }, { status: 500 });
    }
}
