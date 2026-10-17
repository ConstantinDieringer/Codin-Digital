(() => {
  'use strict';
  const section = document.querySelector('.services');
  const heroScene = document.querySelector('.scroll-scene');
  const hero = document.querySelector('.hero');
  const slots = [...document.querySelectorAll('.service-slot')];
  const tiles = [...document.querySelectorAll('.service-tile')];
  if (!section || !slots.length || slots.length !== tiles.length) return;

  if (typeof IntersectionObserver !== 'undefined') {
    const visibility = new IntersectionObserver(entries => {
      section.classList.toggle('is-visible', entries[0].isIntersecting);
    });
    visibility.observe(section);
  } else section.classList.add('is-visible');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, t) => a + (b - a) * t;
  const ease = (value, from = 0, to = 1) => {
    const t = clamp((value - from) / (to - from));
    return t * t * (3 - 2 * t);
  };
  let mode = 'waiting', seeds = null, frameId = 0, ready = false;
  let flightStart = 0, trigger = 1, started = 0;
  const duration = 1650;
  function measure() {
    flightStart = heroScene.getBoundingClientRect().top + scrollY;
    trigger = flightStart + hero.offsetHeight * .55;
  }

  function collectSeeds() {
    if (seeds) return;
    const request = { count: tiles.length, points: [] };
    document.dispatchEvent(new CustomEvent('codin:collect-seeds', { detail: request }));
    seeds = tiles.map((_, index) => request.points[index] || {
      x: innerWidth * (.36 + index * .14), y: innerHeight * .58, size: 3, alpha: .6
    });
  }

  function tileState(index, progress, target, viewportWidth) {
    const seed = seeds[index];
    const travel = ease(progress, 0, .52);
    const grow = ease(progress, .55, 1);
    const size = Math.max(2, seed.size);
    return {
      x: mix(seed.x, target.left + target.width / 2, travel) - mix(size, target.width, grow) / 2,
      y: mix(seed.y, target.top + target.height / 2, travel) - mix(size, target.height, grow) / 2,
      width: mix(size, target.width, grow), height: mix(size, target.height, grow),
      radius: mix(0, viewportWidth <= 700 ? 24 : 30, grow),
      glass: ease(grow, .02, .72), content: ease(grow, .58, .95),
      opacity: mix(seed.alpha, 1, ease(progress, 0, .3))
    };
  }

  function setTile(index, state) {
    const tile = tiles[index];
    tile.style.width = `${state.width}px`;
    tile.style.height = `${state.height}px`;
    tile.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
    tile.style.borderRadius = `${state.radius}px`;
    tile.style.opacity = state.opacity;
    tile.style.setProperty('--glass', state.glass);
    tile.style.setProperty('--content', state.content);
    tile.setAttribute('aria-hidden', state.content < .7 ? 'true' : 'false');
    tile.inert = state.content < .7;
  }

  function finish() {
    mode = 'expanded';
    section.classList.add('is-expanded');
    section.style.setProperty('--scene-content', 1);
    tiles.forEach(tile => { tile.removeAttribute('style'); tile.removeAttribute('aria-hidden'); tile.inert = false; });
  }

  function reset() {
    mode = 'waiting';
    seeds = null;
    section.classList.remove('is-expanded');
    section.style.setProperty('--scene-content', 0);
    tiles.forEach(tile => { tile.removeAttribute('style'); tile.setAttribute('aria-hidden', 'true'); tile.inert = true; });
    document.dispatchEvent(new CustomEvent('codin:return-seeds'));
  }

  function render(now = performance.now()) {
    frameId = 0;
    if (!ready) return;
    if (reduced) { if (mode !== 'expanded') finish(); return; }
    if (scrollY <= flightStart + 2) { if (mode !== 'waiting') reset(); return; }
    if (mode === 'expanded') return;
    if (mode === 'waiting') {
      if (scrollY < trigger) return;
      collectSeeds();
      mode = 'flight';
      started = now;
    }
    const progress = clamp((now - started) / duration);
    slots.forEach((slot, index) => setTile(index, tileState(index, progress, slot.getBoundingClientRect(), innerWidth)));
    section.style.setProperty('--scene-content', ease(progress, 0, .35));
    if (progress >= 1) finish(); else queue();
  }

  function queue() { if (!frameId) frameId = requestAnimationFrame(render); }
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { measure(); queue(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) queue(); });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    ready = true;
    measure();
    section.classList.add('motion-ready');
    tiles.forEach(tile => { tile.setAttribute('aria-hidden', 'true'); tile.inert = true; });
    if (scrollY >= flightStart + hero.offsetHeight) finish(); else render();
  });
})();
