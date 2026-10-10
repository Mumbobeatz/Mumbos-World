/* ==========================================================================
   MUMBO'S WORLD — EXTRAS
   Silly Singles jukebox · Mumbo's Moon letter lock · Contact form ·
   Event Central show board. Loaded before world.js; everything here runs
   when a scene is built or a button is pressed.
   ========================================================================== */
const Extras = {};
const singleLink = (s, key) => s[key] || LINKS[key];
const singleDate = s => s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Release date coming soon';

/* ==========================================================================
   SILLY SINGLES — pick a disc, flip the title card, play
   ========================================================================== */
Extras.jukebox = scene => {
  scene.classList.add('is-jukebox');
  const PER_PAGE = 2;   // title strips per page; pages flip like a real wall-box
  const box = document.createElement('div');
  box.className = 'jukebox';
  box.innerHTML = `
    <div class="rk">
      <span class="rk-crown" aria-hidden="true"><i></i></span>
      <span class="rk-pillar l" aria-hidden="true"></span><span class="rk-pillar r" aria-hidden="true"></span>
      <div class="rk-dome">
        <div class="rk-glass">
          <span class="rk-curtain" aria-hidden="true"></span>
          <div class="rk-deck"><span class="cd"><span class="cd-label"><b class="cd-title"></b><span class="cd-hub"></span><small class="cd-by"></small></span></span><span class="rk-arm" aria-hidden="true"></span></div>
        </div>
      </div>
      <div class="rk-rack">
        <button class="rk-turn prev" aria-label="Flip back">‹</button>
        <div class="rk-book"><div class="rk-page left"></div><div class="rk-page right"></div><span class="rk-spine" aria-hidden="true"></span></div>
        <button class="rk-turn next" aria-label="Flip forward">›</button>
      </div>
      <div class="rk-panel">
        <div class="rk-now" aria-live="polite"></div>
        <button class="rk-play" aria-label="Play"><span class="jb-play-icon" aria-hidden="true"></span></button>
      </div>
      <p class="rk-badge">MUMBO-OLA</p>
      <div class="jb-links"></div>
      <div class="rk-grille" aria-hidden="true"></div>
    </div>`;
  $('.board-area', scene).append(box);

  const book = $('.rk-book', box), pages = $$('.rk-page', box), cd = $('.cd', box), now = $('.rk-now', box), links = $('.jb-links', box), play = $('.rk-play', box);
  let at = 0, spread = -1, playing = false, audio = null;
  const n = SINGLES.length, wrap = i => (i + n) % n;
  const code = i => `${String.fromCharCode(65 + Math.floor(i / 2) % 26)}${i % 2 + 1}`;
  const strip = i => { const s = SINGLES[i]; return `<button class="title-strip" data-i="${i}" style="--c:${s.color}"><span class="ts-code">${code(i)}</span><b>${esc(s.title)}</b><small>${esc(s.artists)}</small></button>`; };

  /* ---- the title-page book: double-sided leaves hinged on a centre spine ---- */
  const nPages = Math.ceil(n / PER_PAGE), nSpreads = Math.ceil(nPages / 2);
  const pageHTML = pg => Array.from({ length: PER_PAGE }, (_, j) => pg * PER_PAGE + j).filter(i => i < n).map(strip).join('');
  const sideOf = (sp, right) => pageHTML(((sp % nSpreads + nSpreads) % nSpreads) * 2 + (right ? 1 : 0));
  let flipping = false, queue = 0, hold = null;
  function showSpread(sp) {
    spread = (sp % nSpreads + nSpreads) % nSpreads;
    pages[0].innerHTML = sideOf(spread, false); pages[1].innerHTML = sideOf(spread, true);
    mark();
  }
  const mark = () => $$('.title-strip', box).forEach(t => t.classList.toggle('on', +t.dataset.i === at));
  function flip(dir, fast = false) {
    if (flipping) { queue = Math.max(-6, Math.min(6, queue + dir)); return; }
    if (App.paused) { showSpread(spread + dir); return; }
    flipping = true;
    const from = spread, to = spread + dir, dur = fast ? 190 : 430;
    // underneath: the page that stays put, and the page about to be revealed
    pages[0].innerHTML = sideOf(dir > 0 ? from : to, false);
    pages[1].innerHTML = sideOf(dir > 0 ? to : from, true);
    const leaf = document.createElement('div');
    leaf.className = 'leaf ' + (dir > 0 ? 'fwd' : 'back');
    leaf.innerHTML = `<div class="face front">${sideOf(dir > 0 ? from : to, true)}</div><div class="face rear">${sideOf(dir > 0 ? to : from, false)}</div>`;
    leaf.style.setProperty('--dur', dur + 'ms');
    book.append(leaf);
    mark();
    requestAnimationFrame(() => leaf.classList.add('go'));
    setTimeout(() => {
      leaf.remove(); flipping = false; showSpread(to);
      if (queue) { const d = Math.sign(queue); queue -= d; flip(d, true); }
    }, dur + 20);
  }
  // hold an arrow to flick through, like thumbing the wall-box pages
  const startHold = d => { stopHold(); flip(d); hold = setInterval(() => flip(d, true), 260); };
  const stopHold = () => { clearInterval(hold); hold = null; };
  function render(dir = 0) {
    const s = SINGLES[at];
    if (spread < 0) showSpread(Math.floor(at / (PER_PAGE * 2)));
    mark();
    cd.style.setProperty('--c', s.color);
    $('.cd-title', cd).textContent = s.title;
    $('.cd-by', cd).textContent = s.artists;
    if (dir && !App.paused) { cd.classList.remove('drop'); void cd.offsetWidth; cd.classList.add('drop'); }
    now.innerHTML = `<span class="rn-code">${code(at)}</span><span class="rn-text"><b>${esc(s.title)}</b><small>${esc(s.artists)} · ${esc(singleDate(s))}${playing ? ' · ▶ now playing' : ''}</small></span>`;
    links.innerHTML = `${ext(singleLink(s, 'soundcloud'), 'SoundCloud', 'btn sc')}${ext(singleLink(s, 'apple'), 'Apple Music', 'btn am')}${ext(singleLink(s, 'spotify'), 'Spotify', 'btn sp')}`;
    App.emit('inspect', { name: s.title, kind: `${s.artists} · ${singleDate(s)}` });
  }
  function stop() { playing = false; box.classList.remove('playing'); play.setAttribute('aria-label', 'Play'); audio?.pause(); }
  function select(i, dir) { stop(); at = wrap(i); render(dir); }
  [['.prev', -1], ['.next', 1]].forEach(([q, d]) => {
    const b = $(q, box);
    b.addEventListener('pointerdown', e => { e.preventDefault(); startHold(d); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, stopHold));
    b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(d); } });
  });
  book.addEventListener('click', e => { const t = e.target.closest('.pages-live .title-strip, .rk-page .title-strip'); if (t) select(+t.dataset.i, 1); });
  play.addEventListener('click', () => {
    const s = SINGLES[at];
    if (playing) { stop(); render(); return; }
    playing = true; box.classList.add('playing'); play.setAttribute('aria-label', 'Pause');
    if (s.audio) { audio ||= new Audio(); audio.src = s.audio; audio.volume = store.get('volume', 70) / 100; audio.play().catch(() => {}); }
    render();
    if (!s.audio) now.insertAdjacentHTML('beforeend', '<em class="jb-note">Previews coming soon. Tap a service to listen.</em>');
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); flip(e.key === 'ArrowLeft' ? -1 : 1); }
  });
  App.on('travel-start', () => { stop(); stopHold(); });
  render();
  // on arrival the pages flick through once, like the wall-box warming up
  if (!App.paused) setTimeout(() => { if (box.isConnected) { queue = nSpreads - 1; flip(1, true); } }, 700);
};

