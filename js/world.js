/* ==========================================================================
   MUMBO'S WORLD — NAVIGATION & JOURNEYS
   galaxy (home) → hub (world map) → a world → a Music Island mini world.
   Every place is a URL hash (#music, #as-seen-on …) so Back/Forward work.
   Exactly one journey can run at a time; every journey is driven by a single
   progress value so the camera, the warp and the clouds always finish together.
   ========================================================================== */
const depthOf = key => key === 'galaxy' ? 0 : key === 'hub' ? 1 : WORLDS[key] ? 2 : SUBWORLDS[key] ? 3 : -1;
const parentOf = key => SUBWORLDS[key] ? 'music' : WORLDS[key] ? 'hub' : key === 'hub' ? 'galaxy' : null;
const ringOf = key => SUBWORLDS[key] ? MUSIC_ORDER : WORLDS[key] ? WORLD_ORDER : null;
const isPlace = key => depthOf(key) >= 0;
const ease = t => t * t * t * (t * (t * 6 - 15) + 10);   // smootherstep
const easeIn = t => t * t * t;
const easeOut = t => 1 - (1 - t) ** 3;
const centerOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; };

let activeScene = $('#galaxy');
let hoveredPlanet = null;

/* ==========================================================================
   BUILDING A WORLD SCENE
   ========================================================================== */
