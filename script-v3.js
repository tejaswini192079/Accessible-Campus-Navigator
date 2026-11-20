/* ========== Accessible Campus Navigator – script-v2.js ========== */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3600);
  }

  /* ---------- Photos (local file -> Pexels -> drawn fallback) ---------- */
  // To use your own photo, save it as images/<key>.jpg (e.g. images/wheel.jpg). It is tried first.
  const PX = id => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1000`;
  const IMG = {
    wheel:   { id: 6194683,  emoji: '♿', c1: '#0f9d8f', c2: '#12304a' },
    wheel2:  { id: 8524602,  emoji: '♿', c1: '#d6a24a', c2: '#12304a' },
    cane:    { id: 8327658,  emoji: '🦯', c1: '#2dd4bf', c2: '#0c1b2a' },
    cane2:   { id: 8327773,  emoji: '🦯', c1: '#0f9d8f', c2: '#0c1b2a' },
    campus:  { id: 7972518,  emoji: '🎓', c1: '#14507a', c2: '#0f9d8f' },
    campus2: { id: 7972512,  emoji: '🏫', c1: '#d6a24a', c2: '#14507a' },
    library: { id: 33892136, emoji: '📚', c1: '#12304a', c2: '#d6a24a' },
    lift:    { id: 3861787,  emoji: '🛗', c1: '#0f9d8f', c2: '#12304a' },
    phone:   { id: 7362886,  emoji: '📱', c1: '#2dd4bf', c2: '#14507a' },
    phone2:  { id: 30403062, emoji: '🧭', c1: '#14507a', c2: '#2dd4bf' },
    ramp:    { id: 26651561, emoji: '♿', c1: '#d6a24a', c2: '#0f9d8f' }
  };
  /* ---------- Built-in illustrated scenes (used when a photo cannot load) ---------- */
  const SCENE_KIND = { wheel: 'ramp', wheel2: 'ramp', ramp: 'ramp', cane: 'cane', cane2: 'cane', campus: 'campus', campus2: 'campus', library: 'library', lift: 'lift', phone: 'phone', phone2: 'phone' };
  const skin = '#e0ac8a', jeans = '#2b3a55';
  const person = (x, y, s, shirt) => `<g transform='translate(${x} ${y}) scale(${s})'><rect x='-8' y='-24' width='7' height='26' rx='3' fill='${jeans}'/><rect x='1' y='-24' width='7' height='26' rx='3' fill='${jeans}'/><rect x='-10' y='-54' width='20' height='33' rx='8' fill='${shirt}'/><circle cx='0' cy='-64' r='10' fill='${skin}'/><path d='M-10 -66 q10 -14 20 0 z' fill='#3b2a20'/></g>`;
  const wheelchair = (x, y, s, shirt) => `<g transform='translate(${x} ${y}) scale(${s})'><circle cx='0' cy='-4' r='24' fill='none' stroke='#1f2937' stroke-width='4'/><circle cx='0' cy='-4' r='3' fill='#1f2937'/><circle cx='36' cy='8' r='9' fill='none' stroke='#1f2937' stroke-width='3'/><rect x='-16' y='-40' width='46' height='8' rx='3' fill='#374151'/><rect x='-8' y='-76' width='18' height='38' rx='8' fill='${shirt}'/><circle cx='1' cy='-88' r='10' fill='${skin}'/><path d='M-9 -90 q10 -14 20 0 z' fill='#2a1a12'/><rect x='6' y='-38' width='34' height='9' rx='4' fill='${jeans}'/><rect x='34' y='-34' width='7' height='30' rx='3' fill='${jeans}'/></g>`;
  const cane = (x, y, s, shirt) => `<g transform='translate(${x} ${y}) scale(${s})'>${person(0, 0, 1, shirt)}<line x1='10' y1='-34' x2='46' y2='2' stroke='#fff' stroke-width='4' stroke-linecap='round'/><line x1='40' y1='-4' x2='46' y2='2' stroke='#ef4444' stroke-width='4' stroke-linecap='round'/><rect x='-9' y='-70' width='18' height='6' rx='3' fill='#111827'/></g>`;
  const windows = (x, y, cols, rows, w, h, gx, gy, fill) => { let o = ''; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) o += `<rect x='${x + i * gx}' y='${y + j * gy}' width='${w}' height='${h}' rx='3' fill='${fill}'/>`; return o; };
  function sceneSvg(key, c) {
    const kind = SCENE_KIND[key] || 'campus';
    const sky = `<defs><linearGradient id='sk' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8fd0ff'/><stop offset='1' stop-color='#eaf6ff'/></linearGradient><linearGradient id='gr' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c.c1}'/><stop offset='1' stop-color='${c.c2}'/></linearGradient></defs>`;
    let body = '';
    const outdoor = `<rect width='400' height='300' fill='url(#sk)'/><circle cx='340' cy='54' r='26' fill='#fde68a'/><ellipse cx='90' cy='60' rx='42' ry='13' fill='#fff' opacity='.9'/><ellipse cx='120' cy='52' rx='28' ry='12' fill='#fff' opacity='.9'/><rect y='240' width='400' height='60' fill='#8bc98f'/><rect y='250' width='400' height='50' fill='#cbd5e1'/>`;
    if (kind === 'ramp') {
      body = outdoor +
        `<rect x='170' y='70' width='210' height='172' fill='url(#gr)'/>` + windows(188, 88, 4, 2, 30, 30, 48, 46, '#e0f2fe') +
        `<rect x='262' y='170' width='52' height='72' rx='4' fill='#0b1220'/><rect x='268' y='176' width='18' height='60' fill='#7dd3fc' opacity='.6'/><rect x='290' y='176' width='18' height='60' fill='#7dd3fc' opacity='.6'/>` +
        `<circle cx='338' cy='196' r='15' fill='#1d4ed8'/><text x='338' y='203' font-size='20' text-anchor='middle' fill='#fff'>♿</text>` +
        `<polygon points='20,244 160,206 160,244' fill='#e2e8f0' stroke='#94a3b8' stroke-width='2'/><rect x='160' y='206' width='110' height='38' fill='#e2e8f0' stroke='#94a3b8' stroke-width='2'/>` +
        `<line x1='24' y1='214' x2='160' y2='176' stroke='#facc15' stroke-width='4'/><line x1='160' y1='176' x2='260' y2='176' stroke='#facc15' stroke-width='4'/>` +
        wheelchair(98, 226, 0.95, '#f97316') + person(210, 244, 0.95, '#10b981');
    } else if (kind === 'cane') {
      body = outdoor +
        `<rect x='20' y='60' width='150' height='182' fill='url(#gr)'/>` + windows(34, 78, 3, 3, 28, 30, 44, 50, '#e0f2fe') +
        `<rect x='0' y='236' width='400' height='16' fill='#fcd34d'/>` + Array.from({ length: 26 }, (_, i) => `<circle cx='${8 + i * 15.5}' cy='244' r='3' fill='#b45309'/>`).join('') +
        `<rect x='300' y='110' width='6' height='132' fill='#64748b'/><rect x='276' y='104' width='54' height='22' rx='4' fill='#16a34a'/><text x='303' y='120' font-size='12' text-anchor='middle' fill='#fff' font-weight='700'>EXIT</text>` +
        cane(215, 240, 1.15, '#6366f1') + person(120, 240, 1, '#ec4899');
    } else if (kind === 'campus') {
      const tree = x => `<rect x='${x - 4}' y='196' width='8' height='46' fill='#7c4a21'/><circle cx='${x}' cy='186' r='26' fill='#22a06b'/><circle cx='${x - 14}' cy='198' r='16' fill='#2dbf7e'/>`;
      body = outdoor +
        `<rect x='40' y='84' width='140' height='158' fill='url(#gr)'/>` + windows(54, 100, 4, 3, 22, 24, 32, 38, '#e0f2fe') + `<polygon points='30,84 110,48 190,84' fill='#7f1d1d'/>` +
        `<rect x='212' y='120' width='150' height='122' fill='#f59e0b'/>` + windows(226, 134, 4, 2, 22, 26, 32, 42, '#fff7ed') +
        `<rect x='100' y='190' width='24' height='52' rx='3' fill='#0b1220'/>` + tree(200) + tree(380) +
        person(130, 248, 1, '#3b82f6') + person(170, 250, 1.05, '#ef4444') + person(300, 250, 1, '#8b5cf6');
    } else if (kind === 'library') {
      let shelves = '';
      const cols = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6'];
      for (let r = 0; r < 4; r++) {
        shelves += `<rect x='30' y='${44 + r * 46}' width='340' height='5' fill='#6b4423'/>`;
        for (let i = 0; i < 24; i++) shelves += `<rect x='${36 + i * 14}' y='${14 + r * 46 + (i % 3) * 3}' width='11' height='${30 - (i % 3) * 3}' fill='${cols[(i + r * 2) % cols.length]}'/>`;
      }
      body = `<rect width='400' height='300' fill='#f3e6d0'/><rect x='24' y='8' width='352' height='196' fill='#8a5a2b' opacity='.25'/>` + shelves +
        `<rect x='40' y='236' width='320' height='14' rx='4' fill='#8a5a2b'/><rect x='56' y='250' width='10' height='40' fill='#6b4423'/><rect x='334' y='250' width='10' height='40' fill='#6b4423'/>` +
        person(130, 236, 1.05, '#0ea5e9') + person(250, 236, 1.05, '#f97316') + `<rect x='160' y='220' width='46' height='14' rx='2' fill='#fff'/><rect x='282' y='222' width='34' height='12' rx='2' fill='#e2e8f0'/>`;
    } else if (kind === 'lift') {
      body = `<rect width='400' height='300' fill='#d6dbe1'/><rect x='70' y='40' width='260' height='250' rx='6' fill='#9aa5b1'/><rect x='80' y='52' width='118' height='236' fill='url(#gr)' opacity='.85'/><rect x='202' y='52' width='118' height='236' fill='url(#gr)' opacity='.85'/>` +
        `<rect x='80' y='52' width='118' height='236' fill='none' stroke='#e5e7eb' stroke-width='3'/><rect x='202' y='52' width='118' height='236' fill='none' stroke='#e5e7eb' stroke-width='3'/>` +
        `<rect x='150' y='6' width='100' height='30' rx='6' fill='#0b1220'/><text x='200' y='28' font-size='20' text-anchor='middle' fill='#f87171' font-weight='700'>▲ 2</text>` +
        `<rect x='336' y='120' width='40' height='84' rx='8' fill='#1f2937'/><circle cx='356' cy='144' r='9' fill='#fde68a'/><circle cx='356' cy='176' r='9' fill='#e5e7eb'/><text x='356' y='148' font-size='10' text-anchor='middle'>▲</text><text x='356' y='180' font-size='10' text-anchor='middle'>▼</text>` +
        `<circle cx='200' cy='158' r='20' fill='#1d4ed8'/><text x='200' y='166' font-size='24' text-anchor='middle' fill='#fff'>♿</text>`;
    } else {
      body = `<rect width='400' height='300' fill='url(#gr)'/><circle cx='340' cy='40' r='80' fill='#fff' opacity='.08'/><circle cx='50' cy='270' r='100' fill='#fff' opacity='.07'/>` +
        `<rect x='128' y='20' width='144' height='262' rx='24' fill='#0b1220'/><rect x='136' y='36' width='128' height='230' rx='14' fill='#e7f6ee'/>` +
        `<path d='M136 100 H264 M136 160 H264 M136 220 H264 M170 36 V266 M228 36 V266' stroke='#bfe3d2' stroke-width='6' fill='none'/>` +
        `<polyline points='156,240 156,190 200,190 200,130 244,130 244,70' fill='none' stroke='#2563eb' stroke-width='7' stroke-linecap='round' stroke-linejoin='round'/>` +
        `<circle cx='156' cy='240' r='9' fill='#10b981'/><circle cx='244' cy='70' r='11' fill='#ef4444'/><rect x='146' y='44' width='108' height='22' rx='8' fill='#fff' opacity='.9'/><text x='200' y='60' font-size='11' text-anchor='middle' fill='#12304a' font-weight='700'>♿ Step-free route</text>`;
    }
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300' preserveAspectRatio='xMidYMid slice'>${sky}${body}</svg>`;
  }
  function fallbackSvg(c, key) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sceneSvg(key, c));
  }

  $$('img[data-img]').forEach(el => {
    const key = el.dataset.img, c = IMG[key];
    if (!c) return;
    const srcs = ['images/' + key + '.jpg', PX(c.id), fallbackSvg(c, key)];
    let i = 0;
    el.loading = 'lazy';
    el.referrerPolicy = 'no-referrer';
    el.decoding = 'async';
    el.onerror = () => { i++; if (i < srcs.length) el.src = srcs[i]; };
    el.src = srcs[0];
  });

  /* ---------- Theme ---------- */
  const themeBtn = $('#themeBtn');
  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    themeBtn.textContent = mode === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('acn3-theme', mode); } catch (e) {}
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('acn3-theme'); } catch (e) {}
  setTheme(savedTheme || 'light');
  themeBtn.addEventListener('click', () =>
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* ---------- Menu ---------- */
  const burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.textContent = open ? '✕' : '☰';
  });
  $$('#menu a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); burger.textContent = '☰'; burger.setAttribute('aria-expanded', false);
  }));

  /* ---------- Scroll effects ---------- */
  const progress = $('#progress'), toTop = $('#toTop');
  const sections = $$('main section[id]');
  const links = $$('#menu a[href^="#"]');
  function onScroll() {
    const h = document.documentElement;
    progress.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100 + '%';
    toTop.classList.toggle('show', h.scrollTop > 500);
    let cur = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top <= 130) cur = s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ================================================================
     CAMPUS GRAPH
     ================================================================ */
  const NODES = {
    gate:      { name: 'Main Gate',         x: 90,  y: 420, icon: '🚪', hint: 'the large entrance gate next to the security cabin', say: ['main gate', 'gate', 'entrance'] },
    reception: { name: 'Reception',         x: 210, y: 320, icon: '🛎️', hint: 'the glass entrance with the help desk', say: ['reception', 'front desk', 'help desk'] },
    admin:     { name: 'Admin Block',       x: 210, y: 150, icon: '🏢', hint: 'the tall building with the flag', say: ['admin block', 'administration', 'admin', 'office'] },
    library:   { name: 'Library',           x: 440, y: 105, icon: '📚', hint: 'the building with the large reading lawn', say: ['library', 'books'] },
    cafe:      { name: 'Cafeteria',         x: 430, y: 330, icon: '☕', hint: 'the open courtyard with benches', say: ['cafeteria', 'canteen', 'cafe', 'food'] },
    science:   { name: 'Science Block',     x: 650, y: 210, icon: '🔬', hint: 'the blue building with lab windows', say: ['science block', 'science', 'laboratory', 'labs', 'lab'] },
    classroom: { name: 'Classroom Block A', x: 710, y: 80,  icon: '🎓', hint: 'the upper-floor classroom wing', say: ['classroom block', 'classroom', 'classes', 'class', 'lecture', 'block a'] },
    audi:      { name: 'Auditorium',        x: 690, y: 410, icon: '🎭', hint: 'the round building with wide double doors', say: ['auditorium', 'audi', 'hall'] }
  };
  const EDGES = [
    { a: 'gate', b: 'reception', d: 130, t: 'path' },
    { a: 'gate', b: 'cafe', d: 230, t: 'stairs' },
    { a: 'reception', b: 'cafe', d: 220, t: 'path' },
    { a: 'reception', b: 'admin', d: 90, t: 'stairs' },
    { a: 'reception', b: 'admin', d: 150, t: 'lift', lift: 'L1' },
    { a: 'admin', b: 'library', d: 170, t: 'stairs' },
    { a: 'admin', b: 'library', d: 270, t: 'ramp' },
    { a: 'cafe', b: 'library', d: 240, t: 'path' },
    { a: 'cafe', b: 'science', d: 250, t: 'path' },
    { a: 'cafe', b: 'audi', d: 270, t: 'ramp' },
    { a: 'library', b: 'science', d: 260, t: 'path' },
    { a: 'science', b: 'classroom', d: 140, t: 'lift', lift: 'L2' },
    { a: 'science', b: 'classroom', d: 250, t: 'ramp' },
    { a: 'science', b: 'audi', d: 140, t: 'stairs' },
    { a: 'science', b: 'audi', d: 230, t: 'path' },
    { a: 'library', b: 'classroom', d: 280, t: 'ramp' }
  ];
  const LIFTS = { L1: 'Admin Block Lift (L1)', L2: 'Science Block Lift (L2)' };
  const liftShort = id => LIFTS[id].replace(/ \(.*\)/, '');

  /* ---------- Reports state ---------- */
  const KEY = 'acn3-reports';
  let reports = [];
  try { reports = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { reports = []; }
  const audioMap = {}; // report id -> blob URL (kept in memory only)
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(reports)); } catch (e) {} };
  const isBroken = id => reports.some(r => r.lift === id && r.status === 'verified');
  const pendingCount = id => reports.filter(r => r.lift === id && r.status === 'pending').length;

  /* ---------- Map drawing ---------- */
  const svg = $('#map');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    if (parent) parent.appendChild(el);
    return el;
  };
  let routeLayer, walker, clickedFirst = false;

  function offsetFor(e) {
    const same = EDGES.filter(x => x.a === e.a && x.b === e.b);
    return (same.indexOf(e) - (same.length - 1) / 2) * 16;
  }
  function edgePoints(e, rev) {
    const A = NODES[rev ? e.b : e.a], B = NODES[rev ? e.a : e.b];
    const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    const o = offsetFor(e) * (rev ? -1 : 1);
    const nx = -dy / len * o, ny = dx / len * o;
    return { x1: A.x + nx, y1: A.y + ny, x2: B.x + nx, y2: B.y + ny };
  }
  function drawMap() {
    svg.innerHTML = '';
    mk('ellipse', { cx: 330, cy: 220, rx: 90, ry: 55, fill: '#86efac', opacity: .3 }, svg);
    mk('ellipse', { cx: 560, cy: 330, rx: 70, ry: 40, fill: '#7dd3fc', opacity: .3 }, svg);
    const eg = mk('g', {}, svg);
    EDGES.forEach(e => {
      const p = edgePoints(e, false);
      const blocked = e.lift && isBroken(e.lift);
      mk('line', { ...p, 'stroke-width': 6, 'stroke-linecap': 'round', class: 'edge-' + e.t + (blocked ? ' edge-blocked' : '') }, eg);
      if (e.t === 'lift') {
        const t = mk('text', { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 + 6, 'text-anchor': 'middle', 'font-size': 20 }, eg);
        t.textContent = blocked ? '⛔' : '🛗';
      }
    });
    routeLayer = mk('g', {}, svg);
    const ng = mk('g', {}, svg);
    Object.entries(NODES).forEach(([id, n]) => {
      const g = mk('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': n.name }, ng);
      mk('circle', { cx: n.x, cy: n.y, r: 24, fill: '#fff', stroke: '#0f9d8f', 'stroke-width': 4 }, g);
      mk('text', { x: n.x, y: n.y + 8, 'text-anchor': 'middle', 'font-size': 22 }, g).textContent = n.icon;
      mk('text', { x: n.x, y: n.y + 46, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: '#12304a', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' }, g).textContent = n.name;
      const pick = () => {
        if (!clickedFirst) { fromSel.value = id; clickedFirst = true; toast('Start: ' + n.name + ' — now click the destination'); }
        else { toSel.value = id; clickedFirst = false; findRoute(); }
      };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
    });
  }

  /* ---------- Selects ---------- */
  const fromSel = $('#from'), toSel = $('#to'), liftSel = $('#liftSel');
  Object.entries(NODES).forEach(([id, n]) => {
    fromSel.add(new Option(n.icon + ' ' + n.name, id));
    toSel.add(new Option(n.icon + ' ' + n.name, id));
  });
  Object.entries(LIFTS).forEach(([id, n]) => liftSel.add(new Option(n, id)));
  fromSel.value = 'gate'; toSel.value = 'classroom';
  $('#swapBtn').addEventListener('click', () => {
    const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t;
    if (!$('#result').classList.contains('hidden')) findRoute();
  });

  /* ---------- Routing ---------- */
  function shortest(from, to, mode) {
    const ok = e => !(e.lift && isBroken(e.lift)) && !(mode === 'step' && e.t === 'stairs');
    const dist = {}, prev = {}, done = new Set();
    Object.keys(NODES).forEach(k => dist[k] = Infinity);
    dist[from] = 0;
    for (;;) {
      let u = null;
      Object.keys(dist).forEach(k => { if (!done.has(k) && (u === null || dist[k] < dist[u])) u = k; });
      if (u === null || dist[u] === Infinity || u === to) break;
      done.add(u);
      EDGES.filter(ok).forEach(e => {
        const v = e.a === u ? e.b : e.b === u ? e.a : null;
        if (v && dist[u] + e.d < dist[v]) { dist[v] = dist[u] + e.d; prev[v] = { u, e }; }
      });
    }
    if (dist[to] === Infinity) return null;
    const legs = [];
    for (let c = to; c !== from;) { const p = prev[c]; legs.unshift({ from: p.u, to: c, edge: p.e }); c = p.u; }
    return { total: dist[to], legs };
  }
  function instruction(leg) {
    const A = NODES[leg.from], B = NODES[leg.to], e = leg.edge;
    const text = {
      path: `Walk along the flat paved path from ${A.name} to ${B.name}`,
      ramp: `Follow the gentle ramp from ${A.name} towards ${B.name}`,
      stairs: `Take the stairs from ${A.name} to ${B.name}`,
      lift: `Use the ${liftShort(e.lift)} between ${A.name} and ${B.name}`
    }[e.t];
    return { text, sub: `Look for ${B.hint}.`, dist: e.d };
  }

  /* ---------- Find route ---------- */
  let currentSteps = [], stepIdx = -1, lastSummary = '';
  const getMode = () => $('input[name="mode"]:checked').value;
  function addAlert(type, msg) {
    const d = document.createElement('div');
    d.className = 'alert ' + type; d.textContent = msg;
    $('#alerts').appendChild(d);
  }
  function findRoute(silent) {
    stopSpeech();
    const from = fromSel.value, to = toSel.value, mode = getMode();
    const result = $('#result');
    $('#alerts').innerHTML = ''; routeLayer.innerHTML = '';
    currentSteps = []; stepIdx = -1; lastSummary = '';
    if (from === to) { result.classList.add('hidden'); addAlert('warn', 'You are already at ' + NODES[to].name + '.'); lastSummary = 'You are already at ' + NODES[to].name; return false; }
    const r = shortest(from, to, mode);
    if (!r) {
      result.classList.add('hidden');
      addAlert('bad', 'No accessible route is available right now. Please contact campus security for help.');
      lastSummary = 'Sorry, no accessible route is available right now.';
      return false;
    }
    Object.keys(LIFTS).filter(isBroken).forEach(id => addAlert('warn', `⚠️ ${LIFTS[id]} is out of service — route avoids it.`));
    if (mode === 'step') addAlert('ok', '♿ Step-free route: no stairs on this path.');
    currentSteps = r.legs.map(instruction);
    const mins = Math.max(1, Math.round(r.total / (mode === 'step' ? 60 : 75)));
    lastSummary = `Route to ${NODES[to].name}. ${r.total} metres, about ${mins} ${mins > 1 ? 'minutes' : 'minute'}. ${mode === 'step' ? 'Step free.' : 'Fastest route.'}`;
    $('#summary').innerHTML =
      `<span class="chip">📏 ${r.total} m</span><span class="chip">⏱ ~${mins} min</span><span class="chip">${mode === 'step' ? '♿ Step-free' : '⚡ Fastest'}</span>` +
      (r.legs.some(l => l.edge.t === 'stairs') ? '<span class="chip">🪜 Has stairs</span>' : '');
    $('#steps').innerHTML = currentSteps.map((s, i) => `<li data-i="${i}">${s.text}<small>${s.sub} (${s.dist} m)</small></li>`).join('') +
      `<li data-i="${currentSteps.length}">🏁 You have arrived at ${NODES[to].name}</li>`;
    result.classList.remove('hidden');
    drawRoute(r, mode);
    if (!silent) toast(`Route found: ${r.total} m, about ${mins} min`);
    return true;
  }
  let routePts = [];
  function drawRoute(r, mode) {
    const pts = [];
    r.legs.forEach((l, i) => {
      const p = edgePoints(l.edge, l.edge.a !== l.from);
      if (i === 0) pts.push([p.x1, p.y1]);
      pts.push([p.x2, p.y2]);
    });
    routePts = pts;
    const path = mk('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'route' }, routeLayer);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 1.4s ease';
    path.style.strokeDashoffset = 0;
    walker = mk('text', { x: pts[0][0], y: pts[0][1] - 30, 'text-anchor': 'middle', 'font-size': 30, class: 'walker' }, routeLayer);
    walker.textContent = mode === 'step' ? '♿' : '🚶';
    walker.style.transition = 'transform .8s ease';
  }
  function moveWalker(i) {
    if (!walker || !routePts[i]) return;
    walker.style.transform = `translate(${routePts[i][0] - routePts[0][0]}px, ${routePts[i][1] - routePts[0][1]}px)`;
  }
  $('#goBtn').addEventListener('click', () => findRoute());
  $$('input[name="mode"]').forEach(r => r.addEventListener('change', () => findRoute()));
  fromSel.addEventListener('change', () => { clickedFirst = false; });

  /* ================================================================
     VOICE OUTPUT (text to speech)
     ================================================================ */
  const synth = window.speechSynthesis;
  const rateEl = $('#rate'), vStatus = $('#voiceStatus');
  let voices = [], speechId = 0, keepAlive = null, curUtter = null, reading = false;
  function setStatus(msg, cls) {
    vStatus.textContent = msg;
    vStatus.className = 'vstatus' + (cls ? ' ' + cls : '');
  }
  function loadVoices() { voices = synth ? synth.getVoices() : []; }
  if (synth) { loadVoices(); if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices); else synth.onvoiceschanged = loadVoices; }
  function pickVoice() {
    return voices.find(v => /en[-_]IN/i.test(v.lang)) || voices.find(v => /^en/i.test(v.lang)) || voices[0] || null;
  }
  function say(text, onend) {
    if (!synth || !window.SpeechSynthesisUtterance) {
      setStatus('Voice output not supported');
      toast('Your browser does not support spoken directions. Please try Chrome, Edge or Safari.');
      return false;
    }
    const id = ++speechId;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-IN';
    u.rate = parseFloat(rateEl.value) || 1;
    u.onstart = () => { if (id === speechId) setStatus('🔊 Speaking…', 'ok'); };
    u.onend = () => {
      if (id !== speechId) return;
      clearInterval(keepAlive);
      setStatus('Ready');
      if (onend) onend();
    };
    u.onerror = ev => {
      if (id !== speechId) return;
      clearInterval(keepAlive);
      if (ev.error === 'canceled' || ev.error === 'interrupted') return;
      setStatus('Voice blocked');
      toast('Could not play voice (' + ev.error + '). Click a button on the page first, and check the device volume.');
    };
    curUtter = u; // keep a reference so it is not garbage collected mid-speech
    setTimeout(() => { if (id === speechId) { synth.speak(u); if (synth.paused) synth.resume(); } }, 80);
    clearInterval(keepAlive);
    keepAlive = setInterval(() => { // Chrome stops long speech after ~15 s; this keeps it alive
      if (!synth.speaking) { clearInterval(keepAlive); return; }
      synth.pause(); synth.resume();
    }, 10000);
    return true;
  }
  function stopSpeech() {
    reading = false; speechId++;
    clearInterval(keepAlive);
    if (synth) synth.cancel();
    if (SR || !synth) setStatus('Ready'); else setStatus('Type commands (mic needs Chrome/Edge)');
  }
  function highlight(i) {
    $$('#steps li').forEach(li => li.classList.toggle('current', +li.dataset.i === i));
    const li = $(`#steps li[data-i="${i}"]`);
    if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    moveWalker(i);
  }
  const stepText = i => i < currentSteps.length
    ? `Step ${i + 1}. ${currentSteps[i].text}. ${currentSteps[i].sub}`
    : 'You have arrived at your destination.';

  function readAloud(withSummary) {
    if (!currentSteps.length) { toast('Find a route first.'); return; }
    reading = true; stepIdx = -1;
    const next = () => {
      if (!reading) return;
      if (stepIdx >= currentSteps.length) { reading = false; return; }
      highlight(stepIdx);
      say(stepText(stepIdx), () => { stepIdx++; next(); });
    };
    if (withSummary) {
      if (!say(lastSummary, () => { stepIdx = 0; next(); })) reading = false;
    } else { stepIdx = 0; next(); }
  }
  $('#speakBtn').addEventListener('click', () => readAloud(true));
  $('#nextBtn').addEventListener('click', () => {
    if (!currentSteps.length) { toast('Find a route first.'); return; }
    reading = false; speechId++;
    stepIdx = Math.min(currentSteps.length, stepIdx + 1);
    highlight(stepIdx);
    say(stepText(stepIdx));
  });
  $('#stopBtn').addEventListener('click', () => { stopSpeech(); toast('Voice stopped'); });
  $('#testVoice').addEventListener('click', () => {
    loadVoices();
    if (say('Hello! Voice directions are working. Turn left at reception.')) setStatus('Playing test…', 'ok');
  });

  /* ================================================================
     VOICE INPUT (speech recognition + typed commands)
     ================================================================ */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = $('#micBtn'), micLabel = $('#micLabel');
  let recog = null, listening = false;

  function findPlace(text, skip) {
    let best = null;
    Object.entries(NODES).forEach(([id, n]) => {
      if (id === skip) return;
      n.say.forEach(alias => {
        const i = text.indexOf(alias);
        if (i >= 0 && (!best || alias.length > best.len)) best = { id, len: alias.length, pos: i };
      });
    });
    return best;
  }
  function handleCommand(raw) {
    const text = ' ' + raw.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    let mode = null;
    if (/(step free|stepfree|no stairs|wheelchair|accessible|ramp)/.test(text)) mode = 'step';
    if (/(fastest|quickest|quick|shortest|fast)/.test(text)) mode = 'fast';
    let from = null, to = null;
    const m = text.match(/from (.+?) to (.+)/);
    if (m) { const a = findPlace(m[1]), b = findPlace(m[2]); if (a) from = a.id; if (b) to = b.id; }
    if (!to) {
      const after = text.match(/(?:to|towards|toward|reach|find|go to|take me to|navigate to|directions to|show me)\s+(.+)/);
      const found = findPlace(after ? after[1] : text, null);
      if (found) to = found.id;
    }
    if (!to) {
      setStatus("Didn't catch a place", 'live');
      const msg = 'Sorry, I did not find a place in "' + raw.trim() + '". Try: take me to the library.';
      toast(msg); say('Sorry, I did not understand the place. Please try again.');
      return false;
    }
    if (from) fromSel.value = from;
    toSel.value = to;
    if (mode) $(`input[name="mode"][value="${mode}"]`).checked = true;
    if (fromSel.value === toSel.value) fromSel.value = to === 'gate' ? 'reception' : 'gate';
    const ok = findRoute(true);
    $('#demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (ok) readAloud(true); else say(lastSummary);
    return true;
  }
  function stopListening() {
    listening = false;
    micBtn.classList.remove('listening');
    micLabel.textContent = '🎤 Speak your destination';
  }
  micBtn.addEventListener('click', () => {
    if (listening && recog) { recog.stop(); return; }
    if (!SR) {
      setStatus('Not supported here', 'live');
      toast('Voice commands need Chrome, Edge or Safari. You can type the command in the box instead.');
      return;
    }
    stopSpeech();
    recog = new SR();
    recog.lang = 'en-IN';
    recog.interimResults = true;
    recog.maxAlternatives = 3;
    recog.continuous = false;
    let finalText = '', handled = false;
    recog.onstart = () => {
      listening = true;
      micBtn.classList.add('listening');
      micLabel.textContent = '■ Listening… tap to stop';
      setStatus('🎙 Listening…', 'live');
    };
    recog.onresult = ev => {
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finalText += t; else interim += t;
      }
      $('#cmdInput').value = (finalText + interim).trim();
    };
    recog.onerror = ev => {
      handled = true;
      const msgs = {
        'not-allowed': 'Microphone is blocked. Click the lock icon beside the address bar, allow the microphone, and open the site over https or localhost.',
        'service-not-allowed': 'Speech service is blocked in this browser. Use the typed command instead.',
        'no-speech': 'I did not hear anything. Tap the mic and speak again.',
        'audio-capture': 'No microphone found. Please connect one.',
        'network': 'Speech recognition needs an internet connection.'
      };
      setStatus('Mic problem', 'live');
      toast(msgs[ev.error] || 'Voice command error: ' + ev.error);
    };
    recog.onend = () => {
      stopListening();
      if (!handled && finalText.trim()) { handled = true; setStatus('Heard: ' + finalText.trim().slice(0, 28), 'ok'); handleCommand(finalText); }
      else if (!handled) setStatus('Ready');
    };
    try { recog.start(); } catch (e) { stopListening(); toast('Could not start the microphone. Please try again.'); }
  });
  function runTyped() {
    const v = $('#cmdInput').value.trim();
    if (!v) { toast('Type or say a command first, e.g. take me to the library.'); return; }
    handleCommand(v);
  }
  $('#cmdBtn').addEventListener('click', runTyped);
  $('#cmdInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runTyped(); } });
  if (!SR) setStatus('Type commands (mic needs Chrome/Edge)');

  /* ================================================================
     VOICE RECORDER  (record, pause, stop, play, download, diagnostics,
     phone-recorder fallback)
     ================================================================ */
  const recStart = $('#recStart'), recPause = $('#recPause'), recStop = $('#recStop'), recDel = $('#recDel');
  const recPlayer = $('#recPlayer'), recMsg = $('#recMsg'), recTime = $('#recTime'), recorder = $('#recorder');
  const recDownload = $('#recDownload'), recFile = $('#recFile');
  const diagBox = $('#diagBox'), diagList = $('#diagList');
  const canvas = $('#wave'), cctx = canvas.getContext('2d');
  let mediaRec = null, stream = null, chunks = [], recURL = null, recMime = 'audio/webm';
  let audioCtx = null, analyser = null, raf = 0, timer = null, elapsed = 0, lastStart = 0, fakeLevel = false;

  const fmt = ms => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const nowMs = () => elapsed + (lastStart ? Date.now() - lastStart : 0);
  const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();

  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 300;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(64 * dpr);
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawIdle() {
    sizeCanvas();
    const w = canvas.clientWidth || 300;
    cctx.clearRect(0, 0, w, 64);
    cctx.fillStyle = 'rgba(15,157,143,.35)';
    for (let x = 4; x < w; x += 8) cctx.fillRect(x, 30, 4, 4);
  }
  function drawLive() {
    const w = canvas.clientWidth || 300;
    const bars = Math.floor(w / 8);
    let data = null;
    if (analyser) { data = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(data); }
    cctx.clearRect(0, 0, w, 64);
    const paused = mediaRec && mediaRec.state === 'paused';
    for (let i = 0; i < bars; i++) {
      let v;
      if (paused) v = 0.04;
      else if (data) v = data[Math.floor(i * data.length * 0.6 / bars)] / 255;
      else v = 0.15 + 0.35 * Math.abs(Math.sin(Date.now() / 220 + i / 3)); // animated bars if no analyser
      const h = Math.max(4, v * 58);
      cctx.fillStyle = i % 2 ? '#ef4444' : '#f0c56e';
      cctx.fillRect(i * 8 + 2, 32 - h / 2, 4, h);
    }
    raf = requestAnimationFrame(drawLive);
  }
  function cleanupAudio() {
    cancelAnimationFrame(raf); clearInterval(timer);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
    audioCtx = null; analyser = null; stream = null;
  }
  function setButtons(state) { // idle | recording | paused | done
    recStart.disabled = state === 'recording' || state === 'paused';
    recPause.disabled = !(state === 'recording' || state === 'paused');
    recPause.textContent = state === 'paused' ? '▶ Resume' : '⏸ Pause';
    recStop.disabled = !(state === 'recording' || state === 'paused');
    recDel.classList.toggle('hidden', state !== 'done');
    recorder.classList.toggle('recording', state === 'recording');
    recStart.textContent = state === 'done' ? '● Re-record' : '● Record';
  }
  function resetRecorder(keepUrl) {
    if (mediaRec && mediaRec.state !== 'inactive') { mediaRec.onstop = null; try { mediaRec.stop(); } catch (e) {} }
    cleanupAudio();
    if (recURL && !keepUrl) URL.revokeObjectURL(recURL);
    recURL = null; chunks = []; elapsed = 0; lastStart = 0; mediaRec = null;
    recPlayer.pause(); recPlayer.removeAttribute('src'); recPlayer.load();
    recPlayer.classList.add('hidden'); recDownload.classList.add('hidden');
    recDownload.removeAttribute('href');
    recTime.textContent = '0:00';
    setButtons('idle');
    recMsg.textContent = 'Tap Record and allow the microphone.';
    drawIdle();
  }
  function showRecording(url, mime, label) {
    recURL = url; recMime = mime || 'audio/webm';
    recPlayer.src = url;
    recPlayer.classList.remove('hidden');
    const ext = /mp4|m4a|aac/.test(recMime) ? 'm4a' : /ogg/.test(recMime) ? 'ogg' : /wav/.test(recMime) ? 'wav' : /mpeg|mp3/.test(recMime) ? 'mp3' : 'webm';
    recDownload.href = url; recDownload.download = 'voice-note.' + ext;
    recDownload.classList.remove('hidden');
    setButtons('done');
    recMsg.textContent = '✅ ' + label + ' Press play to check it, then send the report.';
  }

  /* ---- diagnostics ---- */
  async function runDiagnostics() {
    const rows = [];
    const add = (ok, text) => rows.push(`<li class="${ok === true ? 'ok' : ok === false ? 'bad' : 'warn'}">${ok === true ? '✅' : ok === false ? '❌' : '⚠️'} ${text}</li>`);
    add(window.isSecureContext !== false, 'Page type: ' + location.protocol.replace(':', '') + (window.isSecureContext === false ? ' — not secure. Use https:// (GitHub Pages / Netlify) or localhost.' : ' (OK)'));
    add(!inFrame ? true : null, inFrame ? 'This page is inside a preview/embedded window, which blocks the microphone. Click "Open in a new tab" below.' : 'Opened in its own tab (OK)');
    add(!!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia), 'Microphone access API: ' + ((navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? 'available' : 'missing in this browser'));
    add(!!window.MediaRecorder, 'Audio recorder (MediaRecorder): ' + (window.MediaRecorder ? 'available' : 'missing — use the "Record with phone" option'));
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const p = await navigator.permissions.query({ name: 'microphone' });
        add(p.state === 'granted' ? true : p.state === 'denied' ? false : null,
          'Microphone permission: ' + p.state + (p.state === 'denied' ? ' — click the lock icon beside the address bar and set Microphone to Allow.' : p.state === 'prompt' ? ' — the browser will ask when you press Record.' : ''));
      }
    } catch (e) { /* permission query not supported */ }
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const list = await navigator.mediaDevices.enumerateDevices();
        const n = list.filter(d => d.kind === 'audioinput').length;
        add(n > 0 ? true : false, 'Microphones found: ' + n);
      }
    } catch (e) { /* ignore */ }
    diagList.innerHTML = rows.join('');
    diagBox.open = true;
  }
  $('#diagBtn').addEventListener('click', runDiagnostics);
  const newTab = $('#newTab');
  newTab.href = location.href.split('#')[0] + '#report';
  if (inFrame) { recMsg.textContent = '⚠️ This page is inside a preview. If Record does not work, open it in a new tab (see the check below).'; }

  /* ---- recording ---- */
  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      recMsg.textContent = 'This browser cannot record audio here. Use "Record with phone" below, or open the site in Chrome, Edge, Firefox or Safari 14.1+.';
      toast('Recording is not supported in this browser.');
      runDiagnostics();
      return;
    }
    resetRecorder(false);
    recMsg.textContent = 'Waiting for microphone permission… press Allow in the browser prompt.';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const m = {
        NotAllowedError: inFrame
          ? 'The microphone is blocked because this page is inside a preview. Open it in a new tab and try again.'
          : 'Microphone blocked. Click the lock icon beside the address bar, set Microphone to Allow, then press Record again.',
        PermissionDeniedError: 'Microphone blocked. Allow it in the browser address bar and try again.',
        NotFoundError: 'No microphone found. Connect one (or enable it in system settings) and try again.',
        NotReadableError: 'The microphone is being used by another app. Close that app and try again.',
        SecurityError: 'Recording needs a secure page. Open the site using https:// or localhost.',
        OverconstrainedError: 'The selected microphone is not available.'
      };
      recMsg.textContent = '❌ ' + (m[err.name] || 'Could not access the microphone (' + err.name + ').');
      toast('Microphone problem — details are under the recorder.');
      runDiagnostics();
      return;
    }
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg']
      .find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    try { mediaRec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); }
    catch (e1) {
      try { mediaRec = new MediaRecorder(stream); }
      catch (e2) { recMsg.textContent = '❌ Could not start the recorder in this browser. Use "Record with phone" below.'; cleanupAudio(); runDiagnostics(); return; }
    }
    chunks = [];
    mediaRec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRec.onerror = e => { recMsg.textContent = '❌ Recording error: ' + ((e.error && e.error.name) || 'unknown'); };
    mediaRec.onstop = () => {
      const type = mediaRec.mimeType || mime || 'audio/webm';
      cleanupAudio();
      lastStart = 0;
      const blob = new Blob(chunks, { type });
      if (!blob.size) { setButtons('idle'); recMsg.textContent = '❌ Nothing was recorded. Check that the right microphone is selected, then try again.'; drawIdle(); return; }
      recTime.textContent = fmt(elapsed);
      showRecording(URL.createObjectURL(blob), type, 'Voice note saved (' + fmt(elapsed) + ').');
      drawIdle();
    };
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
    } catch (e) { analyser = null; }
    sizeCanvas(); drawLive();
    try { mediaRec.start(250); }
    catch (e) { recMsg.textContent = '❌ Could not start recording.'; cleanupAudio(); drawIdle(); return; }
    elapsed = 0; lastStart = Date.now();
    timer = setInterval(() => {
      recTime.textContent = fmt(nowMs());
      if (nowMs() >= 120000) stopRecording(); // 2 minute limit
    }, 200);
    setButtons('recording');
    recMsg.textContent = '🔴 Recording… speak clearly (max 2 minutes).';
  }
  function pauseResume() {
    if (!mediaRec) return;
    if (mediaRec.state === 'recording') {
      mediaRec.pause(); elapsed = nowMs(); lastStart = 0;
      setButtons('paused'); recorder.classList.remove('recording'); recMsg.textContent = '⏸ Paused. Press Resume to continue.';
    } else if (mediaRec.state === 'paused') {
      mediaRec.resume(); lastStart = Date.now();
      setButtons('recording'); recMsg.textContent = '🔴 Recording…';
    }
  }
  function stopRecording() {
    if (!mediaRec || mediaRec.state === 'inactive') return;
    elapsed = nowMs(); lastStart = 0;
    clearInterval(timer);
    mediaRec.stop();
  }
  recStart.addEventListener('click', startRecording);
  recPause.addEventListener('click', pauseResume);
  recStop.addEventListener('click', stopRecording);
  recDel.addEventListener('click', () => { resetRecorder(false); toast('Voice note deleted'); });

  // Fallback: use the phone's own voice recorder / pick an audio file
  recFile.addEventListener('change', () => {
    const f = recFile.files && recFile.files[0];
    if (!f) return;
    if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|wav|ogg|webm|aac|amr)$/i.test(f.name)) { toast('Please choose an audio file.'); recFile.value = ''; return; }
    resetRecorder(false);
    showRecording(URL.createObjectURL(f), f.type || 'audio/mpeg', 'Audio file added (' + f.name.slice(0, 24) + ').');
    recFile.value = '';
  });
  window.addEventListener('resize', () => { if (!analyser && (!mediaRec || mediaRec.state === 'inactive')) drawIdle(); });
  window.addEventListener('pagehide', cleanupAudio);
  drawIdle();

  /* ---------- Lift board & reports ---------- */
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function renderLifts() {
    $('#liftBoard').innerHTML = Object.entries(LIFTS).map(([id, name]) => {
      const broken = isBroken(id), p = pendingCount(id);
      const badge = broken ? '<span class="badge bad">⛔ Out of service</span>'
        : p ? `<span class="badge pending">⏳ ${p} report${p > 1 ? 's' : ''} pending</span>`
        : '<span class="badge ok">✅ Working</span>';
      return `<div class="lift"><b>🛗 ${name}</b>${badge}</div>`;
    }).join('');
    const list = $('#reportList');
    if (!reports.length) { list.innerHTML = '<li class="empty">No reports yet. Submit one using the form.</li>'; return; }
    list.innerHTML = reports.slice().reverse().map(r => {
      const when = new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let acts = '';
      if (r.status === 'pending') acts = `<button class="btn" data-act="verify" data-id="${r.id}">✔ Verify (staff)</button>`;
      else if (r.status === 'verified') acts = `<button class="btn btn-ghost" data-act="fix" data-id="${r.id}">🔧 Mark fixed</button>`;
      const st = r.status === 'verified' ? '<span class="badge bad">Verified</span>' : r.status === 'resolved' ? '<span class="badge ok">Fixed</span>' : '<span class="badge pending">Pending</span>';
      let voice = '';
      if (audioMap[r.id]) voice = `<audio controls preload="none" src="${audioMap[r.id]}"></audio>`;
      else if (r.voice) voice = '<small class="empty">🎙 Voice note was recorded on an earlier visit</small>';
      return `<li><div class="row"><span><b>${liftShort(r.lift)}</b> · ${esc(r.note)} <small>(${when})</small></span><span class="acts">${st}${acts}</span></div>${voice}</li>`;
    }).join('');
  }
  function refreshAll() {
    persist(); renderLifts(); drawMap();
    if (!$('#result').classList.contains('hidden')) findRoute(true);
  }
  $('#reportForm').addEventListener('submit', ev => {
    ev.preventDefault();
    if (mediaRec && mediaRec.state !== 'inactive') { toast('Stop the recording first, then send.'); return; }
    const lift = liftSel.value;
    let note = $('#note').value.trim();
    if (!note && recURL) note = 'Voice note only';
    if (!note) { $('#note').classList.add('err'); toast('Please describe the problem or record a voice note.'); return; }
    $('#note').classList.remove('err');
    const id = Date.now();
    reports.push({ id, lift, note, time: id, status: 'pending', voice: !!recURL });
    if (recURL) { audioMap[id] = recURL; resetRecorder(true); recStart.textContent = '● Record'; }
    $('#note').value = '';
    if (pendingCount(lift) >= 2) {
      reports.forEach(r => { if (r.lift === lift && r.status === 'pending') r.status = 'verified'; });
      toast('2 students reported this lift — verified! Routes updated.');
    } else toast('Report sent. Waiting for verification.');
    refreshAll();
  });
  $('#reportList').addEventListener('click', ev => {
    const b = ev.target.closest('button[data-act]'); if (!b) return;
    const r = reports.find(x => x.id === +b.dataset.id); if (!r) return;
    if (b.dataset.act === 'verify') {
      reports.forEach(x => { if (x.lift === r.lift && x.status === 'pending') x.status = 'verified'; });
      toast('Issue verified. Routes now avoid ' + LIFTS[r.lift] + '.');
    } else {
      reports.forEach(x => { if (x.lift === r.lift) x.status = 'resolved'; });
      toast(LIFTS[r.lift] + ' marked as fixed.');
    }
    refreshAll();
  });
  $('#resetBtn').addEventListener('click', () => { reports = []; Object.keys(audioMap).forEach(k => { URL.revokeObjectURL(audioMap[k]); delete audioMap[k]; }); refreshAll(); toast('Demo data reset.'); });

  /* ---------- FAQ ---------- */
  $$('.faq-item').forEach(item => {
    const q = $('.faq-q', item), a = $('.faq-a', item);
    q.addEventListener('click', () => {
      const open = item.classList.contains('open');
      $$('.faq-item').forEach(o => { o.classList.remove('open'); $('.faq-a', o).style.maxHeight = 0; $('.faq-q', o).setAttribute('aria-expanded', false); });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; q.setAttribute('aria-expanded', true); }
    });
  });

  /* ---------- Contact form (front-end only) ---------- */
  $('#contactForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const n = $('#cName'), m = $('#cMail'), g = $('#cMsg');
    let ok = true;
    [n, m, g].forEach(el => el.classList.remove('err'));
    if (!n.value.trim()) { n.classList.add('err'); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(m.value)) { m.classList.add('err'); ok = false; }
    if (!g.value.trim()) { g.classList.add('err'); ok = false; }
    if (!ok) { toast('Please fill in all fields with a valid email.'); return; }
    toast(`Thank you, ${n.value.trim()}! We received your message.`);
    ev.target.reset();
  });

  /* ---------- Init ---------- */
  drawMap();
  renderLifts();
  findRoute(true);
})();
