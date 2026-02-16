/**
 * Contextual Action Definitions
 *
 * This module defines all available actions in the game, organized by context.
 * Actions are used to generate contextual UI elements across the game.
 */

import type {
  ActionDefinition,
  ActionContextType,
  FamilyActions,
  TerritoryActions,
  CharacterActions,
  HistoryActions,
  TaskActions,
} from '../types/actions';

// ============================================================================
// Family Actions
// ============================================================================

export const familyMessageAction: ActionDefinition = {
  id: 'family-message',
  name: 'Message',
  description: 'Send a message to the Don or Consigliere',
  category: 'social',
  contexts: ['family'],
  skillCommand: 'message',
  style: { icon: '✉️', color: 'blue' },
  inputs: [
    {
      name: 'recipient',
      label: 'Recipient',
      type: 'select',
      required: true,
      options: [], // Populated dynamically based on family
    },
    {
      name: 'content',
      label: 'Message',
      type: 'textarea',
      required: true,
      placeholder: 'Type your message...',
    },
  ],
  targetRequired: true,
};

export const familyAttackAction: ActionDefinition = {
  id: 'family-attack',
  name: 'Attack',
  description: 'Launch an assault against this family',
  category: 'combat',
  contexts: ['family'],
  skillCommand: 'attack',
  style: { icon: '⚔️', color: 'red' },
  inputs: [
    {
      name: 'type',
      label: 'Attack Type',
      type: 'select',
      required: true,
      options: [
        { value: 'assassinate', label: '🗡️ Assassinate', description: 'Eliminate a key member permanently' },
        { value: 'beatdown', label: '👊 Beatdown', description: 'Send a violent message' },
        { value: 'business', label: '💼 Business', description: 'Attack their operations' },
        { value: 'territory', label: '📍 Territory', description: 'Seize their territory' },
      ],
    },
    {
      name: 'target',
      label: 'Target Member (optional)',
      type: 'select',
      required: false,
      options: [], // Populated dynamically
    },
  ],
  targetRequired: true,
};

export const familySpyAction: ActionDefinition = {
  id: 'family-spy',
  name: 'Spy',
  description: 'Gather intelligence on this family',
  category: 'espionage',
  contexts: ['family'],
  skillCommand: 'intel',
  style: { icon: '🕵️', color: 'purple' },
  inputs: [
    {
      name: 'type',
      label: 'Operation Type',
      type: 'select',
      required: true,
      options: [
        { value: 'spy', label: '👁️ Spy', description: 'Observe their activities' },
        { value: 'steal', label: '💰 Steal', description: 'Take their resources' },
        { value: 'blackmail', label: '📸 Blackmail', description: 'Find leverage' },
        { value: 'survey', label: '📊 Survey', description: 'Assess their strength' },
      ],
    },
  ],
  targetRequired: true,
};

export const familyAllyAction: ActionDefinition = {
  id: 'family-ally',
  name: 'Propose Alliance',
  description: 'Send an alliance proposal to this family\'s leadership',
  category: 'social',
  contexts: ['family'],
  skillCommand: 'message',
  style: { icon: '🤝', color: 'green' },
  inputs: [
    {
      name: 'content',
      label: 'Alliance Terms',
      type: 'textarea',
      required: true,
      placeholder: 'I propose we form an alliance. We offer... and in return we ask...',
    },
  ],
  conditions: [
    { type: 'rank', operator: 'gte', value: 'Capo', message: 'Must be Capo or higher to propose alliances' },
  ],
  targetRequired: true,
};

export const familySeekPatronageAction: ActionDefinition = {
  id: 'family-seek-patronage',
  name: 'Seek Patronage',
  description: 'Attempt to join this family',
  category: 'social',
  contexts: ['family'],
  skillCommand: 'seek-patronage',
  style: { icon: '🙏', color: 'amber' },
  inputs: [
    {
      name: 'character',
      label: 'Approach Which Member?',
      type: 'select',
      required: true,
      options: [], // Populated dynamically
    },
  ],
  conditions: [
    { type: 'rank', operator: 'eq', value: 'Outsider', message: 'Only Outsiders can seek patronage' },
  ],
  targetRequired: true,
};

