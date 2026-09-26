import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    db:   { schema: 'public' }
});

const MATCHES_COUNT = 5;
const PLAYERS_PER_MATCH = 20;
const ADMIN_COUNT = 5;

const DURATION_S = 60; // 60 seconds test
const LITE_INTERVAL = 3000;
const FULL_INTERVAL = 30000;
const ADMIN_INTERVAL = 5000;

const metrics = {
    lite:     { ok: 0, err: 0, ms: [] },
    full:     { ok: 0, err: 0, ms: [] },
    admin:    { ok: 0, err: 0, ms: [] },
    presence: { ok: 0, err: 0, ms: [] },
    startTime: Date.now(),
};

function record(bucket, ok, ms) {
    if (ok) { metrics[bucket].ok++; metrics[bucket].ms.push(ms); }
    else      metrics[bucket].err++;
}

async function setupTestEnvironment() {
    console.log('1. Setting up test environment...');
    
    // Create teams if needed
    const teams = [];
    for(let i=1; i<=MATCHES_COUNT*2; i++) {
        const uniqueId = `${Date.now()}_${i}`;
        const {data: t, error} = await admin.from('mpl_teams').insert({
            team_name: `Load Test Team ${uniqueId}`,
            team_code: `LT${uniqueId.slice(-6)}`
        }).select().single();
        if (error) { console.error("Error creating team:", error); throw error; }
        teams.push(t);
    }
    
    const matches = [];
    const allPlayers = [];
    
    for(let i=0; i<MATCHES_COUNT; i++) {
        const t1 = teams[i*2];
        const t2 = teams[i*2 + 1];
        
        // Create Match
        const { data: match, error: matchErr } = await admin.from('mpl_matches').insert({
            status: 'innings_1',
            total_questions_per_innings: 3,
            created_by: 'load_test',
            first_batting_team_id: t1.id
        }).select().single();
        if (matchErr) { console.error("Error creating match:", matchErr); throw matchErr; }
        matches.push(match);
        
        const { error: mtErr } = await admin.from('mpl_match_teams').insert([
            { match_id: match.id, team_id: t1.id, innings_number: 1 },
            { match_id: match.id, team_id: t2.id, innings_number: 2 }
        ]);
        if (mtErr) { console.error("Error creating match teams:", mtErr); throw mtErr; }
        
        // Create 10 players for t1, 10 players for t2
        for(let j=0; j<10; j++) {
            const {data: p1, error: p1Err} = await admin.from('mpl_players').insert({ team_id: t1.id, name: `Player A ${j}`, roll_number: `R${match.id.slice(0, 4)}A${j}`, email: `a_${match.id.slice(0, 4)}_${j}@test.com`, phone_number: `900000${j.toString().padStart(4, '0')}` }).select().single();
            if (p1Err) { console.error("Error creating p1:", p1Err); throw p1Err; }
            const {data: p2, error: p2Err} = await admin.from('mpl_players').insert({ team_id: t2.id, name: `Player B ${j}`, roll_number: `R${match.id.slice(0, 4)}B${j}`, email: `b_${match.id.slice(0, 4)}_${j}@test.com`, phone_number: `900001${j.toString().padStart(4, '0')}` }).select().single();
            if (p2Err) { console.error("Error creating p2:", p2Err); throw p2Err; }
            
            allPlayers.push({ matchId: match.id, teamId: t1.id, playerId: p1.id, playerInningsNumber: 1, matchStatus: 'innings_1', matchFirstBattingTeamId: t1.id });
            allPlayers.push({ matchId: match.id, teamId: t2.id, playerId: p2.id, playerInningsNumber: 2, matchStatus: 'innings_1', matchFirstBattingTeamId: t1.id });
        }
    }
    
    console.log(`Setup complete: ${matches.length} matches, ${allPlayers.length} players created.`);
    return { matches, allPlayers };
}

async function queryLite(matchId, playerId, teamId, playerInningsNumber, matchFirstBattingTeamId, matchStatus) {
    const t0 = Date.now();
    try {
        const [r1, r2, r3] = await Promise.all([
            admin.from('mpl_match_deliveries').select('id, innings_number, delivery_number, status, metadata').eq('match_id', matchId).eq('status', 'active').limit(1).maybeSingle(),
            admin.from('mpl_match_delivery_requests').select('id, status').eq('match_id', matchId).eq('status', 'pending').limit(1).maybeSingle(),
            admin.from('mpl_match_deliveries').select('id, innings_number, status, runs_awarded, score_adjustment').eq('match_id', matchId)
        ]);
        if (r1.error || r2.error || r3.error) { record('lite', false, 0); return; }
        record('lite', true, Date.now() - t0);
    } catch { record('lite', false, 0); }
}

async function queryFull(matchId, playerId, teamId) {
    const t0 = Date.now();
    try {
        const [, r2, r3, r4, r5, r6] = await Promise.all([
            admin.from('mpl_match_player_presence').upsert({ match_id: matchId, player_id: playerId, last_seen_at: new Date().toISOString(), left_at: null }, { onConflict: 'match_id,player_id' }),
            admin.from('mpl_match_teams').select('team_id, innings_number').eq('match_id', matchId).order('innings_number'),
            admin.from('mpl_match_deliveries').select('id, innings_number, delivery_number, status').eq('match_id', matchId).eq('status', 'active').limit(1).maybeSingle(),
            admin.from('mpl_match_delivery_requests').select('id, status').eq('match_id', matchId).eq('status', 'pending').limit(1).maybeSingle(),
            admin.from('mpl_match_deliveries').select('id, runs_awarded').eq('match_id', matchId),
            admin.from('mpl_match_player_presence').select('player_id').eq('match_id', matchId).is('left_at', null).gte('last_seen_at', new Date(Date.now() - 15000).toISOString()),
        ]);
        if (r2.error || r3.error || r4.error || r5.error || r6.error) { record('full', false, 0); return; }
        
        const teamIds = (r2.data || []).map(t => t.team_id);
        if (teamIds.length) {
            const { error } = await admin.from('mpl_players').select('id, team_id, name').in('team_id', teamIds);
            if (error) { record('full', false, 0); return; }
        }
        record('full', true, Date.now() - t0);
    } catch { record('full', false, 0); }
}

