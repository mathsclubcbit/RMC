import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function GET() {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    const admin = createAdminClient();
    const { data: player, error: playerError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, is_leader, team:mpl_teams(id, team_name, team_code)')
        .eq('email', user.email)
        .single();
    if (playerError || !player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });

    const { data: matchTeam, error: matchTeamError } = await admin
        .from('mpl_match_teams')
        .select('match_id, innings_number, side_name, mpl_matches!inner(id, status, total_questions_per_innings, question_distribution, timer_config, first_batting_team_id, toss_winner_team_id, created_at)')
        .eq('team_id', player.team_id)
        .not('mpl_matches.status', 'eq', 'abandoned')
        .order('created_at', { foreignTable: 'mpl_matches', ascending: false })
        .limit(1)
        .maybeSingle();
    if (matchTeamError) return Response.json({ error: matchTeamError.message }, { status: 500 });
    if (!matchTeam) return Response.json({ match: null });

    const match = matchTeam.mpl_matches;
    if (!match) return Response.json({ match: null });

    const { error: presenceError } = await admin
        .from('mpl_match_player_presence')
        .upsert({ match_id: match.id, player_id: player.id, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' });
    if (presenceError) return Response.json({ error: presenceError.message }, { status: 500 });

    const { data: matchTeams, error: teamsError } = await admin
        .from('mpl_match_teams')
        .select('team_id, innings_number, side_name, mentor_name, mentor_email, mpl_teams(id, team_name, team_code)')
        .eq('match_id', match.id)
        .order('innings_number');
    if (teamsError) return Response.json({ error: teamsError.message }, { status: 500 });

    const teamIds = (matchTeams || []).map((team) => team.team_id);
    const { data: players, error: playersError } = await admin
        .from('mpl_players')
        .select('id, team_id, name, roll_number, is_leader')
        .in('team_id', teamIds)
        .order('created_at');
    if (playersError) return Response.json({ error: playersError.message }, { status: 500 });

    const activeSince = new Date(Date.now() - 15000).toISOString();
    const { data: presence, error: presenceListError } = await admin
        .from('mpl_match_player_presence')
        .select('player_id')
        .eq('match_id', match.id)
        .is('left_at', null)
        .gte('last_seen_at', activeSince);
    if (presenceListError) return Response.json({ error: presenceListError.message }, { status: 500 });
    const joinedPlayerIds = new Set((presence || []).map((entry) => entry.player_id));

    const sideRows = [...(matchTeams || [])].reduce((sides, row) => {
        const side = sides.get(row.innings_number) || { innings_number: row.innings_number, side_name: row.side_name || row.mpl_teams?.team_name || `Team ${row.innings_number}`, team_ids: [], mentor_name: null, mentor_email: null };
        side.team_ids.push(row.team_id);
        if (row.team_id === player.team_id) {
            side.mentor_name = row.mentor_name;
            side.mentor_email = row.mentor_email;
        }
        sides.set(row.innings_number, side);
        return sides;
    }, new Map());
    const firstBattingSide = (matchTeams || []).find((team) => team.team_id === match.first_batting_team_id)?.innings_number || 1;
    const battingInnings = match.status === 'innings_2' ? (firstBattingSide === 1 ? 2 : 1) : firstBattingSide;
    const orderedTeams = [...sideRows.values()].sort((first, second) => first.innings_number - second.innings_number).map((side) => ({
        team_id: side.team_ids[0],
        team_ids: side.team_ids,
        team_name: side.side_name,
        team_code: side.team_ids.length > 1 ? `${side.team_ids.length} teams` : (matchTeams || []).find((team) => team.team_id === side.team_ids[0])?.mpl_teams?.team_code,
        innings_number: side.innings_number,
        mentor_name: side.mentor_name,
        mentor_email: side.mentor_email,
        is_batting: side.innings_number === battingInnings,
        players: (players || []).filter((entry) => side.team_ids.includes(entry.team_id) && joinedPlayerIds.has(entry.id))
    }));

    const { data: activeDelivery, error: deliveryError } = await admin
        .from('mpl_match_deliveries')
        .select('id, innings_number, delivery_number, ball_type_slug, batter_id, bowler_id, timer_seconds, status, answer_started_at, metadata, mpl_questions(question_text, options)')
        .eq('match_id', match.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (deliveryError) return Response.json({ error: deliveryError.message }, { status: 500 });

    const playerCanAnswer = activeDelivery?.batter_id === player.id;
    const playerCanRescue = activeDelivery?.bowler_id === player.id && activeDelivery.metadata?.rescue_available === true;
    const batter = (players || []).find((entry) => entry.id === activeDelivery?.batter_id);
    const bowler = (players || []).find((entry) => entry.id === activeDelivery?.bowler_id);

    const { data: pendingDelivery, error: pendingError } = await admin
        .from('mpl_match_delivery_requests')
        .select('id, innings_number, delivery_number, batter_id, bowler_id, status, created_at')
        .eq('match_id', match.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (pendingError) return Response.json({ error: pendingError.message }, { status: 500 });

    let questionTypes = [];
    if (pendingDelivery) {
        const distribution = match.question_distribution && typeof match.question_distribution === 'object' ? match.question_distribution : {};
        const slugs = Object.keys(distribution);
        const [{ data: ballTypes, error: ballTypeError }, { data: usedDeliveries, error: usedError }] = await Promise.all([
            admin.from('mpl_ball_types').select('slug, name, description, default_timer_seconds, timer_adjustment_seconds, is_special').in('slug', slugs).order('slug'),
            admin.from('mpl_match_deliveries').select('ball_type_slug, status').eq('match_id', match.id).eq('innings_number', pendingDelivery.innings_number)
        ]);
        if (ballTypeError || usedError) return Response.json({ error: ballTypeError?.message || usedError?.message }, { status: 500 });
        const usedCounts = (usedDeliveries || []).reduce((counts, delivery) => {
            if (!['wide', 'no_ball', 'cancelled'].includes(delivery.status)) counts[delivery.ball_type_slug] = (counts[delivery.ball_type_slug] || 0) + 1;
            return counts;
        }, {});
        questionTypes = (ballTypes || []).map((type) => ({ ...type, remaining: Math.max(0, Number(distribution[type.slug] || 0) - (usedCounts[type.slug] || 0)) }));
    }

    const { data: deliveries } = await admin
        .from('mpl_match_deliveries')
        .select('id, innings_number, status, runs_awarded, score_adjustment, metadata, batter_id, created_at, answer_started_at, answer_submitted_at')
        .eq('match_id', match.id);

    const teamScores = orderedTeams.map((team) => {
        const teamDeliveries = (deliveries || []).filter((delivery) => delivery.innings_number === team.innings_number);
        return {
            team_id: team.team_id,
            team_name: team.team_name || 'Team',
            innings_number: team.innings_number,
            runs: teamDeliveries.reduce((total, delivery) => total + (delivery.runs_awarded || 0) + (delivery.score_adjustment || 0), 0),
            wickets: teamDeliveries.filter((delivery) => delivery.status === 'wicket').length,
            legal_deliveries: teamDeliveries.filter((delivery) => !['wide', 'no_ball', 'cancelled'].includes(delivery.status)).length
        };
    });
    const dismissedPlayerIds = (deliveries || []).filter((delivery) => delivery.status === 'wicket').map((delivery) => delivery.batter_id);
    const latestCelebrationDelivery = [...(deliveries || [])]
        .filter((delivery) => (delivery.status === 'answered' && Number(delivery.runs_awarded || 0) > 0) || (delivery.status === 'wicket' && delivery.metadata?.rescue_saved === true))
        .sort((first, second) => new Date(second.created_at || 0).getTime() - new Date(first.created_at || 0).getTime())[0];
    const celebrationBattingTeam = latestCelebrationDelivery
        ? (matchTeams || []).find((team) => team.innings_number === latestCelebrationDelivery.innings_number)
        : null;
    const celebrationTeam = latestCelebrationDelivery?.status === 'wicket'
        ? (matchTeams || []).find((team) => team.team_id !== celebrationBattingTeam?.team_id)
        : celebrationBattingTeam;
    const celebrationEvent = latestCelebrationDelivery && celebrationTeam ? {
        id: latestCelebrationDelivery.id,
        type: latestCelebrationDelivery.status === 'wicket' ? 'wicket' : latestCelebrationDelivery.metadata?.power_shot === true ? 'power_shot' : 'runs',
        innings_number: latestCelebrationDelivery.innings_number,
        celebration_team_id: celebrationTeam.team_id,
        batting_team_id: celebrationBattingTeam?.team_id || null,
        batting_team_name: celebrationBattingTeam?.mpl_teams?.team_name || 'Batting team',
        runs_awarded: latestCelebrationDelivery.runs_awarded,
        title: latestCelebrationDelivery.status === 'wicket' ? 'WICKET!' : latestCelebrationDelivery.metadata?.power_shot === true ? 'POWER SHOT!' : `+${latestCelebrationDelivery.runs_awarded} runs`,
        subtitle: latestCelebrationDelivery.status === 'wicket' ? `${celebrationTeam.mpl_teams?.team_name || 'Bowling team'} gets the wicket!` : `${celebrationTeam.mpl_teams?.team_name || 'Batting team'} scores!`
    } : null;

    let matchResult = null;
    if (match.status === 'completed' && (matchTeams || []).length >= 2) {
        const getStats = (inningsNumber) => {
            let runs = 0, boundaries = 0, answeringTimeSeconds = 0;
            (deliveries || []).filter((delivery) => delivery.innings_number === inningsNumber).forEach((delivery) => {
                runs += (delivery.runs_awarded || 0) + (delivery.score_adjustment || 0);
                const baseRuns = Number(delivery.metadata?.base_runs ?? delivery.runs_awarded ?? 0);
                if (baseRuns === 4 || baseRuns === 6) boundaries += 1;
                if (delivery.answer_started_at && delivery.answer_submitted_at) {
                    answeringTimeSeconds += Math.max(0, (new Date(delivery.answer_submitted_at).getTime() - new Date(delivery.answer_started_at).getTime()) / 1000);
                }
            });
            return { runs, boundaries, answeringTimeSeconds };
        };
        const firstTeam = matchTeams.find((team) => team.innings_number === 1);
        const secondTeam = matchTeams.find((team) => team.innings_number === 2);
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
            subtitle: winner ? `Victory ${reason}` : 'What a contest.'
        };
    }

    let scoreState = null;
    if (deliveries && match.status !== 'toss_pending' && match.status !== 'toss_won' && match.status !== 'draft') {
        const currentInnings = match.status === 'innings_2' ? 2 : 1;
        let runs = 0, wickets = 0, boundaries = 0;
        const currentDeliveries = deliveries.filter(d => d.innings_number === currentInnings);
        currentDeliveries.forEach(d => {
            runs += (d.runs_awarded || 0) + (d.score_adjustment || 0);
            if (d.status === 'wicket') wickets += 1;
            if (d.runs_awarded >= 4) boundaries += 1;
        });
        const totalLegal = currentDeliveries.filter(d => !['wide', 'no_ball', 'cancelled'].includes(d.status)).length;
        scoreState = { runs, wickets, boundaries, totalLegal };
    }

    return Response.json({
        player: { id: player.id, name: player.name, is_leader: player.is_leader, team: player.team },
        match: { ...match, team_id: player.team_id, innings_number: matchTeam.innings_number, batting_team_id: (matchTeams || []).find((team) => team.innings_number === battingInnings)?.team_id, batting_innings_number: battingInnings },
        teams: orderedTeams,
        activeDelivery: activeDelivery ? {
            ...activeDelivery,
            can_answer: playerCanAnswer,
            can_rescue: playerCanRescue,
            batter_name: batter?.name || 'Assigned batter',
            bowler_name: bowler?.name || 'Assigned bowler',
            question: activeDelivery.mpl_questions,
            mpl_questions: undefined
        } : null,
        powerShotUsed: (deliveries || []).some((delivery) => delivery.metadata?.power_shot === true && delivery.innings_number === activeDelivery?.innings_number),
        pendingDelivery: pendingDelivery ? { ...pendingDelivery, can_select_question: pendingDelivery.bowler_id === player.id } : null,
        questionTypes,
        dismissedPlayerIds,
        scoreState,
        teamScores,
        celebrationEvent,
        matchResult
    });
}

export async function POST(request) {
    const sessionClient = await createClient();
    const { data: { user }, error: authError } = await sessionClient.auth.getUser();
    if (authError || !user?.email) return Response.json({ error: 'Player authentication required.' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 }); }
    const matchId = String(body.matchId || '');
    if (!matchId) return Response.json({ error: 'Match ID is required.' }, { status: 400 });

    const admin = createAdminClient();
    const { data: player } = await admin.from('mpl_players').select('id').eq('email', user.email).single();
    if (!player) return Response.json({ error: 'No MPL player record found.' }, { status: 404 });

    const { error } = await admin
        .from('mpl_match_player_presence')
        .update({ left_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .eq('player_id', player.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
}
