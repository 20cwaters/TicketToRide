import type { City, Route } from './types';

/**
 * Standard Ticket to Ride USA map: 36 cities and every route from the
 * original board, including all parallel (double) routes.
 * Coordinates place cities on a 1000x620 stylized US map.
 */

export const CITIES: City[] = [
  { id: 'vancouver', name: 'Vancouver', x: 75, y: 62, labelDy: -14 },
  { id: 'seattle', name: 'Seattle', x: 72, y: 128, labelAnchor: 'end', labelDx: -10, labelDy: 4 },
  { id: 'portland', name: 'Portland', x: 58, y: 186, labelAnchor: 'start', labelDx: 9, labelDy: 4 },
  { id: 'sanfrancisco', name: 'San Francisco', x: 42, y: 335, labelAnchor: 'start', labelDx: -14, labelDy: 24 },
  { id: 'losangeles', name: 'Los Angeles', x: 95, y: 430, labelDy: 24, labelDx: -6 },
  { id: 'lasvegas', name: 'Las Vegas', x: 168, y: 368, labelDy: 22 },
  { id: 'calgary', name: 'Calgary', x: 192, y: 42, labelDy: -12 },
  { id: 'helena', name: 'Helena', x: 258, y: 150, labelDy: -12 },
  { id: 'saltlakecity', name: 'Salt Lake City', x: 215, y: 278, labelDy: -12 },
  { id: 'phoenix', name: 'Phoenix', x: 200, y: 442, labelDy: 22 },
  { id: 'santafe', name: 'Santa Fe', x: 305, y: 400, labelDy: -12 },
  { id: 'elpaso', name: 'El Paso', x: 300, y: 497, labelDy: 22 },
  { id: 'denver', name: 'Denver', x: 332, y: 302, labelDy: 22, labelDx: -8 },
  { id: 'winnipeg', name: 'Winnipeg', x: 398, y: 52, labelDy: -12 },
  { id: 'duluth', name: 'Duluth', x: 482, y: 150, labelDy: -12, labelDx: -6 },
  { id: 'omaha', name: 'Omaha', x: 455, y: 255, labelAnchor: 'end', labelDx: -10, labelDy: -6 },
  { id: 'kansascity', name: 'Kansas City', x: 490, y: 318, labelAnchor: 'end', labelDx: -10, labelDy: 13 },
  { id: 'oklahomacity', name: 'Oklahoma City', x: 465, y: 408, labelAnchor: 'end', labelDx: -10, labelDy: 16 },
  { id: 'dallas', name: 'Dallas', x: 482, y: 487, labelAnchor: 'start', labelDx: 10, labelDy: 6 },
  { id: 'houston', name: 'Houston', x: 510, y: 552, labelDy: 22 },
  { id: 'neworleans', name: 'New Orleans', x: 600, y: 538, labelDy: 24 },
  { id: 'littlerock', name: 'Little Rock', x: 545, y: 412, labelAnchor: 'start', labelDx: 10, labelDy: 12 },
  { id: 'saintlouis', name: 'Saint Louis', x: 563, y: 320, labelAnchor: 'start', labelDx: 10, labelDy: 12 },
  { id: 'chicago', name: 'Chicago', x: 595, y: 225, labelDy: -12, labelDx: 8 },
  { id: 'saultstmarie', name: 'Sault St. Marie', x: 620, y: 110, labelDy: -12 },
  { id: 'toronto', name: 'Toronto', x: 698, y: 150, labelDy: -12, labelDx: 8 },
  { id: 'montreal', name: 'Montreal', x: 770, y: 58, labelDy: -12 },
  { id: 'boston', name: 'Boston', x: 865, y: 125, labelAnchor: 'start', labelDx: 10, labelDy: 2 },
  { id: 'newyork', name: 'New York', x: 822, y: 198, labelAnchor: 'start', labelDx: 10, labelDy: 4 },
  { id: 'pittsburgh', name: 'Pittsburgh', x: 715, y: 242, labelDy: -12, labelDx: -6 },
  { id: 'washington', name: 'Washington', x: 828, y: 278, labelAnchor: 'start', labelDx: 10, labelDy: 6 },
  { id: 'raleigh', name: 'Raleigh', x: 778, y: 340, labelAnchor: 'start', labelDx: 10, labelDy: 8 },
  { id: 'nashville', name: 'Nashville', x: 632, y: 370, labelAnchor: 'end', labelDx: -8, labelDy: 10 },
  { id: 'atlanta', name: 'Atlanta', x: 685, y: 418, labelAnchor: 'start', labelDx: 10, labelDy: 10 },
  { id: 'charleston', name: 'Charleston', x: 795, y: 422, labelAnchor: 'start', labelDx: 10, labelDy: 8 },
  { id: 'miami', name: 'Miami', x: 778, y: 572, labelAnchor: 'start', labelDx: 10, labelDy: 4 },
];

