const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const teamsDir = path.join(__dirname, '..', 'teams');

async function migrateTeams() {
  console.log("Fetching existing players and teams...");
  
  const { data: dbPlayers, error: playersError } = await supabase
    .from('mpl_players')
    .select('*');
    
  if (playersError) {
    console.error("Error fetching players:", playersError);
    return;
  }
  
  const { data: dbTeams, error: teamsError } = await supabase
    .from('mpl_teams')
    .select('*');
    
  if (teamsError) {
    console.error("Error fetching teams:", teamsError);
    return;
  }

  const files = fs.readdirSync(teamsDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const filePath = path.join(teamsDir, file);
    const teamData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const finalTeamName = teamData.teamName;
    
    console.log(`\nProcessing final team: ${finalTeamName}...`);
    
    // --- Determine Captain ---
    const teamCounts = {};
    const matchedPlayers = [];
    
    for (const p of teamData.players) {
      let match = dbPlayers.find(dp => dp.phone_number === p.contact);
      if (!match) {
        match = dbPlayers.find(dp => dp.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(dp.name.toLowerCase()));
      }
      
      if (match) {
        matchedPlayers.push({ jsonPlayer: p, dbPlayer: match });
        teamCounts[match.team_id] = (teamCounts[match.team_id] || 0) + 1;
      } else {
        console.warn(`⚠️ Could not find DB match for player: ${p.name} (${p.contact})`);
      }
    }
    
    let maxTeamId = null;
    let maxCount = 0;
    for (const [tId, count] of Object.entries(teamCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxTeamId = tId;
      }
    }
    
    let chosenCaptainId = null;
    if (maxTeamId) {
      // Find the leader of maxTeamId among the matched players for this final team
      const leaderMatch = matchedPlayers.find(mp => mp.dbPlayer.team_id === maxTeamId && mp.dbPlayer.is_leader);
      if (leaderMatch) {
        chosenCaptainId = leaderMatch.dbPlayer.id;
      } else {
        // Fallback: Just pick the first matched player from the majority team
        const anyMatch = matchedPlayers.find(mp => mp.dbPlayer.team_id === maxTeamId);
        if (anyMatch) {
          chosenCaptainId = anyMatch.dbPlayer.id;
        }
      }
    }
    
    // --- Create or Find the Final Team in DB ---
    let finalTeamId = null;
    const existingTeam = dbTeams.find(t => t.team_name === finalTeamName);
    
    if (existingTeam) {
      finalTeamId = existingTeam.id;
      console.log(`  Found existing team for ${finalTeamName} (ID: ${finalTeamId})`);
    } else {
      // Create new team
      const teamCode = finalTeamName.replace(/\s+/g, '-').toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      const { data: newTeam, error: insertError } = await supabase
        .from('mpl_teams')
        .insert([{ team_name: finalTeamName, team_code: teamCode }])
        .select()
        .single();
        
      if (insertError) {
        console.error(`  Error creating team ${finalTeamName}:`, insertError);
        continue;
      }
      finalTeamId = newTeam.id;
      console.log(`  Created new team ${finalTeamName} (ID: ${finalTeamId}, Code: ${teamCode})`);
      dbTeams.push(newTeam); // add to local cache just in case
    }
    
    // --- Update Players ---
    for (const mp of matchedPlayers) {
      const isCaptain = (mp.dbPlayer.id === chosenCaptainId);
      
      const { error: updateError } = await supabase
        .from('mpl_players')
        .update({
          team_id: finalTeamId,
          is_leader: isCaptain
        })
        .eq('id', mp.dbPlayer.id);
        
      if (updateError) {
        console.error(`  Error updating player ${mp.dbPlayer.name}:`, updateError);
      } else {
        console.log(`  Updated player ${mp.dbPlayer.name}: -> Team: ${finalTeamName}, Captain: ${isCaptain}`);
      }
    }
  }
  
  console.log("\nMigration completed successfully.");
}

migrateTeams();
