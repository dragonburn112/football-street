import { PlayerCard } from "@shared/schema";

interface Team {
  players: PlayerCard[];
  averageRating: number;
}

// Calculate total stats for a team across all stat categories
function calculateTeamStats(team: PlayerCard[]) {
  return {
    pace: team.reduce((sum, p) => sum + p.pace, 0),
    shooting: team.reduce((sum, p) => sum + p.shooting, 0),
    passing: team.reduce((sum, p) => sum + p.passing, 0),
    dribbling: team.reduce((sum, p) => sum + p.dribbling, 0),
    defense: team.reduce((sum, p) => sum + p.defense, 0),
    physical: team.reduce((sum, p) => sum + p.physical, 0),
    overall: team.reduce((sum, p) => sum + p.overall, 0),
  };
}

// Calculate the imbalance score between two teams (lower is better)
function calculateImbalanceScore(teamA: PlayerCard[], teamB: PlayerCard[]) {
  const statsA = calculateTeamStats(teamA);
  const statsB = calculateTeamStats(teamB);
  
  // Calculate differences across all stat categories
  const paceDiff = Math.abs(statsA.pace - statsB.pace);
  const shootingDiff = Math.abs(statsA.shooting - statsB.shooting);
  const passingDiff = Math.abs(statsA.passing - statsB.passing);
  const dribblingDiff = Math.abs(statsA.dribbling - statsB.dribbling);
  const defenseDiff = Math.abs(statsA.defense - statsB.defense);
  const physicalDiff = Math.abs(statsA.physical - statsB.physical);
  const overallDiff = Math.abs(statsA.overall - statsB.overall);
  
  // Return weighted sum of differences (lower = more balanced)
  return paceDiff + shootingDiff + passingDiff + dribblingDiff + defenseDiff + physicalDiff + (overallDiff * 2);
}

export function generateBalancedTeams(players: PlayerCard[]): { teamA: Team; teamB: Team } {
  if (players.length < 2) {
    return {
      teamA: { players: [], averageRating: 0 },
      teamB: { players: [], averageRating: 0 },
    };
  }

  // For small groups, use simple alternating assignment
  if (players.length <= 4) {
    const sortedPlayers = [...players].sort((a, b) => b.overall - a.overall);
    const teamA: PlayerCard[] = [];
    const teamB: PlayerCard[] = [];
    
    sortedPlayers.forEach((player, index) => {
      if (index % 2 === 0) {
        teamA.push(player);
      } else {
        teamB.push(player);
      }
    });
    
    return {
      teamA: {
        players: teamA,
        averageRating: teamA.length > 0 ? Math.round((teamA.reduce((sum, p) => sum + p.overall, 0) / teamA.length) * 10) / 10 : 0,
      },
      teamB: {
        players: teamB,
        averageRating: teamB.length > 0 ? Math.round((teamB.reduce((sum, p) => sum + p.overall, 0) / teamB.length) * 10) / 10 : 0,
      },
    };
  }

  // For larger groups, use advanced stat-based balancing
  let bestTeamA: PlayerCard[] = [];
  let bestTeamB: PlayerCard[] = [];
  let bestScore = Infinity;
  
  // Try multiple random assignments and pick the most balanced one
  const attempts = Math.min(1000, Math.pow(2, Math.min(players.length, 10))); // Limit attempts for performance
  
  for (let attempt = 0; attempt < attempts; attempt++) {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const teamA: PlayerCard[] = [];
    const teamB: PlayerCard[] = [];
    
    // Assign players one by one to the team that results in better balance
    for (const player of shuffled) {
      const scoreA = calculateImbalanceScore([...teamA, player], teamB);
      const scoreB = calculateImbalanceScore(teamA, [...teamB, player]);
      
      // Also consider team size balance
      const sizeImbalance = Math.abs(teamA.length - teamB.length);
      
      if (teamA.length === teamB.length) {
        // Teams same size, assign to team that gives better stat balance
        if (scoreA <= scoreB) {
          teamA.push(player);
        } else {
          teamB.push(player);
        }
      } else if (sizeImbalance > 1) {
        // Teams too imbalanced, assign to smaller team
        if (teamA.length < teamB.length) {
          teamA.push(player);
        } else {
          teamB.push(player);
        }
      } else {
        // Teams relatively balanced, assign to team that gives better stats
        if (scoreA <= scoreB) {
          teamA.push(player);
        } else {
          teamB.push(player);
        }
      }
    }
    
    const finalScore = calculateImbalanceScore(teamA, teamB);
    if (finalScore < bestScore) {
      bestScore = finalScore;
      bestTeamA = teamA;
      bestTeamB = teamB;
    }
  }
  
  const teamAAverage = bestTeamA.length > 0 
    ? Math.round((bestTeamA.reduce((sum, p) => sum + p.overall, 0) / bestTeamA.length) * 10) / 10
    : 0;
  
  const teamBAverage = bestTeamB.length > 0 
    ? Math.round((bestTeamB.reduce((sum, p) => sum + p.overall, 0) / bestTeamB.length) * 10) / 10
    : 0;
  
  return {
    teamA: {
      players: bestTeamA,
      averageRating: teamAAverage,
    },
    teamB: {
      players: bestTeamB,
      averageRating: teamBAverage,
    },
  };
}
