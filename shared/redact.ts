import { scoreTickets } from './scoring';
import type { GameState, PlayerGameView, PublicPlayer } from './types';

/** Build the view of the game that a single player is allowed to see. */
export function getPlayerView(state: GameState, playerId: string): PlayerGameView {
  const players: PublicPlayer[] = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    isBot: p.isBot,
    botControlled: p.botControlled,
    connected: p.connected,
    handCount: p.hand.length,
    ticketCount: p.tickets.length,
    trains: p.trains,
    routePoints: p.routePoints,
    claimedRoutes: p.claimedRoutes,
  }));

  const me = state.players.find((p) => p.id === playerId);

  return {
    phase: state.phase,
    players,
    currentPlayerIndex: state.currentPlayerIndex,
    you: {
      id: playerId,
      hand: me ? [...me.hand] : [],
      tickets: me ? scoreTickets(me) : [],
      pendingTickets: state.pendingTickets[playerId] ?? null,
    },
    faceUp: [...state.faceUp],
    trainDeckCount: state.trainDeck.length,
    discardCount: state.discard.length,
    ticketDeckCount: state.ticketDeck.length,
    cardsDrawnThisTurn: state.cardsDrawnThisTurn,
    finalTurnsRemaining: state.finalTurnsRemaining,
    endTriggeredBy: state.endTriggeredBy,
    turnNumber: state.turnNumber,
    log: [...state.log],
    results: state.results,
  };
}
