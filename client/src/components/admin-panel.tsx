import { useState } from "react";
import { User } from "firebase/auth";
import { type Group, type PlayerCard, type Match, type CreatePlayerCard } from "@shared/schema";
import { promoteToAdmin, shuffleMatchTeams, deleteMatch, createPlayerCardForMember } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import PlayerForm from "./player-form";

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
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

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
  
  // Get members without player cards
  const membersWithCards = players.map(p => p.uid);
  const unassignedMembers = group.members.filter(member => !membersWithCards.includes(member.uid));
  
  const handleCreatePlayerCard = async (playerData: CreatePlayerCard) => {
    if (!selectedMember) {
      toast({
        title: "Error",
        description: "Please select a member to assign the card to",
        variant: "destructive",
      });
      return;
    }
    
    setLoading('create-player');
    try {
      await createPlayerCardForMember(group.id, selectedMember, playerData, user);
      toast({
        title: "Success",
        description: "Player card created and assigned!",
      });
      setShowCreatePlayer(false);
      setSelectedMember(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create player card",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (showCreatePlayer) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            data-testid="button-back-to-admin"
            onClick={() => {
              setShowCreatePlayer(false);
              setSelectedMember(null);
            }}
            variant="ghost"
            className="mb-4 p-0 h-auto text-muted-foreground"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Admin Panel
          </Button>
          <PlayerForm 
            onCreatePlayer={handleCreatePlayerCard}
            isLoading={loading === 'create-player'}
            selectedMemberName={unassignedMembers.find(m => m.uid === selectedMember)?.displayName}
          />
        </div>
      </div>
    );
  }

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
            <Tabs defaultValue="players" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="players">Player Management</TabsTrigger>
                <TabsTrigger value="members">Member Roles</TabsTrigger>
                <TabsTrigger value="matches">Match Control</TabsTrigger>
              </TabsList>
              
              <TabsContent value="players" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <i className="fas fa-user-plus text-primary"></i>
                      Create Player Cards for Members
                    </h3>
                    
                    {unassignedMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
                        <p className="text-muted-foreground">All members have player cards assigned.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-3">
                          Select a member to create a player card for:
                        </p>
                        {unassignedMembers.map((member) => (
                          <div key={member.uid} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{member.displayName}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.isAdmin ? 'Admin' : 'Member'} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              data-testid={`button-create-card-${member.uid}`}
                              onClick={() => {
                                setSelectedMember(member.uid);
                                setShowCreatePlayer(true);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <i className="fas fa-plus mr-2"></i>
                              Create Card
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {players.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <i className="fas fa-id-card text-primary"></i>
                        Assigned Player Cards ({players.length})
                      </h3>
                      <div className="grid gap-3">
                        {players.map((player) => {
                          const member = group.members.find(m => m.uid === player.uid);
                          return (
                            <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">{player.profilePic || '⚽'}</div>
                                <div>
                                  <p className="font-medium">{player.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {member?.displayName} • Overall: {player.overall}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">
                                <i className="fas fa-star mr-1"></i>
                                {player.overall}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="members" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <i className="fas fa-users text-primary"></i>
                      Promote Members to Admin
                    </h3>
                    
                    {nonAdminMembers.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fas fa-crown text-yellow-500 text-4xl mb-4"></i>
                        <p className="text-muted-foreground">All members are already admins.</p>
                      </div>
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
                </div>
              </TabsContent>
              
              <TabsContent value="matches" className="mt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <i className="fas fa-futbol text-primary"></i>
                      Match Management
                    </h3>
                    
                    {matches.length === 0 ? (
                      <div className="text-center py-8">
                        <i className="fas fa-futbol text-muted-foreground text-4xl mb-4"></i>
                        <p className="text-muted-foreground">No matches to manage.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {matches.map((match) => (
                          <div key={match.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{match.name}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline">{match.numberOfTeams} teams</Badge>
                                <Badge variant="outline">{match.playersPerTeam} per team</Badge>
                                <Badge variant={match.status === 'active' ? 'default' : 'secondary'}>
                                  {match.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                data-testid={`button-shuffle-${match.id}`}
                                onClick={() => handleShuffleTeams(match.id)}
                                disabled={loading === `shuffle-${match.id}` || match.status === 'completed'}
                                variant="outline"
                                size="sm"
                              >
                                {loading === `shuffle-${match.id}` ? (
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                ) : (
                                  <i className="fas fa-random mr-2"></i>
                                )}
                                Shuffle
                              </Button>
                              <Button
                                data-testid={`button-delete-${match.id}`}
                                onClick={() => handleDeleteMatch(match.id)}
                                disabled={loading === `delete-${match.id}`}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                {loading === `delete-${match.id}` ? (
                                  <i className="fas fa-spinner fa-spin mr-2"></i>
                                ) : (
                                  <i className="fas fa-trash mr-2"></i>
                                )}
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}