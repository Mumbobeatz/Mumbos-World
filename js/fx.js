/* ==========================================================================
   MUMBO'S WORLD — SHARED STATE + VISUAL EFFECTS
   One animation loop drives every moving piece; each piece only works while
   its scene is on screen.
   ========================================================================== */
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
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
  tasks: new Set()
};
App.paused = App.reduced;

/* ---------- motion toggle ---------- */
function syncMotion() {
  document.body.classList.toggle('paused', App.paused);
  const b = $('#motionToggle');
  b.textContent = App.paused ? 'Resume motion' : 'Pause motion';
  b.setAttribute('aria-pressed', String(App.paused));
}
$('#motionToggle').addEventListener('click', () => { App.paused = !App.paused; syncMotion(); App.emit('motion'); });
syncMotion();

/* ---------- one loop ---------- */
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

const loadImage = src => { const im = new Image(); im.src = src; return im; };
const CLOUD = loadImage('assets/label-cloud.webp');

/* ==========================================================================
   SKY — layered stars with gentle parallax and shooting stars
   ========================================================================== */
(() => {
  const canvas = $('#sky'), ctx = canvas.getContext('2d');
  let w, h, layers = [], meteors = [], nextMeteor = 0.6, clock = 0, look = { x: 0, y: 0 }, acc = 0;
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2); w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = Math.max(w * h / 1e6, 0.35);
    layers = [[0.2, 240, 0.9], [0.55, 120, 1.4], [1.1, 36, 2]].map(([depth, n, size]) => ({
      depth, stars: Array.from({ length: Math.round(n * area) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * size * 0.7 + 0.3, p: Math.random() * 6.28 }))
    }));
    draw(0);
  }
  function draw(dt) {
    ctx.clearRect(0, 0, w, h);
    look.x = lerp(look.x, App.pointer.nx, 0.05); look.y = lerp(look.y, App.pointer.ny, 0.05);
    ctx.fillStyle = '#d4ecff';
    for (const layer of layers) {
      const ox = -look.x * 26 * layer.depth, oy = -look.y * 18 * layer.depth;
      for (const s of layer.stars) {
        const x = ((s.x + clock * 3 * layer.depth + ox) % w + w) % w, y = ((s.y + oy) % h + h) % h;
        ctx.globalAlpha = 0.2 + (Math.sin(clock * 1.2 + s.p) + 1) * 0.3;
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
      }
    }
    if (clock > nextMeteor) {
      const angle = 0.35 + Math.random() * 0.55, dir = Math.random() < 0.5 ? 1 : -1, speed = 260 + Math.random() * 360;
      meteors.push({ x: Math.random() * w, y: Math.random() * h * 0.7, vx: Math.cos(angle) * speed * dir, vy: Math.sin(angle) * speed, age: 0, life: 1.1 + Math.random() * 1.1, len: 65 + Math.random() * 100 });
      nextMeteor = clock + 0.6 + Math.random() * 1.3;
    }
    ctx.lineCap = 'round';
    for (const m of meteors) {
      m.age += dt; m.x += m.vx * dt; m.y += m.vy * dt;
      const sp = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / sp * m.len, ty = m.y - m.vy / sp * m.len;
      ctx.globalAlpha = Math.min(1, m.age / 0.15) * Math.max(0, 1 - m.age / m.life) * 0.8;
      const g = ctx.createLinearGradient(tx, ty, m.x, m.y); g.addColorStop(0, 'rgba(123,177,255,0)'); g.addColorStop(0.8, 'rgba(170,210,255,.6)'); g.addColorStop(1, '#f5fcff');
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    meteors = meteors.filter(m => m.age < m.life && m.x > -200 && m.x < w + 200 && m.y < h + 200).slice(-6);
  }
  App.tasks.add((now, dt) => {
    if (App.paused) return;
    clock += dt; acc += dt;
    if (acc < 1 / 40) return;
    draw(acc); acc = 0;
  });
  addEventListener('resize', resize); resize();
})();

/* ==========================================================================
   CURSOR — white bucket hat with a small, soft smoke trail (mouse only)
   ========================================================================== */
