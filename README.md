# Ticket to Ride — USA

A multiplayer web version of Ticket to Ride (USA map): React + TypeScript + Tailwind on the front, Node + Socket.IO on the back, with heuristic bots so you can play a full game solo.

## Quick start

```bash
npm install
npm run dev        # server on :3001 + Vite client on :5173
```

Open http://localhost:5173, create a room, add 1–4 bots, and start.

## Scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Dev server (tsx watch) + Vite client with HMR       |
| `npm test`          | Vitest unit tests (engine, scoring, bots, map data) |
| `npm run typecheck` | Typecheck client and server                         |
| `npm run build`     | Production build → `client/dist` + `dist/`          |
| `npm start`         | Run the production server (serves the built client) |

## Deploying to Render

The repo ships a `render.yaml` blueprint — a single web service that builds both
halves and serves the client statically from the Node process (Socket.IO shares
the same origin, so no CORS setup is needed). Either create a Blueprint from the
repo, or create a web service manually with:

- **Build command:** `npm ci --include=dev && npm run build`
- **Start command:** `npm start`

The server honors `PORT` (Render sets it automatically).

## Project layout

```
shared/    Pure game logic, no dependencies — reusable and fully unit-tested
  types.ts       All shared types + game constants
  mapData.ts     36 cities, every USA route (incl. double routes), board coords
  tickets.ts     The 30 destination tickets
  deck.ts        110-card deck, draw/reshuffle, face-up locomotive rule
  payment.ts     Which card sets can pay for a route
  engine.ts      createGame / applyAction — all rules enforcement
  scoring.ts     Ticket completion, longest path, final results
  bot.ts         Heuristic bot (Dijkstra toward ticket destinations)
  redact.ts      Per-player views (hides opponents' hands/tickets)
server/    Express + Socket.IO: rooms, rejoin tokens, bot scheduling
client/    React UI: lobby, SVG board, hand/cards, tickets, scoring screen
tests/     Vitest suites, including full bot-vs-bot game simulations
```

To add another map later, provide new `mapData`/`tickets` equivalents — the
engine only touches route/city data through those modules.

## Rules implemented

- Standard USA map (36 cities) with all routes and parallel (double) routes;
  with 2–3 players only one track of each double route may be used
- 110 train cards (12 × 8 colors + 14 locomotives), 5 face-up with the
  3-locomotive redraw rule, discard-pile reshuffle
- Turn actions: draw 2 cards (a face-up locomotive counts as both), claim one
  route (correct color/count, locomotives wild, gray = any one color), or draw
  3 destination tickets (keep ≥1; ≥2 at game start)
- 45 trains per player; ≤2 trains triggers the final round (one more turn for
  everyone including the trigger player)
- Scoring: 1/2/4/7/10/15 route points, ± destination tickets, 10-point longest
  continuous path bonus (shared on ties), official tiebreakers

## Multiplayer details

- Rooms with 5-letter codes; the host fills empty seats with bots
- Per-player state redaction — you never receive opponents' hands or tickets
- Refresh-proof: sessions rejoin automatically via a token in `sessionStorage`
- If someone disconnects mid-game, anyone can hand their seat to a bot; if they
  come back, they take over again
