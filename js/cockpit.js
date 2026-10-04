/* ==========================================================================
   MUMBO'S WORLD — THE COCKPIT
   GPS reel, info screen, the pixel-faced copilot and Mumbo Radio.
   ========================================================================== */

/* ---------- GPS reel + info screen ---------- */
(() => {
  const strip = $('#reelStrip'), win = $('#reelWindow'), info = $('#infoBody'), enterLabel = $('#enterLabel');
  let keys = WORLD_ORDER, selected = 0, rolling = false, inspecting = null;
  const wrap = i => (i + keys.length) % keys.length;

  function render() {
    strip.classList.remove('rolling');
    strip.style.transform = '';
    strip.innerHTML = [-2, -1, 0, 1, 2].map(o => `<span class="${o === 0 ? 'now' : ''}">${esc(titleOf(keys[wrap(selected + o)]))}</span>`).join('');
    win.setAttribute('aria-label', `GPS destination: ${titleOf(keys[selected])}`);
    const here = keys[selected] === App.current;
    enterLabel.textContent = App.current === 'galaxy' && !here ? 'SET COURSE' : here ? 'OPEN GUIDE' : 'ENTER WORLD';
    if (!inspecting) describe(keys[selected]);
  }
  function describe(key) {
    const place = placeOf(key);
    const stampMark = WORLDS[key] ? ` <span class="stamp-line" title="${App.stamps.has(key) ? 'Passport stamp collected' : 'Passport stamp waiting'}">${App.stamps.has(key) ? '★' : '☆'}</span>` : '';
    info.innerHTML = `<p class="info-title">${esc(place.title)}${stampMark}</p><p>${esc(place.info)}</p>`;
  }
  function sync(name) {
    keys = SUBWORLDS[name] ? MUSIC_ORDER : WORLD_ORDER;
    const i = keys.indexOf(name);
    if (i >= 0) selected = i;
    else if (name === 'music' || !WORLDS[name]) selected = Math.max(0, selected) % keys.length;
    inspecting = null;
    render();
  }
  function rotate(dir) {
    if (rolling || App.busy) return;
    const next = wrap(selected + dir);
    const travelNow = depthOf(App.current) >= 2; // inside a world the reel flies you sideways
    const done = () => {
      selected = next; rolling = false; render();
      if (travelNow) App.travel(keys[selected], { step: dir });
      else if (App.current === 'hub') pulsePlanet(keys[selected]);
    };
    if (App.paused) { done(); return; }
    rolling = true;
    strip.classList.add('rolling');
    strip.style.transform = `translateY(${dir > 0 ? -40 : 0}%)`;
    setTimeout(done, 260);
  }
  function pulsePlanet(key) {
    $$('.planet').forEach(p => p.classList.toggle('targeted', p.dataset.go === key));
  }
  function enter() {
    if (App.busy) return;
    const key = keys[selected];
    if (key === App.current) { App.openGuide(); return; }
    const origin = App.current === 'hub' ? $(`.planet[data-go="${key}"]`) : null;
    App.travel(key, { origin, step: depthOf(App.current) === depthOf(key) ? 1 : 0 });
  }

  $('#reelUp').addEventListener('click', () => rotate(-1));
  $('#reelDown').addEventListener('click', () => rotate(1));
  $('#reelEnter').addEventListener('click', enter);
  $('#reel').addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); rotate(e.key === 'ArrowUp' ? -1 : 1); }
    if (e.key === 'Enter' && e.target === win) { e.preventDefault(); enter(); }
  });
  let wheelSum = 0, wheelAt = 0;
  $('#reel').addEventListener('wheel', e => {
    e.preventDefault();
    const now = performance.now();
    if (now - wheelAt > 200) wheelSum = 0;
    wheelAt = now; wheelSum += e.deltaY;
    if (Math.abs(wheelSum) > 30) { rotate(Math.sign(wheelSum)); wheelSum = 0; }
  }, { passive: false });
  let dragY = null;
  win.addEventListener('pointerdown', e => { dragY = e.clientY; win.setPointerCapture(e.pointerId); });
  win.addEventListener('pointermove', e => { if (dragY === null) return; const dy = e.clientY - dragY; if (Math.abs(dy) > 22) { rotate(dy > 0 ? -1 : 1); dragY = e.clientY; } });
  ['pointerup', 'pointercancel'].forEach(t => win.addEventListener(t, () => dragY = null));

  App.on('scene', sync);
  App.on('hover-world', key => { if (App.busy || App.current !== 'hub') return; selected = keys.indexOf(key); pulsePlanet(null); render(); });
  App.on('inspect', stop => {
    if (App.busy) return;
    inspecting = stop;
    if (stop) info.innerHTML = `<p class="info-title">${esc(stop.name)}</p><p>${esc(stop.kind)} · <span class="stamp-line">${stop.go ? 'click to fly in ↗' : 'click for details'}</span></p>`;
    else render();
  });
  App.on('travel-start', () => { $('#speed').textContent = 'WARP'; document.body.classList.add('warping'); });
  App.on('arrived', key => { $('#speed').textContent = depthOf(key) >= 2 ? 'DOCKED' : 'CRUISE'; document.body.classList.remove('warping'); render(); });
  sync(App.current);
})();

