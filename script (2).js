/* ========== Accessible Campus Navigator – script.js ========== */
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
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------- Theme ---------- */
  const themeBtn = $('#themeBtn');
  function setTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    themeBtn.textContent = mode === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('acn-theme', mode); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem('acn-theme'); } catch (e) {}
  setTheme(saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () =>
    setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  /* ---------- Mobile menu ---------- */
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
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    progress.style.width = pct + '%';
    toTop.classList.toggle('show', h.scrollTop > 500);
    let cur = '';
    sections.forEach(s => { if (s.getBoundingClientRect().top <= 120) cur = s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Reveal on scroll + counters ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  $$('[data-count]').forEach(el => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    let n = 0;
    const step = Math.max(1, Math.ceil(target / 50));
    const timer = setInterval(() => {
      n = Math.min(target, n + step);
      el.textContent = n + suffix;
      if (n >= target) clearInterval(timer);
    }, 30);
  });

  /* ---------- Campus graph ---------- */
  const NODES = {
    gate:      { name: 'Main Gate',        x: 90,  y: 420, icon: '🚪', hint: 'the large entrance gate next to the security cabin' },
    reception: { name: 'Reception',        x: 210, y: 320, icon: '🛎️', hint: 'the glass entrance with the help desk' },
    admin:     { name: 'Admin Block',      x: 210, y: 150, icon: '🏢', hint: 'the tall building with the red flag' },
    library:   { name: 'Library',          x: 440, y: 105, icon: '📚', hint: 'the building with the large reading lawn' },
    cafe:      { name: 'Cafeteria',        x: 430, y: 330, icon: '☕', hint: 'the open courtyard with benches and food smell' },
    science:   { name: 'Science Block',    x: 650, y: 210, icon: '🔬', hint: 'the blue building with the lab windows' },
    classroom: { name: 'Classroom Block A', x: 710, y: 80,  icon: '🎓', hint: 'the upper-floor classroom wing' },
    audi:      { name: 'Auditorium',       x: 690, y: 410, icon: '🎭', hint: 'the round building with wide double doors' }
  };
  // t: path | ramp | stairs | lift
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
  EDGES.forEach((e, i) => e.id = i);
  const LIFTS = { L1: 'Admin Block Lift (L1)', L2: 'Science Block Lift (L2)' };

  /* ---------- State (lift reports) ---------- */
  const KEY = 'acn-reports-v1';
  let reports = [];
  try { reports = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { reports = []; }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(reports)); } catch (e) {} }
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
  let routeLayer, walker;

  function offsetFor(e) {
    // spread parallel edges between the same two nodes
    const same = EDGES.filter(x => (x.a === e.a && x.b === e.b));
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
    // decorative lawns
    mk('ellipse', { cx: 330, cy: 220, rx: 90, ry: 55, fill: '#86efac', opacity: .35 }, svg);
    mk('ellipse', { cx: 560, cy: 330, rx: 70, ry: 40, fill: '#7dd3fc', opacity: .35 }, svg);
    const eg = mk('g', {}, svg);
    EDGES.forEach(e => {
      const p = edgePoints(e, false);
      const blocked = e.lift && isBroken(e.lift);
      const line = mk('line', { ...p, 'stroke-width': 6, 'stroke-linecap': 'round', class: 'edge-' + e.t + (blocked ? ' edge-blocked' : '') }, eg);
      line.setAttribute('data-id', e.id);
      if (e.t === 'lift') {
        const mx = (p.x1 + p.x2) / 2, my = (p.y1 + p.y2) / 2;
        const t = mk('text', { x: mx, y: my + 6, 'text-anchor': 'middle', 'font-size': 20 }, eg);
        t.textContent = blocked ? '⛔' : '🛗';
      }
    });
    routeLayer = mk('g', {}, svg);
    const ng = mk('g', {}, svg);
    Object.entries(NODES).forEach(([id, n]) => {
      const g = mk('g', { class: 'node', tabindex: 0, role: 'button', 'aria-label': n.name }, ng);
      mk('circle', { cx: n.x, cy: n.y, r: 24, fill: '#fff', stroke: '#6366f1', 'stroke-width': 4 }, g);
      const ic = mk('text', { x: n.x, y: n.y + 8, 'text-anchor': 'middle', 'font-size': 22 }, g);
      ic.textContent = n.icon;
      const lbl = mk('text', { x: n.x, y: n.y + 46, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: '#1e293b', stroke: '#fff', 'stroke-width': 4, 'paint-order': 'stroke' }, g);
      lbl.textContent = n.name;
      const pick = () => {
        const f = $('#from'), t = $('#to');
        if (!clickedFirst) { f.value = id; clickedFirst = true; toast('Start: ' + n.name + ' — now click a destination'); }
        else { t.value = id; clickedFirst = false; findRoute(); }
      };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
    });
  }
  let clickedFirst = false;

  /* ---------- Populate selects ---------- */
  const fromSel = $('#from'), toSel = $('#to'), liftSel = $('#liftSel');
  Object.entries(NODES).forEach(([id, n]) => {
    fromSel.add(new Option(n.icon + ' ' + n.name, id));
    toSel.add(new Option(n.icon + ' ' + n.name, id));
  });
  Object.entries(LIFTS).forEach(([id, n]) => liftSel.add(new Option(n, id)));
  fromSel.value = 'gate'; toSel.value = 'classroom';

  $('#swapBtn').addEventListener('click', () => {
    const t = fromSel.value; fromSel.value = toSel.value; toSel.value = t;
    if ($('#result').classList.contains('hidden') === false) findRoute();
  });

  /* ---------- Routing (Dijkstra) ---------- */
  function shortest(from, to, mode) {
    const allowed = e => !(e.lift && isBroken(e.lift)) && !(mode === 'step' && e.t === 'stairs');
    const dist = {}, prev = {}, done = new Set();
    Object.keys(NODES).forEach(k => dist[k] = Infinity);
    dist[from] = 0;
    while (true) {
      let u = null;
      Object.keys(dist).forEach(k => { if (!done.has(k) && (u === null || dist[k] < dist[u])) u = k; });
      if (u === null || dist[u] === Infinity) break;
      if (u === to) break;
      done.add(u);
      EDGES.filter(allowed).forEach(e => {
        let v = null;
        if (e.a === u) v = e.b; else if (e.b === u) v = e.a;
        if (v && dist[u] + e.d < dist[v]) { dist[v] = dist[u] + e.d; prev[v] = { u, e }; }
      });
    }
    if (dist[to] === Infinity) return null;
    const path = [];
    let c = to;
    while (c !== from) { const p = prev[c]; path.unshift({ from: p.u, to: c, edge: p.e }); c = p.u; }
    return { total: dist[to], legs: path };
  }

  function instruction(leg) {
    const A = NODES[leg.from], B = NODES[leg.to], e = leg.edge;
    const verb = {
      path: `Walk along the flat paved path from ${A.name} to ${B.name}`,
      ramp: `Follow the gentle ramp from ${A.name} towards ${B.name}`,
      stairs: `Take the stairs from ${A.name} to ${B.name}`,
      lift: `Use the ${LIFTS[e.lift].replace(/ \(.*\)/, '')} between ${A.name} and ${B.name}`
    }[e.t];
    return { text: verb, sub: `Look for ${B.hint}. (${e.d} m)` };
  }

  /* ---------- Find route UI ---------- */
  let currentSteps = [], stepIdx = -1;
  function findRoute() {
    stopSpeech();
    const from = fromSel.value, to = toSel.value;
    const mode = $('input[name="mode"]:checked').value;
    const alerts = $('#alerts'), result = $('#result');
    alerts.innerHTML = ''; routeLayer.innerHTML = '';
    if (from === to) { result.classList.add('hidden'); addAlert('warn', 'You are already at ' + NODES[to].name + '!'); return; }

    const r = shortest(from, to, mode);
    // check whether a broken lift changed the answer
    const brokenIds = Object.keys(LIFTS).filter(isBroken);
    if (!r) {
      result.classList.add('hidden');
      addAlert('bad', 'No accessible route is available right now. Please contact campus security for help.');
      return;
    }
    brokenIds.forEach(id => addAlert('warn', `⚠️ ${LIFTS[id]} is out of service — route avoids it.`));
    if (mode === 'step') addAlert('ok', '♿ Step-free route: no stairs on this path.');

    currentSteps = r.legs.map(instruction);
    stepIdx = -1;
    const mins = Math.max(1, Math.round(r.total / (mode === 'step' ? 60 : 75)));
    const types = [...new Set(r.legs.map(l => l.edge.t))];
    $('#summary').innerHTML =
      `<span class="chip">📏 ${r.total} m</span><span class="chip">⏱ ~${mins} min</span><span class="chip">${mode === 'step' ? '♿ Step-free' : '⚡ Fastest'}</span>` +
      (types.includes('stairs') ? '<span class="chip">🪜 Has stairs</span>' : '');
    $('#steps').innerHTML = currentSteps.map((s, i) =>
      `<li data-i="${i}">${s.text}<small>${s.sub}</small></li>`).join('') +
      `<li data-i="${currentSteps.length}">🏁 You have arrived at ${NODES[to].name}<small>Say "Find Route" again to plan a new trip.</small></li>`;
    result.classList.remove('hidden');
    drawRoute(r);
    toast(`Route found: ${r.total} m, about ${mins} min`);
  }
  function addAlert(type, msg) {
    const d = document.createElement('div');
    d.className = 'alert ' + type; d.textContent = msg;
    $('#alerts').appendChild(d);
  }

  let routePts = [];
  function drawRoute(r) {
    const pts = [];
    r.legs.forEach((l, i) => {
      const rev = l.edge.a !== l.from;
      const p = edgePoints(l.edge, rev);
      if (i === 0) pts.push([p.x1, p.y1]);
      pts.push([p.x2, p.y2]);
    });
    routePts = pts;
    const path = mk('polyline', { points: pts.map(p => p.join(',')).join(' '), class: 'route' }, routeLayer);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect();
    path.style.transition = 'stroke-dashoffset 1.4s ease';
    path.style.strokeDashoffset = 0;
    walker = mk('text', { x: pts[0][0], y: pts[0][1] - 30, 'text-anchor': 'middle', 'font-size': 30, class: 'walker' }, routeLayer);
    walker.textContent = $('input[name="mode"]:checked').value === 'step' ? '♿' : '🚶';
    walker.style.transition = 'transform .8s ease';
  }
  function moveWalker(i) {
    if (!walker || !routePts[i]) return;
    const [x, y] = routePts[i], [x0, y0] = routePts[0];
    walker.style.transform = `translate(${x - x0}px, ${y - y0}px)`;
  }

  $('#goBtn').addEventListener('click', findRoute);
  $$('input[name="mode"]').forEach(r => r.addEventListener('change', findRoute));
  fromSel.addEventListener('change', () => { clickedFirst = false; });

  /* ---------- Voice ---------- */
  const synth = window.speechSynthesis;
  function speak(text, onend) {
    if (!synth) { toast('Voice is not supported in this browser.'); return false; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-IN'; u.rate = 0.95;
    if (onend) u.onend = onend;
    synth.speak(u);
    return true;
  }
  function stopSpeech() { if (synth) synth.cancel(); speaking = false; }
  let speaking = false;
  function highlight(i) {
    $$('#steps li').forEach(li => li.classList.toggle('current', +li.dataset.i === i));
    const li = $(`#steps li[data-i="${i}"]`);
    if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    moveWalker(i);
  }
  function textOf(i) {
    if (i < currentSteps.length) return `Step ${i + 1}. ${currentSteps[i].text}. ${currentSteps[i].sub.replace(/\(.*\)/, '')}`;
    return 'You have arrived at your destination.';
  }
  $('#speakBtn').addEventListener('click', () => {
    if (!currentSteps.length) return;
    speaking = true; stepIdx = 0;
    const run = () => {
      if (!speaking) return;
      highlight(stepIdx);
      if (!speak(textOf(stepIdx), () => { if (!speaking) return; if (stepIdx < currentSteps.length) { stepIdx++; run(); } else speaking = false; })) speaking = false;
    };
    run();
  });
  $('#nextBtn').addEventListener('click', () => {
    if (!currentSteps.length) return;
    speaking = false;
    stepIdx = Math.min(currentSteps.length, stepIdx + 1);
    highlight(stepIdx);
    speak(textOf(stepIdx));
  });
  $('#stopBtn').addEventListener('click', () => { stopSpeech(); toast('Voice stopped'); });

  /* ---------- Lift board & reports ---------- */
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
      return `<li><span><b>${LIFTS[r.lift].replace(/ \(.*\)/, '')}</b> · ${esc(r.note)} <small>(${when})</small></span><span class="acts">${st}${acts}</span></li>`;
    }).join('');
  }
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function refreshAll() {
    persist(); renderLifts(); drawMap();
    if (!$('#result').classList.contains('hidden')) findRoute();
  }

  $('#reportForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const lift = liftSel.value, note = $('#note').value.trim();
    if (!note) { $('#note').classList.add('err'); toast('Please describe the problem first.'); return; }
    $('#note').classList.remove('err');
    reports.push({ id: Date.now(), lift, note, time: Date.now(), status: 'pending' });
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
  $('#resetBtn').addEventListener('click', () => { reports = []; refreshAll(); toast('Demo data reset.'); });

  /* ---------- Feature tabs ---------- */
  const TABS = [
    { icon: '🛤️', c: 'c5', t: 'Two Route Options', p: 'Students can select the fastest route or a step-free route.', l: ['Fastest: shortest walking time', 'Step-free: avoids every staircase', 'Switch instantly with one tap'], demo: true },
    { icon: '🔊', c: 'c7', t: 'Voice Navigation', p: 'The app speaks directions so visually impaired students can follow them.', l: ['Hands-free step-by-step audio', 'Repeat or skip steps easily', 'Works with screen readers'], demo: true },
    { icon: '🏛️', c: 'c8', t: 'Landmark Directions', p: 'The app gives directions using familiar places like the main gate, reception and lift.', l: ['"Look for the glass entrance and help desk"', 'Easy to understand without seeing a map', 'Great for first-year students'], demo: true },
    { icon: '📢', c: 'c4', t: 'Report Broken Lift', p: 'Students can inform others when a lift is not working.', l: ['Report in a few seconds', 'Other students see the warning', 'Staff can verify and mark fixed'], report: true },
    { icon: '🔄', c: 'c9', t: 'Route Update', p: 'If a lift is broken, the app finds another accessible route after the issue is verified.', l: ['Automatic re-routing', 'Always a safe alternative', 'Back to normal when the lift is fixed'], report: true }
  ];
  function showTab(i) {
    const t = TABS[i];
    $$('.tab').forEach((b, k) => { b.classList.toggle('active', k === i); b.setAttribute('aria-selected', k === i); });
    const body = $('#tabBody');
    body.style.animation = 'none'; body.offsetHeight; body.style.animation = '';
    body.innerHTML = `<div class="big ${t.c}">${t.icon}</div><div><h3>${t.t}</h3><p>${t.p}</p><ul>${t.l.map(x => `<li>${x}</li>`).join('')}</ul>
      <p style="margin-top:16px"><a class="btn btn-sm" href="${t.report ? '#report' : '#demo'}">${t.report ? 'Open lift status →' : 'Try it in the demo →'}</a></p></div>`;
  }
  $$('.tab').forEach(b => b.addEventListener('click', () => showTab(+b.dataset.tab)));
  showTab(0);

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
  findRoute();
})();
