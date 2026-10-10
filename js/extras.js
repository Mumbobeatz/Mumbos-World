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
      <div class="jb-arch" aria-hidden="true"><i></i><i></i><i></i></div>
      <p class="jb-marquee">SILLY SINGLES</p>
      <div class="jb-window">
        <button class="jb-arrow prev" aria-label="Previous song">‹</button>
        <div class="jb-discs" aria-hidden="true"></div>
        <button class="jb-arrow next" aria-label="Next song">›</button>
      </div>
      <button class="jb-play" aria-label="Play"><span class="jb-play-icon" aria-hidden="true"></span></button>
      <div class="jb-card" aria-live="polite"><div class="jb-card-inner"></div></div>
      <div class="jb-links"></div>
      <p class="jb-count"></p>
    </div>`;
  $('.board-area', scene).append(box);

  const discs = $('.jb-discs', box), card = $('.jb-card-inner', box), links = $('.jb-links', box), count = $('.jb-count', box), play = $('.jb-play', box);
  let at = 0, playing = false, audio = null;
  const n = SINGLES.length, wrap = i => (i + n) % n;
  discs.innerHTML = SINGLES.map((s, i) => `<span class="disc" data-i="${i}" style="--c:${s.color}"><span class="disc-face"><span class="disc-label"><b>${esc(s.title)}</b></span></span></span>`).join('');

  function face(s) {
    return `<p class="jb-kicker">${playing ? '▶ NOW PLAYING' : 'SELECTION ' + String(at + 1).padStart(2, '0')}</p>
      <h3>${esc(s.title)}</h3><p class="jb-by">by ${esc(s.artists)}</p><p class="jb-date">${esc(singleDate(s))}</p>`;
  }
  function render(dir = 0) {
    $$('.disc', discs).forEach(d => {
      let o = +d.dataset.i - at; if (o > n / 2) o -= n; if (o < -n / 2) o += n;
      const k = Math.abs(o);
      d.style.transform = `translate(-50%, -50%) translateX(${o * 64}%) translateZ(${-k * 140}px) rotateY(${-Math.sign(o) * Math.min(k, 1) * 38}deg) scale(${1 - Math.min(k, 2) * 0.16})`;
      d.style.zIndex = String(10 - k);
      d.classList.toggle('on', o === 0);
      d.classList.toggle('far', k > 2);
    });
    const s = SINGLES[at];
    const update = () => { card.innerHTML = face(s); };
    if (dir && !App.paused) { card.parentElement.classList.remove('flip-up', 'flip-down'); void card.offsetWidth; card.parentElement.classList.add(dir > 0 ? 'flip-up' : 'flip-down'); setTimeout(update, 180); }
    else update();
    links.innerHTML = `${ext(singleLink(s, 'soundcloud'), 'SoundCloud', 'btn sc')}${ext(singleLink(s, 'apple'), 'Apple Music', 'btn am')}${ext(singleLink(s, 'spotify'), 'Spotify', 'btn sp')}`;
    count.textContent = `${at + 1} / ${n}`;
    App.emit('inspect', { name: s.title, kind: `${s.artists} · ${singleDate(s)}` });
  }
  function stop() { playing = false; box.classList.remove('playing'); play.setAttribute('aria-label', 'Play'); audio?.pause(); }
  function step(d) { stop(); at = wrap(at + d); render(d); }
  $('.prev', box).addEventListener('click', () => step(-1));
  $('.next', box).addEventListener('click', () => step(1));
  discs.addEventListener('click', e => { const d = e.target.closest('.disc'); if (!d) return; let o = +d.dataset.i - at; if (o > n / 2) o -= n; if (o < -n / 2) o += n; if (o) step(o); });
  play.addEventListener('click', () => {
    const s = SINGLES[at];
    if (playing) { stop(); render(); return; }
    playing = true; box.classList.add('playing'); play.setAttribute('aria-label', 'Pause');
    if (s.audio) { audio ||= new Audio(); audio.src = s.audio; audio.volume = (store.get('volume', 70)) / 100; audio.play().catch(() => {}); }
    render();
    if (!s.audio) card.insertAdjacentHTML('beforeend', '<p class="jb-note">Previews are coming soon. Tap a service below to listen now.</p>');
  });
  box.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); step(e.key === 'ArrowLeft' ? -1 : 1); }
  });
  // leaving the scene stops any preview
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
   slot, then pull the shackle. MUMBO JUMBO (rest blank) cracks the moon open.
   ========================================================================== */
const DIAL = [' ', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];   // position 0 is the blank
const STEP = 360 / DIAL.length;
let moonOpen = false;   // re-locks on every visit

function lockSVG() {
  const marks = DIAL.map((l, i) => {
    const a = i * STEP;
    return `<g transform="rotate(${a} 100 160)">
      <line x1="100" y1="${160 - 80}" x2="100" y2="${160 - 73}" class="tick"/>
      ${l === ' ' ? '<circle cx="100" cy="91" r="3.2" class="dot"/>' : `<text x="100" y="95.5" class="ltr">${l}</text>`}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 200 260" class="lock-svg" aria-hidden="true">
    <defs>
      <linearGradient id="steel" x1="0" x2="1"><stop offset="0" stop-color="#7e8a99"/><stop offset=".35" stop-color="#f2f6fb"/><stop offset=".6" stop-color="#b9c3cf"/><stop offset="1" stop-color="#6b7684"/></linearGradient>
      <radialGradient id="bezel" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#b8c2ce"/><stop offset="1" stop-color="#5c6773"/></radialGradient>
      <radialGradient id="face" cx=".45" cy=".4" r=".75"><stop offset="0" stop-color="#2b2f38"/><stop offset="1" stop-color="#07080b"/></radialGradient>
      <radialGradient id="knob" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#aeb8c4"/><stop offset="1" stop-color="#4f5965"/></radialGradient>
    </defs>
    <g class="shackle"><path d="M58 120 V62 a42 42 0 0 1 84 0 V120" fill="none" stroke="url(#steel)" stroke-width="17" stroke-linecap="round"/></g>
    <circle cx="100" cy="160" r="94" fill="url(#bezel)" stroke="#3d4650" stroke-width="2"/>
    <circle cx="100" cy="160" r="85" fill="#0d0f14"/>
    <g class="dial-ring">
      <circle cx="100" cy="160" r="82" fill="url(#face)"/>
      ${marks}
      <text x="100" y="134" class="brand">MUMBO</text>
      <text x="100" y="196" class="brand small">MOON CO.</text>
    </g>
    <path d="M100 74 l-7 -10 h14 z" class="marker"/>
    <g class="push">
      <circle cx="100" cy="160" r="30" fill="url(#knob)" stroke="#3d4650" stroke-width="2"/>
      <circle cx="100" cy="160" r="23" fill="none" stroke="#ffffff66"/>
      <text x="100" y="157" class="push-t">PUSH</text><text x="100" y="170" class="push-s">LOCK IN</text>
    </g>
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
  lock.innerHTML = `${lockSVG()}<button class="lock-wake" aria-label="Zoom in on the locked crater"></button>
    <span class="dial-hit" role="slider" tabindex="-1" aria-label="Letter dial" aria-valuemin="0" aria-valuemax="26"></span>
    <button class="push-hit" tabindex="-1" aria-label="Push to lock in the letter"></button>
    <button class="shackle-hit" tabindex="-1" aria-label="Pull the shackle to open"></button>
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
      <button class="lb undo">Undo</button><button class="lb clear">Clear</button><button class="lb pull">Pull to open</button><button class="lb exit">Back</button>
    </div>
    <p class="lock-msg" aria-live="polite">Turn the dial, push to lock in each letter.</p>`;
  scene.append(ui);

  const ring = $('.dial-ring', lock), hit = $('.dial-hit', lock), msg = $('.lock-msg', ui), readout = $('.lr-letter', ui);
  let angle = 0, entered = [], zoomed = false;
  const index = () => ((Math.round(-angle / STEP) % DIAL.length) + DIAL.length) % DIAL.length;
  const show = (snap = false) => {
    ring.style.transition = snap ? 'transform .18s ease-out' : 'none';
    ring.style.transform = `rotate(${angle}deg)`;
    const l = DIAL[index()];
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
    if (entered.length >= MOON_SLOTS) { msg.textContent = 'All slots are full. Pull to open, or undo.'; return; }
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
    const sr = scene.getBoundingClientRect(), uiTop = sr.top + ui.offsetTop, top = $('.hud').getBoundingClientRect().bottom + 8, bottom = Math.min(dashTop, uiTop) - 14;
    const avail = Math.max(120, bottom - top);
    const lockW = Math.min(340, innerWidth * 0.8, avail / 1.3);
    const s = lockW / (0.15 * r.width);
    const px = 0.69 * r.width, py = 0.547 * r.height + (0.5 - 0.615) * 0.15 * r.width * 1.3;
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
  $('.shackle-hit', lock).addEventListener('click', pull);
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
