'use strict';
/* =====================================================================
   PathAble – Accessible Campus Navigator
   1) CORE   : campus graph, obstacle-aware routing (Dijkstra), voice-command parser
   2) UI     : map, planner, facility simulation, voice (speech + mic), a11y, demo
   ===================================================================== */

// ==CORE_START==
const NODES = {
  entrance:   { label: 'Main Entrance',      x: 70,  y: 330, icon: '🚪', pick: true, level: 'Ground floor' },
  ramp:       { label: 'Ramp Junction',      x: 190, y: 330, icon: '♿', pick: true, level: 'Ground floor' },
  groundHall: { label: 'Ground Hall',        x: 320, y: 330, icon: '📍', pick: true, level: 'Ground floor' },
  liftLobby:  { label: 'Lift Lobby',         x: 450, y: 330, icon: '🛗', pick: true, level: 'Ground floor' },
  firstFloor: { label: 'First Floor',        x: 610, y: 330, icon: '1F', pick: true, level: 'First floor' },
  secondHall: { label: 'Second Floor Hall',  x: 610, y: 135, icon: '2F', pick: true, level: 'Second floor' },
  room204:    { label: 'Room 204',           x: 790, y: 135, icon: '🚩', pick: true, level: 'Second floor' },
  library:    { label: 'Library',            x: 790, y: 450, icon: '📚', pick: true, level: 'Ground floor' },
  office:     { label: 'Office',             x: 110, y: 450, icon: '🏢', pick: true, level: 'Ground floor' },
  // junctions (not selectable)
  lift2F:     { label: 'Lift Lobby (2nd floor)', x: 450, y: 135, pick: false },
  libLift:    { label: 'Library Lift 02',    x: 790, y: 330, pick: false, icon: '🛗' },
  libLift2F:  { label: 'Skybridge landing',  x: 790, y: 200, pick: false },
  yard1:      { label: 'Courtyard path',     x: 320, y: 440, pick: false },
  yard2:      { label: 'Courtyard ramp',     x: 450, y: 440, pick: false }
};

const FACILITIES = {
  lift1:     { name: 'Lift 01',          okText: 'Lift is operational in this demonstration.',            downText: 'Lift 01 is out of service. Routes now avoid it.',               okLabel: 'Operational', downLabel: 'Out of service', okBtn: 'Simulate breakdown', downBtn: 'Restore lift' },
  corridorA: { name: 'Corridor A',       okText: 'Main corridor is open in this demonstration.',          downText: 'Corridor A is blocked. Routes use the courtyard path.',         okLabel: 'Open',        downLabel: 'Blocked',        okBtn: 'Block corridor',     downBtn: 'Reopen corridor' },
  lift2:     { name: 'Library Lift 02',  okText: 'Backup lift and skybridge are operational.',            downText: 'Library Lift 02 is out of service. Skybridge is unreachable.',  okLabel: 'Operational', downLabel: 'Out of service', okBtn: 'Simulate breakdown', downBtn: 'Restore lift' }
};

const TAGNAMES = { lift1: 'Lift 01', lift2: 'Library Lift 02', bridge: 'the step-free skybridge', yard: 'the outdoor courtyard path', stairs: 'the staircase' };

// type: path | ramp | corridor | lift | stairs | bridge   (stairs are the only inaccessible type)
const EDGES = [
  { id: 1,  a: 'entrance',   b: 'ramp',       type: 'ramp',     fw: 'Enter through the main entrance and follow the step-free ramp to the Ramp Junction.', bw: 'Head back down the ramp towards the Main Entrance.' },
  { id: 2,  a: 'ramp',       b: 'groundHall', type: 'corridor', fw: 'Continue through the ground floor corridor to Ground Hall.', bw: 'Walk back along the corridor to the Ramp Junction.' },
  { id: 3,  a: 'groundHall', b: 'liftLobby',  type: 'corridor', fac: 'corridorA', fw: 'Continue through Corridor A towards the lift lobby.', bw: 'Go back through Corridor A to Ground Hall.' },
  { id: 4,  a: 'liftLobby',  b: 'firstFloor', type: 'corridor', fw: 'Keep going straight along the corridor to the First Floor area.', bw: 'Turn back along the corridor to the Lift Lobby.' },
  { id: 5,  a: 'firstFloor', b: 'libLift',    type: 'corridor', fw: 'Continue to the east end of the corridor, where Library Lift 02 is located.', bw: 'Head west along the corridor to the First Floor area.' },
  { id: 6,  a: 'libLift',    b: 'library',    type: 'path',     fw: 'Follow the paved path to the Library entrance.', bw: 'Leave the library and follow the path back to Library Lift 02.' },
  { id: 7,  a: 'liftLobby',  b: 'lift2F',     type: 'lift', fac: 'lift1', tag: 'lift1', m: 8, fw: 'Take Lift 01 up to the second floor.', bw: 'Take Lift 01 down to the ground floor.' },
  { id: 8,  a: 'lift2F',     b: 'secondHall', type: 'corridor', fw: 'Exit the lift and follow the corridor to Second Floor Hall.', bw: 'Return along the corridor to the lift lobby.' },
  { id: 9,  a: 'secondHall', b: 'room204',    type: 'corridor', fw: 'Continue along the classroom wing corridor to Room 204.', bw: 'Walk back along the corridor to Second Floor Hall.' },
  { id: 10, a: 'firstFloor', b: 'secondHall', type: 'stairs', tag: 'stairs', m: 22, fw: 'Climb the staircase up to the second floor.', bw: 'Go down the staircase to the first floor.' },
  { id: 11, a: 'libLift',    b: 'libLift2F',  type: 'lift', fac: 'lift2', tag: 'lift2', m: 8, fw: 'Take Library Lift 02 up to the skybridge level.', bw: 'Take Library Lift 02 down to the ground level.' },
  { id: 12, a: 'libLift2F',  b: 'room204',    type: 'bridge', tag: 'bridge', fw: 'Cross the step-free skybridge straight to Room 204.', bw: 'Cross the skybridge back to Library Lift 02.' },
  { id: 13, a: 'libLift2F',  b: 'secondHall', type: 'bridge', tag: 'bridge', fw: 'Follow the skybridge corridor to Second Floor Hall.', bw: 'Follow the skybridge corridor back to Library Lift 02.' },
  { id: 14, a: 'ramp',       b: 'office',     type: 'ramp',     fw: 'Take the gentle ramp path down to the Office.', bw: 'Take the ramp path back up to the Ramp Junction.' },
  { id: 15, a: 'ramp',       b: 'yard1',      type: 'path', tag: 'yard', fw: 'Take the outdoor courtyard path to bypass the blocked corridor.', bw: 'Follow the courtyard path back to the Ramp Junction.' },
  { id: 16, a: 'yard1',      b: 'yard2',      type: 'path', tag: 'yard', fw: 'Continue along the level courtyard path.', bw: 'Continue back along the level courtyard path.' },
  { id: 17, a: 'yard2',      b: 'liftLobby',  type: 'ramp', tag: 'yard', fw: 'Turn towards the building and use the courtyard ramp up to the Lift Lobby.', bw: 'Use the courtyard ramp down and turn onto the courtyard path.' }
];

