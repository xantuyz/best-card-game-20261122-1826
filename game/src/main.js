// EMBERFALL — boot, the one game loop, and the screen state machine.
// A duel moves TITLE -> PLAY -> (REVEAL) -> PLAY ... -> WIN or LOSS.
// ?seed=N fixes the deal. ?shot=title|play|win|loss (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady so a screenshot can be taken of the finished frame.

import { beginRound, createMatch, finishRound, resolveRound } from './rules.js';
import { chooseRivalCard, rivalTell } from './ai.js';
import { ACTION_CLOSE_HELP, ACTION_CONFIRM, ACTION_HELP, ACTION_MUTE, ACTION_PICK, ACTION_RESTART, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const REVEAL_MS = 1800;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const renderer = createRenderer(canvas);

const BUTTONS = {
  help: { x: 910, y: 12, w: 140, h: 34 },
  restart: { x: 1060, y: 12, w: 110, h: 34 },
  mute: { x: 1180, y: 12, w: 100, h: 34 },
};

let match = createMatch(seed);
let screen = SCREEN_TITLE;
let previousScreen = SCREEN_PLAY;
let selected = null;
let hovered = -1;
let armedTrick = null;
let revealUntil = 0;
let lastFrame = performance.now();

const view = {
  match,
  screen,
  selected,
  hovered,
  armedTrick,
  tell: '',
  muted: false,
  buttons: BUTTONS,
  dt: 0,
};

function syncView() {
  view.match = match;
  view.screen = screen;
  view.selected = selected;
  view.hovered = hovered;
  view.armedTrick = armedTrick;
  view.muted = audio.muted;
  view.tell = screen === SCREEN_PLAY && (match.phase === 'play' || match.phase === 'reveal') ? rivalTell(match) : '';
}

function announce(message) {
  status.textContent = message;
}

function startGame(freshSeed) {
  match = createMatch(freshSeed ?? Math.floor(Math.random() * 4294967296));
  screen = SCREEN_PLAY;
  selected = null;
  hovered = -1;
  armedTrick = null;
  match.phase = 'play';
  beginRound(match);
  audio.playDeal();
  announce(`Round 1. Your turn — play a card.`);
  syncView();
}

function endGame() {
  screen = match.winner === 'player' ? SCREEN_WIN : SCREEN_LOSS;
  if (match.winner === 'player') {
    audio.playGameWin();
    renderer.spawnEmbers(48, match.seed);
    announce(`You win. Final score ${match.playerLife} to ${match.rivalLife}.`);
  } else {
    audio.playGameLose();
    announce(`Rival Keeper wins. Final score ${match.playerLife} to ${match.rivalLife}.`);
  }
  syncView();
}

function confirmPlay() {
  if (screen !== SCREEN_PLAY || match.phase !== 'play' || selected === null) return;
  const card = match.playerHand[selected];
  if (!card) return;
  const mine = { card, trick: armedTrick };
  const theirs = chooseRivalCard(match);
  if (!theirs) return;
  audio.playFlip();
  const result = resolveRound(match, mine, theirs);
  if (result.outcome === 'player') audio.playRoundWin();
  else if (result.outcome === 'rival') audio.playRoundLose();
  selected = null;
  armedTrick = null;
  revealUntil = performance.now() + REVEAL_MS;
  announce(
    result.outcome === 'tie'
      ? `Round ${result.round} tied at ${result.playerPower} — no damage.`
      : `Round ${result.round}: ${result.playerPower} vs ${result.rivalPower} — ${result.outcome === 'player' ? 'you take the trick' : 'Rival takes the trick'}, ${result.damage} damage.`,
  );
  syncView();
}

function afterReveal() {
  if (finishRound(match)) {
    endGame();
    return;
  }
  beginRound(match);
  syncView();
}

function pickCard(index) {
  if (screen !== SCREEN_PLAY || match.phase !== 'play') return;
  const card = match.playerHand[index];
  if (!card) return;
  if (card.kind !== 'number') {
    const numbersLeft = match.playerHand.some((held) => held.kind === 'number');
    if (!numbersLeft) {
      // Nothing but tricks left: a trick may be played on its own.
      if (selected === index) {
        confirmPlay();
        return;
      }
      selected = index;
      announce(`Picked ${card.label} of ${card.suit}. Press Enter to play it.`);
      syncView();
      return;
    }
    armedTrick = armedTrick && armedTrick.id === card.id ? null : card;
    announce(armedTrick ? `${card.label} armed — now pick a number card.` : 'Trick disarmed.');
    syncView();
    return;
  }
  if (selected === index) {
    confirmPlay();
    return;
  }
  selected = index;
  announce(`Picked ${card.label} of ${card.suit}. Press Enter to play it.`);
  syncView();
}

function handleAction(action, index) {
  if (action === ACTION_HELP) {
    if (screen === 'help') {
      screen = previousScreen;
    } else {
      previousScreen = screen;
      screen = 'help';
    }
    syncView();
    return;
  }
  if (action === ACTION_CLOSE_HELP) {
    if (screen === 'help') screen = previousScreen;
    syncView();
    return;
  }
  if (action === ACTION_MUTE) {
    audio.toggleMute();
    syncView();
    return;
  }
  if (action === ACTION_RESTART) {
    startGame();
    return;
  }
  if (screen === SCREEN_TITLE && action === ACTION_CONFIRM) {
    startGame();
    return;
  }
  if ((screen === SCREEN_WIN || screen === SCREEN_LOSS) && action === ACTION_CONFIRM) {
    startGame();
    return;
  }
  if (action === ACTION_PICK) pickCard(index);
  else if (action === ACTION_CONFIRM) confirmPlay();
}

createInput(canvas, BUTTONS, {
  handCount: () => (screen === SCREEN_PLAY && match.phase === 'play' ? match.playerHand.length : 0),
  liftFor: (i) => (selected === i ? -34 : hovered === i ? -18 : 0),
  onHover: (at) => {
    hovered = at;
    syncView();
  },
  onAction: handleAction,
  titleActive: () => screen === SCREEN_TITLE,
  onTitleClick: () => startGame(),
  endActive: () => screen === SCREEN_WIN || screen === SCREEN_LOSS,
  onEndClick: () => startGame(),
  helpActive: () => screen === 'help',
});

function runShot(name) {
  const staged = stageShot(name, match);
  screen = staged.screen;
  match = staged.match;
  if (screen === SCREEN_WIN) renderer.spawnEmbers(48, match.seed);
  selected = null;
  hovered = -1;
  armedTrick = null;
  syncView();
  view.dt = 0.4;
  let painted = 0;
  function paint() {
    renderer.draw(view);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  announce('Emberfall. Press Enter or click PLAY to start.');
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - lastFrame) / 1000, 0.25);
    lastFrame = now;
    if (screen === SCREEN_PLAY && match.phase === 'reveal' && now >= revealUntil) {
      afterReveal();
    }
    view.dt = dt;
    syncView();
    renderer.draw(view);
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
