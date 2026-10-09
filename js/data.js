/* ==========================================================================
   MUMBO'S WORLD — CONTENT
   Everything a visitor reads lives in this file. To add a show, add an entry
   to SHOWS with an ISO date (YYYY-MM-DD). Upcoming shows automatically appear
   on the blimp, in Event Central and in the guide; once the date passes they
   move to the archive by themselves.
   ========================================================================== */

const LINKS = {
  soundcloud: 'https://soundcloud.com/mumbobeatz',
  instagram: 'https://instagram.com/mumbobeatz',
  youtube: 'https://www.youtube.com/@mumbobeatz',
  spotify: 'https://open.spotify.com/artist/0v4RYCckfkFu4dXWl35BXl',
  apple: 'https://music.apple.com/us/artist/mumbo/1811034573',
  tiktok: 'https://www.tiktok.com/@mumbobeatz',
  facebook: 'https://www.facebook.com/profile.php?id=61575874555012',
  x: 'https://twitter.com/mumbobeatz',
  highlights: 'https://mumbobeatz.com/highlights',
  email: 'mailto:mumbobeatz@gmail.com'
};

const SOCIALS = [
  { name: 'Instagram', sub: '@mumbobeatz', url: LINKS.instagram },
  { name: 'SoundCloud', sub: 'Tracks, flips & mixes', url: LINKS.soundcloud },
  { name: 'YouTube', sub: 'Sets & videos', url: LINKS.youtube },
  { name: 'Spotify', sub: 'Listen to MUMBO', url: LINKS.spotify },
  { name: 'Apple Music', sub: 'Listen to MUMBO', url: LINKS.apple },
  { name: 'TikTok', sub: '@mumbobeatz', url: LINKS.tiktok },
  { name: 'Facebook', sub: 'MUMBO', url: LINKS.facebook },
  { name: 'X', sub: '@mumbobeatz', url: LINKS.x }
];
const STREAMING = SOCIALS.filter(s => ['Spotify', 'Apple Music', 'SoundCloud', 'YouTube'].includes(s.name));

const SHOWS = [
  {
    title: 'Hurtbox — No Love Lost',
    date: '2026-10-02',
    venue: 'Spin Nightclub',
    city: 'San Diego, CA',
    time: '9 PM–4 AM',
    age: '21+',
    lineup: 'Hurtbox with Warlord, Proxxxy, Finnuh, 91Octane, Jonnyboy, Kurtzee, MUMBO and Sira.',
    flyer: 'hurtbox',
    url: LINKS.instagram,
    label: 'Show updates'
  }
];

const ARCHIVE = [
  { tag: 'Festival memories', title: 'Dancefestopia', text: 'Back in the world of bass.', url: LINKS.instagram, label: 'Photos & posts' },
  { tag: 'Rooftop sessions', title: 'Nova', text: 'House music, open skies, good company.', url: 'https://www.instagram.com/p/Cfc1Padpnps/', label: 'See the post' }
];

const TRACKS = [
  ['Feelin’ Pretty Suavé', 'Original'], ['Missed Call', 'Original'], ['Do It — MUMBO & Scum Wubz', 'Collaboration'],
  ['Party Fix', 'Original'], ['Satellite (Mumbo Flip)', 'Flip'], ['Eat the Bass (Mumbo Flip)', 'Flip'],
  ['Project Seismic', 'From the archive'], ['As seen on…', 'EP'], ['My Name Is I Like to Party 3', 'From the archive']
];

const COPILOT_QUOTES = [
  'That’s a bunch of Mumbo Jumbo!',
  'I mumbo… you mumbo… he, she, we… Mumboooo!',
  'Wake me when the bass drops.',
  'Big hat. Bigger universe.',
  'Beep boop. Certified bass enthusiast.',
  'Are we there yet? Just kidding. Keep exploring!'
];
const GPS_IDLE = 'Where to next? Hover a world or building.';

/* ---------- show helpers ---------- */
const showDate = s => new Date(s.date + 'T23:59:59');
const prettyDate = s => new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
const shortDate = s => { const d = new Date(s.date + 'T12:00:00'); return `${d.getMonth() + 1}/${d.getDate()}`; };
const upcomingShows = () => SHOWS.filter(s => showDate(s) >= new Date()).sort((a, b) => a.date.localeCompare(b.date));
const pastShows = () => SHOWS.filter(s => showDate(s) < new Date()).sort((a, b) => b.date.localeCompare(a.date));
const spotlightShow = () => upcomingShows()[0] || null;

