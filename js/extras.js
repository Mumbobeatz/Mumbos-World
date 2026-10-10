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
   MUMBO'S MOON — letter lock in the crater; the right words crack it open
   ========================================================================== */
const LETTERS = ['', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
let moonOpen = false;   // re-locks on every visit

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
  if (moonOpen) board.classList.add('cracked', 'instant');
};

function lockIsRight(values) {
  return values.map(v => v || ' ').join('').trim().replace(/\s+/g, ' ') === MOON_CODE;
}

Extras.openLock = () => {
  if (moonOpen) { $('.world[data-place=about] .secret-folder')?.click(); return; }
  const values = Array(MOON_SLOTS).fill('');
  openDialog('The moon lock', `
    <p class="lock-hint">Spin the letters to spell the secret words. Leave the rest blank.</p>
    <div class="padlock">
      <span class="shackle" aria-hidden="true"></span>
      <div class="lock-body">
        <span class="lock-brand" aria-hidden="true">MUMBO&nbsp;CO.</span>
        <div class="dials" role="group" aria-label="Letter dials">${values.map((_, i) => `
          <div class="dial" data-i="${i}">
            <button class="dial-btn up" tabindex="-1" aria-label="Previous letter">▲</button>
            <input class="dial-face" maxlength="1" inputmode="text" autocomplete="off" autocapitalize="characters" aria-label="Letter ${i + 1}" value="">
            <button class="dial-btn down" tabindex="-1" aria-label="Next letter">▼</button>
          </div>`).join('')}
        </div>
        <span class="keyhole" aria-hidden="true"></span>
      </div>
    </div>
    <div class="lock-actions"><button class="btn lock-try">Pull the lock</button><button class="btn lock-clear">Clear</button></div>
    <p class="lock-msg" aria-live="polite"></p>`);
  const root = $('#directoryBody'), faces = $$('.dial-face', root), padlock = $('.padlock', root), msg = $('.lock-msg', root);
  const set = (i, v) => { values[i] = v; faces[i].value = v; faces[i].parentElement.classList.toggle('blank', !v); };
  const spin = (i, d) => {
    const at = LETTERS.indexOf(values[i]);
    set(i, LETTERS[(at + d + LETTERS.length) % LETTERS.length]);
    const dial = faces[i].parentElement; dial.classList.remove('spin-up', 'spin-down'); void dial.offsetWidth; dial.classList.add(d > 0 ? 'spin-down' : 'spin-up');
  };
  values.forEach((_, i) => set(i, ''));
  $$('.dial', root).forEach((dial, i) => {
    $('.up', dial).addEventListener('click', () => spin(i, -1));
    $('.down', dial).addEventListener('click', () => spin(i, 1));
    dial.addEventListener('wheel', e => { e.preventDefault(); spin(i, Math.sign(e.deltaY)); }, { passive: false });
    let y0 = null;
    dial.addEventListener('pointerdown', e => { if (e.target.closest('.dial-btn')) return; y0 = e.clientY; });
    dial.addEventListener('pointermove', e => { if (y0 === null) return; const dy = e.clientY - y0; if (Math.abs(dy) > 18) { spin(i, dy > 0 ? -1 : 1); y0 = e.clientY; } });
    dial.addEventListener('pointerup', () => y0 = null); dial.addEventListener('pointercancel', () => y0 = null);
  });
  faces.forEach((f, i) => {
    f.addEventListener('keydown', e => {
      if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); set(i, e.key.toUpperCase()); faces[i + 1]?.focus(); }
      else if (e.key === ' ') { e.preventDefault(); set(i, ''); faces[i + 1]?.focus(); }
      else if (e.key === 'Backspace') { e.preventDefault(); if (values[i]) set(i, ''); else { faces[i - 1]?.focus(); if (i) set(i - 1, ''); } }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); spin(i, e.key === 'ArrowUp' ? -1 : 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); faces[i - 1]?.focus(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); faces[i + 1]?.focus(); }
      else if (e.key === 'Enter') { e.preventDefault(); attempt(); }
    });
    f.addEventListener('input', () => { const v = f.value.replace(/[^a-z]/gi, '').slice(-1).toUpperCase(); set(i, v); if (v) faces[i + 1]?.focus(); });
    f.addEventListener('focus', () => f.select());
  });
  function attempt() {
    if (lockIsRight(values)) {
      padlock.classList.add('open'); msg.textContent = 'Click… it’s open!';
      moonOpen = true;
      setTimeout(() => { closeDialog(); crackMoon(); }, App.paused ? 200 : 1100);
    } else {
      msg.textContent = values.some(Boolean) ? 'Nope — the moon stays shut.' : 'Spin some letters first.';
      padlock.classList.remove('nope'); void padlock.offsetWidth; padlock.classList.add('nope');
    }
  }
  $('.lock-try', root).addEventListener('click', attempt);
  $('.lock-clear', root).addEventListener('click', () => { values.forEach((_, i) => set(i, '')); msg.textContent = ''; faces[0].focus(); });
  faces[0].focus();
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
