/* ==========================================================================
   MUMBO'S WORLD — THE DASHBOARD
   One GPS controller (reel + INFO screen + Enter), the pixel copilot in the
   left porthole, Mumbo Radio in the right porthole, and the volume knob.
   ========================================================================== */

/* ---------- GPS ---------- */
(() => {
  const strip = $('#reelStrip'), win = $('#reelWindow'), details = $('#gpsDetails'), enterLabel = $('#enterLabel'), live = $('#reelLive');
  let keys = WORLD_ORDER, selected = 0, rolling = false, queued = 0, chosen = false, hovering = null, wanted = null;
  const wrap = i => (i + keys.length) % keys.length;

  function fill() {
    strip.classList.remove('rolling', 'roll-up', 'roll-down');
    strip.style.transform = '';
    strip.innerHTML = [-2, -1, 0, 1, 2].map(o => {
      const t = titleOf(keys[wrap(selected + o)]);
      const cls = [o === 0 ? 'now' : '', o === -1 ? 'before' : '', o === 1 ? 'after' : '', t.length > 15 ? 'long' : ''].join(' ').trim();
      return `<span class="${cls}">${esc(t)}</span>`;
    }).join('');
    live.textContent = `GPS: ${titleOf(keys[selected])}`;
    const here = keys[selected] === App.current;
    enterLabel.textContent = here ? 'OPEN INFO' : 'ENTER WORLD';
  }
  function show(html) {
    if (details.innerHTML === html) return;
    details.innerHTML = html;
    details.classList.remove('swap'); void details.offsetWidth; details.classList.add('swap');
  }
  function describe() {
    if (hovering) { show(`<h2>${esc(hovering.name)}</h2><p>${esc(hovering.kind)}</p>`); return; }
    const top = App.current === 'galaxy' || App.current === 'hub';
    if (top && !chosen) { show(`<p>${esc(GPS_IDLE)}</p>`); return; }
    const place = placeOf(keys[selected]);
    show(`<h2>${esc(place.title)}</h2><p>${esc(place.info)}</p>`);
  }
  function sync(name) {
    keys = SUBWORLDS[name] ? MUSIC_ORDER : WORLD_ORDER;
    const i = keys.indexOf(name);
    if (i >= 0) selected = i;
    chosen = i >= 0; hovering = null;
    fill(); describe();
    $$('.planet').forEach(p => p.classList.remove('targeted'));
  }

  /* The drum physically rolls: the outgoing name slides away and the incoming
     one slides into the window, in the same direction as the input. */
  function rotate(dir) {
    if (App.busy) return;
    if (rolling) { queued = dir; return; }
    rolling = true; chosen = true;
    const next = wrap(selected + dir);
    const land = () => {
      selected = next; rolling = false; fill(); describe();
      const inWorld = depthOf(App.current) >= 2;
      if (inWorld) App.travel(keys[selected], { step: dir });       // inside a world the GPS flies you there
      else $$('.planet').forEach(p => p.classList.toggle('targeted', p.dataset.go === keys[selected]));
      if (queued && !App.busy) { const q = queued; queued = 0; rotate(q); } else queued = 0;
    };
    if (App.paused) { land(); return; }
    void strip.offsetHeight;
    strip.classList.add('rolling', dir > 0 ? 'roll-down' : 'roll-up');
    strip.style.transform = `translateY(${dir > 0 ? -40 : 0}%)`;
    setTimeout(land, 520);
  }
  function enter() {
    if (App.busy || rolling) return;
    const key = keys[selected];
    if (key === App.current) { App.openDirectory(); return; }
    const origin = App.current === 'hub' ? (key === 'about' ? $('#moonPlanet') : $(`.planet[data-go="${key}"]`)) : null;
    App.travel(key, { origin });
  }

  $('#reelUp').addEventListener('click', () => rotate(-1));
  $('#reelDown').addEventListener('click', () => rotate(1));
  $('#reelEnter').addEventListener('click', enter);
  win.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); rotate(e.key === 'ArrowUp' ? -1 : 1); }
    if (e.key === 'Enter') { e.preventDefault(); enter(); }
  });
  let wheelSum = 0, wheelAt = 0;
  $('#reel').addEventListener('wheel', e => {
    e.preventDefault(); e.stopPropagation();
    const now = performance.now();
    if (now - wheelAt > 200) wheelSum = 0;
    wheelAt = now; wheelSum += e.deltaY;
    if (Math.abs(wheelSum) >= 28) { rotate(Math.sign(wheelSum)); wheelSum = 0; }
  }, { passive: false });
  let dragY = null;
  win.addEventListener('pointerdown', e => { dragY = e.clientY; win.setPointerCapture(e.pointerId); });
  win.addEventListener('pointermove', e => { if (dragY === null) return; const dy = e.clientY - dragY; if (Math.abs(dy) >= 24) { rotate(dy > 0 ? -1 : 1); dragY = e.clientY; } });
  ['pointerup', 'pointercancel'].forEach(t => win.addEventListener(t, () => dragY = null));

  // hovering a world on the map rolls the GPS to it
  App.on('hover-world', key => {
    if (App.busy || App.current !== 'hub') return;
    wanted = key;
    if (!key) { describe(); return; }
    const i = keys.indexOf(key);
    if (i < 0 || rolling) return;
    chosen = true;
    if (i !== selected) {
      const fwd = wrap(i - selected) <= keys.length / 2;
      selected = wrap(i - (fwd ? 1 : -1));                      // roll the final notch so it visibly moves
      fill(); rolling = false; rotateTo(i, fwd ? 1 : -1);
    } else describe();
  });
  function rotateTo(i, dir) {
    rolling = true;
    const land = () => {
      selected = i; rolling = false; fill(); describe();
      // the pointer may have moved on while the drum was turning: follow it
      if (wanted && keys[selected] !== wanted) App.emit('hover-world', wanted);
    };
    if (App.paused) { land(); return; }
    void strip.offsetHeight;
    strip.classList.add('rolling', dir > 0 ? 'roll-down' : 'roll-up');
    strip.style.transform = `translateY(${dir > 0 ? -40 : 0}%)`;
    setTimeout(land, 520);
  }
  App.on('inspect', stop => { if (App.busy) return; hovering = stop; describe(); });
  App.on('scene', sync);
  App.on('travel-start', () => { $('#gpsMode').textContent = 'IN FLIGHT'; hovering = null; });
  App.on('arrived', () => { $('#gpsMode').textContent = 'EXPLORER'; describe(); });
  sync(App.current);
})();