export const familyBetrayAction: ActionDefinition = {
  id: 'family-betray',
  name: 'Betray Family',
  description: 'Switch allegiance to this family (not yet available)',
  category: 'social',
  contexts: ['family'],
  style: { icon: '🐍', color: 'gray' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Betrayal is not yet available' },
  ],
  targetRequired: true,
};

// ============================================================================
// Territory Actions
// ============================================================================

export const territoryClaimAction: ActionDefinition = {
  id: 'territory-claim',
  name: 'Claim',
  description: 'Claim this unowned territory for your family (Cost: $25)',
  category: 'territory',
  contexts: ['territory'],
  skillCommand: 'claim',
  style: { icon: '🏴', color: 'green' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to claim territory' },
    { type: 'wealth', operator: 'gte', value: 25, message: 'Need at least $25 to claim territory' },
  ],
  targetRequired: true,
};

export const territoryExpandAction: ActionDefinition = {
  id: 'territory-expand',
  name: 'Expand',
  description: 'Grow your influence in this territory',
  category: 'territory',
  contexts: ['territory'],
  skillCommand: 'expand',
  style: { icon: '📈', color: 'blue' },
  inputs: [
    {
      name: 'amount',
      label: 'Investment',
      type: 'select',
      required: true,
      options: [
        { value: 'small', label: 'Small ($50)', description: '+1-3 territory, 10% rival notice' },
        { value: 'medium', label: 'Medium ($150)', description: '+4-7 territory, 30% rival notice' },
        { value: 'large', label: 'Large ($400)', description: '+8-15 territory, 60% rival notice' },
      ],
    },
  ],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to expand' },
    { type: 'wealth', operator: 'gte', value: 50, message: 'Need at least $50 for smallest expansion' },
  ],
  targetRequired: true,
};

export const territoryDefendAction: ActionDefinition = {
  id: 'territory-defend',
  name: 'Defend',
  description: 'Fortify this territory against attacks (not yet available)',
  category: 'territory',
  contexts: ['territory'],
  style: { icon: '🛡️', color: 'cyan' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Territory defense is not yet available' },
  ],
  targetRequired: true,
};

export const territoryAttackAction: ActionDefinition = {
  id: 'territory-attack',
  name: 'Attack',
  description: 'Seize this territory from its current owner',
  category: 'combat',
  contexts: ['territory'],
  skillCommand: 'attack',
  style: { icon: '⚔️', color: 'red' },
  inputs: [
    {
      name: 'type',
      label: 'Attack Type',
      type: 'select',
      required: true,
      options: [
        { value: 'territory', label: '📍 Territory Assault', description: 'Direct takeover attempt' },
        { value: 'business', label: '💼 Economic Warfare', description: 'Undermine their operations' },
      ],
    },
  ],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to attack territory' },
  ],
  targetRequired: true,
};

export const territorySpyAction: ActionDefinition = {
  id: 'territory-spy',
  name: 'Scout',
  description: 'Survey the owning family\'s strength in this territory',
  category: 'espionage',
  contexts: ['territory'],
  skillCommand: 'intel',
  style: { icon: '👁️', color: 'purple' },
  inputs: [
    {
      name: 'type',
      label: 'Intel Operation',
      type: 'select',
      required: true,
      options: [
        { value: 'survey', label: '📊 Survey', description: 'Assess strength, wealth & soldier count (Cost: $25)' },
        { value: 'spy', label: '👁️ Spy', description: 'Plant a mole to monitor activity (Cost: $100)' },
        { value: 'steal', label: '💰 Steal', description: 'Steal resources from this territory (Cost: $50)' },
      ],
    },
  ],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to scout territory' },
  ],
  targetRequired: true,
};

// ============================================================================
// Character Actions
// ============================================================================

export const characterMessageAction: ActionDefinition = {
  id: 'character-message',
  name: 'Message',
  description: 'Send a message to this character',
  category: 'social',
  contexts: ['character'],
  skillCommand: 'message',
  style: { icon: '✉️', color: 'blue' },
  inputs: [
    {
      name: 'content',
      label: 'Message',
      type: 'textarea',
      required: true,
      placeholder: 'What do you want to say?',
    },
  ],
  targetRequired: true,
};

