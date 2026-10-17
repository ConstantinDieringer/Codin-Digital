(() => {
  'use strict';
  const projects = [...document.querySelectorAll('.portfolio-project')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!projects.length || motion.matches || typeof IntersectionObserver === 'undefined') return;
  const moving = new Map();
  let frame = 0;
  function tick(now) {
    frame = 0;
    document.dispatchEvent(new CustomEvent('codin:portfolio-motion'));
    for (const [project, until] of moving) if (now >= until) moving.delete(project);
    if (moving.size) frame = requestAnimationFrame(tick);
  }
  function reveal(project) {
    if (project.classList.contains('is-revealed')) return;
    project.classList.add('is-revealed');
    observer.unobserve(project);
    moving.set(project, performance.now() + 900);
    if (!frame) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
  }, { threshold: .08, rootMargin: '0px 0px -8% 0px' });
  projects.forEach(project => {
    project.classList.add('portfolio-reveal-ready');
    project.addEventListener('focusin', () => reveal(project));
    observer.observe(project);
  });
  motion.addEventListener('change', event => {
    if (event.matches) projects.forEach(reveal);
  });
})();
