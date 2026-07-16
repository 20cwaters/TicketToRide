import { ROUTES, ROUTE_BY_ID } from './mapData';
import { DESTINATION_TICKETS } from './tickets';
import { buildTrainDeck, drawFromDeck, refillFaceUp } from './deck';
import {
  getPaymentOptions,
  handContains,
  isValidPayment,
  removeCards,
} from './payment';
import { computeResults } from './scoring';
import {
  END_GAME_TRAIN_THRESHOLD,
  INITIAL_HAND_SIZE,
  INITIAL_TRAINS,
  PLAYER_COLORS,
  ROUTE_POINTS,
} from './types';
import type { Action, GameState, Player, Route } from './types';
import { mulberry32, type Rng } from './rng';

export class GameError extends Error {}

export interface NewPlayerInfo {
  id: string;
  name: string;
  isBot: boolean;
}

const MAX_LOG = 60;

export function createGame(playerInfos: NewPlayerInfo[], seed: number): GameState {
  if (playerInfos.length < 2 || playerInfos.length > 5) {
    throw new GameError('Ticket to Ride needs 2–5 players.');
  }
  const rng = mulberry32(seed);

  const players: Player[] = playerInfos.map((info, i) => ({
    id: info.id,
    name: info.name,
    color: PLAYER_COLORS[i],
    isBot: info.isBot,
    botControlled: false,
    connected: true,
    hand: [],
    tickets: [],
    trains: INITIAL_TRAINS,
    routePoints: 0,
    claimedRoutes: [],
  }));

  const state: GameState = {
    phase: 'ticket_selection',
    players,
    currentPlayerIndex: 0,
    trainDeck: buildTrainDeck(rng),
    faceUp: [],
    discard: [],
    ticketDeck: [...DESTINATION_TICKETS], // shuffled below
    cardsDrawnThisTurn: 0,
    pendingTickets: {},
    finalTurnsRemaining: null,
    endTriggeredBy: null,
    consecutivePasses: 0,
    turnNumber: 1,
    log: [],
    results: null,
  };

  // Shuffle tickets with the same rng for reproducibility.
  state.ticketDeck = shuffleTickets(state.ticketDeck, rng);

  for (const player of players) {
    for (let i = 0; i < INITIAL_HAND_SIZE; i++) {
      const card = drawFromDeck(state, rng);
      if (card) player.hand.push(card);
    }
  }
  refillFaceUp(state, rng);

  for (const player of players) {
    const offer = state.ticketDeck.splice(-3, 3);
    state.pendingTickets[player.id] = { tickets: offer, minKeep: 2 };
  }

  return state;
}

