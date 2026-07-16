import { useMemo } from 'react';
import { ROUTE_BY_ID, cityName } from '@shared/mapData';
import { getPaymentOptions, optionToCards } from '@shared/payment';
import { ROUTE_POINTS } from '@shared/types';
import type { PlayerGameView, TrainCard } from '@shared/types';
import { CARD_LABEL, ROUTE_COLOR_HEX } from '../ui';

interface Props {
  routeId: string;
  game: PlayerGameView;
  canAct: boolean;
  onClaim: (routeId: string, cards: TrainCard[]) => void;
  onClose: () => void;
}

export default function ClaimDialog({ routeId, game, canAct, onClaim, onClose }: Props) {
  const route = ROUTE_BY_ID[routeId];

  const owner = useMemo(
    () => game.players.find((p) => p.claimedRoutes.includes(routeId)) ?? null,
    [game.players, routeId],
  );

  const me = game.players.find((p) => p.id === game.you.id);
  const options = useMemo(
    () => (route ? getPaymentOptions(game.you.hand, route) : []),
    [game.you.hand, route],
  );

  if (!route) return null;

  // Double-route availability (mirrors server rules for friendlier messaging).
  let blockedReason: string | null = null;
  if (owner) {
    blockedReason = `Claimed by ${owner.name}`;
  } else if (route.pairId) {
    const sibling = Object.values(ROUTE_BY_ID).find(
      (r) => r.pairId === route.pairId && r.id !== route.id,
    );
    const siblingOwner =
      sibling && game.players.find((p) => p.claimedRoutes.includes(sibling.id));
    if (siblingOwner) {
      if (game.players.length <= 3) {
        blockedReason = 'Second track closed in 2–3 player games';
      } else if (siblingOwner.id === game.you.id) {
        blockedReason = 'You already own the parallel track';
      }
    }
  }
  if (!blockedReason && me && me.trains < route.length) {
    blockedReason = `You only have ${me.trains} trains left`;
  }

  const points = ROUTE_POINTS[route.length];
  const claimable = canAct && !blockedReason && options.length > 0;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-md rounded-b-none p-5 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">
            {cityName(route.from)} — {cityName(route.to)}
          </h2>
          <button
            className="rounded p-1 text-parchment-200/50 hover:text-parchment-50"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-parchment-200/70">
          <span
            className="inline-block h-3 w-8 rounded-sm border border-black/40"
            style={{ background: ROUTE_COLOR_HEX[route.color] }}
          />
          <span className="capitalize">
            {route.color === 'gray' ? 'any color' : route.color}
          </span>
          <span>· {route.length} 🚃</span>
          <span>
            · worth <strong className="text-brass-400">{points} pts</strong>
          </span>
        </div>

        {blockedReason ? (
          <p className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-parchment-200/70">
            {blockedReason}
          </p>
        ) : !canAct ? (
          <p className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-parchment-200/70">
            {game.cardsDrawnThisTurn === 1
              ? 'Finish drawing your second card first.'
              : 'You can claim this route on your turn.'}
          </p>
        ) : options.length === 0 ? (
          <p className="rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5 text-sm text-parchment-200/70">
            You don't have the cards for this route yet — you need {route.length}{' '}
            {route.color === 'gray' ? 'matching' : route.color} cards (locomotives are
            wild).
          </p>
        ) : (
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-parchment-200/60">
              Pay with
            </p>
            <div className="space-y-2">
              {options.slice(0, 5).map((opt, i) => (
                <button
                  key={i}
                  className="flex w-full items-center justify-between rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5 text-sm font-medium transition hover:border-brass-400 hover:bg-ink-700"
                  onClick={() => onClaim(route.id, optionToCards(opt))}
                >
                  <span className="flex items-center gap-2">
                    {opt.colorCount > 0 && (
                      <>
                        <span
                          className="inline-block h-4 w-4 rounded-sm border border-black/40"
                          style={{ background: ROUTE_COLOR_HEX[opt.color] }}
                        />
                        {opt.colorCount}× {CARD_LABEL[opt.color]}
                      </>
                    )}
                    {opt.colorCount > 0 && opt.locoCount > 0 && ' + '}
                    {opt.locoCount > 0 && <span>{opt.locoCount}× 🚂 Locomotive</span>}
                  </span>
                  <span className="text-brass-400">Claim →</span>
                </button>
              ))}
            </div>
          </>
        )}

        {!claimable && (
          <button className="btn-secondary mt-4 w-full" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}
