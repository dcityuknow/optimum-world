#!/usr/bin/env bash
# Run ONCE from the repository root, after copying this project over the old repo.
# It tidies the mp3 files that used to sit loose in the repository root.
set -e
cd "$(dirname "$0")/.."

mkdir -p assets/audio/music assets/audio/ambient docs

# Background tracks are not bundled in this project: move your existing ones into place.
for f in muriel music;           do [ -f "$f.mp3" ] && git mv -f "$f.mp3" "assets/audio/music/$f.mp3";   done
for f in crowd sea fountain;     do [ -f "$f.mp3" ] && git mv -f "$f.mp3" "assets/audio/ambient/$f.mp3"; done

# Sound effects now ship in assets/audio/sfx/, so the loose copies in the root are obsolete.
for f in dig1 dig2 door found gulp pickup quest shutter step1 step2 step3 step4 step_wood1 step_wood2 strum type ui; do
  [ -f "$f.mp3" ] && git rm -q -f "$f.mp3"
done

[ -f SOUNDS.md ] && git mv -f SOUNDS.md docs/SOUNDS.md
echo "Done. Check the result with: git status"
