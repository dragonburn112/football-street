import { type Match, type PlayerCard } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchDisplayProps {
  match: Match;
  players: PlayerCard[];
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  canEdit?: boolean;
}

export default function MatchDisplay({ match, players, onEdit, onDelete, onView, canEdit }: MatchDisplayProps) {
  // Create player lookup for quick access
  const playerLookup = players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, PlayerCard>);

  const getPlayersByTeam = (teamPlayerIds: string[]) => {
    return teamPlayerIds.map(id => playerLookup[id]).filter(Boolean);
  };

  const formatDate = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date().toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <i className="fas fa-futbol text-primary"></i>
                {match.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {match.numberOfTeams} teams • {match.playersPerTeam} players each • Created {formatDate(match.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {onView && (
                <Button
                  data-testid={`button-view-match-${match.id}`}
                  onClick={onView}
                  variant="outline"
                  size="sm"
                >
                  <i className="fas fa-eye mr-1"></i>
                  View
                </Button>
              )}
              {canEdit && (
                <>
                  {onEdit && (
                    <Button
                      data-testid={`button-edit-match-${match.id}`}
                      onClick={onEdit}
                      variant="outline"
                      size="sm"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      data-testid={`button-delete-match-${match.id}`}
                      onClick={onDelete}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Teams Display - Clean Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {match.teams.map((team, index) => {
          const teamPlayers = getPlayersByTeam(team.players);
          const isTeamA = index === 0;
          
          return (
            <div 
              key={index} 
              className={`border rounded-lg p-4 ${isTeamA ? 'bg-blue-500/5 border-blue-500/20' : 'bg-red-500/5 border-red-500/20'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className={`font-medium flex items-center gap-2 ${isTeamA ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  <i className="fas fa-shield-alt"></i>
                  {team.name}
                </h4>
                <div className={`text-sm font-bold ${isTeamA ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                  Team Rating: {team.totalStats.overall}
                </div>
              </div>
              <div className="space-y-2">
                {teamPlayers.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                    <div className={`w-8 h-8 ${isTeamA ? 'bg-blue-500' : 'bg-red-500'} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                      {player.overall}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.club}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Players ({teamPlayers.length})
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}