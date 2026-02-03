import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        return NextResponse.json({
            hasUser: !!user,
            role: user?.app_metadata?.role,
            eventId: user?.app_metadata?.event_id,
            email: user?.email,
            error: error?.message,
            isCoordinator: user?.app_metadata?.role === 'coordinator' && !!user?.app_metadata?.event_id
        });
    } catch (error) {
        return NextResponse.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
}
