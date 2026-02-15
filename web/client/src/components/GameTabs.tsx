import { useState } from 'react';
import { useGameStore } from '../store';
import { getFamilyById, getCharacterById } from '../data/families';
import { familyActions, territoryActions, characterActions } from '../data/actions';
import { ContextualActionModal } from './ContextualActionModal';
import type { ActionDefinition, ActionTarget } from '../types/actions';
import type { Character } from '../types';
import { Map, Users, ChevronRight, ClipboardList, CheckCircle2, Clock } from 'lucide-react';

// Map territories to their default controlling families for initial display
const DEFAULT_TERRITORY_OWNERSHIP: Record<string, string> = {
  'Little Italy': 'marinelli',
  'North End': 'rossetti',
  'The Docks': '',
  'Fishmarket': 'rossetti',
  'Warehouse District': 'marinelli',
  'East Harbor': '',
  'Southside Clubs': 'rossetti',
  'Downtown': 'falcone',
  'Financial District': 'falcone',
  'East Side': 'moretti',
  'Harbor': 'moretti',
  'Old Town': 'moretti',
};

type TabType = 'territories' | 'families' | 'tasks';

export function GameTabs() {
  const [activeTab, setActiveTab] = useState<TabType>('territories');

  // Action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionContext, setActionContext] = useState<'family' | 'territory' | 'character' | 'history' | 'task' | null>(null);
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);
  const [availableActions, setAvailableActions] = useState<ActionDefinition[]>([]);

  const {
    families,
    gameState,
    player,
    selectedFamily,
    setSelectedFamily,
    selectedCharacter,
    setSelectedCharacter,
    setSelectedTerritory,
    selectedTerritory,
    tasks,
    completeTask,
    executeTask,
  } = useGameStore();

  const territories = [
    'Little Italy', 'North End', 'The Docks',
    'Fishmarket', 'Warehouse District', 'East Harbor',
    'Southside Clubs', 'Downtown', 'Financial District',
    'East Side', 'Harbor', 'Old Town',
  ];

  const getTerritoryOwner = (territory: string): string | null => {
    // First check if game state has specific territory tracking
    if (gameState.territoryOwnership && gameState.territoryOwnership[territory]) {
      return gameState.territoryOwnership[territory];
    }
    // Fall back to default ownership
    return DEFAULT_TERRITORY_OWNERSHIP[territory] || null;
  };

  // Get available actions based on ownership
  const getTerritoryActions = (_territory: string, ownerId: string | null): ActionDefinition[] => {
    const allTerritoryActions = Object.values(territoryActions);

    // If territory is unowned
    if (!ownerId) {
      return allTerritoryActions.filter(a => a.id === 'territory-claim');
    }

    // If territory is owned by player's family
    if (ownerId && player.family.toLowerCase() === ownerId) {
      return allTerritoryActions.filter(a =>
        a.id === 'territory-expand' || a.id === 'territory-defend'
      );
    }

    // If territory is owned by another family
    return allTerritoryActions.filter(a =>
      a.id === 'territory-attack' || a.id === 'territory-spy'
    );
  };

  const handleTerritoryClick = (territory: string) => {
    const ownerId = getTerritoryOwner(territory);
    setSelectedTerritory(territory);
    setSelectedFamily(ownerId);
    setSelectedCharacter(null);

    // Open action modal with territory actions
    const actions = getTerritoryActions(territory, ownerId);
    setActionContext('territory');
    setActionTarget({
      type: 'territory',
      id: territory,
      name: territory,
      metadata: { owner: ownerId },
    });
    setAvailableActions(actions);
    setActionModalOpen(true);
  };

  const getFamilyActions = (familyId: string): ActionDefinition[] => {
    const allFamilyActions = Object.values(familyActions);

    // If player is outsider, only show seek patronage
    if (player.rank === 'Outsider') {
      return allFamilyActions.filter(a => a.id === 'family-seek-patronage');
    }

    // If it's player's own family
    if (player.family.toLowerCase() === familyId) {
      return allFamilyActions.filter(a =>
        a.id === 'family-message' || a.id === 'family-spy'
      );
    }

    // If it's another family
    return allFamilyActions.filter(a =>
      a.id === 'family-message' ||
      a.id === 'family-attack' ||
      a.id === 'family-spy' ||
      a.id === 'family-ally'
    );
  };

  const handleFamilyClick = (familyId: string) => {
    const family = getFamilyById(familyId);
    setSelectedFamily(familyId);
    setSelectedCharacter(null);
    setSelectedTerritory(null);

    // Open action modal with family actions
    const actions = getFamilyActions(familyId);
    setActionContext('family');
    setActionTarget({
      type: 'family',
      id: familyId,
      name: family?.name || familyId,
      metadata: { familyId },
    });
    setAvailableActions(actions);
    setActionModalOpen(true);
  };

  const getCharacterActions = (characterId: string, charObj?: Character): ActionDefinition[] => {
    // Use passed character object or look up by ID
    const char = charObj || getCharacterById(characterId);
    if (!char) return [];

    const allCharActions = Object.values(characterActions);

    // If character is in same family
    if (player.family.toLowerCase() === char.family) {
      return allCharActions.filter(a =>
        a.id === 'character-message' || a.id === 'character-request-help'
      );
    }

    // If character is outsider (not in any family)
    if (!char.family || char.family.length === 0) {
      return allCharActions.filter(a =>
        a.id === 'character-message' ||
        a.id === 'character-recruit' ||
        a.id === 'character-bribe'
      );
    }

    // Character is in another family
    return allCharActions.filter(a =>
      a.id === 'character-message' ||
      a.id === 'character-attack' ||
      a.id === 'character-bribe' ||
      a.id === 'character-blackmail'
    );
  };

  const handleCharacterClick = (member: Character) => {
    setSelectedCharacter(member.id);
    setSelectedFamily(member.family);

    // Open action modal with character actions
    const actions = getCharacterActions(member.id, member);
    setActionContext('character');
    setActionTarget({
      type: 'character',
      id: member.id,
      name: member.fullName,
      metadata: { family: member.family, role: member.role, character: member },
    });
    setAvailableActions(actions);
    setActionModalOpen(true);
  };

  const handleTaskClick = (task: typeof tasks[0]) => {
    const taskAction: ActionDefinition = {
      id: 'task-complete',
      name: 'Mark Complete',
      description: 'Mark this task as completed',
      category: 'task',
      contexts: ['task'],
      style: { icon: '✓', color: 'green' },
      inputs: [],
    };

    setActionContext('task');
    setActionTarget({
      type: 'task',
      id: task.id,
      name: 'Task',
      metadata: { task },
    });
    setAvailableActions([taskAction]);
    setActionModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Header */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('territories')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'territories'
              ? 'text-zinc-100 border-b-2 border-blue-500 bg-zinc-800/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/20'
          }`}
        >
          <Map className="w-4 h-4" />
          Territories
        </button>
        <button
          onClick={() => setActiveTab('families')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'families'
              ? 'text-zinc-100 border-b-2 border-blue-500 bg-zinc-800/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/20'
          }`}
        >
          <Users className="w-4 h-4" />
          Families
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'tasks'
              ? 'text-zinc-100 border-b-2 border-blue-500 bg-zinc-800/30'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/20'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Tasks
          {tasks.filter(t => !t.completed).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-500 text-black rounded-full font-bold">
              {tasks.filter(t => !t.completed).length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-3 md:p-4">
        {activeTab === 'territories' ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-1">Territory Control</h2>
              <p className="text-sm text-zinc-500">
                Click a territory to see who controls it
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {territories.map((territory) => {
                const ownerId = getTerritoryOwner(territory);
                const owner = ownerId ? getFamilyById(ownerId) : null;
                const isSelected = selectedTerritory === territory;

                return (
                  <div
                    key={territory}
                    onClick={() => handleTerritoryClick(territory)}
                    className={`p-3 md:p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : owner
                        ? 'border-transparent hover:border-zinc-600'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    style={owner ? {
                      backgroundColor: isSelected ? undefined : `${owner.color}15`,
                    } : {}}
                  >
                    <div
                      className="text-xs font-medium mb-1 truncate"
                      style={{ color: owner?.color || '#6b7280' }}
                    >
                      {owner?.name || 'Unclaimed'}
                    </div>
                    <div className="text-sm font-medium truncate">
                      {territory}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Family Summary Cards */}
            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Family Holdings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {families.map((family) => (
                  <div
                    key={family.id}
                    onClick={() => handleFamilyClick(family.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedFamily === family.id
                        ? 'border-zinc-500 bg-zinc-800/50'
                        : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: family.color }}
                      />
                      <span className="font-medium text-sm">{family.name}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {family.territory.length} territories • {family.members.filter(m => m.alive).length} members
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Status */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                <span className="text-sm text-zinc-500">Game Phase</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  gameState.phase === 'setup'
                    ? 'bg-blue-900/50 text-blue-400'
                    : gameState.phase === 'playing'
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-red-900/50 text-red-400'
                }`}>
                  {gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ) : activeTab === 'families' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">The Families</h2>
              <p className="text-sm text-zinc-500">
                Click a family to see its members
              </p>
            </div>

            {families.map((family) => {
              const isExpanded = selectedFamily === family.id;
              const aliveMembers = family.members.filter(m => m.alive);

              return (
                <div
                  key={family.id}
                  className="border border-zinc-800 rounded-lg overflow-hidden"
                >
                  {/* Family Header */}
                  <button
                    onClick={() => handleFamilyClick(family.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          backgroundColor: `${family.color}20`,
                          color: family.color,
                        }}
                      >
                        {family.name[0]}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{family.name}</div>
                        <div className="text-xs text-zinc-500">
                          {aliveMembers.length} members • {family.territory.length} territories
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-zinc-500 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Family Stats */}
                  <div className="px-4 pb-3 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-zinc-900/50 rounded">
                      <div className="text-xs text-zinc-500">Wealth</div>
                      <div className="font-semibold text-green-400 text-sm">
                        ${family.stats.wealth.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-zinc-900/50 rounded">
                      <div className="text-xs text-zinc-500">Respect</div>
                      <div className="font-semibold text-amber-400 text-sm">
                        {family.stats.respect}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-zinc-900/50 rounded">
                      <div className="text-xs text-zinc-500">Territory</div>
                      <div className="font-semibold text-blue-400 text-sm">
                        {family.stats.territory}
                      </div>
                    </div>
                  </div>

                  {/* Members List */}
                  {isExpanded && (
                    <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
                      {aliveMembers.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => handleCharacterClick(member)}
                          className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                            selectedCharacter === member.id
                              ? 'bg-zinc-700'
                              : 'bg-zinc-900/50 hover:bg-zinc-800'
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: `${family.color}30`,
                              color: family.color,
                            }}
                          >
                            {member.firstName[0]}{member.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{member.fullName}</div>
                            <div className="text-xs text-zinc-500">{member.role}</div>
                          </div>
                          {selectedCharacter === member.id && (
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : activeTab === 'tasks' ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1">Your Tasks</h2>
              <p className="text-sm text-zinc-500">
                Orders and missions from your family
              </p>
            </div>

            {/* Pending Tasks */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Pending ({tasks.filter(t => !t.completed).length})
              </h3>
              {tasks.filter(t => !t.completed).length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm">No pending tasks</p>
                  <p className="text-xs text-zinc-600 mt-1">Check back after the next turn</p>
                </div>
              ) : (
                tasks.filter(t => !t.completed).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-4 bg-zinc-900/50 border border-amber-500/30 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-amber-400 font-medium">
                            From: {task.from}
                          </span>
                          <span className="text-xs text-zinc-600">•</span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Turn {task.turn}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-200 leading-relaxed">
                          {task.content}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            executeTask(task.id);
                          }}
                          className="px-3 py-1.5 text-xs bg-blue-900/50 hover:bg-blue-900/70 border border-blue-700 text-blue-300 rounded flex items-center gap-2 transition-colors"
                          style={{ display: task.action && typeof task.action === 'object' && Object.keys(task.action).length > 0 ? 'flex' : 'none' }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                          Execute
                        </button>
                      <button
                        onClick={() => completeTask(task.id)}
                        className="px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded flex items-center gap-2 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Mark Complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Completed Tasks */}
            {tasks.filter(t => t.completed).length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Completed ({tasks.filter(t => t.completed).length})
                </h3>
                {tasks.filter(t => t.completed).map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg opacity-60"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-zinc-500">
                            From: {task.from}
                          </span>
                          <span className="text-xs text-zinc-600">•</span>
                          <span className="text-xs text-zinc-500">
                            Turn {task.turn}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400 line-through">
                          {task.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Contextual Action Modal */}
      <ContextualActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        context={actionContext}
        target={actionTarget}
        actions={availableActions}
        onActionComplete={(_actionId, target) => {
          if (actionContext === 'task' && target?.metadata?.task) {
            completeTask(target.metadata.task.id);
          }
        }}
      />
    </div>
  );
}
