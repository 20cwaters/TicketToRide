import { CITIES, ROUTES } from './mapData';
import { getPaymentOptions, optionToCards } from './payment';
import { isTicketCompleted } from './scoring';
import { isRouteAvailable } from './engine';
import type {
  Action,
  DestinationTicket,
  GameState,
  Player,
  Route,
  TrainCard,
} from './types';

/**
 * Heuristic bot: keeps affordable tickets, builds shortest paths toward
 * incomplete destinations, claims routes when it can pay, and draws the
 * most useful cards otherwise. Every returned action is legal for the
 * given state (with `pass` as the final fallback).
 */
export function decideBotAction(state: GameState, playerId: string): Action {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return { type: 'pass' };

  const pending = state.pendingTickets[playerId];
  if (pending) {
    return {
      type: 'chooseTickets',
      keepIndices: chooseTicketIndices(state, player, pending.tickets, pending.minKeep),
    };
  }

  if (state.phase !== 'playing') return { type: 'pass' };

  // Mid-turn: already drew one card, must draw the second.
  if (state.cardsDrawnThisTurn === 1) {
    return pickDrawAction(state, player, neededRoutes(state, player), true);
  }

  const needed = neededRoutes(state, player);
  const lastRound = state.finalTurnsRemaining !== null;

  // 1. Claim a route on the path to an incomplete ticket if affordable.
  const claim = pickClaim(state, player, needed);
  if (claim) return claim;

  // 2. In the last round, or with a bloated hand, grab points anywhere.
  if (lastRound || player.hand.length >= 14 || needed.length === 0) {
    const opportunistic = pickClaim(state, player, availableRoutes(state, player));
    if (opportunistic) {
      // Outside the last round, only claim opportunistically when it's
      // a decent route — don't burn cards on 1-length filler early.
      const route = routeById(opportunistic.routeId);
      if (lastRound || player.hand.length >= 14 || (route && route.length >= 2)) {
        return opportunistic;
      }
    }
  }

  // 3. All tickets done and plenty of trains left: go get more tickets.
  if (
    !lastRound &&
    needed.length === 0 &&
    player.trains >= 15 &&
    state.ticketDeck.length > 0 &&
    state.cardsDrawnThisTurn === 0
  ) {
    return { type: 'drawTickets' };
  }

  // 4. Draw train cards.
  const draw = pickDrawAction(state, player, needed, false);
  if (draw) return draw;

  // 5. Nothing to draw — claim anything at all, otherwise pass
  // (pass is legal exactly when nothing is drawable or claimable).
  const anyClaim = pickClaim(state, player, availableRoutes(state, player));
  if (anyClaim) return anyClaim;
  return { type: 'pass' };
}

function routeById(id: string): Route | undefined {
  return ROUTES.find((r) => r.id === id);
}

/* ------------------------------ ticket choice ------------------------------ */

function chooseTicketIndices(
  state: GameState,
  player: Player,
  offer: DestinationTicket[],
  minKeep: number,
): number[] {
  const evaluated = offer.map((ticket, index) => ({
    index,
    ticket,
    completed: isTicketCompleted(player.claimedRoutes, ticket.from, ticket.to),
    cost: pathCost(state, player, ticket.from, ticket.to),
  }));

  // Already-completed tickets are free points; feasible cheap ones are good.
  const keep = new Set<number>();
  for (const e of evaluated) {
    if (e.completed) keep.add(e.index);
  }
  const feasible = evaluated
    .filter((e) => !e.completed && e.cost !== null && e.cost <= player.trains - 2)
    .sort((a, b) => a.cost! - b.cost!);

  for (const e of feasible) {
    if (keep.size >= minKeep && e.cost! > 8) break;
    keep.add(e.index);
  }

  // Must keep at least minKeep — pad with the cheapest remaining offers.
  if (keep.size < minKeep) {
    const rest = evaluated
      .filter((e) => !keep.has(e.index))
      .sort((a, b) => (a.cost ?? 999) - (b.cost ?? 999));
    for (const e of rest) {
      if (keep.size >= minKeep) break;
      keep.add(e.index);
    }
  }
  return [...keep];
}

/* ------------------------------- pathfinding ------------------------------- */

interface PathResult {
  cost: number;
  routes: Route[]; // unclaimed routes still needed
}

