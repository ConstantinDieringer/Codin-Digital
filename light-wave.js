(() => {
  'use strict';
  const section = document.querySelector('.services');
  const halo = document.querySelector('.wave-halo');
  const ribbon = document.querySelector('.wave-ribbon');
  const highlight = document.querySelector('.wave-highlight');
  if (!section || !halo || !ribbon || !highlight) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frameId = 0, previous = 0, phase = 0, visible = false;

  function geometry(time) {
    const upper = [], lower = [], center = [];
    for (let index = 0; index <= 96; index++) {
      const u = index / 96;
      const a = u * Math.PI * 2 - time * .62;
      const b = u * Math.PI * 3.8 + time * .37;
      const x = -150 + 1740 * u;
      const y = 570 + 150 * Math.sin(a) + 75 * Math.sin(b) + 25 * Math.sin(time * .3);
      const slope = 300 * Math.PI * Math.cos(a) + 285 * Math.PI * Math.cos(b);
      const length = Math.hypot(1740, slope);
      const nx = -slope / length, ny = 1740 / length;
      // Width changes independently along the wave, not just across the whole shape.
      const width = 20 + 65 * (.5 + .5 * Math.sin(u * Math.PI * 6.4 - time * .85)) ** 1.5
        + 24 * (.5 + .5 * Math.sin(u * Math.PI * 2.2 + time * .48));
      upper.push([x + nx * width, y + ny * width]);
      lower.push([x - nx * width, y - ny * width]);
      center.push([x, y]);
    }
    const line = points => 'M' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
    return { ribbon: line([...upper, ...lower.reverse()]) + ' Z', center: line(center) };
  }
  function draw() {
    const paths = geometry(phase);
    halo.setAttribute('d', paths.ribbon);
    ribbon.setAttribute('d', paths.ribbon);
    highlight.setAttribute('d', paths.center);
  }
  function frame(now) {
    frameId = 0;
    if (!visible || document.hidden || reduced) { previous = 0; return; }
    if (!previous || now - previous >= 1000 / 30) {
      if (previous) phase += Math.min((now - previous) / 1000, .1);
      previous = now;
      draw();
    }
    frameId = requestAnimationFrame(frame);
  }
  function resume() {
    if (!reduced && visible && !document.hidden && !frameId) {
      previous = 0;
      frameId = requestAnimationFrame(frame);
    }
  }
  draw();
  if (!reduced) {
    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) resume();
        else { cancelAnimationFrame(frameId); frameId = 0; previous = 0; }
      }).observe(section);
    } else { visible = true; resume(); }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(frameId); frameId = 0; previous = 0; }
      else resume();
    });
  }
})();