const WALK_SPEED = 1.1;   // metres per second
const STAIR_SPEED = 0.45;
const LIFT_TIME = 35;     // seconds (call + ride)

EDGES.forEach(function (e) {
  if (e.m == null) {
    const p = NODES[e.a], q = NODES[e.b];
    e.m = Math.max(5, Math.round(Math.hypot(p.x - q.x, p.y - q.y) * 0.28));
  }
});

function edgeSeconds(e) {
  if (e.type === 'lift') return LIFT_TIME;
  if (e.type === 'stairs') return e.m / STAIR_SPEED;
  return e.m / WALK_SPEED;
}
function edgeBlocked(e, F) { return !!e.fac && F[e.fac] === false; }

function findRoute(from, to, opts, F) {
  opts = opts || {};
  const ids = Object.keys(NODES);
  const adj = {};
  ids.forEach(function (id) { adj[id] = []; });
  EDGES.forEach(function (e) {
    if (edgeBlocked(e, F)) return;
    if (opts.stepFree && e.type === 'stairs') return;
    adj[e.a].push({ to: e.b, e: e, dir: 'fw' });
    adj[e.b].push({ to: e.a, e: e, dir: 'bw' });
  });
  const dist = {}, prev = {}, done = {};
  ids.forEach(function (id) { dist[id] = Infinity; });
  dist[from] = 0;
  for (;;) {
    let u = null;
    ids.forEach(function (id) { if (!done[id] && (u === null || dist[id] < dist[u])) u = id; });
    if (u === null || dist[u] === Infinity || u === to) break;
    done[u] = true;
    adj[u].forEach(function (n) {
      const c = dist[u] + edgeSeconds(n.e);
      if (c < dist[n.to]) { dist[n.to] = c; prev[n.to] = { from: u, e: n.e, dir: n.dir }; }
    });
  }
  if (dist[to] === Infinity) return { ok: false };
  const edges = [], nodes = [to];
  let cur = to;
  while (cur !== from) {
    const p = prev[cur];
    edges.unshift({ e: p.e, dir: p.dir });
    nodes.unshift(p.from);
    cur = p.from;
  }
  let meters = 0, seconds = 0;
  const tags = {};
  edges.forEach(function (s) { meters += s.e.m; seconds += edgeSeconds(s.e); if (s.e.tag) tags[s.e.tag] = true; });
  return {
    ok: true, from: from, to: to, nodes: nodes, edges: edges,
    meters: meters, seconds: seconds, tags: Object.keys(tags),
    steps: edges.map(function (s) { return s.dir === 'fw' ? s.e.fw : s.e.bw; }),
    usesLift: edges.some(function (s) { return s.e.type === 'lift'; }),
    usesStairs: edges.some(function (s) { return s.e.type === 'stairs'; }),
    ids: edges.map(function (s) { return s.e.id; }).join(',')
  };
}

// ---- voice / typed command parser ---------------------------------
const ALIASES = {
  entrance:   ['main entrance', 'entrance', 'main gate', 'gate'],
  ramp:       ['ramp junction', 'ramp'],
  groundHall: ['ground hall', 'ground floor', 'ground'],
  liftLobby:  ['lift lobby', 'elevator lobby', 'lift', 'elevator'],
  firstFloor: ['first floor', '1st floor', 'floor one', 'floor 1'],
  secondHall: ['second floor hall', 'second floor', '2nd floor', 'floor two', 'floor 2', 'upstairs'],
  room204:    ['room 204', 'room number 204', 'room two zero four', 'room two oh four', 'room two hundred four', 'two zero four', '204', 'classroom'],
  library:    ['library'],
  office:     ['office']
};

