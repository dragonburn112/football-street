import { PlayerCard } from "@shared/schema";

interface PlayerCardProps {
  player: PlayerCard;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
  canEdit?: boolean;
}

export default function PlayerCardView({ player, onEdit, onDelete, isOwner, canEdit }: PlayerCardProps) {

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
          {player.profilePic ? (
            <span className="text-3xl">{player.profilePic}</span>
          ) : (
            <i className="fas fa-user text-white/60 text-2xl"></i>
          )}
        </div>
        <div className="text-center">
          <div 
            data-testid={`text-name-${player.id}`}
            className="font-bold text-white text-sm"
          >
            {player.name}
          </div>
          <div 
            data-testid={`text-club-${player.id}`}
            className="text-white/80 text-xs mt-1"
          >
            {player.club}
          </div>
          {isOwner && (
            <div className="mt-1">
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                You
              </span>
            </div>
          )}
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
