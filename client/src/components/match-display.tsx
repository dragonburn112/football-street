import { type Match, type PlayerCard } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchDisplayProps {
  match: Match;
  players: PlayerCard[];
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
}

export default function MatchDisplay({ match, players, onEdit, onDelete, canEdit }: MatchDisplayProps) {
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
            {canEdit && (
              <div className="flex gap-2">
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
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {match.teams.map((team, index) => {
          const teamPlayers = getPlayersByTeam(team.players);
          
          return (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full bg-primary`}></div>
                    {team.name}
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Overall Rating</p>
                    <p 
                      data-testid={`team-overall-${index}`}
                      className="text-xl font-bold text-primary"
                    >
                      {team.totalStats.overall}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Team Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">PAC</p>
                      <p className="font-semibold">{team.totalStats.pace}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">SHO</p>
                      <p className="font-semibold">{team.totalStats.shooting}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">PAS</p>
                      <p className="font-semibold">{team.totalStats.passing}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">DRI</p>
                      <p className="font-semibold">{team.totalStats.dribbling}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">DEF</p>
                      <p className="font-semibold">{team.totalStats.defense}</p>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-muted-foreground">PHY</p>
                      <p className="font-semibold">{team.totalStats.physical}</p>
                    </div>
                  </div>
                  
                  {/* Team Players */}
                  <div>
                    <p className="text-sm font-medium mb-2">Players ({teamPlayers.length})</p>
                    <div className="grid grid-cols-1 gap-2">
                      {teamPlayers.map((player) => (
                        <div 
                          key={player.id}
                          data-testid={`team-player-${player.id}`}
                          className="flex items-center gap-3 p-2 bg-background border rounded"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {player.profilePic ? (
                              <span className="text-sm">{player.profilePic}</span>
                            ) : (
                              <i className="fas fa-user text-primary text-xs"></i>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{player.name}</p>
                            <p className="text-xs text-muted-foreground">Overall: {player.overall}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}