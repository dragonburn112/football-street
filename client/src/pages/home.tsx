import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Player } from "@shared/schema";
import PlayerCard from "@/components/player-card";
import PlayerForm from "@/components/player-form";
import FusionInterface from "@/components/fusion-interface";
import TeamGenerator from "@/components/team-generator";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [fusionMode, setFusionMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const createPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      const response = await apiRequest("POST", "/api/players", playerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player card created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create player card",
        variant: "destructive",
      });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/players/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player card deleted successfully!",
      });
    },
  });

  const handleCardSelect = (id: string) => {
    if (!fusionMode) return;

    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    } else if (selectedCards.length < 5) {
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleToggleFusionMode = () => {
    setFusionMode(!fusionMode);
    setSelectedCards([]);
  };

  const handleCreateFusion = async (fusionPlayer: any) => {
    try {
      await createPlayerMutation.mutateAsync(fusionPlayer);
      setSelectedCards([]);
      setFusionMode(false);
    } catch (error) {
      console.error("Failed to create fusion player:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <i className="fas fa-futbol text-primary"></i>
                Street Football Cards
              </h1>
              <p className="text-muted-foreground mt-1">Create, manage and export your ultimate player cards</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                data-testid="button-toggle-fusion"
                onClick={handleToggleFusionMode}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  fusionMode 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                }`}
              >
                <i className="fas fa-magic"></i>
                {fusionMode ? 'Exit Fusion' : 'Fusion Mode'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Player Creation Form */}
        <PlayerForm 
          onCreatePlayer={createPlayerMutation.mutate}
          isLoading={createPlayerMutation.isPending}
        />

        {/* Fusion Interface */}
        {fusionMode && (
          <FusionInterface
            selectedCards={selectedCards}
            players={players}
            onClearSelection={() => setSelectedCards([])}
            onCreateFusion={handleCreateFusion}
          />
        )}

        {/* Player Cards Grid */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Your Player Cards</h2>
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">
                Total: {players.length} players
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                isSelected={selectedCards.includes(player.id)}
                fusionMode={fusionMode}
                onSelect={handleCardSelect}
                onDelete={deletePlayerMutation.mutate}
              />
            ))}
          </div>

          {players.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-user-plus text-muted-foreground text-4xl mb-4"></i>
              <p className="text-muted-foreground">No player cards yet. Create your first player!</p>
            </div>
          )}
        </div>

        {/* Team Generator */}
        <TeamGenerator players={players} />
      </div>
    </div>
  );
}
