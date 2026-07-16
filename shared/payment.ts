import { TRAIN_COLORS } from './types';
import type { Route, TrainCard, TrainColor } from './types';

export interface PaymentOption {
  /** Color of the non-locomotive cards used ('locomotive' when paying all wilds). */
  color: TrainColor | 'locomotive';
  colorCount: number;
  locoCount: number;
}

/** All distinct ways `hand` can pay for `route`. */
export function getPaymentOptions(hand: TrainCard[], route: Route): PaymentOption[] {
  const counts = countCards(hand);
  const locos = counts.locomotive ?? 0;
  const options: PaymentOption[] = [];

  const candidateColors: TrainColor[] =
    route.color === 'gray' ? [...TRAIN_COLORS] : [route.color];

  for (const color of candidateColors) {
    const have = counts[color] ?? 0;
    // Use as many color cards as possible, topping up with locomotives;
    // also offer variants that substitute more locomotives.
    for (let useColor = Math.min(have, route.length); useColor >= 1; useColor--) {
      const needLocos = route.length - useColor;
      if (needLocos <= locos) {
        options.push({ color, colorCount: useColor, locoCount: needLocos });
      }
    }
  }

  if (locos >= route.length) {
    options.push({ color: 'locomotive', colorCount: 0, locoCount: route.length });
  }

  // Sort: fewest locomotives spent first (locomotives are the most flexible card).
  options.sort((a, b) => a.locoCount - b.locoCount);
  return options;
}

export function optionToCards(option: PaymentOption): TrainCard[] {
  const cards: TrainCard[] = [];
  for (let i = 0; i < option.colorCount; i++) cards.push(option.color as TrainColor);
  for (let i = 0; i < option.locoCount; i++) cards.push('locomotive');
  return cards;
}

/** Whether `cards` is a legal payment for `route` (card ownership checked separately). */
export function isValidPayment(route: Route, cards: TrainCard[]): boolean {
  if (cards.length !== route.length) return false;
  const nonLoco = cards.filter((c) => c !== 'locomotive') as TrainColor[];
  if (nonLoco.some((c) => c !== nonLoco[0])) return false;
  if (route.color !== 'gray' && nonLoco.length > 0 && nonLoco[0] !== route.color) {
    return false;
  }
  return true;
}

/** Whether `hand` contains every card in `cards` (multiset containment). */
export function handContains(hand: TrainCard[], cards: TrainCard[]): boolean {
  const have = countCards(hand);
  const need = countCards(cards);
  for (const [card, n] of Object.entries(need)) {
    if ((have[card as TrainCard] ?? 0) < n) return false;
  }
  return true;
}

/** Remove `cards` from `hand`, returning the removed cards. Throws if missing. */
export function removeCards(hand: TrainCard[], cards: TrainCard[]): TrainCard[] {
  const removed: TrainCard[] = [];
  for (const card of cards) {
    const idx = hand.indexOf(card);
    if (idx === -1) throw new Error(`Card not in hand: ${card}`);
    hand.splice(idx, 1);
    removed.push(card);
  }
  return removed;
}

export function countCards(cards: TrainCard[]): Partial<Record<TrainCard, number>> {
  const counts: Partial<Record<TrainCard, number>> = {};
  for (const c of cards) counts[c] = (counts[c] ?? 0) + 1;
  return counts;
}