function parseCommand(text) {
  const t = ' ' + String(text || '').toLowerCase().replace(/[.,!?]/g, ' ').replace(/\s+/g, ' ') + ' ';
  const all = [];
  Object.keys(ALIASES).forEach(function (id) {
    ALIASES[id].forEach(function (al) { all.push({ id: id, al: al }); });
  });
  all.sort(function (x, y) { return y.al.length - x.al.length; });
  const taken = new Array(t.length).fill(false);
  const hits = [];
  all.forEach(function (c) {
    let from = 0;
    for (;;) {
      const i = t.indexOf(c.al, from);
      if (i < 0) break;
      const j = i + c.al.length;
      const leftOk = t[i - 1] === ' ', rightOk = t[j] === ' ';
      let free = true;
      for (let k = i; k < j; k++) if (taken[k]) { free = false; break; }
      if (leftOk && rightOk && free) {
        for (let k = i; k < j; k++) taken[k] = true;
        hits.push({ id: c.id, pos: i });
      }
      from = i + 1;
    }
  });
  hits.sort(function (x, y) { return x.pos - y.pos; });
  if (!hits.length) return null;
  let start = null, dest = null;
  hits.forEach(function (h) {
    const before = t.slice(Math.max(0, h.pos - 12), h.pos);
    if (/\bfrom\s+(the\s+)?$/.test(before)) start = start || h.id;
    else if (/\b(to|towards|toward|reach)\s+(the\s+)?$/.test(before)) dest = dest || h.id;
  });
  const rest = hits.map(function (h) { return h.id; }).filter(function (id) { return id !== start && id !== dest; });
  if (!start && !dest) {
    if (hits.length === 1) dest = hits[0].id;
    else { start = hits[0].id; dest = hits[1].id; }
  } else if (start && !dest && rest.length) dest = rest[0];
  else if (dest && !start && rest.length) start = rest[0];
  return { from: start, to: dest };
}
// ==CORE_END==

