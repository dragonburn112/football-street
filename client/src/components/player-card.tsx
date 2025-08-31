import { PlayerCard } from "@shared/schema";
import { exportCardAsPNG } from "@/lib/card-export";
import { useToast } from "@/hooks/use-toast";

interface PlayerCardProps {
  player: PlayerCard;
}

export default function PlayerCardView({ player }: PlayerCardProps) {
  const { toast } = useToast();

  const getCardStyle = () => {
    if (player.overall >= 85) {
      return "fifa-card";
    } else if (player.overall >= 70) {
      return "fifa-card-silver";
    } else {
      return "fifa-card-bronze";
    }
  };

  const handleExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await exportCardAsPNG(player);
      toast({
        title: "Success",
        description: "Card exported as PNG!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export card",
        variant: "destructive",
      });
    }
  };


  return (
    <div 
      data-testid={`card-player-${player.id}`}
      className={`${getCardStyle()} rounded-lg p-4 relative transform transition-all duration-300 hover:scale-105`}
    >

      
      {/* Overall Rating */}
      <div className="text-center mb-3">
        <div 
          data-testid={`text-overall-${player.id}`}
          className="text-4xl font-black text-white mb-1"
        >
          {player.overall}
        </div>
      </div>
      
      {/* Player Info */}
      <div className="bg-white/10 rounded-lg p-3 mb-3">
        <div className="w-16 h-20 bg-white/20 rounded mx-auto mb-2 flex items-center justify-center">
          <i className="fas fa-user text-white/60 text-2xl"></i>
        </div>
        <div className="text-center">
          <div 
            data-testid={`text-name-${player.id}`}
            className="font-bold text-white text-sm"
          >
            {player.name}
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-1 text-xs text-white/90">
        <div className="flex justify-between">
          <span>PAC</span>
          <span data-testid={`stat-pace-${player.id}`}>{player.pace}</span>
        </div>
        <div className="flex justify-between">
          <span>SHO</span>
          <span data-testid={`stat-shooting-${player.id}`}>{player.shooting}</span>
        </div>
        <div className="flex justify-between">
          <span>PAS</span>
          <span data-testid={`stat-passing-${player.id}`}>{player.passing}</span>
        </div>
        <div className="flex justify-between">
          <span>DRI</span>
          <span data-testid={`stat-dribbling-${player.id}`}>{player.dribbling}</span>
        </div>
        <div className="flex justify-between">
          <span>DEF</span>
          <span data-testid={`stat-defense-${player.id}`}>{player.defense}</span>
        </div>
        <div className="flex justify-between">
          <span>PHY</span>
          <span data-testid={`stat-physical-${player.id}`}>{player.physical}</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="absolute bottom-2 right-2">
        <button 
          data-testid={`button-export-${player.id}`}
          onClick={handleExport}
          className="text-white/70 hover:text-white transition-colors"
          title="Export as PNG"
        >
          <i className="fas fa-download text-sm"></i>
        </button>
      </div>
    </div>
  );
}
