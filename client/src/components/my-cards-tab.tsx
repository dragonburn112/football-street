import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { type PlayerCard, type Group } from "@shared/schema";
import { subscribeToGroupPlayerCards } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PlayerCardView from "./player-card";

interface MyCardsTabProps {
  user: User;
  groupId: string;
  group: Group;
  onBack: () => void;
}

export default function MyCardsTab({ user, groupId, group, onBack }: MyCardsTabProps) {
  const [myCard, setMyCard] = useState<PlayerCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToGroupPlayerCards(groupId, (cards) => {
      // Find user's card
      const userCard = cards.find(card => card.uid === user.uid);
      setMyCard(userCard || null);
      setLoading(false);
    });

    return unsubscribe;
  }, [groupId, user.uid]);

  const getStatsEmoji = (stat: string) => {
    switch (stat) {
      case 'goals': return '⚽';
      case 'assists': return '🅰️';
      case 'mvps': return '🏆';
      case 'matchesPlayed': return '🎮';
      default: return '📊';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p>Loading your player card...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button 
          data-testid="button-back-my-cards"
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <i className="fas fa-arrow-left"></i>
          Back to Group
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">My Player Card</h1>
          <p className="text-muted-foreground">Your stats and performance in {group.name}</p>
        </div>

        {myCard ? (
          <div className="space-y-8">
            
            {/* Player Card Display */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <PlayerCardView 
                  player={myCard}
                  showStats={false}
                />
              </div>
            </div>

            {/* Stats Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <i className="fas fa-chart-line text-primary"></i>
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="text-3xl mb-2">⚽</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {myCard.goals}
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Goals</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-3xl mb-2">🅰️</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {myCard.assists}
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Assists</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {myCard.mvps}
                    </div>
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">MVPs</p>
                  </div>

                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="text-3xl mb-2">🎮</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {myCard.matchesPlayed}
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Matches</p>
                  </div>

                </div>

                {/* Performance Metrics */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-4">Performance Ratios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                      <span className="text-sm text-muted-foreground">Goals per Match</span>
                      <Badge variant="outline">
                        {myCard.matchesPlayed > 0 ? (myCard.goals / myCard.matchesPlayed).toFixed(2) : '0.00'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                      <span className="text-sm text-muted-foreground">Assists per Match</span>
                      <Badge variant="outline">
                        {myCard.matchesPlayed > 0 ? (myCard.assists / myCard.matchesPlayed).toFixed(2) : '0.00'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                      <span className="text-sm text-muted-foreground">MVP Rate</span>
                      <Badge variant="outline">
                        {myCard.matchesPlayed > 0 ? ((myCard.mvps / myCard.matchesPlayed) * 100).toFixed(1) : '0.0'}%
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
                      <span className="text-sm text-muted-foreground">Goal Contribution</span>
                      <Badge variant="outline">
                        {myCard.goals + myCard.assists}
                      </Badge>
                    </div>

                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Player Abilities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <i className="fas fa-dumbbell text-primary"></i>
                  Player Abilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Pace', value: myCard.pace, color: 'bg-red-500' },
                    { name: 'Shooting', value: myCard.shooting, color: 'bg-orange-500' },
                    { name: 'Passing', value: myCard.passing, color: 'bg-yellow-500' },
                    { name: 'Dribbling', value: myCard.dribbling, color: 'bg-green-500' },
                    { name: 'Defense', value: myCard.defense, color: 'bg-blue-500' },
                    { name: 'Physical', value: myCard.physical, color: 'bg-purple-500' },
                  ].map((ability) => (
                    <div key={ability.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">{ability.name}</span>
                        <Badge variant="outline">{ability.value}</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${ability.color}`}
                          style={{ width: `${ability.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
                    <i className="fas fa-star text-primary"></i>
                    <span className="font-medium">Overall Rating</span>
                    <Badge className="bg-primary text-primary-foreground">{myCard.overall}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        ) : (
          /* No Card State */
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚽</div>
            <h2 className="text-2xl font-bold mb-2">No Player Card Yet</h2>
            <p className="text-muted-foreground mb-6">
              You don't have a player card in this group yet. 
              Ask an admin to create one for you!
            </p>
            <div className="p-4 bg-muted/50 rounded-lg border max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
                <i className="fas fa-info-circle mr-2"></i>
                Player cards contain your stats, abilities, and match history. 
                Once created, you'll be able to participate in matches!
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}