/**
 * MPL Stress Ramp — scripts/stress-ramp-mpl.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Progressively increases player count until the DB degrades or fails.
 * Each tier runs for TIER_DURATION seconds then pauses 5 s before the next.
 *
 * Tiers: 50 → 100 → 150 → 200 → 300 → 400 → 500
 *
 * Pass threshold:  P95 lite < 1000ms AND error rate < 2%
 * Warn threshold:  P95 lite < 3000ms AND error rate < 5%
 * Fail:            P95 lite ≥ 3000ms  OR error rate ≥ 5%
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env' });

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌  Missing SUPABASE env vars in .env'); process.exit(1);
}

const TIERS          = [50, 100, 150, 200, 300, 400, 500];
const TIER_DURATION  = 30;   // seconds per tier
const COOLDOWN       = 5;    // seconds between tiers
const LITE_INTERVAL  = 5000;
const FULL_INTERVAL  = 30000;
const PRESENCE_INTERVAL = 30000;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
});

// ── Query simulators (same as load-test-mpl.mjs) ─────────────────────────────

async function queryLite(matchId, playerId, teamId, playerInningsNumber, matchFirstBattingTeamId, matchStatus, m) {
    const t0 = Date.now();
    try {
        const playerBatsFirst  = matchFirstBattingTeamId === teamId;
        const firstBattingSide = playerBatsFirst ? playerInningsNumber : (playerInningsNumber === 1 ? 2 : 1);
        const battingInnings   = matchStatus === 'innings_2' ? (firstBattingSide === 1 ? 2 : 1) : firstBattingSide;
        void battingInnings;

        const [r1, r2, r3] = await Promise.all([
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, batter_id, bowler_id, timer_seconds, status, answer_started_at, metadata, mpl_questions(question_text, options, runs), mpl_ball_types(default_runs)')
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

        if (r1.error || r2.error || r3.error) { m.err++; return; }

        if (r1.data) {
            const ids = [...new Set([r1.data.batter_id, r1.data.bowler_id].filter(Boolean))];
            if (ids.length) await admin.from('mpl_players').select('id, name').in('id', ids);
        }

        m.ok++; m.ms.push(Date.now() - t0);
    } catch { m.err++; }
}

async function queryFull(matchId, playerId, teamId, m) {
    const t0 = Date.now();
    try {
        const [, r2, r3, r4, r5, r6] = await Promise.all([
            admin.from('mpl_match_player_presence')
                .upsert({ match_id: matchId, player_id: playerId, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' }),
            admin.from('mpl_match_teams')
                .select('team_id, innings_number, side_name, mentor_name, mentor_email, mpl_teams(id, team_name, team_code)')
                .eq('match_id', matchId).order('innings_number'),
            admin.from('mpl_match_deliveries')
                .select('id, status, batter_id, bowler_id, timer_seconds, answer_started_at, metadata, mpl_questions(question_text, options, runs), mpl_ball_types(default_runs)')
                .eq('match_id', matchId).eq('status', 'active')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_delivery_requests')
                .select('id, delivery_number, batter_id, bowler_id, status, created_at')
                .eq('match_id', matchId).eq('status', 'pending')
                .order('created_at', { ascending: false }).limit(1).maybeSingle(),
            admin.from('mpl_match_deliveries')
                .select('id, innings_number, status, runs_awarded, score_adjustment, metadata, batter_id, created_at, answer_started_at, answer_submitted_at')
                .eq('match_id', matchId),
            admin.from('mpl_match_player_presence')
                .select('player_id').eq('match_id', matchId).is('left_at', null)
                .gte('last_seen_at', new Date(Date.now() - 15000).toISOString()),
        ]);

        if (r2.error || r3.error || r4.error || r5.error || r6.error) { m.err++; return; }

        const teamIds = (r2.data || []).map(t => t.team_id);
        if (teamIds.length) {
            const { error } = await admin.from('mpl_players')
                .select('id, team_id, name, roll_number, is_leader').in('team_id', teamIds);
            if (error) { m.err++; return; }
        }

        m.ok++; m.ms.push(Date.now() - t0);
    } catch { m.err++; }
}

async function queryPresence(matchId, playerId, m) {
    const t0 = Date.now();
    try {
        const { error } = await admin.from('mpl_match_player_presence')
            .upsert({ match_id: matchId, player_id: playerId, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' });
        if (error) { m.err++; return; }
        m.ok++; m.ms.push(Date.now() - t0);
    } catch { m.err++; }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(arr, p) {
    if (!arr.length) return 9999;
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
}

function verdict(p95, errRate) {
    if (errRate >= 0.05 || p95 >= 3000) return { icon: '❌', label: 'FAIL', stop: true };
    if (errRate >= 0.02 || p95 >= 1000) return { icon: '⚠️ ', label: 'WARN', stop: false };
    return { icon: '✅', label: 'PASS', stop: false };
}

// ── Discovery ─────────────────────────────────────────────────────────────────

async function discoverPool(maxMatches) {
    const { data: matches } = await admin.from('mpl_matches').select('id, status, first_batting_team_id')
        .not('status', 'in', '(abandoned)').order('created_at', { ascending: false }).limit(maxMatches * 2);

    const pool = [];
    for (const match of (matches || []).slice(0, maxMatches)) {
        const { data: matchTeams } = await admin.from('mpl_match_teams')
            .select('team_id, innings_number').eq('match_id', match.id);
        if (!matchTeams?.length) continue;

        const teamIds = matchTeams.map(t => t.team_id);
        const { data: players } = await admin.from('mpl_players')
            .select('id, team_id').in('team_id', teamIds).limit(30);

        for (const p of (players || [])) {
            const team = matchTeams.find(t => t.team_id === p.team_id);
            pool.push({ matchId: match.id, matchStatus: match.status, matchFirstBattingTeamId: match.first_batting_team_id, playerId: p.id, teamId: p.team_id, playerInningsNumber: team?.innings_number || 1 });
        }
    }
    return pool;
}

// ── Run one tier ──────────────────────────────────────────────────────────────

async function runTier(playerCount, pool) {
    // Build virtual player list (cycle the real pool)
    const players = Array.from({ length: playerCount }, (_, i) => pool[i % pool.length]);

    const mLite     = { ok: 0, err: 0, ms: [] };
    const mFull     = { ok: 0, err: 0, ms: [] };
    const mPresence = { ok: 0, err: 0, ms: [] };
    const startTime = Date.now();
    const handles   = [];

    players.forEach((p, i) => {
        const stagger = Math.floor((i / players.length) * LITE_INTERVAL);

        const h1 = setTimeout(() => {
            queryLite(p.matchId, p.playerId, p.teamId, p.playerInningsNumber, p.matchFirstBattingTeamId, p.matchStatus, mLite);
            const iv = setInterval(() => queryLite(p.matchId, p.playerId, p.teamId, p.playerInningsNumber, p.matchFirstBattingTeamId, p.matchStatus, mLite), LITE_INTERVAL);
            handles.push(iv);
        }, stagger);

        const h2 = setTimeout(() => {
            queryFull(p.matchId, p.playerId, p.teamId, mFull);
            const iv = setInterval(() => queryFull(p.matchId, p.playerId, p.teamId, mFull), FULL_INTERVAL);
            handles.push(iv);
        }, stagger + FULL_INTERVAL);

        const h3 = setTimeout(() => {
            queryPresence(p.matchId, p.playerId, mPresence);
            const iv = setInterval(() => queryPresence(p.matchId, p.playerId, mPresence), PRESENCE_INTERVAL);
            handles.push(iv);
        }, stagger + 2000);

        handles.push(h1, h2, h3);
    });

    // Live progress
    const progressIv = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
        const lTotal  = mLite.ok + mLite.err;
        const p95now  = pct(mLite.ms, 95);
        const errRate = lTotal ? ((mLite.err / lTotal) * 100).toFixed(1) : '0.0';
        process.stdout.write(`\r    ⏱  ${String(elapsed).padStart(2)}s | lite:${lTotal} | errs:${mLite.err + mFull.err}(${errRate}%) | p95:${p95now}ms    `);
    }, 500);
    handles.push(progressIv);

    await new Promise(resolve => setTimeout(resolve, TIER_DURATION * 1000));

    handles.forEach(h => { try { clearInterval(h); clearTimeout(h); } catch {} });
    process.stdout.write('\n');

    const elapsed  = (Date.now() - startTime) / 1000;
    const totalReq = mLite.ok + mLite.err + mFull.ok + mFull.err + mPresence.ok + mPresence.err;
    const errRate  = (mLite.err + mFull.err + mPresence.err) / Math.max(totalReq, 1);

    return {
        players: playerCount,
        rps: (totalReq / elapsed).toFixed(1),
        errRate,
        lite:  { ok: mLite.ok,     err: mLite.err,     p50: pct(mLite.ms, 50),     p95: pct(mLite.ms, 95),     p99: pct(mLite.ms, 99),     max: pct(mLite.ms, 100) },
        full:  { ok: mFull.ok,     err: mFull.err,     p95: pct(mFull.ms, 95) },
        pres:  { ok: mPresence.ok, err: mPresence.err },
    };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║         RMC · MPL STRESS RAMP — FINDING THE LIMIT               ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`  Tiers: ${TIERS.join(' → ')} players`);
    console.log(`  ${TIER_DURATION}s per tier, ${COOLDOWN}s cooldown between\n`);

    console.log('🔍  Discovering matches and players...');
    const pool = await discoverPool(10);
    if (!pool.length) { console.error('❌  No match/player data found.'); process.exit(1); }
    const matchCount = [...new Set(pool.map(p => p.matchId))].length;
    console.log(`  Found ${pool.length} real entries across ${matchCount} match(es)\n`);

    // Seed presence
    process.stdout.write('  Seeding presence table...');
    await Promise.all(pool.map(p =>
        admin.from('mpl_match_player_presence')
            .upsert({ match_id: p.matchId, player_id: p.playerId, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' })
    ));
    console.log(' done\n');

    const results = [];
    let limitFound = false;

    for (const tier of TIERS) {
        console.log(`${'─'.repeat(66)}`);
        console.log(`  🔥  Tier: ${tier} players  (${TIER_DURATION}s)`);

        const result = await runTier(tier, pool);
        results.push(result);

        const v = verdict(result.lite.p95, result.errRate);
        console.log(`  ${v.icon}  ${v.label}  |  P95: ${result.lite.p95}ms  |  err: ${(result.errRate * 100).toFixed(1)}%  |  ${result.rps} req/s`);

        if (v.stop) {
            console.log(`\n  ⛔  DB degraded at ${tier} players — stopping ramp.\n`);
            limitFound = true;
            break;
        }

        if (tier !== TIERS[TIERS.length - 1]) {
            process.stdout.write(`  ⏳  Cooldown ${COOLDOWN}s...`);
            await new Promise(r => setTimeout(r, COOLDOWN * 1000));
            console.log(' done');
        }
    }

    // ── Final summary table ──────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(78));
    console.log('  STRESS RAMP — SUMMARY TABLE');
    console.log('═'.repeat(78));
    console.log('  Players │ req/s │ err%  │ P50    │ P95    │ P99    │ max    │ Verdict');
    console.log('  ────────┼───────┼───────┼────────┼────────┼────────┼────────┼────────');
    for (const r of results) {
        const v = verdict(r.lite.p95, r.errRate);
        console.log(
            `  ${String(r.players).padEnd(7)} │ ${String(r.rps).padEnd(5)} │ ${(r.errRate * 100).toFixed(1).padEnd(5)} │` +
            ` ${String(r.lite.p50 + 'ms').padEnd(6)} │ ${String(r.lite.p95 + 'ms').padEnd(6)} │` +
            ` ${String(r.lite.p99 + 'ms').padEnd(6)} │ ${String(r.lite.max + 'ms').padEnd(6)} │ ${v.icon} ${v.label}`
        );
    }
    console.log('═'.repeat(78));

    const passing = results.filter(r => verdict(r.lite.p95, r.errRate).label === 'PASS');
    const safeLimit = passing.length ? passing[passing.length - 1].players : 0;
    const warnLimit = results.find(r => verdict(r.lite.p95, r.errRate).label === 'WARN')?.players;
    const failLimit = results.find(r => verdict(r.lite.p95, r.errRate).label === 'FAIL')?.players;

    console.log(`\n  ✅  Safe limit  (P95<1s,  err<2%): ${safeLimit   || 'N/A'} players`);
    if (warnLimit) console.log(`  ⚠️   Warn limit  (P95<3s,  err<5%): ${warnLimit} players`);
    if (failLimit) console.log(`  ❌  Fail limit  (P95≥3s or err≥5%): ${failLimit} players`);
    if (!limitFound) console.log(`  🏆  Never failed — system can handle >${TIERS[TIERS.length-1]} players comfortably!`);

    console.log('\n  Note: with Supabase Realtime active, real event load is ~10x lower than');
    console.log('  this test (polling only fires on DB change, not on a fixed interval).\n');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
