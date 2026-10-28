# Optimum World

A walkable 3D city built around [Optimum](https://getoptimum.xyz), the universal data acceleration
network. Walk the streets, meet the team, finish the quests and take a photo. Everything runs in the
browser on top of [three.js](https://threejs.org) (r128); the online roster and the leaderboard use
Firebase Firestore.

> **Credits.** This is a restructured copy of
> [CrpBase/optimum_world](https://github.com/CrpBase/optimum_world), which shipped the whole game as a
> single `index.html`. The behaviour is unchanged; only the layout of the files is different. The
> original repository does not state a licence, so ask its author before publishing this anywhere.

## Run it locally

The game loads images and sounds with `fetch` and `<img>`, so it has to be served over HTTP
(opening `index.html` from the disk will not work):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project layout

```
index.html              page skeleton: markup, stylesheet links, script tags
css/                    one stylesheet per screen or feature (base, dialogue, journal, ride, ...)
js/
  config.js             global switches
  data/                 text (7 languages), team and community lists, photo table
  core/                 state, textures, materials, helpers, init, input, render loop
  net/                  online roster (Firestore)
  characters/           drawn skins, people, profile and avatar
  audio/                sound effects bank, sound engine, music tracks
  world/                sky, sea, pier, buildings, exhibits, team rooms, afterparty
  gameplay/             dialogue, inventory, fishing, planting, quests, rodeo, treasure
  quests/               community quest, Umpia, vault, code lock, Ping, the sand
  ui/                   panel, onboarding, minimap, language menu, wardrobe, quest journal
  main.js               boot
assets/
  images/               icons, brand marks, resident portraits, wall photos
  audio/sfx/            one-shot sound effects
  audio/music/          music loops            (muriel.mp3, music.mp3)
  audio/ambient/        ambience loops         (crowd.mp3, sea.mp3, fountain.mp3)
scripts/migrate-assets.sh   one-off tidy-up of the old repository root
```

### How the scripts are loaded

The files in `js/` are **classic scripts that share one global scope**, exactly like the old single
`<script>` block, so they must be listed in `index.html` in the order they are today. Two rules keep
it working:

1. A file may *call* functions from later files while the game is running, but anything executed
   while a file loads (top-level `const x = f()`) needs `f` from an **earlier** file.
2. When you add a file, put its `<script>` tag after the files it depends on at load time.

Moving to ES modules (`import` / `export`) is the natural next step, but it means declaring the
dependencies of roughly 700 top-level names, so it is best done one folder at a time.

## What changed compared with the single-file version

- The 1.9 MB `index.html` was split into 17 stylesheets and 66 scripts, cut along the section
  headings that were already in the code. Rule order is preserved, so the cascade is unchanged.
- Images and sounds that were embedded as base64 text (25 images, 22 sound clips and the two favicons) are now real
  files under `assets/`, and the code points at them by path.
- Sound effects are fetched and decoded with `fetch()` instead of `atob()`.
- `seedRnd` moved to `js/core/helpers.js`, because `js/world/night-air.js` calls it while loading.
- **Bug fix:** the three seagull clips had been pasted inside the `FISH` settings object, so they were
  never decoded and the gulls never made a sound. They now live with the other clips.

## Adding the background tracks

The five background loops were never embedded in the page; they were loose files in the repository
root. After copying this project into the repository, run `scripts/migrate-assets.sh` once to move
them into `assets/audio/music/` and `assets/audio/ambient/`.
