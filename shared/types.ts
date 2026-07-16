/** Core shared types for the Ticket to Ride engine, server, and client. */

export const TRAIN_COLORS = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'pink',
  'black',
  'white',
] as const;

export type TrainColor = (typeof TRAIN_COLORS)[number];
export type TrainCard = TrainColor | 'locomotive';
export type RouteColor = TrainColor | 'gray';

export interface City {
  id: string;
  name: string;
  /** Map layout coordinates in the 1000x620 board viewBox. */
  x: number;
  y: number;
  /** Optional label placement tweaks for the renderer. */
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: 'start' | 'middle' | 'end';
}

export interface Route {
  id: string;
  from: string;
  to: string;
  length: number;
  color: RouteColor;
  /** Shared by the two halves of a parallel (double) route. */
  pairId?: string;
  /** Perpendicular midpoint offset for rendering as a curve (px). */
  curve?: number;
}

export interface DestinationTicket {
  id: string;
  from: string;
  to: string;
  points: number;
}

export const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow', 'black'] as const;
export type PlayerColor = (typeof PLAYER_COLORS)[number];

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isBot: boolean;
  /** True while a bot is playing on behalf of a disconnected human. */
  botControlled: boolean;
  connected: boolean;
  hand: TrainCard[];
  tickets: DestinationTicket[];
  trains: number;
  routePoints: number;
  claimedRoutes: string[];
}

export type GamePhase = 'ticket_selection' | 'playing' | 'finished';

export interface PendingTickets {
  tickets: DestinationTicket[];
  minKeep: number;
}

export type GameEvent =
  | { type: 'drewFromDeck'; player: string }
  | { type: 'drewFaceUp'; player: string; card: TrainCard }
  | { type: 'claimedRoute'; player: string; routeId: string; points: number }
  | { type: 'drewTickets'; player: string; count: number }
  | { type: 'keptTickets'; player: string; kept: number; returned: number }
  | { type: 'passed'; player: string }
  | { type: 'lastRound'; player: string }
  | { type: 'faceUpRefreshed' }
  | { type: 'gameOver' };

export interface TicketResult {
  ticket: DestinationTicket;
  completed: boolean;
}

export interface PlayerResult {
  playerId: string;
  routePoints: number;
  tickets: TicketResult[];
  ticketPoints: number;
  longestPathLength: number;
  longestPathBonus: number;
  total: number;
}

export interface GameResults {
  players: PlayerResult[];
  winnerIds: string[];
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentPlayerIndex: number;
  trainDeck: TrainCard[];
  faceUp: TrainCard[];
  discard: TrainCard[];
  ticketDeck: DestinationTicket[];
  /** 0 or 1 — how many train cards the current player has drawn this turn. */
  cardsDrawnThisTurn: number;
  /** Ticket offers awaiting a keep/return decision, keyed by player id. */
  pendingTickets: Record<string, PendingTickets>;
  /** Countdown of turns left once the end-game has been triggered. */
  finalTurnsRemaining: number | null;
  endTriggeredBy: string | null;
  consecutivePasses: number;
  turnNumber: number;
  log: GameEvent[];
  results: GameResults | null;
}

export type Action =
  | { type: 'drawTrainDeck' }
  | { type: 'drawFaceUp'; index: number }
  | { type: 'claimRoute'; routeId: string; cards: TrainCard[] }
  | { type: 'drawTickets' }
  | { type: 'chooseTickets'; keepIndices: number[] }
  | { type: 'pass' };

/** Public info about a player — safe to show to everyone. */
export interface PublicPlayer {
  id: string;
  name: string;
  color: PlayerColor;
  isBot: boolean;
  botControlled: boolean;
  connected: boolean;
  handCount: number;
  ticketCount: number;
  trains: number;
  routePoints: number;
  claimedRoutes: string[];
}

/** Everything one player is allowed to see. */
export interface PlayerGameView {
  phase: GamePhase;
  players: PublicPlayer[];
  currentPlayerIndex: number;
  you: {
    id: string;
    hand: TrainCard[];
    tickets: TicketResult[];
    pendingTickets: PendingTickets | null;
  };
  faceUp: TrainCard[];
  trainDeckCount: number;
  discardCount: number;
  ticketDeckCount: number;
  cardsDrawnThisTurn: number;
  finalTurnsRemaining: number | null;
  endTriggeredBy: string | null;
  turnNumber: number;
  log: GameEvent[];
  results: GameResults | null;
}

export const ROUTE_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 10,
  6: 15,
};

export const INITIAL_TRAINS = 45;
export const INITIAL_HAND_SIZE = 4;
export const FACE_UP_COUNT = 5;
export const LONGEST_PATH_BONUS = 10;
export const END_GAME_TRAIN_THRESHOLD = 2;
