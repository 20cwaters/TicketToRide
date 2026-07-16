import { memo, useMemo } from 'react';
import { CITIES, CITY_BY_ID, ROUTES } from '@shared/mapData';
import type { DestinationTicket, PlayerGameView, Route } from '@shared/types';
import { PLAYER_COLOR_HEX, ROUTE_COLOR_HEX, TICKET_PREVIEW_COLORS } from '../ui';
import { CANADA_BORDER, LAKES, LAND, MEXICO_BORDER } from '../geography';

interface Props {
  game: PlayerGameView;
  onRouteClick: (routeId: string) => void;
  highlightCities: Set<string>;
  selectedRouteId: string | null;
  /** Ticket offers being considered — drawn as dashed preview arcs. */
  previewTickets?: DestinationTicket[];
}

interface Point {
  x: number;
  y: number;
}

/** Quadratic bezier point + tangent angle at t. */
function bezier(a: Point, c: Point, b: Point, t: number): Point & { angle: number } {
  const mt = 1 - t;
  const x = mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x;
  const y = mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y;
  const dx = 2 * mt * (c.x - a.x) + 2 * t * (b.x - c.x);
  const dy = 2 * mt * (c.y - a.y) + 2 * t * (b.y - c.y);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

interface RouteGeometry {
  route: Route;
  segments: { x: number; y: number; angle: number; length: number }[];
  hitPath: string;
}

function buildGeometry(route: Route): RouteGeometry {
  const cityA = CITIES.find((c) => c.id === route.from)!;
  const cityB = CITIES.find((c) => c.id === route.to)!;

  // Parallel routes are offset to either side of the center line.
  let side = 0;
  if (route.pairId) {
    side = route.id.endsWith('-0') ? -1 : 1;
  }
  const dx = cityB.x - cityA.x;
  const dy = cityB.y - cityA.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;
  const off = side * 5.5;

  const a: Point = { x: cityA.x + nx * off, y: cityA.y + ny * off };
  const b: Point = { x: cityB.x + nx * off, y: cityB.y + ny * off };
  const bend = route.curve ?? 0;
  const control: Point = {
    x: (a.x + b.x) / 2 + nx * bend,
    y: (a.y + b.y) / 2 + ny * bend,
  };

  // Trim so segments don't sit on top of the city markers.
  const trim = Math.min(0.12, 11 / dist);
  const n = route.length;
  const span = 1 - trim * 2;
  const segments = Array.from({ length: n }, (_, i) => {
    const t0 = trim + (span * i) / n;
    const t1 = trim + (span * (i + 1)) / n;
    const mid = bezier(a, control, b, (t0 + t1) / 2);
    const p0 = bezier(a, control, b, t0);
    const p1 = bezier(a, control, b, t1);
    const segLen = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    return { x: mid.x, y: mid.y, angle: mid.angle, length: Math.max(segLen - 4, 8) };
  });

  const hitPath = `M ${a.x} ${a.y} Q ${control.x} ${control.y} ${b.x} ${b.y}`;
  return { route, segments, hitPath };
}

const GEOMETRY: RouteGeometry[] = ROUTES.map(buildGeometry);

function ticketArcPath(ticket: DestinationTicket): string {
  const a = CITY_BY_ID[ticket.from];
  const b = CITY_BY_ID[ticket.to];
  if (!a || !b) return '';
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const lift = Math.min(60, dist * 0.18);
  const cx = (a.x + b.x) / 2 - (dy / dist) * lift;
  const cy = (a.y + b.y) / 2 + (dx / dist) * lift;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

function MapBoard({
  game,
  onRouteClick,
  highlightCities,
  selectedRouteId,
  previewTickets,
}: Props) {
  const ownerByRoute = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of game.players) {
      for (const id of p.claimedRoutes) map.set(id, p.id);
    }
    return map;
  }, [game.players]);

  const playerColor = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of game.players) map.set(p.id, PLAYER_COLOR_HEX[p.color]);
    return map;
  }, [game.players]);

  return (
    <svg
      viewBox="0 0 1000 620"
      className="block h-auto w-full select-none"
      role="img"
      aria-label="USA route map"
    >
      <defs>
        <radialGradient id="land-bg" cx="50%" cy="42%" r="80%">
          <stop offset="0%" stopColor="#f3ead4" />
          <stop offset="70%" stopColor="#eadcbc" />
          <stop offset="100%" stopColor="#ddc99e" />
        </radialGradient>
        <linearGradient id="water-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b7c9c0" />
          <stop offset="100%" stopColor="#a3bab3" />
        </linearGradient>
        <filter id="seg-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0.8" stdDeviation="0.7" floodOpacity="0.35" />
        </filter>
        <filter id="car-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1.1" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Ocean, land, lakes */}
      <rect x="0" y="0" width="1000" height="620" rx="14" fill="url(#water-bg)" />
      <path
        d={LAND}
        fill="url(#land-bg)"
        stroke="#77918a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {LAKES.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="url(#water-bg)"
          stroke="#77918a"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      ))}

      {/* National borders (decorative) */}
      <path
        d={CANADA_BORDER}
        fill="none"
        stroke="#8a7a52"
        strokeWidth="1.6"
        strokeDasharray="7 5"
        opacity="0.55"
      />
      <path
        d={MEXICO_BORDER}
        fill="none"
        stroke="#8a7a52"
        strokeWidth="1.6"
        strokeDasharray="7 5"
        opacity="0.55"
      />

      {/* Faint graticule for a vintage-map feel */}
      <g stroke="#6b5a33" strokeWidth="1" fill="none" opacity="0.07">
        <path d="M 7 170 Q 500 128 993 170" />
        <path d="M 7 330 Q 500 292 993 330" />
        <path d="M 7 480 Q 500 448 993 480" />
        <path d="M 260 7 Q 272 300 250 613" />
        <path d="M 520 7 Q 526 300 516 613" />
        <path d="M 760 7 Q 772 300 756 613" />
      </g>

      {/* Frame + title + compass */}
      <rect
        x="7" y="7" width="986" height="606" rx="10"
        fill="none" stroke="#8f6f40" strokeOpacity="0.55" strokeWidth="2.5"
      />
      <text
        x="636" y="603" textAnchor="middle" fontSize="12"
        fontFamily="Georgia, serif" letterSpacing="5" fill="#4c5f58" opacity="0.9"
      >
        TICKET TO RIDE · UNITED STATES
      </text>
      <g transform="translate(902 505)" opacity="0.6" stroke="#4c5f58" fill="#4c5f58">
        <circle r="17" fill="none" strokeWidth="1.4" />
        <path d="M 0 -14 L 3.5 0 L 0 14 L -3.5 0 Z" strokeWidth="0.6" />
        <path d="M -14 0 L 0 3.5 L 14 0 L 0 -3.5 Z" strokeWidth="0.6" opacity="0.55" />
        <text y="-21" textAnchor="middle" fontSize="10" fontFamily="Georgia, serif" strokeWidth="0.4">
          N
        </text>
      </g>

      {/* Route slots + claimed trains */}
      {GEOMETRY.map(({ route, segments, hitPath }) => {
        const ownerId = ownerByRoute.get(route.id);
        const color = ownerId ? playerColor.get(ownerId)! : null;
        const selected = selectedRouteId === route.id;
        return (
          <g key={route.id}>
            {/* Continuous track under a claimed route so the path pops */}
            {color && (
              <path
                d={hitPath}
                fill="none"
                stroke={color}
                strokeWidth="4.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            )}
            {segments.map((seg, i) => (
              <g
                key={i}
                transform={`translate(${seg.x} ${seg.y}) rotate(${seg.angle})`}
              >
                {color ? (
                  /* Claimed: a chunky bordered train car in the player color */
                  <g filter="url(#car-shadow)">
                    <rect
                      x={-seg.length / 2 - 1.5}
                      y={-7.5}
                      width={seg.length + 3}
                      height={15}
                      rx={4}
                      fill="#f7f3e6"
                    />
                    <rect
                      x={-seg.length / 2}
                      y={-6}
                      width={seg.length}
                      height={12}
                      rx={3}
                      fill={color}
                      stroke="rgba(0,0,0,0.55)"
                      strokeWidth={1}
                    />
                    <rect
                      x={-seg.length / 2 + 2}
                      y={-6}
                      width={seg.length - 4}
                      height={3.6}
                      rx={1.6}
                      fill="rgba(255,255,255,0.35)"
                    />
                    <circle cx={-seg.length / 4} cy={6.2} r={2} fill="#1c1a14" />
                    <circle cx={seg.length / 4} cy={6.2} r={2} fill="#1c1a14" />
                  </g>
                ) : (
                  /* Unclaimed: a flat empty slot printed on the board */
                  <rect
                    x={-seg.length / 2}
                    y={-4.5}
                    width={seg.length}
                    height={9}
                    rx={2}
                    fill={ROUTE_COLOR_HEX[route.color]}
                    fillOpacity={0.88}
                    stroke={selected ? '#c9a86a' : 'rgba(30,24,12,0.5)'}
                    strokeWidth={selected ? 2.4 : 1}
                    strokeDasharray={route.color === 'gray' ? '3 2' : undefined}
                    filter="url(#seg-shadow)"
                  />
                )}
              </g>
            ))}
            {/* Invisible fat stroke for easy tapping */}
            <path
              d={hitPath}
              fill="none"
              stroke="transparent"
              strokeWidth={20}
              style={{ cursor: 'pointer' }}
              onClick={() => onRouteClick(route.id)}
            />
          </g>
        );
      })}

      {/* Pending destination-ticket previews */}
      {previewTickets?.map((ticket, i) => {
        const color = TICKET_PREVIEW_COLORS[i % TICKET_PREVIEW_COLORS.length];
        const a = CITY_BY_ID[ticket.from];
        const b = CITY_BY_ID[ticket.to];
        if (!a || !b) return null;
        return (
          <g key={ticket.id} pointerEvents="none">
            <path
              d={ticketArcPath(ticket)}
              fill="none"
              stroke="#f7f3e6"
              strokeWidth="5.5"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d={ticketArcPath(ticket)}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeDasharray="8 6"
              strokeLinecap="round"
            />
            {[a, b].map((city, j) => (
              <g key={j}>
                <circle cx={city.x} cy={city.y} r={10.5} fill="none" stroke="#f7f3e6" strokeWidth="4.5" opacity="0.8" />
                <circle cx={city.x} cy={city.y} r={10.5} fill="none" stroke={color} strokeWidth="2.5" />
              </g>
            ))}
            <g transform={`translate(${(a.x + b.x) / 2} ${(a.y + b.y) / 2})`}>
              <circle r="9" fill={color} stroke="#f7f3e6" strokeWidth="2" />
              <text
                y="3.5" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#fff"
              >
                {i + 1}
              </text>
            </g>
          </g>
        );
      })}

      {/* Cities */}
      {CITIES.map((city) => {
        const highlighted = highlightCities.has(city.id);
        return (
          <g key={city.id}>
            {highlighted && (
              <circle
                cx={city.x}
                cy={city.y}
                r={12}
                fill="none"
                stroke="#c34a36"
                strokeWidth={2.5}
                strokeDasharray="4 3"
              />
            )}
            <circle
              cx={city.x}
              cy={city.y}
              r={6.5}
              fill={highlighted ? '#c34a36' : '#b08d57'}
              stroke="#2b2313"
              strokeWidth={1.6}
            />
            <circle cx={city.x} cy={city.y} r={2.2} fill="#f3ead4" opacity={0.9} />
            <text
              x={city.x + (city.labelDx ?? 0)}
              y={city.y + (city.labelDy ?? 20)}
              textAnchor={city.labelAnchor ?? 'middle'}
              fontSize="12.5"
              fontWeight={700}
              fontFamily="Georgia, serif"
              fill="#33270f"
              stroke="#f3ead4"
              strokeWidth="3"
              paintOrder="stroke"
              style={{ pointerEvents: 'none' }}
            >
              {city.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default memo(MapBoard);
