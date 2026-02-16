/**
 * Contextual Actions Hook
 *
 * Provides actions based on the current game context (family, territory, character, etc.)
 * Filters actions by player rank, conditions, and context.
 */

import { useMemo } from 'react';
import { useGameStore } from '../store';
import type {
  ActionDefinition,
  ActionTarget,
  ActionContextType,
} from '../types/actions';
import {
  familyActions,
  territoryActions,
  characterActions,
  historyActions,
  taskActions,
  getActionsForContext,
} from '../data/actions';
import type { GameEvent } from '../types';

interface UseContextualActionsReturn {
  actions: ActionDefinition[];
  target: ActionTarget | null;
  openModal: () => void;
}

/**
 * Get actions for a specific family context
 */
export function useFamilyActions(familyId: string | null): UseContextualActionsReturn {
  const { player, setSelectedFamily } = useGameStore();

  return useMemo(() => {
    if (!familyId) {
      return { actions: [], target: null, openModal: () => {} };
    }

    const familyName = familyId.charAt(0).toUpperCase() + familyId.slice(1);
    const isOwnFamily = player.family === familyName;
    const isOutsider = player.rank === 'Outsider';

    // Filter actions based on relationship to family
    const actions = Object.values(familyActions).filter(action => {
      // Outsiders can only seek patronage
      if (isOutsider) {
        return action.id === 'family-seek-patronage';
      }

      // Can't seek patronage if already in a family
      if (action.id === 'family-seek-patronage') {
        return false;
      }

      // Can't betray your own family
      if (action.id === 'family-betray' && isOwnFamily) {
        return false;
      }

      // Can't attack your own family
      if (action.id === 'family-attack' && isOwnFamily) {
        return false;
      }

      // Ally only available for higher ranks and not own family
      if (action.id === 'family-ally') {
        return !isOwnFamily;
      }

      return true;
    });

    const target: ActionTarget = {
      type: 'family',
      id: familyId,
      name: familyName,
      metadata: { isOwnFamily, isOutsider },
    };

    return {
      actions,
      target,
      openModal: () => setSelectedFamily(familyId),
    };
  }, [familyId, player.family, player.rank, setSelectedFamily]);
}

/**
 * Get actions for a specific territory context
 */
export function useTerritoryActions(
  territoryName: string | null,
  ownership: Record<string, string>
): UseContextualActionsReturn {
  const { player, setSelectedTerritory } = useGameStore();

  return useMemo(() => {
    if (!territoryName) {
      return { actions: [], target: null, openModal: () => {} };
    }

    const owner = ownership[territoryName];
    const isOwned = !!owner;
    const isOwnTerritory = owner?.toLowerCase() === player.family.toLowerCase();
    const isOutsider = player.rank === 'Outsider';

    // Filter actions based on territory status
    const actions = Object.values(territoryActions).filter(action => {
      // Outsiders can't do territory actions
      if (isOutsider) {
        return false;
      }

      // Claim only for unowned
      if (action.id === 'territory-claim') {
        return !isOwned;
      }

      // Expand/defend only for own territory
      if (action.id === 'territory-expand' || action.id === 'territory-defend') {
        return isOwnTerritory;
      }

      // Attack/spy for enemy territory
      if (action.id === 'territory-attack' || action.id === 'territory-spy') {
        return isOwned && !isOwnTerritory;
      }

      return true;
    });

    const target: ActionTarget = {
      type: 'territory',
      id: territoryName,
      name: territoryName,
      metadata: { owner, isOwned, isOwnTerritory },
    };

    return {
      actions,
      target,
      openModal: () => setSelectedTerritory(territoryName),
    };
  }, [territoryName, ownership, player.family, player.rank, setSelectedTerritory]);
}

/**
 * Get actions for a specific character context
 */
export function useCharacterActions(characterId: string | null): UseContextualActionsReturn {
  const { player, setSelectedCharacter } = useGameStore();

  return useMemo(() => {
    if (!characterId) {
      return { actions: [], target: null, openModal: () => {} };
    }

    // Parse character ID to get family
    const [familyPart] = characterId.split('_');
    const characterFamily = familyPart
      ? familyPart.charAt(0).toUpperCase() + familyPart.slice(1)
      : '';
    const isSameFamily = characterFamily === player.family;
    const isOutsider = player.rank === 'Outsider';

    // Filter actions based on relationship
    const actions = Object.values(characterActions).filter(action => {
      // Outsiders can only message or seek patronage (handled in family actions)
      if (isOutsider) {
        return action.id === 'character-message';
      }

      // Recruit only for outsiders
      if (action.id === 'character-recruit') {
        return false; // Outsiders handled separately
      }

      // Request help only for same family
      if (action.id === 'character-request-help') {
        return isSameFamily;
      }

      // Blackmail requires intel (simplified check)
      if (action.id === 'character-blackmail') {
        return true; // Will be filtered by condition check in modal
      }

      return true;
    });

    const target: ActionTarget = {
      type: 'character',
      id: characterId,
      name: characterId,
      metadata: { family: characterFamily, isSameFamily },
    };

    return {
      actions,
      target,
      openModal: () => setSelectedCharacter(characterId),
    };
  }, [characterId, player.family, player.rank, setSelectedCharacter]);
}

