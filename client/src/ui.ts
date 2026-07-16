import type { PlayerColor, TrainCard } from '@shared/types';

/** Display colors for player pieces. */
export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
  red: '#d84836',
  blue: '#3f74b8',
  green: '#4d9e58',
  yellow: '#e3bd2e',
  black: '#31353c',
};

export const PLAYER_COLOR_LIGHT: Record<PlayerColor, string> = {
  red: '#f2b3aa',
  blue: '#b5cdea',
  green: '#bcdfc1',
  yellow: '#f3e3a1',
  black: '#b9bec7',
};

/** Fill colors for route segments on the board. */
export const ROUTE_COLOR_HEX: Record<string, string> = {
  red: '#c9503f',
  orange: '#d97f33',
  yellow: '#d3ab2c',
  green: '#4f8f58',
  blue: '#46709f',
  pink: '#c47ba3',
  black: '#3a3e45',
  white: '#e8e2d2',
  gray: '#a49a86',
};

export const CARD_LABEL: Record<TrainCard, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  pink: 'Pink',
  black: 'Black',
  white: 'White',
  locomotive: 'Locomotive',
};

/** Colors for the numbered dashed arcs shown while choosing tickets. */
export const TICKET_PREVIEW_COLORS = ['#b03a8c', '#2d7fb8', '#5b8c2a'];

export const CARD_ORDER: TrainCard[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'pink',
  'black',
  'white',
  'locomotive',
];
