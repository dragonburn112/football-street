import { User } from "firebase/auth";
import { type Match, type PlayerCard, type Group } from "@shared/schema";
import { shuffleMatchTeams, deleteMatch, updateMatch, isUserAdmin } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { getPlayerRole, getRoleColor } from "@/lib/player-roles";
import GameSettingsModal from "./game-settings-modal";

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
  const [showGameSettings, setShowGameSettings] = useState(false);
  
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

  const handleSaveGameSettings = async (settings: Partial<Match>) => {
    try {
      await updateMatch(group.id, match.id, settings);
      toast({
        title: "Success",
        description: "Game settings updated!",
      });
      // Refresh page to show updated settings
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
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
                    data-testid="button-game-settings"
                    onClick={() => setShowGameSettings(true)}
                    disabled={loading !== null}
                    variant="outline"
                    size="sm"
                  >
                    <i className="fas fa-cog mr-2"></i>
                    Settings
                  </Button>
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
                  {teamPlayers.map((player) => {
                    const role = getPlayerRole(player);
                    const roleColor = getRoleColor(player.overall);
                    return (
                      <div key={player.id} className="flex items-center gap-2 p-2 bg-background/50 rounded">
                        <div className={`w-8 h-8 ${isTeamA ? 'bg-blue-500' : 'bg-red-500'} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                          {player.overall}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{player.name}</div>
                          <div className={`text-xs flex items-center gap-1 ${roleColor}`}>
                            <span>{role.icon}</span>
                            <span>{role.title}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Players ({teamPlayers.length})
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Game Settings Modal */}
        <GameSettingsModal
          open={showGameSettings}
          onClose={() => setShowGameSettings(false)}
          match={match}
          onSave={handleSaveGameSettings}
          loading={loading !== null}
        />
      </div>
    </div>
  );
}