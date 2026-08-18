export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireCoordinator, requireParticipant } from '@/lib/ps-auth';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const eventId = searchParams.get('eventId');
        
        if (!eventId) {
            return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
        }

        // Determine context (Coordinator or Participant)
        const coordinator = await requireCoordinator(request, eventId);
        const participant = coordinator ? { error: 'skipped' } : await requireParticipant(request, false);
        
        const admin = createAdminClient();
        
        let query = admin
            .from('ps_contests')
            .select('id, title, week_number, starts_at, ends_at, duration_minutes, total_questions, is_published, results_published')
            .eq('event_id', eventId)
            .order('starts_at', { ascending: true });

        // If not a coordinator, only show published contests
        if (!coordinator) {
            query = query.eq('is_published', true);
        }

        const { data: contests, error } = await query;
        if (error) throw error;

        // Fetch participant submissions if a participant is logged in
        let userSubmissions = {};
        if (!participant.error) {
            const contestIds = contests.map(c => c.id);
            if (contestIds.length > 0) {
                const { data: subs } = await admin
                    .from('ps_contest_submissions')
                    .select('contest_id, submitted_at, started_at')
                    .eq('participant_id', participant.participantId)
                    .in('contest_id', contestIds);
                
                subs?.forEach(sub => {
                    userSubmissions[sub.contest_id] = sub;
                });
            }
        }

        const now = new Date().getTime();

        const formattedContests = contests.map(c => {
            const startsAt = new Date(c.starts_at).getTime();
            const endsAt = new Date(c.ends_at).getTime();
            
            let status = 'upcoming';
            if (now >= startsAt && now <= endsAt) status = 'active';
            if (now > endsAt) status = 'ended';

            const sub = userSubmissions[c.id];
            
            return {
                id: c.id,
                title: c.title,
                weekNumber: c.week_number,
                startsAt: c.starts_at,
                endsAt: c.ends_at,
                durationMinutes: c.duration_minutes,
                totalQuestions: c.total_questions,
                isPublished: Boolean(c.is_published),
                resultsPublished: Boolean(c.results_published),
                status,
                hasStarted: !!sub,
                hasSubmitted: !!(sub && sub.submitted_at)
            };
        });

        return NextResponse.json({ contests: formattedContests });

    } catch (error) {
        console.error('Contests GET API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch contests' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { eventId, title, weekNumber, description, startsAt, endsAt, durationMinutes } = body;

        if (!eventId || !title || !startsAt || !endsAt || !durationMinutes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const coordinator = await requireCoordinator(request, eventId);
        if (!coordinator) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
        }
        
        const start = new Date(startsAt);
        const end = new Date(endsAt);
        if (end <= start) {
            return NextResponse.json({ error: 'endsAt must be after startsAt' }, { status: 400 });
        }
        if (durationMinutes < 5 || durationMinutes > 180) {
            return NextResponse.json({ error: 'durationMinutes must be between 5 and 180' }, { status: 400 });
        }

        const admin = createAdminClient();
        
        const { data: contest, error } = await admin
            .from('ps_contests')
            .insert({
                event_id: eventId,
                title,
                week_number: weekNumber || null,
                description: description || null,
                starts_at: startsAt,
                ends_at: endsAt,
                duration_minutes: durationMinutes
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ contest });

    } catch (error) {
        console.error('Contests POST API Error:', error);
        return NextResponse.json({ error: 'Failed to create contest' }, { status: 500 });
    }
}
