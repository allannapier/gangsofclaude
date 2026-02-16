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
  description: 'Suggest a formal alliance between families',
  category: 'social',
  contexts: ['family'],
  style: { icon: '🤝', color: 'green' },
  inputs: [
    {
      name: 'terms',
      label: 'Alliance Terms',
      type: 'textarea',
      required: true,
      placeholder: 'Describe what you offer and what you ask...',
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
  description: 'Switch allegiance to this family',
  category: 'social',
  contexts: ['family'],
  style: { icon: '🐍', color: 'gray' },
  inputs: [
    {
      name: 'confirm',
      label: 'This will make you an enemy of your current family. Are you sure?',
      type: 'confirm',
      required: true,
    },
  ],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to betray it' },
  ],
  targetRequired: true,
};

// ============================================================================
// Territory Actions
// ============================================================================

export const territoryClaimAction: ActionDefinition = {
  id: 'territory-claim',
  name: 'Claim',
  description: 'Claim this unowned territory for your family',
  category: 'territory',
  contexts: ['territory'],
  skillCommand: 'claim',
  style: { icon: '🏴', color: 'green' },
  inputs: [
    {
      name: 'investment',
      label: 'Investment Level',
      type: 'select',
      required: true,
      options: [
        { value: 'small', label: 'Small ($1,000)', description: 'Low risk, slow growth' },
        { value: 'medium', label: 'Medium ($5,000)', description: 'Balanced approach' },
        { value: 'large', label: 'Large ($15,000)', description: 'High risk, fast takeover' },
      ],
    },
  ],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to claim territory' },
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
        { value: 'small', label: 'Small', description: '$1,000 - Low risk' },
        { value: 'medium', label: 'Medium', description: '$5,000 - Medium risk' },
        { value: 'large', label: 'Large', description: '$15,000 - High risk' },
      ],
    },
  ],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to expand' },
  ],
  targetRequired: true,
};