/* ---------- html helpers ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ext = (url, label, cls = 'btn') => `<a class="${cls}" href="${url}" ${url.startsWith('mailto:') ? '' : 'target="_blank" rel="noopener noreferrer"'}>${label} <span aria-hidden="true">↗</span></a>`;
const chips = list => `<div class="btn-row">${list.map(s => ext(s.url, s.name)).join('')}</div>`;

function showCard(show, past = false) {
  return `<article class="show-card${past ? ' is-past' : ''}">
    ${show.flyer ? `<img src="assets/${show.flyer}.webp" alt="${esc(show.title)} flyer" loading="lazy">` : ''}
    <div>
      <p class="eyebrow">${past ? 'Played' : 'Next up'} · ${prettyDate(show)}</p>
      <h3>${esc(show.title)}</h3>
      <p>${esc(show.venue)} · ${esc(show.city)}<br>${esc(show.time)} · ${esc(show.age)}</p>
      <p class="muted">${esc(show.lineup)}</p>
      ${past ? '' : ext(show.url, show.label)}
    </div>
  </article>`;
}

/* ==========================================================================
   TOP-LEVEL WORLDS (the planets on the world map).
   Stops are hotspots on the world art: x/y = centre, w/h = size, all in % of
   the artwork. `go` makes a stop fly into a mini world instead of opening a card.
   ========================================================================== */
const WORLD_ORDER = ['music', 'media', 'about', 'events', 'toys'];

