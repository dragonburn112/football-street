import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { Group } from "@shared/schema";
import { getUserGroups } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GroupSelectorProps {
  user: User;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onSelectGroup: (groupId: string) => void;
  onSignOut: () => void;
}

export default function GroupSelector({ 
  user, 
  onCreateGroup, 
  onJoinGroup, 
  onSelectGroup,
  onSignOut 
}: GroupSelectorProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserGroups();
  }, [user.uid]);

  const loadUserGroups = async () => {
    try {
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups);
    } catch (error) {
      console.error("Failed to load groups:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-primary text-4xl mb-4"></i>
          <p className="text-muted-foreground">Loading your groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <i className="fas fa-futbol text-primary text-5xl mb-4"></i>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Street Football Cards
          </h1>
          <p className="text-muted-foreground">
            Welcome, {user.displayName || 'Player'}!
          </p>
          <Button 
            data-testid="button-sign-out"
            onClick={onSignOut}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            Sign Out
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Button 
            data-testid="button-create-group"
            onClick={onCreateGroup}
            className="flex items-center gap-3 py-8 text-lg"
          >
            <i className="fas fa-plus text-xl"></i>
            Create Group
          </Button>
          
          <Button 
            data-testid="button-join-group"
            onClick={onJoinGroup}
            variant="outline"
            className="flex items-center gap-3 py-8 text-lg"
          >
            <i className="fas fa-sign-in-alt text-xl"></i>
            Join Group
          </Button>
        </div>

        {/* User's Groups */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <i className="fas fa-list text-primary"></i>
            Your Groups ({groups.length})
          </h2>
          
          {groups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <i className="fas fa-users text-muted-foreground text-4xl mb-4"></i>
                <p className="text-muted-foreground mb-4">
                  You haven't joined any groups yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create a new group or join an existing one with a group code
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <Card 
                  key={group.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onSelectGroup(group.id)}
                  data-testid={`group-card-${group.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription>Code: {group.code}</CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                        </Badge>
                        {group.createdBy === user.uid && (
                          <div className="text-xs text-muted-foreground mt-1">Owner</div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}