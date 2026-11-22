// EMBERFALL — deck building and seeded shuffling.
// Every card the game ever deals comes from here, and the shuffle is driven
// by a tiny seeded generator so a fixed seed always deals the same game.

import { DECK_SPEC, SUIT_KEYS } from './config.js';

// mulberry32: a small, fast, deterministic generator. The same seed always
// produces the same stream, which is what makes screenshot staging repeatable.
export function makeRng(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

let nextCardId = 1;

function numberCard(suit, value) {
  return { id: nextCardId, suit, kind: 'number', value, label: String(value) };
}

function trickCard(suit, trick) {
  return { id: nextCardId, suit, kind: trick, value: 0, label: trick === 'surge' ? 'Surge' : 'Quench' };
}

// Build the full 41-card deck in a fixed order: number cards suit by suit,
// then one Surge and one Quench per suit. Callers shuffle it before dealing.
export function buildDeck() {
  nextCardId = 1;
  const deck = [];
  for (const suit of SUIT_KEYS) {
    for (const value of DECK_SPEC.numberValues[suit]) {
      deck.push(numberCard(suit, value));
    }
  }
  for (const suit of SUIT_KEYS) {
    for (const trick of DECK_SPEC.tricksPerSuit) {
      deck.push(trickCard(suit, trick));
    }
  }
  return deck;
}

// Fisher-Yates, in place, driven by the caller's generator.
export function shuffleDeck(deck, rng) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const held = deck[i];
    deck[i] = deck[j];
    deck[j] = held;
  }
  return deck;
}

// Take the top card, or null when the deck is empty.
export function drawCard(deck) {
  return deck.length > 0 ? deck.pop() : null;
}

export function deckSize(deck) {
  return deck.length;
}
