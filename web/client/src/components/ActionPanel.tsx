import { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { FAMILY_COLORS, DIPLOMACY_LABELS, BUSINESS_DEFINITIONS, COVERT_OP_DEFINITIONS, type DiplomacyType, type BusinessType, type Territory, type CovertOpType, type SaveState } from '../types';
import { ActionIcon, MuscleIcon, UpgradeIcon, MoveIcon, MessageIcon, NewGameIcon } from './Icons';

const TOKEN_KEY = 'gangs-of-claude-token';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };
}

function ActionToast({ result, onDismiss }: { result: { success: boolean; message: string }; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide in
    requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 4s
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-16 right-4 z-50 max-w-sm transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-sm ${
        result.success
          ? 'bg-green-950/90 border-green-700 text-green-200'
          : 'bg-red-950/90 border-red-700 text-red-200'
      }`}>
        <span className="text-lg mt-0.5">{result.success ? '✅' : '❌'}</span>
        <p className="flex-1 text-sm">{result.message}</p>
        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
          className="text-zinc-400 hover:text-white text-lg leading-none"
        >×</button>
      </div>
    </div>
  );
}

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

      {/* Floating Action Result Toast */}
      {actionResult && <ActionToast result={actionResult} onDismiss={dismissActionResult} />}

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
      {selectedAction === 'covert' && <CovertOpsForm playerFamily={playerFamily} families={state.families} myTerritories={myTerritories} enemyTerritories={enemyTerritories} />}

      {/* Covert Ops Section */}
      <div className="border-t border-zinc-800 pt-3 mt-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wide">🕵️ Covert Ops <span className="text-zinc-600">(free action)</span></span>
        </div>
        <button
          onClick={() => setSelectedAction(selectedAction === 'covert' ? null : 'covert')}
          disabled={state.playerCovertUsed}
          className={`px-3 py-1 rounded text-sm border transition-colors ${
            state.playerCovertUsed
              ? 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed'
              : selectedAction === 'covert'
              ? 'bg-zinc-700 border-zinc-500 text-white'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
          }`}
        >
          {state.playerCovertUsed ? '✅ Covert op used' : '🕵️ Launch Operation'}
        </button>
      </div>

      {/* Compact status indicators — inline badges to save space */}
      <StatusIndicators state={state} />
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
  // Store as strings to prevent controlled input fighting with DOM during re-renders
  const [muscleInputs, setMuscleInputs] = useState<Record<string, string>>({});

  const parsedAmounts: Record<string, number> = {};
  for (const t of myTerritories) {
    const raw = muscleInputs[t.id];
    if (raw === undefined || raw === '') { parsedAmounts[t.id] = 0; continue; }
    parsedAmounts[t.id] = Math.min(parseInt(raw, 10) || 0, t.muscle);
  }
  const totalSending = Object.values(parsedAmounts).reduce((s, v) => s + v, 0);

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
            value={muscleInputs[t.id] ?? ''}
            placeholder="0"
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, '');
              setMuscleInputs({ ...muscleInputs, [t.id]: raw });
            }}
            onBlur={() => {
              const val = parseInt(muscleInputs[t.id] || '0', 10);
              const clamped = Math.min(Math.max(0, val || 0), t.muscle);
              setMuscleInputs({ ...muscleInputs, [t.id]: clamped > 0 ? String(clamped) : '' });
            }}
            className="w-16 bg-zinc-800 rounded px-2 py-1 text-sm border border-zinc-700 text-center"
          />
        </div>
      ))}
      <div className="text-sm text-zinc-300 inline-flex items-center gap-1">Total attacking: <MuscleIcon size={14} /> {totalSending}</div>
      <button
        onClick={async () => {
          const musclePerTerritory: Record<string, number> = {};
          for (const [tid, val] of Object.entries(parsedAmounts)) {
            if (val > 0) musclePerTerritory[tid] = val;
          }
          await performAction('attack', { targetTerritoryId: targetId, musclePerTerritory, fromTerritoryIds: Object.keys(musclePerTerritory) });
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

function CovertOpsForm({ playerFamily, families, myTerritories, enemyTerritories }: { playerFamily: string; families: Record<string, any>; myTerritories: Territory[]; enemyTerritories: Territory[] }) {
  const { setSelectedAction, state } = useGameStore();
  const [opType, setOpType] = useState<CovertOpType>('spy');
  const [target, setTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const opDef = COVERT_OP_DEFINITIONS[opType];
  const playerWealth = state.families[playerFamily]?.wealth || 0;
  const canAfford = playerWealth >= opDef.cost;

  const otherFamilies = Object.keys(families).filter(f => f !== playerFamily && state.territories.some(t => t.owner === f));
  const otherTerritories = state.territories.filter(t => t.owner && t.owner !== playerFamily);

  // Set default target based on op type
  const needsFamilyTarget = opType === 'spy';
  const needsEnemyTerritory = opType === 'sabotage' || opType === 'bribe';
  const needsOwnTerritory = opType === 'fortify';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const API_BASE = `http://${window.location.hostname}:3456`;
      // Resolve target: use state value or fall back to first valid option (select may not fire onChange for default)
      const resolvedTarget = target
        || (needsFamilyTarget ? otherFamilies[0] : '')
        || (needsEnemyTerritory ? otherTerritories[0]?.id : '')
        || (needsOwnTerritory ? myTerritories[0]?.id : '')
        || '';
      const res = await fetch(`${API_BASE}/api/covert`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ type: opType, target: resolvedTarget }),
      });
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.reload();
        return;
      }
      const data = await res.json();
      useGameStore.setState({
        actionResult: { success: data.success, message: data.message || data.error || 'Operation complete' },
      });
      setSelectedAction(null);
    } catch (e) {
      useGameStore.setState({ actionResult: { success: false, message: `Network error: ${e}` } });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-700">
      <div className="text-sm text-zinc-400">Launch a covert operation (free, once per turn)</div>
      
      <div>
        <label className="text-xs text-zinc-500 block mb-1">Operation</label>
        <select
          value={opType}
          onChange={(e) => { setOpType(e.target.value as CovertOpType); setTarget(''); }}
          className="w-full bg-zinc-800 rounded px-2 py-1.5 text-sm border border-zinc-700"
        >
          {(Object.keys(COVERT_OP_DEFINITIONS) as CovertOpType[]).map(op => {
            const def = COVERT_OP_DEFINITIONS[op];
            return <option key={op} value={op}>{def.icon} {def.name} (${def.cost})</option>;
          })}
        </select>
      </div>

      <div className="text-xs text-zinc-500 p-2 bg-zinc-800/50 rounded">{opDef.description}</div>

      {needsFamilyTarget && (
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Target Family</label>
          <select value={target || otherFamilies[0] || ''} onChange={(e) => setTarget(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1.5 text-sm border border-zinc-700">
            {otherFamilies.map(f => <option key={f} value={f}>{families[f]?.name}</option>)}
          </select>
        </div>
      )}

      {needsEnemyTerritory && (
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Target Territory</label>
          <select value={target || otherTerritories[0]?.id || ''} onChange={(e) => setTarget(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1.5 text-sm border border-zinc-700">
            {otherTerritories.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({families[t.owner!]?.name}) — M{t.muscle} • {BUSINESS_DEFINITIONS[t.business]?.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {needsOwnTerritory && (
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Your Territory</label>
          <select value={target || myTerritories[0]?.id || ''} onChange={(e) => setTarget(e.target.value)} className="w-full bg-zinc-800 rounded px-2 py-1.5 text-sm border border-zinc-700">
            {myTerritories.map(t => <option key={t.id} value={t.id}>{t.name} (M{t.muscle})</option>)}
          </select>
        </div>
      )}

      {!canAfford && <div className="text-xs text-red-400">Not enough wealth (need ${opDef.cost}, have ${playerWealth})</div>}

      <button
        onClick={handleSubmit}
        disabled={!canAfford || isSubmitting}
        className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded text-sm font-bold"
      >
        {isSubmitting ? 'Executing...' : `${opDef.icon} ${opDef.name} ($${opDef.cost})`}
      </button>
    </div>
  );
}

function DiplomacyProposal({ message, messageIndex }: { message: any; messageIndex: number }) {
  const store = useGameStore();
  const { state } = store;
  const [responding, setResponding] = useState(false);

  const fromFamily = state.families[message.from];
  if (!fromFamily) {
    return null;
  }

  const familyColor = FAMILY_COLORS[message.from] || '#888';

  const handleResponse = async (response: 'accept' | 'reject') => {
    setResponding(true);
    try {
      const API_BASE = `http://${window.location.hostname}:3456`;
      const res = await fetch(`${API_BASE}/api/diplomacy-respond`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ messageIndex, response }),
      });

      if (!res.ok) {
        const text = await res.text();
        if (res.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          window.location.reload();
          return;
        }
        useGameStore.setState({ actionResult: { success: false, message: text || `Server error: ${res.status}` } });
        setResponding(false);
        return;
      }

      const data = await res.json();

      if (!data.success) {
        useGameStore.setState({ actionResult: { success: false, message: data.error || 'Failed to respond' } });
        setResponding(false);
      } else {
        useGameStore.setState({ actionResult: { success: true, message: data.message } });
      }
    } catch (e) {
      const err = e as Error;
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

function StatusIndicators({ state }: { state: SaveState }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const activeEffects = state.activeEffects || [];
  const activeIntel = (state.intel || []).filter(i => i.expiresTurn > state.turn);
  const activeForts = (state.fortifications || []).filter(f => f.expiresTurn > state.turn);

  const hasContent = activeEffects.length > 0 || activeIntel.length > 0 || activeForts.length > 0;
  if (!hasContent) return null;

  const toggle = (key: string) => setExpanded(expanded === key ? null : key);

  return (
    <div className="border-t border-zinc-800 pt-2 mt-1 flex flex-wrap gap-1.5">
      {activeEffects.length > 0 && (
        <div className="w-full">
          <button onClick={() => toggle('effects')} className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
            📰 Effects ({activeEffects.length}) <span className="text-zinc-600">{expanded === 'effects' ? '▾' : '▸'}</span>
          </button>
          {expanded === 'effects' && (
            <div className="mt-1 space-y-1">
              {activeEffects.map((effect) => (
                <div key={effect.id} className="text-xs text-amber-300 bg-amber-900/20 border border-amber-800/30 rounded px-2 py-1">
                  {effect.description} <span className="text-amber-600">({effect.turnsRemaining}t left)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeIntel.length > 0 && (
        <div className="w-full">
          <button onClick={() => toggle('intel')} className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            🕵️ Intel ({activeIntel.length}) <span className="text-zinc-600">{expanded === 'intel' ? '▾' : '▸'}</span>
          </button>
          {expanded === 'intel' && (
            <div className="mt-1 space-y-1">
              {activeIntel.map((report, idx) => (
                <div key={idx} className="text-xs bg-cyan-900/20 border border-cyan-800/30 rounded p-2">
                  <div className="font-bold text-cyan-300">
                    {state.families[report.targetFamily]?.name} — ${report.wealth}
                    <span className="text-cyan-600 ml-1">(T{report.expiresTurn})</span>
                  </div>
                  {report.territories.map(t => (
                    <div key={t.id} className="text-cyan-400/80 ml-2">
                      {t.name}: M{t.muscle} • {BUSINESS_DEFINITIONS[t.business]?.name || t.business}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {activeForts.length > 0 && (
        <div className="w-full">
          <button onClick={() => toggle('forts')} className="text-xs font-bold text-green-400 hover:text-green-300 flex items-center gap-1">
            🔒 Fortifications ({activeForts.length}) <span className="text-zinc-600">{expanded === 'forts' ? '▾' : '▸'}</span>
          </button>
          {expanded === 'forts' && (
            <div className="mt-1 space-y-1">
              {activeForts.map((fort, idx) => {
                const terr = state.territories.find(t => t.id === fort.territoryId);
                return (
                  <div key={idx} className="text-xs text-green-300 bg-green-900/20 border border-green-800/30 rounded px-2 py-1">
                    {terr?.name || fort.territoryId}: +{fort.bonusDefense} def <span className="text-green-600">(T{fort.expiresTurn})</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
