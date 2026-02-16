/**
 * Action Button Component
 *
 * A styled button for contextual actions with consistent theming.
 */

import type { ActionDefinition } from '../types/actions';

interface ActionButtonProps {
  action: ActionDefinition;
  onClick: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const colorClasses: Record<string, { bg: string; border: string; text: string; hover: string }> = {
  blue: { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-300', hover: 'hover:bg-blue-900/50' },
  red: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-300', hover: 'hover:bg-red-900/50' },
  green: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-300', hover: 'hover:bg-green-900/50' },
  purple: { bg: 'bg-purple-900/30', border: 'border-purple-700', text: 'text-purple-300', hover: 'hover:bg-purple-900/50' },
  amber: { bg: 'bg-amber-900/30', border: 'border-amber-700', text: 'text-amber-300', hover: 'hover:bg-amber-900/50' },
  gray: { bg: 'bg-zinc-800', border: 'border-zinc-600', text: 'text-zinc-300', hover: 'hover:bg-zinc-700' },
  cyan: { bg: 'bg-cyan-900/30', border: 'border-cyan-700', text: 'text-cyan-300', hover: 'hover:bg-cyan-900/50' },
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

export function ActionButton({
  action,
  onClick,
  disabled = false,
  size = 'md',
  fullWidth = false,
}: ActionButtonProps) {
  const colors = colorClasses[action.style.color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${colors.bg}
        ${colors.border}
        ${colors.text}
        ${colors.hover}
        border rounded-lg
        flex items-center gap-2
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={action.description}
    >
      <span>{action.style.icon}</span>
      <span className="font-medium">{action.name}</span>
    </button>
  );
}

/**
 * Compact action button for inline use
 */
export function ActionButtonCompact({
  action,
  onClick,
  disabled = false,
}: Omit<ActionButtonProps, 'size'>) {
  const colors = colorClasses[action.style.color];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2
        ${colors.bg}
        ${colors.border}
        ${colors.text}
        ${colors.hover}
        border rounded-lg
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={`${action.name}: ${action.description}`}
    >
      <span className="text-lg">{action.style.icon}</span>
    </button>
  );
}
