# Redesign notes

## Review of the current site

The art and the idea are great. The flying-through-a-bucket-hat galaxy concept is memorable, and the hand-made worlds have real personality. Most of the problems are in how the site was put together.

**Code structure**
- The site loads 12 stylesheets and 16 scripts. Each one patches the one before it (`desktop-v3.css`, `desktop-v4.css`, `mobile-v5.css` …), with hundreds of `!important` overrides. Small changes are risky because a later file usually wins.
- Several scripts measure and reposition elements on every animation frame to correct layout from earlier files (`hat-layout.js`, `world-layout.js`). One of these loops reads the position of about 70 walking characters on every frame, which costs battery and smoothness on phones.
- Some files are dead: `reel-motion.js` is one comment, and the fly-past code in `flight.js` is never called.
- About 12 MB of images in `assets/` are not used by the page. They don't slow visitors down, but they make the repo harder to navigate.

**Content**
- The blimp still says "Next show: 10/2 w/Hurtbox". That show has already happened. Shows were hard-coded in four separate places.
- The detailed world pages (Spotify embed, releases list, gallery) were only reachable through a small "INFO" link in the dashboard.

**Layout and usability**
- On phones, the logo, the blimp and the "Pause motion" button overlap at the top of the home screen. The hint text sits under the GPS.
- The painted dashboard takes up about a quarter of the screen.
- "Enter wormhole" is faint text over a busy image, so first-time visitors may not see where to click.
- The characters drifting around Mumbo's Moon look like they're floating in empty space.

## What changed

Everything the site did before still works: the home galaxy, the wormhole, the world map, all five worlds, the four Music Island mini worlds, hotspots, the GPS reel, the copilot, the volume knob, the show blimp, scroll-to-zoom, arrow keys, swipe, Escape, the back button, links like `#music`, Pause motion, and the hat cursor.

**Rebuilt cleanly**
- The site is now 1 stylesheet and 4 scripts, with all content in one file (`js/data.js`).
- Layout uses CSS container queries, so nothing is measured or repositioned on every frame.
- A single animation loop runs everything, and each effect only runs while its scene is on screen.

**Data-driven shows**
- Shows have real dates. Upcoming shows go on the blimp, in Event Central and in the guide. Past shows move to the archive by themselves.
- With no show booked, the blimp's flyer frame reads "NEW DATES SOON" and the ticker shows the bookings email.

**New and changed artwork**
- **Cockpit:** a slimmer dashboard drawn in code, in the same teal, orange and navy palette, with blinking LEDs and a CRT-style info screen. It frees up a lot of screen space.
- **Copilot:** the copilot robot art (already in the repo but unused) now has a pixel face that is drawn live. It follows your cursor, blinks, and changes mood (happy, curious, sleepy, surprised, love). It also reacts when you arrive somewhere or tease the sun.
- **World map:** dotted warp lanes connect the sun to each planet, with light pulses running along them. Ships fly real routes between planets. **Mumbo's Moon now orbits the sun.**
- **Journeys:** every trip plays hyperspace streaks. Diving in zooms into the spot you clicked, pulling out zooms back to where you came from, and moving between neighbouring worlds swings you sideways.
- **Silly Singles** is shown through a round zoom lens.
- **Mumbo Radio** has an animated equalizer while it waits for real audio.
- **Cursor trail:** the smoke puffs are now coloured sparkle stars.
- **Starfield:** three layers of stars that shift slightly as you move the mouse.

**Twists**
- **Passport stamps:** visiting each of the five worlds earns a ★ stamp, counted in the top bar. Collecting all five makes you an "official Mumbonaut". Stamps are saved in the visitor's browser.
- **World guide drawer:** the full content for each world (embeds, releases, gallery, shows) opens in a side drawer from the world, the cockpit or the menu.
- **Place chips:** each world lists its places as buttons under the art. This makes them easy to find on phones and with a keyboard.
- **Sideways scrolling on phones:** on a phone in portrait, wide worlds can be scrolled sideways, so the art isn't shrunk to a thin strip.

**Accessibility**
- Visitors whose system asks for reduced motion get a still version of the site.
- Every hotspot is a real button with a readable label.
- Focus moves to the new place after each trip.
- Pop-ups and the guide drawer close with Escape.
- A skip link jumps straight to the navigation console.
