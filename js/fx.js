/* ==========================================================================
   MUMBO'S WORLD — SHARED STATE + VISUAL EFFECTS
   One animation loop drives every moving piece, and each piece only runs
   while its scene is on screen.
   ========================================================================== */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const store = {
  get(k, d) { try { const v = localStorage.getItem('mw:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('mw:' + k, JSON.stringify(v)); } catch { /* private mode */ } }
};

const App = {
  current: 'galaxy',
  busy: false,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
  paused: false,
  pointer: { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0 },
  handlers: {},
  on(evt, fn) { (this.handlers[evt] ||= []).push(fn); },
  emit(evt, ...args) { (this.handlers[evt] || []).forEach(fn => fn(...args)); },
  tasks: new Set(),
  dashHeight() { return $('#cockpit').offsetHeight; }
};
App.paused = store.get('paused', App.reduced);

/* ---------- motion toggle ---------- */
function syncMotion() {
  document.body.classList.toggle('paused', App.paused);
  const b = $('#motionToggle');
  b.innerHTML = App.paused ? '<span class="ico" aria-hidden="true">▶</span><span class="txt">Resume motion</span>' : '<span class="ico" aria-hidden="true">❚❚</span><span class="txt">Pause motion</span>';
  b.setAttribute('aria-label', App.paused ? 'Resume motion' : 'Pause motion');
  b.setAttribute('aria-pressed', String(App.paused));
}
$('#motionToggle').addEventListener('click', () => { App.paused = !App.paused; store.set('paused', App.paused); syncMotion(); App.emit('motion'); });
syncMotion();

/* ---------- one loop to rule them all ---------- */
let lastFrame = performance.now();
function frame(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  if (!document.hidden) App.tasks.forEach(task => task(now, dt));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

addEventListener('pointermove', e => {
  App.pointer.x = e.clientX; App.pointer.y = e.clientY;
  App.pointer.nx = e.clientX / innerWidth - 0.5; App.pointer.ny = e.clientY / innerHeight - 0.5;
}, { passive: true });

/* ==========================================================================
   SKY — three parallax star layers plus the occasional shooting star
   ========================================================================== */
(() => {
  const canvas = $('#sky'), ctx = canvas.getContext('2d');
  let w, h, dpr, layers = [], meteors = [], nextMeteor = 1, clock = 0, look = { x: 0, y: 0 }, acc = 0;
  const palette = ['#b5dfff', '#ffffff', '#d9c8ff', '#fff2c0'];
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = w * h / 1e6;
    layers = [[0.25, 260, 1.0], [0.6, 120, 1.5], [1.2, 40, 2.2]].map(([depth, n, size]) => ({
      depth, stars: Array.from({ length: Math.round(n * Math.max(area, 0.35)) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * size * 0.7 + 0.3, p: Math.random() * 6.28, c: palette[Math.random() * palette.length | 0] }))
    }));
    draw(0);
  }
  function draw(dt) {
    ctx.clearRect(0, 0, w, h);
    look.x = lerp(look.x, App.pointer.nx, 0.04); look.y = lerp(look.y, App.pointer.ny, 0.04);
    for (const layer of layers) {
      const ox = -look.x * 30 * layer.depth, oy = -look.y * 20 * layer.depth;
      for (const s of layer.stars) {
        const x = ((s.x + clock * 4 * layer.depth + ox) % w + w) % w, y = ((s.y + oy) % h + h) % h;
        ctx.globalAlpha = 0.25 + (Math.sin(clock * 1.3 + s.p) + 1) * 0.3;
        ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // shooting stars
    if (clock > nextMeteor) {
      const angle = 0.35 + Math.random() * 0.55, dir = Math.random() < 0.5 ? 1 : -1, speed = 300 + Math.random() * 350;
      meteors.push({ x: Math.random() * w, y: Math.random() * h * 0.6, vx: Math.cos(angle) * speed * dir, vy: Math.sin(angle) * speed, age: 0, life: 1 + Math.random(), len: 70 + Math.random() * 110 });
      nextMeteor = clock + 1.2 + Math.random() * 2.4;
    }
    ctx.lineCap = 'round';
    for (const m of meteors) {
      m.age += dt; m.x += m.vx * dt; m.y += m.vy * dt;
      const sp = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / sp * m.len, ty = m.y - m.vy / sp * m.len;
      ctx.globalAlpha = Math.min(1, m.age / 0.15) * Math.max(0, 1 - m.age / m.life) * 0.85;
      const g = ctx.createLinearGradient(tx, ty, m.x, m.y); g.addColorStop(0, 'rgba(123,177,255,0)'); g.addColorStop(1, '#f5fcff');
      ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    meteors = meteors.filter(m => m.age < m.life);
  }
  App.tasks.add((now, dt) => {
    if (App.paused) return;
    clock += dt; acc += dt;
    if (acc < 1 / 40) return; // ~40fps is plenty for a starfield
    draw(acc); acc = 0;
  });
  addEventListener('resize', resize); resize();
})();

/* ==========================================================================
   CURSOR — bucket-hat pointer with a sparkle trail (mouse only)
   ========================================================================== */
(() => {
  const cursor = $('#cursor'), canvas = $('#sparkles'), ctx = canvas.getContext('2d');
  const colors = ['#8be9ff', '#ffd345', '#fa8bdb', '#c5b3ff', '#ffffff'];
  let bits = [], last = 0, dpr = 1;
  function resize() { dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); addEventListener('resize', resize);
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') { document.body.classList.remove('hat-cursor'); return; }
    document.body.classList.add('hat-cursor');
    cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
    const now = performance.now();
    if (App.paused || now - last < 28) return;
    last = now;
    bits.push({ x: e.clientX + 6 + Math.random() * 10, y: e.clientY + 26 + Math.random() * 6, vx: (Math.random() - 0.5) * 30, vy: 10 + Math.random() * 25, r: 2 + Math.random() * 3, life: 1, spin: Math.random() * 6, c: colors[Math.random() * colors.length | 0] });
    if (bits.length > 40) bits.shift();
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => document.body.classList.remove('hat-cursor'));
  function star(x, y, r, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath();
    for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.35 : r; const t = i * Math.PI / 4; ctx.lineTo(Math.cos(t) * rr, Math.sin(t) * rr); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  App.tasks.add((now, dt) => {
    if (!bits.length) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of bits) {
      b.life -= dt * 1.4; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += dt * 3;
      ctx.globalAlpha = Math.max(0, b.life); ctx.fillStyle = b.c; star(b.x, b.y, b.r * (0.5 + b.life * 0.5), b.spin);
    }
    bits = bits.filter(b => b.life > 0);
    if (!bits.length) ctx.clearRect(0, 0, innerWidth, innerHeight);
  });
  // The guide drawer and dialogs sit in the top layer; keep the hat on top of them too.
  const card = $('#card');
  new MutationObserver(() => (card.open ? card : document.body).append(canvas, cursor)).observe(card, { attributes: true, attributeFilter: ['open'] });
})();

/* ==========================================================================
   WARP — hyperspace streaks that play during every journey
   ========================================================================== */
(() => {
  const canvas = $('#warp'), ctx = canvas.getContext('2d');
  const rays = Array.from({ length: 220 }, () => ({ a: Math.random() * Math.PI * 2, z: Math.random(), w: Math.random() * 1.8 + 0.4, hue: 180 + Math.random() * 110 }));
  let run = null;
  App.warp = ({ x, y, duration, reverse = false, strength = 1, lateral = 0 }) => {
    if (App.paused) return;
    canvas.width = innerWidth; canvas.height = innerHeight;
    run = { start: performance.now(), x, y, duration, reverse, strength, lateral };
    canvas.classList.add('on');
  };
  App.tasks.add(now => {
    if (!run) return;
    const p = (now - run.start) / run.duration;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    if (p >= 1 || App.paused) { run = null; canvas.classList.remove('on'); return; }
    const env = Math.sin(Math.PI * p) * run.strength;
    if (run.lateral) {
      // sideways orbit: horizontal light trails
      ctx.globalAlpha = env * 0.9;
      rays.forEach((r, i) => {
        const y = (i / rays.length) * H, len = 80 + r.z * 260 * env, x = ((r.z * W + p * W * 2.2 * -run.lateral) % W + W) % W;
        ctx.strokeStyle = `hsla(${r.hue},95%,${70 + r.z * 25}%,${0.15 + r.z * 0.6})`; ctx.lineWidth = r.w;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len * run.lateral, y); ctx.stroke();
      });
      ctx.globalAlpha = 1; return;
    }
    const cx = lerp(run.x, W / 2, clamp(p * 1.5)), cy = lerp(run.y, H * 0.45, clamp(p * 1.5));
    const reach = Math.hypot(W, H);
    const shade = ctx.createRadialGradient(cx, cy, 4, cx, cy, reach * 0.7);
    shade.addColorStop(0, `rgba(2,3,15,${env})`); shade.addColorStop(0.2, `rgba(37,19,75,${env * 0.7})`); shade.addColorStop(0.6, `rgba(16,49,81,${env * 0.45})`); shade.addColorStop(1, 'rgba(3,6,18,0)');
    ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
    const spin = p * (run.reverse ? -1.8 : 1.8);
    rays.forEach(r => {
      const z = ((run.reverse ? r.z - p * 1.6 : r.z + p * 1.6) % 1 + 1) % 1;
      const rad = 20 + z * z * reach, ang = r.a + spin * (1 - z), tail = Math.max(8, rad * (0.05 + env * 0.25));
      ctx.strokeStyle = `hsla(${r.hue},95%,${70 + z * 25}%,${(0.15 + z * 0.85) * env})`; ctx.lineWidth = r.w * (0.4 + z);
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * Math.max(0, rad - tail), cy + Math.sin(ang) * Math.max(0, rad - tail)); ctx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad); ctx.stroke();
    });
  });
})();

/* ==========================================================================
   GALAXY — swirling hat shader, swaying sign and the show blimp
   ========================================================================== */
(() => {
  const c = $('#hatFlow'), gl = c.getContext('webgl', { alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return;
  const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fs = `precision mediump float;varying vec2 uv;uniform sampler2D tex;uniform float t;
  vec2 inflow(vec2 d,float phase,float turn,float weight){float a=turn+phase*.12;mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a));return vec2(.4824,.6699)+r*d*(1.+phase*.18*weight);}
  vec3 storm(vec2 point,vec2 center,vec2 axes,vec3 original){vec2 local=(point-center)/axes;float r=length(local);float mask=1.-smoothstep(.55,1.,r);
    float phase=fract(t*.045),other=fract(phase+.5);float weight=1.-abs(phase*2.-1.);float a=phase*.28,b=other*.28;
    mat2 f=mat2(cos(a),-sin(a),sin(a),cos(a));mat2 s=mat2(cos(b),-sin(b),sin(b),cos(b));
    vec3 moved=mix(texture2D(tex,center+(s*local)*axes).rgb,texture2D(tex,center+(f*local)*axes).rgb,weight);return mix(original,moved,mask*.85);}
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
  void main(){vec4 base=texture2D(tex,uv);vec4 col=base;
    col.rgb=storm(uv,vec2(.49,.65),vec2(.20,.17),col.rgb);col.rgb=storm(uv,vec2(.49,.33),vec2(.32,.095),col.rgb);
    vec2 d=uv-vec2(.4824,.6699);float radius=length(d);float interior=1.-smoothstep(.06325,.15525,radius);
    float phase=fract(t*.075);float phaseB=fract(phase+.5);float blend=1.-abs(phase*2.-1.);
    vec4 a=texture2D(tex,inflow(d,phase,t*.20,interior));vec4 b=texture2D(tex,inflow(d,phaseB,t*.20,interior));
    col.rgb=mix(col.rgb,mix(b.rgb,a.rgb,blend),interior);
    float patches=smoothstep(.50,.62,noise(uv*vec2(15.,11.)));float pulse=.35+.65*(.5+.5*sin(t*.65+uv.x*21.+uv.y*17.));
    vec3 hue=.65+.35*cos(vec3(0.,2.1,4.2)+t*.20+uv.x*8.-uv.y*6.);float light=max(col.r,max(col.g,col.b));
    col.rgb=mix(col.rgb,light*hue*1.25,patches*pulse*.36*(1.-smoothstep(.65,1.,light)*.7));
    col.rgb=mix(col.rgb,vec3(.55,.82,1.),exp(-dot(d,d)/.00025)*.85);
    float edge=smoothstep(.0,.10,uv.x)*smoothstep(.0,.10,1.-uv.x)*smoothstep(.0,.08,uv.y)*smoothstep(.0,.08,1.-uv.y);
    float fade=1.-smoothstep(.52,.74,length((uv-.5)*vec2(1.,1.12)));gl_FragColor=vec4(col.rgb,edge*fade);}`;
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const v = shader(gl.VERTEX_SHADER, vs), f = shader(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  const pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  const tLoc = gl.getUniformLocation(pr, 't');
  const image = new Image(); image.src = 'assets/galaxy-v7.webp';
  image.onload = () => {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    $('#hat').classList.add('live');
    let elapsed = 0;
    const render = dt => {
      const scale = Math.min(devicePixelRatio || 1, 1.5), w = Math.round(c.clientWidth * scale), h = Math.round(c.clientHeight * scale);
      if (!w || !h) return;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
      elapsed += dt; gl.uniform1f(tLoc, elapsed); gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    App.tasks.add((now, dt) => { if (App.current === 'galaxy' && (!App.paused || !c.width)) render(App.paused ? 0 : dt); });
    App.on('motion', () => render(0));
  };
})();

(() => {
  const sign = $('#hangingSign');
  const bump = () => { if (App.paused) return; sign.classList.remove('bump'); void sign.offsetWidth; sign.classList.add('bump'); };
  sign.addEventListener('pointerenter', bump); sign.addEventListener('click', bump);
  sign.addEventListener('animationend', e => { if (e.animationName === 'sign-bump') sign.classList.remove('bump'); });
})();

/* Show blimp: roams the home sky with a live ticker. */
(() => {
  const blimp = $('#blimp'), flyer = $('#blimpFlyer'), ticker = $('#tickerText');
  const show = spotlightShow(), last = pastShows()[0];
  const line = show
    ? `NEXT SHOW: ${shortDate(show)} · ${show.title.split(' — ')[0].toUpperCase()} · ${show.city.toUpperCase()}`
    : `NEW SHOWS LANDING SOON ★ ${last ? `THANKS ${last.city.split(',')[0].toUpperCase()}! (${shortDate(last)} W/ ${last.title.split(' — ')[0].toUpperCase()})` : 'STAY TUNED'} ★ BOOKINGS: MUMBOBEATZ@GMAIL.COM`;
  ticker.textContent = `${line}  ★  ${line}  ★  `;
  if (show?.flyer) flyer.querySelector('img').src = `assets/${show.flyer}.webp`;
  else flyer.innerHTML = '<span class="flyer-text">NEW<br>DATES<br>SOON<small>★ stay tuned ★</small></span>';
  blimp.setAttribute('aria-label', show ? `Next show: ${show.title}, ${prettyDate(show)}, ${show.city}` : 'Show news: new dates coming soon');
  blimp.classList.toggle('no-flyer', !show);
  blimp.addEventListener('click', () => App.emit('show-news'));

  let x = innerWidth * 0.72, y = 110, vx = -70, vy = 38, hover = false, tilt = 0;
  blimp.addEventListener('pointerenter', () => hover = true); blimp.addEventListener('pointerleave', () => hover = false);
  blimp.addEventListener('focus', () => hover = true); blimp.addEventListener('blur', () => hover = false);
  App.tasks.add((now, dt) => {
    if (App.current !== 'galaxy') return;
    const bw = blimp.offsetWidth, bh = blimp.offsetHeight, narrow = innerWidth <= 700;
    const signBottom = $('#hangingSign').getBoundingClientRect().bottom;
    const minY = narrow ? signBottom - bh * 0.12 : 80;
    const maxY = narrow ? minY : Math.max(minY, $('#reel').getBoundingClientRect().top - bh - 10);
    const maxX = Math.max(8, innerWidth - bw - 8);
    if (!App.paused) {
      const slow = hover ? 0.25 : 1; // ease off under the pointer, but never park on top of the portal
      x += vx * dt * slow; y += vy * dt * slow;
      if (x <= 8) vx = Math.abs(vx); if (x >= maxX) vx = -Math.abs(vx);
      if (y <= minY) vy = Math.abs(vy); if (y >= maxY) vy = -Math.abs(vy);
      tilt = Math.sin(now * 0.0012) * 4;
    }
    x = clamp(x, 8, maxX); y = clamp(y, minY, maxY);
    blimp.dataset.dir = vx > 0 ? 'right' : 'left';
    blimp.style.transform = `translate(${x}px,${y}px) rotate(${tilt}deg)`;
  });
})();

/* ==========================================================================
   WORLD MAP — the sun, warp lanes, commuters and the orbiting moon
   ========================================================================== */
(() => {
  const sun = $('#sun'), eyes = $$('.sun-eyes i', sun);
  let moodTimer;
  App.tasks.add(() => {
    if (App.current !== 'hub' || App.paused) return;
    const r = sun.getBoundingClientRect();
    [[0.3667, 0.4448], [0.6713, 0.4351]].forEach(([ex, ey], i) => {
      const cx = r.left + r.width * ex, cy = r.top + r.height * ey, dx = App.pointer.x - cx, dy = App.pointer.y - cy;
      const a = Math.atan2(dy, dx), s = Math.min(1, Math.hypot(dx, dy) / (r.width * 0.8));
      eyes[i].style.transform = `translate(calc(-50% + ${Math.cos(a) * r.width * 0.06 * s}px),calc(-50% + ${Math.sin(a) * r.height * 0.06 * s}px))`;
    });
  });
  sun.addEventListener('click', () => {
    clearTimeout(moodTimer);
    sun.dataset.mood = sun.dataset.mood === 'laugh' ? 'angry' : 'laugh';
    sun.setAttribute('aria-label', `The sun is ${sun.dataset.mood === 'laugh' ? 'laughing' : 'grumpy'}. Click again for another face.`);
    App.emit('sun', sun.dataset.mood);
    moodTimer = setTimeout(() => { sun.dataset.mood = ''; sun.setAttribute('aria-label', 'Play with the sun'); }, 2800);
  });

  /* Moon orbit */
  const map = $('#map'), moon = $('#moonPlanet');
  let angle = -Math.PI / 2, moonHover = false;
  moon.addEventListener('pointerenter', () => moonHover = true); moon.addEventListener('pointerleave', () => moonHover = false);
  moon.addEventListener('focus', () => moonHover = true); moon.addEventListener('blur', () => moonHover = false);
  function placeMoon() {
    const narrow = map.clientWidth < map.clientHeight;
    const rx = narrow ? 30 : 17, ry = narrow ? 11 : 24;
    moon.style.setProperty('--x', 50 + Math.cos(angle) * rx);
    moon.style.setProperty('--y', 52 + Math.sin(angle) * ry);
    moon.style.zIndex = Math.sin(angle) > 0 ? 6 : 3;
  }
  App.tasks.add((now, dt) => {
    if (App.current !== 'hub') return;
    if (!App.paused && !moonHover) angle += dt * 0.12;
    placeMoon();
  });
  placeMoon();

  /* Warp lanes (SVG) between the sun and each planet */
  const svg = $('#lanes'), traffic = $('#traffic');
  const centers = () => {
    const m = map.getBoundingClientRect();
    const c = el => { const r = el.getBoundingClientRect(); return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2 }; };
    return { sun: c(sun), planets: $$('.planet:not(.moon)', map).map(c), w: m.width, h: m.height };
  };
  function drawLanes() {
    const { sun: s, planets, w, h } = centers();
    if (!w) return;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const narrow = w < h, orbit = `<ellipse cx="${s.x}" cy="${s.y}" rx="${w * (narrow ? 0.30 : 0.17)}" ry="${h * (narrow ? 0.11 : 0.24)}" class="orbit"/>`;
    const lanes = planets.map((p, i) => {
      const mx = (s.x + p.x) / 2 + (p.y - s.y) * 0.18, my = (s.y + p.y) / 2 - (p.x - s.x) * 0.18;
      return `<path class="lane" d="M${s.x} ${s.y} Q${mx} ${my} ${p.x} ${p.y}"/><path class="lane-glow" style="animation-delay:${-i * 1.3}s" d="M${s.x} ${s.y} Q${mx} ${my} ${p.x} ${p.y}"/>`;
    }).join('');
    const ring = planets.map((p, i) => { const q = planets[(i + 1) % planets.length]; return `<path class="lane faint" d="M${p.x} ${p.y} L${q.x} ${q.y}"/>`; }).join('');
    svg.innerHTML = orbit + ring + lanes;
  }
  new ResizeObserver(drawLanes).observe(map);
  App.on('scene', name => { if (name === 'hub') requestAnimationFrame(drawLanes); });

  /* Commuters fly between planets */
  const kinds = ['ship', 'jet', 'ship', 'walker', 'ship', 'jet'];
  const riders = kinds.map((kind, i) => {
    const el = document.createElement('i'); el.className = 'commuter ' + kind; traffic.append(el);
    return { el, from: i % 4, to: (i + 1 + (i % 3)) % 4, t: Math.random(), speed: 0.05 + Math.random() * 0.05 };
  });
  App.tasks.add((now, dt) => {
    if (App.current !== 'hub') return;
    const { planets } = centers();
    if (planets.length < 4) return;
    for (const r of riders) {
      if (!App.paused) r.t += dt * r.speed;
      if (r.t >= 1) { r.t = 0; r.from = r.to; r.to = (r.to + 1 + Math.floor(Math.random() * 3)) % 4; }
      const a = planets[r.from], b = planets[r.to], e = r.t < 0.5 ? 2 * r.t * r.t : 1 - (-2 * r.t + 2) ** 2 / 2;
      const arc = Math.sin(Math.PI * r.t) * 40;
      const x = lerp(a.x, b.x, e), y = lerp(a.y, b.y, e) - arc;
      r.el.style.transform = `translate(${x}px,${y}px) scaleX(${b.x < a.x ? -1 : 1})`;
      r.el.style.opacity = String(clamp(Math.min(r.t, 1 - r.t) * 8));
    }
  });
})();
