import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '../store';
import { FAMILIES, getCharacterById } from '../data/families';
import type { SkillCommand } from '../types';

interface ActionDialogProps {
  skill: SkillCommand | string;
  onClose: () => void;
}

export function ActionDialog({ skill, onClose }: ActionDialogProps) {
  const { selectedCharacter, executeSkill, selectedTerritory, player, families } = useGameStore();
  const [amount, setAmount] = useState<'small' | 'medium' | 'large'>('medium');
  const [attackType, setAttackType] = useState<'assassinate' | 'beatdown' | 'business' | 'territory'>('beatdown');
  const [intelType, setIntelType] = useState<'spy' | 'steal' | 'blackmail' | 'survey'>('survey');
  const [messageContent, setMessageContent] = useState('');
  const [targetCharacter, setTargetCharacter] = useState('');
  const [claimTerritory, setClaimTerritory] = useState('');

  // Use selected character by default
  useEffect(() => {
    if (selectedCharacter) {
      setTargetCharacter(selectedCharacter);
    }
  }, [selectedCharacter]);

  // Use selected territory by default for claim action
  useEffect(() => {
    if (selectedTerritory && (skill === 'claim' || skill === 'expand')) {
      setClaimTerritory(selectedTerritory);
    }
  }, [selectedTerritory, skill]);

  const selectedChar = selectedCharacter ? getCharacterById(selectedCharacter) : null;

  // Filter characters based on skill context
  const filteredCharacters = useMemo(() => {
    const playerFamily = player.family?.toLowerCase();
    const allChars = families.flatMap(f =>
      f.members.filter(m => m.alive).map(m => ({ ...m, familyName: f.name }))
    );

    switch (skill) {
      case 'seek-patronage':
        return allChars.filter(c =>
          ['Associate', 'Soldier', 'Capo'].includes(c.role)
        );
      case 'attack':
      case 'intel':
        return playerFamily && playerFamily !== 'none'
          ? allChars.filter(c => c.family !== playerFamily)
          : allChars;
      case 'message':
      case 'recruit':
      default:
        return allChars;
    }
  }, [skill, player.family]);

  const handleExecute = () => {
    switch (skill) {
      case 'seek-patronage':
        executeSkill('seek-patronage', { character: targetCharacter });
        break;
      case 'recruit':
        executeSkill('recruit', { target: targetCharacter });
        break;
      case 'attack':
        executeSkill('attack', { target: targetCharacter, type: attackType });
        break;
      case 'intel':
        executeSkill('intel', { target: targetCharacter, type: intelType });
        break;
      case 'expand':
        executeSkill('expand', { amount, territory: claimTerritory || undefined });
        break;
      case 'claim':
        executeSkill('claim', { territory: claimTerritory });
        break;
      case 'message':
        executeSkill('message', { recipient: targetCharacter, content: messageContent });
        break;
    }
    onClose();
  };

  const canExecute = () => {
    switch (skill) {
      case 'seek-patronage':
      case 'recruit':
      case 'attack':
      case 'intel':
        return !!targetCharacter;
      case 'expand':
        return true;
      case 'claim':
        return !!claimTerritory.trim();
      case 'message':
        return !!targetCharacter && !!messageContent.trim();
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="w-full max-w-md bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {skill === 'seek-patronage' && '🤝 Seek Patronage'}
            {skill === 'recruit' && '👥 Recruit'}
            {skill === 'attack' && '⚔️ Attack'}
            {skill === 'intel' && '🕵️ Gather Intel'}
            {skill === 'expand' && '📍 Expand Territory'}
            {skill === 'claim' && '🏴 Claim Territory'}
            {skill === 'message' && '✉️ Send Message'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Contextual guidance */}
          {skill === 'seek-patronage' && (
            <div className="px-3 py-2 bg-purple-900/20 border border-purple-800/30 rounded-lg">
              <p className="text-xs text-purple-300">
                💡 Approach <strong>Associates</strong>, <strong>Soldiers</strong>, or <strong>Capos</strong> to join their family. Dons and Underbosses won't meet with outsiders.
              </p>
            </div>
          )}

          {/* Player wealth indicator for costly operations */}
          {['intel', 'attack', 'expand', 'claim'].includes(skill) && (
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg">
              <span className="text-xs text-zinc-500">Your wealth</span>
              <span className={`text-sm font-semibold ${player.wealth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${player.wealth.toLocaleString()}
              </span>
            </div>
          )}

          {/* Target Character Selection — Dropdown */}
          {['seek-patronage', 'recruit', 'attack', 'intel', 'message'].includes(skill) && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Target Character
                {selectedChar && (
                  <span className="ml-2 text-xs text-zinc-500">
                    (Selected: {selectedChar?.fullName})
                  </span>
                )}
              </label>
              <select
                value={targetCharacter}
                onChange={(e) => setTargetCharacter(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm appearance-none cursor-pointer"
              >
                <option value="">— Select a character —</option>
                {families.map(family => {
                  const chars = filteredCharacters.filter(c => c.family === family.id);
                  if (chars.length === 0) return null;
                  return (
                    <optgroup key={family.id} label={`${family.name} Family`}>
                      {chars.map(char => (
                        <option key={char.id} value={char.id}>
                          {char.fullName} — {char.role}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {selectedCharacter && !targetCharacter && (
                <button
                  onClick={() => setTargetCharacter(selectedCharacter)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Use selected: {selectedChar?.fullName}
                </button>
              )}
            </div>
          )}

          {/* Attack Type Selection */}
          {skill === 'attack' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Attack Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'assassinate', label: '🗡️ Assassinate', desc: 'Eliminate permanently', cost: 'High risk' },
                  { value: 'beatdown', label: '👊 Beatdown', desc: 'Send a message', cost: 'Low cost' },
                  { value: 'business', label: '💼 Business', desc: 'Attack operations', cost: 'Medium cost' },
                  { value: 'territory', label: '📍 Territory', desc: 'Take territory', cost: 'High cost' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setAttackType(type.value as any)}
                    className={`p-3 rounded-md text-left transition-colors ${
                      attackType === type.value
                        ? 'bg-red-900/50 border border-red-700'
                        : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-zinc-500">{type.desc}</div>
                    <div className="text-xs text-amber-500 mt-1">{type.cost}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intel Type Selection — with cost warnings and rank restrictions */}
          {skill === 'intel' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Operation Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'spy', label: '👁️ Spy', desc: 'Observe activities', cost: '~$10', minRank: 'Soldier' },
                  { value: 'steal', label: '💰 Steal', desc: 'Take resources', cost: '~$15', minRank: 'Soldier' },
                  { value: 'blackmail', label: '📸 Blackmail', desc: 'Get leverage', cost: '~$20', minRank: 'Capo' },
                  { value: 'survey', label: '📊 Survey', desc: 'Assess capabilities', cost: '~$25', minRank: 'Associate' },
                ].map((type) => {
                  const rankOrder = ['Outsider', 'Associate', 'Soldier', 'Capo', 'Underboss', 'Don'];
                  const playerRankIdx = rankOrder.indexOf(player.rank);
                  const requiredRankIdx = rankOrder.indexOf(type.minRank);
                  const isLocked = playerRankIdx < requiredRankIdx;

                  return (
                    <button
                      key={type.value}
                      onClick={() => !isLocked && setIntelType(type.value as any)}
                      disabled={isLocked}
                      className={`p-3 rounded-md text-left transition-colors ${
                        isLocked
                          ? 'bg-zinc-900 border border-zinc-800 opacity-50 cursor-not-allowed'
                          : intelType === type.value
                          ? 'bg-purple-900/50 border border-purple-700'
                          : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-zinc-500">{type.desc}</div>
                      <div className="text-xs text-amber-500 mt-1">Cost: {type.cost}</div>
                      {isLocked && (
                        <div className="text-xs text-red-400 mt-1">🔒 Requires {type.minRank}+</div>
                      )}
                    </button>
                  );
                })}
              </div>
              {player.wealth <= 0 && (
                <p className="mt-2 text-xs text-red-400">⚠️ You have no wealth — operations may fail!</p>
              )}
            </div>
          )}

          {/* Expand Amount Selection */}
          {skill === 'expand' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Investment Amount</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'small', label: 'Small', cost: '$1,000', risk: 'Low' },
                    { value: 'medium', label: 'Medium', cost: '$5,000', risk: 'Medium' },
                    { value: 'large', label: 'Large', cost: '$15,000', risk: 'High' },
                  ].map((amt) => (
                    <button
                      key={amt.value}
                      onClick={() => setAmount(amt.value as any)}
                      className={`p-3 rounded-md text-center transition-colors ${
                        amount === amt.value
                          ? 'bg-green-900/50 border border-green-700'
                          : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="font-medium text-sm">{amt.label}</div>
                      <div className="text-xs text-zinc-500">{amt.cost}</div>
                      <div className="text-xs text-amber-500">{amt.risk}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Target Territory (Optional)
                </label>
                <input
                  type="text"
                  value={claimTerritory}
                  onChange={(e) => setClaimTerritory(e.target.value)}
                  placeholder="e.g., Brooklyn, Queens, East Side"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Leave empty to expand randomly, or specify a territory to target it
                </p>
              </div>
            </div>
          )}

          {/* Claim Territory Selection */}
          {skill === 'claim' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Territory to Claim
              </label>
              <input
                type="text"
                value={claimTerritory}
                onChange={(e) => setClaimTerritory(e.target.value)}
                placeholder="e.g., Brooklyn, Queens, East Side"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Claim an unowned territory for your family. Costs wealth and may provoke rivals.
              </p>
            </div>
          )}

          {/* Message Content */}
          {skill === 'message' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Message</label>
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm resize-none"
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={!canExecute()}
            className="px-4 py-2 text-sm bg-blue-900/50 hover:bg-blue-900/70 text-blue-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
