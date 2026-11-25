// One crowd of 360 outline tiles that rebuilds itself into each result.
// A tile is [x, y, size, colour, fill, hint]. Fill runs from 0 (empty outline) to 1 (solid).
// A scene returns its stage size, tiles, text labels and guide lines, all from real project numbers.
const Mosaic = (() => {
  const N = 360, INK = '#151515', RED = '#d91e18', GREY = '#7d7d7d', PALE = '#b9b9b4';
  const GLYPH = {
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  };
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hour = (h) => h === 12 ? '12pm' : h < 12 ? h + 'am' : (h - 12) + 'pm';
  const HEAT = [
    [1.29, 1.91, 1.33, 1.8, 1.15, 1.19, .99, 1.11, 1.06, 1.3, 1.54, 1.48, 1.62, 1.3, 1.11, 1.05, .91, .96, .97],
    [1.21, 1.94, 1.43, 1.75, 1.16, 1.04, 1.05, 1.14, 1.31, 1.21, 1.49, 2.01, 1.87, 1.44, 1.23, 1.31, 1.1, 1.11, .91],
    [1.09, 1.87, 1.66, 1.67, 1.23, .9, 1.13, 1.02, 1.26, 1.44, 1.54, 1.71, 1.96, 1.43, 1.26, 1.27, .99, 1.13, .95],
    [1.3, 1.71, 1.39, 1.61, 1.14, 1.18, 1.13, 1.05, 1.19, 1.29, 1.5, 2.01, 1.84, 1.35, 1.17, 1.15, 1.17, 1.26, 1.04],
    [1.18, 1.54, 1.36, 1.37, 1.12, .98, 1.1, 1.1, 1.26, 1.45, 1.59, 1.53, 1.8, 1.45, 1.19, 1.15, 1.31, 1.21, 1.24],
    [.84, 1.35, .65, .54, .79, .83, .99, 1.08, 1.17, 1.19, 1.11, 1.21, 1.24, 1.11, 1.1, 1.16, 1.17, 1.25, 1.05],
    [.02, .04, .38, 2.62, .88, .97, .93, .87, .97, .96, .95, 1.06, 1.08, 1.04, 1.1, .92, .89, .9, .87],
  ];

  // Tiles with no job in a graph stand around the edge and watch.
  function watch(t, w, h) {
    const n = N - t.length, around = 2 * (w + h) - 40;
    for (let i = 0; i < n; i++) {
      let d = i / n * around, x, y;
      if (d < w - 10) { x = d; y = 0; }
      else if ((d -= w - 10) < h - 10) { x = w - 10; y = d; }
      else if ((d -= h - 10) < w - 10) { x = w - 10 - d; y = h - 10; }
      else { x = 0; y = h - 10 - (d - (w - 10)); }
      t.push([x + 2, y + 2, 5, PALE, 0]);
    }
    return t;
  }
  const stage = (m) => m ? [400, 430] : [940, 500];

  const scenes = {
    // ---- Home page ----
    name(m) {
      const [w, h] = m ? [400, 190] : stage(m), step = (w - 20) / 36, t = [];
      for (let r = 0; r < 10; r++) for (let c = 0; c < 36; c++) {
        const row = r - 1, col = c % 6, g = GLYPH['HIDAYA'[Math.floor(c / 6)]];
        const on = row >= 0 && row < 7 && col < 5 && g[row][col] === '1', stop = row === 6 && c === 35;
        const s = step * (on || stop ? .9 : .24);
        t.push([10 + (c + .5) * step - s / 2, h / 2 + (r - 4.5) * step - s / 2, s, stop ? RED : on ? INK : PALE, stop ? 1 : 0]);
      }
      return { w, h, t, l: [], g: [] };
    },
    heatmap(m) {
      const [w, h] = stage(m), t = [], l = [], L = m ? 52 : 96, T = m ? 60 : 36, cw = (w - L - (m ? 22 : 60)) / 19, ch = m ? 42 : 54, s = Math.min(cw, ch) - (m ? 2 : 5);
      HEAT.forEach((row, d) => {
        l.push([L - 8, T + d * ch + s / 2 + 5, DAYS[d], 'right']);
        row.forEach((v, i) => t.push([L + i * cw, T + d * ch, s, v >= 1.8 ? RED : INK, Math.min(1, v / 2.62), `${DAYS[d]} ${hour(i + 5)}: ${v.toFixed(2)} delays`]));
      });
      [6, 9, 12, 15, 18, 21].forEach((x) => l.push([L + (x - 5) * cw + s / 2, T + 7 * ch + (m ? 4 : 14), hour(x), 'center']));
      return { w, h, t: watch(t, w, h), l, g: [] };
    },
    dumbbell(m) {
      const [w, h] = stage(m), t = [], l = [], L = m ? 40 : 236, R = m ? 40 : 60, X = (v) => L + (v - 45) / 30 * (w - L - R), big = m ? 17 : 34, pad = m ? 2 : 4, g = [];
      [45, 55, 65, 75].forEach((v) => { g.push([X(v), m ? 62 : 70, X(v), h - 62, '#dcdcd7', 1]); l.push([X(v), h - 38, v + '%', 'center']); });
      g.push([X(54.3), m ? 56 : 58, X(54.3), h - 62, INK, 2]);
      l.push([X(54.3), m ? 46 : 46, 'always guessing "up": 54.3%', m ? 'center' : 'center']);
      [['Logistic regression', 53.8, 50.5, 3], ['Random forest', 66.7, 47.9, 19], ['XGBoost', 72, 47.7, 24]].forEach(([n, a, b, gap], i) => {
        const y = (m ? 112 : 138) + i * (m ? 98 : 118), xa = X(a), xb = X(b), from = xb + big / 2 + pad, to = xa - big / 2 - pad, sm = Math.min(m ? 5 : 11, (to - from) / gap - 1.5);
        if (m) l.push([w - 24, y - 24, n, 'right']); else l.push([L - 44, y + 6, n, 'right']);
        for (let k = 0; k < gap; k++) if (sm > 1) t.push([from + (to - from) * (k + .5) / gap - sm / 2, y - sm / 2, sm, GREY, 0, `${n}: ${(a - b).toFixed(1)} points lost on new data`]);
        t.push([xa - big / 2, y - big / 2, big, INK, 0, `${n}, training: ${a.toFixed(1)}%`], [xb - big / 2, y - big / 2, big, RED, 1, `${n}, new data: ${b.toFixed(1)}%`]);
        l.push([i ? xb : xb + (m ? 4 : 10), y + big / 2 + 20, b.toFixed(1) + '%', i ? 'center' : 'right'], [i ? xa : X(54.3) + 8, y + big / 2 + 20, a.toFixed(1) + '%', i ? 'center' : 'left']);
      });
      return { w, h, t: watch(t, w, h), l, g };
    },
    matrix(m) {
      const [w, h] = stage(m), t = [], l = [];
      const fill = [1, .5, .12, 0], runs = ['K-means', 'K-means, no Toronto', 'Four groups, no Toronto', 'Hierarchical', 'Hierarchical, no Toronto'];
      const head = m ? [['A', ''], ['B', ''], ['C', ''], ['D', ''], ['E', '']] : [['K-means', ''], ['K-means', 'no Toronto'], ['Four groups', 'no Toronto'], ['Hierarchical', ''], ['Hierarchical', 'no Toronto']];
      const rows = [['Toronto', '0..0.'], ['Mississauga', '10010'], ['Newmarket', '10011'], ['Ottawa', '11111'], ['8 like Barrie', '11122'], ['Kingston, Sudbury', '11222'], [m ? '3 northern' : 'Kenora, Sault, Thunder Bay', '21222'], ['Timmins', '22222'], [m ? '16 low-count' : '16 low-count cities', '22322']];
      const L = m ? 172 : 330, T = m ? 58 : 66, cw = (w - L - (m ? 14 : 70)) / 5, ch = m ? 39 : 45, s = m ? 29 : 36;
      head.forEach((p, i) => p.forEach((x, k) => l.push([L + (i + .5) * cw, (m ? 46 : 34) + k * 17, x, 'center'])));
      rows.forEach(([n, v], r) => {
        l.push([L - 12, T + r * ch + s / 2 + 5, n, 'right']);
        [...v].forEach((c, i) => { if (c !== '.') t.push([L + (i + .5) * cw - s / 2, T + r * ch, s, c === '0' ? RED : INK, fill[c], `${n}, ${runs[i]}: group ${+c + 1}`]); });
      });
      return { w, h, t: watch(t, w, h), l, g: [] };
    },
    lines(m) {
      const [w, h] = stage(m), t = [], l = [], g = [], L = m ? 66 : 130, R = m ? 28 : 70, T = 34, B = m ? 64 : 62;
      const X = (c) => L + c / 500 * (w - L - R), Y = (v) => h - B - v / 100 * (h - T - B), s = m ? 7 : 12, step = m ? 14 : 12;
      [0, 25, 50, 75, 100].forEach((v) => { g.push([L, Y(v), w - R, Y(v), '#dcdcd7', 1]); l.push([L - 10, Y(v) + 5, v + ' g', 'right']); });
      [0, 250, 500].forEach((c) => l.push([X(c), h - B + 24, String(c), 'center']));
      l.push([X(250), h - B + (m ? 44 : 46), 'calories', 'center']);
      [[0, INK, 1], [5, INK, 0], [10, RED, 1]].forEach(([fat, c, f]) => {
        for (let k = 0; k <= 500; k += step) {
          const v = .237406 * k - 2.683616 * fat - 3.309724;
          if (v < 0 || v > 90 || k > 490) continue;
          t.push([X(k) - s / 2, Y(v) - s / 2, s, c, f, `${k} calories, ${fat} g fat: about ${Math.round(v)} g sugar`]);
        }
        const ky = Y(27 - fat * 1.9), kx = X(355);
        t.push([kx, ky - s / 2, s, c, f]);
        l.push([kx + s + 8, ky + 5, fat + ' g fat', 'left']);
      });
      return { w, h, t: watch(t, w, h), l, g };
    },

    // ---- Case study headers (920 x 660) ----
    home() {
      const t = [];
      for (let r = 0; r < 10; r++) for (let c = 0; c < 36; c++) {
        const row = r - 1, col = c % 6, g = GLYPH['HIDAYA'[Math.floor(c / 6)]];
        const on = row >= 0 && row < 7 && col < 5 && g[row][col] === '1', stop = row === 6 && c === 35, s = on || stop ? 22 : 6;
        t.push([32 + c * 24.6 - s / 2, 215 + r * 24.6 - s / 2, s, stop ? RED : on ? INK : PALE, stop ? 1 : 0]);
      }
      return { w: 920, h: 660, t, l: [], g: [] };
    },
    // Share of 2026 delays in each predicted-risk tenth of station-hours.
    ttc() {
      const t = [];
      [13, 18, 24, 26, 30, 34, 36, 43, 50, 86].forEach((n, g) => {
        for (let i = 0; i < n; i++) t.push([50 + g * 83 + (i % 4) * 18, 560 - Math.floor(i / 4) * 21, 15, g === 9 ? RED : INK, g === 9 ? 1 : 0]);
      });
      return { w: 920, h: 660, t, l: [[50, 612, 'safest hours', 'left'], [872, 612, 'riskiest hours', 'right'], [872, 92, '24% of delays', 'right']], g: [] };
    },
    // 541 test days by what the model said and whether it was right (196, 170, 77, 98).
    stock() {
      const t = [], l = [];
      [[131, 0, 0, 'said up, right'], [113, 1, 0, 'said up, wrong'], [51, 0, 1, 'said down, right'], [65, 1, 1, 'said down, wrong']].forEach(([n, c, r, text]) => {
        for (let i = 0; i < n; i++) t.push([50 + c * 440 + (i % 16) * 24, 120 + r * 300 + Math.floor(i / 16) * 24, 19, c ? RED : INK, c]);
        l.push([50 + c * 440, 98 + r * 300, text, 'left']);
      });
      return { w: 920, h: 660, t, l, g: [] };
    },
    // K-means groups of 34 Ontario cities (1, 13, 20). Ten tiles make one city.
    covid() {
      const t = [], l = [];
      let y = 84;
      [[1, RED, 1, 'Toronto, on its own'], [13, INK, .5, '13 cities, next most cases'], [20, INK, 0, '20 cities, fewest cases']].forEach(([n, k, f, text]) => {
        l.push([50, y, text, 'left']);
        for (let c = 0; c < n; c++) for (let i = 0; i < 10; i++) t.push([50 + (c % 7) * 118 + (i % 5) * 20, y + 18 + Math.floor(c / 7) * 58 + Math.floor(i / 5) * 20, 16, k, f]);
        y += Math.ceil(n / 7) * 58 + 64;
      });
      for (let i = 0; t.length < N; i++) t.push([50 + i * 15, 640, 6, PALE, 0]);
      return { w: 920, h: 660, t, l, g: [] };
    },
    // R-squared of the sugar model: 95.5% explained, 4.5% not.
    sugar() {
      const t = [];
      for (let i = 0; i < N; i++) t.push([50 + (i % 24) * 34, 78 + Math.floor(i / 24) * 34, 26, i >= 344 ? RED : INK, i >= 344 ? 1 : 0]);
      return { w: 920, h: 660, t, l: [[50, 622, '95.5% explained', 'left'], [866, 622, '4.5% not', 'right']], g: [] };
    },
  };

  function mount(canvas, first, onHint) {
    const ctx = canvas.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let small = canvas.clientWidth < 620, name = first, scene = scenes[first](small);
    let from = scene.t, now = scene.t.map((a) => a.slice());
    let start = 0, done = true, raf = 0, k = 1, ox = 0, oy = 0, dpr = 1, hot = -1;
    // Bubble state for each tile: offset x, y and their speeds, then swell and its speed.
    const bub = Array.from({ length: N }, () => [0, 0, 0, 0, 1, 0]);
    let px = -999, py = -999, waves = [], bubRaf = 0, last = 0;

    function size() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      if ((r.width < 620) !== small) {
        small = !small;
        scene = scenes[name](small);
        cancelAnimationFrame(raf);
        now = scene.t.map((a) => a.slice());
        done = true;
      }
      fit();
      paint();
    }
    function fit() {
      const r = canvas.getBoundingClientRect();
      k = Math.min(r.width / scene.w, r.height / scene.h);
      ox = (r.width - scene.w * k) / 2;
      oy = (r.height - scene.h * k) / 2;
    }
    function paint() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
      if (done) for (const [a, b, c, d, col, lw] of scene.g) {
        ctx.strokeStyle = col; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
      }
      const draw = (i) => {
        let [x, y, s, c, f] = now[i];
        const [bx, by, , , z] = bub[i];
        x += bx - s * (z - 1) / 2; y += by - s * (z - 1) / 2; s *= z;
        if (s <= 0) return;
        const lw = Math.max(1, Math.min(2.4, s * .12));
        if (s > 9) { ctx.fillStyle = '#f7f7f5'; ctx.fillRect(x, y, s, s); }
        ctx.strokeStyle = c; ctx.fillStyle = c;
        ctx.lineWidth = done && i === hot ? lw + 2.5 : lw;
        ctx.strokeRect(x + lw / 2, y + lw / 2, s - lw, s - lw);
        if (f > .01) { const q = (s - lw) * Math.sqrt(f); ctx.fillRect(x + (s - q) / 2, y + (s - q) / 2, q, q); }
      };
      for (let i = 0; i < N; i++) if (i !== hot) draw(i);
      if (hot >= 0) draw(hot);
      if (done) {
        ctx.fillStyle = INK;
        ctx.font = `600 ${scene.w === 920 ? Math.max(22, 13 / k) : Math.max(15, 13 / k)}px Archivo, sans-serif`;
        for (const [x, y, text, align] of scene.l) { ctx.textAlign = align; ctx.fillText(text, x, y); }
      }
    }
    function step(ts) {
      const p = Math.min(1, (ts - start) / 1300);
      for (let i = 0; i < N; i++) {
        const a = from[i], b = scene.t[i];
        const d = Math.min(1, Math.max(0, p * 1.7 - (i % 100) / 143));
        const q = d - 1, e = 1 + 2.5 * q * q * q + 1.5 * q * q, mix = (j) => a[j] + (b[j] - a[j]) * e; // lands with a small bounce
        now[i] = [mix(0), mix(1), Math.max(0, mix(2)), e > .5 ? b[3] : a[3], Math.max(0, Math.min(1, mix(4))), b[5]];
      }
      done = p >= 1;
      paint();
      if (!done) raf = requestAnimationFrame(step);
    }
    // Tiles push away from the pointer, spring back with a wobble, swell when hovered,
    // and ripple outwards from a click or tap. Runs only while something is moving.
    function bubble(ts) {
      const dt = Math.min(2, (ts - last) / 16.7 || 1), playful = name === 'name' || name === 'home', reach = playful ? 105 : 75, push = playful ? 34 : 10;
      last = ts;
      let moving = false;
      waves = waves.filter((w) => ts - w.t < 1100);
      for (let i = 0; i < N; i++) {
        const t = now[i], b = bub[i], cx = t[0] + t[2] / 2, cy = t[1] + t[2] / 2;
        let tx = 0, ty = 0, tz = 1;
        const dx = cx - px, dy = cy - py, d = Math.hypot(dx, dy) || 1;
        if (i === hot) tz = 1.45;
        else if (d < reach) {
          const f = (1 - d / reach) ** 1.3;
          tx = dx / d * push * f; ty = dy / d * push * f;
          if (playful) tz = 1 + .45 * f;
        }
        for (const w of waves) {
          const wx = cx - w.x, wy = cy - w.y, wd = Math.hypot(wx, wy) || 1, edge = (ts - w.t) * .75, gap = Math.abs(wd - edge);
          if (gap < 46) {
            const f = (1 - gap / 46) * Math.max(0, 1 - (ts - w.t) / 1100);
            tx += wx / wd * 26 * f; ty += wy / wd * 26 * f; tz += .55 * f;
          }
        }
        b[2] = (b[2] + (tx - b[0]) * .16 * dt) * Math.pow(.8, dt);
        b[3] = (b[3] + (ty - b[1]) * .16 * dt) * Math.pow(.8, dt);
        b[5] = (b[5] + (tz - b[4]) * .18 * dt) * Math.pow(.78, dt);
        b[0] += b[2] * dt; b[1] += b[3] * dt; b[4] = Math.max(.2, b[4] + b[5] * dt);
        if (Math.abs(b[2]) + Math.abs(b[3]) + Math.abs(b[5]) * 20 + Math.abs(tx - b[0]) + Math.abs(ty - b[1]) + Math.abs(tz - b[4]) * 10 > .05) moving = true;
        else { b[0] = tx; b[1] = ty; b[4] = tz; b[2] = b[3] = b[5] = 0; }
      }
      if (done) paint();
      bubRaf = moving || waves.length ? requestAnimationFrame(bubble) : 0;
    }
    function wake() {
      if (still || bubRaf) return;
      last = performance.now();
      bubRaf = requestAnimationFrame(bubble);
    }
    function go(next) {
      if (next === name) return;
      name = next;
      hot = -1;
      from = now.map((a) => a.slice());
      scene = scenes[next](small);
      fit();
      cancelAnimationFrame(raf);
      if (still || document.hidden) { now = scene.t.map((a) => a.slice()); done = true; paint(); return; }
      done = false;
      start = performance.now();
      raf = requestAnimationFrame(step);
    }
    function track(e) {
      const r = canvas.getBoundingClientRect();
      px = (e.clientX - r.left - ox) / k; py = (e.clientY - r.top - oy) / k;
      if (onHint) {
        let best = -1, near = 26;
        if (done) scene.t.forEach(([a, b, s, , , x], i) => { const d = Math.hypot(a + s / 2 - px, b + s / 2 - py); if (x && d < near) { near = d; best = i; } });
        if (best !== hot) { hot = best; if (done) paint(); }
        onHint(best < 0 ? '' : scene.t[best][5]);
      }
      wake();
    }
    function leave() { px = py = -999; hot = -1; if (done) paint(); if (onHint) onHint(''); wake(); }
    canvas.addEventListener('pointermove', track);
    canvas.addEventListener('pointerdown', (e) => {
      track(e);
      if (!still) waves.push({ x: px, y: py, t: performance.now() });
      wake();
    });
    // On touch, keep the tapped tile's value showing but let the crowd settle.
    canvas.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { px = py = -999; wake(); } });
    canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') leave(); else { px = py = -999; wake(); } });
    canvas.addEventListener('pointercancel', leave);
    new ResizeObserver(size).observe(canvas);
    document.fonts?.ready.then(paint);
    size();
    return { go };
  }
  return { mount, scenes };
})();

// Case-study pages: the crowd walks from the name into that project's picture.
document.querySelectorAll('canvas[data-scene]').forEach((c) => {
  const m = Mosaic.mount(c, 'home');
  setTimeout(() => m.go(c.dataset.scene), 500);
});
