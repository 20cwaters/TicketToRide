import type { PlayerGameView, TrainCard } from '@shared/types';
import { CARD_ORDER } from '../ui';
import { DeckTile, TrainCardTile } from './cards';

interface Props {
  game: PlayerGameView;
  canAct: boolean;
  onDrawDeck: () => void;
  onDrawFaceUp: (index: number) => void;
  onDrawTickets: () => void;
}

export default function CardArea({
  game,
  canAct,
  onDrawDeck,
  onDrawFaceUp,
  onDrawTickets,
}: Props) {
  const midDraw = game.cardsDrawnThisTurn === 1;

  const counts = new Map<TrainCard, number>();
  for (const card of game.you.hand) {
    counts.set(card, (counts.get(card) ?? 0) + 1);
  }

  return (
    <div className="space-y-3">
      <section className="panel p-3">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-parchment-200/60">
            Table
          </h2>
          {canAct && (
            <span className="text-xs font-semibold text-brass-400">
              {midDraw ? 'Draw 1 more card' : 'Draw 2 cards, claim a route, or take tickets'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-start gap-x-2 gap-y-3 pt-1.5">
          {game.faceUp.map((card, i) => (
            <TrainCardTile
              key={`${i}-${card}`}
              card={card}
              onClick={() => onDrawFaceUp(i)}
              disabled={!canAct || (midDraw && card === 'locomotive')}
            />
          ))}
          <div className="mx-1 hidden w-px self-stretch bg-ink-700 sm:block" />
          <DeckTile
            label="Draw"
            count={game.trainDeckCount + game.discardCount}
            onClick={onDrawDeck}
            disabled={!canAct}
          />
          <DeckTile
            label="Tickets"
            count={game.ticketDeckCount}
            onClick={onDrawTickets}
            disabled={!canAct || midDraw}
          />
        </div>
      </section>

      <section className="panel p-3">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-parchment-200/60">
          Your hand · {game.you.hand.length} cards
        </h2>
        {game.you.hand.length === 0 ? (
          <p className="text-sm text-parchment-200/40">No train cards yet.</p>
        ) : (
          <div className="flex flex-wrap gap-x-2 gap-y-3 pt-1.5">
            {CARD_ORDER.filter((c) => counts.has(c)).map((card) => (
              <TrainCardTile key={card} card={card} count={counts.get(card)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
