(() => {
  'use strict';
  const canvas = document.querySelector('.pixel-route');
  const service = document.querySelector('.services');
  const icon = document.querySelector('.service-pixel-icon');
  const portfolioSection = document.querySelector('#portfolio');
  const aboutSection = document.querySelector('#ueber-mich');
  const timelineSection = document.querySelector('#ablauf');
  const timelineSteps = [...document.querySelectorAll('.timeline-step')];
  const timelineNodes = [...document.querySelectorAll('.timeline-node')];
  const linkedIn = document.querySelector('.about-linkedin');
  const marks = [...document.querySelectorAll('[data-pixel-mark]')];
  const patterns = window.CODIN_PORTFOLIO_MARKS;
  if (!canvas || !service || !icon || !linkedIn || !portfolioSection || !aboutSection || marks.length !== 3 || !patterns) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--pixel-color').trim();
  const clamp = value => Math.max(0, Math.min(1, value));
  const progress = (value, start, end) => clamp((value - start) / Math.max(1, end - start));
  const mix = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const groups = marks.map(mark => {
    const localCanvas = document.createElement('canvas');
    localCanvas.className = 'portfolio-mark-canvas';
    localCanvas.setAttribute('aria-hidden', 'true');
    mark.append(localCanvas);
    return { mark, pattern: patterns[mark.dataset.pixelMark], localCanvas, paintKey: '' };
  });
  const timelineLayout = document.querySelector('.timeline-layout');
  const timelineSurface = timelineLayout ? document.createElement('canvas') : null;
  let timelinePaintKey = '';
  if (timelineSurface) {
    timelineSurface.className = 'timeline-pixel-canvas';
    timelineSurface.setAttribute('aria-hidden', 'true');
    timelineLayout.append(timelineSurface);
  }
  const count = groups.reduce((total, group) => total + group.pattern.points.length, 0);
  let frame = 0, linkedinPattern = null;
  let stage = 'services', flight = null, timelineStarted = null;
  const flightDuration = 1100;

  function makeLinkedInPattern() {
    const mask = document.createElement('canvas');
    mask.width = 158; mask.height = 46;
    const brush = mask.getContext('2d');
    brush.strokeStyle = '#000'; brush.lineWidth = 1.8;
    brush.beginPath();
    brush.roundRect(2, 2, 154, 42, 21);
    brush.fillStyle = '#000'; brush.fill();
    const pixels = brush.getImageData(0, 0, 158, 46).data;
    const points = [];
    for (let y = 1; y < 46; y += 2) for (let x = 1; x < 158; x += 2) {
      if (pixels[(y * 158 + x) * 4 + 3] > 65) points.push([x, y]);
    }
    return { width: 158, height: 46, points, spacing: 2, fill: 1.04 };
  }

  function fit(pattern, box, maxCell = Infinity) {
    const cell = Math.min(box.width / pattern.width, box.height / pattern.height, maxCell);
    const left = box.left + (box.width - pattern.width * cell) / 2;
    const top = box.top + scrollY + (box.height - pattern.height * cell) / 2;
    return pattern.points.map(([x, y]) => ({ x: left + (x + .5) * cell, y: top + (y + .5) * cell,
      size: cell * (pattern.spacing || 1) * (pattern.fill || .84) }));
  }

  function originPoints() {
    const pixels = [...icon.children].map(pixel => pixel.getBoundingClientRect());
    if (!pixels.length) return [];
    // Subdivide the existing squares: the cloud continues without new particles popping in.
    const subdivisions = Math.ceil(Math.sqrt(Math.ceil(count / pixels.length)));
    const rows = Math.ceil(Math.ceil(count / pixels.length) / subdivisions);
    return Array.from({ length: count }, (_, index) => {
      const box = pixels[index % pixels.length];
      const part = Math.floor(index / pixels.length);
      const size = Math.min(box.width / subdivisions, box.height / rows);
      return { x: box.left + ((part % subdivisions) + .5) * box.width / subdivisions,
        y: box.top + scrollY + (Math.floor(part / subdivisions) + .5) * box.height / rows,
        size: size * .9 };
    });
  }

  function timelinePoints() {
    const boxes = timelineNodes.map(node => node.getBoundingClientRect());
    const points = [];
    boxes.forEach((box, step) => {
      const cell = Math.min(box.width, box.height) / 7;
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        if (x === 0 || x === 6 || y === 0 || y === 6) points.push({
          x: box.left + (x + .5) * cell, y: box.top + scrollY + (y + .5) * cell,
          size: cell * .74, step
        });
      }
      if (step === boxes.length - 1) return;
      const next = boxes[step + 1];
      const from = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
      const to = { x: next.left + next.width / 2, y: next.top + next.height / 2 };
      const length = Math.hypot(to.x - from.x, to.y - from.y);
      for (let distance = 22; distance < length - 22; distance += 5) {
        const t = distance / length;
        points.push({ x: mix(from.x, to.x, t), y: mix(from.y, to.y, t) + scrollY, size: 2.8, step });
      }
    });
    return Array.from({ length: count }, (_, index) => points[Math.floor(index * points.length / count)]);
  }

  function updateTimeline(now) {
    const settled = stage === 'timeline' && !flight;
    if (!settled) timelineStarted = null;
    else if (timelineStarted === null) timelineStarted = now;
    const active = settled ? Math.min(4, Math.floor((now - timelineStarted) / 950)) : -1;
    timelineSteps.forEach((step, index) => {
      step.classList.toggle('is-current', index === active);
      step.classList.toggle('is-complete', active > index);
    });
    return { active, playing: settled && active < 4 };
  }

  function pointsFor(targetStage) {
    if (targetStage === 'services') return originPoints();
    if (targetStage === 'timeline' && timelineNodes.length) return timelinePoints();
    if (targetStage === 'linkedin') {
      const points = fit(linkedinPattern, linkedIn.getBoundingClientRect());
      return Array.from({ length: count }, (_, index) => points[Math.floor(index * points.length / count)]);
    }
    return groups.flatMap(group => fit(group.pattern, group.mark.getBoundingClientRect(), group.mark.dataset.pixelMark === 'next' ? 6 : Infinity));
  }

  function paintAnchoredMarks() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    for (const group of groups) {
      const box = group.mark.getBoundingClientRect();
      const key = `${box.width}:${box.height}:${ratio}`;
      if (group.paintKey === key || !box.width || !box.height) continue;
      group.paintKey = key;
      const surface = group.localCanvas;
      surface.width = Math.round(box.width * ratio); surface.height = Math.round(box.height * ratio);
      const brush = surface.getContext('2d');
      brush.setTransform(ratio, 0, 0, ratio, 0, 0);
      brush.clearRect(0, 0, box.width, box.height);
      brush.fillStyle = ink;
      const points = fit(group.pattern, box, group.mark.dataset.pixelMark === 'next' ? 6 : Infinity);
      for (const point of points) {
        const x = point.x - box.left, y = point.y - box.top - scrollY;
        brush.fillRect(x - point.size / 2, y - point.size / 2, point.size, point.size);
      }
    }
  }

  function paintAnchoredTimeline(active) {
    const box = timelineLayout.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const offsets = timelineNodes.map(node => node.getBoundingClientRect().top - box.top).join(':');
    const key = `${box.width}:${box.height}:${ratio}:${active}:${offsets}`;
    if (timelinePaintKey === key || !box.width || !box.height) return;
    timelinePaintKey = key;
    timelineSurface.width = Math.round(box.width * ratio);
    timelineSurface.height = Math.round(box.height * ratio);
    const brush = timelineSurface.getContext('2d');
    brush.setTransform(ratio, 0, 0, ratio, 0, 0);
    brush.clearRect(0, 0, box.width, box.height);
    brush.fillStyle = ink;
    for (const point of timelinePoints()) {
      brush.globalAlpha = point.step > active ? .35 : 1;
      const x = point.x - box.left, y = point.y - box.top - scrollY;
      brush.fillRect(x - point.size / 2, y - point.size / 2, point.size, point.size);
    }
    brush.globalAlpha = 1;
  }

  function requestedStage() {
    // Scrolling only crosses these boundaries; flight progress is measured in time.
    if (aboutSection.getBoundingClientRect().top < innerHeight * .72) return 'linkedin';
    if (timelineSection && timelineSection.getBoundingClientRect().top < innerHeight * .72) return 'timeline';
    if (portfolioSection.getBoundingClientRect().top < innerHeight * .78 && service.getBoundingClientRect().bottom < innerHeight * .86) return 'portfolio';
    return 'services';
  }

  function interpolate(from, to, elapsed) {
    return to.map((target, index) => {
      const origin = from[index];
      const t = smooth(progress(elapsed, (index % 23) * 4.5, flightDuration));
      const arc = Math.sin(t * Math.PI);
      return {
        x: mix(origin.x, target.x, t) + arc * Math.sin(index * 2.399) * 65,
        y: mix(origin.y, target.y, t) + arc * Math.cos(index * 1.71) * 28,
        size: mix(origin.size, target.size, t) + arc * .8,
        step: target.step,
        angle: mix(origin.angle || 0, Math.sin(index * 2.7) * .025, t) + arc * Math.sin(index * 1.37) * .8
      };
    });
  }

  function render(now = performance.now()) {
    frame = 0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const ready = !motion.matches && document.body.classList.contains('pixel-journey-done') && service.classList.contains('is-expanded');
    document.body.classList.toggle('pixel-route-ready', ready);
    if (!ready) { service.classList.remove('route-departed'); document.body.classList.remove('linkedin-formed'); document.body.classList.remove('portfolio-formed'); document.body.classList.remove('timeline-formed'); stage = 'services'; flight = null; updateTimeline(now); return; }
    if (!icon.children.length || !linkedinPattern?.points.length) return;
    let destination = pointsFor(stage);
    let current = flight ? interpolate(flight.from, destination, now - flight.started) : destination;
    const wanted = requestedStage();
    if (wanted !== stage) {
      flight = { from: current, started: now };
      stage = wanted;
      destination = pointsFor(stage);
      current = interpolate(flight.from, destination, 0);
    }
    if (flight && now - flight.started >= flightDuration) {
      flight = null;
      current = destination;
    }
    const anchored = stage === 'portfolio' && !flight;
    document.body.classList.toggle('portfolio-formed', anchored);
    if (anchored) paintAnchoredMarks();
    const timeline = updateTimeline(now);
    const anchoredTimeline = Boolean(timelineSurface) && stage === 'timeline' && !flight;
    document.body.classList.toggle('timeline-formed', anchoredTimeline);
    if (anchoredTimeline) paintAnchoredTimeline(timeline.active);
    document.body.classList.toggle('linkedin-formed', stage === 'linkedin' && !flight);
    const departed = stage !== 'services' || Boolean(flight);
    service.classList.toggle('route-departed', departed);
    if (departed && !anchored && !anchoredTimeline) {
      ctx.fillStyle = ink;
      for (const point of current) {
        const y = point.y - scrollY;
        if (y < -15 || y > innerHeight + 15) continue;
        ctx.globalAlpha = stage === 'timeline' && !flight && point.step > timeline.active ? .35 : 1;
        ctx.save(); ctx.translate(point.x, y); ctx.rotate(point.angle || 0);
        ctx.fillRect(-point.size / 2, -point.size / 2, point.size, point.size); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    if (flight || timeline.playing) queue();
  }
  function queue() { if (!frame && !document.hidden) frame = requestAnimationFrame(render); }
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    linkedinPattern = makeLinkedInPattern();
    queue();
  }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', queue);
  document.addEventListener('codin:language-change', queue);
  document.addEventListener('codin:portfolio-motion', queue);
  motion.addEventListener('change', queue);
  const observer = new MutationObserver(queue);
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  observer.observe(service, { attributes: true, attributeFilter: ['class'] });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(resize);
})();
