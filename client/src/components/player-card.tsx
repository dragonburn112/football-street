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
      className={`${getCardStyle()} rounded-lg p-2 relative transform transition-all duration-300 hover:scale-105`}
    >
      {/* Overall Rating - Larger and more prominent */}
      <div className="text-center mb-3">
        <div 
          data-testid={`text-overall-${player.id}`}
          className="text-4xl font-black text-white leading-none"
          style={{textShadow: '2px 2px 4px rgba(0,0,0,0.9)'}}
        >
          {player.overall}
        </div>
      </div>
      
      {/* Player Info - More compact */}
      <div className="bg-white/10 rounded-lg p-2 mb-3">
        <div className="w-12 h-14 bg-white/20 rounded mx-auto mb-2 flex items-center justify-center">
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
              <span className="text-xl">{player.profilePic}</span>
            )
          ) : (
            <i className="fas fa-user text-white/60 text-lg"></i>
          )}
        </div>
        <div className="text-center">
          <div 
            data-testid={`text-name-${player.id}`}
            className="font-bold text-white text-sm leading-tight"
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
          >
            {player.name}
          </div>
          {isOwner && (
            <div className="mt-1">
              <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded">
                You
              </span>
            </div>
          )}
          <div 
            data-testid={`text-role-${player.id}`}
            className={`text-xs mt-1 flex items-center justify-center gap-1 ${getRoleColor(player.overall)} font-medium`}
          >
            <span>{getPlayerRole(player).icon}</span>
            <span>{getPlayerRole(player).title}</span>
          </div>
        </div>
      </div>
      
      {/* Stats - More compact and readable */}
      <div className="bg-white/15 rounded-lg p-2 grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm text-white font-bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
        <div className="flex justify-between">
          <span className="text-white/90">PAC</span>
          <span data-testid={`stat-pace-${player.id}`} className="text-white">{player.pace}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/90">SHO</span>
          <span data-testid={`stat-shooting-${player.id}`} className="text-white">{player.shooting}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/90">PAS</span>
          <span data-testid={`stat-passing-${player.id}`} className="text-white">{player.passing}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/90">DRI</span>
          <span data-testid={`stat-dribbling-${player.id}`} className="text-white">{player.dribbling}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/90">DEF</span>
          <span data-testid={`stat-defense-${player.id}`} className="text-white">{player.defense}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/90">PHY</span>
          <span data-testid={`stat-physical-${player.id}`} className="text-white">{player.physical}</span>
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
