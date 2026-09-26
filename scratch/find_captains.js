const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const teamsDir = path.join(__dirname, '..', 'teams');

async function findCaptains() {
  // Fetch all players from DB
  const { data: dbPlayers, error } = await supabase
    .from('mpl_players')
    .select('name, phone_number, is_leader, team_id, mpl_teams(team_name)');
    
  if (error) {
    console.error("Error fetching players:", error);
    return;
  }
  
  const results = [];

  const files = fs.readdirSync(teamsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(teamsDir, file);
    const teamData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Count players from each original team
    const teamCounts = {}; // team_id -> count
    
    for (const p of teamData.players) {
      // Find matching player in DB
      let match = dbPlayers.find(dp => dp.phone_number === p.contact);
      if (!match) {
        match = dbPlayers.find(dp => dp.name.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(dp.name.toLowerCase()));
      }
      
      if (match) {
        teamCounts[match.team_id] = (teamCounts[match.team_id] || 0) + 1;
      }
    }
    
    // Find the team_id with the max count
    let maxTeamId = null;
    let maxCount = 0;
    
    for (const [tId, count] of Object.entries(teamCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxTeamId = tId;
      }
    }
    
    let finalCaptain = "Unknown";
    let originalTeamName = "Unknown";
    
    if (maxTeamId) {
      // Find the leader of maxTeamId
      const leader = dbPlayers.find(dp => dp.team_id === maxTeamId && dp.is_leader);
      originalTeamName = dbPlayers.find(dp => dp.team_id === maxTeamId)?.mpl_teams?.team_name || "Unknown";
      
      if (leader) {
        finalCaptain = leader.name;
      } else {
        // If no leader marked, just pick the first person from that team
        const anyMember = dbPlayers.find(dp => dp.team_id === maxTeamId);
        finalCaptain = anyMember ? anyMember.name + " (Not marked as leader in DB)" : "Unknown";
      }
    }
    
    results.push({
      finalTeam: teamData.teamName,
      captain: finalCaptain,
      originalTeam: originalTeamName,
      maxCount: maxCount
    });
  }
  
  console.table(results);
}

findCaptains();
