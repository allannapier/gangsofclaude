// Custom filled SVG icons — moody 60s gangster New York aesthetic (no-stroke silhouettes)

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

// Brass knuckles — replaces 💪 muscle
export function MuscleIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M6 9c0-1.7 1.3-3 3-3h.6c.8 0 1.4.6 1.4 1.4V9h2V7.4c0-.8.6-1.4 1.4-1.4H15c1.7 0 3 1.3 3 3v1h.8c1.2 0 2.2 1 2.2 2.2V14c0 4.4-3.6 8-8 8H10c-4.4 0-8-3.6-8-8v-1.8C2 11 3 10 4.2 10H6V9zm2 1h8V9c0-.6-.4-1-1-1h-.2v1.6c0 .8-.6 1.4-1.4 1.4H9.6c-.8 0-1.4-.6-1.4-1.4V8H9c-.6 0-1 .4-1 1v1z" />
      <path d="M7.6 8.2a1.2 1.2 0 112.4 0 1.2 1.2 0 01-2.4 0zm3.4 0a1.2 1.2 0 112.4 0 1.2 1.2 0 01-2.4 0zm3.4 0a1.2 1.2 0 112.4 0 1.2 1.2 0 01-2.4 0z" opacity="0.35" />
    </svg>
  );
}

// Fedora — replaces ⭐ level
export function LevelIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M6 12l2-6h8l2 6-6 2-6-2z" />
      <path d="M2 14c0-1.1 1-2 2.2-2H20c1.2 0 2 .9 2 2s-1 2-2.2 2H4.2C3 16 2 15.1 2 14z" />
      <path d="M9 8h6l1 3-4 1.2L8 11l1-3z" opacity="0.35" />
    </svg>
  );
}

// Folded street map — replaces 🗺️ map tab (simplified for small sizes)
export function MapIcon({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M9 3l6 2 6-2v18l-6 2-6-2-6 2V5l6-2zm0 2L5 6.3V20l4-1.4V5zm2 .2v13.6l4 1.4V6.6L11 5.2zm6 1.4v13.7l4-1.4V5.2l-4 1.4z" />
      <path d="M12 9a2.5 2.5 0 012.5 2.5c0 1.9-2.5 5-2.5 5s-2.5-3.1-2.5-5A2.5 2.5 0 0112 9z" opacity="0.35" />
    </svg>
  );
}

// Tommy gun (drum mag) — replaces ⚔️ actions tab & attack
export function ActionIcon({ size = 18, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M2 10h12l2-2h6v6h-6l-2-2H9v2h3v2H9v4l-2 2v-6H2a1 1 0 01-1-1v-5a1 1 0 011-1z" />
      <path d="M12 14a3 3 0 016 0v1h-6v-1z" opacity="0.35" />
      <path d="M19 8h2v7h-2V8z" opacity="0.35" />
    </svg>
  );
}

// Brownstone building — replaces 🏠 territory count
export function TurfIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M3 21V8l9-5 9 5v13H3zm4-2h2v-3H7v3zm4 0h2v-3h-2v3zm4 0h2v-3h-2v3zm-8-5h2v-2H7v2zm4 0h2v-2h-2v2zm4 0h2v-2h-2v2z" />
    </svg>
  );
}

// Stacked cash + arrow — replaces ⬆️ upgrade
export function UpgradeIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M3 9h12a2 2 0 012 2v6a2 2 0 01-2 2H3V9zm2 2v6h10v-6H5z" />
      <path d="M7 13a3 3 0 116 0 3 3 0 01-6 0z" opacity="0.35" />
      <path d="M18 5h3v6h-2V8.4l-2.3 2.3-1.4-1.4L17.6 7H18V5z" />
    </svg>
  );
}

// Moving truck — replaces 🔄 move
export function MoveIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M3 7h11v10H3V7zm12 3h4l2 3v4h-6V10z" />
      <path d="M7 19a2 2 0 110-4 2 2 0 010 4zm12 0a2 2 0 110-4 2 2 0 010 4z" />
      <path d="M16 12v3h3.5l-1.2-2H16z" opacity="0.35" />
    </svg>
  );
}

// Telegram note — replaces 💬 message
export function MessageIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M6 2h10l4 4v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
      <path d="M16 2v4h4" opacity="0.35" />
      <path d="M7 10h10v2H7v-2zm0 4h10v2H7v-2z" opacity="0.35" />
      <path d="M9 7h6v2H9V7z" opacity="0.55" />
    </svg>
  );
}

// Flag claim — replaces 🏴
export function ClaimIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M5 2v20H3V2h2zm2 1v10l12-2V5L7 3z" />
    </svg>
  );
}

// Stacked cards — replaces "New" icon
export function NewGameIcon({ size = 14, className = '', color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} aria-hidden="true">
      <path d="M7 5h12a2 2 0 012 2v12a2 2 0 01-2 2H7V5z" opacity="0.35" />
      <path d="M5 3h12a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path d="M8 7h6v2H8V7z" opacity="0.55" />
    </svg>
  );
}