function shuffleTickets<T>(items: T[], rng: Rng): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getPlayer(state: GameState, playerId: string): Player {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new GameError('Unknown player.');
  return player;
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

/** Which player (if any) has claimed the given route. */
export function getRouteOwner(state: GameState, routeId: string): Player | null {
  return state.players.find((p) => p.claimedRoutes.includes(routeId)) ?? null;
}

export interface ClaimCheck {
  ok: boolean;
  reason?: string;
}

/** Route availability for a player (train supply + double-route rules; not cards). */
export function isRouteAvailable(
  state: GameState,
  player: Player,
  route: Route,
): ClaimCheck {
  if (getRouteOwner(state, route.id)) {
    return { ok: false, reason: 'Route already claimed.' };
  }
  if (player.trains < route.length) {
    return { ok: false, reason: 'Not enough trains left.' };
  }
  if (route.pairId) {
    const sibling = ROUTES.find((r) => r.pairId === route.pairId && r.id !== route.id);
    if (sibling) {
      const owner = getRouteOwner(state, sibling.id);
      if (owner) {
        if (state.players.length <= 3) {
          return {
            ok: false,
            reason: 'With 2–3 players only one track of a double route can be used.',
          };
        }
        if (owner.id === player.id) {
          return {
            ok: false,
            reason: 'You cannot claim both tracks of a double route.',
          };
        }
      }
    }
  }
  return { ok: true };
}

/** Whether the player could legally claim any route right now with their hand. */
export function canClaimAnyRoute(state: GameState, player: Player): boolean {
  return ROUTES.some(
    (route) =>
      isRouteAvailable(state, player, route).ok &&
      getPaymentOptions(player.hand, route).length > 0,
  );
}

function anyTrainCardsDrawable(state: GameState): boolean {
  return (
    state.trainDeck.length > 0 || state.discard.length > 0 || state.faceUp.length > 0
  );
}

/**
 * Apply one action for one player. Mutates and returns `state`.
 * Throws GameError on illegal actions.
 */
export function applyAction(
  state: GameState,
  playerId: string,
  action: Action,
  rng: Rng,
): GameState {
  if (state.phase === 'finished') throw new GameError('The game is over.');
  const player = getPlayer(state, playerId);

  if (action.type === 'chooseTickets') {
    chooseTickets(state, player, action.keepIndices);
    return state;
  }

  if (state.phase !== 'playing') {
    throw new GameError('The game has not started yet.');
  }
  if (currentPlayer(state).id !== playerId) {
    throw new GameError('It is not your turn.');
  }
  if (state.pendingTickets[playerId]) {
    throw new GameError('Choose which destination tickets to keep first.');
  }

  switch (action.type) {
    case 'drawTrainDeck':
      drawTrainCardFromDeck(state, player, rng);
      break;
    case 'drawFaceUp':
      drawFaceUpCard(state, player, action.index, rng);
      break;
    case 'claimRoute':
      claimRoute(state, player, action.routeId, action.cards, rng);
      break;
    case 'drawTickets':
      drawTickets(state, player);
      break;
    case 'pass':
      pass(state, player, rng);
      break;
    default:
      throw new GameError('Unknown action.');
  }
  return state;
}

function drawTrainCardFromDeck(state: GameState, player: Player, rng: Rng): void {
  const card = drawFromDeck(state, rng);
  if (card === null) {
    throw new GameError('The train card deck is empty.');
  }
  player.hand.push(card);
  state.cardsDrawnThisTurn++;
  state.consecutivePasses = 0;
  pushLog(state, { type: 'drewFromDeck', player: player.id });
  if (state.cardsDrawnThisTurn >= 2 || !anyTrainCardsDrawable(state)) {
    endTurn(state, rng);
  }
}

function drawFaceUpCard(
  state: GameState,
  player: Player,
  index: number,
  rng: Rng,
): void {
  const card = state.faceUp[index];
  if (card === undefined) throw new GameError('No card at that position.');
  if (card === 'locomotive' && state.cardsDrawnThisTurn > 0) {
    throw new GameError('A face-up locomotive can only be taken as your whole turn.');
  }
  state.faceUp.splice(index, 1);
  player.hand.push(card);
  refillFaceUp(state, rng);
  state.consecutivePasses = 0;
  pushLog(state, { type: 'drewFaceUp', player: player.id, card });

  if (card === 'locomotive') {
    endTurn(state, rng);
    return;
  }
  state.cardsDrawnThisTurn++;
  if (state.cardsDrawnThisTurn >= 2 || !anyTrainCardsDrawable(state)) {
    endTurn(state, rng);
  }
}

function claimRoute(
  state: GameState,
  player: Player,
  routeId: string,
  cards: Parameters<typeof removeCards>[1],
  rng: Rng,
): void {
  if (state.cardsDrawnThisTurn > 0) {
    throw new GameError('You already drew a card this turn — draw your second card.');
  }
  const route = ROUTE_BY_ID[routeId];
  if (!route) throw new GameError('Unknown route.');

  const availability = isRouteAvailable(state, player, route);
  if (!availability.ok) throw new GameError(availability.reason!);

  if (!isValidPayment(route, cards)) {
    throw new GameError('Those cards cannot pay for this route.');
  }
  if (!handContains(player.hand, cards)) {
    throw new GameError('You do not have those cards.');
  }

  const spent = removeCards(player.hand, cards);
  state.discard.push(...spent);
  player.trains -= route.length;
  player.claimedRoutes.push(route.id);
  const points = ROUTE_POINTS[route.length];
  player.routePoints += points;
  state.consecutivePasses = 0;
  pushLog(state, {
    type: 'claimedRoute',
    player: player.id,
    routeId: route.id,
    points,
  });
  endTurn(state, rng);
}

function drawTickets(state: GameState, player: Player): void {
  if (state.cardsDrawnThisTurn > 0) {
    throw new GameError('You already drew a train card this turn.');
  }
  if (state.ticketDeck.length === 0) {
    throw new GameError('No destination tickets left.');
  }
  const count = Math.min(3, state.ticketDeck.length);
  const offer = state.ticketDeck.splice(-count, count);
  state.pendingTickets[player.id] = { tickets: offer, minKeep: 1 };
  state.consecutivePasses = 0;
  pushLog(state, { type: 'drewTickets', player: player.id, count });
}

function chooseTickets(state: GameState, player: Player, keepIndices: number[]): void {
  const pending = state.pendingTickets[player.id];
  if (!pending) throw new GameError('You have no tickets to choose from.');

  const unique = [...new Set(keepIndices)];
  if (unique.length !== keepIndices.length) {
    throw new GameError('Duplicate ticket selection.');
  }
  if (unique.some((i) => i < 0 || i >= pending.tickets.length)) {
    throw new GameError('Invalid ticket selection.');
  }
  if (unique.length < pending.minKeep) {
    throw new GameError(`You must keep at least ${pending.minKeep} ticket(s).`);
  }

  const kept = unique.map((i) => pending.tickets[i]);
  const returned = pending.tickets.filter((_, i) => !unique.includes(i));
  player.tickets.push(...kept);
  // Returned tickets go to the bottom of the deck (front of the array).
  state.ticketDeck.unshift(...returned);
  delete state.pendingTickets[player.id];
  pushLog(state, {
    type: 'keptTickets',
    player: player.id,
    kept: kept.length,
    returned: returned.length,
  });

  if (state.phase === 'ticket_selection') {
    if (Object.keys(state.pendingTickets).length === 0) {
      state.phase = 'playing';
    }
    return;
  }
  // Mid-game ticket draw consumes the turn.
  endTurnAfterTickets(state);
}

function pass(state: GameState, player: Player, rng: Rng): void {
  if (anyTrainCardsDrawable(state) || canClaimAnyRoute(state, player)) {
    throw new GameError('You still have a legal move — you cannot pass.');
  }
  state.consecutivePasses++;
  pushLog(state, { type: 'passed', player: player.id });
  if (state.consecutivePasses >= state.players.length) {
    finishGame(state);
    return;
  }
  endTurn(state, rng);
}

function endTurn(state: GameState, _rng: Rng): void {
  if (state.phase === 'finished') return;
  state.cardsDrawnThisTurn = 0;

  if (state.finalTurnsRemaining !== null) {
    state.finalTurnsRemaining--;
    if (state.finalTurnsRemaining <= 0) {
      finishGame(state);
      return;
    }
  } else {
    const player = currentPlayer(state);
    if (player.trains <= END_GAME_TRAIN_THRESHOLD) {
      // Everyone, including this player, gets one more turn.
      state.finalTurnsRemaining = state.players.length;
      state.endTriggeredBy = player.id;
      pushLog(state, { type: 'lastRound', player: player.id });
    }
  }

  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  state.turnNumber++;
}

function endTurnAfterTickets(state: GameState): void {
  endTurn(state, null as unknown as Rng);
}

function finishGame(state: GameState): void {
  state.phase = 'finished';
  state.results = computeResults(state);
  pushLog(state, { type: 'gameOver' });
}

function pushLog(state: GameState, event: GameState['log'][number]): void {
  state.log.push(event);
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
}
