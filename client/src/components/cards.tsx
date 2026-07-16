import type { TrainCard } from '@shared/types';
import { CARD_LABEL } from '../ui';

export function TrainCardTile({
  card,
  count,
  onClick,
  disabled,
  size = 'md',
}: {
  card: TrainCard;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const dims = size === 'md' ? 'h-16 w-12' : 'h-12 w-9';
  const interactive = onClick && !disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      title={CARD_LABEL[card]}
      className={`card-${card} relative ${dims} shrink-0 rounded-lg border border-black/40 shadow-card transition ${
        interactive
          ? 'cursor-pointer hover:-translate-y-1 hover:ring-2 hover:ring-brass-400'
          : onClick
            ? 'opacity-45'
            : ''
      }`}
    >
      <span className="absolute inset-x-1 top-1 h-1.5 rounded-full bg-white/25" />
      <span
        className={`absolute inset-x-0 bottom-1 text-center text-[15px] ${
          card === 'white' || card === 'yellow' ? 'text-black/60' : 'text-white/85'
        }`}
      >
        🚃
      </span>
      {count !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/50 bg-parchment-50 px-1 text-xs font-bold text-ink-950 shadow">
          {count}
        </span>
      )}
    </button>
  );
}

export function DeckTile({
  label,
  count,
  onClick,
  disabled,
}: {
  label: string;
  count: number;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const interactive = onClick && !disabled && count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`relative h-16 w-12 shrink-0 rounded-lg border border-ink-600 bg-ink-700 shadow-card transition ${
        interactive
          ? 'cursor-pointer hover:-translate-y-1 hover:ring-2 hover:ring-brass-400'
          : onClick
            ? 'opacity-45'
            : ''
      }`}
    >
      <span className="absolute inset-1 rounded-md border border-dashed border-parchment-200/30" />
      <span className="absolute inset-x-0 top-2.5 text-center text-lg">🚂</span>
      <span className="absolute inset-x-0 bottom-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-parchment-200/80">
        {label}
      </span>
      <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-black/50 bg-parchment-50 px-1 text-xs font-bold text-ink-950 shadow">
        {count}
      </span>
    </button>
  );
}
