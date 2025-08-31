import { PlayerCard } from "@shared/schema";

interface Team {
  players: PlayerCard[];
  averageRating: number;
}

export function generateBalancedTeams(players: PlayerCard[]): { teamA: Team; teamB: Team } {
  // Sort players by overall rating in descending order
  const sortedPlayers = [...players].sort((a, b) => b.overall - a.overall);
  
  const teamA: PlayerCard[] = [];
  const teamB: PlayerCard[] = [];
  
  // Greedy algorithm: assign each player to the team with lower current average
  for (const player of sortedPlayers) {
    const teamAAvg = teamA.length > 0 
      ? teamA.reduce((sum, p) => sum + p.overall, 0) / teamA.length 
      : 0;
    
    const teamBAvg = teamB.length > 0 
      ? teamB.reduce((sum, p) => sum + p.overall, 0) / teamB.length 
      : 0;
    
    // If teams are equal size, assign to team with lower average
    // If one team is smaller, assign to the smaller team
    if (teamA.length === teamB.length) {
      if (teamAAvg <= teamBAvg) {
        teamA.push(player);
      } else {
        teamB.push(player);
      }
    } else if (teamA.length < teamB.length) {
      teamA.push(player);
    } else {
      teamB.push(player);
    }
  }
  
  const teamAAverage = teamA.length > 0 
    ? Math.round((teamA.reduce((sum, p) => sum + p.overall, 0) / teamA.length) * 10) / 10
    : 0;
  
  const teamBAverage = teamB.length > 0 
    ? Math.round((teamB.reduce((sum, p) => sum + p.overall, 0) / teamB.length) * 10) / 10
    : 0;
  
  return {
    teamA: {
      players: teamA,
      averageRating: teamAAverage,
    },
    teamB: {
      players: teamB,
      averageRating: teamBAverage,
    },
  };
}
