import { User } from "firebase/auth";
import { type Match, type PlayerCard, type Group } from "@shared/schema";
import { shuffleMatchTeams, deleteMatch, isUserAdmin } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface MatchTabProps {
  match: Match;
  players: PlayerCard[];
  group: Group;
  user: User;
  onClose: () => void;
}

export default function MatchTab({ match, players, group, user, onClose }: MatchTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  
  const userIsAdmin = isUserAdmin(group, user.uid);
  
  // Create player lookup for quick access
  const playerLookup = players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, PlayerCard>);

  const getPlayersByTeam = (teamPlayerIds: string[]) => {
    return teamPlayerIds.map(id => playerLookup[id]).filter(Boolean);
  };

  const handleShuffleTeams = async () => {
    setLoading('shuffle');
    try {
      await shuffleMatchTeams(group.id, match.id, players);
      toast({
        title: "Success",
        description: "Teams shuffled!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to shuffle teams",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteMatch = async () => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    
    setLoading('delete');
    try {
      await deleteMatch(group.id, match.id);
      toast({
        title: "Success",
        description: "Match deleted!",
      });
      onClose(); // Go back to dashboard
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete match",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date().toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          data-testid="button-close-match-tab"
          onClick={onClose}
          variant="ghost"
          className="mb-4 p-0 h-auto text-muted-foreground"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Group
        </Button>

        {/* Match Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <i className="fas fa-futbol text-primary"></i>
                  {match.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {match.numberOfTeams} teams • {match.playersPerTeam} players each • Created {formatDate(match.createdAt)}
                </p>
              </div>
              
              {userIsAdmin && (
                <div className="flex gap-2">
                  <Button
                    data-testid="button-shuffle-teams"
                    onClick={handleShuffleTeams}
                    disabled={loading === 'shuffle'}
                    variant="outline"
                    size="sm"
                  >
                    {loading === 'shuffle' ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-random mr-2"></i>
                    )}
                    Shuffle Teams
                  </Button>
                  <Button
                    data-testid="button-delete-match"
                    onClick={handleDeleteMatch}
                    disabled={loading === 'delete'}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    {loading === 'delete' ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-trash mr-2"></i>
                    )}
                    Delete Match
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Teams Display */}
        <div className="grid gap-6">
          {match.teams.map((team, index) => {
            const teamPlayers = getPlayersByTeam(team.players);
            
            return (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full ${
                        index === 0 ? 'bg-blue-500' : 
                        index === 1 ? 'bg-red-500' : 'bg-green-500'
                      }`}></div>
                      {team.name}
                    </CardTitle>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Team Rating</p>
                      <p 
                        data-testid={`team-overall-${index}`}
                        className="text-2xl font-bold text-primary"
                      >
                        {team.totalStats.overall}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <p className="text-muted-foreground">PAC</p>
                        <p className="font-bold text-lg">{team.totalStats.pace}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <p className="text-muted-foreground">SHO</p>
                        <p className="font-bold text-lg">{team.totalStats.shooting}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <p className="text-muted-foreground">PAS</p>
                        <p className="font-bold text-lg">{team.totalStats.passing}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <p className="text-muted-foreground">DRI</p>
                        <p className="font-bold text-lg">{team.totalStats.dribbling}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <p className="text-muted-foreground">DEF</p>
                        <p className="font-bold text-lg">{team.totalStats.defense}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <p className="text-muted-foreground">PHY</p>
                        <p className="font-bold text-lg">{team.totalStats.physical}</p>
                      </div>
                    </div>
                    
                    {/* Team Players */}
                    <div>
                      <p className="text-sm font-medium mb-3 text-muted-foreground">
                        Players ({teamPlayers.length})
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {teamPlayers.map((player) => (
                          <div 
                            key={player.uid}
                            data-testid={`team-player-${player.uid}`}
                            className="flex items-center gap-4 p-3 bg-background border rounded-lg"
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              {player.profilePic ? (
                                <span className="text-lg">{player.profilePic}</span>
                              ) : (
                                <i className="fas fa-user text-primary"></i>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{player.name}</p>
                              <p className="text-sm text-muted-foreground">{player.club}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-sm">
                                {player.overall}
                              </Badge>
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
    </div>
  );
}