/**
 * Action State Machine Hook
 *
 * Manages the flow of contextual actions from selection through execution.
 * Uses a state machine pattern for predictable action handling.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  ActionDefinition,
  ActionTarget,
  ActionFlowState,
  ActionModalState,
  ActionCondition,
  ActionInputField,
} from '../types/actions';
import { useGameStore } from '../store';

// ============================================================================
// Types
// ============================================================================

interface UseActionStateReturn {
  // State
  modalState: ActionModalState;
  flowState: ActionFlowState;

  // Actions
  openActionModal: (context: ActionModalState['context'], target: ActionTarget, availableActions: ActionDefinition[]) => void;
  closeActionModal: () => void;
  selectAction: (action: ActionDefinition) => void;
  updateInput: (name: string, value: any) => void;
  validateInputs: () => boolean;
  executeAction: () => Promise<void>;
  goBack: () => void;

  // Derived state
  canExecute: boolean;
  missingInputs: string[];
  validationErrors: Record<string, string>;
}

// ============================================================================
// Validation Helpers
// ============================================================================

// Define the PlayerState type based on the store
interface PlayerState {
  name: string;
  rank: string;
  family: string;
  wealth: number;
  respect: number;
  loyalty: number;
}

function validateInput(
  field: ActionInputField,
  value: any,
  playerState: PlayerState
): string | null {
  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label} is required`;
  }

  if (!value) return null;

  if (field.validation) {
    if (field.type === 'number') {
      const num = Number(value);
      if (field.validation.min !== undefined && num < field.validation.min) {
        return field.validation.message || `Minimum value is ${field.validation.min}`;
      }
      if (field.validation.max !== undefined && num > field.validation.max) {
        return field.validation.message || `Maximum value is ${field.validation.max}`;
      }
    }

    if (field.validation.pattern && field.type === 'text') {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        return field.validation.message || 'Invalid format';
      }
    }
  }

  // Special validation for bribe amounts based on player wealth
  if (field.name === 'amount' && field.options) {
    const amountMap: Record<string, number> = {
      small: 500,
      medium: 2000,
      large: 5000,
      massive: 10000,
    };
    const cost = amountMap[value as string] || 0;
    if (cost > playerState.wealth) {
      return `You don't have enough money (need $${cost})`;
    }
  }

  return null;
}

function checkCondition(
  condition: ActionCondition,
  playerState: PlayerState,
  target?: ActionTarget
): boolean {
  const rankOrder = ['Outsider', 'Associate', 'Soldier', 'Capo', 'Underboss', 'Don'];
  const playerRankIndex = rankOrder.indexOf(playerState.rank);

  switch (condition.type) {
    case 'rank': {
      const requiredRankIndex = rankOrder.indexOf(condition.value as string);
      switch (condition.operator) {
        case 'eq': return playerState.rank === condition.value;
        case 'ne': return playerState.rank !== condition.value;
        case 'gte': return playerRankIndex >= requiredRankIndex;
        case 'gt': return playerRankIndex > requiredRankIndex;
        case 'lte': return playerRankIndex <= requiredRankIndex;
        case 'lt': return playerRankIndex < requiredRankIndex;
        default: return false;
      }
    }
    case 'family': {
      switch (condition.operator) {
        case 'eq': return playerState.family === condition.value;
        case 'ne': return playerState.family !== condition.value;
        case 'in': return (condition.value as string[]).includes(playerState.family);
        case 'not_in': return !(condition.value as string[]).includes(playerState.family);
        default: return false;
      }
    }
    case 'wealth': {
      switch (condition.operator) {
        case 'gte': return playerState.wealth >= condition.value;
        case 'gt': return playerState.wealth > condition.value;
        case 'eq': return playerState.wealth === condition.value;
        default: return false;
      }
    }
    case 'custom': {
      if (condition.value === 'has_intel') {
        // Would check player intel cache
        return true; // Placeholder
      }
      if (condition.value === 'same_family' && target) {
        return target.metadata?.family === playerState.family;
      }
      return true;
    }
    default:
      return true;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useActionState(): UseActionStateReturn {
  const { player, executeSkill } = useGameStore();

  const [modalState, setModalState] = useState<ActionModalState>({
    isOpen: false,
    context: null,
    target: null,
    availableActions: [],
    selectedAction: null,
    flowState: 'idle',
    inputValues: {},
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // Modal Control
  // ============================================================================

  const openActionModal = useCallback((
    context: ActionModalState['context'],
    target: ActionTarget,
    availableActions: ActionDefinition[]
  ) => {
    setModalState({
      isOpen: true,
      context,
      target,
      availableActions,
      selectedAction: null,
      flowState: 'selecting',
      inputValues: {},
    });
    setValidationErrors({});
  }, []);

  const closeActionModal = useCallback(() => {
    setModalState({
      isOpen: false,
      context: null,
      target: null,
      availableActions: [],
      selectedAction: null,
      flowState: 'idle',
      inputValues: {},
    });
    setValidationErrors({});
  }, []);

  // ============================================================================
  // Action Selection
  // ============================================================================

  const selectAction = useCallback((action: ActionDefinition) => {
    // Check conditions
    if (action.conditions) {
      for (const condition of action.conditions) {
        if (!checkCondition(condition, player, modalState.target || undefined)) {
          setValidationErrors({
            general: condition.message || 'You cannot perform this action',
          });
          return;
        }
      }
    }

    // Set default values for inputs
    const defaultValues: Record<string, any> = {};
    if (action.inputs) {
      for (const input of action.inputs) {
        if (input.defaultValue !== undefined) {
          defaultValues[input.name] = input.defaultValue;
        }
      }
    }

    // Pre-fill target if applicable
    if (modalState.target && action.targetRequired) {
      const targetInput = action.inputs?.find(i =>
        i.name === 'target' || i.name === 'recipient' || i.name === 'character'
      );
      if (targetInput) {
        defaultValues[targetInput.name] = modalState.target.id;
      }
    }

    setModalState(prev => ({
      ...prev,
      selectedAction: action,
      flowState: action.inputs && action.inputs.length > 0 ? 'input' : 'confirming',
      inputValues: defaultValues,
    }));
    setValidationErrors({});
  }, [modalState.target, player]);

  // ============================================================================
  // Input Management
  // ============================================================================

  const updateInput = useCallback((name: string, value: any) => {
    setModalState(prev => ({
      ...prev,
      inputValues: {
        ...prev.inputValues,
        [name]: value,
      },
    }));

    // Clear validation error for this field
    setValidationErrors(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const validateInputs = useCallback((): boolean => {
    if (!modalState.selectedAction?.inputs) return true;

    const errors: Record<string, string> = {};
    let isValid = true;

    for (const field of modalState.selectedAction.inputs) {
      const value = modalState.inputValues[field.name];
      const error = validateInput(field, value, player);
      if (error) {
        errors[field.name] = error;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  }, [modalState.selectedAction, modalState.inputValues, player]);

  // ============================================================================
  // Execution
  // ============================================================================

  const executeAction = useCallback(async () => {
    if (!modalState.selectedAction) return;

    // Validate
    if (!validateInputs()) {
      setModalState(prev => ({ ...prev, flowState: 'input' }));
      return;
    }

    setModalState(prev => ({ ...prev, flowState: 'executing' }));

    try {
      const action = modalState.selectedAction;
      const inputs = modalState.inputValues;

      // Handle task actions
      if (action.id === 'task-complete') {
        // Task completion is handled separately via store
        setModalState(prev => ({ ...prev, flowState: 'success' }));
        setTimeout(() => {
          closeActionModal();
        }, 500);
        return;
      }

      // Build skill command if applicable
      if (action.skillCommand) {
        const args: Record<string, any> = {};

        // Map input values to skill arguments
        switch (action.skillCommand) {
          case 'message':
            args.recipient = inputs.recipient || inputs.target || modalState.target?.id;
            args.content = inputs.content || inputs.message || 'Action from game interface';
            break;
          case 'attack':
            // For territory context, resolve to the owning family as target
            if (modalState.context === 'territory' && modalState.target?.metadata?.owner) {
              args.target = modalState.target.metadata.owner.toLowerCase();
            } else {
              args.target = inputs.target || modalState.target?.id;
            }
            args.type = inputs.type;
            break;
          case 'intel':
            // For territory context, resolve to the owning family as target
            if (modalState.context === 'territory' && modalState.target?.metadata?.owner) {
              args.target = modalState.target.metadata.owner.toLowerCase();
            } else {
              args.target = inputs.target || modalState.target?.id;
            }
            args.type = inputs.type || inputs.focus;
            break;
          case 'recruit':
            args.target = inputs.target || modalState.target?.id;
            break;
          case 'expand':
            args.amount = inputs.amount;
            args.territory = inputs.territory || modalState.target?.id;
            break;
          case 'claim':
            args.territory = inputs.territory || modalState.target?.id;
            break;
          case 'seek-patronage':
            args.character = inputs.character || modalState.target?.id;
            break;
          default:
            // Pass all inputs as arguments
            Object.assign(args, inputs);
        }

        executeSkill(action.skillCommand, args);
      } else {
        // Handle non-skill actions (would send custom command)
        console.log('Executing custom action:', action.id, inputs);
      }

      setModalState(prev => ({ ...prev, flowState: 'success' }));

      // Close modal after brief delay
      setTimeout(() => {
        closeActionModal();
      }, 500);
    } catch (error) {
      setModalState(prev => ({
        ...prev,
        flowState: 'error',
        error: error instanceof Error ? error.message : 'Action failed',
      }));
    }
  }, [modalState, validateInputs, executeSkill, closeActionModal]);

  // ============================================================================
  // Navigation
  // ============================================================================

  const goBack = useCallback(() => {
    if (modalState.flowState === 'input') {
      // Go from input back to selecting
      setModalState(prev => ({
        ...prev,
        selectedAction: null,
        flowState: 'selecting',
        inputValues: {},
      }));
      setValidationErrors({});
    } else if (modalState.flowState === 'confirming') {
      // Go from confirming back to input (if has inputs) or selecting
      setModalState(prev => ({
        ...prev,
        flowState: prev.selectedAction?.inputs?.length ? 'input' : 'selecting',
      }));
      setValidationErrors({});
    }
  }, [modalState.flowState]);

  // ============================================================================
  // Derived State
  // ============================================================================

  const canExecute = useMemo(() => {
    if (!modalState.selectedAction) return false;
    if (modalState.flowState === 'executing') return false;

    // Check required inputs
    if (modalState.selectedAction.inputs) {
      for (const field of modalState.selectedAction.inputs) {
        if (field.required) {
          const value = modalState.inputValues[field.name];
          if (value === undefined || value === null || value === '') {
            return false;
          }
        }
      }
    }

    return Object.keys(validationErrors).length === 0;
  }, [modalState, validationErrors]);

  const missingInputs = useMemo(() => {
    if (!modalState.selectedAction?.inputs) return [];

    return modalState.selectedAction.inputs
      .filter(field => field.required && !modalState.inputValues[field.name])
      .map(field => field.name);
  }, [modalState]);

  return {
    modalState,
    flowState: modalState.flowState,
    openActionModal,
    closeActionModal,
    selectAction,
    updateInput,
    validateInputs,
    executeAction,
    goBack,
    canExecute,
    missingInputs,
    validationErrors,
  };
}
