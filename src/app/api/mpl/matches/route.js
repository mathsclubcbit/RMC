import { createAdminClient } from '@/lib/supabase/server';
import { requireMplAdmin } from '@/lib/mpl/admin-auth';

const MIN_TIMER_SECONDS = 10;
const ALLOWED_TIMER_ADJUSTMENTS = new Set([-30, 0, 30]);

function shuffle(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
}

function normalizeDistribution(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const distribution = {};
    for (const [slug, rawCount] of Object.entries(value)) {
        const count = Number(rawCount);
        if (!Number.isInteger(count) || count < 0) return null;
        if (count > 0) distribution[slug] = count;
    }
    return distribution;
}

export async function POST(request) {
    const authError = await requireMplAdmin();
    if (authError) return authError;

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const requestedSides = Array.isArray(body.sideTeamIds)
        ? body.sideTeamIds.map((side) => [...new Set((Array.isArray(side) ? side : []).map(String).filter(Boolean))])
        : [];
    const sideTeamIds = requestedSides.length === 2 ? requestedSides : [body.teamIds?.[0] ? [String(body.teamIds[0])] : [], body.teamIds?.[1] ? [String(body.teamIds[1])] : []];
    const teamIds = [...new Set(sideTeamIds.flat())];
    const sideNames = Array.isArray(body.sideNames) ? body.sideNames.map((name, index) => String(name || `Team ${index + 1}`).trim()) : ['Team A', 'Team B'];
    const totalQuestions = Number(body.totalQuestionsPerInnings);
    const baseTimerSeconds = Number(body.baseTimerSeconds ?? 60);
    const timerAdjustment = Number(body.timerAdjustmentSeconds ?? 0);
    const distribution = normalizeDistribution(body.questionDistribution);
    const mentors = Array.isArray(body.mentors) ? body.mentors : [];
    const streakThreshold = Number(body.streakThreshold ?? 3);
    const battingStreakBonusRuns = Number(body.battingStreakBonusRuns ?? 2);
    const bowlingStreakDeductionRuns = Number(body.bowlingStreakDeductionRuns ?? 2);

    if (sideTeamIds.length !== 2 || sideTeamIds.some((side) => side.length < 1) || teamIds.length < 2) {
        return Response.json({ error: 'Select at least one registered team for each side.' }, { status: 400 });
    }
    if (sideNames.length !== 2 || sideNames.some((name) => !name)) {
        return Response.json({ error: 'Both match sides need a final name.' }, { status: 400 });
    }
    if (!Number.isInteger(totalQuestions) || totalQuestions < 1) {
        return Response.json({ error: 'Total questions per innings must be a positive integer.' }, { status: 400 });
    }
    if (!Number.isInteger(baseTimerSeconds) || baseTimerSeconds < MIN_TIMER_SECONDS ||
        !Number.isInteger(timerAdjustment) || !ALLOWED_TIMER_ADJUSTMENTS.has(timerAdjustment) ||
        baseTimerSeconds + timerAdjustment < MIN_TIMER_SECONDS) {
        return Response.json({ error: `Timer must be at least ${MIN_TIMER_SECONDS} seconds and adjustment must be -30, 0, or 30 seconds.` }, { status: 400 });
    }
    if (!distribution || Object.values(distribution).reduce((sum, count) => sum + count, 0) !== totalQuestions) {
        return Response.json({ error: 'Question type counts must add up to the innings total.' }, { status: 400 });
    }
    if (mentors.length !== 2 || mentors.some((mentor) => !mentor || !String(mentor.name || '').trim() || !String(mentor.email || '').trim())) {
        return Response.json({ error: 'Each team must have an RMC Mentor name and email before the match can be created.' }, { status: 400 });
    }
    if (![streakThreshold, battingStreakBonusRuns, bowlingStreakDeductionRuns].every(Number.isInteger) ||
        streakThreshold < 1 || battingStreakBonusRuns < 0 || bowlingStreakDeductionRuns < 0) {
        return Response.json({ error: 'Streak settings must be valid non-negative integers, with a positive threshold.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const [{ data: teams, error: teamsError }, { data: ballTypes, error: ballTypesError }] = await Promise.all([
        admin.from('mpl_teams').select('id, team_name, team_code').in('id', teamIds),
        admin.from('mpl_ball_types').select('slug, default_runs, default_timer_seconds, is_special').in('slug', Object.keys(distribution))
    ]);

    if (teamsError || ballTypesError) {
        return Response.json({ error: teamsError?.message || ballTypesError?.message }, { status: 500 });
    }
    if ((teams || []).length !== teamIds.length) {
        return Response.json({ error: 'One or more selected teams do not exist.' }, { status: 400 });
    }
    if ((ballTypes || []).length !== Object.keys(distribution).length) {
        return Response.json({ error: 'One or more selected question types do not exist.' }, { status: 400 });
    }

    const availability = await Promise.all(Object.entries(distribution).map(async ([slug, count]) => {
        const { count: available, error } = await admin
            .from('mpl_questions')
            .select('id', { count: 'exact', head: true })
            .eq('ball_type_slug', slug)
            .eq('is_active', true);
        return { slug, count, available: available || 0, error };
    }));
    const availabilityError = availability.find((entry) => entry.error);
    if (availabilityError) return Response.json({ error: availabilityError.error.message }, { status: 500 });
    const insufficient = availability.find((entry) => entry.available < entry.count);
    if (insufficient) {
        return Response.json({ error: `Not enough active questions for ${insufficient.slug}. Need ${insufficient.count}, have ${insufficient.available}.` }, { status: 400 });
    }

    const playerResults = await Promise.all(teamIds.map((teamId) => admin
        .from('mpl_players')
        .select('id, team_id, name, is_leader, created_at')
        .eq('team_id', teamId)
        .order('created_at', { ascending: true })));
    const playerError = playerResults.find((result) => result.error);
    if (playerError) return Response.json({ error: playerError.error.message }, { status: 500 });

    // The finalized batting order is the virtual draw for this match; bowling
    // order is derived from it in reverse.
    const playersByTeam = new Map(teamIds.map((teamId, index) => [teamId, playerResults[index].data || []]));
    const lineups = sideTeamIds.map((side) => shuffle(side.flatMap((teamId) => (playersByTeam.get(teamId) || []).map((player) => player.id))));
    if (lineups.some((lineup) => lineup.length < 1)) {
        return Response.json({ error: 'Both selected teams must have at least 1 registered player.' }, { status: 400 });
    }


    const questionPlan = shuffle(Object.entries(distribution).flatMap(([slug, count]) => Array(count).fill(slug)));
    const matchPayload = {
        status: 'toss_pending',
        total_questions_per_innings: totalQuestions,
        question_distribution: distribution,
        timer_config: { base_seconds: baseTimerSeconds, adjustment_seconds: timerAdjustment, minimum_seconds: MIN_TIMER_SECONDS },
        rules_config: {
            question_plan: questionPlan,
            innings_end: 'delivery_limit_or_all_batters_out',
            player_rescue_attempt: true,
            power_shot: { enabled: true, doubles: 'base_runs_only', uses_per_innings: 1 },
            wide_no_ball: true,
            streak_threshold: streakThreshold,
            batting_streak_bonus_runs: battingStreakBonusRuns,
            bowling_streak_deduction_runs: bowlingStreakDeductionRuns
        },
        created_by: 'mpl_admin'
    };

    const { data: match, error: matchError } = await admin.from('mpl_matches').insert(matchPayload).select().single();
    if (matchError) return Response.json({ error: matchError.message }, { status: 500 });

    const matchTeams = sideTeamIds.flatMap((side, sideIndex) => side.map((teamId) => ({
        match_id: match.id,
        team_id: teamId,
        innings_number: sideIndex + 1,
        side_name: sideNames[sideIndex],
        batting_order: lineups[sideIndex],
        bowling_order: [...lineups[sideIndex]].reverse(),
        mentor_name: String(mentors[sideIndex].name).trim(),
        mentor_email: String(mentors[sideIndex].email).trim()
    })));
    const { error: matchTeamsError } = await admin.from('mpl_match_teams').insert(matchTeams);
    if (matchTeamsError) {
        await admin.from('mpl_matches').delete().eq('id', match.id);
        return Response.json({ error: matchTeamsError.message }, { status: 500 });
    }

    return Response.json({
        match: {
            ...match,
            teams: sideTeamIds.flatMap((side, sideIndex) => side.map((teamId) => ({ ...teams.find((team) => team.id === teamId), side_name: sideNames[sideIndex], innings_number: sideIndex + 1, player_ids: lineups[sideIndex] })))
        }
    }, { status: 201 });
}
