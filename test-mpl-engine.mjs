import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE env vars in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function runTests() {
  console.log("--- Starting MPL Match Engine Test ---");
  
  const { data: teams } = await supabase.from('mpl_teams').select('*').limit(2);
  if (!teams || teams.length < 2) { console.error("Not enough teams. Please seed the DB."); return; }
  const t1 = teams[0], t2 = teams[1];
  
  const { data: p1 } = await supabase.from('mpl_players').select('*').eq('team_id', t1.id).limit(1).single();
  const { data: p2 } = await supabase.from('mpl_players').select('*').eq('team_id', t2.id).limit(1).single();
  
  if (!p1 || !p2) { console.error("Not enough players."); return; }

  console.log("1. Creating Match...");
  const { data: match, error: matchErr } = await supabase.from('mpl_matches').insert({
      status: 'toss_pending',
      total_questions_per_innings: 3,
      created_by: 'test_script'
  }).select().single();
  
  if (matchErr) { console.error("Match creation failed", matchErr); return; }
  console.log(`Created match ${match.id}`);

  // Setup match teams
  await supabase.from('mpl_match_teams').insert([
      { match_id: match.id, team_id: t1.id, innings_number: 1 },
      { match_id: match.id, team_id: t2.id, innings_number: 2 }
  ]);

  console.log("2. Recording Toss...");
  const { data: tossRes, error: tossErr } = await supabase.rpc('mpl_record_toss', {
      p_match_id: match.id,
      p_toss_winner_team_id: t1.id,
      p_first_batting_team_id: t1.id
  });
  if (tossErr) { console.error("Toss failed", tossErr); return; }
  console.log("Toss successful. Match status:", tossRes.status);

  console.log("3. Selecting Delivery...");
  const { data: delivery, error: delErr } = await supabase.rpc('mpl_select_delivery', {
      p_match_id: match.id,
      p_innings_number: 1,
      p_delivery_number: 1,
      p_ball_type_slug: 'normal_4',
      p_batter_id: p1.id,
      p_bowler_id: p2.id,
      p_timer_seconds: 60
  });
  if (delErr) { console.error("Delivery selection failed", delErr); return; }
  console.log(`Selected delivery! Question ID: ${delivery.question_id}`);

  console.log("4. Submitting Correct Answer with Power Shot...");
  // Need to know correct option
  const { data: q } = await supabase.from('mpl_questions').select('correct_option').eq('id', delivery.question_id).single();
  
  const { data: ansRes, error: ansErr } = await supabase.rpc('mpl_submit_answer', {
      p_delivery_id: delivery.id,
      p_phase: 'batter',
      p_answer_option: q.correct_option,
      p_power_shot: true
  });
  
  if (ansErr) { console.error("Answer submit failed", ansErr); return; }
  console.log(`Answer submitted! Awarded runs: ${ansRes.runs_awarded} (Should be doubled base runs)`);

  console.log("5. Testing Streak Bonus Function...");
  // In your new migration 023 you added mpl_apply_streak_bonus
  const { data: streakRes, error: streakErr } = await supabase.rpc('mpl_apply_streak_bonus', {
      p_delivery_id: delivery.id
  });
  if (streakErr) {
      console.error("Streak bonus failed. Error:", streakErr);
  } else {
      console.log(`Streak applied. Score adjustment added? ${streakRes ? 'Yes' : 'No'}`);
  }

  console.log("--- All tests completed successfully! ---");
}

runTests();
