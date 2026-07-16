import { ROUTE_BY_ID, cityName } from '@shared/mapData';
import type { GameEvent, PlayerGameView } from '@shared/types';
import { CARD_LABEL } from '../ui';

function describe(event: GameEvent, nameOf: (id: string) => string): string | null {
  switch (event.type) {
    case 'drewFromDeck':
      return `${nameOf(event.player)} drew from the deck`;
    case 'drewFaceUp':
      return `${nameOf(event.player)} took a ${CARD_LABEL[event.card]}`;
    case 'claimedRoute': {
      const route = ROUTE_BY_ID[event.routeId];
      const where = route ? `${cityName(route.from)}–${cityName(route.to)}` : '?';
      return `${nameOf(event.player)} claimed ${where} (+${event.points})`;
    }
    case 'drewTickets':
      return `${nameOf(event.player)} drew destination tickets`;
    case 'keptTickets':
      return `${nameOf(event.player)} kept ${event.kept} ticket${event.kept === 1 ? '' : 's'}`;
    case 'passed':
      return `${nameOf(event.player)} passed`;
    case 'lastRound':
      return `⚠️ ${nameOf(event.player)} is almost out of trains — final round!`;
    case 'gameOver':
      return '🏁 Game over';
    default:
      return null;
  }
}

export default function LogFeed({ game }: { game: PlayerGameView }) {
  const nameOf = (id: string) =>
    game.players.find((p) => p.id === id)?.name ?? 'Someone';
  const lines = game.log
    .map((e) => describe(e, nameOf))
    .filter((line): line is string => line !== null)
    .slice(-8)
    .reverse();

  return (
    <section className="panel p-3">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-parchment-200/60">
        Recent moves
      </h2>
      {lines.length === 0 ? (
        <p className="text-sm text-parchment-200/40">Nothing yet.</p>
      ) : (
        <ul className="space-y-1 text-xs leading-relaxed text-parchment-200/70">
          {lines.map((line, i) => (
            <li key={i} className={i === 0 ? 'font-medium text-parchment-50' : ''}>
              {line}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
