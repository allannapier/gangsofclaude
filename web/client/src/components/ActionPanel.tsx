import { useState } from 'react';
import { useGameStore } from '../store';
import { FAMILY_COLORS, DIPLOMACY_LABELS, BUSINESS_DEFINITIONS, type DiplomacyType, type BusinessType, type Territory } from '../types';
import { ActionIcon, MuscleIcon, UpgradeIcon, MoveIcon, MessageIcon, NewGameIcon } from './Icons';

export function ActionPanel() {
  const { state, nextTurn, performAction, isProcessingTurn, actionResult, dismissActionResult, selectedAction, setSelectedAction, resetGame } = useGameStore();
  const playerFamily = state.playerFamily!;
  const myTerritories = state.territories.filter((t) => t.owner === playerFamily);
  const enemyTerritories = state.territories.filter((t) => t.owner !== playerFamily);
  
  // Get pending diplomacy proposals sent TO the player
  const pendingProposals = state.diplomacy
    .map((msg, index) => ({ msg, index }))
    .filter(({ msg }) => 
      msg.to === playerFamily && 
      msg.status === 'pending' &&
      (msg.type === 'partnership' || msg.type === 'coordinate_attack')
    );

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
        {['hire', 'attack', 'business', 'move'].map((a) => (
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
                business: <span className="inline-flex items-center gap-1"><UpgradeIcon size={14} /> Business</span>,
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

      {/* Pending Diplomacy Proposals */}
      {pendingProposals.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wide">Pending Proposals</div>
          {pendingProposals.map(({ msg, index }) => (
            <DiplomacyProposal key={index} message={msg} messageIndex={index} />
          ))}
        </div>
      )}

      {/* Action Forms */}
      {selectedAction === 'hire' && <HireForm myTerritories={myTerritories} />}
      {selectedAction === 'attack' && <AttackForm myTerritories={myTerritories} enemyTerritories={enemyTerritories} />}
      {selectedAction === 'business' && <BusinessForm myTerritories={myTerritories} />}
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

function BusinessForm({ myTerritories }: { myTerritories: Territory[] }) {
  const { performAction, setSelectedAction, selectedTerritoryId, state } = useGameStore();
  
  // Find territories with available upgrades
  const upgradeOptions: Array<{ territory: Territory; businesses: BusinessType[] }> = [];
  for (const t of myTerritories) {
    const affordable: BusinessType[] = [];
    for (const biz of ['protection', 'numbers', 'speakeasy', 'brothel', 'casino', 'smuggling'] as BusinessType[]) {
      const bizDef = BUSINESS_DEFINITIONS[biz];
      // Check if this business is a valid upgrade from current AND affordable
      const isValidUpgrade = bizDef.upgradesFrom.includes(t.business);
      const isAffordable = bizDef.cost <= (state.families[state.playerFamily!]?.wealth || 0);
      if (isValidUpgrade && isAffordable) {
        affordable.push(biz);
      }
    }
    if (affordable.length > 0) {
      upgradeOptions.push({ territory: t, businesses: affordable });
    }
  }

  const initial = upgradeOptions.find(opt => opt.territory.id === selectedTerritoryId) || upgradeOptions[0];
  const [territoryId, setTerritoryId] = useState(initial?.territory.id || '');
  const [businessType, setBusinessType] = useState<BusinessType>(initial?.businesses[0] || 'protection');

  if (upgradeOptions.length === 0) {
    return <div className="text-sm text-zinc-500 p-3">No affordable business upgrades available. Earn more wealth or all territories are at max level.</div>;
  }

  const selectedOption = upgradeOptions.find(opt => opt.territory.id === territoryId);
  const currentBiz = selectedOption?.territory.business || 'none';
  const targetBiz = BUSINESS_DEFINITIONS[businessType];

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-700">
      <div className="text-sm text-zinc-400">Establish or upgrade business operations</div>
      
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Territory</label>
        <select 
          value={territoryId} 
          onChange={(e) => {
            setTerritoryId(e.target.value);
            const newOption = upgradeOptions.find(opt => opt.territory.id === e.target.value);
            if (newOption) setBusinessType(newOption.businesses[0]);
          }} 
          className="w-full bg-zinc-800 rounded px-2 py-1.5 text-sm border border-zinc-700"
        >
          {upgradeOptions.map((opt) => (
            <option key={opt.territory.id} value={opt.territory.id}>
              {opt.territory.name} ({BUSINESS_DEFINITIONS[opt.territory.business].name})
            </option>
          ))}
        </select>
      </div>

      {selectedOption && (
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Upgrade To</label>
          <select 
            value={businessType} 
            onChange={(e) => setBusinessType(e.target.value as BusinessType)} 
            className="w-full bg-zinc-800 rounded px-2 py-1.5 text-sm border border-zinc-700"
          >
            {selectedOption.businesses.map((biz) => {
              const def = BUSINESS_DEFINITIONS[biz];
              return (
                <option key={biz} value={biz}>
                  {def.name} (${def.cost}) — ${def.income}/turn
                </option>
              );
            })}
          </select>
        </div>
      )}

      <div className="text-xs text-zinc-400 p-2 bg-zinc-800/50 rounded">
        <div>Current: {BUSINESS_DEFINITIONS[currentBiz].name} (${BUSINESS_DEFINITIONS[currentBiz].income}/turn)</div>
        <div className="text-green-400">→ {targetBiz.name} (${targetBiz.income}/turn)</div>
      </div>

      <button
        onClick={async () => { 
          await performAction('business', { territoryId, businessType }); 
          setSelectedAction(null); 
        }}
        className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-sm font-bold"
      >
        Establish {targetBiz.name} (${targetBiz.cost})
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

function DiplomacyProposal({ message, messageIndex }: { message: any; messageIndex: number }) {
  const store = useGameStore();
  const { state } = store;
  const [responding, setResponding] = useState(false);
  
  console.log('[DiplomacyProposal] Rendering:', { message, messageIndex, responding });
  
  const fromFamily = state.families[message.from];
  if (!fromFamily) {
    console.error('[DiplomacyProposal] Family not found:', message.from);
    return null;
  }
  
  const familyColor = FAMILY_COLORS[message.from] || '#888';
  
  const handleResponse = async (response: 'accept' | 'reject') => {
    console.log('[DiplomacyProposal] Button clicked:', response, 'messageIndex:', messageIndex);
    setResponding(true);
    try {
      const API_BASE = `http://${window.location.hostname}:3456`;
      const url = `${API_BASE}/api/diplomacy-respond`;
      console.log('[DiplomacyProposal] Fetching:', url, { messageIndex, response });
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIndex, response }),
      });
      
      console.log('[DiplomacyProposal] Fetch completed, status:', res.status, res.ok);
      
      if (!res.ok) {
        const text = await res.text();
        console.error('[DiplomacyProposal] Server error:', res.status, text);
        useGameStore.setState({ actionResult: { success: false, message: text || `Server error: ${res.status}` } });
        setResponding(false);
        return;
      }
      
      const data = await res.json();
      console.log('[DiplomacyProposal] Response:', data);
      
      if (!data.success) {
        console.error('[DiplomacyProposal] Failed:', data.error);
        // Show error in UI
        useGameStore.setState({ actionResult: { success: false, message: data.error || 'Failed to respond' } });
        setResponding(false);
      } else {
        console.log('[DiplomacyProposal] Success:', data.message);
        // Show success in UI
        useGameStore.setState({ actionResult: { success: true, message: data.message } });
        // Let WebSocket update handle the rest - the proposal will disappear when state updates
      }
    } catch (e) {
      const err = e as Error;
      console.error('[DiplomacyProposal] Fetch exception:', e, err.message, err.stack);
      useGameStore.setState({ actionResult: { success: false, message: `Network error: ${err.message || String(e)}` } });
      setResponding(false);
    }
  };

  const proposalText = message.type === 'partnership' 
    ? `${fromFamily.name} proposes a partnership`
    : `${fromFamily.name} proposes coordinating an attack on ${state.families[message.targetFamily]?.name}`;

  return (
    <div 
      className="p-2 rounded border text-sm"
      style={{ borderColor: familyColor + '66', backgroundColor: familyColor + '10' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-bold mb-1" style={{ color: familyColor }}>
            {proposalText}
          </div>
          <div className="text-xs text-zinc-400">Turn {message.turn}</div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[DiplomacyProposal] BUTTON CLICK EVENT');
              handleResponse('accept');
            }}
            disabled={responding}
            className="px-2 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded text-xs font-bold cursor-pointer"
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            ✓ Accept
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[DiplomacyProposal] BUTTON CLICK EVENT');
              handleResponse('reject');
            }}
            disabled={responding}
            className="px-2 py-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded text-xs font-bold cursor-pointer"
            style={{ pointerEvents: 'auto', zIndex: 10 }}
          >
            ✗ Reject
          </button>
        </div>
      </div>
    </div>
  );
}
