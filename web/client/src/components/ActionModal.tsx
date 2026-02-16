import { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import type { SkillCommand } from '../types';
import {
  X,
  Swords,
  UserPlus,
  Eye,
  Scroll,
  MessageSquare,
  MapPin,
  Crown,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

export type EntityType = 'family' | 'territory' | 'character' | 'history' | 'task';

export interface ActionOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface ActionInput {
  type: 'none' | 'text' | 'select' | 'number' | 'textarea';
  label: string;
  placeholder?: string;
  options?: ActionOption[];
  min?: number;
  max?: number;
  required?: boolean;
  defaultValue?: string | number;
}

export interface AvailableAction {
  id: string;
  skill: SkillCommand;
  label: string;
  description: string;
  icon?: React.ReactNode;
  input?: ActionInput;
  disabled?: boolean;
  disabledReason?: string;
}

export interface EntityData {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  details?: Record<string, string | number>;
  avatar?: React.ReactNode;
  color?: string;
}

export interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityData: EntityData;
  availableActions: AvailableAction[];
}

const defaultIcons: Record<string, React.ReactNode> = {
  attack: <Swords className="w-5 h-5" />,
  recruit: <UserPlus className="w-5 h-5" />,
  intel: <Eye className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  expand: <MapPin className="w-5 h-5" />,
  claim: <MapPin className="w-5 h-5" />,
  'seek-patronage': <Crown className="w-5 h-5" />,
  status: <Info className="w-5 h-5" />,
  promote: <Scroll className="w-5 h-5" />,
  default: <CheckCircle className="w-5 h-5" />,
};

export function ActionModal({
  isOpen,
  onClose,
  entityType,
  entityData,
  availableActions,
}: ActionModalProps) {
  const { executeSkill } = useGameStore();
  const [selectedAction, setSelectedAction] = useState<AvailableAction | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [numberValue, setNumberValue] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedAction(null);
      setInputValue('');
      setNumberValue(0);
      setIsExecuting(false);
      setError(null);
    }
  }, [isOpen]);

  // Set default values when action is selected
  useEffect(() => {
    if (selectedAction?.input?.defaultValue) {
      if (typeof selectedAction.input.defaultValue === 'number') {
        setNumberValue(selectedAction.input.defaultValue);
      } else {
        setInputValue(selectedAction.input.defaultValue);
      }
    }
  }, [selectedAction]);

  if (!isOpen) return null;

  const handleActionSelect = (action: AvailableAction) => {
    if (action.disabled) return;
    setSelectedAction(action);
    setError(null);

    // Auto-execute if no input required
    if (!action.input || action.input.type === 'none') {
      handleExecute(action);
    }
  };

  const handleExecute = async (action: AvailableAction) => {
    setIsExecuting(true);
    setError(null);

    try {
      // Build args based on input type
      const args: Record<string, any> = {};

      switch (entityType) {
        case 'character':
          args.target = entityData.id;
          args.recipient = entityData.id;
          break;
        case 'family':
          args.family = entityData.id;
          break;
        case 'territory':
          args.territory = entityData.id;
          break;
      }

      // Add input value based on action type
      if (action.input) {
        switch (action.input.type) {
          case 'text':
          case 'textarea':
          case 'select':
            if (action.input.required && !inputValue.trim()) {
              setError(`${action.input.label} is required`);
              setIsExecuting(false);
              return;
            }
            // For message skill, use 'content' as the key
            if (action.skill === 'message') {
              args.content = inputValue;
            } else {
              args[action.id] = inputValue;
            }
            break;
          case 'number':
            if (action.input.required && (numberValue === 0 || isNaN(numberValue))) {
              setError(`${action.input.label} is required`);
              setIsExecuting(false);
              return;
            }
            args.amount = numberValue;
            break;
        }
      }

      // Execute the skill
      executeSkill(action.skill, args);

      // Close modal after execution
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute action');
      setIsExecuting(false);
    }
  };

  const getEntityTypeIcon = () => {
    switch (entityType) {
      case 'family':
        return <Crown className="w-6 h-6" style={{ color: entityData.color }} />;
      case 'territory':
        return <MapPin className="w-6 h-6 text-amber-400" />;
      case 'character':
        return entityData.avatar || <UserPlus className="w-6 h-6 text-blue-400" />;
      case 'history':
        return <Scroll className="w-6 h-6 text-purple-400" />;
      case 'task':
        return <CheckCircle className="w-6 h-5 text-green-400" />;
      default:
        return <Info className="w-6 h-6 text-zinc-400" />;
    }
  };

  const getEntityTypeLabel = () => {
    switch (entityType) {
      case 'family':
        return 'Family';
      case 'territory':
        return 'Territory';
      case 'character':
        return 'Character';
      case 'history':
        return 'Event';
      case 'task':
        return 'Task';
      default:
        return 'Entity';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Entity Info */}
        <div className="px-6 py-5 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center bg-zinc-800 border border-zinc-700"
                style={entityData.color ? { borderColor: entityData.color } : undefined}
              >
                {getEntityTypeIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {getEntityTypeLabel()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-zinc-100">{entityData.name}</h2>
                {entityData.subtitle && (
                  <p className="text-sm text-zinc-400">{entityData.subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Entity Description */}
          {entityData.description && (
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              {entityData.description}
            </p>
          )}

          {/* Entity Details */}
          {entityData.details && Object.keys(entityData.details).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.entries(entityData.details).map(([key, value]) => (
                <div
                  key={key}
                  className="px-3 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <span className="text-xs text-zinc-500 uppercase">{key}</span>
                  <span className="ml-2 text-sm font-medium text-zinc-300">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Selection or Input Form */}
        <div className="flex-1 overflow-auto p-6">
          {!selectedAction ? (
            // Action Selection Grid
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Available Actions</h3>
              {availableActions.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No actions available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {availableActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleActionSelect(action)}
                      disabled={action.disabled || isExecuting}
                      className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                        action.disabled
                          ? 'bg-zinc-800/30 border-zinc-800 opacity-50 cursor-not-allowed'
                          : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          action.disabled
                            ? 'bg-zinc-800 text-zinc-600'
                            : 'bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        {action.icon || defaultIcons[action.skill] || defaultIcons.default}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-200">{action.label}</span>
                          {action.disabled && action.disabledReason && (
                            <span className="text-xs text-amber-500">({action.disabledReason})</span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500 truncate">{action.description}</p>
                      </div>
                      {!action.disabled && (
                        <ChevronRight className="w-5 h-5 text-zinc-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Input Form for Selected Action
            <div className="space-y-4">
              <button
                onClick={() => {
                  setSelectedAction(null);
                  setInputValue('');
                  setNumberValue(0);
                  setError(null);
                }}
                className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to actions
              </button>

              <div className="flex items-center gap-3 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
                <div className="w-10 h-10 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-300">
                  {selectedAction.icon ||
                    defaultIcons[selectedAction.skill] ||
                    defaultIcons.default}
                </div>
                <div>
                  <h3 className="font-medium text-zinc-200">{selectedAction.label}</h3>
                  <p className="text-sm text-zinc-500">{selectedAction.description}</p>
                </div>
              </div>

              {/* Input Fields */}
              {selectedAction.input && selectedAction.input.type !== 'none' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-zinc-300">
                    {selectedAction.input.label}
                    {selectedAction.input.required && (
                      <span className="text-red-400 ml-1">*</span>
                    )}
                  </label>

                  {selectedAction.input.type === 'text' && (
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={selectedAction.input.placeholder}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                      disabled={isExecuting}
                    />
                  )}

                  {selectedAction.input.type === 'textarea' && (
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={selectedAction.input.placeholder}
                      rows={4}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                      disabled={isExecuting}
                    />
                  )}

                  {selectedAction.input.type === 'number' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={numberValue}
                        onChange={(e) => setNumberValue(parseInt(e.target.value) || 0)}
                        min={selectedAction.input.min}
                        max={selectedAction.input.max}
                        className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                        disabled={isExecuting}
                      />
                      {selectedAction.input.max && (
                        <span className="text-sm text-zinc-500">
                          Max: {selectedAction.input.max}
                        </span>
                      )}
                    </div>
                  )}

                  {selectedAction.input.type === 'select' && selectedAction.input.options && (
                    <div className="grid grid-cols-1 gap-2">
                      {selectedAction.input.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setInputValue(option.value)}
                          disabled={option.disabled || isExecuting}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            inputValue === option.value
                              ? 'bg-blue-900/20 border-blue-700'
                              : option.disabled
                              ? 'bg-zinc-800/30 border-zinc-800 opacity-50 cursor-not-allowed'
                              : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-medium ${
                                inputValue === option.value ? 'text-blue-300' : 'text-zinc-300'
                              }`}
                            >
                              {option.label}
                            </span>
                            {inputValue === option.value && (
                              <CheckCircle className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          {option.description && (
                            <p className="text-sm text-zinc-500 mt-1">{option.description}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedAction && selectedAction.input?.type !== 'none' && (
          <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
            <button
              onClick={() => {
                setSelectedAction(null);
                setInputValue('');
                setNumberValue(0);
                setError(null);
              }}
              disabled={isExecuting}
              className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleExecute(selectedAction)}
              disabled={isExecuting}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                'Execute'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Chevron icons as components
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default ActionModal;
