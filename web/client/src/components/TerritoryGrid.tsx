import { useState } from 'react';
import { useGameStore } from '../store';
import { FAMILY_COLORS, BUSINESS_DEFINITIONS, type Territory } from '../types';
import { territoryIncome } from './utils';
import { MuscleIcon, LevelIcon, ActionIcon, UpgradeIcon, MoveIcon } from './Icons';

interface TerritoryGridProps {
  onActionSelected?: () => void;
}

export function TerritoryGrid({ onActionSelected }: TerritoryGridProps) {
  const { state, setSelectedAction } = useGameStore();
  const [popupTerritory, setPopupTerritory] = useState<Territory | null>(null);

  const handleTerritoryClick = (t: Territory) => {
    if (state.playerActed) return;
    setPopupTerritory(popupTerritory?.id === t.id ? null : t);
  };

  const handleAction = (action: string, territoryId: string) => {
    setSelectedAction(action, territoryId);
    setPopupTerritory(null);
    onActionSelected?.();
  };

  const getActions = (t: Territory) => {
    const isOwn = t.owner === state.playerFamily;
    if (isOwn) {
      const actions: { action: string; label: string; icon: string; color: string }[] = [
        { action: 'hire', label: 'Hire', icon: 'hire', color: 'bg-blue-600' },
        { action: 'business', label: 'Business', icon: 'upgrade', color: 'bg-purple-600' },
      ];
      if (state.territories.filter(tt => tt.owner === state.playerFamily).length >= 2) {
        actions.push({ action: 'move', label: 'Move', icon: 'move', color: 'bg-teal-600' });
      }
      return actions;
    }
    return [{ action: 'attack', label: 'Attack', icon: 'attack', color: 'bg-red-600' }];
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-3">Territories</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {state.territories.map((t) => {
          const color = t.owner ? FAMILY_COLORS[t.owner] || '#555' : '#444';
          const isPlayer = t.owner === state.playerFamily;
          const isSelected = popupTerritory?.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTerritoryClick(t)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all active:scale-95 text-left ${
                isPlayer ? 'ring-1 ring-white/30' : ''
              } ${isSelected ? 'ring-2 ring-amber-400/70 scale-[1.02]' : ''}`}
              style={{
                borderColor: color,
                backgroundColor: color + '15',
              }}
            >
              <div className="font-semibold text-sm truncate" title={t.name}>{t.name}</div>
              <div className="text-xs text-zinc-400 mt-1">
                {t.owner ? (
                  <span style={{ color }}>{state.families[t.owner]?.name || t.owner}</span>
                ) : (
                  <span className="text-zinc-500">Unclaimed</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span title="Muscle stationed" className="flex items-center gap-0.5"><MuscleIcon size={12} /> {t.muscle}</span>
                <span title="Business type" className="flex items-center gap-0.5"><LevelIcon size={12} /> {BUSINESS_DEFINITIONS[t.business].name}</span>
                <span title="Income per turn" className="text-green-400">${territoryIncome(t.business)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Territory Action Bottom Sheet */}
      {popupTerritory && !state.playerActed && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPopupTerritory(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-700 rounded-t-2xl p-4 animate-slide-up shadow-2xl">
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-3" />
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: popupTerritory.owner ? FAMILY_COLORS[popupTerritory.owner] || '#555' : '#444' }}
              />
              <span className="font-bold">{popupTerritory.name}</span>
              <span className="text-zinc-400 text-sm">
                {popupTerritory.owner ? state.families[popupTerritory.owner]?.name : 'Unclaimed'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
              <span className="flex items-center gap-1"><MuscleIcon size={14} /> {popupTerritory.muscle} muscle</span>
              <span className="flex items-center gap-1"><LevelIcon size={14} /> {BUSINESS_DEFINITIONS[popupTerritory.business].name}</span>
              <span className="text-green-400">${territoryIncome(popupTerritory.business)}/turn</span>
            </div>
            <div className="flex gap-2">
              {getActions(popupTerritory).map((a) => (
                <button
                  key={a.action}
                  onClick={() => handleAction(a.action, popupTerritory.id)}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm ${a.color} active:opacity-80 transition-opacity`}
                >
                  <span className="inline-flex items-center gap-1">
                    {a.icon === 'hire' && <MuscleIcon size={14} />}
                    {a.icon === 'upgrade' && <UpgradeIcon size={14} />}
                    {a.icon === 'move' && <MoveIcon size={14} />}
                    {a.icon === 'attack' && <ActionIcon size={14} />}
                    {a.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
