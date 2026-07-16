import { describe, expect, it } from 'vitest';
import {
  applyAction,
  createGame,
  currentPlayer,
  getRouteOwner,
} from '../shared/engine';
import { mulberry32 } from '../shared/rng';
import type { GameState, TrainCard } from '../shared/types';

function newGame(playerCount: number, seed = 42) {
  const infos = Array.from({ length: playerCount }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    isBot: false,
  }));
  return { state: createGame(infos, seed), rng: mulberry32(seed + 1) };
}

/** Complete initial ticket selection (everyone keeps their first two). */
function startPlaying(state: GameState, rng: () => number) {
  for (const p of [...state.players]) {
    applyAction(state, p.id, { type: 'chooseTickets', keepIndices: [0, 1] }, rng);
  }
  expect(state.phase).toBe('playing');
}

function totalCards(state: GameState): number {
  return (
    state.trainDeck.length +
    state.discard.length +
    state.faceUp.length +
    state.players.reduce((sum, p) => sum + p.hand.length, 0)
  );
}

describe('game setup', () => {
  it('deals 4 cards, 45 trains, 5 face-up, and 3 ticket offers each', () => {
    const { state } = newGame(3);
    expect(state.phase).toBe('ticket_selection');
    for (const p of state.players) {
      expect(p.hand.length).toBe(4);
      expect(p.trains).toBe(45);
      expect(state.pendingTickets[p.id].tickets.length).toBe(3);
      expect(state.pendingTickets[p.id].minKeep).toBe(2);
    }
    expect(state.faceUp.length).toBe(5);
    expect(totalCards(state)).toBe(110);
    expect(state.ticketDeck.length).toBe(30 - 9);
  });

  it('rejects invalid player counts', () => {
    expect(() => newGame(1)).toThrow();
    expect(() => newGame(6)).toThrow();
  });

  it('requires keeping at least 2 tickets at the start', () => {
    const { state, rng } = newGame(2);
    expect(() =>
      applyAction(state, 'p0', { type: 'chooseTickets', keepIndices: [0] }, rng),
    ).toThrow(/at least 2/);
    applyAction(state, 'p0', { type: 'chooseTickets', keepIndices: [0, 1, 2] }, rng);
    expect(state.players[0].tickets.length).toBe(3);
    expect(state.phase).toBe('ticket_selection'); // p1 still choosing
    applyAction(state, 'p1', { type: 'chooseTickets', keepIndices: [1, 2] }, rng);
    expect(state.phase).toBe('playing');
    expect(state.ticketDeck.length).toBe(30 - 6 + 1); // one returned to bottom
  });
});

describe('drawing train cards', () => {
  it('two deck draws end the turn', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    applyAction(state, first.id, { type: 'drawTrainDeck' }, rng);
    expect(state.cardsDrawnThisTurn).toBe(1);
    expect(currentPlayer(state).id).toBe(first.id);
    applyAction(state, first.id, { type: 'drawTrainDeck' }, rng);
    expect(first.hand.length).toBe(6);
    expect(currentPlayer(state).id).not.toBe(first.id);
    expect(state.cardsDrawnThisTurn).toBe(0);
  });

  it('a face-up locomotive is a whole turn and cannot be the second card', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);

    state.faceUp = ['locomotive', 'red', 'red', 'blue', 'green'];
    applyAction(state, first.id, { type: 'drawFaceUp', index: 1 }, rng);
    expect(() =>
      applyAction(state, first.id, { type: 'drawFaceUp', index: 0 }, rng),
    ).toThrow(/locomotive/);
    // Still their draw — take a normal card instead.
    applyAction(state, first.id, { type: 'drawTrainDeck' }, rng);
    expect(currentPlayer(state).id).not.toBe(first.id);

    // Next player takes the locomotive as their whole turn.
    const second = currentPlayer(state);
    state.faceUp[0] = 'locomotive';
    applyAction(state, second.id, { type: 'drawFaceUp', index: 0 }, rng);
    expect(second.hand.filter((c) => c === 'locomotive').length).toBeGreaterThan(0);
    expect(currentPlayer(state).id).not.toBe(second.id);
  });

  it('face-up display is refilled to 5 and enforces the 3-locomotive rule', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    applyAction(state, first.id, { type: 'drawFaceUp', index: 0 }, rng);
    expect(state.faceUp.length).toBe(5);
    const locos = state.faceUp.filter((c) => c === 'locomotive').length;
    expect(locos).toBeLessThan(3);
    expect(totalCards(state)).toBe(110);
  });

  it('reshuffles the discard pile when the deck runs out', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    state.discard = state.trainDeck;
    state.trainDeck = [];
    const first = currentPlayer(state);
    applyAction(state, first.id, { type: 'drawTrainDeck' }, rng);
    expect(first.hand.length).toBe(5);
    expect(state.discard.length).toBe(0);
    expect(totalCards(state)).toBe(110);
  });

  it('rejects acting out of turn', () => {
    const { state, rng } = newGame(3);
    startPlaying(state, rng);
    const notCurrent = state.players.find((p) => p.id !== currentPlayer(state).id)!;
    expect(() =>
      applyAction(state, notCurrent.id, { type: 'drawTrainDeck' }, rng),
    ).toThrow(/not your turn/);
  });
});

