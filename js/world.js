/* ==========================================================================
   MUMBO'S WORLD — NAVIGATION
   Scenes: galaxy (home) → hub (world map) → a world → a Music Island mini world.
   Every route is a URL hash, so back/forward and shared links work.
   ========================================================================== */
const depthOf = key => key === 'galaxy' ? 0 : key === 'hub' ? 1 : WORLDS[key] ? 2 : SUBWORLDS[key] ? 3 : -1;
const parentOf = key => SUBWORLDS[key] ? 'music' : WORLDS[key] ? 'hub' : key === 'hub' ? 'galaxy' : null;
const ringOf = key => SUBWORLDS[key] ? MUSIC_ORDER : WORLDS[key] ? WORLD_ORDER : null;
const isPlace = key => depthOf(key) >= 0;

let activeScene = $('#galaxy');
let hoveredPlanet = null;
const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

/* ---------- passport stamps ---------- */
const stamps = new Set(store.get('stamps', []).filter(k => WORLDS[k]));
function stamp(key) {
  if (!WORLDS[key]) return false;
  const fresh = !stamps.has(key);
  stamps.add(key); store.set('stamps', [...stamps]);
  $('#stampCount').textContent = stamps.size;
  $('#stampChip').classList.toggle('complete', stamps.size === WORLD_ORDER.length);
  if (fresh) { const chip = $('#stampChip'); chip.classList.remove('pop'); void chip.offsetWidth; chip.classList.add('pop'); }
  return fresh;
}
$('#stampCount').textContent = stamps.size;
$('#stampChip').classList.toggle('complete', stamps.size === WORLD_ORDER.length);
App.stamps = stamps;

/* ---------- building a world scene ---------- */
function buildWorld(key) {
  const place = placeOf(key), sub = !!SUBWORLDS[key];
  const scene = $('#worldTemplate').content.firstElementChild.cloneNode(true);
  scene.id = 'scene-' + key;
  scene.dataset.place = key;
  scene.setAttribute('aria-labelledby', 'title-' + key);
  scene.classList.toggle('sub', sub);
  $('.eyebrow', scene).textContent = place.kicker;
  const h1 = $('h1', scene); h1.textContent = place.title; h1.id = 'title-' + key;
  const back = $('[data-back]', scene); back.textContent = sub ? '← Music Island' : '← World map';
  const board = $('.board', scene); board.style.setProperty('--ratio', place.ratio);
  const img = $('.art img', scene);
  img.src = `assets/${place.art}.webp`;
  img.alt = sub ? `A close-up view of ${place.title} inside Music Island` : `An overhead view of ${place.title}, with themed buildings to explore`;
  if (place.zoom) { img.style.transformOrigin = `${place.zoom.x}% ${place.zoom.y}%`; img.style.transform = `scale(${place.zoom.scale})`; }
  if (place.lens) board.classList.add('lens');
  if (place.notice) { const n = $('.world-notice', scene); n.hidden = false; n.textContent = place.notice; }

  const stops = stopsOf(place), spots = $('.spots', scene), legend = $('.legend', scene);
  stops.forEach((stop, i) => {
    const b = document.createElement('button');
    b.className = 'spot' + (stop.track ? ' track' : '') + (stop.go ? ' gate' : '');
    b.style.cssText = `--x:${stop.x}%;--y:${stop.y}%;--w:${stop.w || 12}%;--h:${stop.h || 10}%;--tilt:${stop.tilt || 0}deg`;
    b.dataset.stop = i;
    b.setAttribute('aria-label', `${stop.name}. ${stop.kind}${stop.go ? '. Fly in' : ''}`);
    b.innerHTML = `<span class="spot-label">${esc(stop.name)}${stop.go ? ' <b aria-hidden="true">↗</b>' : ''}</span>`;
    spots.append(b);
    const chip = document.createElement('button');
    chip.className = 'legend-chip'; chip.dataset.stop = i; chip.textContent = stop.track ? `${i + 1}. ${stop.name}` : stop.name;
    legend.append(chip);
  });
  const show = e => { const b = e.target.closest('[data-stop]'); if (b) App.emit('inspect', stops[+b.dataset.stop]); };
  [spots, legend].forEach(host => {
    host.addEventListener('pointerover', e => { if (e.pointerType !== 'touch') show(e); });
    host.addEventListener('focusin', show);
    host.addEventListener('pointerleave', () => App.emit('inspect', null));
    host.addEventListener('focusout', () => App.emit('inspect', null));
    host.addEventListener('click', e => { const b = e.target.closest('[data-stop]'); if (b) openStop(stops[+b.dataset.stop], b); });
  });

  if (place.construction) {
    $('.life', scene).insertAdjacentHTML('beforeend', place.construction.map(([x, y]) => `<img class="cone" src="assets/construction-sign.webp" alt="" style="left:${x}%;top:${y}%">`).join(''));
  }
  $('.life', scene).insertAdjacentHTML('beforeend', [0, 1, 2].map(i => `<i class="flyby ${i === 1 ? 'jet' : 'ship'}" style="--row:${14 + i * 28}%;--dur:${26 + i * 9}s;--delay:-${i * 8}s"></i>`).join(''));
  return scene;
}

