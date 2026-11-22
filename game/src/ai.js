// EMBERFALL — the Rival Keeper, the AI opponent.
// The rival watches which suit the player leans on, saves its big cards while
// it is ahead, and spends its tricks where they change a round. Before the
// player picks, the rival's intent is readable as a short tell — the whole
// point is that a sharp player can answer it.

import { elementalEdge, numberCards, trickCards } from './rules.js';
import { SUITS } from './config.js';

// Count how often the player has played each suit so far.
function favouriteSuit(plays) {
  const counts = { flame: 0, leaf: 0, tide: 0, stone: 0 };
  for (const suit of plays) counts[suit] = (counts[suit] || 0) + 1;
  let best = null;
  let bestCount = 0;
  for (const suit of Object.keys(counts)) {
    if (counts[suit] > bestCount) {
      bestCount = counts[suit];
      best = suit;
    }
  }
  return bestCount > 0 ? best : null;
}

// The suit that beats a given suit on the elemental cycle, or null for Stone.
export function counterSuit(suit) {
  for (const key of Object.keys(SUITS)) {
    if (SUITS[key].beats === suit) return key;
  }
  return null;
}

// Pick the rival's play for this round: a number card, plus a trick when it
// helps. The rival prefers a card whose suit beats the player's favourite,
// holds its 8s and 9s while it is ahead on life, and fires Surge only when
// the edge is really there.
export function chooseRivalCard(match) {
  const numbers = numberCards(match.rivalHand);
  const tricks = trickCards(match.rivalHand);
  if (numbers.length === 0) {
    // Only tricks left: play the strongest trick on its own as a 0-power card.
    if (tricks.length === 0) return null;
    const surge = tricks.find((held) => held.kind === 'surge');
    return { card: surge || tricks[0], trick: null };
  }
  const favourite = favouriteSuit(match.playerPlays);
  const counter = favourite ? counterSuit(favourite) : null;
  const ahead = match.rivalLife - match.playerLife >= 5;

  function score(card) {
    let points = card.value;
    if (counter && card.suit === counter) points += 4;
    if (favourite && card.suit === favourite) points += 1;
    if (ahead && card.value >= 8) points -= 5;
    if (match.rivalLife <= 6 && card.value >= 7) points += 3;
    return points;
  }

  let bestCard = numbers[0];
  for (const card of numbers) {
    if (score(card) > score(bestCard)) bestCard = card;
  }

  let trick = null;
  const surge = tricks.find((held) => held.kind === 'surge' && held.suit === bestCard.suit);
  const quench = tricks.find((held) => held.kind === 'quench');
  if (surge && counter && bestCard.suit === counter) {
    trick = surge;
  } else if (quench && favourite && elementalEdge(favourite, bestCard.suit) === 1) {
    trick = quench;
  }
  return { card: bestCard, trick };
}

// The tell shown above the rival's hand before the player chooses. It names
// the rival's leaning honestly: the suit it is about to favour, or the fact
// that it is sitting on big cards while it leads.
export function rivalTell(match) {
  const ahead = match.rivalLife - match.playerLife >= 5;
  const bigHeld = match.rivalHand.some((card) => card.kind === 'number' && card.value >= 8);
  if (ahead && bigHeld) return 'Rival is hoarding big cards';
  const favourite = favouriteSuit(match.playerPlays);
  if (favourite) {
    const counter = counterSuit(favourite);
    if (counter) return `Rival favours ${SUITS[counter].glyph} ${SUITS[counter].name}`;
  }
  const best = match.rivalHand
    .filter((card) => card.kind === 'number')
    .sort((a, b) => b.value - a.value)[0];
  if (best) return `Rival favours ${SUITS[best.suit].glyph} ${SUITS[best.suit].name}`;
  return 'Rival Keeper is watching…';
}