export const characterAttackAction: ActionDefinition = {
  id: 'character-attack',
  name: 'Attack',
  description: 'Launch a violent action against this character',
  category: 'combat',
  contexts: ['character'],
  skillCommand: 'attack',
  style: { icon: '⚔️', color: 'red' },
  inputs: [
    {
      name: 'type',
      label: 'Attack Type',
      type: 'select',
      required: true,
      options: [
        { value: 'assassinate', label: '🗡️ Assassinate', description: 'Permanent elimination' },
        { value: 'beatdown', label: '👊 Beatdown', description: 'Violent warning' },
        { value: 'business', label: '💼 Hit Business', description: 'Target their operations' },
      ],
    },
  ],
  targetRequired: true,
};

export const characterRecruitAction: ActionDefinition = {
  id: 'character-recruit',
  name: 'Recruit',
  description: 'Recruit this outsider to your family',
  category: 'social',
  contexts: ['character'],
  skillCommand: 'recruit',
  style: { icon: '👥', color: 'green' },
  inputs: [
    {
      name: 'pitch',
      label: 'Recruitment Pitch',
      type: 'textarea',
      required: false,
      placeholder: 'Why should they join your family? (optional)',
    },
  ],
  conditions: [
    { type: 'rank', operator: 'gte', value: 'Soldier', message: 'Must be Soldier or higher to recruit' },
  ],
  targetRequired: true,
};

export const characterBribeAction: ActionDefinition = {
  id: 'character-bribe',
  name: 'Bribe',
  description: 'Offer money to gain their favor or cooperation',
  category: 'economic',
  contexts: ['character'],
  skillCommand: 'message',
  style: { icon: '💰', color: 'amber' },
  inputs: [
    {
      name: 'content',
      label: 'Bribe Offer',
      type: 'textarea',
      required: true,
      placeholder: 'I have a business proposition... I can offer $X in exchange for...',
    },
  ],
  targetRequired: true,
};

export const characterBlackmailAction: ActionDefinition = {
  id: 'character-blackmail',
  name: 'Blackmail',
  description: 'Gather compromising info on this character (Cost: $75)',
  category: 'espionage',
  contexts: ['character'],
  skillCommand: 'intel',
  style: { icon: '📸', color: 'purple' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'gte', value: 'Capo', message: 'Must be Capo or higher to blackmail' },
  ],
  targetRequired: true,
};

export const characterRequestHelpAction: ActionDefinition = {
  id: 'character-request-help',
  name: 'Request Help',
  description: 'Ask this family member for assistance',
  category: 'social',
  contexts: ['character'],
  skillCommand: 'message',
  style: { icon: '🆘', color: 'cyan' },
  inputs: [
    {
      name: 'content',
      label: 'Your Request',
      type: 'textarea',
      required: true,
      placeholder: 'I need your help with... (backup, money, info, protection)',
    },
  ],
  conditions: [
    { type: 'custom', operator: 'eq', value: 'same_family', message: 'Must be in the same family' },
  ],
  targetRequired: true,
};

// ============================================================================
// History/Event Actions
// ============================================================================

export const historyBuyArmsAction: ActionDefinition = {
  id: 'history-buy-arms',
  name: 'Buy Arms',
  description: 'Purchase weapons from the arms dealer (not yet available)',
  category: 'economic',
  contexts: ['history'],
  style: { icon: '🔫', color: 'red' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Arms dealing is not yet available' },
  ],
};

export const historyAttackDealerAction: ActionDefinition = {
  id: 'history-attack-dealer',
  name: 'Attack Dealer',
  description: 'Rob the arms dealer (not yet available)',
  category: 'combat',
  contexts: ['history'],
  style: { icon: '💀', color: 'red' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Not yet available' },
  ],
};

export const historyReportDealerAction: ActionDefinition = {
  id: 'history-report-dealer',
  name: 'Report to Police',
  description: 'Tip off the police about the dealer (not yet available)',
  category: 'espionage',
  contexts: ['history'],
  style: { icon: '👮', color: 'blue' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Not yet available' },
  ],
};

export const historyCounterAttackAction: ActionDefinition = {
  id: 'history-counter-attack',
  name: 'Counter-Attack',
  description: 'Launch immediate retaliation',
  category: 'combat',
  contexts: ['history'],
  skillCommand: 'attack',
  style: { icon: '⚔️', color: 'red' },
};

export const historySpyOnRivalAction: ActionDefinition = {
  id: 'history-spy-rival',
  name: 'Spy',
  description: 'Gather more intelligence on the rival',
  category: 'espionage',
  contexts: ['history'],
  skillCommand: 'intel',
  style: { icon: '🕵️', color: 'purple' },
};

