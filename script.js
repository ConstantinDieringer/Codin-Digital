(() => {
  'use strict';
  const canvas = document.querySelector('#particles');
  const ctx = canvas.getContext('2d');
  const word = document.querySelector('#word');
  const heading = document.querySelector('h1');
  const title = 'Codin-Digital';
  const scene = document.querySelector('.scroll-scene');
  const hero = document.querySelector('.hero');
  const logo = document.querySelector('.pixel-logo');
  const interfaceBar = document.querySelector('.interface');
  const ambient = document.querySelector('.ambient-light');
  const cursor = document.querySelector('.cursor');
  const scrollCue = document.querySelector('.scroll-cue');
  const pixelColor = getComputedStyle(document.documentElement).getPropertyValue('--pixel-color').trim();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: -10000, y: -10000, movedAt: -Infinity };
  const camera = { x: 0, y: 0 };
  const ripples = [];
  let lastRipple = -10;
  let width, height, particles = [], exploded = false, previous = 0, elapsed = 0;
  let animationId = 0;
  let scrollProgress = 0, scrollQueued = false, letters = [];
  let letterGeometry = [], sceneStart = 0, scrollDistance = 1;
  let initialized = false;
  const repulsionRadius = 56;
  document.addEventListener('codin:collect-seeds', event => {
    const bounds = canvas.getBoundingClientRect();
    const fieldAlpha = Number(canvas.style.opacity || 1);
    const selected = new Set();
    const count = Math.min(1200, Math.max(1, event.detail.count || 3));
    event.detail.points = Array.from({ length: count }, (_, index) => count === 3 ? [.35, .5, .65][index] : .08 + (index * .61803398875 % 1) * .84).map(fraction => {
      let nearest = null, best = Infinity;
      for (const particle of particles) {
        if (particle.seedTaken || selected.has(particle) || particle.x < 0 || particle.x > width || particle.y < 0 || particle.y > height) continue;
        const distance = Math.hypot(particle.x - width * fraction, particle.y - height * .58);
        if (distance < best) { nearest = particle; best = distance; }
      }
      if (!nearest) return null;
      selected.add(nearest);
      nearest.seedTaken = true;
      return { x: bounds.left + nearest.x / width * bounds.width,
        y: bounds.top + nearest.y / height * bounds.height,
        size: nearest.size * nearest.renderScale * bounds.width / width,
        alpha: Math.min(1, nearest.alpha + nearest.energy * .4) * fieldAlpha };
    }).filter(Boolean);
  });
  document.addEventListener('codin:return-seeds', () => {
    particles.forEach(particle => { particle.seedTaken = false; });
  });
  const logoGlyphs = document.createElement('span');
  logoGlyphs.className = 'logo-glyphs';
  logoGlyphs.setAttribute('aria-hidden', 'true');
  for (const character of 'CD') {
    const letter = document.createElement('span');
    letter.className = 'logo-letter';
    letter.textContent = character;
    logoGlyphs.append(letter);
  }
  logo.append(logoGlyphs);
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = (value, start, end) => {
    const t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const random = (min, max) => min + Math.random() * (max - min);
  const fieldMargin = () => Math.min(width, height) * .16 + 180;
  // Reflect destinations instead of pulling particles against the lower wall.
  function reflectY(y, limit) {
    const phase = ((y % (limit * 2)) + limit * 2) % (limit * 2);
    return phase <= limit ? phase : limit * 2 - phase;
  }

  function containParticle(p) {
    // Include the full energized halo, so no part is clipped at the wall.
    const radius = p.size * p.renderScale * (p.energy > .6 && p.depth > .8 ? 1.7 : .5) + 1;
    const bottom = Math.max(radius, height - radius);
    if (p.y > bottom) {
      p.y = Math.max(radius, bottom - (p.y - bottom));
      p.vy = -Math.abs(p.vy) * .72;
    }
    if (p.y < radius) {
      p.y = Math.min(bottom, radius + (radius - p.y));
      p.vy = Math.abs(p.vy) * .72;
    }
  }

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    const x = (event.clientX - bounds.left) * width / bounds.width;
    const y = (event.clientY - bounds.top) * height / bounds.height;
    return x >= 0 && y >= 0 && x <= width && y <= height ? { x, y } : null;
  }

  function pointerInfluence(now) {
    return 1 - smooth(now - pointer.movedAt, 80, 300);
  }

  function repel(p, dx, dy, distance, dt, influence = 1) {
    if (distance >= repulsionRadius) return;
    const length = Math.hypot(dx, dy);
    const nx = length ? dx / length : Math.cos(p.phase);
    const ny = length ? dy / length : Math.sin(p.phase);
    const strength = clamp(1 - distance / repulsionRadius) * influence;
    const force = strength ** 2 * 2400 * dt;
    p.vx += (nx - ny * .5) * force;
    p.vy += (ny + nx * .5) * force;
    p.energy = Math.min(1.5, p.energy + strength);
    p.renderScale += strength * .8;
  }

  function measureScroll() {
    letters.forEach(letter => { letter.style.transform = ''; });
    const stage = hero.getBoundingClientRect();
    letterGeometry = letters.map(letter => {
      const bounds = letter.getBoundingClientRect();
      return { x: bounds.left + bounds.width / 2 - stage.left, y: bounds.top + bounds.height / 2 - stage.top,
        left: bounds.left - stage.left, top: bounds.top - stage.top, width: bounds.width, height: bounds.height };
    });
    sceneStart = scene.getBoundingClientRect().top + scrollY;
    scrollDistance = Math.max(1, hero.offsetHeight * .45);
  }

  function updateScroll() {
    scrollQueued = false;
    scrollProgress = clamp((scrollY - sceneStart) / scrollDistance);
    const p = scrollProgress;
    const fade = smooth(p, .015, .2);
    const gather = reduced ? Number(p >= .3) : smooth(p, .12, .42);
    const joined = p >= .43;
    const dock = reduced ? Number(p >= .85) : smooth(p, .59, .98);
    const font = getComputedStyle(heading);
    const fontSize = parseFloat(font.fontSize);
    const mobileHeader = width <= 760;
    const inset = mobileHeader ? 16 : 36;
    const navigationBounds = mobileHeader ? document.querySelector('.site-navigation')?.getBoundingClientRect() : null;
    const topInset = navigationBounds ? navigationBounds.top + (navigationBounds.height - 30) / 2 : (mobileHeader ? 12 : 16);
    const logoScale = mix(fontSize / 100, 42 / 70, dock);
    const centerY = hero.offsetHeight / 2;
    const logoX = mix(width / 2 - fontSize * .35, inset, dock);
    const logoY = mix(hero.getBoundingClientRect().top + centerY - fontSize * .3, topInset, dock);
    letters.forEach((letter, index) => {
      const retained = index === 0 || index === title.indexOf('D');
      const initial = letterGeometry[index];
      if (!initial) return;
      let shiftX = 0, shiftY = -12 * fade;
      if (!retained) {
        letter.style.opacity = 1 - fade;
        letter.style.transform = `translateY(${shiftY}px)`;
      } else {
        // Share one grid column: the resulting seven-column mark is symmetric.
        const targetLeft = width / 2 - (index === 0 ? fontSize * .35 : fontSize * .05);
        shiftX = (targetLeft - initial.left) * gather;
        shiftY = (centerY - initial.y) * gather;
        letter.style.opacity = joined ? 0 : 1;
        letter.style.color = 'var(--logo-color)';
        letter.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
      }
    });
    cursor.style.opacity = 1 - fade;
    cursor.style.visibility = p > .2 ? 'hidden' : '';
    const fieldOpacity = 1;
    canvas.style.opacity = fieldOpacity;
    ambient.style.opacity = exploded ? fieldOpacity : 0;
    if (p > 0) interfaceBar.style.transition = 'none';
    interfaceBar.style.opacity = exploded ? 1 - fade : 0;
    interfaceBar.style.pointerEvents = p > .1 ? 'none' : '';
    logo.style.opacity = joined ? 1 : 0;
    logo.style.visibility = joined ? 'visible' : 'hidden';
    logo.style.transform = `translate(${logoX}px, ${logoY}px) scale(${logoScale})`;
    logo.classList.toggle('docked', dock > .99);
    logo.tabIndex = dock > .99 ? 0 : -1;
    if (exploded && !reduced && scrollY < sceneStart + hero.offsetHeight && !animationId && !document.hidden) {
      previous = 0;
      animationId = requestAnimationFrame(frame);
    }
  }

  function queueScroll() {
    if (!initialized) return;
    if (!exploded && scrollY > 0) completeTitle();
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); }
  }

  function resize() {
    if (!initialized) return;
    const oldWidth = width || innerWidth, oldHeight = height || innerHeight;
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    for (const p of particles) {
      p.homeX *= width / oldWidth; p.homeY *= height / oldHeight;
      p.x *= width / oldWidth; p.y *= height / oldHeight;
    }
    measureScroll();
    updateScroll();
    if (exploded && reduced) draw();
  }

  function explode() {
    if (exploded) return;
    exploded = true;
    document.body.classList.add('ready');
    const bounds = word.getBoundingClientRect();
    const font = getComputedStyle(heading);
    updateScroll();
    const mask = document.createElement('canvas');
    const mw = Math.ceil(bounds.width + 20), mh = Math.ceil(bounds.height + 20);
    mask.width = mw; mask.height = mh;
    const brush = mask.getContext('2d', { willReadFrequently: true });
    brush.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
    brush.textBaseline = 'middle'; brush.letterSpacing = font.letterSpacing;
    brush.fillText(title, 10, mh / 2);
    const pixels = brush.getImageData(0, 0, mw, mh).data;
    const origins = [];
    for (let y = 0; y < mh; y += 3) {
      for (let x = 0; x < mw; x += 3) {
        if (pixels[(y * mw + x) * 4 + 3] > 100) origins.push({ x: bounds.left + x - 10, y: bounds.top + y - 10 });
      }
    }
    const margin = fieldMargin();
    const fieldWidth = width + margin * 2, fieldHeight = height + margin * 2;
    const count = Math.min(24000, Math.max(3000, Math.round(fieldWidth * fieldHeight / 180)));
    const cols = Math.ceil(Math.sqrt(count * fieldWidth / fieldHeight)), rows = Math.ceil(count / cols);
    particles = Array.from({ length: count }, (_, i) => {
      const origin = origins[Math.floor(Math.random() * origins.length)] || { x: width / 2, y: height / 2 };
      const homeX = ((i % cols) + random(.12, .88)) / cols * fieldWidth - margin;
      const ribbon = Math.random() < .6, lane = Math.floor(random(0, 5));
      const bandOffset = random(-1, 1) ** 3 * .09;
      const homeY = ribbon
        ? height * (.1 + lane * .2 + Math.sin(homeX / width * 5.2 + lane * 1.5) * .14 + bandOffset)
        : (Math.floor(i / cols) + random(.12, .88)) / rows * fieldHeight - margin;
      const angle = Math.atan2(homeY - origin.y, homeX - origin.x), speed = random(200, 650);
      const particle = { x: reduced ? homeX : origin.x, y: reduced ? homeY : origin.y, homeX, homeY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        driftAngle: random(0, Math.PI * 2), driftSpeed: random(6, 16),
        depth: random(.2, 1), energy: 0, renderScale: 1, ribbon, lane, bandOffset,
        size: random(1, 2.8), alpha: random(.22, .7), phase: random(0, Math.PI * 2) };
      return particle;
    });
    if (reduced) draw(); else if (!animationId) animationId = requestAnimationFrame(frame);
    updateScroll();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      if (p.seedTaken) continue;
      const size = p.size * p.renderScale, energy = p.energy;
      containParticle(p);
      ctx.globalAlpha = Math.min(1, p.alpha + energy * .4);
      ctx.fillStyle = pixelColor;
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      if (energy > .6 && p.depth > .8) {
        ctx.globalAlpha = (energy - .6) * .16;
        ctx.fillRect(p.x - size * 1.7, p.y - size * 1.7, size * 3.4, size * 3.4);
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (scrollY >= sceneStart + hero.offsetHeight) { animationId = 0; previous = 0; return; }
    const dt = previous ? Math.min((now - previous) / 1000, .035) : 1 / 60;
    previous = now; elapsed += dt;
    const settle = Math.min(elapsed / 2.5, 1);
    const amplitude = Math.min(width, height) * .13, margin = fieldMargin();
    const influence = pointerInfluence(now);
    const hasPointer = pointer.x > -1000 && influence > 0, cameraBlend = 1 - Math.exp(-dt * 2);
    camera.x += ((hasPointer ? (pointer.x / width - .5) * 24 * influence : 0) - camera.x) * cameraBlend;
    camera.y += ((hasPointer ? (pointer.y / height - .5) * 24 * influence : 0) - camera.y) * cameraBlend;
    while (ripples.length && elapsed - ripples[0].time > 3) ripples.shift();
    for (const p of particles) {
      const direction = p.driftAngle + Math.sin(elapsed * .12 + p.phase) * .65;
      p.homeX += Math.cos(direction) * p.driftSpeed * dt;
      if (p.ribbon) {
        p.homeY = height * (.1 + p.lane * .2
          + Math.sin(p.homeX / width * 5.2 + p.lane * 1.5 - elapsed * .19) * .14
          + Math.sin(p.homeX / width * 2.8 - p.lane + elapsed * .12) * .07 + p.bandOffset);
      } else p.homeY += Math.sin(direction) * p.driftSpeed * dt;
      const wrapX = p.homeX < -margin ? width + margin * 2 : p.homeX > width + margin ? -(width + margin * 2) : 0;
      p.homeX += wrapX; p.x += wrapX;
      if (!p.ribbon && (p.homeY < 0 || p.homeY > height)) p.driftAngle = -p.driftAngle;
      p.homeY = reflectY(p.homeY, height);
      const nx = p.homeX / width, ny = p.homeY / height;
      const diagonal = Math.sin(nx * 8 + ny * 6 - elapsed * .5);
      const curved = Math.sin(ny * 10 - nx * 4 + Math.sin(nx * 5 + elapsed * .16) * 2 + elapsed * .32);
      const radial = Math.sin(Math.hypot(nx - .65, ny - .35) * 13 - elapsed * .42);
      const waveX = (diagonal * .5 + curved * .32 + radial * .18) * amplitude;
      const waveY = (curved * .45 - diagonal * .35 + radial * .2) * amplitude;
      const flow = Math.sin(nx * 5 + ny * 3 - elapsed * .16 + p.depth * 2) * 25;
      const lift = Math.min(1, Math.abs(diagonal * .45 + curved * .35 + radial * .2));
      const perspective = 1 + lift * .1 * p.depth;
      let targetX = width / 2 + (p.homeX - width / 2) * perspective + waveX + flow + camera.x * p.depth;
      let targetY = height / 2 + (p.homeY - height / 2) * perspective + waveY + flow * .6 + camera.y * p.depth;
      targetY = reflectY(targetY, height);
      p.energy = lift * .8; p.renderScale = .6 + p.depth * .65 + lift * p.depth * 1.8;
      for (const ripple of ripples) {
        const rx = p.x - ripple.x, ry = p.y - ripple.y, rd = Math.hypot(rx, ry), age = elapsed - ripple.time;
        const ring = Math.exp(-(((rd - age * 260) / 75) ** 2)) * Math.exp(-age * .85);
        targetX += rx / (rd || 1) * ring * 85; targetY += ry / (rd || 1) * ring * 85;
        const kick = ring * 360 * dt;
        p.vx += rx / (rd || 1) * kick; p.vy += ry / (rd || 1) * kick;
        p.energy = Math.min(1.5, p.energy + ring); p.renderScale += ring * 1.5;
      }
      p.vx += (targetX - p.x) * (2 + settle * 8) * dt;
      p.vy += (targetY - p.y) * (2 + settle * 8) * dt;
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      if (hasPointer) repel(p, dx, dy, Math.hypot(dx, dy), dt, influence);
      const damping = Math.exp(-(2 + settle * 2) * dt);
      p.vx *= damping; p.vy *= damping;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    draw(); animationId = requestAnimationFrame(frame);
  }

  scrollCue.addEventListener('click', () => {
    if (!initialized) return;
    window.scrollTo({ top: sceneStart + scene.offsetHeight, behavior: reduced ? 'instant' : 'smooth' });
  });
  addEventListener('pointerdown', e => {
    if (!exploded || reduced || e.target.closest('button, a') || elapsed - lastRipple < .25) return;
    const point = canvasPoint(e);
    if (!point) return;
    ripples.push({ ...point, time: elapsed }); lastRipple = elapsed;
  });
  addEventListener('resize', resize);
  addEventListener('scroll', queueScroll, { passive: true });
  logo.addEventListener('click', e => {
    e.preventDefault();
    window.scrollTo({ top: sceneStart, behavior: reduced ? 'instant' : 'smooth' });
  });
  addEventListener('pointermove', e => {
    const point = canvasPoint(e);
    if (!point) { pointer.movedAt = -Infinity; return; }
    if (Math.hypot(point.x - pointer.x, point.y - pointer.y) > .1) pointer.movedAt = performance.now();
    pointer.x = point.x; pointer.y = point.y;
  }, { passive: true });
  addEventListener('pointerout', e => { if (!e.relatedTarget) pointer.movedAt = -Infinity; });
  addEventListener('blur', () => { pointer.movedAt = -Infinity; });
  document.addEventListener('visibilitychange', () => {
    if (!exploded || reduced) return;
    if (document.hidden) { cancelAnimationFrame(animationId); animationId = 0; }
    else updateScroll();
  });
  let index = 0;
  function completeTitle() {
    if (exploded) return;
    word.textContent = '';
    letters = [...title].map(character => {
      const letter = document.createElement('span');
      letter.className = 'letter';
      letter.textContent = character;
      word.append(letter);
      return letter;
    });
    measureScroll();
    explode();
  }
  function type() {
    if (exploded) return;
    word.textContent = title.slice(0, ++index);
    if (index < title.length) setTimeout(type, random(85, 175)); else setTimeout(completeTitle, 550);
  }
  const fontReady = document.fonts ? document.fonts.load('400 100px "Codin Pixel"') : Promise.resolve();
  fontReady.catch(() => {}).then(() => {
    initialized = true;
    resize();
    if (scrollY > 0) completeTitle();
    setTimeout(type, 1250);
  });
})();
