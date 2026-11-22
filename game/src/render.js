// EMBERFALL — everything the player sees, drawn on one canvas.
// No images, no webfonts, no network: every card, shape and glow is painted
// here with canvas paths, so the game looks the same wherever it is opened.

import { FONTS, LAYOUT, PALETTE, SCREEN_HEIGHT, SCREEN_WIDTH, SUITS, TRICK_NAMES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const TAU = Math.PI * 2;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The suit's shape, drawn as a path so colour and form carry the suit even
// when the card is small: triangle, diamond, circle, hexagon.
export function drawSuitShape(ctx, suitKey, cx, cy, size, color) {
  const suit = SUITS[suitKey];
  ctx.fillStyle = color || suit.color;
  ctx.beginPath();
  if (suitKey === 'flame') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.95, cy + size * 0.75);
    ctx.lineTo(cx - size * 0.95, cy + size * 0.75);
  } else if (suitKey === 'leaf') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.8, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.8, cy);
  } else if (suitKey === 'tide') {
    ctx.arc(cx, cy, size * 0.85, 0, TAU);
  } else {
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = cx + Math.cos(angle) * size;
      const py = cy + Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawLantern(ctx, cx, cy, size, lit) {
  const glow = ctx.createRadialGradient(cx, cy, size * 0.2, cx, cy, size * 2.4);
  glow.addColorStop(0, lit ? 'rgba(245, 165, 36, 0.85)' : 'rgba(120, 120, 140, 0.25)');
  glow.addColorStop(1, 'rgba(245, 165, 36, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - size * 2.4, cy - size * 2.4, size * 4.8, size * 4.8);
  ctx.fillStyle = lit ? '#f5a524' : '#5a5470';
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, TAU);
  ctx.fill();
  ctx.fillStyle = lit ? '#ffe9b0' : '#3a3450';
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.55);
  ctx.quadraticCurveTo(cx + size * 0.5, cy, cx, cy + size * 0.55);
  ctx.quadraticCurveTo(cx - size * 0.5, cy, cx, cy - size * 0.55);
  ctx.fill();
  ctx.strokeStyle = lit ? '#8a5a00' : '#2c2740';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.7, cy - size * 1.25);
  ctx.lineTo(cx + size * 0.7, cy - size * 1.25);
  ctx.stroke();
}

function drawCardFace(ctx, card, x, y, w, h) {
  const suit = SUITS[card.suit];
  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = PALETTE.cardFace;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, 12);
  const border = card.kind === 'number' ? suit.color : PALETTE.gold;
  ctx.lineWidth = card.kind === 'number' ? 4 : 6;
  ctx.strokeStyle = border;
  ctx.stroke();

  if (card.kind === 'number') {
    ctx.fillStyle = suit.color;
    ctx.font = `bold ${Math.round(w * 0.32)}px ${FONTS.hud}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(card.value), x + w * 0.09, y + h * 0.04);
    drawSuitShape(ctx, card.suit, x + w * 0.2, y + h * 0.24, w * 0.11, suit.color);
    drawSuitShape(ctx, card.suit, x + w / 2, y + h * 0.52, w * 0.26, suit.color);
    ctx.fillStyle = suit.dark;
    ctx.font = `bold ${Math.round(w * 0.13)}px ${FONTS.hud}`;
    ctx.textAlign = 'center';
    ctx.fillText(suit.name.toUpperCase(), x + w / 2, y + h * 0.82);
    ctx.fillStyle = suit.color;
    ctx.font = `bold ${Math.round(w * 0.2)}px ${FONTS.hud}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(card.value), x + w * 0.93, y + h * 0.97);
  } else {
    const trick = TRICK_NAMES[card.kind];
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold ${Math.round(w * 0.3)}px ${FONTS.hud}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(trick.glyph, x + w / 2, y + h * 0.06);
    ctx.fillStyle = suit.color;
    ctx.font = `bold ${Math.round(w * 0.17)}px ${FONTS.hud}`;
    ctx.fillText(trick.name.toUpperCase(), x + w / 2, y + h * 0.34);
    drawSuitShape(ctx, card.suit, x + w / 2, y + h * 0.56, w * 0.2, suit.color);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `${Math.round(w * 0.105)}px ${FONTS.hud}`;
    const words = trick.text.split(' ');
    let line = '';
    let lineY = y + h * 0.74;
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width > w * 0.86 && line) {
        ctx.fillText(line, x + w / 2, lineY);
        line = word;
        lineY += h * 0.09;
      } else {
        line = trial;
      }
    }
    ctx.fillText(line, x + w / 2, lineY);
  }
}

