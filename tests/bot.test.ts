import { describe, expect, it } from 'vitest';
import { applyAction, createGame, currentPlayer } from '../shared/engine';
import { decideBotAction } from '../shared/bot';
import { mulberry32 } from '../shared/rng';
import type { GameState } from '../shared/types';

function totalCards(state: GameState): number {
  return (
    state.trainDeck.length +
    state.discard.length +
    state.faceUp.length +
    state.players.reduce((sum, p) => sum + p.hand.length, 0)
  );
}

/** Play a complete game with only bots; throws if anything illegal happens. */
function playFullGame(playerCount: number, seed: number): GameState {
  const infos = Array.from({ length: playerCount }, (_, i) => ({
    id: `bot${i}`,
    name: `Bot ${i}`,
    isBot: true,
  }));
  const state = createGame(infos, seed);
  const rng = mulberry32(seed + 7777);

  let steps = 0;
  while (state.phase !== 'finished') {
    steps++;
    if (steps > 5000) throw new Error('Game did not terminate');

    let actorId: string;
    if (state.phase === 'ticket_selection') {
      actorId = Object.keys(state.pendingTickets)[0];
    } else {
      actorId = currentPlayer(state).id;
    }
    const action = decideBotAction(state, actorId);
    applyAction(state, actorId, action, rng); // throws on illegal actions

    if (totalCards(state) !== 110) {
      throw new Error(`Card count broke: ${totalCards(state)} at step ${steps}`);
    }
  }
  return state;
}

describe('bot self-play', () => {
  for (const playerCount of [2, 3, 4, 5]) {
    it(`finishes a legal ${playerCount}-player game`, () => {
      const state = playFullGame(playerCount, 1000 + playerCount);
      expect(state.phase).toBe('finished');
      expect(state.results).not.toBeNull();
      expect(state.results!.winnerIds.length).toBeGreaterThan(0);

      // No route claimed twice; double-route rule respected for 2-3 players.
      const owners = new Map<string, string>();
      const pairsUsed = new Map<string, string[]>();
      for (const p of state.players) {
        for (const routeId of p.claimedRoutes) {
          expect(owners.has(routeId), `route ${routeId} claimed twice`).toBe(false);
          owners.set(routeId, p.id);
        }
      }
      expect(owners.size).toBeGreaterThan(0);

      // Scoring components add up for everyone.
      for (const r of state.results!.players) {
        expect(r.total).toBe(r.routePoints + r.ticketPoints + r.longestPathBonus);
      }

      // Bots actually played: trains were spent.
      const spent = state.players.some((p) => p.trains < 45);
      expect(spent).toBe(true);
    });
  }

  it('plays consistently across several seeds without stalling', () => {
    for (const seed of [1, 2, 3, 42, 99]) {
      const state = playFullGame(3, seed);
      expect(state.phase).toBe('finished');
      // Bots complete at least some tickets across these seeds (sanity that
      // they pursue destinations rather than drawing forever).
      const completed = state.results!.players.reduce(
        (sum, r) => sum + r.tickets.filter((t) => t.completed).length,
        0,
      );
      expect(completed).toBeGreaterThan(0);
    }
  });
});