/**
 * Get actions for a specific event in history
 */
export function useHistoryActions(event: GameEvent | null): UseContextualActionsReturn {
  return useMemo(() => {
    if (!event) {
      return { actions: [], target: null, openModal: () => {} };
    }

    // Determine available actions based on event type
    let actions: ActionDefinition[] = [];

    switch (event.action) {
      case 'black_market':
      case 'arms_dealer':
        actions = [
          historyActions.buyArms,
          historyActions.attackDealer,
          historyActions.reportDealer,
        ].filter(Boolean) as ActionDefinition[];
        break;

      case 'attack':
      case 'threat':
        actions = [
          historyActions.counterAttack,
          historyActions.spyOnRival,
          historyActions.alertFamily,
        ].filter(Boolean) as ActionDefinition[];
        break;

      case 'opportunity':
        actions = [
          historyActions.seizeOpportunity,
          historyActions.passToFamily,
          historyActions.declineOpportunity,
        ].filter(Boolean) as ActionDefinition[];
        break;

      case 'betrayal':
      case 'police_crackdown':
        actions = [
          historyActions.defendAgainst,
          historyActions.retaliate,
          historyActions.hide,
        ].filter(Boolean) as ActionDefinition[];
        break;

      default:
        // Generic response for unknown events
        actions = [
          historyActions.alertFamily,
          historyActions.spyOnRival,
        ].filter(Boolean) as ActionDefinition[];
    }

    const target: ActionTarget = {
      type: 'history',
      id: event.id || `event_${event.timestamp}`,
      name: event.description?.slice(0, 50) + '...' || 'Event',
      metadata: { event },
    };

    return {
      actions,
      target,
      openModal: () => {},
    };
  }, [event]);
}

/**
 * Get actions for a specific task
 */
export function useTaskActions(taskId: string | null): UseContextualActionsReturn {
  const { tasks } = useGameStore();

  return useMemo(() => {
    const task = tasks.find(t => t.id === taskId);

    if (!task) {
      return { actions: [], target: null, openModal: () => {} };
    }

    // Filter actions based on task state
    const actions = Object.values(taskActions).filter(action => {
      if (task.completed) {
        return action.id === 'task-abandon';
      }

      // Accept only for new tasks
      if (action.id === 'task-accept') {
        return true; // Could track accepted state separately
      }

      // Complete only for accepted/active tasks
      if (action.id === 'task-complete') {
        return true;
      }

      return true;
    });

    const target: ActionTarget = {
      type: 'task',
      id: taskId!,
      name: (task.content?.slice(0, 30) || 'Task') + (task.content && task.content.length > 30 ? '...' : ''),
      metadata: { task },
    };

    return {
      actions,
      target,
      openModal: () => {},
    };
  }, [taskId, tasks]);
}

/**
 * Get all actions for a generic context
 */
export function useContextualActions(
  context: ActionContextType,
  targetId: string | null
): UseContextualActionsReturn {
  const { player } = useGameStore();

  return useMemo(() => {
    if (!targetId) {
      return { actions: [], target: null, openModal: () => {} };
    }

    const allActions = getActionsForContext(context);

    // Filter by player rank and conditions
    const rankOrder = ['Outsider', 'Associate', 'Soldier', 'Capo', 'Underboss', 'Don'];
    const playerRankIndex = rankOrder.indexOf(player.rank);

    const actions = allActions.filter(action => {
      if (!action.conditions) return true;

      return action.conditions.every(condition => {
        switch (condition.type) {
          case 'rank': {
            const requiredRankIndex = rankOrder.indexOf(condition.value as string);
            switch (condition.operator) {
              case 'eq': return player.rank === condition.value;
              case 'ne': return player.rank !== condition.value;
              case 'gte': return playerRankIndex >= requiredRankIndex;
              case 'gt': return playerRankIndex > requiredRankIndex;
              default: return true;
            }
          }
          case 'family':
            return condition.operator === 'ne'
              ? player.family !== 'None'
              : player.family === condition.value;
          default:
            return true;
        }
      });
    });

    const target: ActionTarget = {
      type: context,
      id: targetId,
      name: targetId,
      metadata: {},
    };

    return {
      actions,
      target,
      openModal: () => {},
    };
  }, [context, targetId, player.rank, player.family]);
}