/* ===================================================================== */
/*                               UI                                      */
/* ===================================================================== */
(function () {
  if (typeof document === 'undefined') return;

  const $ = function (id) { return document.getElementById(id); };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const S = {
    F: { lift1: true, corridorA: true, lift2: true },
    route: null,        // last successful route
    req: null,          // last planner request {from,to,stepFree}
    mode: 'start',      // marker click sets start or destination
    demo: { running: false, timers: [] }
  };

  /* ---------- tiny helpers ---------- */
  function toast(msg, kind) {
    const box = $('toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.classList.add('out'); }, 3400);
    setTimeout(function () { el.remove(); }, 3900);
  }
  function log(msg) {
    const ul = $('log');
    const first = ul.querySelector('.muted');
    if (first) first.remove();
    const li = document.createElement('li');
    const time = document.createElement('time');
    time.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const span = document.createElement('span');
    span.textContent = msg;
    li.appendChild(time); li.appendChild(span);
    ul.insertBefore(li, ul.firstChild);
    while (ul.children.length > 8) ul.removeChild(ul.lastChild);
  }
  function mins(sec) { return Math.max(1, Math.round(sec / 60)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function joinNames(arr) {
    if (arr.length <= 1) return arr.join('');
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }

  /* ---------- selects ---------- */
  function fillSelects() {
    const opts = Object.keys(NODES).filter(function (id) { return NODES[id].pick; });
    const html = opts.map(function (id) {
      const n = NODES[id];
      return '<option value="' + id + '">' + esc(n.label) + (id === 'room204' ? ' · Second floor' : '') + '</option>';
    }).join('');
    $('startSel').innerHTML = html;
    $('destSel').innerHTML = html;
    $('startSel').value = 'entrance';
    $('destSel').value = 'room204';
  }

  /* ---------- MAP ---------- */
  function mid(e) {
    const a = NODES[e.a], b = NODES[e.b];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
  function drawEdges() {
    let h = '';
    EDGES.forEach(function (e) {
      const a = NODES[e.a], b = NODES[e.b];
      const blocked = edgeBlocked(e, S.F);
      const cls = 'edge ' + e.type + (blocked ? ' blocked' : '');
      const title = (e.fac ? FACILITIES[e.fac].name + (blocked ? ' is unavailable' : ' is available') : (e.type === 'stairs' ? 'Stairs (not step-free)' : 'Accessible connection'));
      h += '<line class="' + cls + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"><title>' + esc(title) + '</title></line>';
      if (blocked) {
        const m = mid(e);
        h += '<g class="x-badge" transform="translate(' + m.x + ' ' + m.y + ')"><circle r="13"/><text y="5" text-anchor="middle">✕</text></g>';
      }
    });
    $('layerEdges').innerHTML = h;
  }
  function drawNodes() {
    let h = '';
    Object.keys(NODES).forEach(function (id) {
      const n = NODES[id];
      if (!n.pick) {
        const lift = n.icon === '🛗';
        h += '<g class="junction' + (lift ? ' j-lift' : '') + '" transform="translate(' + n.x + ' ' + n.y + ')"><title>' + esc(n.label) + '</title>' +
             '<circle r="' + (lift ? 15 : 6) + '"/>' + (lift ? '<text y="5" text-anchor="middle" class="n-ico sm">🛗</text>' : '') + '</g>';
        return;
      }
      const w = Math.round(n.label.length * 6.4 + 18);
      const isNum = /^\dF$/.test(n.icon);
      h += '<g class="node" data-id="' + id + '" tabindex="0" role="button" aria-label="' + esc(n.label) + ' (' + n.level + '). Select as start or destination." transform="translate(' + n.x + ' ' + n.y + ')">' +
           '<circle class="n-ring" r="25"/><circle class="n-disc" r="21" filter="url(#soft)"/>' +
           '<text class="n-ico' + (isNum ? ' num' : '') + '" y="' + (isNum ? 7 : 6) + '" text-anchor="middle">' + n.icon + '</text>' +
           '<g class="n-tag" transform="translate(0 38)"><rect x="' + (-w / 2) + '" y="-12" width="' + w + '" height="22" rx="8"/><text y="4" text-anchor="middle">' + esc(n.label) + '</text></g>' +
           '</g>';
    });
    $('layerNodes').innerHTML = h;
    updateMarkers();
  }
  function updateMarkers() {
    const s = $('startSel').value, d = $('destSel').value;
    const onRoute = {};
    if (S.route) S.route.nodes.forEach(function (id) { onRoute[id] = true; });
    document.querySelectorAll('#layerNodes .node').forEach(function (g) {
      const id = g.getAttribute('data-id');
      g.classList.toggle('is-start', id === s);
      g.classList.toggle('is-dest', id === d);
      g.classList.toggle('on-route', !!onRoute[id]);
    });
  }
  function clearRoute() {
    $('layerRoute').innerHTML = '';
    S.route = null;
    updateMarkers();
  }
  function drawRoute(r) {
    const layer = $('layerRoute');
    layer.innerHTML = '';
    if (!r) return;
    const pts = r.nodes.map(function (id) { return NODES[id].x + ',' + NODES[id].y; }).join(' ');
    const d = 'M' + r.nodes.map(function (id) { return NODES[id].x + ' ' + NODES[id].y; }).join(' L');
    const casing = document.createElementNS(SVGNS, 'polyline');
    casing.setAttribute('points', pts); casing.setAttribute('class', 'route-casing');
    const line = document.createElementNS(SVGNS, 'polyline');
    line.setAttribute('points', pts); line.setAttribute('class', 'route-line');
    layer.appendChild(casing); layer.appendChild(line);
    if (!reduceMotion) {
      const dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('r', '8'); dot.setAttribute('class', 'route-dot');
      const am = document.createElementNS(SVGNS, 'animateMotion');
      am.setAttribute('dur', Math.max(3, r.meters / 30) + 's');
      am.setAttribute('repeatCount', 'indefinite');
      am.setAttribute('path', d);
      dot.appendChild(am);
      layer.appendChild(dot);
    }
    updateMarkers();
  }

  /* ---------- PLANNER ---------- */
  function routeSpeechLines(r, detourText) {
    const A = NODES[r.from].label, B = NODES[r.to].label;
    const lines = ['Route from ' + A + ' to ' + B + '. About ' + r.meters + ' metres, around ' + mins(r.seconds) + ' minute' + (mins(r.seconds) > 1 ? 's' : '') + '.'];
    if (detourText) lines.push(detourText);
    r.steps.forEach(function (s, i) { lines.push('Step ' + (i + 1) + '. ' + s); });
    lines.push('You have arrived at ' + B + '.');
    return lines;
  }

  function detourInfo(r, req) {
    const base = findRoute(req.from, req.to, { stepFree: req.stepFree }, { lift1: true, corridorA: true, lift2: true });
    if (!base.ok || base.ids === r.ids) return null;
    const down = [];
    base.edges.forEach(function (s) {
      if (edgeBlocked(s.e, S.F)) {
        const nm = FACILITIES[s.e.fac].name;
        if (down.indexOf(nm) < 0) down.push(nm);
      }
    });
    if (!down.length) return null;
    const added = r.tags.filter(function (t) { return base.tags.indexOf(t) < 0; }).map(function (t) { return TAGNAMES[t]; });
    const dm = r.meters - base.meters;
    const ds = Math.round((r.seconds - base.seconds) / 60);
    const extra = (dm > 0 ? '+' + dm + ' m' : dm + ' m') + (ds >= 1 ? ', about +' + ds + ' min' : ', similar travel time');
    const text = joinNames(down) + (down.length > 1 ? ' are' : ' is') + ' unavailable, so PathAble found another ' + (req.stepFree ? 'step-free ' : '') + 'way' + (added.length ? ' using ' + joinNames(added) : '') + '. (' + extra + ')';
    return { text: text, down: down };
  }

  function renderResult(r, req, detour) {
    const box = $('result');
    const steps = r.steps.map(function (s, i) {
      const edge = r.edges[i].e;
      const ico = edge.type === 'lift' ? '🛗' : edge.type === 'stairs' ? '🪜' : edge.type === 'bridge' ? '🌉' : edge.type === 'ramp' ? '♿' : '➡️';
      return '<li style="--i:' + i + '"><span class="s-ico">' + ico + '</span><span class="s-txt">' + esc(s) + '</span></li>';
    }).join('');
    const chips =
      '<span class="chip-info">📏 ' + r.meters + ' m</span>' +
      '<span class="chip-info">⏱ ~' + mins(r.seconds) + ' min</span>' +
      (r.usesLift ? '<span class="chip-info">🛗 Lift used</span>' : '') +
      (r.usesStairs ? '<span class="chip-info warn">🪜 Includes stairs</span>' : '<span class="chip-info good">✓ Step-free</span>');
    box.innerHTML =
      '<div class="res-head"><div><span class="eyebrow">ROUTE FOUND</span><h3>' + esc(NODES[r.from].label) + ' → ' + esc(NODES[r.to].label) + '</h3></div></div>' +
      '<div class="chip-row">' + chips + '</div>' +
      (detour ? '<div class="banner detour"><b>🔀 Detour active.</b> ' + esc(detour.text) + '</div>' : '') +
      '<ol class="steps">' + steps + '<li class="arrive" style="--i:' + r.steps.length + '"><span class="s-ico">🏁</span><span class="s-txt">You have arrived at ' + esc(NODES[r.to].label) + '.</span></li></ol>' +
      '<div class="res-actions"><button type="button" class="btn btn-solid btn-sm" data-act="read">🔊 Read aloud</button><button type="button" class="btn btn-soft btn-sm" data-act="copy">📋 Copy steps</button><button type="button" class="btn btn-soft btn-sm" data-act="map">🗺 Show on map</button></div>';
  }

  function renderNoRoute(req, why) {
    const A = NODES[req.from].label, B = NODES[req.to].label;
    const anyDown = Object.keys(S.F).some(function (k) { return !S.F[k]; });
    $('result').innerHTML =
      '<div class="res-head"><div><span class="eyebrow warn">NO ROUTE AVAILABLE</span><h3>' + esc(A) + ' → ' + esc(B) + '</h3></div></div>' +
      '<div class="banner danger"><b>⚠ ' + esc(why) + '</b><br />' + (anyDown ? 'Some facilities are currently unavailable in this demo. ' : '') + 'Here is what you can do:</div>' +
      '<div class="res-actions col">' +
        (req.stepFree ? '<button type="button" class="btn btn-ghost btn-sm" data-act="allow-stairs">🪜 Allow stairs and try again</button>' : '') +
        '<button type="button" class="btn btn-primary btn-sm" data-act="assist">🙋 Request staff assistance</button>' +
        (anyDown ? '<button type="button" class="btn btn-soft btn-sm" data-act="restore">↺ Restore all facilities</button>' : '') +
      '</div>';
  }

  function plan(o) {
    o = o || {};
    const from = $('startSel').value, to = $('destSel').value;
    const msg = $('plannerMsg');
    msg.textContent = '';
    if (from === to) {
      msg.textContent = 'Please choose two different locations.';
      clearRoute(); S.req = null;
      $('result').innerHTML = '<div class="result-empty"><span>🧭</span><b>Choose two different places</b><p>Your start and destination are the same.</p></div>';
      return null;
    }
    const req = { from: from, to: to, stepFree: $('stepFree').checked };
    S.req = req;
    const r = findRoute(from, to, { stepFree: req.stepFree }, S.F);
    if (!r.ok) {
      S.route = null;
      drawRoute(null);
      renderNoRoute(req, req.stepFree ? 'No step-free route is available right now.' : 'No route is available right now.');
      if (o.speak) TTS.say(['No ' + (req.stepFree ? 'step-free ' : '') + 'route is available right now. You can request staff assistance.']);
      return null;
    }
    S.route = r;
    const det = detourInfo(r, req);
    renderResult(r, req, det);
    drawRoute(r);
    const ann = o.reason ? (o.reason + ' ') : '';
    if (o.speak) TTS.sayRoute(routeSpeechLines(r, det && det.text), ann);
    if (o.reveal && window.innerWidth < 900) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return r;
  }

  /* ---------- FACILITIES ---------- */
  function renderFacilities() {
    Object.keys(FACILITIES).forEach(function (k) {
      const f = FACILITIES[k], ok = S.F[k];
      const st = $('facStatus-' + k), tx = $('facText-' + k), bt = $('facBtn-' + k);
      st.textContent = ok ? f.okLabel : f.downLabel;
      st.className = 'status ' + (ok ? 'ok' : 'down');
      tx.textContent = ok ? f.okText : f.downText;
      bt.textContent = ok ? f.okBtn : f.downBtn;
      bt.className = 'btn ' + (ok ? 'btn-danger' : 'btn-restore');
      $('fac-' + k).classList.toggle('is-down', !ok);
    });
    drawEdges();
  }
  function setFacility(k, ok, quiet) {
    if (S.F[k] === ok) return;
    S.F[k] = ok;
    renderFacilities();
    const f = FACILITIES[k];
    const evt = ok ? f.name + ' restored.' : f.name + (k === 'corridorA' ? ' blocked.' : ' reported out of service.');
    log(evt);
    toast((ok ? '✅ ' : '⚠️ ') + evt, ok ? 'ok' : 'warn');
    if (!quiet && S.req) {
      const voiceOn = $('voiceGuide').checked || TTS.autoSpeak;
      plan({ speak: voiceOn, reason: ok ? f.name + ' is back in service. Updating your route.' : f.name + (k === 'corridorA' ? ' is blocked.' : ' is out of service.') + ' Finding another way.' });
    }
  }
  function toggleFacility(k) { setFacility(k, !S.F[k]); }
  function restoreAll(quiet) {
    let changed = false;
    Object.keys(S.F).forEach(function (k) { if (!S.F[k]) { S.F[k] = true; changed = true; } });
    renderFacilities();
    if (changed) { log('All facilities restored.'); if (!quiet) toast('✅ All facilities restored', 'ok'); }
    if (S.req) plan();
  }

  /* ---------- VOICE: speech synthesis ---------- */
  const TTS = (function () {
    const ok = 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
    let voices = [], token = 0, rate = 1, active = null, watchdog = null;
    const api = { ok: ok, autoSpeak: false };

    function loadVoices() { if (ok) voices = window.speechSynthesis.getVoices() || []; }
    if (ok) {
      loadVoices();
      if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      else window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    function pickVoice() {
      const prefs = ['en-in', 'en-gb', 'en-us', 'en'];
      for (let i = 0; i < prefs.length; i++) {
        const v = voices.find(function (x) { return x.lang && x.lang.replace('_', '-').toLowerCase().indexOf(prefs[i]) === 0; });
        if (v) return v;
      }
      return null;
    }
    function ui(on) {
      $('wave').classList.toggle('speaking', on);
      $('playBtn').disabled = on;
      $('playBtn').textContent = on ? '🔊 Speaking…' : '▶ Play directions';
    }
    function status(t) { $('voiceStatus').textContent = t; }

    api.setRate = function (r) { rate = parseFloat(r) || 1; };

    api.stop = function (silent) {
      token++;
      clearTimeout(watchdog);
      if (ok) { try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
      ui(false);
      if (!silent) status('Voice stopped.');
    };

    // speak a list of sentences one by one (avoids Chrome cutting long speech)
    api.say = function (lines, opts) {
      opts = opts || {};
      if (!ok) {
        status('Speech is not supported in this browser. Try Chrome, Edge or Safari. Directions are still shown on screen.');
        toast('Voice playback is not supported in this browser', 'warn');
        return false;
      }
      api.stop(true);
      loadVoices();
      const my = ++token;
      let i = 0, started = false;
      ui(true);
      status('Preparing voice…');
      watchdog = setTimeout(function () {
        if (my === token && !started) {
          api.stop(true);
          status('Your browser did not start speaking. Check your device volume (not muted) and that a text-to-speech voice is installed, then press Play again.');
          toast('No sound started. Check volume or system voices.', 'warn');
        }
      }, 4000);

      function next() {
        if (my !== token) return;
        if (i >= lines.length) { ui(false); status('Finished. Press Play to hear it again.'); return; }
        const idx = i, text = lines[i];
        const u = new window.SpeechSynthesisUtterance(text);
        const v = pickVoice();
        if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-IN'; }
        u.rate = rate; u.pitch = 1; u.volume = 1;
        u.onstart = function () {
          if (my !== token) return;
          started = true; clearTimeout(watchdog);
          status('Speaking… (' + (idx + 1) + '/' + lines.length + ')');
          if (opts.display !== false) { $('voiceText').textContent = '“' + text + '”'; $('voiceLabel').textContent = idx === 0 && lines.length === 1 ? 'NOW SPEAKING' : 'NOW SPEAKING · LINE ' + (idx + 1) + ' OF ' + lines.length; }
        };
        u.onend = function () { if (my !== token) return; i++; next(); };
        u.onerror = function (ev) {
          if (my !== token) return;
          if (ev && (ev.error === 'interrupted' || ev.error === 'canceled')) return;
          api.stop(true);
          status('Speech error' + (ev && ev.error ? ' (' + ev.error + ')' : '') + '. Please try again.');
        };
        active = u; // keep a reference so the utterance is not garbage-collected mid-speech
        window.speechSynthesis.speak(u);
      }
      setTimeout(function () {
        if (my !== token) return;
        try { window.speechSynthesis.resume(); } catch (e) { /* ignore */ }
        next();
      }, 160);
      return true;
    };

    api.sayRoute = function (lines, prefix) {
      const all = prefix ? [prefix.trim()].concat(lines) : lines;
      return api.say(all);
    };
    return api;
  })();

  /* ---------- VOICE: speech recognition (microphone) ---------- */
  const Mic = (function () {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    let rec = null, listening = false;
    const el = function () { return $('micStatus'); };

    function setUI(on) {
      listening = on;
      $('micBtn').classList.toggle('listening', on);
      $('micBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
      $('micBtn').textContent = on ? '⏹ Stop listening' : '🎙 Speak a destination';
    }
    function toggle() {
      if (!SR) {
        el().textContent = 'Speech recognition is not supported in this browser. Use Chrome or Edge, or type a command below.';
        toast('Microphone input is not supported here. Type a command instead.', 'warn');
        $('cmdInput').focus();
        return;
      }
      if (listening && rec) { rec.stop(); return; }
      TTS.stop(true);
      rec = new SR();
      rec.lang = 'en-IN';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 3;
      let finalText = '';
      rec.onstart = function () { setUI(true); el().textContent = '🎙 Listening… say “from lift lobby to Room 204”'; };
      rec.onresult = function (ev) {
        let interim = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (res.isFinal) finalText += res[0].transcript + ' '; else interim += res[0].transcript;
        }
        el().textContent = 'Heard: “' + (finalText + interim).trim() + '”';
      };
      rec.onerror = function (ev) {
        const map = {
          'not-allowed': 'Microphone permission is blocked. Click the lock icon in the address bar, allow the microphone, and try again.',
          'service-not-allowed': 'Microphone permission is blocked. Allow it in your browser settings and try again.',
          'no-speech': 'I did not hear anything. Check your microphone and try again.',
          'audio-capture': 'No microphone was found on this device.',
          'network': 'The speech service could not be reached. Check your internet connection.',
          'aborted': 'Listening was stopped.'
        };
        el().textContent = map[ev.error] || ('Microphone error: ' + ev.error);
        if (ev.error !== 'aborted' && ev.error !== 'no-speech') toast(el().textContent, 'warn');
      };
      rec.onend = function () {
        setUI(false);
        const txt = finalText.trim();
        if (txt) handleCommand(txt, true);
        else if (/Listening/.test(el().textContent)) el().textContent = 'Microphone is off';
      };
      try { rec.start(); } catch (e) { el().textContent = 'Could not start the microphone. Please try again.'; setUI(false); }
    }
    return { toggle: toggle, supported: !!SR };
  })();

  function handleCommand(text, spoken) {
    const out = $('micStatus');
    const parsed = parseCommand(text);
    if (!parsed || (!parsed.to && !parsed.from)) {
      out.textContent = 'Heard: “' + text + '” — I could not find a campus place. Try “take me to the library”.';
      toast('Sorry, I did not recognise a campus place.', 'warn');
      if (spoken) TTS.say(['Sorry, I did not recognise a campus place. Try saying, take me to the library.'], { display: false });
      return;
    }
    if (parsed.from) $('startSel').value = parsed.from;
    if (parsed.to) $('destSel').value = parsed.to;
    if ($('startSel').value === $('destSel').value) {
      out.textContent = 'Heard: “' + text + '” — start and destination are the same.';
      if (spoken) TTS.say(['Your start and destination are the same. Please choose another place.'], { display: false });
      plan();
      return;
    }
    out.textContent = 'Heard: “' + text + '” → ' + NODES[$('startSel').value].label + ' to ' + NODES[$('destSel').value].label;
    updateMarkers();
    $('map').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    plan({ speak: spoken || $('voiceGuide').checked });
    toast('Route updated from your command', 'ok');
  }

  /* ---------- DEMO (for presentations) ---------- */
  function stopDemo(silent) {
    S.demo.timers.forEach(clearTimeout);
    S.demo.timers = [];
    S.demo.running = false;
    ['demoBtn', 'demoBtn2'].forEach(function (id) { $(id).textContent = '▶ Run live demo'; });
    if (!silent) toast('Demo stopped');
  }
  function runDemo() {
    if (S.demo.running) { stopDemo(); return; }
    S.demo.running = true;
    ['demoBtn', 'demoBtn2'].forEach(function (id) { $(id).textContent = '■ Stop demo'; });
    const at = function (ms, fn) { S.demo.timers.push(setTimeout(fn, ms)); };
    Object.keys(S.F).forEach(function (k) { S.F[k] = true; });
    renderFacilities();
    $('startSel').value = 'liftLobby'; $('destSel').value = 'secondHall'; $('stepFree').checked = true;
    $('map').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    plan();
    toast('Demo 1/4 · Step-free route: Lift Lobby → Second Floor Hall');
    log('Demo started: Lift Lobby → Second Floor Hall.');
    at(4500, function () { toast('Demo 2/4 · Lift 01 breaks down…', 'warn'); setFacility('lift1', false); });
    at(9500, function () { toast('Demo 3/4 · Backup lift also fails…', 'warn'); setFacility('lift2', false); });
    at(14500, function () { toast('Demo 4/4 · Lift 01 restored', 'ok'); setFacility('lift1', true); });
    at(19500, function () { restoreAll(true); stopDemo(true); toast('Demo complete ✔', 'ok'); log('Demo finished.'); });
  }

  /* ---------- A11Y toolbar ---------- */
  const SIZES = [100, 112, 125];
  function applyA11y(hc, sizeIdx) {
    document.documentElement.classList.toggle('hc', hc);
    $('contrastBtn').setAttribute('aria-pressed', hc ? 'true' : 'false');
    document.documentElement.style.fontSize = SIZES[sizeIdx] + '%';
    $('textLabel').textContent = SIZES[sizeIdx] === 100 ? 'Text size' : SIZES[sizeIdx] + '%';
  }
  function initA11y() {
    let hc = false, si = 0;
    try { hc = localStorage.getItem('pa-hc') === '1'; si = parseInt(localStorage.getItem('pa-size') || '0', 10) || 0; } catch (e) { /* ignore */ }
    if (si < 0 || si >= SIZES.length) si = 0;
    applyA11y(hc, si);
    $('contrastBtn').addEventListener('click', function () {
      hc = !hc; applyA11y(hc, si);
      try { localStorage.setItem('pa-hc', hc ? '1' : '0'); } catch (e) { /* ignore */ }
    });
    $('textBtn').addEventListener('click', function () {
      si = (si + 1) % SIZES.length; applyA11y(hc, si);
      try { localStorage.setItem('pa-size', String(si)); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- page chrome: nav, reveal, counters ---------- */
  function initChrome() {
    const nav = $('siteNav'), burger = $('navToggle');
    burger.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.textContent = open ? '✕' : '☰';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = '☰'; }
    });
    const header = document.querySelector('.site-header');
    window.addEventListener('scroll', function () { header.classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      document.querySelectorAll('.reveal').forEach(function (el, i) { el.style.transitionDelay = (i % 5) * 70 + 'ms'; io.observe(el); });

      const links = {};
      document.querySelectorAll('[data-spy]').forEach(function (a) { links[a.getAttribute('data-spy')] = a; });
      const spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); });
            const l = links[en.target.id]; if (l) l.classList.add('active');
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['home', 'features', 'planner', 'map', 'voice', 'facility'].forEach(function (id) { const s = $(id); if (s) spy.observe(s); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }

    document.querySelectorAll('[data-count]').forEach(function (el) {
      const target = parseInt(el.getAttribute('data-count'), 10);
      if (reduceMotion) { el.textContent = target; return; }
      let n = 0;
      const t = setInterval(function () { n++; el.textContent = n; if (n >= target) clearInterval(t); }, 120);
    });
  }

  /* ---------- wire everything ---------- */
  function setMode(m) {
    S.mode = m;
    $('modeStart').classList.toggle('active', m === 'start');
    $('modeDest').classList.toggle('active', m === 'dest');
    $('modeStart').setAttribute('aria-pressed', m === 'start' ? 'true' : 'false');
    $('modeDest').setAttribute('aria-pressed', m === 'dest' ? 'true' : 'false');
  }
  function pickNode(id) {
    const hint = $('mapHint');
    if (S.mode === 'start') {
      $('startSel').value = id;
      hint.textContent = '✔ Start set to ' + NODES[id].label + '. Now select your destination.';
      setMode('dest');
    } else {
      $('destSel').value = id;
      hint.textContent = '✔ Destination set to ' + NODES[id].label + '.';
      setMode('start');
    }
    updateMarkers();
    if ($('startSel').value !== $('destSel').value) plan({ speak: $('voiceGuide').checked });
    else { hint.textContent = 'Start and destination are the same. Pick a different place.'; plan(); }
  }

  function bind() {
    $('plannerForm').addEventListener('submit', function (e) {
      e.preventDefault();
      plan({ speak: $('voiceGuide').checked, reveal: true });
    });
    $('startSel').addEventListener('change', updateMarkers);
    $('destSel').addEventListener('change', updateMarkers);
    $('stepFree').addEventListener('change', function () { if (S.req) plan({ speak: false }); });
    $('voiceGuide').addEventListener('change', function () {
      if ($('voiceGuide').checked) {
        toast('Voice guidance on', 'ok');
        if (S.route) TTS.say(routeSpeechLines(S.route, null));
        else TTS.say(['Voice guidance is on. Find a route and I will read it aloud.']);
      } else { TTS.stop(true); }
    });
    $('swapBtn').addEventListener('click', function () {
      const a = $('startSel').value; $('startSel').value = $('destSel').value; $('destSel').value = a;
      updateMarkers();
      if (S.req) plan({ speak: false });
    });
    $('resetBtn').addEventListener('click', function () {
      TTS.stop(true);
      $('startSel').value = 'entrance'; $('destSel').value = 'room204';
      $('stepFree').checked = true; $('voiceGuide').checked = false;
      S.req = null; $('plannerMsg').textContent = '';
      clearRoute();
      $('result').innerHTML = '<div class="result-empty"><span>🧭</span><b>Your route will appear here</b><p>Choose your start and destination, then find an accessible route.</p></div>';
      setMode('start');
      $('mapHint').textContent = 'Tip: choose “Set start” or “Set destination”, then select any map marker.';
      toast('Planner reset');
    });

    $('modeStart').addEventListener('click', function () { setMode('start'); });
    $('modeDest').addEventListener('click', function () { setMode('dest'); });

    $('layerNodes').addEventListener('click', function (e) {
      const g = e.target.closest('.node'); if (g) pickNode(g.getAttribute('data-id'));
    });
    $('layerNodes').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        const g = e.target.closest ? e.target.closest('.node') : null;
        if (g) { e.preventDefault(); pickNode(g.getAttribute('data-id')); }
      }
    });

    // result panel buttons (re-rendered, so delegated)
    $('result').addEventListener('click', function (e) {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'read' && S.route) TTS.say(routeSpeechLines(S.route, detourInfo(S.route, S.req) && detourInfo(S.route, S.req).text));
      else if (act === 'copy' && S.route) {
        const text = NODES[S.route.from].label + ' to ' + NODES[S.route.to].label + ' (' + S.route.meters + ' m, ~' + mins(S.route.seconds) + ' min)\n' +
          S.route.steps.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\n');
        const done = function () { toast('Route copied to clipboard', 'ok'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        else fallbackCopy(text, done);
      }
      else if (act === 'map') $('map').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      else if (act === 'allow-stairs') { $('stepFree').checked = false; plan({ speak: $('voiceGuide').checked }); toast('Stairs allowed for this route', 'warn'); }
      else if (act === 'assist') openAssist();
      else if (act === 'restore') restoreAll();
    });

    // facilities
    document.querySelectorAll('[data-fac]').forEach(function (b) {
      b.addEventListener('click', function () { toggleFacility(b.getAttribute('data-fac')); });
    });
    $('resetFacBtn').addEventListener('click', function () { restoreAll(); });
    $('demoBtn').addEventListener('click', runDemo);
    $('demoBtn2').addEventListener('click', runDemo);

    // voice
    $('playBtn').addEventListener('click', function () {
      if (S.route) {
        const d = S.req ? detourInfo(S.route, S.req) : null;
        TTS.say(routeSpeechLines(S.route, d && d.text));
      } else {
        TTS.say(['Continue through the ground floor corridor towards the lift lobby.']);
      }
    });
    $('stopBtn').addEventListener('click', function () { TTS.stop(); $('voiceLabel').textContent = 'SAMPLE NAVIGATION INSTRUCTION'; });
    $('micBtn').addEventListener('click', Mic.toggle);
    $('rateSel').addEventListener('change', function () { TTS.setRate($('rateSel').value); toast('Speech speed updated'); });
    $('cmdBtn').addEventListener('click', function () { const v = $('cmdInput').value.trim(); if (v) handleCommand(v, false); });
    $('cmdInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); const v = $('cmdInput').value.trim(); if (v) handleCommand(v, false); } });
    $('cmdChips').addEventListener('click', function (e) {
      const c = e.target.closest('.chip'); if (!c) return;
      $('cmdInput').value = c.getAttribute('data-cmd');
      handleCommand(c.getAttribute('data-cmd'), false);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { TTS.stop(); } });

    // assistance dialog
    $('assistCancel').addEventListener('click', function () { closeAssist(); });
    $('assistForm').addEventListener('submit', function (e) {
      e.preventDefault();
      const t = $('assistType').value;
      log('Assistance requested: ' + t + '.');
      toast('🙋 Request sent to the help desk (demo)', 'ok');
      closeAssist();
      $('assistNote').value = '';
    });
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('Copy failed. Select the text manually.', 'warn'); }
    ta.remove();
  }
  function openAssist() {
    const d = $('assistDialog');
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  function closeAssist() {
    const d = $('assistDialog');
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }

  /* ---------- start ---------- */
  function init() {
    fillSelects();
    drawEdges();
    drawNodes();
    renderFacilities();
    initA11y();
    initChrome();
    bind();
    plan(); // show a first route so the map is alive on load
    if (!TTS.ok) $('voiceStatus').textContent = 'This browser does not support speech playback. Directions are still shown on screen.';
    if (!Mic.supported) $('micStatus').textContent = 'Microphone input is not supported in this browser (use Chrome/Edge) — type a command instead.';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
