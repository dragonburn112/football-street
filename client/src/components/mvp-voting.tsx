import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { type Match, type PlayerCard } from "@shared/schema";
import { openMVPVoting, closeMVPVoting, voteForMVP, isUserAdmin } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface MVPVotingProps {
  match: Match;
  players: PlayerCard[];
  user: User;
  groupId: string;
  group: any; // Group type
  onClose: () => void;
}

export default function MVPVoting({ match, players, user, groupId, group, onClose }: MVPVotingProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  
  const userIsAdmin = isUserAdmin(group, user.uid);
  const mvpVoting = match.mvpVoting;
  const isVotingOpen = mvpVoting?.isOpen || false;
  const votes = mvpVoting?.votes || {};
  const userVote = votes[user.uid];
  
  // Check if user already voted
  useEffect(() => {
    setHasVoted(!!userVote);
    if (userVote) {
      setSelectedPlayer(userVote);
    }
  }, [userVote]);

  // Get players who participated in this match
  const matchPlayers = players.filter(player => 
    match.selectedPlayerIds.includes(player.id)
  );

  // Count votes for each player
  const voteResults = matchPlayers.map(player => {
    const voteCount = Object.values(votes).filter(vote => vote === player.id).length;
    return { player, voteCount };
  });

  // Sort by vote count (descending)
  voteResults.sort((a, b) => b.voteCount - a.voteCount);

  const handleOpenVoting = async () => {
    setLoading('opening');
    try {
      await openMVPVoting(groupId, match.id, user.uid);
      toast({
        title: "MVP Voting Opened",
        description: "Players can now vote for the MVP!",
      });
      // Refresh page to show updated match
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open MVP voting",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCloseVoting = async () => {
    if (!confirm("Are you sure you want to close MVP voting? This will determine the final winner.")) return;
    
    setLoading('closing');
    try {
      await closeMVPVoting(groupId, match.id, user.uid);
      toast({
        title: "MVP Voting Closed",
        description: `MVP voting has ended. Winner: ${voteResults[0]?.player?.name || 'No votes'}`,
      });
      // Refresh page to show updated match
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to close MVP voting",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleVote = async () => {
    if (!selectedPlayer) return;
    
    setLoading('voting');
    try {
      await voteForMVP(groupId, match.id, user.uid, selectedPlayer);
      setHasVoted(true);
      toast({
        title: "Vote Submitted",
        description: "Your MVP vote has been recorded!",
      });
      // Refresh page to show updated votes
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const mvpWinner = mvpVoting?.mvpWinner;
  const winnerPlayer = mvpWinner ? players.find(p => p.id === mvpWinner) : null;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          data-testid="button-close-mvp-voting"
          onClick={onClose}
          variant="ghost"
          className="mb-4 p-0 h-auto text-muted-foreground"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Match
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <i className="fas fa-trophy text-yellow-500"></i>
              MVP Voting - {match.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Admin Controls */}
            {userIsAdmin && (
              <div className="space-y-4">
                <h3 className="font-medium text-muted-foreground">Admin Controls</h3>
                <div className="flex gap-3">
                  {!isVotingOpen && !mvpWinner && (
                    <Button
                      data-testid="button-open-mvp-voting"
                      onClick={handleOpenVoting}
                      disabled={loading === 'opening'}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {loading === 'opening' ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-play mr-2"></i>
                      )}
                      Open MVP Voting
                    </Button>
                  )}
                  
                  {isVotingOpen && !mvpWinner && (
                    <Button
                      data-testid="button-close-mvp-voting"
                      onClick={handleCloseVoting}
                      disabled={loading === 'closing'}
                      variant="destructive"
                    >
                      {loading === 'closing' ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-stop mr-2"></i>
                      )}
                      Close Voting & Determine Winner
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Voting Status */}
            <div className="flex items-center gap-2">
              <Badge variant={isVotingOpen ? "default" : "secondary"}>
                {isVotingOpen ? "🟢 Voting Open" : mvpWinner ? "🏆 Voting Closed" : "⏸️ Voting Not Started"}
              </Badge>
              {Object.keys(votes).length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {Object.keys(votes).length} vote{Object.keys(votes).length !== 1 ? 's' : ''} cast
                </span>
              )}
            </div>

            {/* Final MVP Winner */}
            {mvpWinner && winnerPlayer && (
              <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">Match MVP</h3>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="text-2xl">{winnerPlayer.profilePic || '⚽'}</div>
                    <div>
                      <p className="text-lg font-semibold">{winnerPlayer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {mvpVoting.mvpVoteCount} vote{mvpVoting.mvpVoteCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Player Voting */}
            {isVotingOpen && !mvpWinner && (
              <div className="space-y-4">
                <h3 className="font-medium">Vote for Match MVP</h3>
                {hasVoted ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-300">
                      <i className="fas fa-check-circle"></i>
                      <span>You voted for: <strong>{players.find(p => p.id === userVote)?.name}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {matchPlayers.map((player) => (
                        <button
                          key={player.id}
                          data-testid={`button-vote-${player.id}`}
                          onClick={() => setSelectedPlayer(player.id)}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            selectedPlayer === player.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{player.profilePic || '⚽'}</div>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-sm text-muted-foreground">Overall: {player.overall}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      data-testid="button-submit-vote"
                      onClick={handleVote}
                      disabled={!selectedPlayer || loading === 'voting'}
                      className="w-full"
                    >
                      {loading === 'voting' ? (
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                      ) : (
                        <i className="fas fa-vote-yea mr-2"></i>
                      )}
                      Submit Vote
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Vote Results */}
            {(Object.keys(votes).length > 0 || mvpWinner) && (
              <div className="space-y-4">
                <h3 className="font-medium">Vote Results</h3>
                <div className="space-y-2">
                  {voteResults.map((result, index) => (
                    <div 
                      key={result.player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0 && result.voteCount > 0 ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 'border-border bg-card/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {index === 0 && result.voteCount > 0 && <div className="text-yellow-500">🥇</div>}
                        {index === 1 && result.voteCount > 0 && <div className="text-gray-400">🥈</div>}
                        {index === 2 && result.voteCount > 0 && <div className="text-orange-600">🥉</div>}
                        <div className="text-xl">{result.player.profilePic || '⚽'}</div>
                        <div>
                          <p className="font-medium">{result.player.name}</p>
                          <p className="text-sm text-muted-foreground">Overall: {result.player.overall}</p>
                        </div>
                      </div>
                      <Badge variant={result.voteCount > 0 ? "default" : "secondary"}>
                        {result.voteCount} vote{result.voteCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No voting started message */}
            {!isVotingOpen && !mvpWinner && Object.keys(votes).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">🏆</div>
                <p>MVP voting hasn't started yet.</p>
                {userIsAdmin && (
                  <p className="text-sm mt-2">As an admin, you can open voting when the match is complete.</p>
                )}
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}