describe('claiming routes', () => {
  const ROUTE = 'montreal-newyork-0'; // blue, length 3

  function giveCards(state: GameState, playerId: string, cards: TrainCard[]) {
    const player = state.players.find((p) => p.id === playerId)!;
    // Move the player's old hand to the discard so card totals stay at 110.
    state.discard.push(...player.hand);
    player.hand = [...cards];
    // Pull the granted cards out of the deck to keep the multiset consistent.
    for (const card of cards) {
      const fromDeck = state.trainDeck.indexOf(card);
      if (fromDeck !== -1) state.trainDeck.splice(fromDeck, 1);
      else {
        const fromDiscard = state.discard.indexOf(card);
        if (fromDiscard !== -1) state.discard.splice(fromDiscard, 1);
      }
    }
  }

  it('claims with matching cards, scores points, and blocks opponents', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    giveCards(state, first.id, ['blue', 'blue', 'locomotive']);

    applyAction(
      state,
      first.id,
      { type: 'claimRoute', routeId: ROUTE, cards: ['blue', 'blue', 'locomotive'] },
      rng,
    );
    expect(first.trains).toBe(42);
    expect(first.routePoints).toBe(4); // length 3 = 4 points
    expect(first.hand.length).toBe(0);
    expect(getRouteOwner(state, ROUTE)?.id).toBe(first.id);

    const second = currentPlayer(state);
    giveCards(state, second.id, ['blue', 'blue', 'blue']);
    expect(() =>
      applyAction(
        state,
        second.id,
        { type: 'claimRoute', routeId: ROUTE, cards: ['blue', 'blue', 'blue'] },
        rng,
      ),
    ).toThrow(/already claimed/);
  });

  it('rejects wrong-color payment and cards the player does not hold', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    giveCards(state, first.id, ['red', 'red', 'red']);
    expect(() =>
      applyAction(
        state,
        first.id,
        { type: 'claimRoute', routeId: ROUTE, cards: ['red', 'red', 'red'] },
        rng,
      ),
    ).toThrow(/cannot pay/);
    expect(() =>
      applyAction(
        state,
        first.id,
        { type: 'claimRoute', routeId: ROUTE, cards: ['blue', 'blue', 'blue'] },
        rng,
      ),
    ).toThrow(/do not have/);
  });

  it('cannot claim after drawing a card this turn', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    giveCards(state, first.id, ['blue', 'blue', 'blue']);
    // Draw one card first (from deck), then attempt a claim.
    applyAction(state, first.id, { type: 'drawTrainDeck' }, rng);
    expect(() =>
      applyAction(
        state,
        first.id,
        { type: 'claimRoute', routeId: ROUTE, cards: ['blue', 'blue', 'blue'] },
        rng,
      ),
    ).toThrow(/already drew/);
  });

  it('closes the second track of double routes in 2-3 player games', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    giveCards(state, first.id, ['yellow', 'yellow']);
    applyAction(
      state,
      first.id,
      { type: 'claimRoute', routeId: 'boston-newyork-0', cards: ['yellow', 'yellow'] },
      rng,
    );
    const second = currentPlayer(state);
    giveCards(state, second.id, ['red', 'red']);
    expect(() =>
      applyAction(
        state,
        second.id,
        { type: 'claimRoute', routeId: 'boston-newyork-1', cards: ['red', 'red'] },
        rng,
      ),
    ).toThrow(/2–3 players/);
  });

  it('allows different players on a double route with 4+ players, but not the same player', () => {
    const { state, rng } = newGame(4);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    giveCards(state, first.id, ['yellow', 'yellow', 'red', 'red']);
    applyAction(
      state,
      first.id,
      { type: 'claimRoute', routeId: 'boston-newyork-0', cards: ['yellow', 'yellow'] },
      rng,
    );

    // Same player may not take the sibling later.
    state.currentPlayerIndex = state.players.indexOf(first);
    expect(() =>
      applyAction(
        state,
        first.id,
        { type: 'claimRoute', routeId: 'boston-newyork-1', cards: ['red', 'red'] },
        rng,
      ),
    ).toThrow(/both tracks/);

    // A different player may.
    state.currentPlayerIndex = (state.players.indexOf(first) + 1) % 4;
    const second = currentPlayer(state);
    giveCards(state, second.id, ['red', 'red']);
    applyAction(
      state,
      second.id,
      { type: 'claimRoute', routeId: 'boston-newyork-1', cards: ['red', 'red'] },
      rng,
    );
    expect(getRouteOwner(state, 'boston-newyork-1')?.id).toBe(second.id);
  });
});

