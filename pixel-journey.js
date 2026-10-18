(() => {
  'use strict';
  const section = document.querySelector('.services');
  const scene = document.querySelector('.scroll-scene');
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.pixel-journey');
  const contact = document.querySelector('.contact-button');
  const logo = document.querySelector('.pixel-logo');
  const icons = [...document.querySelectorAll('.service-pixel-icon')];
  const slots = [...document.querySelectorAll('.service-slot')];
  if (!canvas || !contact || !icons.length || icons.length !== slots.length) return;
  const ctx = canvas.getContext('2d');
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--pixel-color').trim();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileDevice = matchMedia('(max-width: 700px)');
  const phoneRows = ['00011111000','00100000100','00101110100','00100000100','00100000100','00100000100','00100000100','00100000100','00100100100','00011111000','00000000000'];
  const patterns = [
    ['00000000000','01111111110','01000000010','01000000010','01000000010','01000000010','01000000010','01111111110','00001010000','00111111100','00000000000'],
    ['00000000000','00000001000','00100010100','01000010010','10000100001','01000100010','00101000100','00001000000','00010000000','00000000000','00000000000'],
    Array.from({ length: 11 }, (_, row) => Array.from({ length: 11 }, (_, column) => {
      const x = Math.abs(column - 5), y = Math.abs(row - 5), distance = Math.hypot(x, y);
      const ring = distance >= 2.1 && distance <= 4.2;
      const teeth = (x <= 1 && y >= 3) || (y <= 1 && x >= 3) || (x >= 3 && x <= 4 && y >= 3 && y <= 4);
      return ring || teeth ? '1' : '0';
    }).join(''))
  ];
  const targets = [];
  function scatter(pixel, index) {
    const sample = salt => {
      const n = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    const amount = .22;
    const variation = { dx: (sample(1) * 2 - 1) * amount,
      dy: (sample(2) * 2 - 1) * amount, angle: (sample(3) * 2 - 1) * 14,
      scale: .84 + sample(4) * .32 };
    pixel.style.setProperty('--offset-x', `${variation.dx}px`);
    pixel.style.setProperty('--offset-y', `${variation.dy}px`);
    pixel.style.setProperty('--turn', `${variation.angle}deg`);
    pixel.style.setProperty('--pixel-scale', variation.scale);
    return variation;
  }
  function coordinates(rows) {
    return rows.flatMap((row, y) => [...row].flatMap((cell, x) => cell === '1' ? [{ x, y }] : []));
  }
  const devices = [coordinates(patterns[0]), coordinates(phoneRows)];
  function place(pixel, point) {
    pixel.style.left = `calc(${point.x / 11 * 100}% + .4px)`;
    pixel.style.top = `calc(${point.y / 11 * 100}% + .4px)`;
  }
  patterns.slice(0, icons.length).forEach((rows, group) => {
    const shape = group === 0 ? devices[Number(mobileDevice.matches)] : coordinates(rows);
    const count = group === 0 ? Math.max(...devices.map(points => points.length)) : shape.length;
    for (let index = 0; index < count; index++) {
      const point = shape[index % shape.length];
      const pixel = document.createElement('span');
      place(pixel, point);
      icons[group].append(pixel);
      targets.push({ group, x: point.x, y: point.y, pixel, ...scatter(pixel, targets.length) });
    }
  });
  document.addEventListener('codin:preview-mode', event => {
    const shape = devices[Number(event.detail.mode === 'mobile')];
    targets.filter(target => target.group === 0).forEach((target, index) => {
      const point = shape[index % shape.length];
      target.x = point.x; target.y = point.y;
      place(target.pixel, point);
    });
  });
  const clamp = n => Math.max(0, Math.min(1, n));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (n, a = 0, b = 1) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };
  let points = [], mode = 'waiting', started = 0, frameId = 0;
  const duration = 2500;
  document.body.classList.add('pixel-journey-ready');

  function resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function finish() {
    mode = 'done';
    document.body.classList.add('pixel-journey-done');
    contact.removeAttribute('aria-hidden');
    contact.removeAttribute('tabindex');
    contact.style.removeProperty('opacity');
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function reset() {
    stopHover();
    cancelAnimationFrame(frameId); frameId = 0;
    mode = 'waiting'; points = [];
    document.body.classList.remove('pixel-journey-done');
    contact.removeAttribute('aria-hidden'); contact.removeAttribute('tabindex');
    contact.style.removeProperty('opacity');
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function start() {
    if (reduced) { finish(); return; }
    const detail = { count: targets.length, points: [] };
    document.dispatchEvent(new CustomEvent('codin:collect-seeds', { detail }));
    // Wait for the actual hero cloud instead of inventing replacement particles.
    if (detail.points.length < targets.length) {
      document.dispatchEvent(new CustomEvent('codin:return-seeds'));
      return;
    }
    points = detail.points;
    started = performance.now(); mode = 'flying';
    frameId = requestAnimationFrame(paint);
  }
  function paint(now) {
    frameId = 0;
    if (mode !== 'flying') return;
    const progress = clamp((now - started) / duration);
    const bounds = slots.map(slot => slot.getBoundingClientRect());
    const metrics = icons.map(icon => {
      const css = getComputedStyle(icon);
      return { size: parseFloat(css.getPropertyValue('--icon-size')), inset: parseFloat(css.getPropertyValue('--icon-inset')) };
    });
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    targets.forEach((target, index) => {
      const origin = points[index];
      let x, y, size;
      const box = bounds[target.group], metric = metrics[target.group];
      const cell = metric.size / 11;
      x = box.right - metric.inset - metric.size + (target.x + .5) * cell;
      y = box.top + metric.inset + (target.y + .5) * cell;
      size = cell - .8;
      x += target.dx; y += target.dy;
      const travel = ease(progress, (index % 19) * .008, .78 + (index % 13) * .01);
      const arc = Math.sin(travel * Math.PI);
      const px = mix(origin.x, x, travel) + arc * (target.group - 1.2) * 45;
      const py = mix(origin.y, y, travel) + arc * Math.min(innerHeight * .22, 150);
      const side = mix(origin.size, size * target.scale, ease(travel, .7, 1));
      ctx.globalAlpha = mix(origin.alpha, 1, travel);
      ctx.fillStyle = ink;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(target.angle * Math.PI / 180 * travel);
      ctx.fillRect(-side / 2, -side / 2, side, side);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    if (progress >= 1) finish(); else frameId = requestAnimationFrame(paint);
  }
  function onScroll() {
    const from = scene.getBoundingClientRect().top + scrollY;
    if (scrollY <= from + 2) { if (mode !== 'waiting') reset(); return; }
    if (mode === 'waiting' && scrollY >= from + hero.offsetHeight * .55) start();
  }
  let hoverTimer = 0;
  const sparks = new Set();
  function canHover(target) {
    return target === contact || target.classList.contains('docked');
  }
  function emitPixels(count = 3, target = contact) {
    if (reduced || !canHover(target) || document.hidden) return;
    const box = target.getBoundingClientRect();
    for (let index = 0; index < count; index++) {
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.cos(angle), dy = Math.sin(angle);
      const edge = Math.min(box.width / 2 / Math.max(.001, Math.abs(dx)), box.height / 2 / Math.max(.001, Math.abs(dy)));
      const pixel = document.createElement('span');
      const size = 3 + Math.random() * 2;
      pixel.className = 'contact-hover-pixel';
      pixel.setAttribute('aria-hidden', 'true');
      pixel.style.left = `${box.left + box.width / 2 + dx * edge}px`;
      pixel.style.top = `${box.top + box.height / 2 + dy * edge}px`;
      pixel.style.width = pixel.style.height = `${size}px`;
      document.body.append(pixel); sparks.add(pixel);
      const distance = 6 + Math.random() * 8;
      const rotation = Math.random() * 160 - 80;
      const animation = pixel.animate([
        { transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(.6)`, opacity: .9 },
        { transform: `translate(calc(-50% + ${dx * distance}px), calc(-50% + ${dy * distance}px)) rotate(${rotation + 60}deg) scale(.2)`, opacity: 0 }
      ], { duration: 1400 + Math.random() * 600, easing: 'ease-out' });
      animation.onfinish = () => { pixel.remove(); sparks.delete(pixel); };
    }
  }
  function stopHover() {
    clearInterval(hoverTimer); hoverTimer = 0;
    logo?.classList.remove('is-hovering');
    sparks.forEach(pixel => pixel.remove()); sparks.clear();
  }
  function bindHover(target) {
    if (!target) return;
    target.addEventListener('pointerenter', () => {
      if (reduced || !canHover(target)) return;
      stopHover();
      if (target === logo) logo.classList.add('is-hovering');
      emitPixels(6, target);
      hoverTimer = setInterval(() => emitPixels(3, target), 280);
    });
    target.addEventListener('pointerleave', stopHover);
    target.addEventListener('pointercancel', stopHover);
  }
  bindHover(contact);
  bindHover(logo);
  addEventListener('blur', stopHover);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopHover(); });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', resize);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    resize(); reset();
    const from = scene.getBoundingClientRect().top + scrollY;
    if (scrollY >= from + hero.offsetHeight) finish(); else onScroll();
  });
})();