/* ==========================================================================
   EVENT CENTRAL — the painted show board is refreshed from the SHOWS list
   ========================================================================== */
Extras.billboard = board => {
  const next = spotlightShow(), last = pastShows()[0];
  const layer = document.createElement('div');
  layer.className = 'show-board-layer';
  layer.setAttribute('aria-hidden', 'true');
  const line = next ? `${shortDate(next)} · ${next.venue.toUpperCase()} · ${next.city.toUpperCase()}` : 'BOOKINGS: MUMBOBEATZ@GMAIL.COM';
  layer.innerHTML = `
    <div class="show-board">
      <p class="sb-title">EVENT CENTRAL</p>
      <p class="sb-sub">— ${next ? 'NEXT SHOW' : 'SHOW BOARD'} —</p>
      ${next
        ? `<p class="sb-big">${esc(next.title.toUpperCase())}</p><p class="sb-mid">${esc(prettyDate(next).toUpperCase())}</p>`
        : `<p class="sb-big">NEW SHOWS<br>LANDING SOON</p><p class="sb-mid">FOLLOW @MUMBOBEATZ</p>`}
      <p class="sb-ticker"><span>${esc(line)} ★ ${esc(line)} ★ </span></p>
    </div>
    ${last ? `<span class="played-stamp">PLAYED<small>${shortDate(last).replace('/', '.')}</small></span>` : ''}`;
  $('.art', board).after(layer);
};