/* ---------- the copilot: a pixel face drawn live on its screen ---------- */
(() => {
  const btn = $('#copilot'), face = $('#botFace'), bubble = $('#copilotSays');
  const EYES = {
    neutral: ['.###.', '#####', '#####', '#####', '#####', '.###.'],
    happy: ['.....', '.###.', '#...#', '#...#', '.....', '.....'],
    curious: ['.###.', '#...#', '#.#.#', '#...#', '.###.', '.....'],
    sleepy: ['.....', '.....', '.....', '#####', '.....', '.....'],
    surprised: ['.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
    grumpy: ['#....', '.##..', '.####', '.####', '..##.', '.....'],
    love: ['.#.#.', '#####', '#####', '.###.', '..#..', '.....']
  };
  const MOUTHS = {
    neutral: ['.......', '.#####.', '.......'],
    happy: ['#.....#', '.#...#.', '..###..'],
    curious: ['.......', '...#...', '.......'],
    sleepy: ['.......', '..###..', '.......'],
    surprised: ['..###..', '.#...#.', '..###..'],
    grumpy: ['..###..', '.#...#.', '#.....#'],
    love: ['#.....#', '.#...#.', '..###..']
  };
  const px = (rows, ox, oy, mirror = false) => rows.flatMap((row, y) => [...(mirror ? [...row].reverse().join('') : row)].map((c, x) => c === '#' ? `<rect x="${ox + x}" y="${oy + y}" width="1" height="1"/>` : '')).join('');
  let mood = 'neutral', look = { x: 0, y: 0 }, blinkUntil = 0, nextBlink = performance.now() + 2500, moodTimer, bubbleTimer;

  let drawn = '';
  function draw(now) {
    const blinking = now < blinkUntil && mood !== 'sleepy';
    const eyes = blinking ? EYES.sleepy : EYES[mood];
    const lx = Math.round(look.x * 1.6), ly = Math.round(look.y * 1.2);
    const key = `${mood}${blinking}${lx}${ly}`;
    if (key === drawn) return;
    drawn = key;
    face.innerHTML = `<rect class="glass" x="0" y="0" width="24" height="16" rx="2.5"/>
      <g class="pix" transform="translate(${lx} ${ly})">${px(eyes, 4, 2)}${px(eyes, 15, 2, mood === 'grumpy')}${px(MOUTHS[mood], 8.5, 10)}</g>
      <rect class="scan" x="0" y="0" width="24" height="16" rx="2.5"/>`;
  }
  function setMood(m, ms = 3000) {
    mood = m; btn.dataset.mood = m;
    clearTimeout(moodTimer);
    if (ms) moodTimer = setTimeout(() => { mood = 'neutral'; btn.dataset.mood = 'neutral'; }, ms);
  }
  function say(text, m = 'happy', ms = 6500) {
    bubble.textContent = text; bubble.hidden = false;
    setMood(m, Math.min(ms, 4500));
    clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => bubble.hidden = true, ms);
  }
  let lastQuote = -1;
  function chatter() { let i; do { i = Math.random() * COPILOT_QUOTES.length | 0; } while (i === lastQuote); lastQuote = i; say(COPILOT_QUOTES[i]); }

  btn.addEventListener('click', chatter);
  btn.addEventListener('pointerenter', () => { if (mood === 'neutral') setMood('curious', 1800); });

  App.on('arrived', (key, fresh) => {
    if (!WORLDS[key]) return;
    if (fresh && App.stamps.size === WORLD_ORDER.length) { say('Passport complete! You’re an official Mumbonaut. ★', 'love', 8000); return; }
    if (fresh) { say(`${WORLDS[key].arrival} New stamp: ${App.stamps.size}/5.`, 'happy'); return; }
  });
  App.on('sun', m => say(m === 'laugh' ? 'Haha, the sun gets it!' : 'Uh oh. Hot-headed today…', m === 'laugh' ? 'happy' : 'surprised', 3500));
  App.on('travel-start', () => setMood('surprised', 1600));

  let nextChat = performance.now() + 150000 + Math.random() * 90000, nextMood = performance.now() + 9000;
  App.tasks.add(now => {
    if (!App.paused) {
      const r = btn.getBoundingClientRect();
      const tx = clamp((App.pointer.x - r.left - r.width / 2) / (innerWidth * 0.4), -1, 1), ty = clamp((App.pointer.y - r.top - r.height / 2) / (innerHeight * 0.4), -1, 1);
      look.x = lerp(look.x, tx, 0.08); look.y = lerp(look.y, ty, 0.08);
      if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + 2500 + Math.random() * 4000; }
      if (now > nextMood && mood === 'neutral') { setMood(['happy', 'curious', 'sleepy'][Math.random() * 3 | 0], 2600); nextMood = now + 10000 + Math.random() * 14000; }
    }
    if (now > nextChat) { chatter(); nextChat = now + 150000 + Math.random() * 90000; }
    draw(now);
  });
  draw(performance.now());
  setTimeout(() => say(App.current === 'galaxy' ? 'Hey, captain! Fly into the wormhole to start.' : 'Welcome back, captain!', 'happy', 6000), 1400);
})();

