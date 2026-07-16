import { cityName } from '@shared/mapData';
import type { PlayerGameView } from '@shared/types';
import { PLAYER_COLOR_HEX } from '../ui';

interface Props {
  game: PlayerGameView;
  isHost: boolean;
  onBackToLobby: () => void;
  onLeave: () => void;
}

export default function GameOverModal({ game, isHost, onBackToLobby, onLeave }: Props) {
  const results = game.results;
  if (!results) return null;

  const nameOf = (id: string) => game.players.find((p) => p.id === id)?.name ?? '?';
  const colorOf = (id: string) =>
    PLAYER_COLOR_HEX[game.players.find((p) => p.id === id)?.color ?? 'black'];
  const winners = results.winnerIds.map(nameOf).join(' & ');

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/80 p-4">
      <div className="panel mx-auto my-6 w-full max-w-2xl p-6">
        <div className="mb-6 text-center">
          <div className="text-4xl">🏆</div>
          <h2 className="font-display mt-1 text-2xl font-bold text-brass-400">
            {winners} win{results.winnerIds.length === 1 ? 's' : ''}!
          </h2>
        </div>

        <div className="scrollbar-slim overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-ink-600 text-left text-xs uppercase tracking-wider text-parchment-200/50">
                <th className="pb-2 pr-3">Player</th>
                <th className="pb-2 pr-3 text-right">Routes</th>
                <th className="pb-2 pr-3 text-right">Tickets</th>
                <th className="pb-2 pr-3 text-right" title="Longest continuous path">
                  Longest
                </th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {results.players.map((r) => (
                <tr key={r.playerId} className="border-b border-ink-800">
                  <td className="py-2.5 pr-3">
                    <span className="flex items-center gap-2 font-semibold">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-black/40"
                        style={{ background: colorOf(r.playerId) }}
                      />
                      {nameOf(r.playerId)}
                      {results.winnerIds.includes(r.playerId) && ' 🏆'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right">{r.routePoints}</td>
                  <td
                    className={`py-2.5 pr-3 text-right font-medium ${
                      r.ticketPoints >= 0 ? 'text-green-400' : 'text-rail-500'
                    }`}
                  >
                    {r.ticketPoints >= 0 ? '+' : ''}
                    {r.ticketPoints}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    {r.longestPathBonus > 0 ? (
                      <span className="font-medium text-brass-400">
                        +10 ({r.longestPathLength})
                      </span>
                    ) : (
                      <span className="text-parchment-200/50">{r.longestPathLength}</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-base font-bold">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-parchment-200/60 hover:text-parchment-50">
            Ticket details
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {results.players.map((r) => (
              <div key={r.playerId} className="rounded-lg border border-ink-700 p-3">
                <p className="mb-2 text-sm font-bold">{nameOf(r.playerId)}</p>
                <ul className="space-y-1 text-xs">
                  {r.tickets.length === 0 && (
                    <li className="text-parchment-200/40">No tickets</li>
                  )}
                  {r.tickets.map((t) => (
                    <li
                      key={t.ticket.id}
                      className="flex justify-between gap-2 text-parchment-200/80"
                    >
                      <span>
                        {cityName(t.ticket.from)} → {cityName(t.ticket.to)}
                      </span>
                      <span
                        className={
                          t.completed
                            ? 'font-semibold text-green-400'
                            : 'font-semibold text-rail-500'
                        }
                      >
                        {t.completed ? `+${t.ticket.points}` : `−${t.ticket.points}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {isHost && (
            <button className="btn-primary flex-1" onClick={onBackToLobby}>
              Back to lobby
            </button>
          )}
          <button className="btn-secondary flex-1" onClick={onLeave}>
            Leave game
          </button>
        </div>
      </div>
    </div>
  );
}
