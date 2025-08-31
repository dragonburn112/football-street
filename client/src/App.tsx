import { useState } from "react";
import { User } from "firebase/auth";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AuthWrapper from "@/components/auth-wrapper";
import GroupSelector from "@/components/group-selector";
import CreateGroup from "@/components/create-group";
import JoinGroup from "@/components/join-group";
import GroupDashboard from "@/components/group-dashboard";
import { auth } from "@/lib/firebase";

type AppView = 'groups' | 'create-group' | 'join-group' | 'group-dashboard';

function AppContent({ user }: { user: User }) {
  const [currentView, setCurrentView] = useState<AppView>('groups');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleGroupCreated = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentView('group-dashboard');
  };

  const handleGroupJoined = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentView('group-dashboard');
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setCurrentView('group-dashboard');
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
    setCurrentView('groups');
  };

  const handleSignOut = () => {
    auth.signOut();
  };

  switch (currentView) {
    case 'create-group':
      return (
        <CreateGroup 
          user={user}
          onGroupCreated={handleGroupCreated}
          onBack={() => setCurrentView('groups')}
        />
      );
    
    case 'join-group':
      return (
        <JoinGroup 
          user={user}
          onGroupJoined={handleGroupJoined}
          onBack={() => setCurrentView('groups')}
        />
      );
    
    case 'group-dashboard':
      if (!selectedGroupId) {
        setCurrentView('groups');
        return null;
      }
      return (
        <GroupDashboard 
          user={user}
          groupId={selectedGroupId}
          onLeaveGroup={handleBackToGroups}
        />
      );
    
    default:
      return (
        <GroupSelector 
          user={user}
          onCreateGroup={() => setCurrentView('create-group')}
          onJoinGroup={() => setCurrentView('join-group')}
          onSelectGroup={handleSelectGroup}
          onSignOut={handleSignOut}
        />
      );
  }
}

function App() {
  return (
    <>
      <Toaster />
      <AuthWrapper>
        {(user) => <AppContent user={user} />}
      </AuthWrapper>
    </>
  );
}

export default App;
