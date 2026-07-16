import { useState } from 'react';
import { cityName } from '@shared/mapData';
import type { PendingTickets } from '@shared/types';
import { TICKET_PREVIEW_COLORS } from '../ui';

interface Props {
  pending: PendingTickets;
  onChoose: (keepIndices: number[]) => Promise<boolean>;
}

export default function TicketChoiceModal({ pending, onChoose }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const toggle = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const valid = selected.size >= pending.minKeep;

  // Minimized: let the player pan and zoom the map (the offered tickets stay
  // visible as numbered dashed arcs) with a floating pill to come back.
  if (minimized) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
        <button
          className="btn-brass pointer-events-auto shadow-card"
          onClick={() => setMinimized(false)}
        >
          🎫 Back to ticket choice
          {selected.size > 0 && ` (${selected.size} selected)`}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4">
      <div className="panel w-full max-w-md rounded-b-none p-5 sm:rounded-xl">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Destination tickets</h2>
          <button
            className="btn-secondary -mt-1 px-3 py-1.5 text-xs"
            onClick={() => setMinimized(true)}
          >
            🗺 Look at the map
          </button>
        </div>
        <p className="mb-4 text-sm text-parchment-200/60">
          Keep at least {pending.minKeep}. Completed tickets score their points;
          unfinished ones count against you. Each offer is drawn on the map as a
          numbered dashed line.
        </p>

        <div className="mb-5 space-y-2">
          {pending.tickets.map((ticket, i) => {
            const on = selected.has(i);
            const color = TICKET_PREVIEW_COLORS[i % TICKET_PREVIEW_COLORS.length];
            return (
              <button
                key={ticket.id}
                onClick={() => toggle(i)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-3 text-left text-sm font-medium transition ${
                  on
                    ? 'border-brass-400 bg-brass-500/15'
                    : 'border-ink-600 bg-ink-800 hover:border-ink-500'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                      on
                        ? 'border-brass-400 bg-brass-500 text-ink-950'
                        : 'border-ink-500'
                    }`}
                  >
                    {on ? '✓' : ''}
                  </span>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: color }}
                    title="Matches the numbered line on the map"
                  >
                    {i + 1}
                  </span>
                  {cityName(ticket.from)} → {cityName(ticket.to)}
                </span>
                <span className="shrink-0 font-bold text-brass-400">{ticket.points}</span>
              </button>
            );
          })}
        </div>

        <button
          className="btn-primary w-full"
          disabled={!valid || busy}
          onClick={async () => {
            setBusy(true);
            const ok = await onChoose([...selected]);
            if (!ok) setBusy(false);
          }}
        >
          {valid
            ? `Keep ${selected.size} ticket${selected.size === 1 ? '' : 's'}`
            : `Select at least ${pending.minKeep}`}
        </button>
      </div>
    </div>
  );
}
