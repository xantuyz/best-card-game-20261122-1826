// EMBERFALL — the rules of a duel, as pure logic with no drawing or input.
// A match is a plain object; every function here only reads and writes it,
// so the same code can be driven by a human, by the AI, or by a headless
// simulation in node. That is also how the screenshot staging plays the game.

import { EDGE_BONUS, HAND_SIZE, LIFE_START, SUITS, SURGE_BONUS } from './config.js';
import { buildDeck, drawCard, makeRng, shuffleDeck } from './deck.js';

// 1 when suitA beats suitB on the elemental cycle, -1 when it loses, 0 when
// neither has an edge (a tie, or Stone on either side).
export function elementalEdge(suitA, suitB) {
  if (suitA === suitB) return 0;
  if (SUITS[suitA].beats === suitB) return 1;
  if (SUITS[suitB].beats === suitA) return -1;
  return 0;
}

// A play is { card, trick } where trick is a trick card played alongside the
// number card, or null. A trick card may also be played on its own as a
// 0-power card: then it counts as its own trick, so a lone Surge still adds
// its bonus when its suit wins the edge, and a lone Quench still cancels the
// rival edge. Power = value + edge bonus + Surge bonus, with Quench able to
// cancel the other side's edge (and therefore its Surge too).
export function effectivePower(play, rivalPlay) {
  if (!play || !play.card) return 0;
  const trick = play.trick || (play.card.kind !== 'number' ? play.card : null);
  const edge = elementalEdge(play.card.suit, rivalPlay.card.suit);
  const rivalQuenched = rivalPlay.trick && rivalPlay.trick.kind === 'quench';
  const rivalTrickAlone = rivalPlay.card.kind !== 'number' && rivalPlay.card.kind === 'quench';
  const myEdge = edge === 1 && !rivalQuenched && !rivalTrickAlone ? EDGE_BONUS : 0;
  const surge = trick && trick.kind === 'surge' && edge === 1 && !rivalQuenched && !rivalTrickAlone ? SURGE_BONUS : 0;
  return play.card.value + myEdge + surge;
}

export function describeEdge(play, rivalPlay) {
  const edge = elementalEdge(play.card.suit, rivalPlay.card.suit);
  if (edge === 0) return '';
  const winner = edge === 1 ? play : rivalPlay;
  const loser = edge === 1 ? rivalPlay : play;
  return `${SUITS[winner.card.suit].name} beats ${SUITS[loser.card.suit].name} (+${EDGE_BONUS})`;
}

// A fresh match: shuffled deck, five cards each, both lanterns at full life.
export function createMatch(seed) {
  const rng = makeRng(seed);
  const deck = shuffleDeck(buildDeck(), rng);
  const match = {
    seed,
    rng,
    deck,
    playerHand: [],
    rivalHand: [],
    playerLife: LIFE_START,
    rivalLife: LIFE_START,
    round: 1,
    phase: 'title',
    playerPlays: [],
    rivalPlays: [],
    lastRound: null,
    winner: null,
    over: false,
    overtime: false,
  };
  for (let i = 0; i < HAND_SIZE; i += 1) {
    match.playerHand.push(drawCard(deck));
    match.rivalHand.push(drawCard(deck));
  }
  return match;
}

// At the start of a round each side draws one card while the deck lasts.
export function beginRound(match) {
  if (match.over) return;
  const mine = drawCard(match.deck);
  const theirs = drawCard(match.deck);
  if (mine) match.playerHand.push(mine);
  if (theirs) match.rivalHand.push(theirs);
  match.phase = 'play';
}

function removeFromHand(hand, card) {
  const at = hand.findIndex((held) => held.id === card.id);
  if (at >= 0) hand.splice(at, 1);
}

// Play one round: both plays are revealed together, powers are compared, and
// the loser of the trick loses life equal to the power gap. A tied trick
// deals no damage and both sides draw one extra card.
export function resolveRound(match, playerPlay, rivalPlay) {
  removeFromHand(match.playerHand, playerPlay.card);
  removeFromHand(match.rivalHand, rivalPlay.card);
  if (playerPlay.trick) removeFromHand(match.playerHand, playerPlay.trick);
  if (rivalPlay.trick) removeFromHand(match.rivalHand, rivalPlay.trick);

  const playerPower = effectivePower(playerPlay, rivalPlay);
  const rivalPower = effectivePower(rivalPlay, playerPlay);
  const gap = playerPower - rivalPower;
  let outcome = 'tie';
  let damage = 0;
  if (gap > 0) {
    outcome = 'player';
    damage = gap;
    match.rivalLife = Math.max(0, match.rivalLife - damage);
  } else if (gap < 0) {
    outcome = 'rival';
    damage = -gap;
    match.playerLife = Math.max(0, match.playerLife - damage);
  } else {
    const extraMine = drawCard(match.deck);
    const extraTheirs = drawCard(match.deck);
    if (extraMine) match.playerHand.push(extraMine);
    if (extraTheirs) match.rivalHand.push(extraTheirs);
  }

  match.playerPlays.push(playerPlay.card.suit);
  match.rivalPlays.push(rivalPlay.card.suit);
  match.lastRound = {
    round: match.round,
    playerPlay,
    rivalPlay,
    playerPower,
    rivalPower,
    outcome,
    damage,
    edgeText: describeEdge(playerPlay, rivalPlay),
  };
  match.round += 1;
  match.phase = 'reveal';
  return match.lastRound;
}

// Is the match finished, and who holds the lantern? A life of zero ends it
// at once. When the deck is gone and a side cannot play, the higher life
// wins; an exact tie is broken by hand size, then by hand power, and finally
// the lantern favours the challenger — so a duel never ends in a draw.
export function decideWinner(match) {
  if (match.playerLife <= 0 && match.rivalLife <= 0) return 'player';
  if (match.playerLife <= 0) return 'rival';
  if (match.rivalLife <= 0) return 'player';
  const deckEmpty = match.deck.length === 0;
  const handsEmpty = match.playerHand.length === 0 && match.rivalHand.length === 0;
  const oneSideStuck = deckEmpty && (match.playerHand.length === 0 || match.rivalHand.length === 0);
  if (deckEmpty && (handsEmpty || oneSideStuck)) {
    if (match.playerLife !== match.rivalLife) return match.playerLife > match.rivalLife ? 'player' : 'rival';
    if (match.playerHand.length !== match.rivalHand.length) return match.playerHand.length > match.rivalHand.length ? 'player' : 'rival';
    const myPower = match.playerHand.reduce((sum, card) => sum + card.value, 0);
    const theirPower = match.rivalHand.reduce((sum, card) => sum + card.value, 0);
    if (myPower !== theirPower) return myPower > theirPower ? 'player' : 'rival';
    return 'player';
  }
  return null;
}

// Advance the match after a round: mark it over when a winner is decided.
export function finishRound(match) {
  const winner = decideWinner(match);
  if (winner) {
    match.winner = winner;
    match.over = true;
    match.phase = winner === 'player' ? 'win' : 'loss';
  } else {
    match.phase = 'play';
  }
  return match.over;
}

export function canPlay(match) {
  return !match.over && match.playerHand.length > 0;
}

export function numberCards(hand) {
  return hand.filter((card) => card.kind === 'number');
}

export function trickCards(hand) {
  return hand.filter((card) => card.kind !== 'number');
}
