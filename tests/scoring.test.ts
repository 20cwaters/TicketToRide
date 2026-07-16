import { describe, expect, it } from 'vitest';
import { isTicketCompleted, longestPathLength } from '../shared/scoring';

// Real route ids from mapData (format: from-to-index).
const LA_PHOENIX = 'losangeles-phoenix-0'; // 3
const PHOENIX_ELPASO = 'phoenix-elpaso-0'; // 3
const ELPASO_SANTAFE = 'santafe-elpaso-0'; // 2
const SANTAFE_DENVER = 'santafe-denver-0'; // 2
const LA_VEGAS = 'losangeles-lasvegas-0'; // 2
const VEGAS_SLC = 'lasvegas-saltlakecity-0'; // 3

describe('isTicketCompleted', () => {
  it('detects a connected path across multiple routes', () => {
    const claimed = [LA_PHOENIX, PHOENIX_ELPASO, ELPASO_SANTAFE, SANTAFE_DENVER];
    expect(isTicketCompleted(claimed, 'losangeles', 'denver')).toBe(true);
    expect(isTicketCompleted(claimed, 'denver', 'losangeles')).toBe(true);
  });

  it('rejects disconnected networks', () => {
    const claimed = [LA_PHOENIX, SANTAFE_DENVER];
    expect(isTicketCompleted(claimed, 'losangeles', 'denver')).toBe(false);
    expect(isTicketCompleted([], 'losangeles', 'denver')).toBe(false);
  });
});

describe('longestPathLength', () => {
  it('returns 0 for no routes', () => {
    expect(longestPathLength([])).toBe(0);
  });

  it('sums a simple chain', () => {
    // LA -3- Phoenix -3- El Paso -2- Santa Fe -2- Denver = 10
    expect(
      longestPathLength([LA_PHOENIX, PHOENIX_ELPASO, ELPASO_SANTAFE, SANTAFE_DENVER]),
    ).toBe(10);
  });

  it('picks the best branch at a fork', () => {
    // From LA: branch A = Phoenix->El Paso (3+3=6), branch B = Vegas->SLC (2+3=5).
    // Longest trail must combine both through LA: 6 + 5 = 11.
    expect(
      longestPathLength([LA_PHOENIX, PHOENIX_ELPASO, LA_VEGAS, VEGAS_SLC]),
    ).toBe(11);
  });

  it('does not reuse a route segment', () => {
    // A single dead-end spur can only count once.
    expect(longestPathLength([LA_PHOENIX])).toBe(3);
  });
});
