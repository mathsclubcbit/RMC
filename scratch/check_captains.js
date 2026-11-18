const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: players, error } = await supabase
    .from('mpl_players')
    .select('name, is_leader, team_id, mpl_teams(team_name)');
    
  if (error) {
    console.error("Error fetching players:", error);
    return;
  }
  
  console.log(`Found ${players.length} players in the database.`);
  if (players.length > 0) {
    console.log("Sample player:", players[0]);
  }
}

run();
