(() => {
  'use strict';
  const deck = document.querySelector('.skill-deck');
  if (!deck) return;
  const stack = deck.querySelector('.skill-stack');
  const cards = [...deck.querySelectorAll('.skill-card')];
  const dots = [...deck.querySelectorAll('.skill-dots i')];
  const status = deck.querySelector('.skill-status');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  // order[0] is the card in front; the rest wait behind it, each a little further back.
  let order = cards.map((_, index) => index), busy = false;

  function layout() {
    order.forEach((cardIndex, depth) => {
      const card = cards[cardIndex];
      card.style.setProperty('--depth', depth);
      card.style.zIndex = cards.length - depth;
      card.setAttribute('aria-hidden', String(depth !== 0));
    });
    dots.forEach((dot, index) => dot.classList.toggle('is-active', index === order[0]));
  }

  function advance() {
    if (busy) return;
    const front = cards[order[0]];
    const finish = () => {
      order = [...order.slice(1), order[0]];
      // Park the card at the back without animating through the front, then fade it in there.
      front.style.transition = 'none';
      front.style.opacity = '0';
      layout();
      front.classList.remove('is-leaving');
      void front.offsetWidth;
      front.style.transition = '';
      front.style.opacity = '';
      const title = cards[order[0]].querySelector('h4').textContent;
      status.textContent = `${document.documentElement.lang === 'en' ? 'Card' : 'Karte'} ${order[0] + 1}/${cards.length}: ${title}`;
      busy = false;
    };
    if (motion.matches) { finish(); return; }
    busy = true;
    // The front card swings out, then slides in again at the back of the stack.
    front.classList.add('is-leaving');
    setTimeout(finish, 420);
  }

  // Side by side with the portrait, the stack ends exactly where the photo ends.
  const section = deck.closest('.about-section');
  const portrait = section && section.querySelector('.about-portrait img');
  function align() {
    stack.style.height = '';
    if (!portrait || getComputedStyle(section).gridTemplateColumns.split(' ').length < 2) return;
    const height = portrait.getBoundingClientRect().bottom - stack.getBoundingClientRect().top;
    if (height >= 150) stack.style.height = `${height}px`;
  }
  if (portrait && typeof ResizeObserver !== 'undefined') new ResizeObserver(align).observe(section);
  if (portrait) portrait.addEventListener('load', align);
  if (document.fonts) document.fonts.ready.then(align);

  stack.addEventListener('click', advance);
  stack.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowRight') { event.preventDefault(); advance(); }
  });
  layout();
})();