export const historyAlertFamilyAction: ActionDefinition = {
  id: 'history-alert-family',
  name: 'Alert Family',
  description: 'Warn your family about this situation',
  category: 'social',
  contexts: ['history'],
  skillCommand: 'message',
  style: { icon: '⚠️', color: 'amber' },
  inputs: [
    {
      name: 'content',
      label: 'Alert Message',
      type: 'textarea',
      required: true,
      placeholder: 'I need to warn you about...',
    },
  ],
};

export const historySeizeOpportunityAction: ActionDefinition = {
  id: 'history-seize-opportunity',
  name: 'Seize Opportunity',
  description: 'Take advantage of this situation (not yet available)',
  category: 'economic',
  contexts: ['history'],
  style: { icon: '🎯', color: 'green' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Not yet available' },
  ],
};

export const historyPassToFamilyAction: ActionDefinition = {
  id: 'history-pass-opportunity',
  name: 'Pass to Family',
  description: 'Let your family leadership handle it (not yet available)',
  category: 'social',
  contexts: ['history'],
  style: { icon: '🏠', color: 'blue' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Not yet available' },
  ],
};

export const historyDeclineOpportunityAction: ActionDefinition = {
  id: 'history-decline-opportunity',
  name: 'Decline',
  description: 'Pass on this opportunity (not yet available)',
  category: 'social',
  contexts: ['history'],
  style: { icon: '✋', color: 'gray', variant: 'ghost' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Not yet available' },
  ],
};

export const historyDefendAgainstAction: ActionDefinition = {
  id: 'history-defend',
  name: 'Defend',
  description: 'Prepare defenses against the threat (not yet available)',
  category: 'combat',
  contexts: ['history'],
  style: { icon: '🛡️', color: 'cyan' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Not yet available' },
  ],
};

export const historyRetaliateAction: ActionDefinition = {
  id: 'history-retaliate',
  name: 'Retaliate',
  description: 'Strike back at the source',
  category: 'combat',
  contexts: ['history'],
  skillCommand: 'attack',
  style: { icon: '🔥', color: 'red' },
};

export const historyHideAction: ActionDefinition = {
  id: 'history-hide',
  name: 'Hide',
  description: 'Go into hiding to avoid the threat (not yet available)',
  category: 'espionage',
  contexts: ['history'],
  style: { icon: '🌑', color: 'gray' },
  inputs: [],
  conditions: [
    { type: 'rank', operator: 'eq', value: '__never__', message: 'Not yet available' },
  ],
};

// ============================================================================
// Task Actions
// ============================================================================

export const taskAcceptAction: ActionDefinition = {
  id: 'task-accept',
  name: 'Accept',
  description: 'Accept this task',
  category: 'task',
  contexts: ['task'],
  style: { icon: '✓', color: 'green' },
};

export const taskCompleteAction: ActionDefinition = {
  id: 'task-complete',
  name: 'Complete',
  description: 'Mark this task as completed',
  category: 'task',
  contexts: ['task'],
  style: { icon: '✅', color: 'green' },
};

export const taskDeclineAction: ActionDefinition = {
  id: 'task-decline',
  name: 'Decline',
  description: 'Refuse this task',
  category: 'task',
  contexts: ['task'],
  style: { icon: '✕', color: 'red', variant: 'ghost' },
};

export const taskAbandonAction: ActionDefinition = {
  id: 'task-abandon',
  name: 'Abandon',
  description: 'Give up on this task',
  category: 'task',
  contexts: ['task'],
  style: { icon: '🚫', color: 'gray', variant: 'ghost' },
};

// ============================================================================
// Action Group Exports
// ============================================================================

export const familyActions: FamilyActions = {
  message: familyMessageAction,
  attack: familyAttackAction,
  spy: familySpyAction,
  ally: familyAllyAction,
  seekPatronage: familySeekPatronageAction,
  betray: familyBetrayAction,
};

export const territoryActions: TerritoryActions = {
  claim: territoryClaimAction,
  expand: territoryExpandAction,
  defend: territoryDefendAction,
  attack: territoryAttackAction,
  spy: territorySpyAction,
};