/* ---------- Mumbo Radio volume knob ---------- */
(() => {
  const knob = $('#knob'), out = $('#volOut');
  let volume = store.get('volume', 70), drag = null;
  function set(v) {
    volume = clamp(Math.round(v), 0, 100);
    knob.style.setProperty('--turn', `${-135 + volume * 2.7}deg`);
    knob.setAttribute('aria-valuenow', volume); out.value = volume; out.textContent = volume;
    $$('video').forEach(el => el.volume = volume / 100);
    store.set('volume', volume);
  }
  knob.addEventListener('pointerdown', e => { e.preventDefault(); drag = { y: e.clientY, v: volume }; knob.setPointerCapture(e.pointerId); });
  knob.addEventListener('pointermove', e => { if (drag) set(drag.v + (drag.y - e.clientY) * 0.7); });
  ['pointerup', 'pointercancel'].forEach(t => knob.addEventListener(t, () => drag = null));
  knob.addEventListener('wheel', e => { e.preventDefault(); set(volume - Math.sign(e.deltaY) * 5); }, { passive: false });
  knob.addEventListener('keydown', e => {
    const map = { ArrowUp: 5, ArrowRight: 5, ArrowDown: -5, ArrowLeft: -5 };
    if (e.key in map) { e.preventDefault(); set(volume + map[e.key]); }
    if (e.key === 'Home') set(0); if (e.key === 'End') set(100);
  });
  const apply = () => $$('video').forEach(el => el.volume = volume / 100);
  [$('#guideBody'), $('#cardBody')].forEach(el => new MutationObserver(apply).observe(el, { childList: true }));
  set(volume);
})();
