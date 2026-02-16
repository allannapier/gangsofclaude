/**
 * Contextual Action Modal
 *
 * A unified modal for all contextual actions across the game.
 * Supports action selection, input collection, validation, and execution.
 */

import { useEffect } from 'react';
import { useActionState } from '../hooks/useActionState';
import type { ActionDefinition, ActionTarget, ActionContextType } from '../types/actions';
import { useGameStore } from '../store';
import { getCharacterById } from '../data/families';

interface ContextualActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ActionContextType | null;
  target: ActionTarget | null;
  actions: ActionDefinition[];
  onActionComplete?: (actionId: string, target: ActionTarget | null) => void;
}

// Color mapping for action styles
const colorClasses: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  blue: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-300', hover: 'hover:bg-blue-900/50' },
  red: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-300', hover: 'hover:bg-red-900/50' },
  green: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-300', hover: 'hover:bg-green-900/50' },
  purple: { bg: 'bg-purple-900/30', border: 'border-purple-700', text: 'text-purple-300', hover: 'hover:bg-purple-900/50' },
  amber: { bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-300', hover: 'hover:bg-amber-900/50' },
  gray: { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-zinc-300', hover: 'hover:bg-zinc-700' },
  cyan: { bg: 'bg-cyan-900/30', border: 'border-cyan-700', text: 'text-cyan-300', hover: 'hover:bg-cyan-900/50' },
};

export function ContextualActionModal({
  isOpen,
  onClose,
  context,
  target,
  actions,
  onActionComplete,
}: ContextualActionModalProps) {
  const {
    modalState,
    flowState,
    openActionModal,
    selectAction,
    updateInput,
    executeAction,
    goBack,
    canExecute,
    validationErrors,
  } = useActionState();

  const { player, completeTask } = useGameStore();

  // Sync modal state with props - open the modal when isOpen becomes true
  useEffect(() => {
    if (isOpen && context && target) {
      openActionModal(context, target, actions);
    }
  }, [isOpen, context, target, actions, openActionModal]);

  if (!isOpen || !context || !target) return null;

  // Handle task completion
  const handleExecute = async () => {
    await executeAction();

    // If this is a task action, complete the task
    if (context === 'task' && target?.metadata?.task) {
      completeTask(target.metadata.task.id);
    }

    // Call the callback if provided
    if (onActionComplete && modalState.selectedAction) {
      onActionComplete(modalState.selectedAction.id, target);
    }

    // Close modal after successful execution
    setTimeout(() => {
      onClose();
    }, 500);

    // Explicitly return undefined
    return;
  };

  const selectedAction = modalState.selectedAction;
  const colors = selectedAction ? colorClasses[selectedAction.style.color] : null;

  // Get context title
  const getContextTitle = () => {
    switch (context) {
      case 'family':
        return `Actions: ${target.name}`;
      case 'territory':
        return `Actions: ${target.name}`;
      case 'character': {
        const char = getCharacterById(target.id);
        return char ? `Actions: ${char.fullName}` : `Actions: ${target.name}`;
      }
      case 'history':
        return 'Event Response';
      case 'task':
        return 'Task Actions';
      default:
        return 'Actions';
    }
  };

  // Filter actions based on conditions
  const availableActions = actions.filter(action => {
    if (!action.conditions) return true;
    return action.conditions.every(condition => {
      const rankOrder = ['Outsider', 'Associate', 'Soldier', 'Capo', 'Underboss', 'Don'];
      const playerRankIndex = rankOrder.indexOf(player.rank);

      switch (condition.type) {
        case 'rank': {
          const requiredRankIndex = rankOrder.indexOf(condition.value as string);
          switch (condition.operator) {
            case 'eq': return player.rank === condition.value;
            case 'ne': return player.rank !== condition.value;
            case 'gte': return playerRankIndex >= requiredRankIndex;
            default: return true;
          }
        }
        case 'family':
          return condition.operator === 'ne'
            ? player.family !== 'None'
            : player.family === condition.value;
        case 'wealth': {
          switch (condition.operator) {
            case 'gte': return player.wealth >= (condition.value as number);
            case 'gt': return player.wealth > (condition.value as number);
            default: return true;
          }
        }
        default:
          return true;
      }
    });
  });

  if (!isOpen || !context || !target) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {flowState !== 'selecting' && selectedAction && (
              <button
                onClick={goBack}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ←
              </button>
            )}
            <h3 className="text-lg font-semibold text-zinc-100">{getContextTitle()}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Action Selection */}
          {flowState === 'selecting' && (
            <div className="p-4">
              <p className="text-sm text-zinc-400 mb-4">Choose an action:</p>
              <div className="grid grid-cols-2 gap-2">
                {availableActions.map(action => {
                  const actionColors = colorClasses[action.style.color];
                  return (
                    <button
                      key={action.id}
                      onClick={() => selectAction(action)}
                      className={`p-3 rounded-lg border text-left transition-all ${actionColors.bg} ${actionColors.border} ${actionColors.hover}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{action.style.icon}</span>
                        <span className={`font-medium ${actionColors.text}`}>{action.name}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{action.description}</p>
                    </button>
                  );
                })}
              </div>

              {availableActions.length === 0 && (
                <div className="text-center py-8 text-zinc-500">
                  <p>No actions available.</p>
                  <p className="text-sm mt-2">
                    {player.wealth <= 0
                      ? '💰 You need more wealth first — try recruiting or doing jobs.'
                      : `Rank: ${player.rank} | Wealth: $${player.wealth}`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Input Collection */}
          {(flowState === 'input' || flowState === 'confirming') && selectedAction && (
            <div className="p-4 space-y-4">
              {/* Action Header */}
              <div className={`p-3 rounded-lg border ${colors?.bg} ${colors?.border}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedAction.style.icon}</span>
                  <div>
                    <p className={`font-medium ${colors?.text}`}>{selectedAction.name}</p>
                    <p className="text-xs text-zinc-400">{selectedAction.description}</p>
                  </div>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.general && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-300">{validationErrors.general}</p>
                </div>
              )}

              {/* Input Fields */}
              {selectedAction.inputs?.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>

                  {/* Text Input */}
                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={modalState.inputValues[field.name] || ''}
                      onChange={e => updateInput(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      className={`w-full px-3 py-2 bg-zinc-800 border rounded-md text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 ${
                        validationErrors[field.name] ? 'border-red-600' : 'border-zinc-700'
                      }`}
                    />
                  )}

                  {/* Textarea */}
                  {field.type === 'textarea' && (
                    <textarea
                      value={modalState.inputValues[field.name] || ''}
                      onChange={e => updateInput(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className={`w-full px-3 py-2 bg-zinc-800 border rounded-md text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:border-blue-500 ${
                        validationErrors[field.name] ? 'border-red-600' : 'border-zinc-700'
                      }`}
                    />
                  )}

                  {/* Select */}
                  {field.type === 'select' && field.options && (
                    <div className="space-y-2">
                      {field.options.map(option => (
                        <button
                          key={option.value}
                          onClick={() => updateInput(field.name, option.value)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            modalState.inputValues[field.name] === option.value
                              ? `${colors?.bg} ${colors?.border}`
                              : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${
                              modalState.inputValues[field.name] === option.value
                                ? colors?.text
                                : 'text-zinc-300'
                            }`}>
                              {option.label}
                            </span>
                            {modalState.inputValues[field.name] === option.value && (
                              <span className={colors?.text}>✓</span>
                            )}
                          </div>
                          {option.description && (
                            <p className="text-xs text-zinc-500 mt-1">{option.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Confirm */}
                  {field.type === 'confirm' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateInput(field.name, true)}
                        className={`flex-1 p-3 rounded-lg border transition-all ${
                          modalState.inputValues[field.name] === true
                            ? 'bg-red-900/30 border-red-700 text-red-300'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        Yes, proceed
                      </button>
                      <button
                        onClick={() => updateInput(field.name, false)}
                        className={`flex-1 p-3 rounded-lg border transition-all ${
                          modalState.inputValues[field.name] === false
                            ? 'bg-zinc-700 border-zinc-500 text-zinc-200'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Validation Error */}
                  {validationErrors[field.name] && (
                    <p className="text-xs text-red-400 mt-1">{validationErrors[field.name]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Executing */}
          {flowState === 'executing' && (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-zinc-300">Executing action...</p>
            </div>
          )}

          {/* Success */}
          {flowState === 'success' && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-green-400">✓</span>
              </div>
              <p className="text-green-400 font-medium">Action completed</p>
            </div>
          )}

          {/* Error */}
          {flowState === 'error' && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-red-400">✕</span>
              </div>
              <p className="text-red-400 font-medium">Action failed</p>
              <p className="text-sm text-zinc-500 mt-2">{modalState.error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(flowState === 'input' || flowState === 'confirming') && selectedAction && (
          <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={!canExecute}
              className={`px-4 py-2 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                colors
                  ? `${colors.bg} ${colors.text} ${colors.hover} border ${colors.border}`
                  : 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70 border border-blue-700'
              }`}
            >
              Execute
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
