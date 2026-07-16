import type { PlayerGameView } from '@shared/types';
import { PLAYER_COLOR_HEX } from '../ui';

interface Props {
  game: PlayerGameView;
  onReplaceWithBot: (playerId: string) => void;
}

export default function PlayersBar({ game, onReplaceWithBot }: Props) {
  return (
    <div className="scrollbar-slim flex gap-2 overflow-x-auto px-3 py-2">
      {game.players.map((p, i) => {
        const isCurrent = game.phase === 'playing' && i === game.currentPlayerIndex;
        const isYou = p.id === game.you.id;
        return (
          <div
            key={p.id}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-3 py-1.5 ${
              isCurrent
                ? 'pulse-turn border-brass-400 bg-ink-800'
                : 'border-ink-700 bg-ink-900'
            }`}
          >
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-black/50"
              style={{ background: PLAYER_COLOR_HEX[p.color] }}
            />
            <div className="leading-tight">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span className="max-w-28 truncate">
                  {p.name}
                  {isYou && <span className="font-normal text-parchment-200/50"> (you)</span>}
                </span>
                {(p.isBot || p.botControlled) && <span title="Bot">🤖</span>}
                {!p.isBot && !p.connected && !p.botControlled && (
                  <button
                    className="rounded bg-rail-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rail-500 transition hover:bg-rail-500 hover:text-white"
                    title="This player disconnected — let a bot play for them"
                    onClick={() => onReplaceWithBot(p.id)}
                  >
                    offline · bot?
                  </button>
                )}
              </div>
              <div className="flex gap-2.5 text-[11px] text-parchment-200/60">
                <span title="Score">★ {p.routePoints}</span>
                <span title="Trains left">🚃 {p.trains}</span>
                <span title="Cards in hand">🂠 {p.handCount}</span>
                <span title="Destination tickets">🎫 {p.ticketCount}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