describe('destination tickets mid-game', () => {
  it('draws 3, requires keeping at least 1, and consumes the turn', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    const deckBefore = state.ticketDeck.length;

    applyAction(state, first.id, { type: 'drawTickets' }, rng);
    expect(state.pendingTickets[first.id].tickets.length).toBe(3);
    expect(state.pendingTickets[first.id].minKeep).toBe(1);
    // Cannot do anything else until the choice is made.
    expect(() => applyAction(state, first.id, { type: 'drawTrainDeck' }, rng)).toThrow();
    expect(() =>
      applyAction(state, first.id, { type: 'chooseTickets', keepIndices: [] }, rng),
    ).toThrow(/at least 1/);

    applyAction(state, first.id, { type: 'chooseTickets', keepIndices: [2] }, rng);
    expect(first.tickets.length).toBe(3); // 2 initial + 1 kept
    expect(state.ticketDeck.length).toBe(deckBefore - 1);
    expect(currentPlayer(state).id).not.toBe(first.id);
  });
});

describe('end of game', () => {
  it('triggers the final round at 2 trains or fewer and gives everyone one last turn', () => {
    const { state, rng } = newGame(3);
    startPlaying(state, rng);
    const first = currentPlayer(state);
    first.trains = 4;
    // Claim a 2-length route, dropping to 2 trains → trigger.
    state.discard.push(...first.hand);
    first.hand = [];
    const grant: TrainCard[] = ['blue', 'blue'];
    for (const card of grant) {
      const i = state.trainDeck.indexOf(card);
      if (i !== -1) state.trainDeck.splice(i, 1);
      first.hand.push(card);
    }
    applyAction(
      state,
      first.id,
      {
        type: 'claimRoute',
        routeId: 'kansascity-saintlouis-0',
        cards: ['blue', 'blue'],
      },
      rng,
    );
    expect(first.trains).toBe(2);
    expect(state.finalTurnsRemaining).toBe(3);
    expect(state.endTriggeredBy).toBe(first.id);

    // Three more turns (everyone, including the trigger player) then game over.
    for (let i = 0; i < 3; i++) {
      expect(state.phase).toBe('playing');
      const p = currentPlayer(state);
      applyAction(state, p.id, { type: 'drawTrainDeck' }, rng);
      if (state.phase === 'playing' && currentPlayer(state).id === p.id) {
        applyAction(state, p.id, { type: 'drawTrainDeck' }, rng);
      }
    }
    expect(state.phase).toBe('finished');
    expect(state.results).not.toBeNull();
    expect(state.results!.players.length).toBe(3);
    // Totals add up.
    for (const r of state.results!.players) {
      expect(r.total).toBe(r.routePoints + r.ticketPoints + r.longestPathBonus);
    }
    expect(() => applyAction(state, first.id, { type: 'drawTrainDeck' }, rng)).toThrow(
      /over/,
    );
  });

  it('rejects pass while legal moves exist', () => {
    const { state, rng } = newGame(2);
    startPlaying(state, rng);
    expect(() =>
      applyAction(state, currentPlayer(state).id, { type: 'pass' }, rng),
    ).toThrow(/legal move/);
  });
});
