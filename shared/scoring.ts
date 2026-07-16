import { ROUTE_BY_ID } from './mapData';
import { LONGEST_PATH_BONUS } from './types';
import type {
  GameResults,
  GameState,
  Player,
  PlayerResult,
  TicketResult,
} from './types';

/** Cities reachable from `start` over the player's claimed routes. */
function reachableCities(claimedRouteIds: string[], start: string): Set<string> {
  const adj = new Map<string, string[]>();
  for (const id of claimedRouteIds) {
    const route = ROUTE_BY_ID[id];
    if (!route) continue;
    if (!adj.has(route.from)) adj.set(route.from, []);
    if (!adj.has(route.to)) adj.set(route.to, []);
    adj.get(route.from)!.push(route.to);
    adj.get(route.to)!.push(route.from);
  }
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const city = queue.pop()!;
    for (const next of adj.get(city) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen;
}

export function isTicketCompleted(
  claimedRouteIds: string[],
  from: string,
  to: string,
): boolean {
  return reachableCities(claimedRouteIds, from).has(to);
}

/**
 * Length of the player's longest continuous path: the longest trail
 * (each claimed route used at most once; cities may repeat).
 */
export function longestPathLength(claimedRouteIds: string[]): number {
  const edges = claimedRouteIds
    .map((id) => ROUTE_BY_ID[id])
    .filter((r) => r !== undefined);
  if (edges.length === 0) return 0;

  const adj = new Map<string, { edgeIndex: number; other: string }[]>();
  edges.forEach((route, edgeIndex) => {
    if (!adj.has(route.from)) adj.set(route.from, []);
    if (!adj.has(route.to)) adj.set(route.to, []);
    adj.get(route.from)!.push({ edgeIndex, other: route.to });
    adj.get(route.to)!.push({ edgeIndex, other: route.from });
  });

  let best = 0;
  const used = new Array<boolean>(edges.length).fill(false);

  const dfs = (city: string, total: number) => {
    if (total > best) best = total;
    for (const { edgeIndex, other } of adj.get(city) ?? []) {
      if (used[edgeIndex]) continue;
      used[edgeIndex] = true;
      dfs(other, total + edges[edgeIndex].length);
      used[edgeIndex] = false;
    }
  };

  for (const city of adj.keys()) dfs(city, 0);
  return best;
}

export function scoreTickets(player: Player): TicketResult[] {
  return player.tickets.map((ticket) => ({
    ticket,
    completed: isTicketCompleted(player.claimedRoutes, ticket.from, ticket.to),
  }));
}

export function computeResults(state: GameState): GameResults {
  const lengths = new Map<string, number>();
  for (const p of state.players) {
    lengths.set(p.id, longestPathLength(p.claimedRoutes));
  }
  const maxLength = Math.max(...lengths.values());

  const players: PlayerResult[] = state.players.map((p) => {
    const tickets = scoreTickets(p);
    const ticketPoints = tickets.reduce(
      (sum, t) => sum + (t.completed ? t.ticket.points : -t.ticket.points),
      0,
    );
    const pathLen = lengths.get(p.id)!;
    const longestBonus = pathLen === maxLength && maxLength > 0 ? LONGEST_PATH_BONUS : 0;
    return {
      playerId: p.id,
      routePoints: p.routePoints,
      tickets,
      ticketPoints,
      longestPathLength: pathLen,
      longestPathBonus: longestBonus,
      total: p.routePoints + ticketPoints + longestBonus,
    };
  });

  // Official tiebreakers: most completed tickets, then longest-path holder.
  const rank = (r: PlayerResult) => r.total;
  const maxTotal = Math.max(...players.map(rank));
  let contenders = players.filter((r) => r.total === maxTotal);
  if (contenders.length > 1) {
    const completed = (r: PlayerResult) => r.tickets.filter((t) => t.completed).length;
    const maxCompleted = Math.max(...contenders.map(completed));
    contenders = contenders.filter((r) => completed(r) === maxCompleted);
  }
  if (contenders.length > 1) {
    const withBonus = contenders.filter((r) => r.longestPathBonus > 0);
    if (withBonus.length > 0) contenders = withBonus;
  }

  players.sort((a, b) => b.total - a.total);
  return { players, winnerIds: contenders.map((r) => r.playerId) };
}