/* ---------- stop cards ---------- */
function openStop(stop, origin) {
  if (stop.go) { travel(stop.go, { origin }); return; }
  let actions = '';
  if (stop.track && !stop.url) actions = chips(STREAMING);
  else if (stop.socials) actions = `<div class="social-grid compact">${SOCIALS.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.name} <span aria-hidden="true">↗</span></strong><span>${s.sub}</span></a>`).join('')}</div>`;
  else if (stop.url) actions = `<div class="btn-row">${ext(stop.url, stop.label || 'Visit')}</div>`;
  else actions = '<p class="soon">More details coming soon.</p>';
  openCard(`
    ${stop.image ? `<img class="card-art" src="assets/${stop.image}.webp" alt="">` : ''}
    <p class="eyebrow">${esc(stop.kind)}</p>
    <h2 id="cardTitle">${esc(stop.name)}</h2>
    <p>${esc(stop.description)}</p>
    ${actions}`);
}
function openCard(html) {
  const card = $('#card');
  $('#cardBody').innerHTML = html;
  if (!card.open) card.showModal();
}
function closeCard() { const card = $('#card'); if (card.open) { $$('video', card).forEach(v => v.pause()); card.close(); } }
$('#cardClose').addEventListener('click', closeCard);
$('#card').addEventListener('click', e => { if (e.target === e.currentTarget) closeCard(); });

App.on('show-news', () => {
  const next = upcomingShows(), past = pastShows();
  openCard(`
    <p class="eyebrow">${next.length ? 'Next stop' : 'Show news'}</p>
    <h2 id="cardTitle">${next.length ? esc(next[0].city.split(',')[0]) : 'New dates are cooking'}</h2>
    ${next.length ? next.map(s => showCard(s)).join('') : `<p>No dates on the board right now. Follow along for the next announcement.</p><div class="btn-row">${ext(LINKS.instagram, 'Show updates')}${ext(LINKS.email, 'Bookings')}</div>`}
    ${past.length ? `<h3 class="section-title">Last stop</h3>${showCard(past[0], true)}` : ''}
    <div class="btn-row"><button class="btn" data-go="events">Fly to Event Central →</button></div>`);
});

/* ---------- the world guide drawer ---------- */
const guide = $('#guide');
function openGuide(key = App.current) {
  const world = WORLDS[key] || (SUBWORLDS[key] ? WORLDS.music : null);
  const target = WORLDS[key] ? key : SUBWORLDS[key] ? 'music' : null;
  $('#guideNav').innerHTML = `<button data-go="hub">World map</button>` + WORLD_ORDER.map(k => `<button data-go="${k}" ${k === target ? 'aria-current="page"' : ''}>${stamps.has(k) ? '★ ' : ''}${WORLDS[k].title}</button>`).join('');
  if (world) {
    $('#guideKicker').textContent = world.kicker;
    $('#guideTitle').textContent = world.title;
    $('#guideBody').innerHTML = world.guide();
    $('#guideBanner').style.backgroundImage = `url(assets/${world.banner}.webp)`;
  } else {
    $('#guideKicker').textContent = 'Welcome aboard';
    $('#guideTitle').textContent = 'Explore Mumbo’s World';
    $('#guideBanner').style.backgroundImage = 'url(assets/hub.webp)';
    $('#guideBody').innerHTML = `
      <p>Pick a planet, collect a passport stamp from each one, and get a little lost.</p>
      <div class="world-list">${WORLD_ORDER.map(k => `<button data-go="${k}"><strong>${stamps.has(k) ? '★ ' : ''}${WORLDS[k].title}</strong><span>${WORLDS[k].info}</span></button>`).join('')}</div>
      <h3 class="section-title">Find MUMBO</h3>${chips(SOCIALS)}`;
  }
  guide.hidden = false;
  requestAnimationFrame(() => guide.classList.add('open'));
  guide.scrollTop = 0;
  document.body.classList.add('guide-open');
  $('#guideTitle').focus({ preventScroll: true });
  closeMenu();
}
function closeGuide() {
  if (guide.hidden) return;
  $$('video', guide).forEach(v => v.pause());
  guide.classList.remove('open');
  document.body.classList.remove('guide-open');
  setTimeout(() => { if (!guide.classList.contains('open')) { guide.hidden = true; $('#guideBody').innerHTML = ''; } }, 350);
}
$('#guideClose').addEventListener('click', closeGuide);
App.openGuide = openGuide;

/* ---------- menu ---------- */
function closeMenu() { $('#menu').hidden = true; $('#menuToggle').setAttribute('aria-expanded', 'false'); }
$('#menuToggle').addEventListener('click', () => {
  const open = $('#menu').hidden;
  $('#menu').hidden = !open; $('#menuToggle').setAttribute('aria-expanded', String(open));
  if (open) $('#menu button').focus();
});

/* ---------- presenting a scene ---------- */
function mount(key) {
  let scene;
  if (key === 'galaxy' || key === 'hub') scene = $('#' + key);
  else { scene = buildWorld(key); $('#scenes').append(scene); }
  scene.hidden = false;
  scene.classList.add('active');
  App.current = key;
  document.body.dataset.scene = key;
  document.body.dataset.depth = depthOf(key);
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
  const area = $('.board-area', scene);
  if (area) requestAnimationFrame(() => { area.scrollLeft = (area.scrollWidth - area.clientWidth) / 2; });
  return scene;
}
function unmount(scene) {
  scene.classList.remove('active', 'leaving');
  scene.getAnimations().forEach(a => a.cancel());
  scene.style.cssText = '';
  if (scene.id === 'galaxy' || scene.id === 'hub') scene.hidden = true; else scene.remove();
}

const preloaded = new Map();
function preload(key) {
  const place = placeOf(key);
  if (!place) return Promise.resolve();
  const src = `assets/${place.art}.webp`;
  if (!preloaded.has(src)) { const im = new Image(); im.src = src; preloaded.set(src, im.decode().catch(() => {})); }
  return preloaded.get(src);
}

/* ---------- travel ---------- */
let travelId = 0;
async function travel(to, { origin = null, step = 0, fromHistory = false } = {}) {
  if (!isPlace(to) || to === App.current || App.busy) return;
  closeMenu(); closeCard(); closeGuide();
  App.busy = true;
  const id = ++travelId, from = App.current, old = activeScene;
  App.emit('travel-start', to);
  await Promise.race([preload(to), new Promise(r => setTimeout(r, 1500))]);
  if (id !== travelId) return;
  $$('video').forEach(v => v.pause());

  const goingIn = depthOf(to) > depthOf(from);
  const lateral = step || (depthOf(to) === depthOf(from) && depthOf(to) >= 2 ? 1 : 0);
  let point = origin ? center(origin) : null;
  if (!point && goingIn) {
    const gate = from === 'galaxy' ? $('.portal') : from === 'hub' ? $(`.planet[data-go="${to}"]`) : $(`.spot.gate[data-stop="${stopsOf(placeOf(from)).findIndex(s => s.go === to)}"]`, old);
    if (gate) point = center(gate);
  }
  if (from === 'galaxy') point = center($('.portal'));

  const scene = mount(to);
  activeScene = scene;
  if (!fromHistory) history.pushState({ scene: to }, '', to === 'galaxy' ? location.pathname : '#' + to);

  const finish = () => {
    if (id !== travelId) return;
    unmount(old);
    App.busy = false;
    App.lastTravel = performance.now();
    document.body.classList.remove('traveling');
    if (WORLDS[to]) {
      const fresh = stamp(to);
      App.emit('arrived', to, fresh);
    } else App.emit('arrived', to, false);
    const focus = to === 'galaxy' ? $('.portal') : to === 'hub' ? $('.planet[data-go="music"]') : $('h1', scene);
    focus?.focus({ preventScroll: true });
  };

  if (App.paused) { finish(); return; }
  document.body.classList.add('traveling');
  old.classList.add('leaving');

  if (lateral && !goingIn && depthOf(to) === depthOf(from)) {
    // orbit sideways between neighbouring worlds
    const dir = lateral > 0 ? 1 : -1, D = 850;
    App.warp({ lateral: dir, duration: D });
    old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 55}%) rotateY(${dir * 28}deg) scale(.8)`, opacity: 0 }], { duration: D, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' });
    await scene.animate([{ transform: `translateX(${dir * 55}%) rotateY(${-dir * 28}deg) scale(.8)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: D, easing: 'cubic-bezier(.6,0,.4,1)' }).finished.catch(() => {});
    finish(); return;
  }

  if (goingIn) {
    // dive into the point the visitor chose
    const p = point || { x: innerWidth / 2, y: innerHeight * 0.45 };
    const portal = from === 'galaxy', D = portal ? 1700 : 1250, zoom = portal ? 16 : 7;
    App.warp({ x: p.x, y: p.y, duration: D, strength: portal ? 1 : 0.75 });
    old.style.transformOrigin = `${p.x}px ${p.y}px`;
    old.style.zIndex = 3;
    old.animate([
      { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' },
      { transform: `scale(${zoom * 0.35})`, opacity: 1, filter: 'blur(0)', offset: 0.45 },
      { transform: `scale(${zoom})`, opacity: 0, filter: 'blur(8px)' }
    ], { duration: D, easing: 'cubic-bezier(.55,0,.75,.25)', fill: 'forwards' });
    await scene.animate([
      { transform: 'scale(.55)', opacity: 0 },
      { transform: 'scale(.7)', opacity: 0, offset: 0.4 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: D, easing: 'cubic-bezier(.2,.6,.3,1)' }).finished.catch(() => {});
    finish(); return;
  }

  // pull back out to where we came from
  const D = 1100;
  let gate = to === 'galaxy' ? $('.portal') : to === 'hub' ? $(`.planet[data-go="${from}"]`) : $(`.spot.gate[data-stop="${stopsOf(placeOf(to)).findIndex(s => s.go === from)}"]`, scene);
  const p = gate ? center(gate) : { x: innerWidth / 2, y: innerHeight * 0.45 };
  App.warp({ x: p.x, y: p.y, duration: D, reverse: true, strength: 0.7 });
  scene.style.transformOrigin = `${p.x}px ${p.y}px`;
  scene.style.zIndex = 3;
  old.style.zIndex = 2;
  old.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.3)', opacity: 0, filter: 'blur(6px)' }], { duration: D * 0.6, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' });
  await scene.animate([
    { transform: 'scale(5)', opacity: 0, filter: 'blur(6px)' },
    { transform: 'scale(3)', opacity: 0, offset: 0.3 },
    { transform: 'scale(1)', opacity: 1, filter: 'blur(0)' }
  ], { duration: D, easing: 'cubic-bezier(.15,.7,.25,1)' }).finished.catch(() => {});
  scene.style.transformOrigin = ''; scene.style.zIndex = '';
  finish();
}
App.travel = travel;

function step(dir) {
  const ring = ringOf(App.current);
  if (!ring || App.busy) return;
  const i = ring.indexOf(App.current);
  travel(ring[(i + dir + ring.length) % ring.length], { step: dir });
}
function back() { const up = parentOf(App.current); if (up) travel(up); }
App.step = step;

/* ---------- inputs ---------- */
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { e.preventDefault(); travel(go.dataset.go, { origin: go.closest('.planet,.portal,.spot') || null }); return; }
  if (e.target.closest('[data-guide]')) { guide.classList.contains('open') ? closeGuide() : openGuide(); return; }
  if (e.target.closest('[data-back]')) { back(); return; }
  if (e.target.closest('[data-step]')) { step(+e.target.closest('[data-step]').dataset.step); return; }
  if (!e.target.closest('#menu,#menuToggle')) closeMenu();
});

$$('.planet').forEach(p => {
  p.addEventListener('pointerenter', () => { hoveredPlanet = p; App.emit('hover-world', p.dataset.go); });
  p.addEventListener('focus', () => App.emit('hover-world', p.dataset.go));
  p.addEventListener('pointerleave', () => hoveredPlanet = null);
  p.setAttribute('aria-label', `${WORLDS[p.dataset.go].title}: ${WORLDS[p.dataset.go].info}`);
});

/* Scroll up = dive in, scroll down = pull back out. */
let wheelSum = 0, wheelAt = 0, wheelLock = false;
addEventListener('wheel', e => {
  if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.target.closest('#cockpit,#guide,#card,#menu')) return;
  const now = performance.now(), quiet = now - wheelAt;
  wheelAt = now;
  if (App.busy || now - (App.lastTravel || 0) < 400) { wheelLock = true; e.preventDefault(); return; }
  if (wheelLock && quiet < 200) { e.preventDefault(); return; }
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
  if (Math.abs(wheelSum) >= 70) { wheelSum = 0; wheelLock = true; travel(target, { origin }); }
}, { passive: false });

document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea,#reel')) return;
  if (e.key === 'Escape') {
    if ($('#card').open) return; // the dialog closes itself
    if (guide.classList.contains('open')) { closeGuide(); return; }
    if (!$('#menu').hidden) { closeMenu(); $('#menuToggle').focus(); return; }
    back(); return;
  }
  if ($('#card').open || guide.classList.contains('open')) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { if (ringOf(App.current)) { e.preventDefault(); step(e.key === 'ArrowLeft' ? -1 : 1); } }
  if (e.key === 'ArrowUp' && SUBWORLDS[App.current]) { e.preventDefault(); back(); }
});

/* Swipe sideways between neighbouring worlds on touch screens. */
let touch = null;
$('#scenes').addEventListener('pointerdown', e => { if (e.pointerType === 'touch') touch = { x: e.clientX, y: e.clientY }; });
$('#scenes').addEventListener('pointerup', e => {
  if (!touch || e.pointerType !== 'touch') return;
  const dx = e.clientX - touch.x, dy = e.clientY - touch.y; touch = null;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && ringOf(App.current)) step(dx < 0 ? 1 : -1);
});

addEventListener('popstate', () => {
  const key = location.hash.slice(1) || 'galaxy';
  travel(isPlace(key) ? key : 'galaxy', { fromHistory: true });
});

/* ---------- boot ---------- */
(() => {
  const key = location.hash.slice(1);
  history.replaceState({ scene: key || 'galaxy' }, '');
  if (isPlace(key) && key !== 'galaxy') { $('#galaxy').hidden = true; $('#galaxy').classList.remove('active'); activeScene = mount(key); stamp(key); }
  else { $('#galaxy').classList.add('active'); App.emit('scene', 'galaxy'); }
  const warm = () => [...WORLD_ORDER, ...MUSIC_ORDER].forEach(preload);
  'requestIdleCallback' in window ? requestIdleCallback(warm, { timeout: 2500 }) : setTimeout(warm, 800);
})();
