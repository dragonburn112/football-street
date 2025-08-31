import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Group, PlayerCard, CreatePlayerCard, Match, CreateMatch } from "@shared/schema";
import { subscribeToGroup, subscribeToGroupPlayerCards, updatePlayerCard, deletePlayerCard, subscribeToGroupMatches, createMatch, isUserAdmin, promoteToAdmin, leaveGroup } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PlayerCardView from "./player-card";
import TeamGenerator from "./team-generator";
import EditPlayerForm from "./edit-player-form";
import CreateMatchForm from "./create-match";
import MatchDisplay from "./match-display";
import AdminPanel from "./admin-panel";
import MatchTab from "./match-tab";
import { useToast } from "@/hooks/use-toast";

interface GroupDashboardProps {
  user: User;
  groupId: string;
  onLeaveGroup: () => void;
}

export default function GroupDashboard({ user, groupId, onLeaveGroup }: GroupDashboardProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showTeamGenerator, setShowTeamGenerator] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<PlayerCard | null>(null);
  
  const userIsAdmin = group ? isUserAdmin(group, user.uid) : false;
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeGroup = subscribeToGroup(groupId, setGroup);
    const unsubscribeCards = subscribeToGroupPlayerCards(groupId, setPlayerCards);
    const unsubscribeMatches = subscribeToGroupMatches(groupId, setMatches);

    return () => {
      unsubscribeGroup();
      unsubscribeCards();
      unsubscribeMatches();
    };
  }, [groupId]);

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      await promoteToAdmin(groupId, userId);
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
    }
  };

  const handleEditPlayer = (playerId: string) => {
    const player = playerCards.find(p => p.id === playerId);
    if (player) {
      setEditingPlayer(player);
    }
  };

  const handleUpdatePlayer = async (updates: Partial<CreatePlayerCard>) => {
    if (!editingPlayer) return;
    
    try {
      await updatePlayerCard(groupId, editingPlayer.id, updates, user);
      setEditingPlayer(null);
      toast({
        title: "Success",
        description: "Player card updated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update player card",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await deletePlayerCard(groupId, playerId);
      toast({
        title: "Success",
        description: "Player card deleted!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete player card",
        variant: "destructive",
      });
    }
  };

  const handleCreateMatch = async (matchData: CreateMatch) => {
    try {
      await createMatch(groupId, matchData, playerCards, user);
      setShowCreateMatch(false);
      toast({
        title: "Success",
        description: "Match created with balanced teams!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
    }
  };

  const handleLeaveGroup = async () => {
    const confirmed = confirm(`Are you sure you want to leave the group "${group?.name}"? You will lose access to all group content and your player card will be removed.`);
    if (!confirmed) return;
    
    try {
      await leaveGroup(groupId, user.uid);
      toast({
        title: "Left Group",
        description: "You have successfully left the group.",
      });
      onLeaveGroup();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
    }
  };


  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-primary text-4xl mb-4"></i>
          <p className="text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }


  if (editingPlayer) {
    return (
      <EditPlayerForm 
        player={editingPlayer}
        onUpdatePlayer={handleUpdatePlayer}
        onCancel={() => setEditingPlayer(null)}
        isLoading={false}
      />
    );
  }

  if (showCreateMatch) {
    return (
      <CreateMatchForm 
        players={playerCards}
        onCreateMatch={handleCreateMatch}
        onCancel={() => setShowCreateMatch(false)}
        isLoading={false}
      />
    );
  }

  if (showAdminPanel) {
    return (
      <AdminPanel 
        user={user}
        group={group}
        players={playerCards}
        matches={matches}
        onClose={() => setShowAdminPanel(false)}
        onGroupDeleted={onLeaveGroup}
      />
    );
  }

  if (viewingMatch) {
    return (
      <MatchTab 
        match={viewingMatch}
        players={playerCards}
        group={group}
        user={user}
        onClose={() => setViewingMatch(null)}
      />
    );
  }

  if (showTeamGenerator) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            data-testid="button-back-to-group"
            onClick={() => setShowTeamGenerator(false)}
            variant="ghost"
            className="mb-4 p-0 h-auto text-muted-foreground"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Group
          </Button>
          <TeamGenerator players={playerCards} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button 
            data-testid="button-back-to-groups"
            onClick={onLeaveGroup}
            variant="ghost"
            className="p-0 h-auto text-muted-foreground"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Groups
          </Button>
        </div>

        {/* Group Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <i className="fas fa-users text-primary"></i>
                  {group.name}
                </CardTitle>
                <CardDescription>Group Code: <strong data-testid="group-code">{group.code}</strong></CardDescription>
              </div>
              <Badge variant="secondary" data-testid="member-count">
                {group.members.length} member{group.members.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Members:</p>
              <div className="flex flex-wrap gap-2">
                {group.members.map((member) => (
                  <Badge 
                    key={member.uid} 
                    variant={member.uid === user.uid ? "default" : "outline"}
                    data-testid={`member-${member.uid}`}
                  >
                    {member.displayName} {member.uid === user.uid && "(You)"}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              data-testid="button-create-match"
              onClick={() => setShowCreateMatch(true)}
              disabled={playerCards.length < 4}
              className="flex items-center gap-2 py-6 text-base"
            >
              <i className="fas fa-futbol"></i>
              Create Match
            </Button>
            
            <Button 
              data-testid="button-generate-teams"
              onClick={() => setShowTeamGenerator(true)}
              disabled={playerCards.length < 2}
              variant="outline"
              className="flex items-center gap-2 py-6 text-base"
            >
              <i className="fas fa-random"></i>
              Fair Teams
            </Button>
            
            {userIsAdmin ? (
              <Button 
                data-testid="button-admin-panel"
                onClick={() => setShowAdminPanel(true)}
                variant="outline"
                className="flex items-center gap-2 py-6 text-base"
              >
                <i className="fas fa-cog"></i>
                Admin Panel
              </Button>
            ) : (
              <Button 
                data-testid="button-leave-group"
                onClick={handleLeaveGroup}
                variant="outline"
                className="flex items-center gap-2 py-6 text-base text-destructive hover:text-destructive"
              >
                <i className="fas fa-sign-out-alt"></i>
                Leave Group
              </Button>
            )}
          </div>
        </div>


        {/* Matches Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-futbol text-primary"></i>
            Matches ({matches.length})
          </h2>
          
          {matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <i className="fas fa-futbol text-muted-foreground text-3xl mb-3"></i>
                <p className="text-muted-foreground">No matches yet. Create your first match!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <MatchDisplay
                  key={match.id}
                  match={match}
                  players={playerCards}
                  onView={() => setViewingMatch(match)}
                  canEdit={userIsAdmin}
                />
              ))}
            </div>
          )}
        </div>

        <Separator className="my-8" />

        {/* Player Cards */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-cards text-primary"></i>
            Player Cards ({playerCards.length})
          </h2>
          
          {playerCards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-user-plus text-muted-foreground text-4xl mb-4"></i>
                <p className="text-muted-foreground">Player cards are created automatically when members join the group!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {playerCards.map((player) => (
                <PlayerCardView
                  key={player.id}
                  player={player}
                  onEdit={userIsAdmin || player.uid === user.uid ? handleEditPlayer : undefined}
                  onDelete={userIsAdmin ? handleDeletePlayer : undefined}
                  isOwner={player.uid === user.uid}
                  canEdit={userIsAdmin || player.uid === user.uid}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}