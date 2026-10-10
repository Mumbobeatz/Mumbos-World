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
  const box = document.createElement('div');
  box.className = 'jukebox';
  box.innerHTML = `
    <div class="jb-cabinet">
      <span class="jb-tube l" aria-hidden="true"></span><span class="jb-tube r" aria-hidden="true"></span>
      <div class="jb-crown" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      <p class="jb-marquee">Silly Singles</p>
      <div class="jb-window">
        <div class="jb-stack left" aria-label="Earlier songs"></div>
        <div class="jb-stage"><span class="disc on" aria-hidden="true"><span class="disc-face"><span class="disc-label"><b class="dl-title"></b><span class="dl-hole"></span><small class="dl-by"></small></span></span></span></div>
        <div class="jb-stack right" aria-label="Next songs"></div>
      </div>
      <div class="jb-strip"><div class="jb-card" aria-live="polite"><div class="jb-card-inner"></div></div></div>
      <div class="jb-controls">
        <button class="jb-arrow prev" aria-label="Previous song">‹</button>
        <button class="jb-play" aria-label="Play"><span class="jb-play-icon" aria-hidden="true"></span></button>
        <button class="jb-arrow next" aria-label="Next song">›</button>
      </div>
      <div class="jb-links"></div>
      <div class="jb-grille" aria-hidden="true"></div>
    </div>`;
  $('.board-area', scene).append(box);

  const left = $('.jb-stack.left', box), right = $('.jb-stack.right', box), disc = $('.disc', box), card = $('.jb-card-inner', box), links = $('.jb-links', box), play = $('.jb-play', box);
  let at = 0, playing = false, audio = null;
  const n = SINGLES.length, wrap = i => (i + n) % n;
  const before = Math.floor((n - 1) / 2), after = n - 1 - before;
  const spine = i => { const s = SINGLES[i]; return `<button class="spine" data-i="${i}" style="--c:${s.color}" aria-label="${esc(s.title)} by ${esc(s.artists)}"><span class="sp-ring" aria-hidden="true"></span><b>${esc(s.title)}</b><small>${esc(s.artists)}</small></button>`; };

  function face(s) {
    return `<p class="jb-kicker">${playing ? '▶ NOW PLAYING' : 'SELECTION ' + String(at + 1).padStart(2, '0')}</p>
      <h3>${esc(s.title)}</h3><p class="jb-by">by ${esc(s.artists)}</p><p class="jb-date">${esc(singleDate(s))}</p>`;
  }
  function render(dir = 0) {
    const s = SINGLES[at];
    // flat stacks: the nearest songs sit closest to the upright disc
    left.innerHTML = Array.from({ length: before }, (_, k) => spine(wrap(at - before + k))).join('');
    right.innerHTML = Array.from({ length: after }, (_, k) => spine(wrap(at + 1 + k))).join('');
    disc.style.setProperty('--c', s.color);
    $('.dl-title', disc).textContent = s.title;
    $('.dl-by', disc).textContent = s.artists;
    card.innerHTML = face(s);
    if (dir && !App.paused) {
      disc.classList.remove('rise-l', 'rise-r'); void disc.offsetWidth; disc.classList.add(dir > 0 ? 'rise-r' : 'rise-l');
      card.parentElement.classList.remove('flip-up', 'flip-down'); void card.offsetWidth; card.parentElement.classList.add(dir > 0 ? 'flip-up' : 'flip-down');
    }
    links.innerHTML = `${ext(singleLink(s, 'soundcloud'), 'SoundCloud', 'btn sc')}${ext(singleLink(s, 'apple'), 'Apple Music', 'btn am')}${ext(singleLink(s, 'spotify'), 'Spotify', 'btn sp')}`;
    App.emit('inspect', { name: s.title, kind: `${s.artists} · ${singleDate(s)}` });
  }
  function stop() { playing = false; box.classList.remove('playing'); play.setAttribute('aria-label', 'Play'); audio?.pause(); }
  function step(d) { stop(); at = wrap(at + d); render(d); }
  $('.prev', box).addEventListener('click', () => step(-1));
  $('.next', box).addEventListener('click', () => step(1));
  [left, right].forEach(stack => stack.addEventListener('click', e => {
    const sp = e.target.closest('.spine'); if (!sp) return;
    let o = +sp.dataset.i - at; if (o > n / 2) o -= n; if (o < -n / 2) o += n;
    stop(); at = +sp.dataset.i; render(Math.sign(o));
  }));
  play.addEventListener('click', () => {
    const s = SINGLES[at];
    if (playing) { stop(); render(); return; }
    playing = true; box.classList.add('playing'); play.setAttribute('aria-label', 'Pause');
    if (s.audio) { audio ||= new Audio(); audio.src = s.audio; audio.volume = store.get('volume', 70) / 100; audio.play().catch(() => {}); }
    render();
    if (!s.audio) card.insertAdjacentHTML('beforeend', '<p class="jb-note">Previews are coming soon. Tap a service below to listen now.</p>');
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowLeft' ? -1 : 1); }
  });
  App.on('travel-start', stop);
  render();
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
const DIAL = [' ', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];   // position 0 is the blank
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
    return l === ' '
      ? `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="3.4" class="dot" data-i="${i}"/>`
      : `<text x="${x.toFixed(2)}" y="${(y + 4.4).toFixed(2)}" class="ltr" data-i="${i}">${l}</text>`;
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
  const ui = document.createElement('div');
  ui.className = 'lock-ui'; ui.hidden = true;
  ui.innerHTML = `
    <p class="lock-read"><span class="lr-label">DIAL</span><b class="lr-letter">·</b></p>
    <div class="slots" aria-label="Locked-in letters">${Array.from({ length: MOON_SLOTS }, (_, i) => `<span class="slot" data-i="${i}"></span>`).join('')}</div>
    <div class="lock-btns">
      <button class="lb turn" data-turn="-1" aria-label="Turn left">⟲</button>
      <button class="lb push-btn">Push · lock in</button>
      <button class="lb turn" data-turn="1" aria-label="Turn right">⟳</button>
    </div>
    <div class="lock-btns small">
      <button class="lb undo">Undo</button><button class="lb clear">Clear</button><button class="lb pull">Open the moon</button><button class="lb exit">Back</button>
    </div>
    <p class="lock-msg" aria-live="polite">Turn the dial, push to lock in each letter.</p>`;
  scene.append(ui);

  const ring = $('.dial-ring', lock), hit = $('.dial-hit', lock), msg = $('.lock-msg', ui), readout = $('.lr-letter', ui);
  let angle = 0, entered = [], zoomed = false;
  const index = () => ((Math.round(angle / STEP) % DIAL.length) + DIAL.length) % DIAL.length;
  const show = (snap = false) => {
    ring.style.transition = snap ? 'transform .18s ease-out' : 'none';
    ring.style.transform = `rotate(${angle}deg)`;
    const l = DIAL[index()];
    $$('.letters [data-i]', lock).forEach(el => el.classList.toggle('lit', +el.dataset.i === index()));
    readout.textContent = l === ' ' ? '·' : l;
    readout.classList.toggle('blank', l === ' ');
    hit.setAttribute('aria-valuenow', index()); hit.setAttribute('aria-valuetext', l === ' ' ? 'blank' : l);
  };
  const turn = d => { angle = Math.round(angle / STEP) * STEP + d * STEP; show(true); click(); };   // +1 = clockwise
  const click = () => { lock.classList.remove('tick'); void lock.offsetWidth; lock.classList.add('tick'); };
  const paint = () => $$('.slot', ui).forEach((sl, i) => {
    const v = entered[i];
    sl.textContent = v && v !== ' ' ? v : '';
    sl.classList.toggle('filled', v !== undefined);
    sl.classList.toggle('space', v === ' ');
    sl.classList.toggle('next', i === entered.length);
  });
  function push() {
    if (entered.length >= MOON_SLOTS) { msg.textContent = 'All slots are full. Open the moon, or undo.'; return; }
    entered.push(DIAL[index()]);
    lock.classList.remove('pushed'); void lock.offsetWidth; lock.classList.add('pushed');
    paint();
    const l = DIAL[index()];
    msg.textContent = l === ' ' ? 'Blank locked in.' : `${l} locked in.`;
  }
  function pull() {
    const word = entered.join('').trim().replace(/\s+/g, ' ');
    if (word === MOON_CODE) {
      lock.classList.add('open'); msg.textContent = 'Click… it’s open!';
      moonOpen = true;
      setTimeout(() => { exit(); setTimeout(() => { lock.remove(); ui.remove(); crackMoon(); }, App.paused ? 0 : 650); }, App.paused ? 100 : 900);
    } else {
      msg.textContent = entered.length ? 'Nope, the moon stays shut. Try again.' : 'Lock in some letters first.';
      lock.classList.remove('nope'); void lock.offsetWidth; lock.classList.add('nope');
      if (entered.length) { ui.classList.add('wrong'); setTimeout(() => { ui.classList.remove('wrong'); entered = []; paint(); }, 700); }
    }
  }

  /* zoom the camera into the crater so the dial is big enough to use */
  function enter() {
    if (zoomed || App.busy) return;
    zoomed = true;
    document.body.classList.add('lock-mode');
    ui.hidden = false;
    const r = board.getBoundingClientRect(), dashTop = $('#reel').getBoundingClientRect().top;
    const sr = scene.getBoundingClientRect(), uiTop = sr.top + ui.offsetTop, top = $('.hud').getBoundingClientRect().bottom + 8, bottom = Math.min(dashTop, uiTop) - 26;
    const avail = Math.max(120, bottom - top);
    const lockW = Math.min(320, innerWidth * 0.78, avail * 0.92);
    const s = lockW / (CRATER.w / 100 * r.width);
    const px = CRATER.x / 100 * r.width, py = CRATER.y / 100 * r.height;
    const tx = innerWidth / 2 - r.left - px * s, ty = top + avail / 2 - r.top - py * s;
    board.style.transformOrigin = '0 0';
    board.style.transition = App.paused ? 'none' : 'transform .8s cubic-bezier(.3,.8,.3,1)';
    board.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    paint(); show();
    setTimeout(() => hit.focus({ preventScroll: true }), 50);
  }
  function exit() {
    if (!zoomed) return;
    zoomed = false;
    document.body.classList.remove('lock-mode');
    ui.hidden = true;
    board.style.transform = '';
    setTimeout(() => { if (!zoomed) { board.style.transition = ''; board.style.transformOrigin = ''; } }, 850);
  }
  Extras.exitLock = exit;

  $('.lock-wake', lock).addEventListener('click', enter);
  lock.addEventListener('pointerenter', () => { if (!zoomed) App.emit('inspect', { name: 'Locked crater', kind: 'Something is hidden in the moon…' }); });
  lock.addEventListener('pointerleave', () => { if (!zoomed) App.emit('inspect', null); });
  $('.push-hit', lock).addEventListener('click', push);
  $('.push-btn', ui).addEventListener('click', push);
  $('.pull', ui).addEventListener('click', pull);
  $('.undo', ui).addEventListener('click', () => { entered.pop(); paint(); msg.textContent = 'Undone.'; });
  $('.clear', ui).addEventListener('click', () => { entered = []; paint(); msg.textContent = 'Cleared.'; });
  $('.exit', ui).addEventListener('click', exit);
  $$('[data-turn]', ui).forEach(b => b.addEventListener('click', () => turn(+b.dataset.turn)));

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
    else if (e.key === 'Backspace') { e.preventDefault(); entered.pop(); paint(); }
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
