import { describe, expect, it } from 'vitest';
import { CITIES, CITY_BY_ID, ROUTES } from '../shared/mapData';
import { DESTINATION_TICKETS } from '../shared/tickets';
import { buildTrainDeck } from '../shared/deck';
import { mulberry32 } from '../shared/rng';

describe('map data', () => {
  it('has the 36 standard USA cities', () => {
    expect(CITIES.length).toBe(36);
    const ids = new Set(CITIES.map((c) => c.id));
    expect(ids.size).toBe(36);
  });

  it('every route connects two distinct known cities with length 1-6', () => {
    for (const route of ROUTES) {
      expect(CITY_BY_ID[route.from], `bad city ${route.from}`).toBeDefined();
      expect(CITY_BY_ID[route.to], `bad city ${route.to}`).toBeDefined();
      expect(route.from).not.toBe(route.to);
      expect(route.length).toBeGreaterThanOrEqual(1);
      expect(route.length).toBeLessThanOrEqual(6);
    }
  });

  it('has unique route ids', () => {
    const ids = new Set(ROUTES.map((r) => r.id));
    expect(ids.size).toBe(ROUTES.length);
  });

  it('pairs double routes correctly', () => {
    const byPair = new Map<string, typeof ROUTES>();
    for (const route of ROUTES) {
      if (!route.pairId) continue;
      byPair.set(route.pairId, [...(byPair.get(route.pairId) ?? []), route]);
    }
    for (const [pairId, pair] of byPair) {
      expect(pair.length, `pair ${pairId}`).toBe(2);
      expect(pair[0].from).toBe(pair[1].from);
      expect(pair[0].to).toBe(pair[1].to);
      expect(pair[0].length).toBe(pair[1].length);
    }
  });

  it('map is fully connected', () => {
    const adj = new Map<string, string[]>();
    for (const r of ROUTES) {
      adj.set(r.from, [...(adj.get(r.from) ?? []), r.to]);
      adj.set(r.to, [...(adj.get(r.to) ?? []), r.from]);
    }
    const seen = new Set<string>([CITIES[0].id]);
    const queue = [CITIES[0].id];
    while (queue.length) {
      for (const next of adj.get(queue.pop()!) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(seen.size).toBe(CITIES.length);
  });
});

describe('destination tickets', () => {
  it('has the 30 standard tickets referencing valid cities', () => {
    expect(DESTINATION_TICKETS.length).toBe(30);
    for (const t of DESTINATION_TICKETS) {
      expect(CITY_BY_ID[t.from], `bad city ${t.from}`).toBeDefined();
      expect(CITY_BY_ID[t.to], `bad city ${t.to}`).toBeDefined();
      expect(t.points).toBeGreaterThan(0);
    }
  });
});

describe('train deck', () => {
  it('contains 110 cards: 12 per color and 14 locomotives', () => {
    const deck = buildTrainDeck(mulberry32(1));
    expect(deck.length).toBe(110);
    const counts = new Map<string, number>();
    for (const card of deck) counts.set(card, (counts.get(card) ?? 0) + 1);
    expect(counts.get('locomotive')).toBe(14);
    for (const [card, n] of counts) {
      if (card !== 'locomotive') expect(n, card).toBe(12);
    }
    expect(counts.size).toBe(9);
  });
});