export const characterActions: CharacterActions = {
  message: characterMessageAction,
  attack: characterAttackAction,
  recruit: characterRecruitAction,
  bribe: characterBribeAction,
  blackmail: characterBlackmailAction,
  requestHelp: characterRequestHelpAction,
};

export const historyActions: HistoryActions = {
  buyArms: historyBuyArmsAction,
  attackDealer: historyAttackDealerAction,
  reportDealer: historyReportDealerAction,
  counterAttack: historyCounterAttackAction,
  spyOnRival: historySpyOnRivalAction,
  alertFamily: historyAlertFamilyAction,
  seizeOpportunity: historySeizeOpportunityAction,
  passToFamily: historyPassToFamilyAction,
  declineOpportunity: historyDeclineOpportunityAction,
  defendAgainst: historyDefendAgainstAction,
  retaliate: historyRetaliateAction,
  hide: historyHideAction,
};

export const taskActions: TaskActions = {
  accept: taskAcceptAction,
  complete: taskCompleteAction,
  decline: taskDeclineAction,
  abandon: taskAbandonAction,
};

// ============================================================================
// All Actions Registry
// ============================================================================

export const ALL_ACTIONS: ActionDefinition[] = [
  // Family actions
  familyMessageAction,
  familyAttackAction,
  familySpyAction,
  familyAllyAction,
  familySeekPatronageAction,
  familyBetrayAction,
  // Territory actions
  territoryClaimAction,
  territoryExpandAction,
  territoryDefendAction,
  territoryAttackAction,
  territorySpyAction,
  // Character actions
  characterMessageAction,
  characterAttackAction,
  characterRecruitAction,
  characterBribeAction,
  characterBlackmailAction,
  characterRequestHelpAction,
  // History actions
  historyBuyArmsAction,
  historyAttackDealerAction,
  historyReportDealerAction,
  historyCounterAttackAction,
  historySpyOnRivalAction,
  historyAlertFamilyAction,
  historySeizeOpportunityAction,
  historyPassToFamilyAction,
  historyDeclineOpportunityAction,
  historyDefendAgainstAction,
  historyRetaliateAction,
  historyHideAction,
  // Task actions
  taskAcceptAction,
  taskCompleteAction,
  taskDeclineAction,
  taskAbandonAction,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all actions available for a specific context
 */
export function getActionsForContext(context: ActionContextType): ActionDefinition[] {
  return ALL_ACTIONS.filter(action => action.contexts.includes(context));
}

/**
 * Get a specific action by ID
 */
export function getActionById(id: string): ActionDefinition | undefined {
  return ALL_ACTIONS.find(action => action.id === id);
}

/**
 * Filter actions by category
 */
export function getActionsByCategory(category: ActionDefinition['category']): ActionDefinition[] {
  return ALL_ACTIONS.filter(action => action.category === category);
}

/**
 * Get contextual actions for a history entry based on its content
 */
export function getActionsForHistoryEntry(entry: {
  type?: string;
  description?: string;
  action?: string;
}): ActionDefinition[] {
  const text = `${entry.type || ''} ${entry.description || ''} ${entry.action || ''}`.toLowerCase();

  // Arms dealer / weapons
  if (text.includes('arms') || text.includes('dealer') || text.includes('weapon') || text.includes('gun') || text.includes('firearm')) {
    return [
      historyBuyArmsAction,
      historyAttackDealerAction,
      historyReportDealerAction,
    ];
  }

  // Rival activity / attacks
  if (text.includes('rival') || text.includes('enemy') || text.includes('attacked') || text.includes('strike') || text.includes('ambush')) {
    return [
      historyCounterAttackAction,
      historySpyOnRivalAction,
      historyAlertFamilyAction,
    ];
  }

  // Opportunities
  if (text.includes('opportunity') || text.includes('chance') || text.includes('discovered') || text.includes('found') || text.includes('opening')) {
    return [
      historySeizeOpportunityAction,
      historyPassToFamilyAction,
      historyDeclineOpportunityAction,
    ];
  }

  // Threats / danger
  if (text.includes('threat') || text.includes('danger') || text.includes('warning') || text.includes('suspicious') || text.includes('plot')) {
    return [
      historyDefendAgainstAction,
      historyRetaliateAction,
      historyHideAction,
    ];
  }

  // Default - return general investigation actions
  return [
    historySpyOnRivalAction,
    historyAlertFamilyAction,
  ];
}
