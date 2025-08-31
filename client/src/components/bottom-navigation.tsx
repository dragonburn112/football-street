import { useState } from "react";
import { User } from "firebase/auth";
import { type Group } from "@shared/schema";
import MyCardsTab from "./my-cards-tab";
import ClubStatsTab from "./club-stats-tab";

interface BottomNavigationProps {
  user: User;
  groupId: string;
  group: Group;
}

type Tab = "dashboard" | "mycard" | "clubstats";

export default function BottomNavigation({ user, groupId, group }: BottomNavigationProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "mycard":
        return (
          <MyCardsTab
            user={user}
            groupId={groupId}
            group={group}
            onBack={() => setActiveTab("dashboard")}
          />
        );
      case "clubstats":
        return (
          <ClubStatsTab
            user={user}
            groupId={groupId}
            group={group}
            onBack={() => setActiveTab("dashboard")}
          />
        );
      default:
        return null;
    }
  };

  if (activeTab !== "dashboard") {
    return (
      <div className="min-h-screen bg-background pb-20">
        {renderContent()}
      </div>
    );
  }

  return null;
}

interface BottomNavBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        
        {/* Dashboard Tab */}
        <button
          data-testid="nav-dashboard"
          onClick={() => onTabChange("dashboard")}
          className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
            activeTab === "dashboard"
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <i className="fas fa-home text-lg"></i>
          <span className="text-xs font-medium">Dashboard</span>
        </button>

        {/* My Player Card Tab */}
        <button
          data-testid="nav-my-card"
          onClick={() => onTabChange("mycard")}
          className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
            activeTab === "mycard"
              ? "text-blue-500 bg-blue-500/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <i className="fas fa-id-card text-lg"></i>
          <span className="text-xs font-medium">My Card</span>
        </button>

        {/* Club Player Stats Tab */}
        <button
          data-testid="nav-club-stats"
          onClick={() => onTabChange("clubstats")}
          className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors ${
            activeTab === "clubstats"
              ? "text-green-500 bg-green-500/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <i className="fas fa-chart-bar text-lg"></i>
          <span className="text-xs font-medium">Club Stats</span>
        </button>

      </div>
    </div>
  );
}