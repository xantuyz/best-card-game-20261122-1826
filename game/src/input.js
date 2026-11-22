// EMBERFALL — mouse and keyboard input, translated into game actions.
// The renderer owns the pixels; this module owns the hit-testing. It reports
// what the player did (pick a card, confirm, restart, mute, help) and never
// decides what the game does with it.

import { LAYOUT, SCREEN_HEIGHT, SCREEN_WIDTH } from './config.js';

export const ACTION_PICK = 'pick';
export const ACTION_CONFIRM = 'confirm';
export const ACTION_RESTART = 'restart';
export const ACTION_MUTE = 'mute';
export const ACTION_HELP = 'help';
export const ACTION_PLAY = 'play';
export const ACTION_CLOSE_HELP = 'closeHelp';

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Where a hand of `count` cards sits, so clicks land on the right card.
export function handHitSpots(count, cardW, gap, cardH, handY, liftFor) {
  const total = count * cardW + (count - 1) * gap;
  const startX = SCREEN_WIDTH / 2 - total / 2;
  const spots = [];
  for (let i = 0; i < count; i += 1) {
    const lift = liftFor ? liftFor(i) : 0;
    spots.push({ x: startX + i * (cardW + gap), y: handY + lift, w: cardW, h: cardH, index: i });
  }
  return spots;
}

export function createInput(canvas, buttons, hooks) {
  let hovered = -1;

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * SCREEN_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * SCREEN_HEIGHT,
    };
  }

  function cardAt(point, count) {
    const spots = handHitSpots(count, LAYOUT.cardW, LAYOUT.cardGap, LAYOUT.cardH, LAYOUT.handY, (i) => (hooks.liftFor ? hooks.liftFor(i) : 0));
    for (let i = spots.length - 1; i >= 0; i -= 1) {
      if (pointInRect(point.x, point.y, spots[i])) return i;
    }
    return -1;
  }

  function buttonAt(point) {
    if (pointInRect(point.x, point.y, buttons.help)) return ACTION_HELP;
    if (pointInRect(point.x, point.y, buttons.restart)) return ACTION_RESTART;
    if (pointInRect(point.x, point.y, buttons.mute)) return ACTION_MUTE;
    return null;
  }

  canvas.addEventListener('mousemove', (event) => {
    const point = canvasPoint(event);
    const at = cardAt(point, hooks.handCount());
    if (at !== hovered) {
      hovered = at;
      hooks.onHover(at);
    }
  });

  canvas.addEventListener('mouseleave', () => {
    if (hovered !== -1) {
      hovered = -1;
      hooks.onHover(-1);
    }
  });

  canvas.addEventListener('click', (event) => {
    const point = canvasPoint(event);
    const button = buttonAt(point);
    if (button === ACTION_HELP) {
      hooks.onAction(ACTION_HELP);
      return;
    }
    if (button === ACTION_RESTART) {
      hooks.onAction(ACTION_RESTART);
      return;
    }
    if (button === ACTION_MUTE) {
      hooks.onAction(ACTION_MUTE);
      return;
    }
    if (hooks.onTitleClick && hooks.titleActive()) {
      const playRect = { x: SCREEN_WIDTH / 2 - 130, y: 578, w: 260, h: 62 };
      if (pointInRect(point.x, point.y, playRect)) {
        hooks.onTitleClick();
        return;
      }
    }
    if (hooks.onEndClick && hooks.endActive()) {
      const againRect = { x: SCREEN_WIDTH / 2 - 150, y: 480, w: 300, h: 60 };
      if (pointInRect(point.x, point.y, againRect)) {
        hooks.onEndClick();
        return;
      }
    }
    if (hooks.helpActive && hooks.helpActive()) {
      hooks.onAction(ACTION_CLOSE_HELP);
      return;
    }
    const at = cardAt(point, hooks.handCount());
    if (at >= 0) hooks.onAction(ACTION_PICK, at);
  });

  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (key >= '1' && key <= '9') {
      const index = Number(key) - 1;
      if (index < hooks.handCount()) hooks.onAction(ACTION_PICK, index);
      return;
    }
    if (key === 'enter' || key === ' ') {
      event.preventDefault();
      hooks.onAction(ACTION_CONFIRM);
      return;
    }
    if (key === 'r') hooks.onAction(ACTION_RESTART);
    else if (key === 'm') hooks.onAction(ACTION_MUTE);
    else if (key === 'h') hooks.onAction(ACTION_HELP);
    else if (key === 'escape') hooks.onAction(ACTION_CLOSE_HELP);
  });

  return {
    get hovered() {
      return hovered;
    },
  };
}