/* ==========================================================================
   MUMBO'S MOON — a locker-style combination dial sitting in the crater.
   Turn the dial to a letter, push it in to lock that letter into the next
   slot, then open the moon. MUMBO JUMBO (rest blank) cracks the moon open.
   ========================================================================== */
const DIAL = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const STEP = 360 / DIAL.length;
let moonOpen = false;   // re-locks on every visit
const CRATER = { x: 70.3, y: 54.9, w: 15.2 };   // the big right-hand crater, % of the moon art

/* The dial is drawn as if it were machined into the crater floor: a dark
   recess, a purple-steel bezel lit from the lower left like the crater rim,
   and the letter ring + push knob inside it. */
function lockSVG() {
  // fixed letter ring on the bezel; letters stay upright so every one is readable
  const letters = DIAL.map((l, i) => {
    const a = (i * STEP - 90) * Math.PI / 180, x = 100 + Math.cos(a) * 84, y = 100 + Math.sin(a) * 84;
    return `<g class="lt" data-i="${i}"><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="10" class="lt-hit"/><text x="${x.toFixed(2)}" y="${(y + 4.4).toFixed(2)}" class="ltr">${l}</text></g>`;
  }).join('');
  const grips = Array.from({ length: 36 }, (_, i) => `<line x1="100" y1="31" x2="100" y2="36" transform="rotate(${i * 10} 100 100)" class="grip"/>`).join('');
  return `<svg viewBox="0 0 200 200" class="lock-svg" aria-hidden="true">
    <defs>
      <radialGradient id="recess" cx=".5" cy=".5" r=".5"><stop offset=".86" stop-color="#05030f"/><stop offset="1" stop-color="#1a0f3a" stop-opacity="0"/></radialGradient>
      <linearGradient id="bezel" x1=".15" y1=".9" x2=".85" y2=".1"><stop offset="0" stop-color="#3a3270"/><stop offset=".5" stop-color="#1c1640"/><stop offset="1" stop-color="#0e0a26"/></linearGradient>
      <linearGradient id="rim" x1=".15" y1=".9" x2=".85" y2=".1"><stop offset="0" stop-color="#e2ddff"/><stop offset=".45" stop-color="#8f87c9"/><stop offset="1" stop-color="#2a2356"/></linearGradient>
      <radialGradient id="face" cx=".4" cy=".65" r=".8"><stop offset="0" stop-color="#cfcaf0"/><stop offset=".6" stop-color="#7d76b0"/><stop offset="1" stop-color="#3a3368"/></radialGradient>
      <radialGradient id="knob" cx=".35" cy=".7" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#b3acd9"/><stop offset="1" stop-color="#4a4280"/></radialGradient>
      <radialGradient id="shade" cx=".3" cy=".75" r=".9"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0b0420" stop-opacity=".7"/></radialGradient>
    </defs>
    <circle cx="100" cy="100" r="99" fill="url(#recess)"/>
    <circle cx="100" cy="100" r="96" fill="url(#rim)"/>
    <circle cx="100" cy="100" r="93" fill="url(#bezel)"/>
    <g class="letters">${letters}</g>
    <circle cx="100" cy="100" r="73" fill="#05030d"/>
    <g class="dial-ring">
      <circle cx="100" cy="100" r="70" fill="url(#face)" stroke="#2a2356" stroke-width="2"/>
      ${grips}
      <path d="M100 26 l-8 13 h16 z" class="pointer"/>
    </g>
    <g class="push">
      <circle cx="100" cy="100" r="27" fill="url(#knob)" stroke="#1c1638" stroke-width="2"/>
      <circle cx="100" cy="100" r="21" fill="none" stroke="#ffffff66"/>
      <text x="100" y="98" class="push-t">PUSH</text><text x="100" y="110" class="push-s">LOCK IN</text>
    </g>
    <circle cx="100" cy="100" r="96" fill="url(#shade)" class="crater-shade"/>
  </svg>`;
}

