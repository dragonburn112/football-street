import type { PlayerCard } from "@shared/schema";

interface PlayerRole {
  title: string;
  icon: string;
}

// Generate cool player roles based on stats
export function getPlayerRole(player: PlayerCard): PlayerRole {
  const { pace, shooting, passing, dribbling, defense, physical, overall } = player;
  
  // Elite players (85+)
  if (overall >= 85) {
    if (shooting >= 80 && pace >= 80) return { title: "Goal Machine", icon: "🔥" };
    if (defense >= 80 && physical >= 80) return { title: "Wall of Steel", icon: "🛡️" };
    if (passing >= 85 && dribbling >= 80) return { title: "Maestro", icon: "🎭" };
    if (pace >= 90) return { title: "Lightning Bolt", icon: "⚡" };
    return { title: "Superstar", icon: "⭐" };
  }
  
  // Great players (75-84)
  if (overall >= 75) {
    if (shooting >= 75 && shooting > defense) return { title: "Striker", icon: "🎯" };
    if (defense >= 75 && defense > shooting) return { title: "Guardian", icon: "🛡️" };
    if (passing >= 75 && passing > pace) return { title: "Playmaker", icon: "🧠" };
    if (pace >= 75 && pace > physical) return { title: "Speed Demon", icon: "💨" };
    if (dribbling >= 75 && dribbling > defense) return { title: "Magician", icon: "🪄" };
    if (physical >= 75) return { title: "Beast", icon: "💪" };
    return { title: "Star Player", icon: "🌟" };
  }
  
  // Good players (65-74)
  if (overall >= 65) {
    const topStat = Math.max(pace, shooting, passing, dribbling, defense, physical);
    if (topStat === shooting) return { title: "Finisher", icon: "⚽" };
    if (topStat === defense) return { title: "Defender", icon: "🔒" };
    if (topStat === passing) return { title: "Passer", icon: "📤" };
    if (topStat === pace) return { title: "Runner", icon: "🏃" };
    if (topStat === dribbling) return { title: "Dribbler", icon: "⚡" };
    if (topStat === physical) return { title: "Tank", icon: "🦏" };
    return { title: "Solid Player", icon: "✅" };
  }
  
  // Average players (50-64)
  if (overall >= 50) {
    // Check for balanced stats
    const statRange = Math.max(pace, shooting, passing, dribbling, defense, physical) - 
                     Math.min(pace, shooting, passing, dribbling, defense, physical);
    if (statRange <= 15) return { title: "All-Rounder", icon: "🎪" };
    
    // Check for specific weaknesses/strengths
    if (pace <= 40) return { title: "Slow & Steady", icon: "🐢" };
    if (shooting <= 40) return { title: "Support Player", icon: "🤝" };
    if (defense >= 60) return { title: "Defensive Mind", icon: "🧱" };
    return { title: "Squad Player", icon: "👥" };
  }
  
  // Below average players (< 50)
  if (pace >= 60) return { title: "Speedster", icon: "🏃‍♂️" };
  if (physical >= 60) return { title: "Enforcer", icon: "💪" };
  if (shooting >= 45) return { title: "Hopeful Striker", icon: "🎯" };
  if (defense >= 45) return { title: "Last Line", icon: "🚧" };
  return { title: "Rookie", icon: "🔰" };
}

// Get role color based on overall rating
export function getRoleColor(overall: number): string {
  if (overall >= 85) return "text-yellow-500"; // Gold
  if (overall >= 75) return "text-purple-500"; // Purple
  if (overall >= 65) return "text-blue-500";   // Blue
  if (overall >= 50) return "text-green-500";  // Green
  return "text-gray-500";                      // Gray
}