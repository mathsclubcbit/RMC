import { createAdminClient, createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Compute which innings is currently batting without an extra DB round-trip. */
function getBattingInnings(match, playerTeamId, playerInningsNumber) {
    const playerBatsFirst = match.first_batting_team_id === playerTeamId;
    const firstBattingSide = playerBatsFirst ? playerInningsNumber : (playerInningsNumber === 1 ? 2 : 1);
    return match.status === 'innings_2' ? (firstBattingSide === 1 ? 2 : 1) : firstBattingSide;
}

/** Derive scoreState + teamScores + dismissedPlayerIds + latestDelivery + celebrationEvent from a flat deliveries array. */
function deriveDeliveryStats(deliveries, battingInnings, matchTeams, matchStatus) {
    const allDeliveries = deliveries || [];

    // Latest delivery (for wide-ball banner)
    const latestDelivery = [...allDeliveries]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null;

    // Dismissed batters
    const dismissedPlayerIds = allDeliveries
        .filter(d => d.status === 'wicket')
        .map(d => d.batter_id);

    // Per-innings scores
    const teamScores = (matchTeams || []).map(team => {
        const inningsDeliveries = allDeliveries.filter(d => d.innings_number === team.innings_number);
        return {
            team_id: team.team_id,
            team_name: team.team_name || 'Team',
            innings_number: team.innings_number,
            runs: inningsDeliveries.reduce((t, d) => t + (d.runs_awarded || 0) + (d.score_adjustment || 0), 0),
            wickets: inningsDeliveries.filter(d => d.status === 'wicket').length,
            legal_deliveries: inningsDeliveries.filter(d => !['wide', 'no_ball', 'cancelled'].includes(d.status)).length,
        };
    });

    // Current-innings score (sticky scoreboard)
    let scoreState = null;
    if (!['toss_pending', 'toss_won', 'draft'].includes(matchStatus)) {
        let runs = 0, wickets = 0, boundaries = 0;
        const currentDeliveries = allDeliveries.filter(d => d.innings_number === battingInnings);
        currentDeliveries.forEach(d => {
            runs += (d.runs_awarded || 0) + (d.score_adjustment || 0);
            if (d.status === 'wicket') wickets++;
            if ((d.runs_awarded || 0) >= 4) boundaries++;
        });
        const totalLegal = currentDeliveries.filter(d => !['wide', 'no_ball', 'cancelled'].includes(d.status)).length;
        scoreState = { runs, wickets, boundaries, totalLegal };
    }

    // Celebration event
    const latestCelebrationDelivery = [...allDeliveries]
        .filter(d => ['answered', 'wicket', 'wide', 'dot'].includes(d.status) || d.metadata?.rescue_available === true)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    let celebrationEvent = null;
    if (latestCelebrationDelivery) {
        const wrongAnswerHandoff = latestCelebrationDelivery.metadata?.rescue_available === true
            && latestCelebrationDelivery.metadata?.answer_correct === false;
        const streakAdjustment = Number(latestCelebrationDelivery.metadata?.streak_adjustment || 0);

        const celebrationBattingTeam = (matchTeams || []).find(t => t.innings_number === latestCelebrationDelivery.innings_number);
        const celebrationTeam = latestCelebrationDelivery.status === 'wicket'
            ? (matchTeams || []).find(t => t.team_id !== celebrationBattingTeam?.team_id)
            : celebrationBattingTeam;

        let eventType = latestCelebrationDelivery.status === 'wide' ? 'wide'
            : latestCelebrationDelivery.status === 'wicket' ? 'wicket'
            : latestCelebrationDelivery.status === 'dot' ? 'dot'
            : wrongAnswerHandoff ? 'wrong_answer'
            : latestCelebrationDelivery.metadata?.power_shot === true ? 'power_shot'
            : 'runs';
        let eventTitle = latestCelebrationDelivery.status === 'wide' ? 'WIDE BALL · +1'
            : latestCelebrationDelivery.status === 'wicket' ? 'WICKET!'
            : latestCelebrationDelivery.status === 'dot' ? 'DOT BALL'
            : wrongAnswerHandoff ? 'WRONG ANSWER'
            : latestCelebrationDelivery.metadata?.power_shot === true ? 'POWER SHOT!'
            : `+${latestCelebrationDelivery.runs_awarded} runs`;
        let eventSubtitle = latestCelebrationDelivery.status === 'wide'
            ? `${celebrationBattingTeam?.mpl_teams?.team_name || celebrationBattingTeam?.team_name || 'Batting team'} gets 1 run`
            : latestCelebrationDelivery.status === 'wicket'
            ? `${celebrationTeam?.mpl_teams?.team_name || celebrationTeam?.team_name || 'Bowling team'} gets the wicket!`
            : latestCelebrationDelivery.status === 'dot' ? 'No runs scored'
            : wrongAnswerHandoff ? 'Question passed to the bowler'
            : `${celebrationTeam?.mpl_teams?.team_name || celebrationTeam?.team_name || 'Batting team'} scores!`;

        if (streakAdjustment > 0) {
            eventType = 'streak_bonus'; eventTitle = 'STREAK BONUS!';
            eventSubtitle = `+${streakAdjustment} runs for ${celebrationBattingTeam?.mpl_teams?.team_name || celebrationBattingTeam?.team_name || 'Batting team'}!`;
        } else if (streakAdjustment < 0) {
            eventType = 'streak_bonus'; eventTitle = 'STREAK PENALTY!';
            eventSubtitle = `${streakAdjustment} runs for ${celebrationBattingTeam?.mpl_teams?.team_name || celebrationBattingTeam?.team_name || 'Batting team'}!`;
        }

        if (celebrationTeam) {
            celebrationEvent = {
                id: latestCelebrationDelivery.id,
                type: eventType,
                innings_number: latestCelebrationDelivery.innings_number,
                celebration_team_id: celebrationTeam.team_id,
                batting_team_id: celebrationBattingTeam?.team_id || null,
                batting_team_name: celebrationBattingTeam?.mpl_teams?.team_name || celebrationBattingTeam?.team_name || 'Batting team',
                runs_awarded: latestCelebrationDelivery.runs_awarded,
                title: eventTitle,
                subtitle: eventSubtitle,
            };
        }
    }

    return { latestDelivery, dismissedPlayerIds, teamScores, scoreState, celebrationEvent };
}

/** Shape an active delivery row into the client payload. */
function shapeDelivery(activeDelivery, player, batterName, bowlerName) {
    if (!activeDelivery) return null;
    return {
        ...activeDelivery,
        can_answer: activeDelivery.batter_id === player.id,
        can_rescue: activeDelivery.bowler_id === player.id && activeDelivery.metadata?.rescue_available === true,
        batter_name: batterName,
        bowler_name: bowlerName,
        assigned_score: activeDelivery.mpl_questions?.runs ?? activeDelivery.mpl_ball_types?.default_runs ?? 0,
        question: activeDelivery.mpl_questions,
        mpl_questions: undefined,
    };
}

/** Build ball-choice array for the bowler picker. */
function buildBallChoices(pendingDelivery) {
    if (!pendingDelivery) return [];
    const totalBalls = 20;
    return Array.from(
        { length: Math.max(0, totalBalls - pendingDelivery.delivery_number + 1) },
        (_, i) => ({ ballNumber: pendingDelivery.delivery_number + i, label: `Ball ${pendingDelivery.delivery_number + i}` })
    );
}

// ---------------------------------------------------------------------------
// GET /api/mpl/player/match
// ?lite=1  →  fast path: 6-7 queries, 0 writes  (called every 5 s)
// (none)   →  full path: 10 queries, parallelised (called every 30 s)
// ---------------------------------------------------------------------------
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const isLite = searchParams.get('lite') === '1';

    // ── Step 1: auth (always required, sequential) ──────────────────────────
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    const admin = createAdminClient();

    // ── Step 2: player lookup ────────────────────────────────────────────────
    const { data: player, error: playerError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, is_leader, team:mpl_teams(id, team_name, team_code)')
        .eq('email', user.email)
        .maybeSingle();
    if (playerError || !player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });

    // ── Step 3: match lookup ─────────────────────────────────────────────────
    const { data: matchTeam, error: matchTeamError } = await admin
        .from('mpl_match_teams')
        .select('match_id, innings_number, side_name, mpl_matches!inner(id, status, total_questions_per_innings, question_distribution, timer_config, first_batting_team_id, toss_winner_team_id, toss_calling_team_id, toss_choice, toss_result, created_at, rules_config)')
        .eq('team_id', player.team_id)
        .not('mpl_matches.status', 'eq', 'abandoned')
        .order('created_at', { foreignTable: 'mpl_matches', ascending: false })
        .limit(1)
        .maybeSingle();
    if (matchTeamError) return Response.json({ error: matchTeamError.message }, { status: 500 });
    if (!matchTeam) return Response.json({ match: null });

    const match = matchTeam.mpl_matches;
    if (!match) return Response.json({ match: null });

    // Derive batting side without an extra round-trip
    const battingInnings = getBattingInnings(match, player.team_id, matchTeam.innings_number);
    const isPowerShotArmed = match.rules_config?.[`power_shot_armed_${battingInnings}`] === true;
    const matchPayload = {
        ...match,
        team_id: player.team_id,
        innings_number: matchTeam.innings_number,
        is_toss_captain: player.is_leader && match.toss_calling_team_id === player.team_id,
        batting_innings_number: battingInnings,
    };

    // ============================================================
    //  LITE PATH — no writes, parallelised, ~6-7 queries total
    // ============================================================
    if (isLite) {
        const [
            { data: activeDelivery, error: deliveryError },
            { data: pendingDelivery, error: pendingError },
            { data: deliveries },
        ] = await Promise.all([
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, delivery_number, ball_type_slug, batter_id, bowler_id, timer_seconds, status, answer_started_at, metadata, mpl_questions(question_text, options, runs), mpl_ball_types(default_runs)')
                .eq('match_id', match.id).eq('status', 'active')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_delivery_requests')
                .select('id, innings_number, delivery_number, batter_id, bowler_id, status, created_at')
                .eq('match_id', match.id).eq('status', 'pending')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, status, runs_awarded, score_adjustment, metadata, batter_id, created_at, answer_started_at, answer_submitted_at')
                .eq('match_id', match.id),
        ]);
        if (deliveryError) return Response.json({ error: deliveryError.message }, { status: 500 });
        if (pendingError) return Response.json({ error: pendingError.message }, { status: 500 });

        // Fetch batter/bowler names only when a delivery is active (max 2 rows)
        let batterName = 'Assigned batter', bowlerName = 'Assigned bowler';
        if (activeDelivery) {
            const ids = [...new Set([activeDelivery.batter_id, activeDelivery.bowler_id].filter(Boolean))];
            if (ids.length > 0) {
                const { data: nameRows } = await admin.from('mpl_players').select('id, name').in('id', ids);
                batterName = nameRows?.find(p => p.id === activeDelivery.batter_id)?.name || batterName;
                bowlerName = nameRows?.find(p => p.id === activeDelivery.bowler_id)?.name || bowlerName;
            }
        }

        // Use team_name from player.team for celebration lookup (no full team list needed)
        const liteMatchTeams = [{ team_id: player.team_id, innings_number: matchTeam.innings_number, team_name: player.team?.team_name }];
        const { latestDelivery, dismissedPlayerIds, teamScores, scoreState, celebrationEvent } =
            deriveDeliveryStats(deliveries, battingInnings, liteMatchTeams, match.status);

        const powerShotUsed = (deliveries || []).some(d => d.metadata?.power_shot === true && d.innings_number === battingInnings);

        return Response.json({
            isLite: true,
            player: { id: player.id, name: player.name, is_leader: player.is_leader, team: player.team },
            match: matchPayload,
            isPowerShotArmed,
            powerShotUsed,
            activeDelivery: shapeDelivery(activeDelivery, player, batterName, bowlerName),
            pendingDelivery: pendingDelivery ? { ...pendingDelivery, can_select_question: pendingDelivery.bowler_id === player.id } : null,
            ballChoices: buildBallChoices(pendingDelivery),
            latestDelivery,
            dismissedPlayerIds,
            teamScores,
            scoreState,
            celebrationEvent,
            server_time: new Date().toISOString(),
        });
    }

    // ============================================================
    //  FULL PATH — all data, parallelised, presence write included
    // ============================================================
    const activeSince = new Date(Date.now() - 15000).toISOString();
    const [
        _presence,
        { data: matchTeams, error: teamsError },
        { data: activeDelivery, error: deliveryError },
        { data: pendingDelivery, error: pendingError },
        { data: deliveries },
        { data: presence, error: presenceListError },
    ] = await Promise.all([
        // Write: presence upsert
        admin.from('mpl_match_player_presence')
            .upsert({ match_id: match.id, player_id: player.id, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' }),
        // Read: all team entries for this match
        admin.from('mpl_match_teams')
            .select('team_id, innings_number, side_name, mentor_name, mentor_email, mpl_teams(id, team_name, team_code)')
            .eq('match_id', match.id).order('innings_number'),
        // Read: active delivery
        admin.from('mpl_match_deliveries')
            .select('id, innings_number, delivery_number, ball_type_slug, batter_id, bowler_id, timer_seconds, status, answer_started_at, metadata, mpl_questions(question_text, options, runs), mpl_ball_types(default_runs)')
            .eq('match_id', match.id).eq('status', 'active')
            .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        // Read: pending delivery request
        admin.from('mpl_match_delivery_requests')
            .select('id, innings_number, delivery_number, batter_id, bowler_id, status, created_at')
            .eq('match_id', match.id).eq('status', 'pending')
            .order('created_at', { ascending: false }).limit(1).maybeSingle(),
        // Read: all deliveries for scoring
        admin.from('mpl_match_deliveries')
            .select('id, innings_number, status, runs_awarded, score_adjustment, metadata, batter_id, created_at, answer_started_at, answer_submitted_at')
            .eq('match_id', match.id),
        // Read: who's currently online
        admin.from('mpl_match_player_presence')
            .select('player_id').eq('match_id', match.id).is('left_at', null).gte('last_seen_at', activeSince),
    ]);

    if (teamsError) return Response.json({ error: teamsError.message }, { status: 500 });
    if (deliveryError) return Response.json({ error: deliveryError.message }, { status: 500 });
    if (pendingError) return Response.json({ error: pendingError.message }, { status: 500 });
    if (presenceListError) return Response.json({ error: presenceListError.message }, { status: 500 });

    // Players query (needs teamIds from matchTeams — unavoidable sequential step)
    const teamIds = (matchTeams || []).map(t => t.team_id);
    const { data: players, error: playersError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, roll_number, is_leader')
        .in('team_id', teamIds)
        .order('created_at');
    if (playersError) return Response.json({ error: playersError.message }, { status: 500 });

    const joinedPlayerIds = new Set((presence || []).map(e => e.player_id));
    const tossCaptain = (players || []).find(p => p.team_id === match.toss_calling_team_id && p.is_leader);
    const batter = (players || []).find(p => p.id === activeDelivery?.batter_id);
    const bowler = (players || []).find(p => p.id === activeDelivery?.bowler_id);

    // Build ordered team list
    const sideRows = [...(matchTeams || [])].reduce((sides, row) => {
        const side = sides.get(row.innings_number) || {
            innings_number: row.innings_number,
            side_name: row.side_name || row.mpl_teams?.team_name || `Team ${row.innings_number}`,
            team_ids: [], mentor_name: null, mentor_email: null,
        };
        side.team_ids.push(row.team_id);
        if (row.team_id === player.team_id) { side.mentor_name = row.mentor_name; side.mentor_email = row.mentor_email; }
        sides.set(row.innings_number, side);
        return sides;
    }, new Map());

    const orderedTeams = [...sideRows.values()]
        .sort((a, b) => a.innings_number - b.innings_number)
        .map(side => ({
            team_id: side.team_ids[0],
            team_ids: side.team_ids,
            team_name: side.side_name,
            team_code: side.team_ids.length > 1
                ? `${side.team_ids.length} teams`
                : (matchTeams || []).find(t => t.team_id === side.team_ids[0])?.mpl_teams?.team_code,
            innings_number: side.innings_number,
            mentor_name: side.mentor_name,
            mentor_email: side.mentor_email,
            is_batting: side.innings_number === battingInnings,
            players: (players || []).filter(p => side.team_ids.includes(p.team_id) && joinedPlayerIds.has(p.id)),
        }));

    // Flatten orderedTeams for deriveDeliveryStats (needs team_id + innings_number + team_name)
    const flatTeams = orderedTeams.map(t => ({ team_id: t.team_id, innings_number: t.innings_number, team_name: t.team_name, mpl_teams: { team_name: t.team_name } }));
    const { latestDelivery, dismissedPlayerIds, teamScores, scoreState, celebrationEvent } =
        deriveDeliveryStats(deliveries, battingInnings, flatTeams, match.status);

    const powerShotUsed = (deliveries || []).some(d => d.metadata?.power_shot === true && d.innings_number === battingInnings);

    // Match result (only when completed)
    let matchResult = null;
    if (match.status === 'completed' && (matchTeams || []).length >= 2) {
        const getStats = (inningsNumber) => {
            let runs = 0, boundaries = 0, answeringTimeSeconds = 0;
            (deliveries || []).filter(d => d.innings_number === inningsNumber).forEach(d => {
                runs += (d.runs_awarded || 0) + (d.score_adjustment || 0);
                const baseRuns = Number(d.metadata?.base_runs ?? d.runs_awarded ?? 0);
                if (baseRuns === 4 || baseRuns === 6) boundaries++;
                if (d.answer_started_at && d.answer_submitted_at)
                    answeringTimeSeconds += Math.max(0, (new Date(d.answer_submitted_at).getTime() - new Date(d.answer_started_at).getTime()) / 1000);
            });
            return { runs, boundaries, answeringTimeSeconds };
        };
        const firstTeam = matchTeams.find(t => t.innings_number === 1);
        const secondTeam = matchTeams.find(t => t.innings_number === 2);
        const firstStats = getStats(1), secondStats = getStats(2);
        let winner = null, reason = 'tie';
        if (firstStats.runs !== secondStats.runs) { winner = firstStats.runs > secondStats.runs ? firstTeam : secondTeam; reason = 'by runs'; }
        else if (firstStats.boundaries !== secondStats.boundaries) { winner = firstStats.boundaries > secondStats.boundaries ? firstTeam : secondTeam; reason = 'on boundary count'; }
        else if (firstStats.answeringTimeSeconds !== secondStats.answeringTimeSeconds) { winner = firstStats.answeringTimeSeconds < secondStats.answeringTimeSeconds ? firstTeam : secondTeam; reason = 'on answering time'; }
        matchResult = {
            is_tie: !winner,
            winner_team_id: winner?.team_id || null,
            winner_team_name: winner?.mpl_teams?.team_name || null,
            reason,
            title: winner ? `${winner.mpl_teams?.team_name || 'Team'} wins!` : 'Match tied!',
            subtitle: winner ? `Victory ${reason}` : 'What a contest.',
        };
    }

    return Response.json({
        player: { id: player.id, name: player.name, is_leader: player.is_leader, team: player.team },
        match: { ...matchPayload, toss_captain_name: tossCaptain?.name || null, batting_team_id: orderedTeams.find(t => t.innings_number === battingInnings)?.team_id },
        isPowerShotArmed,
        powerShotUsed,
        teams: orderedTeams,
        activeDelivery: shapeDelivery(activeDelivery, player, batter?.name || 'Assigned batter', bowler?.name || 'Assigned bowler'),
        pendingDelivery: pendingDelivery ? { ...pendingDelivery, can_select_question: pendingDelivery.bowler_id === player.id } : null,
        questionTypes: [],
        ballChoices: buildBallChoices(pendingDelivery),
        latestDelivery,
        dismissedPlayerIds,
        scoreState,
        teamScores,
        celebrationEvent,
        matchResult,
        server_time: new Date().toISOString(),
    });
}

// ---------------------------------------------------------------------------
// POST — mark player as having left the match
// ---------------------------------------------------------------------------
export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const matchId = String(body.matchId || '');
    if (!matchId) return Response.json({ error: 'Match ID is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data: player } = await admin.from('mpl_players').select('id').eq('email', user.email).maybeSingle();
    if (!player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });

    const { error } = await admin
        .from('mpl_match_player_presence')
        .update({ left_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .eq('player_id', player.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
}
