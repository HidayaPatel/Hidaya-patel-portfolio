// The mosaic: one crowd of 360 tiles that rebuilds itself into each project's result.
// Every project scene uses that project's own numbers. A scene returns tiles as
// [x, y, size, colour] on a 920 x 660 stage, plus text labels.
const Mosaic = (() => {
  const N = 360, W = 920, H = 660;
  const INK = '#151515', RED = '#d91e18', GREY = '#7d7d7d', PALE = '#dededa';
  const GLYPH = {
    H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
    A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
    Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  };
  // Spare tiles wait in a pale row along the bottom of the stage.
  const bench = (i) => [20 + (i % 60) * 15, 640 + Math.floor(i / 60) * 11, 8, PALE];

  const scenes = {
    home() {
      const t = [];
      for (let r = 0; r < 10; r++) for (let c = 0; c < 36; c++) {
        const row = r - 1, col = c % 6, g = GLYPH['HIDAYA'[Math.floor(c / 6)]];
        const on = row >= 0 && row < 7 && col < 5 && g[row][col] === '1';
        const stop = row === 6 && c === 35;
        const s = on || stop ? 22 : 7;
        t.push([32 + c * 24.6 - s / 2, 215 + r * 24.6 - s / 2, s, stop ? RED : on ? INK : '#c9c9c4']);
      }
      return { t, l: [] };
    },
    // Share of 2026 delays in each predicted-risk tenth of station-hours.
    ttc() {
      const t = [];
      [13, 18, 24, 26, 30, 34, 36, 43, 50, 86].forEach((n, g) => {
        for (let i = 0; i < n; i++) t.push([50 + g * 83 + (i % 4) * 17, 560 - Math.floor(i / 4) * 21, 14, g === 9 ? RED : INK]);
      });
      return { t, l: [[50, 612, 'safest hours', 'left'], [866, 612, 'riskiest hours', 'right'], [866, 92, '24% of delays', 'right']] };
    },
    // 541 test days by what the model said and whether it was right (196, 170, 77, 98).
    stock() {
      const t = [], l = [];
      [[131, 0, 0, INK, 'said up, right'], [113, 1, 0, RED, 'said up, wrong'], [51, 0, 1, INK, 'said down, right'], [65, 1, 1, RED, 'said down, wrong']].forEach(([n, c, r, k, text]) => {
        for (let i = 0; i < n; i++) t.push([50 + c * 440 + (i % 16) * 24, 120 + r * 300 + Math.floor(i / 16) * 24, 19, k]);
        l.push([50 + c * 440, 98 + r * 300, text, 'left']);
      });
      return { t, l };
    },
    // K-means groups of 34 Ontario cities (1, 13, 20). Ten tiles make one city.
    covid() {
      const t = [], l = [];
      let y = 84;
      [[1, RED, 'Toronto, on its own'], [13, INK, '13 cities, next most cases'], [20, GREY, '20 cities, fewest cases']].forEach(([n, k, text]) => {
        l.push([50, y, text, 'left']);
        for (let c = 0; c < n; c++) for (let i = 0; i < 10; i++) {
          t.push([50 + (c % 7) * 118 + (i % 5) * 20, y + 18 + Math.floor(c / 7) * 58 + Math.floor(i / 5) * 20, 16, k]);
        }
        y += Math.ceil(n / 7) * 58 + 64;
      });
      for (let i = 0; t.length < N; i++) t.push(bench(i));
      return { t, l };
    },
    // R-squared of the sugar model: 95.5% explained, 4.5% not.
    sugar() {
      const t = [];
      for (let i = 0; i < N; i++) t.push([50 + (i % 24) * 34, 78 + Math.floor(i / 24) * 34, 27, i >= 344 ? RED : INK]);
      return { t, l: [[50, 622, '95.5% explained', 'left'], [866, 622, '4.5% not', 'right']] };
    },
    contact() {
      const t = [], l = [];
      ['Email', 'LinkedIn', 'GitHub'].forEach((text, g) => {
        l.push([50, 106 + g * 190, text, 'left']);
        for (let i = 0; i < 120; i++) t.push([50 + (i % 40) * 20.4, 126 + g * 190 + Math.floor(i / 40) * 24, 16, [RED, INK, GREY][g]]);
      });
      return { t, l };
    },
  };

  function mount(canvas, first) {
    const ctx = canvas.getContext('2d');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(pointer: fine)').matches;
    let name = first, scene = scenes[first](), from = scene.t, now = scene.t.map((a) => a.slice());
    let start = 0, done = true, raf = 0, px = -999, py = -999, k = 1, ox = 0, oy = 0, dpr = 1;

    function size() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      k = Math.min(r.width / W, r.height / H);
      ox = (r.width - W * k) / 2;
      oy = (r.height - H * k) / 2;
      paint();
    }
    function paint() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * ox, dpr * oy);
      for (const [x, y, s, c] of now) {
        let dx = 0, dy = 0;
        const vx = x + s / 2 - px, vy = y + s / 2 - py, d = Math.hypot(vx, vy);
        if (d < 80 && d > 0) { const f = (1 - d / 80) * 22 / d; dx = vx * f; dy = vy * f; }
        ctx.fillStyle = c;
        ctx.fillRect(x + dx, y + dy, s, s);
      }
      if (done) {
        ctx.fillStyle = INK;
        ctx.font = `600 ${Math.max(22, 13 / k)}px Archivo, sans-serif`;
        for (const [x, y, text, align] of scene.l) { ctx.textAlign = align; ctx.fillText(text, x, y); }
      }
    }
    function step(ts) {
      const p = Math.min(1, (ts - start) / 1300);
      for (let i = 0; i < N; i++) {
        const a = from[i], b = scene.t[i];
        const d = Math.min(1, Math.max(0, p * 1.7 - (i % 100) / 143));
        const e = d < .5 ? 4 * d * d * d : 1 - Math.pow(-2 * d + 2, 3) / 2;
        now[i] = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e, e > .5 ? b[3] : a[3]];
      }
      done = p >= 1;
      paint();
      if (!done) raf = requestAnimationFrame(step);
    }
    function go(next) {
      if (next === name) return;
      name = next;
      from = now.map((a) => a.slice());
      scene = scenes[next]();
      cancelAnimationFrame(raf);
      if (still || document.hidden) { now = scene.t.map((a) => a.slice()); done = true; paint(); return; }
      done = false;
      start = performance.now();
      raf = requestAnimationFrame(step);
    }
    if (fine && !still) {
      canvas.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        px = (e.clientX - r.left - ox) / k; py = (e.clientY - r.top - oy) / k;
        if (done) paint();
      });
      canvas.addEventListener('pointerleave', () => { px = py = -999; if (done) paint(); });
    }
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
