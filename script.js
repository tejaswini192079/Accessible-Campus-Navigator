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
  function fallbackSvg(c) {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${c.c1}'/><stop offset='1' stop-color='${c.c2}'/></linearGradient></defs><rect width='400' height='300' fill='url(#g)'/><circle cx='330' cy='60' r='90' fill='#fff' opacity='.08'/><circle cx='60' cy='260' r='110' fill='#fff' opacity='.07'/><text x='200' y='175' font-size='96' text-anchor='middle'>${c.emoji}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  $$('img[data-img]').forEach(el => {
    const key = el.dataset.img, c = IMG[key];
    if (!c) return;
    const srcs = ['images/' + key + '.jpg', PX(c.id), fallbackSvg(c)];
    let i = 0;
    el.loading = 'lazy';
    el.onerror = () => { i++; if (i < srcs.length) el.src = srcs[i]; };
    el.src = srcs[0];
  });

  /* ---------- Theme ---------- */
  const themeBtn = $('#themeBtn');
  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    themeBtn.textContent = mode === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('acn2-theme', mode); } catch (e) {}
  }
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('acn2-theme'); } catch (e) {}
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
  const KEY = 'acn2-reports';
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
     VOICE RECORDER (MediaRecorder + live waveform)
     ================================================================ */
  const recStart = $('#recStart'), recStop = $('#recStop'), recDel = $('#recDel');
  const recPlayer = $('#recPlayer'), recMsg = $('#recMsg'), recTime = $('#recTime'), recorder = $('#recorder');
  const canvas = $('#wave'), cctx = canvas.getContext('2d');
  let mediaRec = null, stream = null, chunks = [], recURL = null, recBlob = null;
  let audioCtx = null, analyser = null, raf = 0, t0 = 0, timer = null;

  function fmt(ms) { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth || 300;
    canvas.width = w * dpr; canvas.height = 64 * dpr;
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
    if (!analyser) return;
    const w = canvas.clientWidth || 300, data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    cctx.clearRect(0, 0, w, 64);
    const bars = Math.floor(w / 8);
    for (let i = 0; i < bars; i++) {
      const v = data[Math.floor(i * data.length * 0.6 / bars)] / 255;
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
  function resetRecorder(keepUrl) {
    if (mediaRec && mediaRec.state === 'recording') { mediaRec.onstop = null; try { mediaRec.stop(); } catch (e) {} }
    cleanupAudio();
    if (recURL && !keepUrl) URL.revokeObjectURL(recURL);
    recURL = null; recBlob = null; chunks = [];
    recPlayer.pause(); recPlayer.removeAttribute('src'); recPlayer.load();
    recPlayer.classList.add('hidden'); recDel.classList.add('hidden');
    recStart.disabled = false; recStop.disabled = true;
    recorder.classList.remove('recording');
    recTime.textContent = '0:00';
    recMsg.textContent = 'Tap Record and allow the microphone.';
    drawIdle();
  }
  async function startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
      recMsg.textContent = 'Recording is not supported in this browser. Try Chrome, Edge, Firefox or Safari 14.1+.';
      toast('Voice recording is not supported in this browser.');
      return;
    }
    resetRecorder(false);
    recMsg.textContent = 'Waiting for microphone permission…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (err) {
      const m = {
        NotAllowedError: 'Microphone blocked. Click the lock icon beside the address bar, allow the microphone, then try again. (The site must be on https or localhost.)',
        NotFoundError: 'No microphone found. Please connect one and try again.',
        NotReadableError: 'The microphone is being used by another app. Close it and try again.',
        SecurityError: 'Recording needs a secure page. Open the site using https or localhost.'
      };
      recMsg.textContent = m[err.name] || 'Could not access the microphone (' + err.name + ').';
      toast('Microphone problem — see the message under the recorder.');
      return;
    }
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/ogg']
      .find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
    try { mediaRec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); }
    catch (e) { recMsg.textContent = 'Could not start the recorder in this browser.'; cleanupAudio(); return; }
    chunks = [];
    mediaRec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRec.onstop = () => {
      cleanupAudio();
      recBlob = new Blob(chunks, { type: mediaRec.mimeType || 'audio/webm' });
      recURL = URL.createObjectURL(recBlob);
      recPlayer.src = recURL;
      recPlayer.classList.remove('hidden'); recDel.classList.remove('hidden');
      recStart.disabled = false; recStart.textContent = '● Re-record'; recStop.disabled = true;
      recorder.classList.remove('recording');
      recMsg.textContent = '✅ Voice note saved (' + recTime.textContent + '). Press play to check it, then send the report.';
      drawIdle();
    };
    // live waveform
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      analyser = audioCtx.createAnalyser(); analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      sizeCanvas(); drawLive();
    } catch (e) { /* waveform is optional */ }
    mediaRec.start(250);
    t0 = Date.now();
    timer = setInterval(() => {
      const el = Date.now() - t0;
      recTime.textContent = fmt(el);
      if (el >= 60000) stopRecording(); // 60 s limit
    }, 200);
    recorder.classList.add('recording');
    recStart.disabled = true; recStop.disabled = false;
    recMsg.textContent = '🔴 Recording… speak clearly (max 60 s).';
  }
  function stopRecording() {
    if (mediaRec && mediaRec.state === 'recording') mediaRec.stop();
    clearInterval(timer);
  }
  recStart.addEventListener('click', startRecording);
  recStop.addEventListener('click', stopRecording);
  recDel.addEventListener('click', () => { resetRecorder(false); recStart.textContent = '● Record'; toast('Voice note deleted'); });
  window.addEventListener('resize', () => { if (!analyser) drawIdle(); });
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
    if (mediaRec && mediaRec.state === 'recording') { toast('Stop the recording first, then send.'); return; }
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
