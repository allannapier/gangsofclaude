import type { Skill } from '../types';

export const SKILLS: Skill[] = [
  {
    id: 'start-game',
    name: 'Start Game',
    description: 'Initialize a new game of Gangs of Claude',
    category: 'core',
  },
  {
    id: 'status',
    name: 'Status',
    description: 'View your current character stats, family standings, and events',
    category: 'core',
  },
  {
    id: 'next-turn',
    name: 'Next Turn',
    description: 'Advance the turn - all 22 AI characters act in rank order',
    category: 'core',
  },
  {
    id: 'promote',
    name: 'Promote',
    description: 'Check if you qualify for rank promotion and attempt to advance',
    category: 'core',
  },
  {
    id: 'seek-patronage',
    name: 'Seek Patronage',
    description: 'As an outsider, attempt to get recruited by a family',
    category: 'action',
    arguments: [
      {
        name: 'character',
        hint: 'Target associate, soldier, or capo',
      },
    ],
  },
  {
    id: 'recruit',
    name: 'Recruit',
    description: 'Build your network or mentor lower-ranking members',
    category: 'action',
    arguments: [
      {
        name: 'target',
        hint: 'Character to recruit or mentor',
      },
    ],
  },
  {
    id: 'attack',
    name: 'Attack',
    description: 'Launch a violent action against a target',
    category: 'action',
    arguments: [
      {
        name: 'target',
        hint: 'Target character or family',
      },
      {
        name: 'type',
        hint: 'Attack type',
        options: ['assassinate', 'beatdown', 'business', 'territory'],
      },
    ],
  },
  {
    id: 'intel',
    name: 'Intel',
    description: 'Conduct espionage operations',
    category: 'action',
    arguments: [
      {
        name: 'target',
        hint: 'Target to gather intel on',
      },
      {
        name: 'type',
        hint: 'Operation type',
        options: ['spy', 'steal', 'blackmail', 'survey'],
      },
    ],
  },
  {
    id: 'expand',
    name: 'Expand',
    description: 'Grow your family territory and business operations',
    category: 'action',
    arguments: [
      {
        name: 'amount',
        hint: 'Investment amount',
        options: ['small', 'medium', 'large'],
      },
    ],
  },
  {
    id: 'message',
    name: 'Message',
    description: 'Send a message to any character in the game',
    category: 'social',
    arguments: [
      {
        name: 'recipient',
        hint: 'Character to message',
      },
      {
        name: 'content',
        hint: 'Your message',
      },
    ],
  },
];

export function getSkillsByCategory(category: string): Skill[] {
  return SKILLS.filter(skill => skill.category === category);
}
