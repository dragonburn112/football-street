import { useState } from "react";
import { User } from "firebase/auth";
import { type Group, type PlayerCard, type Match } from "@shared/schema";
import { promoteToAdmin, shuffleMatchTeams, deleteMatch } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AdminPanelProps {
  user: User;
  group: Group;
  players: PlayerCard[];
  matches: Match[];
  onClose: () => void;
}

export default function AdminPanel({ user, group, players, matches, onClose }: AdminPanelProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePromoteUser = async (userId: string) => {
    setLoading(`promote-${userId}`);
    try {
      await promoteToAdmin(group.id, userId);
      toast({
        title: "Success",
        description: "User promoted to admin!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleShuffleTeams = async (matchId: string) => {
    setLoading(`shuffle-${matchId}`);
    try {
      await shuffleMatchTeams(group.id, matchId, players);
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

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    
    setLoading(`delete-${matchId}`);
    try {
      await deleteMatch(group.id, matchId);
      toast({
        title: "Success",
        description: "Match deleted!",
      });
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

  const nonAdminMembers = group.members.filter(member => !member.isAdmin);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          data-testid="button-close-admin-panel"
          onClick={onClose}
          variant="ghost"
          className="mb-4 p-0 h-auto text-muted-foreground"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Group
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <i className="fas fa-cog text-primary"></i>
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              
              {/* Member Management */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <i className="fas fa-users text-primary"></i>
                  Promote Members to Admin
                </h3>
                
                {nonAdminMembers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">All members are already admins.</p>
                ) : (
                  <div className="space-y-3">
                    {nonAdminMembers.map((member) => (
                      <div key={member.uid} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{member.displayName}</p>
                          <p className="text-sm text-muted-foreground">Member since {new Date(member.joinedAt).toLocaleDateString()}</p>
                        </div>
                        <Button
                          data-testid={`button-promote-${member.uid}`}
                          onClick={() => handlePromoteUser(member.uid)}
                          disabled={loading === `promote-${member.uid}`}
                          variant="outline"
                          size="sm"
                        >
                          {loading === `promote-${member.uid}` ? (
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                          ) : (
                            <i className="fas fa-crown mr-2"></i>
                          )}
                          Promote to Admin
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Match Management */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <i className="fas fa-futbol text-primary"></i>
                  Match Management
                </h3>
                
                {matches.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No matches to manage.</p>
                ) : (
                  <div className="space-y-3">
                    {matches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{match.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {match.numberOfTeams} teams • {match.teams.reduce((total, team) => total + team.players.length, 0)} players
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            data-testid={`button-shuffle-${match.id}`}
                            onClick={() => handleShuffleTeams(match.id)}
                            disabled={loading === `shuffle-${match.id}`}
                            variant="outline"
                            size="sm"
                          >
                            {loading === `shuffle-${match.id}` ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-random"></i>
                            )}
                          </Button>
                          <Button
                            data-testid={`button-delete-match-${match.id}`}
                            onClick={() => handleDeleteMatch(match.id)}
                            disabled={loading === `delete-${match.id}`}
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            {loading === `delete-${match.id}` ? (
                              <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                              <i className="fas fa-trash"></i>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Current Admins */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <i className="fas fa-crown text-primary"></i>
                  Current Admins
                </h3>
                <div className="flex flex-wrap gap-2">
                  {group.members.filter(m => m.isAdmin).map((admin) => (
                    <Badge 
                      key={admin.uid} 
                      variant="default"
                      data-testid={`admin-${admin.uid}`}
                    >
                      <i className="fas fa-crown mr-1"></i>
                      {admin.displayName} {admin.uid === user.uid && "(You)"}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}