Extras.moon = (scene, board) => {
  // a second copy of the art becomes the lid that lifts off
  const art = $('.art', board), lid = $('img', art).cloneNode();
  lid.className = 'moon-lid'; lid.alt = '';
  $('img', art).classList.add('moon-base');
  art.append(lid);
  art.insertAdjacentHTML('beforeend', '<span class="moon-glow" aria-hidden="true"></span>');
  const folder = document.createElement('button');
  folder.className = 'secret-folder';
  folder.innerHTML = '<span class="folder-icon" aria-hidden="true"></span><span>CLICK ME</span>';
  folder.setAttribute('aria-label', 'Open the secret folder');
  folder.addEventListener('click', () => {
    if (SECRET_FOLDER_URL) window.open(SECRET_FOLDER_URL, '_blank', 'noopener');
    else openDialog('Secret stash', '<p class="eyebrow">You cracked the moon!</p><p>The secret folder is still being packed. Check back soon for the goods.</p>');
  });
  board.append(folder);
  if (moonOpen) { board.classList.add('cracked', 'instant'); return; }

  /* ---------- the lock in the crater ---------- */
  const lock = document.createElement('div');
  lock.className = 'crater-lock';
  lock.style.cssText = `left:${CRATER.x}%;top:${CRATER.y}%;width:${CRATER.w}%`;
  lock.innerHTML = `${lockSVG()}<button class="lock-wake" aria-label="Zoom in on the locked crater"></button>
    <span class="dial-hit" role="slider" tabindex="-1" aria-label="Letter dial" aria-valuemin="0" aria-valuemax="26"></span>
    <button class="push-hit" tabindex="-1" aria-label="Push to lock in the letter"></button>
    <span class="crater-tip">Locked…</span>`;
  board.append(lock);
  const ui = document.createElement('button');
  ui.className = 'lock-back'; ui.hidden = true; ui.textContent = '← Back';
  ui.setAttribute('aria-label', 'Close the lock');
  scene.append(ui);
  // locked-in letters orbit the outside of the lock, like letters round a dial
  const orbit = document.createElement('div');
  orbit.className = 'lock-orbit'; orbit.hidden = true;
  orbit.setAttribute('aria-label', 'Locked-in letters');
  orbit.innerHTML = Array.from({ length: MOON_SLOTS }, (_, i) => `<span class="slot" data-i="${i}"></span>`).join('');
  scene.append(orbit);

  const ring = $('.dial-ring', lock), hit = $('.dial-hit', lock), say = t => App.emit('inspect', { name: 'Moon lock', kind: t });
  let angle = 0, entered = [], zoomed = false;
  const index = () => ((Math.round(angle / STEP) % DIAL.length) + DIAL.length) % DIAL.length;
  const show = (snap = false) => {
    ring.style.transition = snap ? 'transform .18s ease-out' : 'none';
    ring.style.transform = `rotate(${angle}deg)`;
    const l = DIAL[index()];
    $$('.letters [data-i]', lock).forEach(el => el.classList.toggle('lit', +el.dataset.i === index()));
    hit.setAttribute('aria-valuenow', index()); hit.setAttribute('aria-valuetext', l === ' ' ? 'blank' : l);
  };
  const turn = d => { angle = Math.round(angle / STEP) * STEP + d * STEP; show(true); click(); };   // +1 = clockwise
  const click = () => { lock.classList.remove('tick'); void lock.offsetWidth; lock.classList.add('tick'); };
  const paint = () => $$('.slot', orbit).forEach((sl, i) => {
    const v = entered[i];
    sl.textContent = v && v !== ' ' ? v : '';
    sl.classList.toggle('filled', v !== undefined);
    sl.classList.toggle('space', v === ' ');
    sl.classList.toggle('next', i === entered.length);
  });
  let checking = false;
  function push() {
    if (checking || entered.length >= MOON_SLOTS) return;
    entered.push(DIAL[index()]);
    lock.classList.remove('pushed'); void lock.offsetWidth; lock.classList.add('pushed');
    paint();
    say(`${DIAL[index()]} locked in · ${MOON_SLOTS - entered.length} to go`);
    if (entered.length === MOON_SLOTS) { checking = true; setTimeout(pull, 350); }   // last letter submits
  }
  function pull() {
    if (entered.join('') === MOON_CODE) {
      lock.classList.add('open'); say('Click… it’s open!');
      moonOpen = true;
      setTimeout(() => { exit(); setTimeout(() => { lock.remove(); ui.remove(); orbit.remove(); crackMoon(); }, App.paused ? 0 : 650); }, App.paused ? 100 : 900);
    } else {
      say('Incorrect, try again');
      lock.classList.remove('nope'); void lock.offsetWidth; lock.classList.add('nope');
      orbit.classList.remove('wrong'); void orbit.offsetWidth; orbit.classList.add('wrong');
      setTimeout(() => { orbit.classList.remove('wrong'); entered = []; checking = false; paint(); }, 1100);
    }
  }

  /* zoom the camera into the crater so the dial is big enough to use */
  function enter() {
    if (zoomed || App.busy) return;
    zoomed = true;
    document.body.classList.add('lock-mode');
    ui.hidden = false;
    const r = board.getBoundingClientRect(), dashTop = $('#reel').getBoundingClientRect().top;
    const top = $('.hud').getBoundingClientRect().bottom + 8, bottom = dashTop - 20;
    const avail = Math.max(120, bottom - top);
    const lockW = Math.min(340, innerWidth * 0.58, avail * 0.7);
    const s = lockW / (CRATER.w / 100 * r.width);
    const px = CRATER.x / 100 * r.width, py = CRATER.y / 100 * r.height;
    const tx = innerWidth / 2 - r.left - px * s, ty = top + avail / 2 - r.top - py * s;
    board.style.transformOrigin = '0 0';
    board.style.transition = App.paused ? 'none' : 'transform .8s cubic-bezier(.3,.8,.3,1)';
    board.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    // place the letter slots on an arc around the lock, open at the bottom
    const cx = innerWidth / 2, cy = top + avail / 2, rad = lockW / 2 + Math.max(22, lockW * 0.11);
    $$('.slot', orbit).forEach((sl, i) => {
      const a = (-120 + i * 240 / (MOON_SLOTS - 1)) * Math.PI / 180;
      sl.style.left = `${cx + Math.sin(a) * rad}px`; sl.style.top = `${cy - Math.cos(a) * rad}px`;
      sl.style.setProperty('--d', `${i * 30}ms`);
    });
    orbit.hidden = false;
    paint(); show();
    setTimeout(() => hit.focus({ preventScroll: true }), 50);
  }
  function exit() {
    if (!zoomed) return;
    zoomed = false;
    document.body.classList.remove('lock-mode');
    ui.hidden = true; orbit.hidden = true;
    board.style.transform = '';
    setTimeout(() => { if (!zoomed) { board.style.transition = ''; board.style.transformOrigin = ''; } }, 850);
  }
  Extras.exitLock = exit;

  $('.lock-wake', lock).addEventListener('click', enter);
  lock.addEventListener('pointerenter', () => { if (!zoomed) App.emit('inspect', { name: 'Locked crater', kind: 'Something is hidden in the moon…' }); });
  lock.addEventListener('pointerleave', () => { if (!zoomed) App.emit('inspect', null); });
  $('.push-hit', lock).addEventListener('click', push);
  ui.addEventListener('click', exit);
  // tap a letter on the ring to swing the pointer straight to it
  $$('.letters [data-i]', lock).forEach(el => el.addEventListener('click', () => {
    if (!zoomed) return;
    let d = +el.dataset.i - index(); if (d > 13) d -= 26; if (d < -13) d += 26;
    angle = Math.round(angle / STEP) * STEP + d * STEP; show(true); click();
  }));
  // tap a locked-in tile to take back that letter and everything after it
  orbit.addEventListener('click', e => { const t = e.target.closest('.slot.filled'); if (!t || checking) return; entered = entered.slice(0, +t.dataset.i); paint(); });

  // drag the dial round like a real locker lock
  let drag = null;
  const ang = e => { const r = $('.dial-ring', lock).getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
  hit.addEventListener('pointerdown', e => { if (!zoomed) return; e.preventDefault(); drag = { a: ang(e), start: angle, last: index() }; hit.setPointerCapture(e.pointerId); });
  hit.addEventListener('pointermove', e => {
    if (!drag) return;
    let d = ang(e) - drag.a; if (d > 180) d -= 360; if (d < -180) d += 360;
    angle = drag.start + d; drag.a = ang(e); drag.start = angle; show();
    if (index() !== drag.last) { drag.last = index(); click(); }
  });
  const endDrag = () => { if (!drag) return; drag = null; angle = Math.round(angle / STEP) * STEP; show(true); };
  hit.addEventListener('pointerup', endDrag); hit.addEventListener('pointercancel', endDrag);
  lock.addEventListener('wheel', e => { if (!zoomed) return; e.preventDefault(); e.stopPropagation(); turn(Math.sign(e.deltaY)); }, { passive: false });
  lock.addEventListener('keydown', e => {
    if (!zoomed) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); turn(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); turn(1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); push(); }
    else if (e.key === 'Backspace') { e.preventDefault(); if (!checking) { entered.pop(); paint(); } }
  });
  hit.tabIndex = 0;
  App.on('travel-start', exit);
  addEventListener('resize', () => { if (zoomed) { exit(); } });
  show();
};

