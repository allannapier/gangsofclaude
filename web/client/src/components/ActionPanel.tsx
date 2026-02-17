import { useState } from 'react';
import { useGameStore } from '../store';
import { FAMILY_COLORS, DIPLOMACY_LABELS, type DiplomacyType } from '../types';
import { ActionIcon, MuscleIcon, UpgradeIcon, MoveIcon, MessageIcon, NewGameIcon } from './Icons';

export function ActionPanel() {
  const { state, nextTurn, performAction, isProcessingTurn, actionResult, dismissActionResult, selectedAction, setSelectedAction, resetGame } = useGameStore();
  const playerFamily = state.playerFamily!;
  const myTerritories = state.territories.filter((t) => t.owner === playerFamily);
  const enemyTerritories = state.territories.filter((t) => t.owner !== playerFamily);

  return (
    <div className="p-4 border-b border-zinc-800 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Actions</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={resetGame}
            className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-xs text-zinc-400 hover:text-white transition-colors"
            title="Start a new game"
          >
            <span className="inline-flex items-center gap-1">
              <NewGameIcon size={14} /> New
            </span>
          </button>
          <button
            onClick={nextTurn}
            disabled={isProcessingTurn}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded font-bold text-sm transition-colors"
          >
            {isProcessingTurn ? 'Processing...' : 'Next Turn →'}
          </button>
        </div>
      </div>

      {/* Action Result Toast */}
      {actionResult && (
        <div
          className={`p-2 rounded text-sm ${actionResult.success ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}
        >
          {actionResult.message}
          <button onClick={dismissActionResult} className="ml-2 text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Action Buttons — message (diplomacy) is free, like AI diplomacy */}
      {state.playerActed && state.playerMessaged && (
        <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-800/50 rounded px-3 py-1.5">
          ✅ Action &amp; message used this turn. Click <strong>Next Turn</strong> to continue.
        </div>
      )}
      {state.playerActed && !state.playerMessaged && (
        <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-800/50 rounded px-3 py-1.5">
          ✅ Action used. You can still send a <strong>Message</strong> this turn.
        </div>
      )}
      {!state.playerActed && state.playerMessaged && (
        <div className="text-sm text-amber-400 bg-amber-900/20 border border-amber-800/50 rounded px-3 py-1.5">
          ✅ Message sent. You can still use an <strong>action</strong> this turn.
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {['hire', 'attack', 'upgrade', 'move'].map((a) => (
          <button
            key={a}
            onClick={() => setSelectedAction(selectedAction === a ? null : a)}
            disabled={state.playerActed}
            className={`px-3 py-1 rounded text-sm border transition-colors capitalize ${
              state.playerActed
                ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
                : selectedAction === a
                ? 'bg-zinc-700 border-zinc-500 text-white'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
            }`}
          >
            {
              {
                hire: <span className="inline-flex items-center gap-1"><MuscleIcon size={14} /> Hire</span>,
                attack: <span className="inline-flex items-center gap-1"><ActionIcon size={14} /> Attack</span>,
                upgrade: <span className="inline-flex items-center gap-1"><UpgradeIcon size={14} /> Upgrade</span>,
                move: <span className="inline-flex items-center gap-1"><MoveIcon size={14} /> Move</span>,
              }[a]
            }
          </button>
        ))}
        {/* Message button — separate from actions, only disabled when already sent */}
        <button
          onClick={() => setSelectedAction(selectedAction === 'message' ? null : 'message')}
          disabled={state.playerMessaged}
          className={`px-3 py-1 rounded text-sm border transition-colors ${
            state.playerMessaged
              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
              : selectedAction === 'message'
              ? 'bg-zinc-700 border-zinc-500 text-white'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
          }`}
        >
          <span className="inline-flex items-center gap-1"><MessageIcon size={14} /> Message</span>
        </button>
      </div>

      {/* Action Forms */}
      {selectedAction === 'hire' && <HireForm myTerritories={myTerritories} />}
      {selectedAction === 'attack' && <AttackForm myTerritories={myTerritories} enemyTerritories={enemyTerritories} />}
      {selectedAction === 'upgrade' && <UpgradeForm myTerritories={myTerritories} />}
      {selectedAction === 'move' && <MoveForm myTerritories={myTerritories} />}
      {selectedAction === 'message' && <MessageForm playerFamily={playerFamily} families={state.families} />}
    </div>
  );
}

function HireForm({ myTerritories }: { myTerritories: any[] }) {
  const { performAction, setSelectedAction, selectedTerritoryId } = useGameStore();
  const [countStr, setCountStr] = useState('1');
  const initial = myTerritories.find(t => t.id === selectedTerritoryId)?.id || myTerritories[0]?.id || '';
  const [territoryId, setTerritoryId] = useState(initial);
  const count = Math.max(1, Math.min(parseInt(countStr, 10) || 1, 10));

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-700">
      <div className="text-sm text-zinc-400">Hire muscle ($50 each, $10/turn upkeep)</div>
      <div className="flex gap-2">
        <select value={territoryId} onChange={(e) => setTerritoryId(e.target.value)} className="flex-1 bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
          {myTerritories.map((t) => <option key={t.id} value={t.id}>{t.name} (M{t.muscle})</option>)}
        </select>
        <input type="text" inputMode="numeric" pattern="[0-9]*" value={countStr} onChange={(e) => setCountStr(e.target.value.replace(/[^0-9]/g, ''))} onBlur={() => setCountStr(String(count))} className="w-16 bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700 text-center" />
      </div>
      <button
        onClick={async () => { await performAction('hire', { count, territoryId }); setSelectedAction(null); }}
        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold"
      >
        Hire {count} Muscle (${count * 50})
      </button>
    </div>
  );
}

function AttackForm({ myTerritories, enemyTerritories }: { myTerritories: any[]; enemyTerritories: any[] }) {
  const { performAction, setSelectedAction, state, selectedTerritoryId } = useGameStore();
  const initialTarget = enemyTerritories.find(t => t.id === selectedTerritoryId)?.id || enemyTerritories[0]?.id || '';
  const [targetId, setTargetId] = useState(initialTarget);
  const [muscleAmounts, setMuscleAmounts] = useState<Record<string, number>>({});

  const totalSending = Object.values(muscleAmounts).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-700">
      <div className="text-sm text-zinc-400">Send muscle from your territories to attack</div>
      <div>
        <label className="text-xs text-zinc-500">Target:</label>
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
          {enemyTerritories.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.owner ? state.families[t.owner]?.name : 'Unclaimed'}) — M{t.muscle}
            </option>
          ))}
        </select>
      </div>
      <div className="text-xs text-zinc-500">Send muscle from:</div>
      {myTerritories.filter(t => t.muscle > 0).map((t) => (
        <div key={t.id} className="flex items-center gap-2 text-sm">
          <span className="flex-1 truncate">{t.name} (M{t.muscle})</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={muscleAmounts[t.id] ?? ''}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              if (raw === '') { setMuscleAmounts({ ...muscleAmounts, [t.id]: 0 }); return; }
              setMuscleAmounts({ ...muscleAmounts, [t.id]: Math.min(parseInt(raw, 10), t.muscle) });
            }}
            className="w-16 bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700 text-center"
          />
        </div>
      ))}
      <div className="text-sm text-zinc-300 inline-flex items-center gap-1">Total attacking: <MuscleIcon size={14} /> {totalSending}</div>
      <button
        onClick={async () => {
          await performAction('attack', { targetTerritoryId: targetId, musclePerTerritory: muscleAmounts, fromTerritoryIds: Object.keys(muscleAmounts) });
          setSelectedAction(null);
        }}
        disabled={totalSending <= 0}
        className="w-full py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded text-sm font-bold"
      >
        Attack with {totalSending} Muscle
      </button>
    </div>
  );
}

function UpgradeForm({ myTerritories }: { myTerritories: any[] }) {
  const { performAction, setSelectedAction, selectedTerritoryId } = useGameStore();
  const upgradeable = myTerritories.filter((t) => t.level < 5);
  const initial = upgradeable.find(t => t.id === selectedTerritoryId)?.id || upgradeable[0]?.id || '';
  const [territoryId, setTerritoryId] = useState(initial);

  if (upgradeable.length === 0) return <div className="text-sm text-zinc-500 p-3">All territories at max level.</div>;

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-700">
      <div className="text-sm text-zinc-400">Upgrade territory income ($200)</div>
      <select value={territoryId} onChange={(e) => setTerritoryId(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
        {upgradeable.map((t) => <option key={t.id} value={t.id}>{t.name} (L{t.level} → L{t.level + 1})</option>)}
      </select>
      <button
        onClick={async () => { await performAction('upgrade', { territoryId }); setSelectedAction(null); }}
        className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold"
      >
        Upgrade Territory ($200)
      </button>
    </div>
  );
}

function MoveForm({ myTerritories }: { myTerritories: any[] }) {
  const { performAction, setSelectedAction, selectedTerritoryId } = useGameStore();
  const initialFrom = myTerritories.find(t => t.id === selectedTerritoryId)?.id || myTerritories[0]?.id || '';
  const [fromId, setFromId] = useState(initialFrom);
  const [toId, setToId] = useState(myTerritories.find(t => t.id !== initialFrom)?.id || myTerritories[0]?.id || '');
  const [amountStr, setAmountStr] = useState('1');
  const fromTerritory = myTerritories.find(t => t.id === fromId);
  const maxAmount = fromTerritory?.muscle || 1;
  const amount = Math.max(1, Math.min(parseInt(amountStr, 10) || 1, maxAmount));

  if (myTerritories.length < 2) return <div className="text-sm text-zinc-500 p-3">Need at least 2 territories to move muscle.</div>;

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-700">
      <div className="text-sm text-zinc-400">Move muscle between your territories</div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-zinc-500">From:</label>
          <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
            {myTerritories.map((t) => <option key={t.id} value={t.id}>{t.name} (M{t.muscle})</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-500">To:</label>
          <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
            {myTerritories.filter(t => t.id !== fromId).map((t) => <option key={t.id} value={t.id}>{t.name} (M{t.muscle})</option>)}
          </select>
        </div>
        <div className="w-20">
          <label className="text-xs text-zinc-500">Amount:</label>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={amountStr} onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))} onBlur={() => setAmountStr(String(amount))} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700 text-center" />
        </div>
      </div>
      <button
        onClick={async () => { await performAction('move', { fromTerritoryId: fromId, toTerritoryId: toId, amount }); setSelectedAction(null); }}
        className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 rounded text-sm font-bold"
      >
        Move {amount} Muscle
      </button>
    </div>
  );
}

function MessageForm({ playerFamily, families }: { playerFamily: string; families: Record<string, any> }) {
  const { performAction, setSelectedAction, state } = useGameStore();
  const otherFamilies = Object.keys(families).filter((f) => f !== playerFamily);
  const [toFamily, setToFamily] = useState(otherFamilies[0] || '');
  const [msgType, setMsgType] = useState<DiplomacyType>('partnership');
  const [targetFamily, setTargetFamily] = useState(otherFamilies[0] || '');
  const needsTarget = msgType === 'coordinate_attack' || msgType === 'intel';

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-700">
      <div className="text-sm text-zinc-400">Send a diplomatic message</div>
      <div>
        <label className="text-xs text-zinc-500">To:</label>
        <select value={toFamily} onChange={(e) => setToFamily(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
          {otherFamilies.map((f) => <option key={f} value={f}>{families[f]?.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-zinc-500">Message:</label>
        <select value={msgType} onChange={(e) => setMsgType(e.target.value as DiplomacyType)} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
          {(Object.keys(DIPLOMACY_LABELS) as DiplomacyType[]).map((t) => (
            <option key={t} value={t}>{DIPLOMACY_LABELS[t]}</option>
          ))}
        </select>
      </div>
      {needsTarget && (
        <div>
          <label className="text-xs text-zinc-500">About family:</label>
          <select value={targetFamily} onChange={(e) => setTargetFamily(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700">
            {otherFamilies.filter(f => f !== toFamily).map((f) => <option key={f} value={f}>{families[f]?.name}</option>)}
          </select>
        </div>
      )}
      <button
        onClick={async () => {
          await performAction('message', { toFamily, messageType: msgType, ...(needsTarget ? { targetFamily } : {}) });
          setSelectedAction(null);
        }}
        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm font-bold"
      >
        Send Message
      </button>
    </div>
  );
}
