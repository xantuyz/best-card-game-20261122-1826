// EMBERFALL — shared constants for the whole game.
// One place owns every number the rules and the renderer both need, so a
// balance tweak never has to be chased through several files.

export const SCREEN_WIDTH = 1280;
export const SCREEN_HEIGHT = 720;

export const LIFE_START = 20;
export const HAND_SIZE = 5;
export const EDGE_BONUS = 3;
export const SURGE_BONUS = 4;

// The four ember spirits. A suit is told apart by colour AND by shape, never
// by text alone, so a card stays readable when it is shrunk to a thumbnail.
export const SUITS = {
  flame: { key: 'flame', name: 'Flame', glyph: '▲', color: '#e5484d', dark: '#8f1d22', beats: 'leaf' },
  leaf: { key: 'leaf', name: 'Leaf', glyph: '◆', color: '#46a758', dark: '#1e5c2e', beats: 'tide' },
  tide: { key: 'tide', name: 'Tide', glyph: '●', color: '#3e9bff', dark: '#144a7d', beats: 'flame' },
  stone: { key: 'stone', name: 'Stone', glyph: '⬢', color: '#f5a524', dark: '#7a5200', beats: null },
};

export const SUIT_KEYS = ['flame', 'leaf', 'tide', 'stone'];

// Number cards run 1-9 for the three elemental suits; Stone carries no edge,
// so it only ever shows up strong, 4-9. Two tricks per suit complete the deck:
// Surge adds power when its suit wins the edge, Quench cancels the rival edge.
export const DECK_SPEC = {
  numberValues: { flame: [1, 2, 3, 4, 5, 6, 7, 8, 9], leaf: [1, 2, 3, 4, 5, 6, 7, 8, 9], tide: [1, 2, 3, 4, 5, 6, 7, 8, 9], stone: [4, 5, 6, 7, 8, 9] },
  tricksPerSuit: ['surge', 'quench'],
};

export const TRICK_NAMES = {
  surge: { name: 'Surge', glyph: '⚡', text: '+4 when its suit wins the edge' },
  quench: { name: 'Quench', glyph: '💧', text: 'Cancels the rival edge this round' },
};

export const PALETTE = {
  dusk: '#241a2e',
  wood: '#3a2b1d',
  felt: '#274d33',
  feltLight: '#2f5d3d',
  cream: '#f5ead6',
  creamDim: '#cbbd9f',
  gold: '#f5a524',
  ink: '#1a120b',
  cardFace: '#fdf6e3',
  cardBack: '#5b2a86',
  shadow: 'rgba(0, 0, 0, 0.45)',
};

export const FONTS = {
  title: "Georgia, 'Times New Roman', serif",
  hud: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};

// Card and table geometry, in the 1280x720 canvas space.
export const LAYOUT = {
  cardW: 132,
  cardH: 186,
  cardGap: 18,
  handY: 500,
  rivalHandY: 26,
  arenaY: 232,
  arenaCardW: 140,
  arenaCardH: 196,
};

export function suitOf(key) {
  return SUITS[key];
}

export function suitColor(key) {
  return SUITS[key].color;
}

export function suitGlyph(key) {
  return SUITS[key].glyph;
}
