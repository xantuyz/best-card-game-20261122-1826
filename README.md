[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/xantuyz/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/xantuyz/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

Entry for the make.fun bounty: https://make.fun/bounty/best-card-game-20261122-1826

# EMBERFALL — Duel of the Last Lanterns

A complete, original, offline card game for the desktop browser. Two
keepers of the last lanterns duel with ember spirits on a twilight table.
No network, no libraries, no audio files — vanilla canvas and WebAudio synth.

## How to play

- Each side starts with **20 life** and a hand of **5 cards**, drawing one
  every round.
- Each round both sides play one card, revealed together. Higher power wins
  the trick; the loser loses life equal to the power gap.
- **Elemental edge (+3 power):** Flame beats Leaf, Leaf beats Tide, Tide
  beats Flame. Stone has no edge, but its cards run high (4–9).
- **Surge** (+4) fires when its suit wins the edge. **Quench** cancels the
  rival edge. A trick card is played *together* with a number card: click
  the trick first, then the number card.
- The Rival Keeper shows a **tell** before you pick — the suit it favours,
  or that it is hoarding big cards. Read it, and answer it.
- Win by bringing the rival lantern to 0, or by leading when the deck runs out.

## Controls

Mouse: click a card to pick it, click again (or press Enter) to play.
Keyboard: `1–5` pick a card · `Enter` play · `R` restart · `M` mute ·
`H` how to play.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

## Layout

- `game/` — the game: `index.html` plus `src/` modules (`config`, `deck`,
  `rules`, `ai`, `render`, `input`, `audio`, `shots`, `main`).
- `shots.json` — the four screenshot scenes (`?shot=title|play|win|loss`),
  each a real render of the game's own code from a fixed seed.
- `main.ts` — copies `game/` + `screenshots/` to `/output` and writes
  `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
