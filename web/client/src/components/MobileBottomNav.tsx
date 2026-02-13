import { Map, ScrollText, User, Zap } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'game' | 'history' | 'details' | 'actions';
  onTabChange: (tab: 'game' | 'history' | 'details' | 'actions') => void;
}

const tabs = [
  { id: 'game' as const, label: 'Game', icon: Map },
  { id: 'history' as const, label: 'History', icon: ScrollText },
  { id: 'details' as const, label: 'Details', icon: User },
  { id: 'actions' as const, label: 'Actions', icon: Zap },
];

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="h-16 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around px-2 safe-area-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] rounded-lg transition-colors ${
              isActive
                ? 'text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
