import { PlayerCard } from "@shared/schema";
import { getPlayerRole, getRoleColor } from "@/lib/player-roles";

interface PlayerCardProps {
  player: PlayerCard;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
  canEdit?: boolean;
  isUnassigned?: boolean;
}

export default function PlayerCardView({ player, onEdit, onDelete, isOwner, canEdit, isUnassigned }: PlayerCardProps) {

  const getCardStyle = () => {
    if (player.overall >= 85) {
      return "fifa-card";
    } else if (player.overall >= 70) {
      return "fifa-card-silver";
    } else {
      return "fifa-card-bronze";
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(player.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(player.id);
  };


  return (
    <div 
      data-testid={`card-player-${player.id}`}
      className={`${getCardStyle()} rounded-lg p-3 relative transform transition-all duration-300 hover:scale-105`}
    >
      {/* Overall Rating */}
      <div className="text-center mb-2">
        <div 
          data-testid={`text-overall-${player.id}`}
          className="text-3xl font-black text-white"
        >
          {player.overall}
        </div>
      </div>
      
      {/* Player Info - More compact */}
      <div className="bg-white/10 rounded-lg p-2 mb-2">
        <div className="w-10 h-12 bg-white/20 rounded mx-auto mb-1 flex items-center justify-center">
          {player.profilePic ? (
            player.profilePic.startsWith('/objects/') ? (
              <img 
                src={player.profilePic} 
                alt="Profile" 
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <span className="text-lg">{player.profilePic}</span>
            )
          ) : (
            <i className="fas fa-user text-white/60 text-sm"></i>
          )}
        </div>
        <div className="text-center">
          <div 
            data-testid={`text-name-${player.id}`}
            className="font-bold text-white text-xs"
          >
            {player.name}
          </div>
          <div 
            data-testid={`text-role-${player.id}`}
            className={`text-xs mt-0.5 flex items-center justify-center gap-1 ${getRoleColor(player.overall)}`}
          >
            <span>{getPlayerRole(player).icon}</span>
            <span>{getPlayerRole(player).title}</span>
          </div>
          {isOwner && (
            <div className="mt-0.5">
              <span className="text-xs bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded">
                You
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats - Moved much higher */}
      <div className="bg-white/10 rounded-lg p-2 grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-white font-medium">
        <div className="flex justify-between">
          <span className="font-bold">PAC</span>
          <span data-testid={`stat-pace-${player.id}`}>{player.pace}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">SHO</span>
          <span data-testid={`stat-shooting-${player.id}`}>{player.shooting}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">PAS</span>
          <span data-testid={`stat-passing-${player.id}`}>{player.passing}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">DRI</span>
          <span data-testid={`stat-dribbling-${player.id}`}>{player.dribbling}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">DEF</span>
          <span data-testid={`stat-defense-${player.id}`}>{player.defense}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">PHY</span>
          <span data-testid={`stat-physical-${player.id}`}>{player.physical}</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      {canEdit && (
        <div className="absolute bottom-2 right-2 flex gap-2">
          {onEdit && (
            <button 
              data-testid={`button-edit-${player.id}`}
              onClick={handleEdit}
              className="text-white/70 hover:text-blue-400 transition-colors"
              title="Edit card"
            >
              <i className="fas fa-edit text-sm"></i>
            </button>
          )}
          {onDelete && (
            <button 
              data-testid={`button-delete-${player.id}`}
              onClick={handleDelete}
              className="text-white/70 hover:text-red-400 transition-colors"
              title="Delete card"
            >
              <i className="fas fa-trash text-sm"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
