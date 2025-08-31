import { type Match, type PlayerCard } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchDisplayProps {
  match: Match;
  players: PlayerCard[];
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  canEdit?: boolean;
}

export default function MatchDisplay({ match, players, onEdit, onDelete, onView, canEdit }: MatchDisplayProps) {
  // Create player lookup for quick access
  const playerLookup = players.reduce((acc, player) => {
    acc[player.id] = player;
    return acc;
  }, {} as Record<string, PlayerCard>);

  const getPlayersByTeam = (teamPlayerIds: string[]) => {
    return teamPlayerIds.map(id => playerLookup[id]).filter(Boolean);
  };

  const formatDate = (timestamp: any) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }
    return new Date().toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <i className="fas fa-futbol text-primary"></i>
                {match.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {match.numberOfTeams} teams • {match.playersPerTeam} players each • Created {formatDate(match.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              {onView && (
                <Button
                  data-testid={`button-view-match-${match.id}`}
                  onClick={onView}
                  variant="outline"
                  size="sm"
                >
                  <i className="fas fa-eye mr-1"></i>
                  View
                </Button>
              )}
              {canEdit && (
                <>
                  {onEdit && (
                    <Button
                      data-testid={`button-edit-match-${match.id}`}
                      onClick={onEdit}
                      variant="outline"
                      size="sm"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      data-testid={`button-delete-match-${match.id}`}
                      onClick={onDelete}
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

    </div>
  );
}