interface RouteDef {
  from: string;
  to: string;
  length: number;
  colors: Route['color'][]; // one entry = single route, two = double route
  curve?: number;
}

const ROUTE_DEFS: RouteDef[] = [
  // West coast & mountains
  { from: 'vancouver', to: 'seattle', length: 1, colors: ['gray', 'gray'] },
  { from: 'seattle', to: 'portland', length: 1, colors: ['gray', 'gray'] },
  { from: 'vancouver', to: 'calgary', length: 3, colors: ['gray'] },
  { from: 'seattle', to: 'calgary', length: 4, colors: ['gray'] },
  { from: 'seattle', to: 'helena', length: 6, colors: ['yellow'] },
  { from: 'calgary', to: 'helena', length: 4, colors: ['gray'] },
  { from: 'portland', to: 'sanfrancisco', length: 5, colors: ['green', 'pink'], curve: -18 },
  { from: 'portland', to: 'saltlakecity', length: 6, colors: ['blue'] },
  { from: 'sanfrancisco', to: 'saltlakecity', length: 5, colors: ['orange', 'white'] },
  { from: 'sanfrancisco', to: 'losangeles', length: 3, colors: ['yellow', 'pink'], curve: -14 },
  { from: 'losangeles', to: 'lasvegas', length: 2, colors: ['gray'] },
  { from: 'lasvegas', to: 'saltlakecity', length: 3, colors: ['orange'] },
  { from: 'losangeles', to: 'phoenix', length: 3, colors: ['gray'] },
  { from: 'losangeles', to: 'elpaso', length: 6, colors: ['black'], curve: 26 },
  { from: 'phoenix', to: 'elpaso', length: 3, colors: ['gray'] },
  { from: 'phoenix', to: 'santafe', length: 3, colors: ['gray'] },
  { from: 'phoenix', to: 'denver', length: 5, colors: ['white'] },
  { from: 'saltlakecity', to: 'helena', length: 3, colors: ['pink'] },
  { from: 'saltlakecity', to: 'denver', length: 3, colors: ['red', 'yellow'] },
  { from: 'helena', to: 'denver', length: 4, colors: ['green'] },
  { from: 'calgary', to: 'winnipeg', length: 6, colors: ['white'] },
  { from: 'helena', to: 'winnipeg', length: 4, colors: ['blue'] },
  { from: 'helena', to: 'duluth', length: 6, colors: ['orange'] },
  { from: 'helena', to: 'omaha', length: 5, colors: ['red'] },

  // Southwest & plains
  { from: 'santafe', to: 'elpaso', length: 2, colors: ['gray'] },
  { from: 'santafe', to: 'denver', length: 2, colors: ['gray'] },
  { from: 'santafe', to: 'oklahomacity', length: 3, colors: ['blue'] },
  { from: 'elpaso', to: 'oklahomacity', length: 5, colors: ['yellow'], curve: -16 },
  { from: 'elpaso', to: 'dallas', length: 4, colors: ['red'] },
  { from: 'elpaso', to: 'houston', length: 6, colors: ['green'], curve: 20 },
  { from: 'denver', to: 'omaha', length: 4, colors: ['pink'] },
  { from: 'denver', to: 'kansascity', length: 4, colors: ['black', 'orange'] },
  { from: 'denver', to: 'oklahomacity', length: 4, colors: ['red'] },
  { from: 'winnipeg', to: 'duluth', length: 4, colors: ['black'] },
  { from: 'winnipeg', to: 'saultstmarie', length: 6, colors: ['gray'] },
  { from: 'duluth', to: 'saultstmarie', length: 3, colors: ['gray'] },
  { from: 'duluth', to: 'omaha', length: 2, colors: ['gray', 'gray'] },
  { from: 'duluth', to: 'chicago', length: 3, colors: ['red'] },
  { from: 'duluth', to: 'toronto', length: 6, colors: ['pink'], curve: 26 },
  { from: 'omaha', to: 'chicago', length: 4, colors: ['blue'] },
  { from: 'omaha', to: 'kansascity', length: 1, colors: ['gray', 'gray'] },
  { from: 'kansascity', to: 'saintlouis', length: 2, colors: ['blue', 'pink'] },
  { from: 'kansascity', to: 'oklahomacity', length: 2, colors: ['gray', 'gray'] },
  { from: 'oklahomacity', to: 'dallas', length: 2, colors: ['gray', 'gray'] },
  { from: 'oklahomacity', to: 'littlerock', length: 2, colors: ['gray'] },
  { from: 'dallas', to: 'littlerock', length: 2, colors: ['gray'] },
  { from: 'dallas', to: 'houston', length: 1, colors: ['gray', 'gray'] },
  { from: 'houston', to: 'neworleans', length: 2, colors: ['gray'] },

  // Midwest & south
  { from: 'littlerock', to: 'saintlouis', length: 2, colors: ['gray'] },
  { from: 'littlerock', to: 'nashville', length: 3, colors: ['white'] },
  { from: 'littlerock', to: 'neworleans', length: 3, colors: ['green'] },
  { from: 'saintlouis', to: 'chicago', length: 2, colors: ['green', 'white'] },
  { from: 'saintlouis', to: 'pittsburgh', length: 5, colors: ['green'], curve: -14 },
  { from: 'saintlouis', to: 'nashville', length: 2, colors: ['gray'] },
  { from: 'chicago', to: 'pittsburgh', length: 3, colors: ['orange', 'black'] },
  { from: 'chicago', to: 'toronto', length: 4, colors: ['white'] },
  { from: 'neworleans', to: 'atlanta', length: 4, colors: ['yellow', 'orange'] },
  { from: 'neworleans', to: 'miami', length: 6, colors: ['red'], curve: 24 },

  // East
  { from: 'saultstmarie', to: 'toronto', length: 2, colors: ['gray'] },
  { from: 'saultstmarie', to: 'montreal', length: 5, colors: ['black'] },
  { from: 'toronto', to: 'montreal', length: 3, colors: ['gray'] },
  { from: 'toronto', to: 'pittsburgh', length: 2, colors: ['gray'] },
  { from: 'montreal', to: 'boston', length: 2, colors: ['gray', 'gray'] },
  { from: 'montreal', to: 'newyork', length: 3, colors: ['blue'] },
  { from: 'boston', to: 'newyork', length: 2, colors: ['yellow', 'red'] },
  { from: 'newyork', to: 'pittsburgh', length: 2, colors: ['white', 'green'] },
  { from: 'newyork', to: 'washington', length: 2, colors: ['orange', 'black'] },
  { from: 'pittsburgh', to: 'washington', length: 2, colors: ['gray'] },
  { from: 'pittsburgh', to: 'nashville', length: 4, colors: ['yellow'] },
  { from: 'pittsburgh', to: 'raleigh', length: 2, colors: ['gray'] },
  { from: 'washington', to: 'raleigh', length: 2, colors: ['gray', 'gray'] },
  { from: 'nashville', to: 'atlanta', length: 1, colors: ['gray'] },
  { from: 'nashville', to: 'raleigh', length: 3, colors: ['black'] },
  { from: 'raleigh', to: 'atlanta', length: 2, colors: ['gray', 'gray'] },
  { from: 'raleigh', to: 'charleston', length: 2, colors: ['gray'] },
  { from: 'atlanta', to: 'charleston', length: 2, colors: ['gray'] },
  { from: 'atlanta', to: 'miami', length: 5, colors: ['blue'] },
  { from: 'charleston', to: 'miami', length: 4, colors: ['pink'] },
];

function buildRoutes(): Route[] {
  const routes: Route[] = [];
  for (const def of ROUTE_DEFS) {
    const pairId = def.colors.length > 1 ? `${def.from}-${def.to}` : undefined;
    def.colors.forEach((color, i) => {
      routes.push({
        id: `${def.from}-${def.to}-${i}`,
        from: def.from,
        to: def.to,
        length: def.length,
        color,
        pairId,
        curve: def.curve,
      });
    });
  }
  return routes;
}

export const ROUTES: Route[] = buildRoutes();

export const CITY_BY_ID: Record<string, City> = Object.fromEntries(
  CITIES.map((c) => [c.id, c]),
);

export const ROUTE_BY_ID: Record<string, Route> = Object.fromEntries(
  ROUTES.map((r) => [r.id, r]),
);

export function cityName(id: string): string {
  return CITY_BY_ID[id]?.name ?? id;
}
