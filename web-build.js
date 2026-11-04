(() => {
  'use strict';
  const stage = document.querySelector('[data-build]');
  if (!stage) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const isEnglish = () => document.documentElement.lang === 'en';
  const copy = {
    // The page being built belongs to an invented guided-hiking company on the coast.
    de: { line1: 'Die Küste', line2: 'ruft.', button: 'Tour buchen',
      text: 'Geführte Wandertouren entlang der Küste – für Einsteiger und Gipfelstürmer.',
      cards: ['Küstenpfad · 12 km', 'Wiesenrunde · 8 km', 'Gipfeltour · 15 km'], toast: 'Live · kuestenwege.de' },
    en: { line1: 'The coast', line2: 'is calling.', button: 'Book a tour',
      text: 'Guided hikes along the coast – for beginners and summit seekers.',
      cards: ['Coastal trail · 12 km', 'Meadow loop · 8 km', 'Summit tour · 15 km'], toast: 'Live · coastal-trails.com' }
  };

  // Only the website itself is shown: a page that assembles and rearranges on a 400 × 300 stage.
  stage.innerHTML = `
    <div class="build-app">
      <div class="build-page"><span class="build-edge"></span></div>
      <div class="build-layer">
        <span class="build-el build-logo"></span>
        <span class="build-el build-nav"></span><span class="build-el build-nav"></span><span class="build-el build-nav"></span>
        <div class="build-el build-headline"><span class="build-skeleton"></span><span class="build-skeleton build-skeleton-short"></span><strong><span class="build-line1"></span><br><span class="build-line2"></span><i class="build-caret"></i></strong></div>
        <div class="build-el build-paragraph"><span class="build-skeleton"></span><span class="build-skeleton"></span><span class="build-skeleton build-skeleton-short"></span><p class="build-text"></p></div>
        <div class="build-el build-image"><span class="build-image-icon">+</span><img src="assets/build/coast.webp" alt="" width="720" height="405"></div>
        <div class="build-el build-button"><span class="build-button-label"></span></div>
        <div class="build-el build-card"><img src="assets/build/coast.webp" alt="" width="720" height="405" style="object-position: 20% 70%"><span></span></div>
        <div class="build-el build-card"><img src="assets/build/meadow.webp" alt="" width="360" height="203"><span></span></div>
        <div class="build-el build-card"><img src="assets/build/summit.webp" alt="" width="360" height="203"><span></span></div>
        <div class="build-insert"><b>+</b></div>
        <div class="build-palette"><i style="--swatch:#17171b"></i><i style="--swatch:#943ae4"></i><i style="--swatch:#3f7be0"></i><i style="--swatch:#e0723f"></i></div>
        <div class="build-select"><i></i><i></i><i></i><i></i></div>
        <div class="build-chip"><img src="assets/build/coast.webp" alt="" width="720" height="405"></div>
        <div class="build-toast"><i></i><span></span></div>
      </div>
      <svg class="build-cursor" viewBox="0 0 16 22"><path d="M1 1v17l4.5-4 3 7 3-1.4-3-6.8H15z"/></svg>
      <span class="build-click"></span>
    </div>`;
  const $ = selector => stage.querySelector(selector);
  const $$ = selector => [...stage.querySelectorAll(selector)];
  const parts = {
    layer: $('.build-layer'), page: $('.build-page'), edge: $('.build-edge'), logo: $('.build-logo'), navs: $$('.build-nav'),
    headline: $('.build-headline'), headlineText: $('.build-headline strong'), line1: $('.build-line1'), line2: $('.build-line2'), caret: $('.build-caret'),
    headlineSkeletons: $$('.build-headline .build-skeleton'), paragraph: $('.build-paragraph'), text: $('.build-text'),
    paragraphSkeletons: $$('.build-paragraph .build-skeleton'), image: $('.build-image'), imageFill: $('.build-image img'),
    button: $('.build-button'), buttonLabel: $('.build-button-label'), cards: $$('.build-card'), insert: $('.build-insert'),
    palette: $('.build-palette'), swatch: $('.build-palette i:nth-child(2)'), select: $('.build-select'), chip: $('.build-chip'),
    toast: $('.build-toast'), toastText: $('.build-toast span'), cursor: $('.build-cursor'), click: $('.build-click'), app: $('.build-app')
  };

  // Layouts as [x, y, width, height]: A initial, B columns swapped, C image enlarged, M narrowed to a phone.
  const layouts = {
    page: { A: [16, 14, 368, 272], M: [112, 8, 176, 284] },
    logo: { A: [32, 30, 30, 8], M: [124, 20, 24, 6] },
    nav0: { A: [292, 32, 16, 4], M: [262, 20, 12, 2] },
    nav1: { A: [314, 32, 16, 4], M: [262, 24, 12, 2] },
    nav2: { A: [336, 32, 16, 4], M: [262, 28, 12, 2] },
    headline: { A: [32, 66, 170, 48], B: [204, 66, 166, 48], C: [214, 66, 156, 48], M: [124, 128, 152, 36] },
    paragraph: { A: [32, 124, 160, 30], B: [204, 124, 160, 30], C: [214, 124, 152, 30], M: [124, 168, 150, 22] },
    button: { A: [32, 170, 82, 22], B: [204, 170, 82, 22], C: [214, 170, 82, 22], M: [124, 196, 72, 18] },
    image: { A: [214, 58, 154, 138], B: [32, 58, 154, 138], C: [32, 52, 168, 150], M: [124, 36, 152, 84] },
    card0: { A: [32, 216, 106, 54], M: [124, 222, 152, 18] },
    card1: { A: [147, 216, 106, 54], M: [124, 244, 152, 18] },
    card2: { A: [262, 216, 106, 54], M: [124, 266, 152, 18] }
  };
  const loop = 19000;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  const span = (t, start, duration) => clamp((t - start) / duration);
  const mix = (a, b, t) => a + (b - a) * t;
  const mixRect = (a, b, t) => a.map((value, index) => mix(value, b[index], t));
  // Cursor keyframes [time, x, y]: every drag moves exactly with the layout transition it causes.
  const path = [[0, 430, 330], [1700, 430, 330], [2000, 392, 240], [2050, 392, 240], [2900, 291, 127], [3000, 291, 127],
    [3900, 110, 90], [5300, 110, 90], [5800, 291, 127], [6000, 291, 127], [6900, 109, 127], [7000, 109, 127],
    [7400, 186, 196], [7500, 186, 196], [8100, 200, 202], [8300, 200, 202], [8800, 200, 210], [9600, 200, 210],
    [10400, 255, 181], [10600, 255, 181], [11300, 330, 184], [11600, 330, 184], [12100, 290, 139], [13300, 290, 139],
    [13900, 384, 150], [14200, 384, 150], [15400, 288, 150], [15700, 288, 150], [17000, 430, 330], [loop, 430, 330]];
  const clicks = [2050, 2950, 4000, 5900, 7450, 9300, 10650, 11650, 12150, 14150];
  function cursorAt(t) {
    for (let i = 1; i < path.length; i++) {
      if (t <= path[i][0]) {
        const [t0, x0, y0] = path[i - 1], [t1, x1, y1] = path[i];
        const p = ease(span(t, t0, t1 - t0));
        return [mix(x0, x1, p), mix(y0, y1, p)];
      }
    }
    return [430, 330];
  }
  function rectAt(name, t) {
    const { A, B = A, C = B, M } = layouts[name];
    const swap = ease(span(t, 6000, 900)), grow = ease(span(t, 7500, 600)), narrow = ease(span(t, 14200, 1200));
    return mixRect(mixRect(mixRect(A, B, swap), C, grow), M, narrow);
  }
  function setRect(element, [x, y, w, h]) {
    element.style.left = `${x}px`; element.style.top = `${y}px`;
    element.style.width = `${w}px`; element.style.height = `${h}px`;
  }
  const appear = (element, value, lift = 6) => {
    element.style.opacity = value;
    element.style.translate = `0 ${(1 - value) * lift}px`;
  };
  function select(rect) {
    if (!rect) { parts.select.style.opacity = 0; return; }
    const [x, y, w, h] = rect;
    setRect(parts.select, [x - 3, y - 3, w + 6, h + 6]);
    parts.select.style.opacity = 1;
  }

  function render(t) {
    const words = copy[isEnglish() ? 'en' : 'de'];
    parts.buttonLabel.textContent = words.button;
    parts.toastText.textContent = words.toast;
    parts.cards.forEach((card, index) => { card.lastElementChild.textContent = words.cards[index]; });
    parts.layer.style.opacity = 1 - span(t, 18000, 800);
    parts.page.style.opacity = 1 - span(t, 18000, 800) * .4;

    const narrow = ease(span(t, 14200, 1200));
    setRect(parts.page, rectAt('page', t));
    parts.edge.style.opacity = t >= 13800 && t < 15600 ? 1 : 0;

    // 1. Components load as placeholders.
    setRect(parts.logo, rectAt('logo', t)); appear(parts.logo, ease(span(t, 200, 400)));
    parts.navs.forEach((nav, index) => { setRect(nav, rectAt(`nav${index}`, t)); appear(nav, ease(span(t, 320 + index * 90, 400))); });
    for (const name of ['headline', 'paragraph', 'image', 'button']) setRect(parts[name], rectAt(name, t));
    appear(parts.headline, ease(span(t, 550, 450)));
    appear(parts.paragraph, ease(span(t, 750, 450)));
    appear(parts.image, ease(span(t, 950, 450)));
    appear(parts.button, ease(span(t, 1150, 450)));

    // 2. An image is dragged in from outside and dropped into its frame.
    const [cx, cy] = cursorAt(t);
    const chipIn = ease(span(t, 1600, 350));
    const carried = t >= 2050 && t < 2950;
    parts.chip.style.opacity = t < 2950 ? chipIn : 0;
    parts.chip.style.transform = carried ? `translate(${cx - 4}px, ${cy - 6}px) rotate(-5deg)` : `translate(${mix(420, 384, chipIn)}px, 232px) rotate(-5deg)`;
    const reveal = ease(span(t, 2950, 500));
    parts.imageFill.style.clipPath = `inset(${(1 - reveal) * 50}% ${(1 - reveal) * 50}% round 8px)`;
    parts.image.classList.toggle('is-filled', t >= 2950);

    // 3. The headline is typed into place.
    const typed = Math.max(0, Math.floor((t - 4150) / 50));
    parts.line1.textContent = words.line1.slice(0, typed);
    parts.line2.textContent = words.line2.slice(0, Math.max(0, typed - words.line1.length));
    parts.headlineSkeletons.forEach(skeleton => { skeleton.style.opacity = t < 4050 ? 1 : 0; });
    parts.caret.style.opacity = t >= 4050 && t < 5300 && Math.floor(t / 400) % 2 ? 1 : 0;
    parts.headlineText.style.fontSize = `${mix(19, 14, narrow)}px`;
    parts.headlineText.style.lineHeight = `${mix(22, 17, narrow)}px`;
    parts.text.style.fontSize = `${mix(8, 6.5, narrow)}px`;
    parts.button.style.fontSize = `${mix(7.5, 6.5, narrow)}px`;

    // 4. Columns swap, 5. the image is enlarged, 6. a new row of cards is inserted.
    parts.insert.style.opacity = t >= 8800 && t < 9500 ? 1 : 0;
    parts.cards.forEach((card, index) => {
      setRect(card, rectAt(`card${index}`, t));
      const entry = ease(span(t, 9400 + index * 160, 450));
      card.style.opacity = entry;
      card.style.scale = mix(.85, 1, entry);
    });

    // 7. A palette colour becomes the brand accent.
    const paletteIn = ease(span(t, 10700, 300)) * (1 - span(t, 11900, 300));
    parts.palette.style.opacity = paletteIn;
    parts.palette.style.translate = `0 ${(1 - paletteIn) * 4}px`;
    parts.swatch.classList.toggle('is-picked', t >= 11650);
    parts.app.classList.toggle('is-accented', t >= 11650);
    parts.button.classList.toggle('is-styled', t >= 10650);

    // 8. Body copy is typed over the placeholder lines.
    const written = Math.max(0, Math.floor((t - 12250) / 22));
    parts.paragraphSkeletons.forEach(skeleton => { skeleton.style.opacity = t < 12200 ? 1 : 0; });
    parts.text.style.opacity = t >= 12200 ? 1 : 0;
    const typingCopy = t >= 12200 && written < words.text.length;
    parts.text.innerHTML = '';
    parts.text.append(words.text.slice(0, written));
    if (typingCopy || (t >= 12200 && t < 13700 && Math.floor(t / 400) % 2)) parts.text.append(Object.assign(document.createElement('i'), { className: 'build-caret' }));

    // Selection frame follows whatever is being worked on.
    if (t >= 2950 && t < 3500) select(rectAt('image', t));
    else if (t >= 4000 && t < 5300) select(rectAt('headline', t));
    else if (t >= 5900 && t < 7000) select(rectAt('image', t));
    else if (t >= 7450 && t < 8200) select(rectAt('image', t));
    else if (t >= 10650 && t < 11900) select(rectAt('button', t));
    else if (t >= 12150 && t < 13400) select(rectAt('paragraph', t));
    else select(null);

    // 9. The page edge is dragged in and everything reflows for a phone; then it goes live.
    const toast = ease(span(t, 15800, 350)) * (1 - span(t, 17600, 400));
    parts.toast.style.opacity = toast;
    parts.toast.style.translate = `-50% ${(1 - toast) * 8}px`;

    parts.cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    const clickAge = clicks.map(time => t - time).find(age => age >= 0 && age < 380);
    parts.click.style.opacity = clickAge === undefined ? 0 : 1 - clickAge / 380;
    parts.click.style.transform = `translate(${cx}px, ${cy}px) scale(${clickAge === undefined ? 0 : .4 + clickAge / 380})`;
  }

  let frame = 0, visible = false, started = performance.now();
  function fit() {
    const box = stage.getBoundingClientRect();
    if (box.width) stage.style.setProperty('--build-scale', Math.min(box.width / 400, box.height / 300));
  }
  function tick(now) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (motion.matches) { render(13600); return; }
    render((now - started) % loop);
    frame = requestAnimationFrame(tick);
  }
  const queue = () => { if (!frame) frame = requestAnimationFrame(tick); };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(stage);
  else addEventListener('resize', fit);
  if (typeof IntersectionObserver !== 'undefined') {
    new IntersectionObserver(entries => {
      const was = visible;
      visible = entries[0].isIntersecting;
      // The film starts from the beginning each time it comes into view.
      if (visible && !was) { started = performance.now(); queue(); }
    }, { threshold: .35 }).observe(stage);
  } else { visible = true; queue(); }
  document.addEventListener('visibilitychange', queue);
  document.addEventListener('codin:language-change', () => { if (motion.matches) render(13600); });
  motion.addEventListener('change', queue);
  fit();
  render(motion.matches ? 13600 : 0);
})();
