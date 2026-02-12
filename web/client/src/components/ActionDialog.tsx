import { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { getCharacterById } from '../data/families';

interface ActionDialogProps {
  skill: string;
  onClose: () => void;
}

export function ActionDialog({ skill, onClose }: ActionDialogProps) {
  const { selectedCharacter, executeSkill } = useGameStore();
  const [amount, setAmount] = useState<'small' | 'medium' | 'large'>('medium');
  const [attackType, setAttackType] = useState<'assassinate' | 'beatdown' | 'business' | 'territory'>('beatdown');
  const [intelType, setIntelType] = useState<'spy' | 'steal' | 'blackmail' | 'survey'>('survey');
  const [messageContent, setMessageContent] = useState('');
  const [targetCharacter, setTargetCharacter] = useState('');

  // Use selected character by default
  useEffect(() => {
    if (selectedCharacter) {
      setTargetCharacter(selectedCharacter);
    }
  }, [selectedCharacter]);

  const selectedChar = selectedCharacter ? getCharacterById(selectedCharacter) : null;

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
        executeSkill('expand', { amount });
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
            {skill === 'message' && '✉️ Send Message'}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Target Character Selection */}
          {['seek-patronage', 'recruit', 'attack', 'intel', 'message'].includes(skill) && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Target Character
                {selectedChar && (
                  <span className="ml-2 text-xs text-zinc-500">
                    (Selected: {selectedChar.fullName})
                  </span>
                )}
              </label>
              <input
                type="text"
                value={targetCharacter}
                onChange={(e) => setTargetCharacter(e.target.value)}
                placeholder="e.g., moretti_carlo, marinelli_vito"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm"
              />
              {selectedCharacter && (
                <button
                  onClick={() => setTargetCharacter(selectedCharacter)}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  Use selected: {selectedChar.fullName}
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
                  { value: 'assassinate', label: '🗡️ Assassinate', desc: 'Eliminate permanently' },
                  { value: 'beatdown', label: '👊 Beatdown', desc: 'Send a message' },
                  { value: 'business', label: '💼 Business', desc: 'Attack operations' },
                  { value: 'territory', label: '📍 Territory', desc: 'Take territory' },
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
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Intel Type Selection */}
          {skill === 'intel' && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Operation Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'spy', label: '👁️ Spy', desc: 'Observe activities' },
                  { value: 'steal', label: '💰 Steal', desc: 'Take resources' },
                  { value: 'blackmail', label: '📸 Blackmail', desc: 'Get leverage' },
                  { value: 'survey', label: '📊 Survey', desc: 'Assess capabilities' },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setIntelType(type.value as any)}
                    className={`p-3 rounded-md text-left transition-colors ${
                      intelType === type.value
                        ? 'bg-purple-900/50 border border-purple-700'
                        : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-zinc-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Expand Amount Selection */}
          {skill === 'expand' && (
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
