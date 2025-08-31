import { Player } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface FusionInterfaceProps {
  selectedCards: string[];
  players: Player[];
  onClearSelection: () => void;
  onCreateFusion: (fusionPlayer: any) => void;
}

export default function FusionInterface({ 
  selectedCards, 
  players, 
  onClearSelection, 
  onCreateFusion 
}: FusionInterfaceProps) {
  const selectedPlayers = players.filter(player => selectedCards.includes(player.id));

  const generateFusion = () => {
    if (selectedPlayers.length < 2) return;

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

    const fusionPlayer = {
      name: `Fusion ${selectedPlayers.map(p => p.name.split(' ')[0]).join('-')}`,
      position: "HYBRID",
      ...averageStats,
      overall,
      isFusion: 1,
    };

    onCreateFusion(fusionPlayer);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 mb-8">
      <h2 className="text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
        <i className="fas fa-magic text-purple-400"></i>
        Fusion Mode
      </h2>
      <p className="text-muted-foreground mb-4">
        Select 2-5 player cards to create a fusion card with averaged stats
      </p>
      
      <div className="flex flex-wrap gap-3 mb-4">
        <span className="text-sm text-muted-foreground">
          Selected: <span data-testid="selected-count">{selectedCards.length}</span>/5
        </span>
        <button 
          data-testid="button-clear-selection"
          onClick={onClearSelection}
          className="text-sm text-destructive hover:text-destructive/80 transition-colors"
        >
          <i className="fas fa-times mr-1"></i>Clear Selection
        </button>
      </div>

      {selectedPlayers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Selected Players:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedPlayers.map((player) => (
              <span 
                key={player.id}
                className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs"
              >
                {player.name} ({player.overall})
              </span>
            ))}
          </div>
        </div>
      )}
      
      <Button 
        data-testid="button-generate-fusion"
        onClick={generateFusion}
        disabled={selectedCards.length < 2}
        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
      >
        <i className="fas fa-wand-magic"></i>
        Generate Fusion Card
      </Button>
    </div>
  );
}
