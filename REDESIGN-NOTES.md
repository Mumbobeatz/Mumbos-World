# Redesign v2: notes for review

This redesign lives on the branch `claude-redesign-v2`. **`main` (the live site) is untouched.**
Vercel builds a preview URL for this branch automatically. Nothing goes live unless this branch is merged.

The structure follows your brief: bucket-hat galaxy → wormhole → universe map → worlds → buildings. It keeps your painted spaceship dashboard, the GPS housing, every world and mini world, all content and links, and every "coming soon" state.

## What looks different (my visual spin)

| Area | What changed |
|---|---|
| **Wormhole** | Star dust now spirals *into* the wormhole, so it visibly pulls inward. The bright core still pulses. The hat's outline is never moved or stretched: only its inside swirls, as before. "ENTER WORMHOLE" is stacked over the opening at 60% opacity. The hat is about 15% larger, with clear space above and below. |
| **Entering the universe** | The camera dives into the hat's opening, flies through a tunnel of light rings, then the universe map opens up around you. Going home plays the same tunnel in reverse, and the hat reappears around you. |
| **Flying to a world** | The camera flies at the world you picked until it fills the windshield, then passes through a short bank of cartoon clouds (the same cloud style as your building labels). **The landing scene only appears while the clouds are at their thickest**, so it can no longer pop in early. |
| **Leaving a world** | The same clouds in reverse: you climb out of the atmosphere and the world shrinks back to its spot on the map. |
| **World to world** | Neighbouring worlds swing past sideways with light streaks (arrows, swipe, or GPS). |
| **World map** | Mumbo's Moon orbits the sun. Dotted space lanes join the worlds, with **42 ships, jetpacks and space-walkers** flying along them. They fade out before reaching a world, so they never cover its sign. Worlds are bigger on phones. |
| **Copilot** | Its face is now drawn pixel by pixel (eyes, eyebrows, mouth). It follows your cursor, blinks, and switches between neutral, laughing, curious and sleepy. |
| **GPS** | The names roll like a drum: the old name tips away and the new one rolls in, in the direction you pressed. Hovering a world on the map rolls the GPS to it. |
| **Dashboard** | Your painted dashboard art is kept. The copilot sits in the left porthole, Mumbo Radio in the right one (with a small waveform and "Coming soon"), the volume knob on the right console, and the side lights blink. INFO and EXPLORER sit inside the screen glass. |
| **Mumbo's Moon** | The About text now appears beside the moon as an "Incoming transmission" panel, instead of only in a pop-up. |
| **Cursor** | The bucket-hat cursor with its glow and soft smoke trail. It now follows you into pop-ups (blimp, INFO, buildings), so it can't disappear any more. |
| **Blimp** | The propeller spins and the exhaust puffs. On desktop it bounces off the wormhole instead of parking on it. On phones it cruises behind the sign, so the wormhole is always tappable. |

## Behaviour I changed (please check)

1. **Blimp message.** The 10/2 Hurtbox show has passed, so the blimp now reads "New shows landing soon ★ Bookings: mumbobeatz@gmail.com" with a "NEW SHOWS SOON" flyer. Shows now live in one list in `js/data.js` with real dates. Add a show there and it appears on the blimp, in Event Central and in INFO, then moves to the archive by itself after the date.
2. **The INFO screen** starts with "Where to next? Hover a world or building." It updates when you hover a world, a building, or a mini-world spot.
3. **Inside a world, the GPS arrows fly you to the next world.** Before, two separate controls handled the GPS and both reacted to the same input. Now one controller handles every input: one click, scroll notch, drag or key press = one action.
4. **Scrolling:** one scroll gesture = one journey. Scrolling that carries on after a journey ends is ignored, so a fast trackpad can't chain several journeys together.
5. **Resizing the window mid-journey** lands you at the destination straight away instead of leaving a half-finished animation.
6. **Back/Forward pressed mid-journey** is remembered and played as soon as the current journey lands.
7. **Mumbo's Moon** has a second clickable spot, "The Little Ship" (opens your bookings email).
8. **Pause motion** stops every animation. It also turns on automatically for visitors whose system asks for reduced motion.

## Kept exactly as it was
- **Sun:** the eyes follow the cursor. Each click switches between laughing and angry, and it goes back to neutral after 2.8 seconds.
- **Robot click:** says a random MUMBO phrase (never the same one twice in a row), laughs for 5 seconds, and the speech bubble stays for 7.5 seconds. It also speaks on its own every 2½–4 minutes.
- **Destinations:** all 5 worlds and the 4 Music Island mini worlds (As Seen On…, Event Central, Silly Singles, Mumbo's Secret Stuff), with every link, track and content card.
- **Phone song list:** the readable song buttons under As Seen On and Event Central.
- **Volume knob:** drag, scroll or use the arrow keys. It still controls video volume until Mumbo Radio launches.

## Files
```
index.html        page structure
css/mumbo.css     all styles (one file, replacing 12)
js/data.js        ALL CONTENT: links, shows, tracks, worlds, hotspots, copilot phrases
js/fx.js          stars, hat swirl + inward pull, clouds, wormhole tunnel, blimp, sun, moon orbit, traffic
js/world.js       journeys, worlds, buildings, INFO dialog, Back button / scroll / keyboard / swipe
js/cockpit.js     GPS, copilot, volume knob
```

## Checks run before review
Run in a real browser (Chromium), at 1440×900, 1280×720, 1920×1080, iPad portrait, iPhone 13 and Pixel 5:
home → wormhole → map; map → each of the 5 worlds → map; every Music Island building → its mini world and back up; arrows, keyboard and swipe between worlds; every GPS control (arrows, wheel, drag, keys, Enter); hover info for worlds and buildings; song and building dialogs; robot click and cursor tracking; sun clicks and cursor tracking; cursor visibility after pop-ups; browser Back (including mid-journey); 40-event scroll bursts; 5 rapid portal clicks; resizing mid-journey; direct links like `#secret-stuff`.
No JavaScript errors, no missing files, and no leftover warp or cloud layers.
