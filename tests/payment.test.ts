import { describe, expect, it } from 'vitest';
import {
  getPaymentOptions,
  handContains,
  isValidPayment,
  optionToCards,
  removeCards,
} from '../shared/payment';
import type { Route, TrainCard } from '../shared/types';

const redRoute3: Route = { id: 'r', from: 'a', to: 'b', length: 3, color: 'red' };
const grayRoute2: Route = { id: 'g', from: 'a', to: 'b', length: 2, color: 'gray' };

describe('isValidPayment', () => {
  it('accepts exact color match', () => {
    expect(isValidPayment(redRoute3, ['red', 'red', 'red'])).toBe(true);
  });

  it('accepts locomotives as wilds', () => {
    expect(isValidPayment(redRoute3, ['red', 'locomotive', 'red'])).toBe(true);
    expect(isValidPayment(redRoute3, ['locomotive', 'locomotive', 'locomotive'])).toBe(true);
  });

  it('rejects wrong color on colored routes', () => {
    expect(isValidPayment(redRoute3, ['blue', 'blue', 'blue'])).toBe(false);
    expect(isValidPayment(redRoute3, ['red', 'blue', 'locomotive'])).toBe(false);
  });

  it('rejects wrong count', () => {
    expect(isValidPayment(redRoute3, ['red', 'red'])).toBe(false);
    expect(isValidPayment(redRoute3, ['red', 'red', 'red', 'red'])).toBe(false);
  });

  it('accepts any single color on gray routes but not mixed colors', () => {
    expect(isValidPayment(grayRoute2, ['blue', 'blue'])).toBe(true);
    expect(isValidPayment(grayRoute2, ['green', 'locomotive'])).toBe(true);
    expect(isValidPayment(grayRoute2, ['blue', 'green'])).toBe(false);
  });
});

describe('getPaymentOptions', () => {
  it('finds color + locomotive combinations', () => {
    const hand: TrainCard[] = ['red', 'red', 'locomotive', 'blue'];
    const options = getPaymentOptions(hand, redRoute3);
    expect(options.length).toBeGreaterThan(0);
    // Best option spends the fewest locomotives.
    expect(options[0]).toEqual({ color: 'red', colorCount: 2, locoCount: 1 });
    for (const opt of options) {
      const cards = optionToCards(opt);
      expect(isValidPayment(redRoute3, cards)).toBe(true);
      expect(handContains(hand, cards)).toBe(true);
    }
  });

  it('returns nothing when the hand cannot pay', () => {
    expect(getPaymentOptions(['red', 'blue'], redRoute3)).toEqual([]);
    expect(getPaymentOptions([], grayRoute2)).toEqual([]);
  });

  it('offers each holdable color for gray routes', () => {
    const options = getPaymentOptions(['blue', 'blue', 'green', 'green'], grayRoute2);
    const colors = new Set(options.map((o) => o.color));
    expect(colors).toEqual(new Set(['blue', 'green']));
  });

  it('offers an all-locomotive option', () => {
    const options = getPaymentOptions(['locomotive', 'locomotive'], grayRoute2);
    expect(options).toContainEqual({ color: 'locomotive', colorCount: 0, locoCount: 2 });
  });
});

describe('removeCards', () => {
  it('removes a multiset and throws when cards are missing', () => {
    const hand: TrainCard[] = ['red', 'red', 'blue'];
    removeCards(hand, ['red', 'blue']);
    expect(hand).toEqual(['red']);
    expect(() => removeCards(hand, ['green'])).toThrow();
  });
});