function buildWorld(key) {
  const place = placeOf(key), sub = !!SUBWORLDS[key];
  const scene = $('#worldTemplate').content.firstElementChild.cloneNode(true);
  scene.id = 'scene-' + key;
  scene.dataset.place = key;
  scene.classList.toggle('sub', sub);
  scene.setAttribute('aria-labelledby', 'title-' + key);
  $('.eyebrow', scene).textContent = place.kicker;
  const h1 = $('h1', scene); h1.textContent = place.title; h1.id = 'title-' + key;
  $('.sub-up', scene).hidden = !sub;

  const board = $('.board', scene);
  board.style.setProperty('--ratio', place.ratio);
  const img = $('.art img', scene);
  img.src = `assets/${place.art}.webp`;
  img.alt = sub ? `A close-up view of ${place.title} inside Music Island` : `An overhead view of ${place.title}, with buildings to explore`;
  if (place.zoom) {
    board.classList.add('zoomed');
    img.style.transformOrigin = `${place.zoom.x}% ${place.zoom.y}%`;
    img.style.transform = `scale(${place.zoom.scale})`;
  }
  if (place.notice) { const n = $('.world-notice', scene); n.hidden = false; n.textContent = place.notice; }

  // hotspots: highlight the artwork under the pointer; baked-in signs need no label
  const stops = stopsOf(place), spots = $('.spots', scene);
  stops.forEach((stop, i) => {
    const b = document.createElement('button');
    b.className = 'spot' + (stop.track ? ' track' : '') + (stop.go ? ' gate' : '');
    b.style.cssText = `--x:${stop.x}%;--y:${stop.y}%;--w:${stop.w || 12}%;--h:${stop.h || 10}%;--tilt:${stop.tilt || 0}deg`;
    b.dataset.stop = i;
    b.setAttribute('aria-label', `${stop.name}. ${stop.kind}${stop.go ? '. Fly in' : ''}`);
    const labelled = !stop.go && key !== 'media' && !sub;
    if (labelled) b.innerHTML = `<span class="tip">${esc(stop.name)}</span>`;
    spots.append(b);
  });
  const pick = e => e.target.closest('[data-stop]');
  const inspect = e => { const b = pick(e); if (b) App.emit('inspect', stops[+b.dataset.stop]); };
  [spots, $('.mobile-list', scene)].forEach(host => {
    host.addEventListener('pointerover', e => { if (e.pointerType !== 'touch') inspect(e); });
    host.addEventListener('focusin', inspect);
    host.addEventListener('pointerleave', () => App.emit('inspect', null));
    host.addEventListener('focusout', () => App.emit('inspect', null));
    host.addEventListener('click', e => { const b = pick(e); if (b) openStop(stops[+b.dataset.stop], b); });
  });

  // phones: the tiny printed song titles get readable buttons beneath the island
  if (key === 'as-seen-on' || key === 'event-central') {
    const list = $('.mobile-list', scene), rows = key === 'as-seen-on' ? stops.filter(s => s.track) : stops.slice(0, 1);
    list.hidden = false; list.classList.toggle('one', key === 'event-central');
    list.innerHTML = `<strong>${key === 'as-seen-on' ? 'As Seen On · songs' : 'Event Central · shows'}</strong><div class="rows">${rows.map(s => `<button data-stop="${stops.indexOf(s)}">${key === 'as-seen-on' ? `${stops.indexOf(s) + 1}. ` : ''}${esc(s.name)}</button>`).join('')}</div>`;
  }

  // the about story is told inside the moon's scene
  if (place.panel) {
    const panel = $('.moon-panel', scene);
    panel.hidden = false;
    panel.innerHTML = `<p class="eyebrow">Incoming transmission</p><h2>Meet MUMBO</h2>
      <img class="avatar" src="assets/character.webp" alt="MUMBO character in a fluffy blue jacket and star-covered bucket hat, holding glowing headphones">
      <p>I’m Ryan, aka MUMBO—a San Diego DJ and producer with a love for heavy bass, funky house, and taking the unexpected turn.</p>
      <p>My sets move between sounds, but the goal stays the same: make you move your body and leave with a smile. That playful energy shows up in the music, the cartoons, the characters, and everything you’ll find here.</p>
      <p>Mumbo’s World is where it all comes together. Pick a portal. Get a little lost.</p>
      <div class="btn-row">${ext(LINKS.instagram, 'Say hi on Instagram')}${ext(LINKS.email, 'Bookings')}</div>`;
  }

  // life: commuters cross the sky; citizens stroll the streets
  const life = $('.life', scene);
  if (place.construction) {
    life.insertAdjacentHTML('beforeend', place.construction.map(([x, y]) => `<img class="cone" src="assets/construction-sign.webp" alt="" style="left:${x}%;top:${y}%">`).join(''));
    board.insertAdjacentHTML('beforeend', '<span class="construction-badge">UNDER CONSTRUCTION</span>');
  }
  const streets = { music: [34, 66, 38, 62], media: [34, 66, 34, 66], toys: [30, 70, 36, 70], events: [28, 72, 58, 74] }[key];
  if (streets) {
    const [x0, x1, y0, y1] = streets;
    life.insertAdjacentHTML('beforeend', Array.from({ length: 18 }, (_, i) => {
      const x = x0 + ((i * 37) % 100) / 100 * (x1 - x0), y = y0 + ((i * 53) % 100) / 100 * (y1 - y0);
      return `<i class="citizen" style="--x:${x.toFixed(1)}%;--y:${y.toFixed(1)}%;--dx:${(i % 2 ? -1 : 1) * (14 + (i % 5) * 7)}px;--dy:${(i % 3 - 1) * 9}px;--dur:${7 + (i % 6) * 2}s;--delay:-${i * 1.7}s;--tint:${i * 47}deg"></i>`;
    }).join(''));
  }
  life.insertAdjacentHTML('beforeend', [0, 1, 2].map(i => `<i class="flyby ${i === 1 ? 'jet' : 'ship'}" style="--row:${10 + i * 30}%;--dur:${24 + i * 9}s;--delay:-${i * 9}s"></i>`).join(''));
  return scene;
}

/* ==========================================================================
   DIRECTORY DIALOG — building details, INFO, the blimp's show news
   ========================================================================== */
const dialog = $('#directory');
function openDialog(title, html) {
  $('#directoryTitle').textContent = title;
  $('#directoryBody').innerHTML = html;
  $('#directoryBody').scrollTop = 0;
  if (!dialog.open) dialog.showModal();
}
function closeDialog() { if (!dialog.open) return; $$('video', dialog).forEach(v => v.pause()); dialog.close(); $('#directoryBody').innerHTML = ''; }
$('#directoryClose').addEventListener('click', closeDialog);
dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
dialog.addEventListener('close', () => { $('#directoryBody').innerHTML = ''; });

