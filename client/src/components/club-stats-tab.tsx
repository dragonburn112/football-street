import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { type PlayerCard, type Group } from "@shared/schema";
import { subscribeToGroupPlayerCards, updatePlayerStats, isUserAdmin } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ClubStatsTabProps {
  user: User;
  groupId: string;
  group: Group;
  onBack: () => void;
}

interface StatsUpdate {
  playerId: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
}

export default function ClubStatsTab({ user, groupId, group, onBack }: ClubStatsTabProps) {
  const { toast } = useToast();
  const [players, setPlayers] = useState<PlayerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlayer, setEditingPlayer] = useState<PlayerCard | null>(null);
  const [editForm, setEditForm] = useState<StatsUpdate>({
    playerId: '',
    goals: 0,
    assists: 0,
    matchesPlayed: 0,
  });
  const [updating, setUpdating] = useState(false);

  const userIsAdmin = isUserAdmin(group, user.uid);

  useEffect(() => {
    const unsubscribe = subscribeToGroupPlayerCards(groupId, (cards) => {
      // Sort by overall rating (descending), then by name
      const sortedCards = cards.sort((a, b) => {
        if (b.overall !== a.overall) {
          return b.overall - a.overall;
        }
        return a.name.localeCompare(b.name);
      });
      setPlayers(sortedCards);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId]);

  const handleEditStats = (player: PlayerCard) => {
    setEditingPlayer(player);
    setEditForm({
      playerId: player.id,
      goals: player.goals || 0,
      assists: player.assists || 0,
      matchesPlayed: player.matchesPlayed || 0,
    });
  };

  const handleUpdateStats = async () => {
    if (!editingPlayer) return;

    setUpdating(true);
    try {
      await updatePlayerStats(groupId, editingPlayer.id, {
        goals: editForm.goals,
        assists: editForm.assists,
        matchesPlayed: editForm.matchesPlayed,
      });
      
      toast({
        title: "Stats Updated",
        description: `${editingPlayer.name}'s stats have been updated successfully!`,
      });
      
      setEditingPlayer(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update player stats",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const calculateGoalsPerMatch = (goals: number, matches: number) => {
    return matches > 0 ? (goals / matches).toFixed(2) : '0.00';
  };

  const calculateAssistsPerMatch = (assists: number, matches: number) => {
    return matches > 0 ? (assists / matches).toFixed(2) : '0.00';
  };

  const calculateMVPRate = (mvps: number, matches: number) => {
    return matches > 0 ? ((mvps / matches) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p>Loading club statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <button 
          data-testid="button-back-club-stats"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Group
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Club Player Statistics</h1>
          <p className="text-muted-foreground">
            {group.name} • {players.length} player{players.length !== 1 ? 's' : ''}
          </p>
          {userIsAdmin && (
            <p className="text-sm text-primary mt-2">
              <i className="fas fa-crown mr-1"></i>
              As an admin, you can update player stats
            </p>
          )}
        </div>

        {players.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-2">No Players Yet</h2>
            <p className="text-muted-foreground">
              No player cards have been created in this group yet.
            </p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <i className="fas fa-table text-primary"></i>
                Player Statistics Table
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium">Player</th>
                      <th className="text-center p-3 font-medium">Overall</th>
                      <th className="text-center p-3 font-medium">⚽ Goals</th>
                      <th className="text-center p-3 font-medium">🅰️ Assists</th>
                      <th className="text-center p-3 font-medium">🏆 MVPs</th>
                      <th className="text-center p-3 font-medium">🎮 Matches</th>
                      <th className="text-center p-3 font-medium">G/M</th>
                      <th className="text-center p-3 font-medium">A/M</th>
                      <th className="text-center p-3 font-medium">MVP%</th>
                      {userIsAdmin && <th className="text-center p-3 font-medium">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((player, index) => (
                      <tr 
                        key={player.id}
                        className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${
                          index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                        }`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {index === 0 && <div className="text-yellow-500">👑</div>}
                            <div className="text-xl">{player.profilePic || '⚽'}</div>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              {player.uid === user.uid && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge className="bg-primary text-primary-foreground">
                            {player.overall}
                          </Badge>
                        </td>
                        <td className="p-3 text-center font-medium">{player.goals || 0}</td>
                        <td className="p-3 text-center font-medium">{player.assists || 0}</td>
                        <td className="p-3 text-center font-medium">{player.mvps || 0}</td>
                        <td className="p-3 text-center font-medium">{player.matchesPlayed || 0}</td>
                        <td className="p-3 text-center text-sm text-muted-foreground">
                          {calculateGoalsPerMatch(player.goals || 0, player.matchesPlayed || 0)}
                        </td>
                        <td className="p-3 text-center text-sm text-muted-foreground">
                          {calculateAssistsPerMatch(player.assists || 0, player.matchesPlayed || 0)}
                        </td>
                        <td className="p-3 text-center text-sm text-muted-foreground">
                          {calculateMVPRate(player.mvps || 0, player.matchesPlayed || 0)}%
                        </td>
                        {userIsAdmin && (
                          <td className="p-3 text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  data-testid={`button-edit-stats-${player.id}`}
                                  onClick={() => handleEditStats(player)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <i className="fas fa-edit mr-1"></i>
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Player Stats</DialogTitle>
                                  <DialogDescription>
                                    Update {player.name}'s match statistics. MVPs are automatically managed through match voting.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4">
                                  <div className="flex items-center gap-3">
                                    <div className="text-xl">{player.profilePic || '⚽'}</div>
                                    <div>
                                      <p className="font-medium">{player.name}</p>
                                      <p className="text-sm text-muted-foreground">Overall: {player.overall}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">Goals</label>
                                      <Input
                                        data-testid="input-edit-goals"
                                        type="number"
                                        min="0"
                                        value={editForm.goals}
                                        onChange={(e) => setEditForm(prev => ({
                                          ...prev,
                                          goals: parseInt(e.target.value) || 0
                                        }))}
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="text-sm font-medium">Assists</label>
                                      <Input
                                        data-testid="input-edit-assists"
                                        type="number"
                                        min="0"
                                        value={editForm.assists}
                                        onChange={(e) => setEditForm(prev => ({
                                          ...prev,
                                          assists: parseInt(e.target.value) || 0
                                        }))}
                                      />
                                    </div>
                                    
                                    <div>
                                      <label className="text-sm font-medium">Matches</label>
                                      <Input
                                        data-testid="input-edit-matches"
                                        type="number"
                                        min="0"
                                        value={editForm.matchesPlayed}
                                        onChange={(e) => setEditForm(prev => ({
                                          ...prev,
                                          matchesPlayed: parseInt(e.target.value) || 0
                                        }))}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-sm text-muted-foreground">
                                      <i className="fas fa-info-circle mr-2"></i>
                                      MVP count ({player.mvps || 0}) is automatically managed through match voting and cannot be edited manually.
                                    </p>
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setEditingPlayer(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    data-testid="button-save-stats"
                                    onClick={handleUpdateStats}
                                    disabled={updating}
                                  >
                                    {updating ? (
                                      <i className="fas fa-spinner fa-spin mr-2"></i>
                                    ) : (
                                      <i className="fas fa-save mr-2"></i>
                                    )}
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Statistics */}
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-medium mb-4">Club Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {players.reduce((sum, p) => sum + (p.goals || 0), 0)}
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">Total Goals</p>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {players.reduce((sum, p) => sum + (p.assists || 0), 0)}
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Total Assists</p>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {players.reduce((sum, p) => sum + (p.mvps || 0), 0)}
                    </div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">Total MVPs</p>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length) || 0}
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Avg Rating</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}