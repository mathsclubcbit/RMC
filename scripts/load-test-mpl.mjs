/**
 * MPL Load Test — scripts/load-test-mpl.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Simulates N players across M simultaneous matches hitting the lite API
 * queries directly against Supabase (bypasses Next.js auth — uses admin key).
 *
 * Usage:
 *   node scripts/load-test-mpl.mjs
 *   node scripts/load-test-mpl.mjs --players=100 --matches=8 --duration=120
 *
 * What it tests:
 *   - The exact DB queries fired by GET /api/mpl/player/match?lite=1
 *   - The exact DB queries fired by GET /api/mpl/player/match (full, every 30 s)
 *   - Presence heartbeat writes (every 30 s)
 *   - Concurrent connection pool pressure
 *
 * It does NOT test Next.js routing or auth token refresh overhead.
 * Those are negligible compared to DB load.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// ── Load env ─────────────────────────────────────────────────────────────────
config({ path: '.env' });

const SUPABASE_URL        = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌  NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set in .env');
    process.exit(1);
}

// ── CLI args ──────────────────────────────────────────────────────────────────
function arg(name, def) {
    const flag = process.argv.find(a => a.startsWith(`--${name}=`));
    return flag ? Number(flag.split('=')[1]) : def;
}

const PLAYERS         = arg('players', 50);
const TARGET_MATCHES  = arg('matches', 5);
const DURATION_S      = arg('duration', 60);
const LITE_INTERVAL   = 5_000;   // ms — mirrors our realtime-triggered poll cadence
const FULL_INTERVAL   = 30_000;  // ms — full poll cadence
const PRESENCE_INTERVAL = 30_000; // ms — heartbeat cadence

// ── Supabase admin client ─────────────────────────────────────────────────────
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db:   { schema: 'public' },
    global: { headers: { 'x-load-test': '1' } }
});

// ── Metrics ───────────────────────────────────────────────────────────────────
const metrics = {
    lite:     { ok: 0, err: 0, ms: [] },
    full:     { ok: 0, err: 0, ms: [] },
    presence: { ok: 0, err: 0, ms: [] },
    startTime: Date.now(),
};

function record(bucket, ok, ms) {
    if (ok) { metrics[bucket].ok++; metrics[bucket].ms.push(ms); }
    else      metrics[bucket].err++;
}

// ── DB query simulators (mirror route.js exactly) ────────────────────────────

async function queryLite(matchId, playerId, teamId, playerInningsNumber, matchFirstBattingTeamId, matchStatus) {
    const t0 = Date.now();
    try {
        // Compute batting innings (same logic as route.js)
        const playerBatsFirst   = matchFirstBattingTeamId === teamId;
        const firstBattingSide  = playerBatsFirst ? playerInningsNumber : (playerInningsNumber === 1 ? 2 : 1);
        const battingInnings    = matchStatus === 'innings_2' ? (firstBattingSide === 1 ? 2 : 1) : firstBattingSide;

        // Parallel block — 3 queries simultaneously
        const [r1, r2, r3] = await Promise.all([
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, delivery_number, batter_id, bowler_id, timer_seconds, status, answer_started_at, metadata, mpl_questions(question_text, options, runs), mpl_ball_types(default_runs)')
                .eq('match_id', matchId).eq('status', 'active')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_delivery_requests')
                .select('id, innings_number, delivery_number, batter_id, bowler_id, status, created_at')
                .eq('match_id', matchId).eq('status', 'pending')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, status, runs_awarded, score_adjustment, metadata, batter_id, created_at')
                .eq('match_id', matchId),
        ]);

        if (r1.error || r2.error || r3.error) { record('lite', false, 0); return; }

        // Conditional: name lookup for batter/bowler (only if delivery active)
        if (r1.data) {
            const ids = [...new Set([r1.data.batter_id, r1.data.bowler_id].filter(Boolean))];
            if (ids.length) await admin.from('mpl_players').select('id, name').in('id', ids);
        }

        record('lite', true, Date.now() - t0);
    } catch { record('lite', false, 0); }
}

async function queryFull(matchId, playerId, teamId) {
    const t0 = Date.now();
    try {
        // Presence upsert + 5 parallel reads (mirrors route.js full path)
        const [, r2, r3, r4, r5, r6] = await Promise.all([
            admin.from('mpl_match_player_presence')
                .upsert({ match_id: matchId, player_id: playerId, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' }),
            admin.from('mpl_match_teams')
                .select('team_id, innings_number, side_name, mentor_name, mentor_email, mpl_teams(id, team_name, team_code)')
                .eq('match_id', matchId).order('innings_number'),
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, delivery_number, batter_id, bowler_id, timer_seconds, status, answer_started_at, metadata, mpl_questions(question_text, options, runs), mpl_ball_types(default_runs)')
                .eq('match_id', matchId).eq('status', 'active')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_delivery_requests')
                .select('id, innings_number, delivery_number, batter_id, bowler_id, status, created_at')
                .eq('match_id', matchId).eq('status', 'pending')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, status, runs_awarded, score_adjustment, metadata, batter_id, created_at, answer_started_at, answer_submitted_at')
                .eq('match_id', matchId),
            admin.from('mpl_match_player_presence')
                .select('player_id').eq('match_id', matchId).is('left_at', null)
                .gte('last_seen_at', new Date(Date.now() - 15000).toISOString()),
        ]);

        if (r2.error || r3.error || r4.error || r5.error || r6.error) { record('full', false, 0); return; }

        // Players query — sequential (needs team IDs from r2)
        const teamIds = (r2.data || []).map(t => t.team_id);
        if (teamIds.length) {
            const { error } = await admin.from('mpl_players')
                .select('id, team_id, name, roll_number, is_leader')
                .in('team_id', teamIds).order('created_at');
            if (error) { record('full', false, 0); return; }
        }

        record('full', true, Date.now() - t0);
    } catch { record('full', false, 0); }
}

async function queryPresence(matchId, playerId) {
    const t0 = Date.now();
    try {
        const { error } = await admin.from('mpl_match_player_presence')
            .upsert({ match_id: matchId, player_id: playerId, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' });
        record('presence', !error, Date.now() - t0);
    } catch { record('presence', false, 0); }
}

// ── Stats helpers ─────────────────────────────────────────────────────────────

function pct(arr, p) {
    if (!arr.length) return 'N/A';
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.ceil((p / 100) * s.length) - 1] + 'ms';
}
function avg(arr) { return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) + 'ms' : 'N/A'; }

function bar(label, ok, err, bucket) {
    const total = ok + err;
    const errPct = total ? ((err / total) * 100).toFixed(1) : '0.0';
    const okBar  = '█'.repeat(Math.round((ok  / Math.max(total, 1)) * 20));
    const errBar = '░'.repeat(Math.round((err / Math.max(total, 1)) * 20));
    console.log(`  ${label.padEnd(10)} ${(okBar + errBar).padEnd(20)}  ok:${ok}  err:${err}(${errPct}%)`);
}

function printReport() {
    const elapsed = (Date.now() - metrics.startTime) / 1000;
    const totalReq = metrics.lite.ok + metrics.lite.err + metrics.full.ok + metrics.full.err + metrics.presence.ok + metrics.presence.err;
    const totalOk  = metrics.lite.ok + metrics.full.ok + metrics.presence.ok;
    const rps = (totalReq / elapsed).toFixed(1);

    console.log('\n\n' + '═'.repeat(65));
    console.log('  MPL LOAD TEST — FINAL REPORT');
    console.log('═'.repeat(65));
    console.log(`  Simulated players : ${PLAYERS}`);
    console.log(`  Simulated matches : ${TARGET_MATCHES}`);
    console.log(`  Duration          : ${elapsed.toFixed(1)}s`);
    console.log(`  Total DB calls    : ${totalReq}  (${rps} req/s)`);
    console.log(`  Overall success   : ${((totalOk / Math.max(totalReq, 1)) * 100).toFixed(1)}%`);
    console.log('─'.repeat(65));
    console.log('  Request breakdown:');
    bar('lite      ', metrics.lite.ok,     metrics.lite.err,     'lite');
    bar('full      ', metrics.full.ok,     metrics.full.err,     'full');
    bar('presence  ', metrics.presence.ok, metrics.presence.err, 'presence');
    console.log('─'.repeat(65));
    console.log('  Latency (lite API — hot path):');
    console.log(`    avg   ${avg(metrics.lite.ms)}`);
    console.log(`    P50   ${pct(metrics.lite.ms, 50)}`);
    console.log(`    P75   ${pct(metrics.lite.ms, 75)}`);
    console.log(`    P95   ${pct(metrics.lite.ms, 95)}`);
    console.log(`    P99   ${pct(metrics.lite.ms, 99)}`);
    console.log(`    max   ${pct(metrics.lite.ms, 100)}`);
    console.log('─'.repeat(65));
    console.log('  Latency (full poll):');
    console.log(`    avg   ${avg(metrics.full.ms)}`);
    console.log(`    P95   ${pct(metrics.full.ms, 95)}`);
    console.log('─'.repeat(65));

    // Verdict
    const lite95 = metrics.lite.ms.sort((a,b)=>a-b)[Math.ceil(0.95 * metrics.lite.ms.length) - 1] || 0;
    const errRate = (metrics.lite.err + metrics.full.err) / Math.max(totalReq, 1);
    if (errRate > 0.05) {
        console.log('  ❌  FAIL — error rate >5% — DB is overwhelmed');
    } else if (lite95 > 3000) {
        console.log('  ⚠️   WARN — P95 lite >3s — DB showing stress under this load');
    } else if (lite95 > 1000) {
        console.log('  🟡  OK   — P95 lite >1s — acceptable but watch for growth');
    } else {
        console.log('  ✅  PASS — system healthy under this simulated load');
    }
    console.log('═'.repeat(65));
}

// ── Discovery: find real match + player data ─────────────────────────────────

async function discoverPlayers() {
    console.log('🔍  Discovering matches and players from DB...');

    // Prefer non-completed/non-abandoned matches; fall back to any
    let { data: matches } = await admin.from('mpl_matches').select('id, status, first_batting_team_id')
        .not('status', 'in', '(abandoned)').order('created_at', { ascending: false }).limit(TARGET_MATCHES * 2);

    if (!matches?.length) {
        ({ data: matches } = await admin.from('mpl_matches').select('id, status, first_batting_team_id')
            .order('created_at', { ascending: false }).limit(TARGET_MATCHES * 2));
    }

    if (!matches?.length) {
        console.error('❌  No MPL matches found. Create at least one match in the admin panel first.');
        process.exit(1);
    }

    const pool = [];

    for (const match of matches.slice(0, TARGET_MATCHES)) {
        const { data: matchTeams } = await admin.from('mpl_match_teams')
            .select('team_id, innings_number').eq('match_id', match.id);
        if (!matchTeams?.length) continue;

        const teamIds = matchTeams.map(t => t.team_id);
        const { data: players } = await admin.from('mpl_players')
            .select('id, team_id').in('team_id', teamIds).limit(20);

        for (const p of (players || [])) {
            const team = matchTeams.find(t => t.team_id === p.team_id);
            pool.push({
                matchId:              match.id,
                matchStatus:          match.status,
                matchFirstBattingTeamId: match.first_batting_team_id,
                playerId:             p.id,
                teamId:               p.team_id,
                playerInningsNumber:  team?.innings_number || 1,
            });
        }
    }

    if (!pool.length) {
        console.error('❌  No players found in any match. Register players first.');
        process.exit(1);
    }

    // Pad/cycle pool to reach the requested player count
    const result = [];
    for (let i = 0; i < PLAYERS; i++) result.push(pool[i % pool.length]);

    const matchIds = [...new Set(result.map(p => p.matchId))];
    console.log(`   Found ${pool.length} real player-match entries`);
    console.log(`   Simulating ${PLAYERS} virtual players across ${matchIds.length} match(es)\n`);
    return result;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║          RMC · MPL LOAD TEST (optimised architecture)        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log(`  Target: ${PLAYERS} players · ${TARGET_MATCHES} matches · ${DURATION_S}s`);
    console.log(`  Lite poll every ${LITE_INTERVAL/1000}s  |  Full poll every ${FULL_INTERVAL/1000}s  |  Presence every ${PRESENCE_INTERVAL/1000}s\n`);

    const players = await discoverPlayers();

    // Ensure presence rows exist (so upserts don't create rows mid-test)
    process.stdout.write('  Seeding presence table...');
    await Promise.all(players.map(p =>
        admin.from('mpl_match_player_presence')
            .upsert({ match_id: p.matchId, player_id: p.playerId, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' })
    ));
    console.log(' done\n');

    console.log('  Starting load test...');
    console.log('  (press Ctrl+C for early report)\n');

    metrics.startTime = Date.now();
    const handles = [];

    players.forEach((p, i) => {
        // Stagger startup across one full lite interval so bursts are spread
        const stagger = Math.floor((i / players.length) * LITE_INTERVAL);

        // ── LITE: fires every LITE_INTERVAL after stagger
        const liteHandle = setTimeout(() => {
            queryLite(p.matchId, p.playerId, p.teamId, p.playerInningsNumber, p.matchFirstBattingTeamId, p.matchStatus);
            const iv = setInterval(() =>
                queryLite(p.matchId, p.playerId, p.teamId, p.playerInningsNumber, p.matchFirstBattingTeamId, p.matchStatus),
                LITE_INTERVAL
            );
            handles.push(iv);
        }, stagger);
        handles.push(liteHandle);

        // ── FULL: fires every FULL_INTERVAL offset by half to avoid colliding with lite
        const fullHandle = setTimeout(() => {
            queryFull(p.matchId, p.playerId, p.teamId);
            const iv = setInterval(() => queryFull(p.matchId, p.playerId, p.teamId), FULL_INTERVAL);
            handles.push(iv);
        }, stagger + FULL_INTERVAL);           // first full at 30 s (not at t=0)
        handles.push(fullHandle);

        // ── PRESENCE: fires every PRESENCE_INTERVAL offset differently
        const presHandle = setTimeout(() => {
            queryPresence(p.matchId, p.playerId);
            const iv = setInterval(() => queryPresence(p.matchId, p.playerId), PRESENCE_INTERVAL);
            handles.push(iv);
        }, stagger + 2000);                     // slightly after lite, not all at once
        handles.push(presHandle);
    });

    // Live progress bar
    const progressIv = setInterval(() => {
        const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(0);
        const liteTotal = metrics.lite.ok + metrics.lite.err;
        const rps = (liteTotal / Math.max(elapsed, 1)).toFixed(1);
        const errPct = liteTotal ? ((metrics.lite.err / liteTotal) * 100).toFixed(1) : '0.0';
        const p95raw = metrics.lite.ms.sort((a,b)=>a-b)[Math.ceil(0.95 * metrics.lite.ms.length) - 1] || 0;
        process.stdout.write(
            `\r  ⏱  ${String(elapsed).padStart(3)}s | lite: ${liteTotal} (${rps}/s) | full: ${metrics.full.ok + metrics.full.err} | errs: ${metrics.lite.err + metrics.full.err} (${errPct}%) | p95: ${p95raw}ms    `
        );
    }, 1000);

    handles.push(progressIv);

    // Graceful shutdown on Ctrl+C
    process.on('SIGINT', () => {
        handles.forEach(h => { try { clearInterval(h); clearTimeout(h); } catch {} });
        printReport();
        process.exit(0);
    });

    // Auto-stop after DURATION_S
    await new Promise(resolve => setTimeout(resolve, DURATION_S * 1000));
    handles.forEach(h => { try { clearInterval(h); clearTimeout(h); } catch {} });
    printReport();
    process.exit(0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
