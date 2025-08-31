import { useState } from "react";
import { Player } from "@shared/schema";
import { generateBalancedTeams } from "@/lib/team-balancer";
import { Button } from "@/components/ui/button";

interface TeamGeneratorProps {
  players: Player[];
}

interface Team {
  players: Player[];
  averageRating: number;
}

export default function TeamGenerator({ players }: TeamGeneratorProps) {
  const [teams, setTeams] = useState<{ teamA: Team; teamB: Team } | null>(null);

  const handleGenerateTeams = () => {
    if (players.length < 2) return;
    
    const balancedTeams = generateBalancedTeams(players);
    setTeams(balancedTeams);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <i className="fas fa-users text-primary"></i>
        Balanced Teams Generator
      </h2>
      
      <div className="mb-6">
        <Button 
          data-testid="button-generate-teams"
          onClick={handleGenerateTeams}
          disabled={players.length < 2}
          className="flex items-center gap-2"
        >
          <i className="fas fa-random"></i>
          Generate Balanced Teams
        </Button>
      </div>

      {teams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team A */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                <i className="fas fa-shield-alt text-blue-400"></i>
                Team A
              </h3>
              <span className="text-sm font-bold text-blue-400">
                AVG: <span data-testid="team-a-average">{teams.teamA.averageRating}</span>
              </span>
            </div>
            
            <div className="space-y-2">
              {teams.teamA.players.map((player) => (
                <div 
                  key={player.id}
                  data-testid={`team-a-player-${player.id}`}
                  className="flex items-center justify-between bg-background/50 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {player.overall}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {player.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.position}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Team B */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
                <i className="fas fa-shield-alt text-red-400"></i>
                Team B
              </h3>
              <span className="text-sm font-bold text-red-400">
                AVG: <span data-testid="team-b-average">{teams.teamB.averageRating}</span>
              </span>
            </div>
            
            <div className="space-y-2">
              {teams.teamB.players.map((player) => (
                <div 
                  key={player.id}
                  data-testid={`team-b-player-${player.id}`}
                  className="flex items-center justify-between bg-background/50 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {player.overall}
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {player.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.position}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {players.length < 2 && (
        <div className="text-center py-8">
          <i className="fas fa-users text-muted-foreground text-4xl mb-4"></i>
          <p className="text-muted-foreground">Need at least 2 players to generate teams</p>
        </div>
      )}
    </div>
  );
}