const WORLDS = {
  music: {
    title: 'Music Island', kicker: 'The sound district', art: 'music-cutout-v3', ratio: 1,
    info: 'Music and live sets/mixes.',
    stops: [
      { name: 'Silly Singles', kind: 'Interactive jukebox', description: 'Singles, flips and one-off releases.', x: 31, y: 26, w: 32, h: 24, go: 'silly-singles' },
      { name: 'Music & Live Sets', kind: 'Music district', description: 'Music, live sets and mixes from MUMBO.', x: 76, y: 36, w: 24, h: 22, url: LINKS.youtube, label: 'Open YouTube channel' },
      { name: 'Event Central', kind: 'Upcoming and past shows', description: 'Show details, flyers and future ticket links.', x: 49, y: 69, w: 37, h: 20, go: 'event-central' },
      { name: 'Mumbo’s Secret Stuff', kind: 'SoundCloud-exclusive mixes', description: 'Mashups and flips from the mix archive.', x: 16, y: 83, w: 25, h: 26, go: 'secret-stuff' },
      { name: 'As Seen On…', kind: 'Debut EP', description: 'Power On, Mumbo Jumbo, My Name Is (I Like to Party) and Berries & Cream.', x: 82, y: 83, w: 27, h: 27, go: 'as-seen-on' }
    ],
    guide: () => `
      ${chips(STREAMING)}
      <article class="feature">
        <video controls playsinline preload="metadata" poster="assets/studio.webp" aria-label="Feels Like Heaven visualizer"><source src="assets/heaven.mp4" type="video/mp4"></video>
        <div><p class="eyebrow">Enter the cathedral</p><h3>Feels Like Heaven</h3><p>Step into the fog, follow the light, and turn it up.</p>${ext(LINKS.soundcloud, 'Listen on SoundCloud')}</div>
      </article>
      <h3 class="section-title">Releases & flips</h3>
      <div class="card-grid">${TRACKS.map(([t, type]) => `<article class="mini-card"><span class="tag">${type}</span><h4>${esc(t)}</h4>${ext(LINKS.soundcloud, 'SoundCloud', 'text-link')}</article>`).join('')}</div>
      <h3 class="section-title">Live sets & mixes</h3>
      <div class="card-grid">
        <article class="mini-card"><span class="tag">Mix</span><h4>Mumbo’s Secret Stuff Vol. 1</h4>${ext(LINKS.soundcloud, 'Browse mixes', 'text-link')}</article>
        <article class="mini-card"><span class="tag">Live set</span><h4>Emorfik 1/25: Mumbo Live Set!</h4>${ext(LINKS.youtube, 'YouTube', 'text-link')}</article>
        <article class="mini-card"><span class="tag">Behind the Decks 03</span><h4>Zombae ft. Mumbo</h4>${ext(LINKS.youtube, 'YouTube', 'text-link')}</article>
      </div>
      <iframe class="embed" title="MUMBO on Spotify" loading="lazy" src="https://open.spotify.com/embed/artist/0v4RYCckfkFu4dXWl35BXl?utm_source=generator" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>`
  },

  media: {
    title: 'Media Center', kicker: 'The broadcast district', art: 'media-cutout-v3', ratio: 1.5,
    info: 'The social hub, connect to Mumbo in more ways than one!',
    stops: [
      { name: 'SoundCloud Arena', kind: 'Music broadcast', description: 'Tracks, flips and mixes straight from MUMBO.', x: 34, y: 25, w: 20, h: 21, url: LINKS.soundcloud, label: 'Listen on SoundCloud' },
      { name: 'Insta Tower', kind: 'Instagram / @mumbobeatz', description: 'Show moments, new music, and whatever MUMBO is up to next.', x: 65, y: 25, w: 19, h: 22, url: LINKS.instagram, label: 'Open Instagram', image: 'live' },
      { name: 'TikTok Station', kind: 'TikTok / @mumbobeatz', description: 'Short clips and transmissions from the world.', x: 30, y: 44, w: 18, h: 19, url: LINKS.tiktok, label: 'Open TikTok' },
      { name: 'YouTube Cinemark', kind: 'Sets & videos', description: 'Drop into the cinema for MUMBO’s sets and videos.', x: 69, y: 42, w: 18, h: 15, url: LINKS.youtube, label: 'Open YouTube', image: 'bass-bros' },
      { name: 'Memory Gallery', kind: 'Photos & artwork', description: 'Show photos, cover art, characters, and little pieces of Mumbo’s World.', x: 50, y: 56, w: 18, h: 22, url: LINKS.highlights, label: 'More memories', image: 'sophie' },
      { name: 'Social Satellite', kind: 'All frequencies', description: 'Every place you can find MUMBO, in one dish.', x: 67, y: 58, w: 16, h: 14, socials: true }
    ],
    guide: () => `
      <div class="social-grid">${SOCIALS.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.name} <span aria-hidden="true">↗</span></strong><span>${s.sub}</span></a>`).join('')}</div>
      <h3 class="section-title">A glimpse into the world</h3>
      <div class="gallery">
        <figure><img src="assets/bass-bros.webp" alt="Super Bass Bros comic art featuring MUMBO and Balance" loading="lazy"><figcaption>Super Bass Bros · MUMBO × Balance</figcaption></figure>
        <figure><img src="assets/live.webp" alt="MUMBO performing live" loading="lazy"><figcaption>Behind the decks</figcaption></figure>
        <figure><img src="assets/sophie.webp" alt="Playful Sophie Cunningham cover artwork with a MUMBO SUCKS crowd sign" loading="lazy"><figcaption>A little mischief</figcaption></figure>
      </div>
      <div class="btn-row">${ext(LINKS.highlights, 'More show memories')}<button class="btn" data-go="about">Meet the man in the hat →</button></div>`
  },

  about: {
    title: 'Mumbo’s Moon', kicker: 'The man in the hat', art: 'moon', ratio: 548 / 653, panel: true,
    info: 'Meet Mumbo and explore the man behind the bucket hat.',
    stops: [
      { name: 'Meet MUMBO', kind: 'Ryan / San Diego', description: 'I’m Ryan, aka MUMBO—a San Diego DJ and producer with a love for heavy bass, funky house, and taking the unexpected turn.', x: 50, y: 58, w: 46, h: 34, url: LINKS.instagram, label: 'Say hi on Instagram', image: 'character' },
      { name: 'The Little Ship', kind: 'Mumbo’s ride', description: 'Every universe needs a getaway car. Bookings and hellos go through here.', x: 33, y: 24, w: 30, h: 16, url: LINKS.email, label: 'Email for bookings' }
    ],
    guide: () => `
      <div class="about">
        <img class="avatar" src="assets/character.webp" alt="MUMBO character in a fluffy blue jacket and star-covered bucket hat, carrying glowing headphones">
        <div>
          <p>I’m Ryan, aka MUMBO—a San Diego DJ and producer with a love for heavy bass, funky house, and taking the unexpected turn.</p>
          <p>My sets move between sounds, but the goal stays the same: make you move your body and leave with a smile. That playful energy shows up in the music, the cartoons, the characters, and everything you’ll find here.</p>
          <p>Mumbo’s World is where it all comes together. Pick a portal. Get a little lost.</p>
          <div class="btn-row">${ext(LINKS.instagram, 'Say hi on Instagram')}${ext(LINKS.email, 'Bookings')}</div>
        </div>
      </div>`
  },

  events: {
    title: 'Event Central', kicker: 'The live district', art: 'event-central-cutout-v3', ratio: 16 / 9,
    info: 'Past and future Mumbo events.',
    stops: () => {
      const show = spotlightShow() || pastShows()[0];
      return [
        show && { name: spotlightShow() ? `Next: ${show.title}` : `Last show: ${show.title}`, kind: prettyDate(show), description: `${show.venue} · ${show.city} · ${show.time} · ${show.age}. ${show.lineup}`, x: 75, y: 27, w: 29, h: 43, url: show.url, label: show.label, image: show.flyer },
        { name: 'Event Central Stage', kind: 'Upcoming and past shows', description: 'The next stop in Mumbo’s live universe. New dates land here first.', x: 51, y: 48, w: 30, h: 42, url: LINKS.instagram, label: 'Show updates' }
      ].filter(Boolean);
    },
    guide: () => {
      const next = upcomingShows(), past = pastShows();
      return `
      <h3 class="section-title">Upcoming shows</h3>
      ${next.length ? next.map(s => showCard(s)).join('') : `<div class="note-card"><h4>New dates are cooking.</h4><p>Follow along for the next announcement, or get in touch for bookings.</p><div class="btn-row">${ext(LINKS.instagram, 'Show updates')}${ext(LINKS.email, 'Bookings')}</div></div>`}
      <h3 class="section-title">From the archive</h3>
      ${past.map(s => showCard(s, true)).join('')}
      <div class="archive">${ARCHIVE.map(a => `<article><p class="eyebrow">${a.tag}</p><h4>${a.title}</h4><p>${a.text}</p>${ext(a.url, a.label, 'text-link')}</article>`).join('')}</div>`;
    }
  },

  toys: {
    title: 'Mumbo’s Playground', kicker: 'Under construction', art: 'playground-cutout-v3', ratio: 1,
    info: 'All things Mumbo... merch, games, toys and much more.',
    construction: [[18, 38], [45, 25], [58, 57], [25, 76], [62, 80]],
    stops: [
      { name: 'Arcade', kind: 'Coming soon', description: 'A future home for Mumbo mini-games.', x: 39, y: 22, w: 18, h: 16 },
      { name: 'Store / Marketplace', kind: 'Future merch store', description: 'MUMBO merch, toys and more will live here.', x: 69, y: 28, w: 18, h: 16 }
    ],
    guide: () => `
      <div class="note-card construction">
        <p class="eyebrow">Under construction</p>
        <h4>Big kid energy. Work in progress.</h4>
        <p>The rides, games, and strange little surprises are still being built. Come back for the grand opening.</p>
      </div>`
  }
};

/* ==========================================================================
   MINI WORLDS inside Music Island (cycle with ← →, ↑ returns to the island).
   ========================================================================== */
const MUSIC_ORDER = ['as-seen-on', 'event-central', 'silly-singles', 'secret-stuff'];

const SUBWORLDS = {
  'as-seen-on': {
    title: 'As Seen On…', kicker: 'Debut EP · Music Island', art: 'as-seen-on-v4', ratio: 16 / 9,
    info: 'The debut EP: four songs and four corners of the park.',
    stops: [
      { name: 'Power On', kind: 'Track 1 · August 4, 2025', description: 'Power On — MUMBO.', x: 62.5, y: 29.3, w: 7.5, h: 3.5, tilt: 5, track: true },
      { name: 'Mumbo Jumbo', kind: 'Track 2 · August 4, 2025', description: 'Mumbo Jumbo — MUMBO.', x: 62.5, y: 33.1, w: 7.5, h: 3.3, tilt: 5, track: true },
      { name: 'My Name Is (I Like to Party)', kind: 'Track 3 · August 4, 2025', description: 'My Name Is (I Like to Party) — MUMBO.', x: 62.5, y: 37.2, w: 7.5, h: 4.2, tilt: 5, track: true },
      { name: 'Berries & Cream', kind: 'Track 4 · August 4, 2025', description: 'Berries & Cream — MUMBO.', x: 62.5, y: 41.3, w: 7.5, h: 3.6, tilt: 5, track: true },
      { name: 'Mumbo Jumbo Park', kind: 'Amusement park', description: 'Roller coasters, rides and the Mumbo Jumbo side of the EP.', x: 31, y: 27, w: 29, h: 31 },
      { name: 'Hot Rod Arena', kind: 'Skate / BMX / motocross park', description: 'Ramps, dirt-bike jumps and tracks inspired by the Hot Rod world.', x: 34, y: 61, w: 31, h: 30 },
      { name: 'Berries & Cream Land', kind: 'Playground and courts', description: 'A berry-and-candy park with swings, basketball and tennis courts.', x: 78, y: 65, w: 30, h: 31 }
    ]
  },
  'event-central': {
    title: 'Event Central', kicker: 'Shows · Music Island', art: 'event-central-cutout-v3', ratio: 16 / 9,
    info: 'Upcoming and past shows.',
    stops: () => WORLDS.events.stops()
  },
  'silly-singles': {
    title: 'Silly Singles', kicker: 'Jukebox · Music Island', art: 'music-cutout-v3', ratio: 1, zoom: { scale: 2.25, x: 16, y: 8 },
    info: 'The jukebox for singles, flips and one-off releases.',
    notice: 'Interactive jukebox coming soon.',
    stops: [
      { name: 'Silly Singles', kind: 'Interactive jukebox · coming soon', description: 'A future jukebox for MUMBO singles with Apple Music, Spotify, SoundCloud and YouTube links.', x: 50, y: 46, w: 50, h: 48, url: LINKS.soundcloud, label: 'Browse SoundCloud' }
    ]
  },
  'secret-stuff': {
    title: 'Mumbo’s Secret Stuff', kicker: 'Mix archive · Music Island', art: 'secret-stuff-cutout-v3', ratio: 16 / 9,
    info: 'SoundCloud-exclusive mashups from Mumbo’s Secret Stuff Vol. 1.',
    stops: [
      { name: 'GRIZTRONICS / SPACE INVADERZ / MS. JACKSON', kind: 'Track 1 · SoundCloud exclusive', description: 'GRiZ & Subtronics (Cyclops Remix) × Joogornot × TIKI Edit.', x: 65.8, y: 28.1, w: 28.2, h: 6, tilt: 4, url: LINKS.soundcloud, label: 'Listen on SoundCloud', track: true },
      { name: 'YOU & ME × TURN ON THE LIGHTS', kind: 'Track 2 · SoundCloud exclusive', description: 'Flume (Westend & Local Singles Remix) × Fred again.. (Z A K Edit).', x: 65.8, y: 35.5, w: 28.2, h: 6.3, tilt: 4, url: LINKS.soundcloud, label: 'Listen on SoundCloud', track: true },
      { name: 'DON’T LET ME DOWN × COLD HEARTED', kind: 'Track 3 · SoundCloud exclusive', description: 'Chainsmokers (Spag Heddy Remix) × Seven Lions & Kill The Noise.', x: 65.8, y: 42.8, w: 28.2, h: 6.3, tilt: 4, url: LINKS.soundcloud, label: 'Listen on SoundCloud', track: true },
      { name: 'RENEGADE MASTA', kind: 'Track 4 · SoundCloud exclusive', description: 'Mumbo Flip · Released May 15, 2024.', x: 65.8, y: 49.7, w: 28.2, h: 6, tilt: 3, url: LINKS.soundcloud, label: 'Listen on SoundCloud', track: true }
    ]
  }
};

const stopsOf = place => typeof place.stops === 'function' ? place.stops() : place.stops;
const placeOf = key => WORLDS[key] || SUBWORLDS[key] || null;
const titleOf = key => placeOf(key)?.title || (key === 'hub' ? 'World map' : 'The bucket hat galaxy');