async function queryAdmin(matchId) {
    const t0 = Date.now();
    try {
        const [r1, r2, r3, r4] = await Promise.all([
            admin.from('mpl_matches').select('*').eq('id', matchId).single(),
            admin.from('mpl_match_teams').select('*, mpl_teams(*)').eq('match_id', matchId),
            admin.from('mpl_match_deliveries').select('*, mpl_questions(question_text), mpl_ball_types(default_runs)').eq('match_id', matchId),
            admin.from('mpl_match_player_presence').select('*, mpl_players(name, roll_number, team_id)').eq('match_id', matchId)
        ]);
        if (r1.error || r2.error || r3.error || r4.error) { record('admin', false, 0); return; }
        record('admin', true, Date.now() - t0);
    } catch { record('admin', false, 0); }
}

async function main() {
    console.log(`Starting Foolproof Load Test...`);
    const { matches, allPlayers } = await setupTestEnvironment();
    
    console.log(`\nSimulating ${allPlayers.length} players and ${ADMIN_COUNT} admins...`);
    
    metrics.startTime = Date.now();
    const handles = [];

        // Players only poll 'lite' when an admin broadcasts an update, plus a jitter
        let playerLiteTimeouts = [];
        const simulateAdminUpdate = () => {
            allPlayers.forEach(p => {
                const jitter = Math.floor(Math.random() * 1500); // 1.5s jitter
                const timeout = setTimeout(() => {
                    queryLite(p.matchId, p.playerId, p.teamId, p.playerInningsNumber, p.matchFirstBattingTeamId, p.matchStatus);
                }, jitter);
                playerLiteTimeouts.push(timeout);
            });
        };

        // Admins trigger a change every 10 seconds (e.g. creating delivery, marking wicket)
        const adminTriggerInterval = setInterval(() => {
            simulateAdminUpdate();
        }, 10000);
        handles.push(adminTriggerInterval);

        allPlayers.forEach((p, i) => {
            const stagger = Math.floor((i / allPlayers.length) * FULL_INTERVAL);
            const fullHandle = setTimeout(() => {
                queryFull(p.matchId, p.playerId, p.teamId);
                handles.push(setInterval(() => queryFull(p.matchId, p.playerId, p.teamId), FULL_INTERVAL));
            }, stagger + 2000);
            handles.push(fullHandle);
        });
    
    // Setup Admins
    for(let i=0; i<ADMIN_COUNT; i++) {
        const adminMatch = matches[i % matches.length];
        const stagger = Math.floor((i / ADMIN_COUNT) * ADMIN_INTERVAL);
        const adminHandle = setTimeout(() => {
            queryAdmin(adminMatch.id);
            handles.push(setInterval(() => queryAdmin(adminMatch.id), ADMIN_INTERVAL));
        }, stagger);
        handles.push(adminHandle);
    }

    const progressIv = setInterval(() => {
        const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(0);
        const liteTotal = metrics.lite.ok + metrics.lite.err;
        const adminTotal = metrics.admin.ok + metrics.admin.err;
        const errs = metrics.lite.err + metrics.full.err + metrics.admin.err;
        const p95raw = metrics.lite.ms.sort((a,b)=>a-b)[Math.ceil(0.95 * metrics.lite.ms.length) - 1] || 0;
        process.stdout.write(`\r  ⏱  ${elapsed}s | lite: ${liteTotal} | admin: ${adminTotal} | errs: ${errs} | p95 lite: ${p95raw}ms    `);
    }, 1000);
    handles.push(progressIv);

    await new Promise(r => setTimeout(r, DURATION_S * 1000));
    handles.forEach(h => { try { clearInterval(h); clearTimeout(h); } catch {} });
    playerLiteTimeouts.forEach(h => { try { clearTimeout(h); } catch {} });
    
    console.log('\n\n--- RESULTS ---');
    console.log(`Duration: ${DURATION_S}s`);
    console.log(`Lite API Calls : ok ${metrics.lite.ok}, err ${metrics.lite.err}`);
    console.log(`Full API Calls : ok ${metrics.full.ok}, err ${metrics.full.err}`);
    console.log(`Admin API Calls: ok ${metrics.admin.ok}, err ${metrics.admin.err}`);
    
    const lite95 = metrics.lite.ms.sort((a,b)=>a-b)[Math.ceil(0.95 * metrics.lite.ms.length) - 1] || 0;
    console.log(`Lite P95 Latency: ${lite95}ms`);
    
    // Cleanup
    console.log('Cleaning up test data...');
    for(const match of matches) {
        await admin.from('mpl_matches').delete().eq('id', match.id);
    }
    // Deleting teams will cascade to players
    for(let i=1; i<=MATCHES_COUNT*2; i++) {
        await admin.from('mpl_teams').delete().like('team_code', 'LT%');
    }
    console.log('Cleanup complete.');
    process.exit(0);
}

main().catch(console.error);