function openStop(stop, origin) {
  if (stop.go) { travel(stop.go, { origin }); return; }
  let actions;
  if (stop.track && !stop.url) actions = chips(STREAMING);
  else if (stop.socials) actions = `<div class="social-grid">${SOCIALS.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.name} ↗</strong><span>${s.sub}</span></a>`).join('')}</div>`;
  else if (stop.url) actions = `<div class="btn-row">${ext(stop.url, stop.label || 'Visit')}</div>`;
  else actions = '<p class="soon">More details coming soon.</p>';
  openDialog(stop.name, `${stop.image ? `<img class="detail-art" src="assets/${stop.image}.webp" alt="">` : ''}<p class="eyebrow">${esc(stop.kind)}</p><p>${esc(stop.description)}</p>${actions}`);
}

function openDirectory() {
  const top = WORLDS[App.current] ? App.current : SUBWORLDS[App.current] ? 'music' : null;
  const nav = `<nav class="gps-worlds" aria-label="World destinations"><button data-go="galaxy">Home galaxy</button><button data-go="hub">World map</button>${WORLD_ORDER.map(k => `<button data-go="${k}" ${k === top ? 'aria-current="page"' : ''}>${WORLDS[k].title}</button>`).join('')}</nav>`;
  openDialog('Explore Mumbo’s World', nav + (top ? `<h3 class="section-title">${WORLDS[top].title}</h3>${WORLDS[top].guide()}` : `<p>Choose your next world.</p>${chips(SOCIALS)}`));
}
App.openDirectory = openDirectory;

App.on('show-news', () => {
  const next = upcomingShows(), past = pastShows();
  openDialog(next.length ? `Next stop: ${next[0].city.split(',')[0]}` : 'New shows landing soon',
    (next.length ? next.map(s => showCard(s)).join('') : `<p>No dates on the board right now — follow along for the next announcement.</p><div class="btn-row">${ext(LINKS.instagram, 'Show updates')}${ext(LINKS.email, 'Bookings')}</div>`) +
    (past.length ? `<h3 class="section-title">Last stop</h3>${showCard(past[0], true)}` : '') +
    '<div class="btn-row"><button class="btn" data-go="events">Fly to Event Central →</button></div>');
});

/* ---------- menu ---------- */
function closeMenu() { $('#menu').hidden = true; $('#menuToggle').setAttribute('aria-expanded', 'false'); }
$('#menuToggle').addEventListener('click', () => {
  const open = $('#menu').hidden;
  $('#menu').hidden = !open; $('#menuToggle').setAttribute('aria-expanded', String(open));
});

/* ==========================================================================
   SCENES
   ========================================================================== */
function mount(key) {
  const scene = key === 'galaxy' || key === 'hub' ? $('#' + key) : buildWorld(key);
  if (!scene.isConnected) $('#scenes').append(scene);
  scene.hidden = false;
  scene.classList.add('active');
  App.current = key;
  document.body.dataset.scene = key;
  document.title = key === 'galaxy' ? 'Mumbo’s World — Enter the universe' : `${titleOf(key)} — Mumbo’s World`;
  $('#announce').textContent = key === 'hub' ? 'World map. Choose your world.' : titleOf(key);
  const ring = ringOf(key);
  $('#edgeArrows').hidden = !ring;
  if (ring) {
    const i = ring.indexOf(key);
    $('.edge.prev').setAttribute('aria-label', 'Previous: ' + titleOf(ring[(i - 1 + ring.length) % ring.length]));
    $('.edge.next').setAttribute('aria-label', 'Next: ' + titleOf(ring[(i + 1) % ring.length]));
  }
  App.emit('scene', key);
  return scene;
}
function unmount(scene) {
  scene.classList.remove('active', 'leaving');
  scene.style.cssText = '';
  if (scene.id === 'galaxy' || scene.id === 'hub') scene.hidden = true; else scene.remove();
}
const decoded = new Map();
function preload(key) {
  const place = placeOf(key);
  if (!place) return Promise.resolve();
  const src = `assets/${place.art}.webp`;
  if (!decoded.has(src)) { const im = new Image(); im.src = src; decoded.set(src, im.decode().catch(() => {})); }
  return decoded.get(src);
}

/* ==========================================================================
   JOURNEYS
   ========================================================================== */
let journey = null;      // the one running journey
let pending = null;      // a Back/Forward that arrived mid-flight

function runJourney(duration, step, done) {
  const start = performance.now();
  journey = { done, step, finish: null };
  return new Promise(resolve => {
    const end = () => { if (!journey) return; const j = journey; journey = null; j.step(1); done(); resolve(); };
    journey.finish = end;
    const tick = now => {
      if (!journey) return;
      const p = App.paused ? 1 : clamp((now - start) / duration);
      step(p);
      if (p >= 1) end(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
// Resizing mid-flight would invalidate the camera path: land immediately instead.
addEventListener('resize', () => journey?.finish());

/* Camera helpers. A scene "flies" by moving `point` to the screen centre while
   scaling around it; the scene's own transform-origin stays at its top-left. */
const camera = (el, point, s, k) => {
  const cx = innerWidth / 2, cy = innerHeight * 0.45;
  const tx = (cx - point.x) * k, ty = (cy - point.y) * k;
  el.style.transformOrigin = `${point.x}px ${point.y}px`;
  el.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
};
const fillScale = point => clamp(Math.min(innerWidth, innerHeight) * 0.95 / Math.max(40, Math.min(point.w || 200, point.h || 200)), 3, 12);

function gateFor(from, to, scene) {
  if (to === 'hub' && from === 'galaxy') return $('.portal');
  if (from === 'galaxy') return $('.portal');
  if (from === 'hub') return to === 'about' ? $('#moonPlanet') : $(`.planet[data-go="${to}"]`);
  const i = placeOf(from) ? stopsOf(placeOf(from)).findIndex(s => s.go === to) : -1;
  return i >= 0 ? $(`.spot[data-stop="${i}"]`, scene) : null;
}

async function travel(to, { origin = null, step = 0, fromHistory = false } = {}) {
  if (!isPlace(to) || to === App.current) return;
  if (App.busy) { if (fromHistory) pending = to; return; }
  closeMenu(); closeDialog();
  App.busy = true;
  const from = App.current, old = activeScene;
  App.emit('travel-start', to);
  await Promise.race([preload(to), new Promise(r => setTimeout(r, 1500))]);
  $$('video').forEach(v => v.pause());

  const dIn = depthOf(to) > depthOf(from) && (parentOf(to) === from || from === 'galaxy');
  const dOut = depthOf(to) < depthOf(from) && (parentOf(from) === to || to === 'galaxy');
  const kind = from === 'galaxy' ? 'portal' : to === 'galaxy' ? 'home' : dIn ? 'in' : dOut ? 'out' : 'side';

  // where is the camera heading? measured before anything moves
  const gateEl = kind === 'in' ? (origin?.closest('.planet,.spot') || gateFor(from, to, old)) : null;
  const gate = gateEl ? centerOf(gateEl) : { x: innerWidth / 2, y: innerHeight * 0.45, w: 220, h: 220 };
  const portal = centerOf($('.portal'));

  const scene = mount(to);
  activeScene = scene;
  if (!fromHistory) history.pushState({ scene: to }, '', to === 'galaxy' ? location.pathname : '#' + to);
  document.body.classList.add('traveling', 'warping');
  old.classList.add('leaving');
  old.style.zIndex = 2; scene.style.zIndex = 3;
  scene.style.opacity = '0';

  // the place we are returning to, measured inside the new scene
  let back = null;
  if (kind === 'out' || kind === 'home') {
    const b = kind === 'home' ? $('.portal') : to === 'hub' ? (from === 'about' ? $('#moonPlanet') : $(`.planet[data-go="${from}"]`)) : $(`.spot[data-stop="${stopsOf(placeOf(to)).findIndex(s => s.go === from)}"]`, scene);
    back = b ? centerOf(b) : { x: innerWidth / 2, y: innerHeight * 0.45, w: 220, h: 220 };
  }

  const fx = { warp: false, clouds: false };
  const startWarp = o => { App.warp.start(o); fx.warp = true; };
  const startClouds = (x, y) => { App.clouds.start(x, y); fx.clouds = true; };
  let step$;

  if (kind === 'portal') {
    // 1. dive into the hat's wormhole, 2. ride the tunnel, 3. the universe opens up
    startWarp({ x: portal.x, y: portal.y, mode: 'tunnel' });
    step$ = p => {
      const a = easeIn(clamp(p / 0.62));
      camera(old, portal, 1 + 17 * a, ease(clamp(p / 0.62)));
      old.style.opacity = String(1 - clamp((p - 0.42) / 0.18));
      App.warp.draw(clamp((p - 0.08) / 0.8));
      const r = ease(clamp((p - 0.6) / 0.4));
      scene.style.transformOrigin = '50% 45%';
      scene.style.transform = `scale(${0.45 + 0.55 * r})`;
      scene.style.opacity = String(r);
    };
  } else if (kind === 'home') {
    // the reverse: the universe shrinks into the tunnel and the hat reappears around you
    startWarp({ x: innerWidth / 2, y: innerHeight * 0.45, mode: 'tunnel' });
    step$ = p => {
      const a = easeIn(clamp(p / 0.45));
      old.style.transformOrigin = '50% 45%';
      old.style.transform = `scale(${1 - 0.6 * a})`;
      old.style.opacity = String(1 - clamp((p - 0.2) / 0.25));
      App.warp.draw(clamp((p - 0.05) / 0.8));
      const r = ease(clamp((p - 0.42) / 0.58));
      camera(scene, back, 1 + 14 * (1 - r), 1 - r);
      scene.style.opacity = String(clamp((p - 0.42) / 0.3));
    };
  } else if (kind === 'in') {
    // fly at the chosen world until it fills the windshield, pass through its
    // atmosphere, and only then reveal the detailed landing scene
    const zoom = fillScale(gate);
    startWarp({ x: gate.x, y: gate.y, mode: 'in', strength: 0.55 });
    startClouds(gate.x, gate.y);
    step$ = p => {
      const a = ease(clamp(p / 0.66));
      camera(old, gate, 1 + (zoom - 1) * easeIn(clamp(p / 0.66)) , a);
      old.style.opacity = String(1 - clamp((p - 0.55) / 0.1));
      App.warp.draw(clamp(p / 0.7));
      App.clouds.draw(clamp((p - 0.36) / 0.56));          // densest at p ≈ .64
      const r = ease(clamp((p - 0.62) / 0.38));
      scene.style.transformOrigin = '50% 45%';
      scene.style.transform = `scale(${1.28 - 0.28 * r})`;
      scene.style.opacity = String(clamp((p - 0.6) / 0.12));
    };
  } else if (kind === 'out') {
    // climb out of the atmosphere and watch the world shrink back into place
    const zoom = fillScale(back);
    startWarp({ x: innerWidth / 2, y: innerHeight * 0.45, mode: 'out', strength: 0.5 });
    startClouds(innerWidth / 2, innerHeight * 0.45);
    step$ = p => {
      const a = ease(clamp(p / 0.4));
      old.style.transformOrigin = '50% 45%';
      old.style.transform = `scale(${1 + 0.3 * a})`;
      old.style.opacity = String(1 - clamp((p - 0.22) / 0.14));
      App.warp.draw(clamp(p / 0.9));
      App.clouds.draw(clamp((p + 0.06) / 0.62));           // densest at p ≈ .25
      const r = ease(clamp((p - 0.3) / 0.7));
      camera(scene, back, 1 + (zoom - 1) * (1 - r) ** 2, 1 - r);
      scene.style.opacity = String(clamp((p - 0.28) / 0.12));
    };
  } else {
    // neighbouring worlds: swing sideways through space
    const dir = step || (ringOf(to)?.indexOf(to) > ringOf(from)?.indexOf(from) ? 1 : -1) || 1;
    startWarp({ mode: 'side', dir, strength: 0.9 });
    step$ = p => {
      const e = ease(p), out = e * Math.PI / 2, inn = (1 - e) * Math.PI / 2, rad = innerWidth * 0.75;
      old.style.transformOrigin = '50% 50%'; scene.style.transformOrigin = '50% 50%';
      old.style.transform = `translateX(${-dir * Math.sin(out) * rad}px) translateZ(${-rad * 0.35 * (1 - Math.cos(out))}px) rotateY(${dir * out * 22}deg)`;
      scene.style.transform = `translateX(${dir * Math.sin(inn) * rad}px) translateZ(${-rad * 0.35 * (1 - Math.cos(inn))}px) rotateY(${-dir * inn * 22}deg)`;
      old.style.opacity = String(1 - e); scene.style.opacity = String(e);
      App.warp.draw(p);
    };
  }

  const duration = { portal: 2300, home: 1900, in: 2100, out: 1800, side: 1150 }[kind];
  await runJourney(duration, step$, () => {
    if (fx.warp) App.warp.stop();
    if (fx.clouds) App.clouds.stop();
    unmount(old);
    scene.style.cssText = '';
    document.body.classList.remove('traveling', 'warping');
    App.busy = false;
    App.lastTravel = performance.now();
    App.emit('arrived', to);
    const focus = to === 'galaxy' ? $('.portal') : to === 'hub' ? $('.planet[data-go="music"]') : $('h1', scene);
    focus?.focus({ preventScroll: true });
  });

  if (pending) { const next = pending; pending = null; if (next !== App.current) travel(next, { fromHistory: true }); }
}
App.travel = travel;

function step(dir) {
  const ring = ringOf(App.current);
  if (!ring || App.busy) return;
  const i = ring.indexOf(App.current);
  travel(ring[(i + dir + ring.length) % ring.length], { step: dir });
}
const goBack = () => { const up = parentOf(App.current); if (up) travel(up); };
App.step = step;

/* ==========================================================================
   INPUTS — each one maps to exactly one action
   ========================================================================== */
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { e.preventDefault(); travel(go.dataset.go, { origin: go }); return; }
  if (e.target.closest('[data-directory]')) { closeMenu(); openDirectory(); return; }
  if (e.target.closest('[data-back]')) { goBack(); return; }
  const edge = e.target.closest('[data-step]');
  if (edge) { step(+edge.dataset.step); return; }
  if (!e.target.closest('#menu,#menuToggle')) closeMenu();
});

$$('.planet').forEach(p => {
  p.setAttribute('aria-label', `${WORLDS[p.dataset.go].title}: ${WORLDS[p.dataset.go].info}`);
  p.addEventListener('pointerenter', () => { hoveredPlanet = p; App.emit('hover-world', p.dataset.go); });
  p.addEventListener('focus', () => App.emit('hover-world', p.dataset.go));
  p.addEventListener('pointerleave', () => { hoveredPlanet = null; App.emit('hover-world', null); });
  p.addEventListener('blur', () => App.emit('hover-world', null));
});

/* Scroll up = fly in, scroll down = fly back out. One gesture, one journey. */
let wheelSum = 0, wheelAt = 0, wheelLock = false;
addEventListener('wheel', e => {
  if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.target.closest('#cockpit,#directory,#menu,.moon-panel')) return;
  const now = performance.now(), quiet = now - wheelAt;
  wheelAt = now;
  if (App.busy || now - (App.lastTravel || 0) < 450) { wheelLock = true; e.preventDefault(); return; }
  if (wheelLock && quiet < 220) { e.preventDefault(); return; }
  wheelLock = false;
  let target = null, origin = null;
  if (e.deltaY < 0) {
    if (App.current === 'galaxy') { target = 'hub'; origin = $('.portal'); }
    else if (App.current === 'hub') { origin = e.target.closest('.planet') || hoveredPlanet; target = origin?.dataset.go; }
  } else if (e.deltaY > 0) target = parentOf(App.current);
  if (!target) return;
  e.preventDefault();
  if (quiet > 250 || Math.sign(wheelSum) !== Math.sign(e.deltaY)) wheelSum = 0;
  wheelSum += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
  if (Math.abs(wheelSum) >= 65) { wheelSum = 0; wheelLock = true; travel(target, { origin }); }
}, { passive: false });

document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,#reel')) return;
  if (dialog.open) return;                       // the dialog handles its own Escape
  if (e.key === 'Escape') {
    if (!$('#menu').hidden) { closeMenu(); $('#menuToggle').focus(); return; }
    goBack(); return;
  }
  if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && ringOf(App.current)) { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); }
  if (e.key === 'ArrowUp' && SUBWORLDS[App.current]) { e.preventDefault(); goBack(); }
});

/* Swipe sideways between neighbouring worlds on touch screens. */
let touch = null;
$('#scenes').addEventListener('pointerdown', e => { if (e.pointerType === 'touch') touch = { x: e.clientX, y: e.clientY }; });
$('#scenes').addEventListener('pointerup', e => {
  if (!touch || e.pointerType !== 'touch') return;
  const dx = e.clientX - touch.x, dy = e.clientY - touch.y; touch = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && ringOf(App.current) && !e.target.closest('.moon-panel')) step(dx < 0 ? 1 : -1);
});

addEventListener('popstate', () => {
  const key = location.hash.slice(1) || 'galaxy';
  travel(isPlace(key) ? key : 'galaxy', { fromHistory: true });
});

/* ---------- boot ---------- */
(() => {
  const key = location.hash.slice(1);
  history.replaceState({ scene: key || 'galaxy' }, '');
  if (isPlace(key) && key !== 'galaxy') { $('#galaxy').hidden = true; activeScene = mount(key); }
  else { $('#galaxy').classList.add('active'); App.emit('scene', 'galaxy'); }
  const warm = () => [...WORLD_ORDER, ...MUSIC_ORDER].forEach(preload);
  'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 2500 }) : setTimeout(warm, 800);
})();