/* ---------- copilot: a live pixel face in the left porthole ---------- */
(() => {
  const btn = $('#copilot'), face = $('#botFace'), bubble = $('#copilotSays');
  const px = cells => cells.map(([x, y, w = 1, h = 1]) => `<rect class="px" x="${x}" y="${y}" width="${w}" height="${h}"/>`).join('');
  // eyes are drawn relative to (ex, ey); mirrored for the right eye where needed
  const EYE = {
    open: (x, y) => px([[x, y - 2, 4, 1], [x, y, 4, 6]]) + `<rect x="${x + 1}" y="${y + 1}" width="1" height="2" fill="#041621"/>`,
    blink: (x, y) => px([[x, y - 2, 4, 1], [x, y + 4, 4, 1]]),
    happy: (x, y) => px([[x - 1, y + 3], [x, y + 2], [x + 1, y + 1, 2, 1], [x + 3, y + 2], [x + 4, y + 3]]),
    sleepy: (x, y) => px([[x - 1, y + 3, 6, 1], [x, y + 4, 4, 1]]),
    curious: (x, y, right) => right ? EYE.open(x, y) : px([[x - 1, y - 1], [x, y - 2, 2, 1], [x + 2, y - 3], [x, y, 4, 6]]) + `<rect x="${x + 1}" y="${y + 1}" width="1" height="2" fill="#041621"/>`
  };
  const MOUTH = {
    neutral: px([[13, 14], [14, 15, 4, 1], [18, 14]]),
    laugh: px([[12, 12, 8, 1], [12, 13], [19, 13], [13, 14], [18, 14], [14, 15, 4, 1], [13, 13, 6, 1]]),
    curious: px([[15, 14, 2, 1], [14, 15], [17, 15], [15, 16, 2, 1]]),
    sleepy: px([[14, 15, 4, 1]])
  };
  let mood = 'neutral', look = { x: 0, y: 0 }, blinkUntil = 0, nextBlink = performance.now() + 3000, moodTimer, bubbleTimer, drawn = '';
  function draw(now) {
    const blinking = now < blinkUntil && (mood === 'neutral' || mood === 'curious');
    const lx = Math.round(look.x * 2), ly = Math.round(look.y * 1.4);
    const key = `${mood}${blinking}${lx}${ly}`;
    if (key === drawn) return;
    drawn = key;
    const eye = blinking ? EYE.blink : mood === 'laugh' ? EYE.happy : mood === 'sleepy' ? EYE.sleepy : mood === 'curious' ? EYE.curious : EYE.open;
    face.innerHTML = `<g class="glow" transform="translate(${lx} ${ly})">${eye(7, 4, false)}${eye(21, 4, true)}<g transform="translate(${-lx / 2} 0)">${MOUTH[mood]}</g></g>`;
  }
  function setMood(m, ms) {
    mood = m; btn.dataset.mood = m;
    clearTimeout(moodTimer);
    moodTimer = setTimeout(() => { mood = 'neutral'; btn.dataset.mood = 'neutral'; }, ms);
  }
  // Existing behaviour: a click picks a fresh MUMBO phrase, laughs for 5s, bubble for 7.5s.
  let lastQuote = -1;
  const interval = () => 150000 + Math.random() * 90000;      // 2½–4 minutes
  let nextSpeech = performance.now() + interval(), nextMood = performance.now() + 7000;
  function speak() {
    let i; do { i = Math.random() * COPILOT_QUOTES.length | 0; } while (i === lastQuote);
    lastQuote = i;
    bubble.textContent = COPILOT_QUOTES[i]; bubble.hidden = false;
    setMood('laugh', 5000);
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => bubble.hidden = true, 7500);
    nextSpeech = performance.now() + interval();
  }
  btn.addEventListener('click', speak);
  btn.addEventListener('pointerenter', () => setMood('curious', 1800));
  setInterval(() => {
    if (document.hidden) return;
    const now = performance.now();
    if (now >= nextSpeech) speak();
    if (!App.paused && now >= nextMood) { setMood(Math.random() < 0.5 ? 'laugh' : 'curious', 3200); nextMood = now + 9000 + Math.random() * 13000; }
  }, 1000);
  App.tasks.add(now => {
    if (!App.paused) {
      const r = btn.getBoundingClientRect();
      const tx = clamp((App.pointer.x - r.left - r.width / 2) / (innerWidth * 0.45), -1, 1), ty = clamp((App.pointer.y - r.top - r.height / 2) / (innerHeight * 0.45), -1, 1);
      look.x = lerp(look.x, tx, 0.075); look.y = lerp(look.y, ty, 0.075);
      if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + 2500 + Math.random() * 4000; }
    }
    draw(now);
  });
  draw(performance.now());
})();

