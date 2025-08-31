import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Group, PlayerCard, CreatePlayerCard, Match, CreateMatch, UnassignedPlayerCard, PlayerFormData } from "@shared/schema";
import { subscribeToGroup, subscribeToGroupPlayerCards, updatePlayerCard, deletePlayerCard, subscribeToGroupMatches, createMatch, isUserAdmin, promoteToAdmin, leaveGroup, subscribeToUnassignedPlayerCards, createUnassignedPlayerCard, deleteUnassignedPlayerCard } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PlayerCardView from "./player-card";
import TeamGenerator from "./team-generator";
import EditPlayerForm from "./edit-player-form";
import CreateMatchForm from "./create-match";
import MatchDisplay from "./match-display";
import AdminPanel from "./admin-panel";
import MatchTab from "./match-tab";
import PlayerForm from "./player-form";
import MyCardsTab from "./my-cards-tab";
import ClubStatsTab from "./club-stats-tab";
import MVPVoting from "./mvp-voting";
import BottomNavigation, { BottomNavBar } from "./bottom-navigation";
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
  const [unassignedCards, setUnassignedCards] = useState<UnassignedPlayerCard[]>([]);
  const [showTeamGenerator, setShowTeamGenerator] = useState(false);
  const [showCreateMatch, setShowCreateMatch] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showCreateUnassigned, setShowCreateUnassigned] = useState(false);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<PlayerCard | null>(null);
  const [showMyCards, setShowMyCards] = useState(false);
  const [showClubStats, setShowClubStats] = useState(false);
  const [showMVPVoting, setShowMVPVoting] = useState<{ match: Match; show: boolean }>({ match: null as any, show: false });
  const [activeTab, setActiveTab] = useState<"dashboard" | "mycard" | "clubstats">("dashboard");
  
  const userIsAdmin = group ? isUserAdmin(group, user.uid) : false;
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeGroup = subscribeToGroup(groupId, setGroup);
    const unsubscribeCards = subscribeToGroupPlayerCards(groupId, setPlayerCards);
    const unsubscribeMatches = subscribeToGroupMatches(groupId, setMatches);
    const unsubscribeUnassigned = subscribeToUnassignedPlayerCards(groupId, setUnassignedCards);

    return () => {
      unsubscribeGroup();
      unsubscribeCards();
      unsubscribeMatches();
      unsubscribeUnassigned();
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
      // Pass the same combined array of players that was used in the form
      const allPlayers = [...playerCards, ...unassignedCards.map((card) => ({
        ...card,
        id: `unassigned-${card.id}`,
        uid: '',
        createdAt: card.createdAt,
        updatedAt: card.createdAt,
      }))];
      
      await createMatch(groupId, matchData, allPlayers, user);
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

  const handleCreateUnassignedCard = async (playerData: PlayerFormData) => {
    try {
      await createUnassignedPlayerCard(groupId, playerData, user);
      toast({
        title: "Success",
        description: "Player card created! It will appear in your card list.",
      });
      setShowCreateUnassigned(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create player card",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUnassignedCard = async (cardId: string) => {
    const confirmed = confirm("Are you sure you want to delete this unassigned player card?");
    if (!confirmed) return;
    
    try {
      await deleteUnassignedPlayerCard(groupId, cardId);
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
        players={[...playerCards, ...unassignedCards.map((card, index) => ({
          ...card,
          id: `unassigned-${card.id}`,
          uid: '',
          createdAt: card.createdAt,
          updatedAt: card.createdAt,
        }))]}
        onCreateMatch={handleCreateMatch}
        onCancel={() => setShowCreateMatch(false)}
        isLoading={false}
      />
    );
  }

  if (showCreateUnassigned) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-md mx-auto">
          <Button 
            data-testid="button-back-to-group"
            onClick={() => setShowCreateUnassigned(false)}
            variant="ghost"
            className="mb-4 p-0 h-auto text-muted-foreground"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Group
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-plus-circle text-primary"></i>
                Create Player Card
              </CardTitle>
              <CardDescription>
                Create a new player card for your group. The card will be available for matches and team generation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerForm 
                onCreatePlayer={handleCreateUnassignedCard}
                isLoading={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showAdminPanel) {
    return (
      <AdminPanel 
        user={user}
        group={group}
        players={playerCards}
        matches={matches}
        unassignedCards={unassignedCards}
        onClose={() => setShowAdminPanel(false)}
        onGroupDeleted={onLeaveGroup}
      />
    );
  }

  if (viewingMatch) {
    return (
      <MatchTab 
        match={viewingMatch}
        players={[...playerCards, ...unassignedCards.map((card) => ({
          ...card,
          id: `unassigned-${card.id}`,
          uid: '',
          createdAt: card.createdAt,
          updatedAt: card.createdAt,
        }))]}
        group={group}
        user={user}
        onClose={() => setViewingMatch(null)}
        onShowMVPVoting={(match) => setShowMVPVoting({ match, show: true })}
      />
    );
  }

  if (showMVPVoting.show && showMVPVoting.match) {
    return (
      <MVPVoting
        match={showMVPVoting.match}
        players={playerCards}
        user={user}
        groupId={groupId}
        group={group}
        onClose={() => setShowMVPVoting({ match: null as any, show: false })}
      />
    );
  }

  // Handle bottom navigation
  if (activeTab === "mycard") {
    return (
      <>
        <MyCardsTab
          user={user}
          groupId={groupId}
          group={group}
          onBack={() => setActiveTab("dashboard")}
        />
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </>
    );
  }

  if (activeTab === "clubstats") {
    return (
      <>
        <ClubStatsTab
          user={user}
          groupId={groupId}
          group={group}
          onBack={() => setActiveTab("dashboard")}
        />
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      </>
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
          <TeamGenerator players={[...playerCards, ...unassignedCards.map((card, index) => ({
            ...card,
            id: `unassigned-${card.id}`,
            uid: '',
            createdAt: card.createdAt,
            updatedAt: card.createdAt,
          }))]} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 pb-20">
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
          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userIsAdmin && (
              <Button 
                data-testid="button-create-match"
                onClick={() => setShowCreateMatch(true)}
                disabled={playerCards.length + unassignedCards.length < 4}
                className="flex items-center gap-2 py-6 text-base"
              >
                <i className="fas fa-futbol"></i>
                Create Match
              </Button>
            )}
            
            {userIsAdmin && (
              <Button 
                data-testid="button-create-cards"
                onClick={() => setShowCreateUnassigned(true)}
                variant="outline"
                className="flex items-center gap-2 py-6 text-base"
              >
                <i className="fas fa-plus-circle"></i>
                Create Cards
              </Button>
            )}
            
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
                  players={[...playerCards, ...unassignedCards.map((card) => ({
                    ...card,
                    id: `unassigned-${card.id}`,
                    uid: '',
                    createdAt: card.createdAt,
                    updatedAt: card.createdAt,
                  }))]}
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
            Player Cards ({playerCards.length + unassignedCards.length})
          </h2>
          
          {playerCards.length === 0 && unassignedCards.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-user-plus text-muted-foreground text-4xl mb-4"></i>
                <p className="text-muted-foreground">
                  {userIsAdmin 
                    ? "Create player cards using the 'Create Cards' button above!"
                    : "Player cards are created when admins assign them or when you join the group!"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {/* Assigned Player Cards */}
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
              
              {/* Unassigned Player Cards */}
              {unassignedCards.map((card) => (
                <div key={`unassigned-${card.id}`} className="relative">
                  <PlayerCardView
                    player={{
                      ...card,
                      uid: '',
                      createdAt: card.createdAt,
                      updatedAt: card.createdAt,
                    }}
                    onDelete={userIsAdmin ? () => handleDeleteUnassignedCard(card.id) : undefined}
                    isOwner={false}
                    canEdit={false}
                    isUnassigned={true}
                  />
                  <Badge 
                    className="absolute -top-2 -right-2 bg-orange-500 hover:bg-orange-600 text-white text-xs"
                    data-testid={`badge-unassigned-${card.id}`}
                  >
                    Unassigned
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}