import { TRAIN_COLORS, FACE_UP_COUNT } from './types';
import type { GameState, TrainCard } from './types';
import { shuffle, type Rng } from './rng';

export const CARDS_PER_COLOR = 12;
export const LOCOMOTIVE_COUNT = 14;

/** Build the full 110-card train deck: 12 of each of 8 colors + 14 locomotives. */
export function buildTrainDeck(rng: Rng): TrainCard[] {
  const deck: TrainCard[] = [];
  for (const color of TRAIN_COLORS) {
    for (let i = 0; i < CARDS_PER_COLOR; i++) deck.push(color);
  }
  for (let i = 0; i < LOCOMOTIVE_COUNT; i++) deck.push('locomotive');
  return shuffle(deck, rng);
}

/** Draw the top card, reshuffling the discard pile in if the deck is empty. */
export function drawFromDeck(state: GameState, rng: Rng): TrainCard | null {
  if (state.trainDeck.length === 0 && state.discard.length > 0) {
    state.trainDeck = shuffle(state.discard, rng);
    state.discard = [];
  }
  return state.trainDeck.pop() ?? null;
}

/**
 * Refill the face-up display to 5 cards and apply the locomotive rule:
 * if 3+ face-up cards are locomotives, discard all 5 and deal fresh ones —
 * but only while enough non-locomotive cards remain to make that meaningful.
 */
export function refillFaceUp(state: GameState, rng: Rng): void {
  while (state.faceUp.length < FACE_UP_COUNT) {
    const card = drawFromDeck(state, rng);
    if (card === null) break;
    state.faceUp.push(card);
  }

  let attempts = 0;
  while (needsLocomotiveRefresh(state) && attempts < 20) {
    attempts++;
    state.discard.push(...state.faceUp);
    state.faceUp = [];
    while (state.faceUp.length < FACE_UP_COUNT) {
      const card = drawFromDeck(state, rng);
      if (card === null) break;
      state.faceUp.push(card);
    }
  }
}

function needsLocomotiveRefresh(state: GameState): boolean {
  if (state.faceUp.length < 3) return false;
  const locos = state.faceUp.filter((c) => c === 'locomotive').length;
  if (locos < 3) return false;
  // If nearly everything left is locomotives, a refresh can never fix it.
  const pool = [...state.trainDeck, ...state.discard, ...state.faceUp];
  const nonLoco = pool.filter((c) => c !== 'locomotive').length;
  return nonLoco >= 3;
}
