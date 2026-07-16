import { useState } from 'react';
import { ROUTES, cityName } from '@shared/mapData';
import { getPaymentOptions } from '@shared/payment';
import type { PlayerGameView, Route } from '@shared/types';

interface Props {
  game: PlayerGameView;
  onFinish: () => void;
}

/** Best route the player could claim right now, judged from their view. */
function findAffordableRoute(game: PlayerGameView): Route | null {
  const me = game.players.find((p) => p.id === game.you.id);
  if (!me) return null;
  const owners = new Map<string, string>();
  for (const p of game.players) {
    for (const id of p.claimedRoutes) owners.set(id, p.id);
  }
  let best: Route | null = null;
  for (const route of ROUTES) {
    if (owners.has(route.id)) continue;
    if (me.trains < route.length) continue;
    if (route.pairId) {
      const sibling = ROUTES.find(
        (r) => r.pairId === route.pairId && r.id !== route.id,
      );
      if (sibling && owners.has(sibling.id)) {
        if (game.players.length <= 3) continue;
        if (owners.get(sibling.id) === me.id) continue;
      }
    }
    if (getPaymentOptions(game.you.hand, route).length === 0) continue;
    if (!best || route.length > best.length) best = route;
  }
  return best;
}

interface Step {
  id: string;
  placement: 'top' | 'bottom';
  ready: (game: PlayerGameView, isMyTurn: boolean) => boolean;
  title: string;
  body: (game: PlayerGameView) => string;
}

const STEPS: Step[] = [
  {
    id: 'tickets',
    placement: 'top',
    ready: (game) => !!game.you.pendingTickets,
    title: '🎫 Your destination tickets',
    body: () =>
      'Each ticket names two cities and a point value. Connect them with your own routes by the end of the game to score it — fail and you LOSE those points. The numbered dashed lines on the map show each offer (tap "Look at the map"). Keep tickets whose cities look easy to link up.',
  },
  {
    id: 'actions',
    placement: 'bottom',
    ready: (game, isMyTurn) =>
      game.phase === 'playing' && isMyTurn && game.cardsDrawnThisTurn === 0,
    title: '🚂 Your turn — pick ONE action',
    body: () =>
      'Every turn you do exactly one thing: (1) draw 2 train cards, (2) claim a route with cards from your hand, or (3) draw more tickets. Early on, collect cards — tap a face-up card or the Draw pile in the Table panel.',
  },
  {
    id: 'second-draw',
    placement: 'bottom',
    ready: (game, isMyTurn) => isMyTurn && game.cardsDrawnThisTurn === 1,
    title: 'One more card',
    body: () =>
      'Card draws come in pairs — take your second card now. One rule: a face-up 🚂 locomotive can\'t be your second pick. Locomotives are wild (they count as any color), so grabbing one face-up costs your whole turn.',
  },
  {
    id: 'claim',
    placement: 'bottom',
    ready: (game, isMyTurn) =>
      isMyTurn && game.cardsDrawnThisTurn === 0 && findAffordableRoute(game) !== null,
    title: '🚃 You can claim a route!',
    body: (game) => {
      const route = findAffordableRoute(game);
      if (!route) return 'Tap any route on the map to see what it costs.';
      const colorText = route.color === 'gray' ? 'any one color' : route.color;
      return `You have the cards for ${cityName(route.from)}–${cityName(route.to)} (${route.length} × ${colorText}). Tap that route on the map and choose how to pay. Routes that link your red-ringed ticket cities are the priority — but grabbing a route an opponent needs is fair play too.`;
    },
  },
  {
    id: 'wrap-up',
    placement: 'bottom',
    ready: (game) =>
      (game.players.find((p) => p.id === game.you.id)?.claimedRoutes.length ?? 0) > 0,
    title: '🎉 You know the essentials',
    body: () =>
      'Tickets check off automatically when your routes connect their cities (watch for the ✓). Every route spends trains — when anyone drops to 2 or fewer, everybody gets one last turn. Longest unbroken path earns +10. The Rules button in the header has everything else. Good luck!',
  },
];

export default function TutorialCoach({ game, onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState(0);

  const current = game.players[game.currentPlayerIndex];
  const isMyTurn = game.phase === 'playing' && current?.id === game.you.id;

  if (game.phase === 'finished') return null;
  const step = STEPS[stepIndex];
  if (!step) return null;
  if (!step.ready(game, isMyTurn)) return null;

  const advance = () => {
    if (stepIndex + 1 >= STEPS.length) onFinish();
    else setStepIndex(stepIndex + 1);
  };

  return (
    <div
      className={`fixed inset-x-3 z-[45] sm:right-auto sm:max-w-sm ${
        step.placement === 'top' ? 'top-14 sm:left-3' : 'bottom-3 sm:left-3'
      }`}
    >
      <div className="rounded-xl border-2 border-brass-500 bg-ink-900 p-4 shadow-card">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-brass-400">{step.title}</h3>
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-parchment-200/40">
            Tutorial {stepIndex + 1}/{STEPS.length}
          </span>
        </div>
        <p className="mb-3 text-[13px] leading-relaxed text-parchment-200/85">
          {step.body(game)}
        </p>
        <div className="flex items-center justify-between">
          <button
            className="text-xs text-parchment-200/40 transition hover:text-rail-500"
            onClick={onFinish}
          >
            Skip tutorial
          </button>
          <button className="btn-brass px-3.5 py-1.5 text-xs" onClick={advance}>
            {stepIndex + 1 >= STEPS.length ? 'Finish' : 'Got it →'}
          </button>
        </div>
      </div>
    </div>
  );
}