export const territoryDefendAction: ActionDefinition = {
  id: 'territory-defend',
  name: 'Defend',
  description: 'Fortify this territory against attacks',
  category: 'territory',
  contexts: ['territory'],
  style: { icon: '🛡️', color: 'cyan' },
  inputs: [
    {
      name: 'investment',
      label: 'Defense Investment',
      type: 'select',
      required: true,
      options: [
        { value: 'light', label: 'Light ($500)', description: 'Basic security' },
        { value: 'heavy', label: 'Heavy ($2,000)', description: 'Fortified positions' },
        { value: 'extreme', label: 'Extreme ($5,000)', description: 'Maximum security' },
      ],
    },
  ],
  conditions: [
    { type: 'rank', operator: 'ne', value: 'Outsider', message: 'Must be in a family to defend territory' },
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
  style: { icon: '💰', color: 'amber' },
  inputs: [
    {
      name: 'amount',
      label: 'Bribe Amount',
      type: 'select',
      required: true,
      options: [
        { value: 'small', label: '$500', description: 'Small favor' },
        { value: 'medium', label: '$2,000', description: 'Significant request' },
        { value: 'large', label: '$5,000', description: 'Major favor' },
        { value: 'massive', label: '$10,000', description: 'Betrayal-level' },
      ],
    },
    {
      name: 'request',
      label: 'What do you want in return?',
      type: 'textarea',
      required: true,
      placeholder: 'Describe what you are asking for...',
    },
  ],
  targetRequired: true,
};

export const characterBlackmailAction: ActionDefinition = {
  id: 'character-blackmail',
  name: 'Blackmail',
  description: 'Use their secrets against them',
  category: 'espionage',
  contexts: ['character'],
  skillCommand: 'intel',
  style: { icon: '📸', color: 'purple' },
  inputs: [
    {
      name: 'type',
      label: 'Blackmail Type',
      type: 'select',
      required: true,
      options: [
        { value: 'demand', label: '💰 Demand Payment', description: 'Extract money' },
        { value: 'coerce', label: '🎭 Force Cooperation', description: 'Make them work for you' },
        { value: 'expose', label: '📢 Threaten Exposure', description: 'Gain leverage' },
      ],
    },
  ],
  conditions: [
    { type: 'custom', operator: 'eq', value: 'has_intel', message: 'You need dirt on them first' },
  ],
  targetRequired: true,
};

export const characterRequestHelpAction: ActionDefinition = {
  id: 'character-request-help',
  name: 'Request Help',
  description: 'Ask this family member for assistance',
  category: 'social',
  contexts: ['character'],
  style: { icon: '🆘', color: 'cyan' },
  inputs: [
    {
      name: 'type',
      label: 'Type of Help',
      type: 'select',
      required: true,
      options: [
        { value: 'backup', label: '👥 Backup', description: 'Soldiers for a job' },
        { value: 'money', label: '💰 Loan', description: 'Financial assistance' },
        { value: 'info', label: '📊 Information', description: 'Intel or contacts' },
        { value: 'protection', label: '🛡️ Protection', description: 'Protection from enemies' },
      ],
    },
    {
      name: 'details',
      label: 'Details',
      type: 'textarea',
      required: true,
      placeholder: 'Explain what you need and why...',
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
  description: 'Purchase weapons from the arms dealer',
  category: 'economic',
  contexts: ['history'],
  style: { icon: '🔫', color: 'red' },
  inputs: [
    {
      name: 'package',
      label: 'Weapon Package',
      type: 'select',
      required: true,
      options: [
        { value: 'small', label: 'Street Kit ($1,000)', description: 'Basic protection' },
        { value: 'crew', label: 'Crew Arsenal ($5,000)', description: 'Equip your soldiers' },
        { value: 'war', label: 'War Chest ($15,000)', description: 'Full combat readiness' },
      ],
    },
  ],
};

export const historyAttackDealerAction: ActionDefinition = {
  id: 'history-attack-dealer',
  name: 'Attack Dealer',
  description: 'Rob the arms dealer instead of buying',
  category: 'combat',
  contexts: ['history'],
  style: { icon: '💀', color: 'red' },
  inputs: [
    {
      name: 'approach',
      label: 'Approach',
      type: 'select',
      required: true,
      options: [
        { value: 'stealth', label: '🥷 Stealth', description: 'Sneak attack' },
        { value: 'overwhelming', label: '💥 Overwhelming Force', description: 'Full assault' },
      ],
    },
  ],
};

export const historyReportDealerAction: ActionDefinition = {
  id: 'history-report-dealer',
  name: 'Report to Police',
  description: 'Tip off the police about the dealer',
  category: 'espionage',
  contexts: ['history'],
  style: { icon: '👮', color: 'blue' },
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
  description: 'Warn your family about the threat',
  category: 'social',
  contexts: ['history'],
  style: { icon: '⚠️', color: 'amber' },
};

export const historySeizeOpportunityAction: ActionDefinition = {
  id: 'history-seize-opportunity',
  name: 'Seize Opportunity',
  description: 'Take advantage of this situation',
  category: 'economic',
  contexts: ['history'],
  style: { icon: '🎯', color: 'green' },
};

export const historyPassToFamilyAction: ActionDefinition = {
  id: 'history-pass-opportunity',
  name: 'Pass to Family',
  description: 'Let your family leadership handle it',
  category: 'social',
  contexts: ['history'],
  style: { icon: '🏠', color: 'blue' },
};

export const historyDeclineOpportunityAction: ActionDefinition = {
  id: 'history-decline-opportunity',
  name: 'Decline',
  description: 'Pass on this opportunity',
  category: 'social',
  contexts: ['history'],
  style: { icon: '✋', color: 'gray', variant: 'ghost' },
};

export const historyDefendAgainstAction: ActionDefinition = {
  id: 'history-defend',
  name: 'Defend',
  description: 'Prepare defenses against the threat',
  category: 'combat',
  contexts: ['history'],
  style: { icon: '🛡️', color: 'cyan' },
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
  description: 'Go into hiding to avoid the threat',
  category: 'espionage',
  contexts: ['history'],
  style: { icon: '🌑', color: 'gray' },
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
