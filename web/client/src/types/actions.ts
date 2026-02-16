/**
 * Contextual Action System Types
 *
 * This module defines the type system for contextual actions across the game UI.
 * Actions are context-aware and appear based on what the player is viewing.
 */

import type { SkillCommand } from './index';

// ============================================================================
// Action Context Types
// ============================================================================

/** The context in which an action is being triggered */
export type ActionContextType =
  | 'family'      // Viewing a family panel
  | 'territory'   // Viewing/interacting with territory
  | 'character'   // Viewing a character card
  | 'history'     // Viewing history/event log
  | 'task'        // Viewing/interacting with tasks
  | 'player';     // Self-actions (no specific target)

/** The target entity for an action */
export interface ActionTarget {
  type: ActionContextType;
  id: string;
  name: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Action Definition Types
// ============================================================================

/** Types of input fields for actions requiring data */
export type ActionInputType =
  | 'text'        // Free text input
  | 'select'      // Single selection from options
  | 'multiselect' // Multiple selections
  | 'number'      // Numeric input
  | 'textarea'    // Multi-line text
  | 'confirm';    // Yes/no confirmation

/** Definition for an input field required by an action */
export interface ActionInputField {
  name: string;
  label: string;
  type: ActionInputType;
  required: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  defaultValue?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

/** Condition that must be met for an action to be available */
export interface ActionCondition {
  type: 'rank' | 'family' | 'wealth' | 'respect' | 'loyalty' | 'territory' | 'custom';
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: any;
  message?: string; // Message shown when condition is not met
}

/** Visual styling for action buttons */
export interface ActionStyle {
  icon: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'amber' | 'gray' | 'cyan';
  variant?: 'solid' | 'outline' | 'ghost';
}

/** Complete action definition */
export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: 'combat' | 'social' | 'economic' | 'espionage' | 'territory' | 'task';
  contexts: ActionContextType[];  // Which contexts this action appears in
  skillCommand?: SkillCommand;    // Associated skill command (if any)
  style: ActionStyle;
  inputs?: ActionInputField[];    // Required input fields
  conditions?: ActionCondition[]; // Conditions to show/enable action
  targetRequired?: boolean;       // Whether a target is required
  targetTypes?: string[];         // Valid target types (e.g., ['family', 'character'])
  cooldown?: number;              // Turns before can use again
  maxUsesPerTurn?: number;        // Maximum uses per turn
}

// ============================================================================
// Action State Types
// ============================================================================

/** Current state of an action in the UI */
export interface ActionState {
  definition: ActionDefinition;
  available: boolean;
  disabled: boolean;
  disabledReason?: string;
  usesThisTurn: number;
  lastUsedTurn: number;
}

/** State machine for action flow */
export type ActionFlowState =
  | 'idle'           // No action in progress
  | 'selecting'      // User selecting action
  | 'input'          // Collecting input
  | 'validating'     // Validating input
  | 'confirming'     // Awaiting confirmation
  | 'executing'      // Sending to server
  | 'success'        // Action completed
  | 'error';         // Action failed

/** Action execution payload */
export interface ActionExecution {
  actionId: string;
  target?: ActionTarget;
  inputs: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// Context-Specific Action Groups
// ============================================================================

/** Actions available when viewing a family */
export interface FamilyActions {
  message: ActionDefinition;      // Send message to Don/Consigliere
  attack: ActionDefinition;       // Attack family territory/members
  spy: ActionDefinition;          // Gather intel on family
  ally?: ActionDefinition;        // Propose alliance (higher ranks)
  seekPatronage?: ActionDefinition; // Join family (Outsiders only)
  betray?: ActionDefinition;      // Switch to this family
}

/** Actions available when viewing a territory */
export interface TerritoryActions {
  claim: ActionDefinition;        // Claim unowned territory
  expand: ActionDefinition;       // Grow owned territory
  defend: ActionDefinition;       // Fortify owned territory
  attack: ActionDefinition;       // Seize enemy territory
  spy: ActionDefinition;          // Scout enemy territory
}

/** Actions available when viewing a character */
export interface CharacterActions {
  message: ActionDefinition;      // Send message
  attack: ActionDefinition;       // Assassinate/beatdown
  recruit: ActionDefinition;      // Recruit (if outsider)
  bribe: ActionDefinition;        // Corrupt them
  blackmail?: ActionDefinition;   // If has secrets
  requestHelp?: ActionDefinition; // Same family only
}

/** Actions available from history/events */
export interface HistoryActions {
  // Arms dealer event
  buyArms?: ActionDefinition;
  attackDealer?: ActionDefinition;
  reportDealer?: ActionDefinition;

  // Rival activity
  counterAttack?: ActionDefinition;
  spyOnRival?: ActionDefinition;
  alertFamily?: ActionDefinition;

  // Opportunity
  seizeOpportunity?: ActionDefinition;
  passToFamily?: ActionDefinition;
  declineOpportunity?: ActionDefinition;

  // Threat
  defendAgainst?: ActionDefinition;
  retaliate?: ActionDefinition;
  hide?: ActionDefinition;
}

/** Actions available for tasks */
export interface TaskActions {
  accept: ActionDefinition;
  complete: ActionDefinition;
  decline: ActionDefinition;
  abandon: ActionDefinition;
}

// ============================================================================
// Action Modal Types
// ============================================================================

export interface ActionModalState {
  isOpen: boolean;
  context: ActionContextType | null;
  target: ActionTarget | null;
  availableActions: ActionDefinition[];
  selectedAction: ActionDefinition | null;
  flowState: ActionFlowState;
  inputValues: Record<string, any>;
  error?: string;
}

// ============================================================================
// Helper Types
// ============================================================================

/** Maps context types to their available action groups */
export interface ContextActionMap {
  family: FamilyActions;
  territory: TerritoryActions;
  character: CharacterActions;
  history: HistoryActions;
  task: TaskActions;
  player: Partial<FamilyActions & TerritoryActions & CharacterActions>;
}

/** Action result from execution */
export interface ActionResult {
  success: boolean;
  message: string;
  effects?: Array<{
    type: 'wealth' | 'respect' | 'loyalty' | 'territory' | 'relationship';
    target: string;
    change: number;
  }>;
  followUpActions?: string[]; // Action IDs available as follow-up
}