(() => {
  const cursor = $('#cursor'), canvas = $('#smoke'), ctx = canvas.getContext('2d');
  let puffs = [], last = 0;
  function resize() { const dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  resize(); addEventListener('resize', resize);
  const show = e => {
    if (e.pointerType && e.pointerType !== 'mouse') { document.body.classList.remove('hat-cursor'); return; }
    document.body.classList.add('hat-cursor');
    cursor.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  };
  addEventListener('pointermove', e => {
    show(e);
    if (e.pointerType !== 'mouse' || App.paused) return;
    const now = performance.now();
    if (now - last < 22) return;
    last = now;
    puffs.push({ x: e.clientX + 10, y: e.clientY + 22, r: 3, life: 1, vx: (Math.random() - 0.5) * 0.5 });
    if (puffs.length > 36) puffs.shift();
  }, { passive: true });
  addEventListener('pointerdown', show, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => document.body.classList.remove('hat-cursor'));
  App.tasks.add((now, dt) => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (!puffs.length) return;
    const k = dt * 60;
    for (const p of puffs) {
      p.life -= 0.03 * k; p.y -= 0.32 * k; p.x += p.vx * k; p.r += 0.2 * k;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(222,238,255,${Math.max(0, p.life) * 0.3})`); g.addColorStop(1, 'rgba(180,204,244,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    puffs = puffs.filter(p => p.life > 0);
  });
  // A modal sits in the browser's top layer; carry the hat and smoke into it so
  // the cursor never disappears after opening the blimp, INFO or a building.
  const dialog = $('#directory');
  new MutationObserver(() => (dialog.open ? dialog : document.body).append(canvas, cursor)).observe(dialog, { attributes: true, attributeFilter: ['open'] });
})();

/* ==========================================================================
   TRAVEL EFFECTS
   App.warp   — hyperspace streaks / the wormhole tunnel
   App.clouds — a brief bank of cartoon clouds flying past the camera
   Both are driven by the journey's own progress value, so they always end
   exactly when the journey does and never linger.
   ========================================================================== */
(() => {
  const canvas = $('#warp'), ctx = canvas.getContext('2d');
  const rays = Array.from({ length: 220 }, () => ({ a: Math.random() * Math.PI * 2, z: Math.random(), w: Math.random() * 1.7 + 0.4, hue: 185 + Math.random() * 95 }));
  let job = null;
  const size = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  App.warp = {
    start(opts) { size(); job = { ...opts }; canvas.classList.add('on'); },
    stop() { job = null; ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.classList.remove('on'); },
    draw(p) {
      if (!job) return;
      const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H);
      const { x, y, mode, strength = 1, dir = 1 } = job;
      if (mode === 'side') {
        const env = Math.sin(Math.PI * p) * strength;
        rays.forEach((r, i) => {
          const yy = (i / rays.length) * H, len = 60 + r.z * 300 * env, xx = ((r.z * W - p * W * 2 * dir) % W + W) % W;
          ctx.strokeStyle = `hsla(${r.hue},95%,${72 + r.z * 22}%,${(0.1 + r.z * 0.55) * env})`; ctx.lineWidth = r.w;
          ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + len * dir, yy); ctx.stroke();
        });
        return;
      }
      const env = Math.sin(Math.PI * p) * strength, reach = Math.hypot(W, H);
      const cx = lerp(x, W / 2, smooth(clamp(p * 1.6))), cy = lerp(y, H * 0.45, smooth(clamp(p * 1.6)));
      if (mode === 'tunnel') {
        // Inside the wormhole: rings of light rush outward around a bright core.
        const shade = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach * 0.65);
        shade.addColorStop(0, `rgba(255,255,255,${env * 0.95})`); shade.addColorStop(0.05, `rgba(150,225,255,${env * 0.8})`);
        shade.addColorStop(0.22, `rgba(40,30,110,${env * 0.9})`); shade.addColorStop(0.7, `rgba(6,10,40,${env * 0.85})`); shade.addColorStop(1, `rgba(3,6,18,${env * 0.6})`);
        ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);
        for (let i = 0; i < 14; i++) {
          const z = ((i / 14) + p * 2.4) % 1, rad = 10 + z * z * reach * 0.75, twist = p * 6 + i * 0.6;
          ctx.strokeStyle = `hsla(${200 + i * 9},95%,${70 + z * 20}%,${env * (0.12 + z * 0.5)})`; ctx.lineWidth = 1 + z * 6;
          ctx.beginPath(); ctx.ellipse(cx, cy, rad, rad * 0.86, twist, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const spin = p * (mode === 'out' ? -1.6 : 1.6);
      rays.forEach(r => {
        const z = ((mode === 'out' ? r.z - p * 1.5 : r.z + p * 1.5) % 1 + 1) % 1;
        const rad = 16 + z * z * reach, ang = r.a + spin * (1 - z), tail = Math.max(8, rad * (0.05 + env * 0.28));
        ctx.strokeStyle = `hsla(${r.hue},95%,${70 + z * 25}%,${(0.12 + z * 0.8) * env})`; ctx.lineWidth = r.w * (0.4 + z);
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * Math.max(0, rad - tail), cy + Math.sin(ang) * Math.max(0, rad - tail)); ctx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad); ctx.stroke();
      });
    }
  };
})();

(() => {
  const canvas = $('#clouds'), ctx = canvas.getContext('2d');
  let puffs = [], job = null;
  App.clouds = {
    start(x = innerWidth / 2, y = innerHeight * 0.45) {
      canvas.width = innerWidth; canvas.height = innerHeight;
      // puffs sit on a cone around the flight path; each one sweeps past the camera
      puffs = Array.from({ length: 26 }, (_, i) => ({ a: (i / 26) * Math.PI * 2 + Math.random() * 0.4, r: 0.15 + Math.random() * 0.75, z0: Math.random(), s: 0.7 + Math.random() * 0.8, flip: Math.random() < 0.5 }));
      job = { x, y }; canvas.classList.add('on');
    },
    stop() { job = null; ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.classList.remove('on'); },
    /* p = 0..1 progress through the cloud bank; peak cover at p = .5 */
    draw(p) {
      if (!job) return;
      const W = canvas.width, H = canvas.height, cover = Math.sin(Math.PI * clamp(p));
      ctx.clearRect(0, 0, W, H);
      const cx = lerp(job.x, W / 2, smooth(clamp(p))), cy = lerp(job.y, H * 0.45, smooth(clamp(p)));
      // soft atmosphere wash hides the hand-off between the two artworks
      const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * 0.6);
      wash.addColorStop(0, `rgba(236,246,255,${cover * 0.92})`); wash.addColorStop(0.6, `rgba(205,228,250,${cover * 0.85})`); wash.addColorStop(1, `rgba(170,200,240,${cover * 0.7})`);
      ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);
      if (!CLOUD.complete) return;
      const unit = Math.max(W, H);
      for (const c of puffs) {
        const z = 1 - ((c.z0 + p * 1.15) % 1);            // 1 far → 0 at the camera
        const persp = 1 / (0.18 + z * 1.6);
        const px = cx + Math.cos(c.a) * c.r * unit * 0.35 * persp, py = cy + Math.sin(c.a) * c.r * unit * 0.24 * persp;
        const size = unit * 0.16 * c.s * persp;
        ctx.globalAlpha = 0.88 * clamp(cover * 1.25) * clamp((1 - z) * 3) * clamp(z * 6);
        ctx.save(); ctx.translate(px, py); if (c.flip) ctx.scale(-1, 1);
        ctx.drawImage(CLOUD, -size / 2, -size * 0.36, size, size * 0.72); ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  };
})();

/* ==========================================================================
   GALAXY — swirling hat (shader), inward pull of star dust, sign, blimp
   ========================================================================== */
(() => {
  const c = $('#hatFlow'), gl = c.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;
  // The texture is the immutable silhouette: only the interior storm and the
  // area around the wormhole resample it, so the hat's outline never deforms.
  const vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  const fs = `precision mediump float;varying vec2 uv;uniform sampler2D tex;uniform float t;
  vec2 inflow(vec2 d,float phase,float turn,float weight){float a=turn+phase*.12;mat2 r=mat2(cos(a),-sin(a),sin(a),cos(a));return vec2(.4824,.6699)+r*d*(1.+phase*.18*weight);}
  vec3 storm(vec2 point,vec2 center,vec2 axes,vec3 original){vec2 local=(point-center)/axes;float r=length(local);float mask=1.-smoothstep(.55,1.,r);
    float phase=fract(t*.045),other=fract(phase+.5);float weight=1.-abs(phase*2.-1.);float a=phase*.28,b=other*.28;
    mat2 f=mat2(cos(a),-sin(a),sin(a),cos(a));mat2 s=mat2(cos(b),-sin(b),sin(b),cos(b));
    vec3 moved=mix(texture2D(tex,center+(s*local)*axes).rgb,texture2D(tex,center+(f*local)*axes).rgb,weight);return mix(original,moved,mask*.85);}
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
  void main(){vec4 col=texture2D(tex,uv);
    col.rgb=storm(uv,vec2(.49,.65),vec2(.20,.17),col.rgb);col.rgb=storm(uv,vec2(.49,.33),vec2(.32,.095),col.rgb);
    vec2 d=uv-vec2(.4824,.6699);float radius=length(d);float interior=1.-smoothstep(.06325,.15525,radius);
    float phase=fract(t*.075);float phaseB=fract(phase+.5);float blend=1.-abs(phase*2.-1.);
    vec4 a=texture2D(tex,inflow(d,phase,t*.20,interior));vec4 b=texture2D(tex,inflow(d,phaseB,t*.20,interior));
    col.rgb=mix(col.rgb,mix(b.rgb,a.rgb,blend),interior);
    float dust=exp(-dot((uv-vec2(.50,.48))*vec2(1.,1.4),(uv-vec2(.50,.48))*vec2(1.,1.4))/.025);
    col.rgb*=1.+.035*dust*sin(radius*95.+t*1.2);
    float patches=smoothstep(.50,.62,noise(uv*vec2(15.,11.)));float pulse=.35+.65*(.5+.5*sin(t*.65+uv.x*21.+uv.y*17.));
    vec3 hue=.65+.35*cos(vec3(0.,2.1,4.2)+t*.20+uv.x*8.-uv.y*6.);float light=max(col.r,max(col.g,col.b));
    col.rgb=mix(col.rgb,light*hue*1.25,patches*pulse*.30*(1.-smoothstep(.65,1.,light)*.7));
    col.rgb=mix(col.rgb,vec3(.6,.86,1.),exp(-dot(d,d)/.00028)*.9);
    float edge=smoothstep(.0,.10,uv.x)*smoothstep(.0,.10,1.-uv.x)*smoothstep(.0,.08,uv.y)*smoothstep(.0,.08,1.-uv.y);
    float fade=1.-smoothstep(.52,.74,length((uv-.5)*vec2(1.,1.12)));float lum=max(col.r,max(col.g,col.b));
    // key out the dark sky in the artwork so the hat carries its own transparency
    // (no blend mode needed — no dark box appears while the camera dives in)
    float key=smoothstep(.05,.32,lum);
    gl_FragColor=vec4(col.rgb,edge*fade*key);}`;
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
  const image = loadImage('assets/galaxy-v7.webp');
  let elapsed = 0;
  const render = () => {
    const scale = Math.min(devicePixelRatio || 1, 1.5), w = Math.round(c.clientWidth * scale), h = Math.round(c.clientHeight * scale);
    if (!w || !h) return;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform1f(tLoc, elapsed); gl.drawArrays(gl.TRIANGLES, 0, 6);
  };
  image.onload = () => {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    $('#hat').classList.add('live');
    App.tasks.add((now, dt) => {
      if (App.current !== 'galaxy' && !App.busy) return;
      if (!App.paused) elapsed += dt;
      render();
    });
  };
})();

/* The wormhole's own galaxy: two nebula arms and their stars spiral inward
   and fall into the bright core. Drawn additively so the hat stays white. */
(() => {
  const c = $('#hatPull'), ctx = c.getContext('2d'), hat = $('#hat');
  const sprite = (r, g, b) => {
    const s = document.createElement('canvas'); s.width = s.height = 64;
    const x = s.getContext('2d'), grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${r},${g},${b},.55)`); grad.addColorStop(.45, `rgba(${r},${g},${b},.18)`); grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = grad; x.fillRect(0, 0, 64, 64); return s;
  };
  const clouds = [sprite(176, 150, 255), sprite(150, 205, 255), sprite(225, 170, 255), sprite(190, 235, 255)];
  const arms = 2, parts = [];
  for (let i = 0; i < 220; i++) {
    const star = i % 2 === 0;
    parts.push({ arm: i % arms, u: Math.random(), jitter: (Math.random() - 0.5) * (star ? 0.5 : 0.35), size: star ? 0.5 + Math.random() * 1.2 : 0.035 + Math.random() * 0.045, star, sprite: clouds[i % clouds.length], speed: 0.05 + Math.random() * 0.04, tw: Math.random() * 6.28 });
  }
  let spin = 0, elapsed = 0;
  App.tasks.add((now, dt) => {
    if (App.current !== 'galaxy' && !App.busy) return;
    const w = hat.clientWidth, h = hat.clientHeight;
    if (!w) return;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    ctx.clearRect(0, 0, w, h);
    if (!App.paused) { spin += dt * 0.35; elapsed += dt; }
    const cx = w * 0.4824, cy = h * 0.3301, rx = w * 0.16, ry = h * 0.135;
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      if (!App.paused) { p.u -= dt * p.speed * (0.6 + p.u); if (p.u <= 0.03) { p.u = 1; p.jitter = (Math.random() - 0.5) * 0.4; } }
      // logarithmic spiral: the closer to the core, the further round the arm
      const r = p.u, theta = p.arm * Math.PI + spin + Math.log(r) * 2.4 + p.jitter;
      const x = cx + Math.cos(theta) * rx * r, y = cy + Math.sin(theta) * ry * r;
      const fade = smooth(clamp((1 - r) * 3)) * smooth(clamp(r * 6));
      if (p.star) {
        ctx.globalAlpha = fade * (0.55 + 0.45 * Math.sin(elapsed * 3 + p.tw));
        ctx.fillStyle = '#f4fbff';
        ctx.beginPath(); ctx.arc(x, y, p.size * (0.5 + r * 0.8), 0, 6.283); ctx.fill();
      } else {
        const size = w * p.size * (0.35 + r);
        ctx.globalAlpha = fade * 0.32;
        ctx.drawImage(p.sprite, x - size / 2, y - size / 2, size, size);
      }
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  });
})();

(() => {
  const sign = $('#hangingSign');
  const bump = () => { if (App.paused) return; sign.classList.remove('bump'); void sign.offsetWidth; sign.classList.add('bump'); };
  sign.addEventListener('pointerenter', bump); sign.addEventListener('click', bump);
  sign.addEventListener('animationend', e => { if (e.animationName === 'sign-bump') sign.classList.remove('bump'); });
})();

/* Show blimp: drifts through the home sky; keeps clear of the wormhole on phones. */
(() => {
  const blimp = $('#blimp'), flyer = $('#blimpFlyer'), ticker = $('#tickerText');
  const show = spotlightShow();
  const line = show
    ? `Next show: ${shortDate(show)} w/${show.title.split(' — ')[0]}`
    : 'New shows landing soon ★ Bookings: mumbobeatz@gmail.com';
  ticker.textContent = `${line}  ★  ${line}  ★  `;
  if (show?.flyer) flyer.querySelector('img').src = `assets/${show.flyer}.webp`;
  else flyer.innerHTML = '<span class="flyer-text">NEW<br>SHOWS<br>SOON<small>follow @mumbobeatz</small></span>';
  blimp.setAttribute('aria-label', show ? `Next show: ${show.title}, ${prettyDate(show)}, ${show.city}` : 'Show news: new dates coming soon');
  blimp.addEventListener('click', () => App.emit('show-news'));

  let x = innerWidth * 0.74, y = 110, vx = -66, vy = 34, hover = false, tilt = 0;
  blimp.addEventListener('pointerenter', () => hover = true); blimp.addEventListener('pointerleave', () => hover = false);
  App.tasks.add((now, dt) => {
    if (App.current !== 'galaxy') return;
    const bw = blimp.offsetWidth, bh = blimp.offsetHeight, phone = innerWidth <= 700;
    const sign = $('#hangingSign').getBoundingClientRect(), reelTop = $('#reel').getBoundingClientRect().top;
    // phones: ride the strip beside/under the sign so the wormhole stays tappable
    const minY = phone ? sign.bottom - bh * 0.62 : 74;
    const maxY = phone ? minY : Math.max(minY, reelTop - bh - 6);
    const maxX = Math.max(8, innerWidth - bw - 8);
    if (!App.paused) {
      const pace = hover ? 0.25 : 1;
      x += vx * dt * pace; y += vy * dt * pace;
      if (x <= 8) vx = Math.abs(vx); if (x >= maxX) vx = -Math.abs(vx);
      if (y <= minY) vy = Math.abs(vy); if (y >= maxY) vy = -Math.abs(vy);
      tilt = Math.sin(now * 0.0012) * 4;
    }
    x = clamp(x, 8, maxX); y = clamp(y, minY, maxY);
    // never park over the wormhole: bounce off a protected zone around it
    const p = $('.portal').getBoundingClientRect(), pad = 26;
    const hit = x < p.right + pad && x + bw > p.left - pad && y + bh * 0.1 < p.bottom + pad && y + bh * 0.95 > p.top - pad;
    if (hit && !phone) {
      const cx = x + bw / 2, cy = y + bh / 2, px = (p.left + p.right) / 2, py = (p.top + p.bottom) / 2;
      if (Math.abs(cx - px) / bw > Math.abs(cy - py) / bh) { vx = Math.sign(cx - px) * Math.abs(vx); x += vx * dt * 2; }
      else { vy = Math.sign(cy - py) * Math.abs(vy); y += vy * dt * 2; }
    }
    blimp.dataset.dir = vx > 0 ? 'right' : 'left';
    blimp.style.transform = `translate(${x}px,${y}px) rotate(${tilt}deg)`;
  });
})();

/* ==========================================================================
   WORLD MAP — sun, moon orbit, space lanes and commuter traffic
   ========================================================================== */
(() => {
  const sun = $('#sun'), eyes = $$('.sun-eyes i', sun);
  let moodTimer, mood = 0;
  App.tasks.add(() => {
    if (App.current !== 'hub' || App.paused) return;
    const r = sun.getBoundingClientRect();
    [[0.3667, 0.4448], [0.6713, 0.4351]].forEach(([ex, ey], i) => {
      const cx = r.left + r.width * ex, cy = r.top + r.height * ey, dx = App.pointer.x - cx, dy = App.pointer.y - cy;
      const a = Math.atan2(dy, dx), s = Math.min(1, Math.hypot(dx, dy) / (r.width * 0.8));
      eyes[i].style.transform = `translate(calc(-50% + ${Math.cos(a) * r.width * 0.068 * s}px),calc(-50% + ${Math.sin(a) * r.height * 0.067 * s}px))`;
    });
  });
  // Existing behaviour: each click alternates laugh → angry; it relaxes after 2.8s.
  sun.addEventListener('click', () => {
    clearTimeout(moodTimer);
    mood = mood === 1 ? 2 : 1;
    sun.dataset.mood = mood === 1 ? 'laugh' : 'angry';
    sun.setAttribute('aria-label', mood === 1 ? 'The sun is laughing. Click for another expression.' : 'The sun is angry. Click for another expression.');
    moodTimer = setTimeout(() => { sun.dataset.mood = 'neutral'; sun.setAttribute('aria-label', 'Play with the sun'); }, 2800);
  });

  /* Mumbo's Moon orbits the sun */
  const map = $('#map'), moon = $('#moonPlanet');
  let angle = -Math.PI * 0.62, moonHover = false;
  moon.addEventListener('pointerenter', () => moonHover = true); moon.addEventListener('pointerleave', () => moonHover = false);
  moon.addEventListener('focus', () => moonHover = true); moon.addEventListener('blur', () => moonHover = false);
  const orbit = () => { const r = map.clientWidth / map.clientHeight; return r < 1 ? { rx: 40, ry: 9 } : r < 1.3 ? { rx: 34, ry: 8 } : { rx: 9, ry: 27 }; };
  function placeMoon() {
    const { rx, ry } = orbit();
    moon.style.setProperty('--x', 50 + Math.cos(angle) * rx);
    moon.style.setProperty('--y', 50 + Math.sin(angle) * ry);
    moon.style.zIndex = Math.sin(angle) > 0 ? 6 : 3;
  }
  App.tasks.add((now, dt) => {
    if (App.current !== 'hub' && !App.busy) return;
    if (!App.paused && !moonHover) angle += dt * 0.1;
    placeMoon();
  });
  placeMoon();
  App.moonPoint = () => { const r = moon.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* Space lanes: a ring between neighbouring worlds plus both diagonals */
  const svg = $('#lanes'), traffic = $('#traffic');
  const keys = ['music', 'media', 'toys', 'events'];
  const routes = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
  let pts = [], bend = [];
  function measure() {
    const m = map.getBoundingClientRect();
    pts = keys.map(k => { const r = $(`.planet[data-go="${k}"]`, map).getBoundingClientRect(); return { x: r.left - m.left + r.width / 2, y: r.top - m.top + r.height / 2 }; });
    bend = routes.map(([a, b], i) => { const A = pts[a], B = pts[b]; const s = i > 3 ? 0.12 : 0.18; return { x: (A.x + B.x) / 2 + (B.y - A.y) * s, y: (A.y + B.y) / 2 - (B.x - A.x) * s }; });
    const { rx, ry } = orbit();
    svg.setAttribute('viewBox', `0 0 ${m.width} ${m.height}`);
    svg.innerHTML = `<ellipse class="orbit" cx="${m.width / 2}" cy="${m.height / 2}" rx="${m.width * rx / 100}" ry="${m.height * ry / 100}"/>` +
      routes.map(([a, b], i) => `<path class="lane" d="M${pts[a].x} ${pts[a].y} Q${bend[i].x} ${bend[i].y} ${pts[b].x} ${pts[b].y}"/>`).join('');
  }
  new ResizeObserver(() => { if (App.current === 'hub') measure(); }).observe(map);
  App.on('scene', name => { if (name === 'hub') requestAnimationFrame(measure); });

  // Busy skies: ships, jetpacks and the odd space-walker commute along every lane.
  const riders = [];
  routes.forEach((route, i) => {
    for (let n = 0; n < 7; n++) {
      const el = document.createElement('i');
      el.className = 'commuter ' + (n % 3 === 0 ? 'jet' : n === 4 ? 'walker' : 'ship');
      traffic.append(el);
      riders.push({ el, route: i, t: (n / 7 + Math.random() * 0.1) % 1, speed: (0.035 + Math.random() * 0.03) * (n === 4 ? 0.5 : 1), back: n % 2 === 1 });
    }
  });
  const quad = (A, C, B, t) => ({ x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * C.x + t * t * B.x, y: (1 - t) ** 2 * A.y + 2 * (1 - t) * t * C.y + t * t * B.y });
  App.tasks.add((now, dt) => {
    if (App.current !== 'hub' || !pts.length) return;
    for (const r of riders) {
      if (!App.paused) r.t = (r.t + dt * r.speed) % 1;
      const [a, b] = routes[r.route], t = r.back ? 1 - r.t : r.t;
      const p = quad(pts[a], bend[r.route], pts[b], t), q = quad(pts[a], bend[r.route], pts[b], clamp(t + (r.back ? -0.01 : 0.01)));
      // fade out as riders reach a world so they never cover its signs
      const fade = clamp(Math.min(r.t, 1 - r.t) * 9);
      r.el.style.transform = `translate(${p.x}px,${p.y}px) scaleX(${q.x < p.x ? -1 : 1})`;
      r.el.style.opacity = fade.toFixed(2);
    }
  });
})();
