// Small shared helpers for the case-study charts: element builders and one tooltip.
const NS = 'http://www.w3.org/2000/svg';

function el(tag, attrs = {}, text) {
  const n = document.createElement(tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text !== undefined) n.textContent = text;
  return n;
}
function sv(tag, attrs = {}, text) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text !== undefined) n.textContent = text;
  return n;
}

const tip = el('div', { id: 'tip', role: 'status' });
document.body.append(tip);
function showTip(x, y, value, label) {
  tip.replaceChildren(el('b', {}, value), document.createTextNode(label));
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x - w / 2)) + 'px';
  tip.style.top = (y - h - 14 < 8 ? y + 18 : y - h - 14) + 'px';
  tip.style.opacity = 1;
}
function hideTip() { tip.style.opacity = 0; }

// Give a mark a tooltip on hover and keyboard focus.
function hint(node, value, label, focusable = true) {
  node.classList.add('mark');
  if (focusable) node.setAttribute('tabindex', '0');
  node.setAttribute('role', 'img');
  node.setAttribute('aria-label', label + ': ' + value);
  node.addEventListener('pointermove', (e) => showTip(e.clientX, e.clientY, value, label));
  node.addEventListener('pointerleave', hideTip);
  node.addEventListener('focus', () => {
    const r = node.getBoundingClientRect();
    showTip(r.left + r.width / 2, r.top, value, label);
  });
  node.addEventListener('blur', hideTip);
}

// Column chart with rounded tops, value labels on the first and last columns.
function columns(svg, values, { label, max, ticks, tickText, xText, tipText }) {
  const W = innerWidth < 760 ? 340 : 460, H = 240, L = 38, B = 30, T = 18;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const y = (v) => H - B - (v / max) * (H - B - T);
  ticks.forEach((t) => {
    svg.append(sv('line', { x1: L, x2: W, y1: y(t), y2: y(t), stroke: 'rgba(0,0,0,.13)' }));
    svg.append(sv('text', { x: L - 6, y: y(t) + 4, 'text-anchor': 'end' }, tickText(t)));
  });
  const step = (W - L) / values.length, bw = Math.min(24, step - 6);
  values.forEach((v, i) => {
    const x = L + step * i + (step - bw) / 2, top = y(v), b = H - B;
    const p = sv('path', { fill: '#d91e18', d: `M${x} ${b}V${top}H${x + bw}V${b}z` });
    hint(p, tipText(v, i), label(i));
    svg.append(p, sv('text', { x: x + bw / 2, y: H - 10, 'text-anchor': 'middle' }, xText(i)));
    if (i === 0 || i === values.length - 1) svg.append(sv('text', { x: x + bw / 2, y: top - 6, 'text-anchor': 'middle', class: 'strong' }, tipText(v, i)));
  });
}
