// EMBERFALL — screenshot staging behind ?shot=title|play|win|loss.
// Each scene plays the REAL rules forward from a fixed seed, steered by a
// simple autopilot, so the frame is what a short game genuinely looks like
// and the same seed always gives the same frame. Staging is instant: it
// jumps straight to the finished state instead of waiting for animations.

import { beginRound, effectivePower, finishRound, numberCards, resolveRound, trickCards } from './rules.js';
import { chooseRivalCard } from './ai.js';
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

// The good pilot: for every card it could play (and every trick it could pair
// with it), average the power gap against each card the rival could hold, and
// take the best. It is the same judgement a careful player makes by eye.
export function autopilotPlay(match) {
  const cards = match.playerHand;
  if (cards.length === 0) return null;
  const tricks = trickCards(match.playerHand);
  const rivalPool = match.rivalHand.length > 0 ? match.rivalHand : numberCards(match.playerHand);
  let best = null;
  let bestScore = -Infinity;
  for (const card of cards) {
    const paired = card.kind === 'number'
      ? [null, ...tricks.filter((held) => held.suit === card.suit || held.kind === 'quench')]
      : [null];
    for (const trick of paired) {
      let total = 0;
      for (const rivalCard of rivalPool) {
        const mine = effectivePower({ card, trick }, { card: rivalCard, trick: null });
        const theirs = effectivePower({ card: rivalCard, trick: null }, { card, trick });
        total += mine - theirs;
      }
      const average = total / rivalPool.length;
      const score = average + card.value * 0.01;
      if (score > bestScore) {
        bestScore = score;
        best = { card, trick };
      }
    }
  }
  return best;
}

// The careless pilot: always a middle card, never a trick, never reading the
// tell. It plays like a distracted player — it loses most duels, and slowly
// enough that the loss looks like a real game, not a forfeit.
export function autopilotLose(match) {
  const cards = [...match.playerHand].sort((a, b) => a.value - b.value);
  if (cards.length === 0) return null;
  return { card: cards[Math.floor(cards.length / 2)], trick: null };
}

function playRounds(match, pilot, count) {
  for (let i = 0; i < count && !match.over; i += 1) {
    beginRound(match);
    const mine = pilot(match);
    const theirs = chooseRivalCard(match);
    if (!mine || !theirs) break;
    resolveRound(match, mine, theirs);
    finishRound(match);
    match.phase = 'play';
  }
}

function playUntil(match, pilot, wanted, limit) {
  for (let i = 0; i < limit && !match.over; i += 1) {
    beginRound(match);
    const mine = pilot(match);
    const theirs = chooseRivalCard(match);
    if (!mine || !theirs) break;
    resolveRound(match, mine, theirs);
    finishRound(match);
    if (match.winner === wanted) break;
    match.phase = 'play';
  }
}

// Set `match` to the named scene and say which screen to draw over it.
// title: the fresh duel, untouched. play: five good rounds in, mid-duel.
// win: the good pilot takes the rival lantern. loss: the bad pilot is doused.
export function stageShot(name, match) {
  if (name === 'play') {
    playRounds(match, autopilotPlay, 5);
    // Leave the last trick on the table: the frame shows the reveal, with
    // the rival's tell still readable above its hand.
    match.phase = 'reveal';
    return { screen: SCREEN_PLAY, match };
  }
  if (name === 'win') {
    playUntil(match, autopilotPlay, 'player', 40);
    return { screen: match.winner === 'player' ? SCREEN_WIN : SCREEN_PLAY, match };
  }
  if (name === 'loss') {
    playUntil(match, autopilotLose, 'rival', 40);
    return { screen: match.winner === 'rival' ? SCREEN_LOSS : SCREEN_PLAY, match };
  }
  return { screen: SCREEN_TITLE, match };
}
