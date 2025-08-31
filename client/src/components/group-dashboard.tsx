import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Group, PlayerCard, CreatePlayerCard } from "@shared/schema";
import { subscribeToGroup, subscribeToGroupPlayerCards, createPlayerCard } from "@/lib/firebase";
import { generateBalancedTeams } from "@/lib/team-balancer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PlayerForm from "./player-form";
import PlayerCardView from "./player-card";
import TeamGenerator from "./team-generator";
import { useToast } from "@/hooks/use-toast";

interface GroupDashboardProps {
  user: User;
  groupId: string;
  onLeaveGroup: () => void;
}

export default function GroupDashboard({ user, groupId, onLeaveGroup }: GroupDashboardProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [playerCards, setPlayerCards] = useState<PlayerCard[]>([]);
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [showTeamGenerator, setShowTeamGenerator] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [fusionMode, setFusionMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeGroup = subscribeToGroup(groupId, setGroup);
    const unsubscribeCards = subscribeToGroupPlayerCards(groupId, setPlayerCards);

    return () => {
      unsubscribeGroup();
      unsubscribeCards();
    };
  }, [groupId]);

  const handleCreatePlayer = async (playerData: CreatePlayerCard) => {
    try {
      await createPlayerCard(groupId, playerData, user);
      setShowCreatePlayer(false);
      toast({
        title: "Success",
        description: "Player card created!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create player card",
        variant: "destructive",
      });
    }
  };

  const handleCardSelect = (id: string) => {
    if (!fusionMode) return;

    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    } else if (selectedCards.length < 5) {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleCreateFusion = async () => {
    if (selectedCards.length < 2) return;

    const selectedPlayers = playerCards.filter(card => selectedCards.includes(card.id));
    
    // Calculate average stats
    const totalStats = selectedPlayers.reduce(
      (acc, player) => ({
        pace: acc.pace + player.pace,
        shooting: acc.shooting + player.shooting,
        passing: acc.passing + player.passing,
        dribbling: acc.dribbling + player.dribbling,
        defense: acc.defense + player.defense,
        physical: acc.physical + player.physical,
      }),
      { pace: 0, shooting: 0, passing: 0, dribbling: 0, defense: 0, physical: 0 }
    );

    const count = selectedPlayers.length;
    const averageStats = {
      pace: Math.round(totalStats.pace / count),
      shooting: Math.round(totalStats.shooting / count),
      passing: Math.round(totalStats.passing / count),
      dribbling: Math.round(totalStats.dribbling / count),
      defense: Math.round(totalStats.defense / count),
      physical: Math.round(totalStats.physical / count),
    };

    const overall = Math.round(
      (averageStats.pace + averageStats.shooting + averageStats.passing + 
       averageStats.dribbling + averageStats.defense + averageStats.physical) / 6
    );

    const fusionPlayer: CreatePlayerCard = {
      name: `Fusion ${selectedPlayers.map(p => p.name.split(' ')[0]).join('-')}`,
      position: "HYBRID",
      ...averageStats,
      overall,
      isFusion: true,
    };

    await handleCreatePlayer(fusionPlayer);
    setSelectedCards([]);
    setFusionMode(false);
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

  if (showCreatePlayer) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Button 
            data-testid="button-back-to-group"
            onClick={() => setShowCreatePlayer(false)}
            variant="ghost"
            className="mb-4 p-0 h-auto text-muted-foreground"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Group
          </Button>
          <PlayerForm 
            onCreatePlayer={handleCreatePlayer}
            isLoading={false}
          />
        </div>
      </div>
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
            data-testid="button-leave-group"
            onClick={onLeaveGroup}
            variant="ghost"
            className="p-0 h-auto text-muted-foreground"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Leave
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Button 
            data-testid="button-create-player"
            onClick={() => setShowCreatePlayer(true)}
            className="flex items-center gap-2 py-6 text-base"
          >
            <i className="fas fa-plus"></i>
            Create Player
          </Button>
          
          <Button 
            data-testid="button-toggle-fusion"
            onClick={() => {
              setFusionMode(!fusionMode);
              setSelectedCards([]);
            }}
            variant={fusionMode ? "destructive" : "secondary"}
            className="flex items-center gap-2 py-6 text-base"
          >
            <i className="fas fa-magic"></i>
            {fusionMode ? 'Cancel Fusion' : 'Fusion Mode'}
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
        </div>

        {/* Fusion Controls */}
        {fusionMode && (
          <Card className="mb-6 border-purple-500/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <i className="fas fa-magic text-purple-400"></i>
                Fusion Mode
              </CardTitle>
              <CardDescription>
                Select 2-5 cards to create a fusion card
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Selected: <span data-testid="selected-count">{selectedCards.length}</span>/5
                </span>
                <div className="flex gap-2">
                  <Button 
                    data-testid="button-clear-selection"
                    onClick={() => setSelectedCards([])}
                    variant="ghost"
                    size="sm"
                  >
                    Clear
                  </Button>
                  <Button 
                    data-testid="button-create-fusion"
                    onClick={handleCreateFusion}
                    disabled={selectedCards.length < 2}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    Create Fusion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="text-muted-foreground">No player cards yet. Create your first player!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
              {playerCards.map((player) => (
                <PlayerCardView
                  key={player.id}
                  player={player}
                  isSelected={selectedCards.includes(player.id)}
                  fusionMode={fusionMode}
                  onSelect={handleCardSelect}
                  onDelete={() => {}} // Firebase cards don't have delete functionality for now
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}