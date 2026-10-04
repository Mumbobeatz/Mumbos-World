# Mumbo's World

A static site with no build step. Vercel serves the folder as it is.

## Draft branch: `claude-redesign`

This branch rebuilds the site. Merging it into `main` publishes it. Until then, Vercel builds a **preview** URL for the branch, and the live site stays the same.

See `REDESIGN-NOTES.md` for the review and the list of changes.

## Files

```
index.html        page structure (galaxy, world map, worlds, cockpit, guide)
css/mumbo.css     every style, in one file
js/data.js        ALL CONTENT: links, shows, tracks, worlds, hotspots
js/fx.js          starfield, hat swirl, blimp, sun, moon orbit, warp streaks
js/world.js       navigation, worlds, hotspots, guide drawer, passport stamps
js/cockpit.js     GPS reel, info screen, copilot, radio knob
assets/           artwork
```

## Common edits (all in `js/data.js`)

- **Add a show:** add an entry to `SHOWS` with `date: 'YYYY-MM-DD'`. The blimp, Event Central and the guide pick it up automatically. After the date passes, the show moves to the archive by itself.
- **Change a link:** edit `LINKS` or `SOCIALS`.
- **Move a hotspot:** each stop has `x`/`y` (centre) and `w`/`h` (size), all in % of that world's artwork.
- **Copilot lines:** edit `COPILOT_QUOTES`.

## Deploying on Vercel

Framework preset: **Other**. Build command: none. Output directory: `.`