function crackMoon() {
  const board = $('.world[data-place=about] .board');
  if (!board) return;
  board.classList.remove('instant');
  board.classList.add('shaking');
  setTimeout(() => { board.classList.remove('shaking'); board.classList.add('cracked'); }, App.paused ? 0 : 650);
}

/* ==========================================================================
   CONTACT — reason, subject + sender, message
   ========================================================================== */
Extras.openContact = () => {
  openDialog('Contact Mumbo', `
    <form class="contact" novalidate>
      <fieldset class="reasons"><legend>Reason for contact</legend>
        ${CONTACT_REASONS.map((r, i) => `<label class="reason"><input type="radio" name="reason" value="${r.id}" ${i ? '' : 'checked'}><span><b>${r.label}</b><small>${r.subs ? r.subs.join(' · ') : r.hint}</small></span></label>`).join('')}
      </fieldset>
      <fieldset class="subs"><legend>Booking type</legend>
        ${CONTACT_REASONS[0].subs.map((s, i) => `<label class="chip"><input type="radio" name="booking" value="${s}" ${i ? '' : 'checked'}><span>${s}</span></label>`).join('')}
      </fieldset>
      <div class="row">
        <label>Your name<input name="name" autocomplete="name" required></label>
        <label>Your email<input name="email" type="email" autocomplete="email" required></label>
      </div>
      <label>Subject<input name="subject" required></label>
      <label>Message<textarea name="message" rows="4" required></textarea></label>
      <label class="trap" aria-hidden="true">Leave this empty<input name="website" tabindex="-1" autocomplete="off"></label>
      <button class="btn send" type="submit">Send it <span aria-hidden="true">✈</span></button>
      <p class="form-msg" aria-live="polite"></p>
    </form>
    <div class="direct">
      <p class="eyebrow">Or reach out directly</p>
      <p><a href="${LINKS.email}">mumbobeatz@gmail.com</a></p>
      <div class="btn-row">${ext(LINKS.instagram, 'Instagram @mumbobeatz')}${ext(LINKS.tiktok, 'TikTok @mumbobeatz')}${ext(LINKS.x, 'X @mumbobeatz')}</div>
    </div>`);
  const form = $('#directoryBody .contact'), subs = $('.subs', form), msg = $('.form-msg', form);
  const sync = () => { subs.hidden = form.reason.value !== 'booking'; };
  form.addEventListener('change', sync); sync();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.website.value) return;                       // a bot filled the hidden field
    const missing = ['name', 'email', 'subject', 'message'].find(k => !form[k].value.trim() || (k === 'email' && !form.email.validity.valid));
    if (missing) { msg.textContent = missing === 'email' ? 'Please add a valid email so Mumbo can reply.' : `Please fill in your ${missing}.`; form[missing].focus(); return; }
    const reason = form.reason.value === 'booking' ? `Booking – ${form.booking.value}` : 'Say hi';
    const data = { reason, name: form.name.value.trim(), email: form.email.value.trim(), subject: form.subject.value.trim(), message: form.message.value.trim() };
    if (CONTACT_ENDPOINT) {
      msg.textContent = 'Sending…';
      try {
        const r = await fetch(CONTACT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...data, _subject: `[${reason}] ${data.subject}`, _replyto: data.email }) });
        if (!r.ok) throw new Error();
        form.outerHTML = `<div class="sent"><span class="sent-icon" aria-hidden="true">✉</span><h3>Message launched!</h3><p>Thanks ${esc(data.name)} — Mumbo will get back to you at ${esc(data.email)}.</p></div>`;
      } catch { msg.textContent = 'That didn’t send. Please email mumbobeatz@gmail.com directly.'; }
      return;
    }
    // No sending service connected yet: open the visitor's email app, pre-filled.
    const body = `Reason: ${reason}\nFrom: ${data.name} <${data.email}>\n\n${data.message}`;
    location.href = `mailto:mumbobeatz@gmail.com?subject=${encodeURIComponent(`[${reason}] ${data.subject}`)}&body=${encodeURIComponent(body)}`;
    form.outerHTML = `<div class="sent"><span class="sent-icon" aria-hidden="true">✉</span><h3>Almost there!</h3><p>Your email app should open with the message ready — just hit send.</p></div>`;
  });
};
