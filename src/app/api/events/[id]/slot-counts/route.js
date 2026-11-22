import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/events/[id]/slot-counts
 * Returns the count of registrations per time slot for a given event.
 * Used by the registration form to show remaining capacity.
 */
export async function GET(_request, { params }) {
    try {
        const { id } = await params;

        const supabase = createAdminClient();

        // Query registrations grouped by time_slot for this event
        const { data, error } = await supabase
            .from('registrations')
            .select('time_slot')
            .eq('event_id', String(id))
            .not('time_slot', 'is', null);

        if (error) {
            console.error('Error fetching slot counts:', error);
            return NextResponse.json({ slotCounts: {} });
        }

        // Count registrations per slot
        const slotCounts = {};
        for (const row of (data || [])) {
            if (row.time_slot) {
                slotCounts[row.time_slot] = (slotCounts[row.time_slot] || 0) + 1;
            }
        }

        return NextResponse.json({ slotCounts });
    } catch (error) {
        console.error('Slot counts error:', error);
        return NextResponse.json({ slotCounts: {} });
    }
}