/* ---------- volume knob (drives video volume until Mumbo Radio launches) ---------- */
(() => {
  const knob = $('#knob'), out = $('#volOut');
  let volume = store.get('volume', 70), drag = null;
  const apply = () => $$('video').forEach(v => v.volume = volume / 100);
  function set(v) {
    volume = clamp(Math.round(v), 0, 100);
    knob.style.setProperty('--turn', `${-135 + volume * 2.7}deg`);
    knob.setAttribute('aria-valuenow', volume); out.textContent = volume;
    $$('#volMeter i').forEach((m, i) => m.classList.toggle('on', volume > i * 20));
    apply(); store.set('volume', volume);
  }
  knob.addEventListener('pointerdown', e => { e.preventDefault(); drag = { y: e.clientY, v: volume }; knob.setPointerCapture(e.pointerId); });
  knob.addEventListener('pointermove', e => { if (drag) set(drag.v + (drag.y - e.clientY) * 0.7); });
  ['pointerup', 'pointercancel'].forEach(t => knob.addEventListener(t, () => drag = null));
  knob.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); set(volume - Math.sign(e.deltaY) * 5); }, { passive: false });
  knob.addEventListener('keydown', e => {
    const map = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5 };
    if (e.key in map) { e.preventDefault(); set(volume + map[e.key]); }
    if (e.key === 'Home') set(0); if (e.key === 'End') set(100);
  });
  new MutationObserver(apply).observe($('#directoryBody'), { childList: true });
  set(volume);
})();
