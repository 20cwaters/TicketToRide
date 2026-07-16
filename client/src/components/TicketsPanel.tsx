import type { PlayerGameView } from '@shared/types';
import { cityName } from '@shared/mapData';

interface Props {
  game: PlayerGameView;
}

export default function TicketsPanel({ game }: Props) {
  const tickets = game.you.tickets;
  return (
    <section className="panel p-3">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-parchment-200/60">
        Your destination tickets
      </h2>
      {tickets.length === 0 ? (
        <p className="text-sm text-parchment-200/40">No tickets.</p>
      ) : (
        <ul className="space-y-1.5">
          {tickets.map(({ ticket, completed }) => (
            <li
              key={ticket.id}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                completed
                  ? 'border-green-700/60 bg-green-900/20'
                  : 'border-ink-700 bg-ink-800'
              }`}
            >
              <span className="font-medium">
                {cityName(ticket.from)} → {cityName(ticket.to)}
              </span>
              <span
                className={`shrink-0 font-bold ${
                  completed ? 'text-green-400' : 'text-parchment-200/60'
                }`}
              >
                {completed ? `✓ ${ticket.points}` : ticket.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
