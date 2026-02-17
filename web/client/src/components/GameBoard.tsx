import { useState } from 'react';
import { useGameStore } from '../store';
import { TerritoryGrid } from './TerritoryGrid';
import { ActionPanel } from './ActionPanel';
import { EventLog } from './EventLog';
import { FamilyOverview } from './FamilyOverview';
import { TurnModal } from './TurnModal';
import { WinScreen } from './WinScreen';
import { MapIcon, ActionIcon } from './Icons';

type MobileTab = 'map' | 'actions';

export function GameBoard() {
  const { state, showTurnModal } = useGameStore();
  const [mobileTab, setMobileTab] = useState<MobileTab>('map');

  if (state.phase === 'ended') return <WinScreen />;

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex h-[calc(100vh-49px)]">
        {/* Left: Territory Map + Family Overview */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <FamilyOverview />
          <TerritoryGrid />
        </div>
        {/* Right: Actions + Events */}
        <div className="w-[420px] border-l border-zinc-800 flex flex-col">
          <ActionPanel />
          <EventLog />
        </div>
      </div>

      {/* Mobile Layout with tabs */}
      <div className="lg:hidden flex flex-col h-[calc(100dvh-49px)]">
        {/* Compact family overview always visible */}
        <FamilyOverview compact />

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {mobileTab === 'map' && (
            <div className="p-3">
              <TerritoryGrid onActionSelected={() => setMobileTab('actions')} />
            </div>
          )}
          {mobileTab === 'actions' && (
            <div className="flex flex-col h-full">
              <ActionPanel />
              <EventLog />
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur-sm flex">
          {([
            { id: 'map', label: 'Map', icon: <MapIcon /> },
            { id: 'actions', label: 'Actions', icon: <ActionIcon /> },
          ] as { id: MobileTab; label: string; icon: any }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileTab === tab.id
                  ? 'text-amber-400 border-t-2 border-amber-400 bg-zinc-900/50'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Turn Processing Modal */}
      {showTurnModal && <TurnModal />}
    </>
  );
}
