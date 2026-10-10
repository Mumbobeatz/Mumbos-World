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

## Round 2 changes (from your notes)

**Landing page and ship**
- The hat is 5% smaller and sits slightly higher, so its clouds clear the sign and the GPS.
- New **CONTACT** envelope under Explore (also listed in the Explore menu). It opens a form with:
  - **Reason:** Booking (DJ gig / Special event) or Say hi
  - Your name, your email and a subject
  - A message box
  - Below the form: mumbobeatz@gmail.com, plus Instagram, TikTok and X (@mumbobeatz)
  - *Sending is a concept for now.* The form opens the visitor's email app with everything filled in. To make it send by itself, paste a Formspree link into `CONTACT_ENDPOINT` in `js/data.js`. Your phone number is not anywhere in the site.
- **Dashboard:** the orange dots on the left are now glass lamps set into the painted button rings. The volume knob sits in a recessed plate in the right console (where the painted dots were), with a small level meter.
- The robot's speech bubble now comes out of the robot.
- **Wormhole:** no more square around the hat when you dive in. The inward spiral is now a little galaxy, with soft nebula arms and twinkling stars falling into the core.

**World map**
- The four worlds are now the same size on screen and no longer overlap.
- Mumbo's Moon is 15% bigger.

**Silly Singles: new jukebox landing page**
- The discs spin past with ‹ › arrows, or click a disc.
- A play button sits in the middle.
- A flip card shows the title, who it's by and the release date.
- Buttons for SoundCloud, Apple Music and Spotify.
- The songs are placeholders using your single titles. Fill in dates, links and audio previews in the `SINGLES` list in `js/data.js`. An empty link falls back to your artist page.

**Event Central**
- The painted billboard now reads "NEW SHOWS LANDING SOON". The Hurtbox poster is stamped **PLAYED 10.2**.
- Both update from the `SHOWS` list automatically.

**Mumbo's Moon**
- The About panel now has Instagram, SoundCloud, TikTok and X links, plus a Bookings button that opens the contact form.
- The stray white mark under Mumbo's leg is cropped out.
- **The lock:** the old "Meet MUMBO" spot is replaced by a padlock in the right-hand crater. Clicking it opens a 13-letter dial lock.
  - Spell **MUMBO JUMBO** and leave the rest blank.
  - The lock clicks open, the moon shakes and splits, and a glowing "CLICK ME" folder pops out.
  - Paste your Dropbox link into `SECRET_FOLDER_URL` in `js/data.js`. Until then the folder says it's still being packed.
  - It re-locks every visit. Anyone who reads the page code can find the answer, so keep anything private password-protected on Dropbox itself.

## Round 3 changes
- **World map:** the worlds are about 30% bigger. The map now uses the space down to the dashboard, the moon orbits up and down between the left and right worlds, and the four worlds don't overlap.
- **Moon lock:** a locker-style combination dial now sits right in the crater, with letters instead of numbers.
  - Click it and the camera zooms into the crater.
  - Turn the dial by dragging it in a circle, scrolling, using the arrow keys, or pressing the ⟲ ⟳ buttons. The red marker at the top shows the current letter. The yellow dot is the blank.
  - **Push** (the centre knob, the green button, or Enter) locks in that letter and moves on to the next open slot.
  - Pull the shackle (or press "Pull to open"). MUMBO JUMBO with the rest left blank cracks the moon open. A wrong code flashes red and clears.
  - Undo, Clear and Back (or Esc) are there too.

## Round 4 changes
- **Moon lock:** the dial is now built into the big crater. It has a dark recess, a purple-steel rim lit like the crater edge, and moon shading over it. There's no shackle any more.
  - Click it to zoom in, turn the dial, and push the centre knob to lock in each letter.
  - "Open the moon" checks the code. If it's right, the dial spins out and the moon cracks open.
- **Media Center** is drawn larger on the map, so it reads the same size as the other worlds.
- **Silly Singles:** works like a real CD jukebox now. The selected CD stands upright facing you, and the rest stand on edge in stacks to the left and right. They rotate into place as you flip through.

## Round 5 changes
- **Moon lock:** the letters now sit on a fixed ring around the outside of the dial and stay upright, so every one is readable. The inner dial turns and a red pointer shows the selected letter, which also lights up yellow. The extra "MUMBO / MOON CO." text is gone.
- **Silly Singles:** a close-up of a classic neon jukebox, with a rainbow-arched crown, glowing side tubes, a chrome title strip, a big red play button and a grille.
  - The other songs lie **flat** in stacks to the left and right, and each edge shows the song title and artist. Click an edge to pull that CD up.
  - The chosen CD stands upright, with the title above the hole and the artist below it.
- **Sharper world map:** the worlds were going soft for three reasons. Media Center and Playground were enlarged by stretching their pictures. The floating animation tilted each world. The hover effect zoomed in. Now they're drawn at their real size, they float straight up and down, and hover adds a glow instead of zooming. The sun no longer tilts either.
- **Scroll fix:** scroll events that queue up during a flight, or trackpad momentum, can no longer start a second journey after you land.

## Round 6 changes
- **Moon lock:** when you zoom in, the letters you lock in now appear on a ring around the outside of the lock, starting top-left and going clockwise. The bottom panel only holds the buttons.
- **Silly Singles:** rebuilt as a vintage Rock-Ola style jukebox, called "MUMBO-OLA".
  - Cream arched cabinet with a red jewel on top, walnut body, glowing side pillars and a chrome-framed grille.
  - The dome window shows the chosen song as a real CD (mirror silver, rainbow sheen, clear centre hub, printed label with the title above the hole and the artist below). The CD spins on its deck when you press play.
  - Below that is the green-lit title-strip book. Each song has a strip with its code (A1, A2, B1…), title and artist. Click a strip to pick it, or use the chrome ‹ › to step through, and the page flips when you move to a new page. Phones show one page at a time.
  - A selector panel shows the current pick and its release date, with the red play button and the SoundCloud, Apple Music and Spotify buttons.

## Round 7 changes
- **Silly Singles page flipping:** the title pages now work like a real wall-box selector. Double-sided pages are hinged on a chrome spine in the middle of the green-lit window. ‹ › turns one page with a 3D flip, and holding an arrow flicks through the pages continuously, like in the jukebox reference video. When you arrive, the pages flick through once. Each page holds two title strips; click a strip to pick that song.
- **Moon lock:** a wrong code no longer clears your letters. It says "Incorrect", flashes the tiles red, and keeps them so you can fix them.

## Round 8 changes
- **Moon lock:** the code is now **MUMBOJUMBO**, ten tiles with no blank spaces, and the blank is gone from the dial.
  - Tap a letter on the ring to swing the pointer to it, or drag, scroll or use the arrow keys. Press the centre knob to lock it in.
  - The 10th letter submits automatically. A wrong code turns the tiles red, shakes, then clears so you can try again.
  - Tap a tile to take back that letter and everything after it.
  - The bottom button panel is gone. A small "← Back" pill (or Esc) closes the lock.

## Behaviour I changed (round 1) (please check)

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