function drawCardBack(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = PALETTE.shadow;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fillStyle = PALETTE.cardBack;
  ctx.fill();
  ctx.restore();
  roundRect(ctx, x, y, w, h, 12);
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 8);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(245, 165, 36, 0.7)';
  ctx.stroke();
  drawLantern(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.16, true);
}

function drawLifeBar(ctx, x, y, w, label, life, max, alignRight) {
  ctx.textAlign = alignRight ? 'right' : 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.cream;
  ctx.font = `bold 26px ${FONTS.hud}`;
  ctx.fillText(`${label}  ♥ ${life}`, alignRight ? x + w : x, y + 24);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  roundRect(ctx, x, y + 32, w, 16, 8);
  ctx.fill();
  const fillW = Math.max(0, (w * life) / max);
  ctx.fillStyle = life > 6 ? '#46a758' : '#e5484d';
  if (fillW > 0) {
    roundRect(ctx, x, y + 32, fillW, 16, 8);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(245, 234, 214, 0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y + 32, w, 16, 8);
  ctx.stroke();
}

function drawButton(ctx, rect, label, active) {
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fillStyle = active ? PALETTE.gold : 'rgba(245, 234, 214, 0.14)';
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = active ? PALETTE.ink : PALETTE.cream;
  ctx.font = `bold 17px ${FONTS.hud}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
}

function handLayout(count, cardW, gap, centreX) {
  const total = count * cardW + (count - 1) * gap;
  const startX = centreX - total / 2;
  const spots = [];
  for (let i = 0; i < count; i += 1) spots.push(startX + i * (cardW + gap));
  return spots;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = SCREEN_WIDTH;
  canvas.height = SCREEN_HEIGHT;
  const particles = [];

  function spawnEmbers(count, seed) {
    particles.length = 0;
    let state = (seed >>> 0) || 7;
    const rand = () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let v = state;
      v = Math.imul(v ^ (v >>> 15), v | 1);
      v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
      return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
    };
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: 240 + rand() * 800,
        y: 560 + rand() * 120,
        vy: -(30 + rand() * 70),
        vx: (rand() - 0.5) * 24,
        size: 2 + rand() * 4,
        life: 0.6 + rand() * 1.4,
        age: rand() * 0.5,
      });
    }
  }

  function drawBackground() {
    ctx.fillStyle = PALETTE.dusk;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = PALETTE.felt;
    ctx.beginPath();
    ctx.ellipse(SCREEN_WIDTH / 2, 400, 620, 300, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(SCREEN_WIDTH / 2, 400, 620, 300, 0, 0, TAU);
    ctx.stroke();
  }

  function drawRivalHand(match, view) {
    const cardW = 96;
    const cardH = 134;
    const spots = handLayout(match.rivalHand.length, cardW, 12, SCREEN_WIDTH / 2);
    for (let i = 0; i < match.rivalHand.length; i += 1) {
      drawCardBack(ctx, spots[i], LAYOUT.rivalHandY, cardW, cardH);
    }
    ctx.fillStyle = PALETTE.creamDim;
    ctx.font = `15px ${FONTS.hud}`;
    ctx.textAlign = 'center';
    ctx.fillText(`${match.rivalHand.length} cards in hand`, SCREEN_WIDTH / 2, LAYOUT.rivalHandY + cardH + 20);
    if (view.screen === SCREEN_PLAY && (match.phase === 'play' || match.phase === 'reveal')) {
      const tell = view.tell || '';
      ctx.font = `bold 19px ${FONTS.hud}`;
      const tw = ctx.measureText(tell).width + 36;
      const bx = SCREEN_WIDTH / 2 - tw / 2;
      const by = LAYOUT.rivalHandY + cardH + 34;
      roundRect(ctx, bx, by, tw, 34, 17);
      ctx.fillStyle = 'rgba(26, 18, 11, 0.85)';
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tell, SCREEN_WIDTH / 2, by + 18);
    }
  }

  function drawPlayerHand(match, view) {
    const cardW = LAYOUT.cardW;
    const cardH = LAYOUT.cardH;
    const spots = handLayout(match.playerHand.length, cardW, LAYOUT.cardGap, SCREEN_WIDTH / 2);
    for (let i = 0; i < match.playerHand.length; i += 1) {
      const card = match.playerHand[i];
      const lift = view.selected === i ? -34 : view.hovered === i ? -18 : 0;
      const y = LAYOUT.handY + lift;
      if (view.armedTrick && view.armedTrick.id === card.id) {
        ctx.save();
        ctx.shadowColor = PALETTE.gold;
        ctx.shadowBlur = 22;
        drawCardFace(ctx, card, spots[i], y, cardW, cardH);
        ctx.restore();
      } else {
        drawCardFace(ctx, card, spots[i], y, cardW, cardH);
      }
      if (view.selected === i) {
        roundRect(ctx, spots[i] - 4, y - 4, cardW + 8, cardH + 8, 14);
        ctx.lineWidth = 4;
        ctx.strokeStyle = PALETTE.gold;
        ctx.stroke();
      }
      ctx.fillStyle = PALETTE.creamDim;
      ctx.font = `bold 15px ${FONTS.hud}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), spots[i] + cardW / 2, LAYOUT.handY + cardH + 20);
    }
  }

  function drawArena(match, view) {
    const last = match.lastRound;
    if (!last || match.phase !== 'reveal') return;
    const w = LAYOUT.arenaCardW;
    const h = LAYOUT.arenaCardH;
    const y = LAYOUT.arenaY;
    const gap = 90;
    const leftX = SCREEN_WIDTH / 2 - w - gap / 2;
    const rightX = SCREEN_WIDTH / 2 + gap / 2;
    drawCardFace(ctx, last.playerPlay.card, leftX, y, w, h);
    if (last.playerPlay.trick) {
      drawCardFace(ctx, last.playerPlay.trick, leftX + w - 34, y - 26, 68, 96);
    }
    drawCardFace(ctx, last.rivalPlay.card, rightX, y, w, h);
    if (last.rivalPlay.trick) {
      drawCardFace(ctx, last.rivalPlay.trick, rightX + w - 34, y - 26, 68, 96);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `bold 44px ${FONTS.hud}`;
    ctx.fillText(String(last.playerPower), leftX + w / 2, y - 34);
    ctx.fillText(String(last.rivalPower), rightX + w / 2, y - 34);
    ctx.font = `bold 20px ${FONTS.hud}`;
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(last.edgeText || 'No edge — even suits', SCREEN_WIDTH / 2, y + h + 26);
    const result = last.outcome === 'player'
      ? `You win the trick — Rival loses ${last.damage}`
      : last.outcome === 'rival'
        ? `Rival wins the trick — you lose ${last.damage}`
        : 'Tied trick — no damage, both draw one';
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `bold 22px ${FONTS.hud}`;
    ctx.fillText(result, SCREEN_WIDTH / 2, y + h + 52);
    if (view.armedTrick) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `bold 18px ${FONTS.hud}`;
      ctx.fillText('Trick armed — now pick a number card to play it with', SCREEN_WIDTH / 2, y + h + 92);
    }
  }

  function drawHud(match, view) {
    drawLifeBar(ctx, 28, 18, 250, 'RIVAL KEEPER', match.rivalLife, 20, false);
    drawLifeBar(ctx, 28, SCREEN_HEIGHT - 84, 250, 'YOU', match.playerLife, 20, false);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `bold 24px ${FONTS.hud}`;
    ctx.textAlign = 'left';
    ctx.fillText(`ROUND ${match.round}`, 28, 96);
    ctx.fillStyle = PALETTE.creamDim;
    ctx.font = `17px ${FONTS.hud}`;
    ctx.fillText(`Deck: ${match.deck.length} cards left`, 28, 122);
    drawButton(ctx, view.buttons.help, 'How to Play (H)', view.screen === 'help');
    drawButton(ctx, view.buttons.restart, 'Restart (R)', false);
    drawButton(ctx, view.buttons.mute, view.muted ? 'Muted (M)' : 'Sound (M)', view.muted);
    if (view.screen === SCREEN_PLAY && match.phase === 'play') {
      ctx.fillStyle = PALETTE.cream;
      ctx.font = `bold 20px ${FONTS.hud}`;
      ctx.textAlign = 'center';
      ctx.fillText(
        view.selected === null && !view.armedTrick
          ? 'Your turn — click a card, or press 1–5, then Enter'
          : view.armedTrick
            ? 'Trick armed — click a number card to play them together'
            : 'Card chosen — press Enter or click it again to play',
        SCREEN_WIDTH / 2,
        LAYOUT.handY - 26,
      );
    }
  }

  function drawTitle(match) {
    drawBackground();
    drawLantern(ctx, SCREEN_WIDTH / 2, 118, 34, true);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 96px ${FONTS.title}`;
    ctx.fillText('EMBERFALL', SCREEN_WIDTH / 2, 250);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `italic 32px ${FONTS.title}`;
    ctx.fillText('Duel of the Last Lanterns', SCREEN_WIDTH / 2, 296);
    const samples = [
      { suit: 'flame', kind: 'number', value: 7, label: '7' },
      { suit: 'leaf', kind: 'number', value: 5, label: '5' },
      { suit: 'tide', kind: 'number', value: 9, label: '9' },
      { suit: 'stone', kind: 'number', value: 8, label: '8' },
    ];
    const spots = handLayout(4, 110, 22, SCREEN_WIDTH / 2);
    for (let i = 0; i < samples.length; i += 1) {
      drawCardFace(ctx, samples[i], spots[i], 330, 110, 154);
    }
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `21px ${FONTS.hud}`;
    ctx.fillText('Play a card  ·  Win the trick  ·  Douse their light', SCREEN_WIDTH / 2, 522);
    ctx.fillStyle = PALETTE.creamDim;
    ctx.font = `18px ${FONTS.hud}`;
    ctx.fillText('Flame beats Leaf · Leaf beats Tide · Tide beats Flame · Stone stands alone', SCREEN_WIDTH / 2, 552);
    roundRect(ctx, SCREEN_WIDTH / 2 - 130, 578, 260, 62, 12);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 28px ${FONTS.hud}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('▶  PLAY', SCREEN_WIDTH / 2, 610);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.creamDim;
    ctx.font = `13px ${FONTS.hud}`;
    ctx.fillText('A complete card game: title · table · win · loss — real renders of this code.', SCREEN_WIDTH / 2, 668);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `bold 19px ${FONTS.hud}`;
    ctx.fillText('You  ♥ 20        Rival Keeper  ♥ 20', SCREEN_WIDTH / 2, 692);
  }

  function drawEnd(match, won) {
    drawBackground();
    ctx.fillStyle = 'rgba(20, 12, 28, 0.72)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    drawLantern(ctx, SCREEN_WIDTH / 2, 150, 46, won);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? PALETTE.gold : '#9aa3b2';
    ctx.font = `bold 84px ${FONTS.title}`;
    ctx.fillText(won ? 'YOU WIN' : 'THE LIGHT FADES', SCREEN_WIDTH / 2, 280);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `italic 30px ${FONTS.title}`;
    ctx.fillText(
      won ? 'The last lantern is yours.' : 'Rival Keeper takes the lantern.',
      SCREEN_WIDTH / 2,
      352,
    );
    ctx.font = `bold 26px ${FONTS.hud}`;
    ctx.fillText(`Final score — You ${match.playerLife}  ·  Rival ${match.rivalLife}  ·  Round ${match.round - 1}`, SCREEN_WIDTH / 2, 406);
    ctx.fillStyle = PALETTE.creamDim;
    ctx.font = `19px ${FONTS.hud}`;
    ctx.fillText(won ? 'Every ember you saved still burns.' : 'The embers scatter. Deal again and take it back.', SCREEN_WIDTH / 2, 440);
    roundRect(ctx, SCREEN_WIDTH / 2 - 150, 480, 300, 60, 12);
    ctx.fillStyle = PALETTE.gold;
    ctx.fill();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = `bold 26px ${FONTS.hud}`;
    ctx.textBaseline = 'middle';
    ctx.fillText('↻  PLAY AGAIN', SCREEN_WIDTH / 2, 511);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.creamDim;
    ctx.font = `16px ${FONTS.hud}`;
    ctx.fillText('Press R to play again', SCREEN_WIDTH / 2, 580);
  }

  function drawHelp() {
    ctx.fillStyle = 'rgba(20, 12, 28, 0.88)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 44px ${FONTS.title}`;
    ctx.fillText('HOW TO PLAY', SCREEN_WIDTH / 2, 110);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = `21px ${FONTS.hud}`;
    const lines = [
      'Each round you and the Rival Keeper play one card, revealed together.',
      'Higher power wins the trick; the loser loses life equal to the gap.',
      'Flame beats Leaf, Leaf beats Tide, Tide beats Flame: +3 power.',
      'Stone has no edge, but its cards run high (4–9).',
      'Surge (+4) fires when its suit wins the edge. Quench cancels the rival edge.',
      'Click a trick card first, then a number card, to play them together.',
      'Watch the tell above the rival hand — it shows what the Keeper favours.',
      'Win by bringing the rival lantern to 0, or by leading when the deck runs out.',
      '',
      'Keys: 1–5 pick a card · Enter play · R restart · M mute · H help · Esc close',
    ];
    lines.forEach((line, i) => ctx.fillText(line, SCREEN_WIDTH / 2, 168 + i * 38));
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 22px ${FONTS.hud}`;
    ctx.fillText('Click anywhere or press H to return', SCREEN_WIDTH / 2, 168 + lines.length * 38 + 12);
  }

  function drawParticles(dt) {
    for (const p of particles) {
      p.age += dt;
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      const alpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = `rgba(245, 165, 36, ${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, TAU);
      ctx.fill();
    }
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      if (particles[i].age >= particles[i].life) particles.splice(i, 1);
    }
  }

  function draw(view) {
    const match = view.match;
    if (view.screen === SCREEN_TITLE) {
      drawTitle(match);
      return;
    }
    drawBackground();
    drawRivalHand(match, view);
    drawArena(match, view);
    drawPlayerHand(match, view);
    drawHud(match, view);
    if (view.screen === SCREEN_WIN || view.screen === SCREEN_LOSS) {
      drawEnd(match, view.screen === SCREEN_WIN);
      drawParticles(view.dt || 0);
    }
    if (view.screen === 'help') drawHelp();
  }

  return { draw, spawnEmbers, drawCardFace, drawCardBack, particles };
}
