import { useState, useMemo, useEffect } from 'react';
import {
  Swords,
  UserPlus,
  MessageSquare,
  Eye,
  TrendingUp,
  Shield,
  Scroll,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Filter,
  X,
  Circle,
  Target,
  Skull,
  Coins,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { FAMILIES } from '../data/families';
import type { GameEvent } from '../types';
import type { ActionDefinition, ActionTarget } from '../types/actions';
import { getActionsForHistoryEntry } from '../data/actions';
import { ContextualActionModal } from './ContextualActionModal';

interface TurnHistoryBrowserProps {
  events: GameEvent[];
  currentTurn: number;
  onTurnChange?: (turn: number) => void;
  onRefresh?: () => void;
}

const rankOrder = ['Player', 'Associate', 'Soldier', 'Capo', 'Consigliere', 'Underboss', 'Don'];

const rankBadgeColors: Record<string, string> = {
  Player: 'bg-emerald-600 text-emerald-100',
  Associate: 'bg-stone-600 text-stone-100',
  Soldier: 'bg-blue-600 text-blue-100',
  Capo: 'bg-purple-600 text-purple-100',
  Consigliere: 'bg-amber-600 text-amber-100',
  Underboss: 'bg-orange-600 text-orange-100',
  Don: 'bg-red-600 text-red-100',
};

const actionIcons: Record<string, React.ReactNode> = {
  attack: <Swords className="w-4 h-4" />,
  plan_attack: <Swords className="w-4 h-4" />,
  recruit: <UserPlus className="w-4 h-4" />,
  train: <UserPlus className="w-4 h-4" />,
  message: <MessageSquare className="w-4 h-4" />,
  advise: <Scroll className="w-4 h-4" />,
  scout: <Eye className="w-4 h-4" />,
  surveillance: <Eye className="w-4 h-4" />,
  expand: <TrendingUp className="w-4 h-4" />,
  guard: <Shield className="w-4 h-4" />,
  prepare_defense: <Shield className="w-4 h-4" />,
  investigate: <Target className="w-4 h-4" />,
  gather_intel: <Eye className="w-4 h-4" />,
  eliminate: <Skull className="w-4 h-4" />,
  leverage: <Coins className="w-4 h-4" />,
  negotiate: <MessageSquare className="w-4 h-4" />,
  reach_out: <MessageSquare className="w-4 h-4" />,
  report: <Scroll className="w-4 h-4" />,
  analyze: <Target className="w-4 h-4" />,
  support: <Shield className="w-4 h-4" />,
  approve: <Scroll className="w-4 h-4" />,
  wait: <Circle className="w-4 h-4" />,
  infiltrate: <MapPin className="w-4 h-4" />,
};

const actionColors: Record<string, string> = {
  attack: 'bg-red-500/20 text-red-400 border-red-500/30',
  plan_attack: 'bg-red-500/20 text-red-400 border-red-500/30',
  eliminate: 'bg-red-900/30 text-red-300 border-red-700/30',
  recruit: 'bg-green-500/20 text-green-400 border-green-500/30',
  train: 'bg-green-500/20 text-green-400 border-green-500/30',
  expand: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  message: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  advise: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  report: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  scout: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  surveillance: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  investigate: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  gather_intel: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  analyze: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  guard: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  prepare_defense: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  support: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  negotiate: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  reach_out: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  leverage: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  approve: 'bg-green-600/20 text-green-400 border-green-600/30',
  wait: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
  default: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30',
};

function getCharacterFromActor(actorName: string) {
  for (const family of FAMILIES) {
    const member = family.members.find(m => m.fullName === actorName);
    if (member) return member;
  }
  return null;
}

function getFamilyColor(familyId: string): string {
  const family = FAMILIES.find(f => f.id === familyId);
  return family?.color || '#6b7280';
}

function getEventOutcome(event: GameEvent): { label: string; color: string } | null {
  const desc = (event.description || '').toLowerCase();
  const action = (event.action || '').toLowerCase();
  const type = (event.type || '').toLowerCase();

  // Explicit success/failure indicators
  if (action === 'success' || type === 'patronage') return { label: '✓ Success', color: 'text-green-400 bg-green-500/10' };
  if (desc.includes('success')) return { label: '✓ Success', color: 'text-green-400 bg-green-500/10' };
  if (desc.includes('fail') || desc.includes('discovered') || desc.includes('caught')) return { label: '✗ Failed', color: 'text-red-400 bg-red-500/10' };
  if (desc.includes('blocked') || desc.includes('denied') || desc.includes('refused')) return { label: '⊘ Blocked', color: 'text-orange-400 bg-orange-500/10' };

  // Action-type hints
  if (['attack', 'plan_attack', 'eliminate'].includes(action)) return { label: '⚔', color: 'text-red-400 bg-red-500/10' };
  if (['expand', 'recruit', 'train'].includes(action)) return { label: '↑', color: 'text-green-400 bg-green-500/10' };
  if (['guard', 'prepare_defense', 'support'].includes(action)) return { label: '🛡', color: 'text-cyan-400 bg-cyan-500/10' };
  if (['scout', 'surveillance', 'gather_intel', 'investigate', 'analyze'].includes(action)) return { label: '👁', color: 'text-purple-400 bg-purple-500/10' };

  return null;
}

function formatDescription(desc: string): string {
  if (!desc) return '';
  // Clean up generic descriptions like "Actor (family Rank) - action action"
  return desc
    .replace(/\((\w+)\s+(Associate|Soldier|Capo|Consigliere|Underboss|Don)\)/g, '($2)')
    .replace(/\s*-\s*(\w+)\s+action$/, '')
    .replace(/,\s*Target:\s*/g, ' → ');
}

function getRankFromActor(actorName: string): string {
  const char = getCharacterFromActor(actorName);
  return char?.role || 'Player';
}

export function TurnHistoryBrowser({ events, currentTurn, onTurnChange, onRefresh }: TurnHistoryBrowserProps) {
  const [viewingTurn, setViewingTurn] = useState(currentTurn);
  const [familyFilter, setFamilyFilter] = useState<string>('all');
  const [rankFilter, setRankFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedRanks, setExpandedRanks] = useState<Set<string>>(new Set(rankOrder));

  // Action modal state for history entries
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [availableActions, setAvailableActions] = useState<ActionDefinition[]>([]);

  // Update viewing turn when current turn changes
  useEffect(() => {
    setViewingTurn(currentTurn);
  }, [currentTurn]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevTurn();
      } else if (e.key === 'ArrowRight') {
        handleNextTurn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingTurn, currentTurn]);

  const maxTurn = useMemo(() => {
    if (events.length === 0) return currentTurn;
    return Math.max(currentTurn, ...events.map(e => e.turn));
  }, [events, currentTurn]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      if (event.turn !== viewingTurn) return false;
      if (familyFilter !== 'all') {
        const char = getCharacterFromActor(event.actor);
        if (char?.family !== familyFilter) return false;
      }
      if (rankFilter !== 'all') {
        const rank = getRankFromActor(event.actor);
        if (rank !== rankFilter) return false;
      }
      if (actionFilter !== 'all') {
        if (event.action !== actionFilter) return false;
      }
      return true;
    });
  }, [events, viewingTurn, familyFilter, rankFilter, actionFilter]);

  const eventsByRank = useMemo(() => {
    const grouped: Record<string, GameEvent[]> = {};
    for (const rank of rankOrder) {
      grouped[rank] = [];
    }

    for (const event of filteredEvents) {
      const rank = getRankFromActor(event.actor);
      if (grouped[rank]) {
        grouped[rank].push(event);
      }
    }

    return grouped;
  }, [filteredEvents]);

  const uniqueActions = useMemo(() => {
    const actions = new Set<string>();
    events.forEach(e => {
      // Only add string actions to avoid runtime errors
      if (typeof e.action === 'string') {
        actions.add(e.action);
      }
    });
    return Array.from(actions).sort();
  }, [events]);

  const handlePrevTurn = () => {
    if (viewingTurn > 0) {
      const newTurn = viewingTurn - 1;
      setViewingTurn(newTurn);
      onTurnChange?.(newTurn);
    }
  };

  const handleNextTurn = () => {
    if (viewingTurn < maxTurn) {
      const newTurn = viewingTurn + 1;
      setViewingTurn(newTurn);
      onTurnChange?.(newTurn);
    }
  };

  const handleJumpToLatest = () => {
    setViewingTurn(currentTurn);
    onTurnChange?.(currentTurn);
  };

  const clearFilters = () => {
    setFamilyFilter('all');
    setRankFilter('all');
    setActionFilter('all');
  };

  const toggleRankExpansion = (rank: string) => {
    setExpandedRanks(prev => {
      const next = new Set(prev);
      if (next.has(rank)) {
        next.delete(rank);
      } else {
        next.add(rank);
      }
      return next;
    });
  };

  const hasFilters = familyFilter !== 'all' || rankFilter !== 'all' || actionFilter !== 'all';

  const handleEventClick = (event: GameEvent) => {
    // Get contextual actions based on event content
    const actions = getActionsForHistoryEntry({
      type: event.type,
      description: event.description,
      action: event.action,
    });

    setActionTarget({
      type: 'history',
      id: event.id,
      name: `${event.action || 'Event'}`,
      metadata: { event },
    });
    setAvailableActions(actions);
    setActionModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Turn Navigation Header */}
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevTurn}
              disabled={viewingTurn <= 0}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg">
              <span className="text-zinc-400 text-sm">Turn</span>
              <input
                type="number"
                min={0}
                max={maxTurn}
                value={viewingTurn}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= maxTurn) {
                    setViewingTurn(val);
                    onTurnChange?.(val);
                  }
                }}
                className="w-12 bg-transparent text-center font-mono font-bold text-zinc-100 focus:outline-none"
              />
              <span className="text-zinc-500 text-sm">of {maxTurn}</span>
            </div>

            <button
              onClick={handleNextTurn}
              disabled={viewingTurn >= maxTurn}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {viewingTurn !== currentTurn && (
            <button
              onClick={handleJumpToLatest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Latest
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 md:flex-wrap scrollbar-hide">
          <Filter className="w-3.5 h-3.5 text-zinc-500 mr-1" />

          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Families</option>
            {FAMILIES.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            value={rankFilter}
            onChange={(e) => setRankFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Ranks</option>
            {rankOrder.map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-zinc-600"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{typeof action === 'string' ? action.replace(/_/g, ' ') : action}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-sm transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg text-sm transition-colors"
              title="Refresh events"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}

          <div className="ml-auto text-xs text-zinc-500">
            {filteredEvents.length} events
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Circle className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No events for Turn {viewingTurn}</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Clear filters to see all events
              </button>
            )}
          </div>
        ) : (
          rankOrder.map(rank => {
            const rankEvents = eventsByRank[rank];
            if (rankEvents.length === 0) return null;

            const isExpanded = expandedRanks.has(rank);

            return (
              <div key={rank} className="space-y-2">
                {/* Rank Header */}
                <button
                  onClick={() => toggleRankExpansion(rank)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${rankBadgeColors[rank]}`}>
                      {rank}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {rankEvents.length} action{rankEvents.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Rank Events */}
                {isExpanded && (
                  <div className="grid gap-2 pl-2">
                    {rankEvents.map((event, idx) => {
                      const char = getCharacterFromActor(event.actor);
                      const isPlayer = !char; // Player is not in families data
                      const familyColor = isPlayer ? '#10b981' : (char ? getFamilyColor(char.family) : '#6b7280');
                      const actionIcon = actionIcons[event.action] || actionIcons.default;
                      const actionColor = actionColors[event.action] || actionColors.default;
                      const initials = isPlayer ? 'ME' : (event.actor || 'Unknown').split(' ').map(n => n[0]).join('').substring(0, 2);
                      const outcome = getEventOutcome(event);

                      return (
                        <div
                          key={event.id || `${event.turn}-${idx}`}
                          onClick={() => handleEventClick(event)}
                          className={`group flex items-start gap-3 p-3 bg-zinc-900/50 hover:bg-zinc-800/50 border rounded-lg transition-all cursor-pointer ${
                            isPlayer ? 'border-emerald-800/40 hover:border-emerald-700/60' : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {/* Character Avatar */}
                          <div
                            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{
                              backgroundColor: `${familyColor}20`,
                              color: familyColor,
                              border: `2px solid ${familyColor}40`
                            }}
                          >
                            {initials}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-zinc-200 truncate">
                                {isPlayer ? '👤 You' : event.actor}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${actionColor}`}>
                                <span className="flex items-center gap-1">
                                  {actionIcon}
                                  <span className="capitalize">{typeof event.action === 'string' ? event.action.replace(/_/g, ' ') : (event.action && typeof event.action === 'object' ? (event.action as any).skill || JSON.stringify(event.action) : String(event.action))}</span>
                                </span>
                              </span>
                              {outcome && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${outcome.color}`}>
                                  {outcome.label}
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-zinc-400 leading-relaxed">
                              {formatDescription(event.description)}
                            </p>

                            {event.result && (
                              <p className="text-xs text-zinc-500 mt-1 italic">
                                {event.result}
                              </p>
                            )}

                            {event.target && event.target !== 'none' && (
                              <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-500">
                                <Target className="w-3 h-3" />
                                <span>Target: {event.target}</span>
                              </div>
                            )}
                          </div>

                          {/* Sequence Number */}
                          <div className="flex-shrink-0 text-xs text-zinc-600 font-mono">
                            #{String(idx + 1).padStart(2, '0')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Keyboard Hint - Desktop Only */}
      <div className="hidden md:block px-4 py-2 border-t border-zinc-800 bg-zinc-900/30">
        <p className="text-xs text-zinc-600 text-center">
          Use <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">←</kbd>
          {' '}<kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">→</kbd> to navigate turns
        </p>
      </div>

      {/* Contextual Action Modal */}
      <ContextualActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        context="history"
        target={actionTarget}
        actions={availableActions}
        onActionComplete={(actionId, target) => {
          console.log('History action completed:', actionId, target);
          // Could add additional handling here if needed
        }}
      />
    </div>
  );
}
