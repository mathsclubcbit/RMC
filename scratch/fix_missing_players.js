const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const targetUpdates = [
  { teamName: 'SRH C', name: 'Abhinayasri gaddalaa', contact: '7671809904' },
  { teamName: 'SRH D', name: 'TARRA KRISHNA CHAITANYA', contact: '9704461939' },
  { teamName: 'RCB B', name: 'P MUKESH REDDY', contact: '7569714569' },
  { teamName: 'RCB B', name: 'vishnu vardhan', contact: '9182704236' },
  { teamName: 'MI B', name: 'Ritvik ram', contact: '9441409320' },
  { teamName: 'CSK B', name: 'Harshitha Maddikatla', contact: '9392300971' },
  { teamName: 'MI C', name: 'G. Sushanth', contact: '7386979486' },
  { teamName: 'MI C', name: 'S. Manu', contact: '8886844044' },
  { teamName: 'MI C', name: 'Harshith', contact: '9182762332' },
  { teamName: 'MI C', name: 'R. Sanjay', contact: '6304827312' }
];

async function fixPlayers() {
  console.log("Fetching existing teams...");
  
  const { data: dbTeams, error: teamsError } = await supabase
    .from('mpl_teams')
    .select('id, team_name');
    
  if (teamsError) {
    console.error("Error fetching teams:", teamsError);
    return;
  }
  
  const { data: dbPlayers, error: playersError } = await supabase
    .from('mpl_players')
    .select('*');
    
  if (playersError) {
    console.error("Error fetching players:", playersError);
    return;
  }

  for (const update of targetUpdates) {
    const targetTeam = dbTeams.find(t => t.team_name === update.teamName);
    if (!targetTeam) {
      console.error(`⚠️ Could not find target team: ${update.teamName}`);
      continue;
    }
    
    // Find player by contact
    let player = dbPlayers.find(p => p.phone_number === update.contact);
    if (!player) {
      // Find player by name as fallback
      player = dbPlayers.find(p => p.name.toLowerCase().includes(update.name.toLowerCase()));
    }

    if (player) {
      // Update existing player
      const { error: updateError } = await supabase
        .from('mpl_players')
        .update({ team_id: targetTeam.id })
        .eq('id', player.id);
        
      if (updateError) {
        console.error(`Error updating player ${update.name}:`, updateError);
      } else {
        console.log(`✅ Updated player ${update.name} (${update.contact}) to ${update.teamName}`);
      }
    } else {
      // Insert new player
      const { error: insertError } = await supabase
        .from('mpl_players')
        .insert([{
          name: update.name,
          phone_number: update.contact,
          team_id: targetTeam.id,
          is_leader: false,
          // providing some default values to avoid null constraints
          roll_number: 'N/A',
          email: 'notprovided@example.com',
          section: 'N/A',
          branch: 'N/A',
          year: 'N/A'
        }]);
        
      if (insertError) {
        console.error(`Error inserting new player ${update.name}:`, insertError);
      } else {
        console.log(`🆕 Inserted missing player ${update.name} (${update.contact}) into ${update.teamName}`);
      }
    }
  }
  
  console.log("Fixes completed.");
}

fixPlayers();