/** Dijkstra over cities: own routes cost 0, claimable routes cost length. */
function findPath(
  state: GameState,
  player: Player,
  from: string,
  to: string,
): PathResult | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, { city: string; route: Route }>();
  const visited = new Set<string>();
  for (const c of CITIES) dist.set(c.id, Infinity);
  dist.set(from, 0);

  while (true) {
    let bestCity: string | null = null;
    let bestDist = Infinity;
    for (const [city, d] of dist) {
      if (!visited.has(city) && d < bestDist) {
        bestCity = city;
        bestDist = d;
      }
    }
    if (bestCity === null || bestDist === Infinity) break;
    if (bestCity === to) break;
    visited.add(bestCity);

    for (const route of ROUTES) {
      let other: string | null = null;
      if (route.from === bestCity) other = route.to;
      else if (route.to === bestCity) other = route.from;
      if (!other || visited.has(other)) continue;

      const mine = player.claimedRoutes.includes(route.id);
      if (!mine && !isRouteAvailable(state, player, route).ok) continue;

      const cost = mine ? 0 : route.length;
      const nd = bestDist + cost;
      if (nd < (dist.get(other) ?? Infinity)) {
        dist.set(other, nd);
        prev.set(other, { city: bestCity, route });
      }
    }
  }

  const total = dist.get(to);
  if (total === undefined || total === Infinity) return null;

  const routes: Route[] = [];
  let cursor = to;
  while (cursor !== from) {
    const step = prev.get(cursor);
    if (!step) break;
    if (!player.claimedRoutes.includes(step.route.id)) routes.push(step.route);
    cursor = step.city;
  }
  return { cost: total, routes };
}

function pathCost(
  state: GameState,
  player: Player,
  from: string,
  to: string,
): number | null {
  return findPath(state, player, from, to)?.cost ?? null;
}

/** Unclaimed routes on the shortest paths toward all incomplete tickets. */
function neededRoutes(state: GameState, player: Player): Route[] {
  const needed = new Map<string, Route>();
  for (const ticket of player.tickets) {
    if (isTicketCompleted(player.claimedRoutes, ticket.from, ticket.to)) continue;
    const path = findPath(state, player, ticket.from, ticket.to);
    if (!path || path.cost > player.trains) continue;
    for (const route of path.routes) needed.set(route.id, route);
  }
  return [...needed.values()];
}

function availableRoutes(state: GameState, player: Player): Route[] {
  return ROUTES.filter((r) => isRouteAvailable(state, player, r).ok);
}

/* --------------------------------- claiming -------------------------------- */

function pickClaim(
  state: GameState,
  player: Player,
  candidates: Route[],
): Extract<Action, { type: 'claimRoute' }> | null {
  let best: { route: Route; cards: TrainCard[]; locos: number } | null = null;
  for (const route of candidates) {
    if (!isRouteAvailable(state, player, route).ok) continue;
    const options = getPaymentOptions(player.hand, route);
    if (options.length === 0) continue;
    const option = options[0]; // fewest locomotives spent
    const better =
      !best ||
      route.length > best.route.length ||
      (route.length === best.route.length && option.locoCount < best.locos);
    if (better) {
      best = { route, cards: optionToCards(option), locos: option.locoCount };
    }
  }
  if (!best) return null;
  return { type: 'claimRoute', routeId: best.route.id, cards: best.cards };
}

/* --------------------------------- drawing --------------------------------- */

function pickDrawAction(
  state: GameState,
  player: Player,
  needed: Route[],
  isSecondDraw: boolean,
): Action {
  // Score each face-up card by how much it helps needed routes.
  const wantedColors = new Map<string, number>();
  for (const route of needed) {
    if (route.color === 'gray') continue;
    const have = player.hand.filter((c) => c === route.color).length;
    const deficit = route.length - have;
    if (deficit > 0) {
      wantedColors.set(route.color, (wantedColors.get(route.color) ?? 0) + deficit);
    }
  }

  let bestIndex = -1;
  let bestScore = 0;
  state.faceUp.forEach((card, index) => {
    let score = 0;
    if (card === 'locomotive') {
      // Only takeable as the whole turn; worth it when we need flexibility.
      if (!isSecondDraw && state.cardsDrawnThisTurn === 0) {
        score = needed.length > 0 ? 1.6 : 0.9;
      }
    } else {
      if (wantedColors.has(card)) score = 2;
      else {
        const held = player.hand.filter((c) => c === card).length;
        score = held >= 2 ? 0.8 : 0.4; // build toward gray routes
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  const deckAvailable = state.trainDeck.length > 0 || state.discard.length > 0;

  if (bestIndex >= 0 && bestScore >= 1) {
    return { type: 'drawFaceUp', index: bestIndex };
  }
  if (deckAvailable) {
    return { type: 'drawTrainDeck' };
  }
  if (state.faceUp.length > 0) {
    // Deck is gone — take the least-bad face-up card (respect the loco rule).
    const idx = state.faceUp.findIndex(
      (c) => c !== 'locomotive' || state.cardsDrawnThisTurn === 0,
    );
    if (idx >= 0) return { type: 'drawFaceUp', index: idx };
  }
  return { type: 'pass' };
}
