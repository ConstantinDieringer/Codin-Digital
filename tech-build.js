(() => {
  'use strict';
  const stage = document.querySelector('[data-tech-build]');
  if (!stage) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const isEnglish = () => document.documentElement.lang === 'en';
  const copy = {
    de: { run: 'Ausführen', migrated: '3 Tabellen erstellt', rows: 'Zeilen', title: 'Umsatz-Übersicht', live: 'Live',
      month: 'Monat', week: 'Woche', kpis: ['Kunden', 'Aufträge', 'Umsatz'], bars: 'Aufträge je Region',
      tooltip: ['Okt · 31,4 Tsd. €', 'KW 42 · 8,1 Tsd. €'], toast: 'Daten fließen in Echtzeit', locale: 'de-DE' },
    en: { run: 'Run', migrated: '3 tables created', rows: 'rows', title: 'Revenue overview', live: 'Live',
      month: 'Month', week: 'Week', kpis: ['Customers', 'Orders', 'Revenue'], bars: 'Orders by region',
      tooltip: ['Oct · €31.4k', 'Wk 42 · €8.1k'], toast: 'Data flowing in real time', locale: 'en-US' }
  };
  // The schema typed in the editor, as [text, token class] pairs per line.
  const k = 'k', n = 'n', p = 'p', w = '';
  const code = [
    [['create table ', k], ['customers', n], [' (', p]],
    [['  id    ', w], ['serial primary key', k], [',', p]],
    [['  name  ', w], ['text', k], [',', p]],
    [['  email ', w], ['text', k]],
    [[');', p]],
    [['create table ', k], ['orders', n], [' (', p]],
    [['  id          ', w], ['serial primary key', k], [',', p]],
    [['  customer_id ', w], ['int references ', k], ['customers', n], [',', p]],
    [['  total       ', w], ['numeric', k]],
    [[');', p]],
    [['create table ', k], ['invoices', n], [' (', p]],
    [['  order_id ', w], ['int references ', k], ['orders', n], [',', p]],
    [['  paid     ', w], ['boolean', k]],
    [[');', p]]
  ];
  const lineLengths = code.map(line => line.reduce((sum, [text]) => sum + text.length, 0));
  const totalChars = lineLengths.reduce((sum, length) => sum + length, 0);
  const tables = [
    { name: 'customers', rect: [14, 22, 104, 64], columns: [['id', 'serial'], ['name', 'text'], ['email', 'text']], rows: 1248 },
    { name: 'orders', rect: [14, 112, 104, 64], columns: [['id', 'serial'], ['customer_id', 'int'], ['total', 'numeric']], rows: 3902 },
    { name: 'invoices', rect: [14, 202, 104, 52], columns: [['order_id', 'int'], ['paid', 'bool']], rows: 3517 }
  ];
  // Foreign keys between the tables, and the feeds from each table into the dashboard.
  const relations = [[[14, 44], [6, 44], [6, 146], [14, 146]], [[118, 134], [128, 134], [128, 224], [118, 224]]];
  const feeds = [[[118, 50], [136, 50], [136, 70], [152, 70]], [[118, 150], [140, 150], [140, 148], [152, 148]], [[118, 236], [136, 236], [136, 240], [152, 240]]];
  const pathData = points => points.map(([x, y], index) => `${index ? 'L' : 'M'}${x} ${y}`).join(' ');
  function pointOn(points, progress) {
    const lengths = points.slice(1).map(([x, y], index) => Math.abs(x - points[index][0]) + Math.abs(y - points[index][1]));
    let rest = progress * lengths.reduce((sum, length) => sum + length, 0);
    for (let index = 0; index < lengths.length; index++) {
      if (rest <= lengths[index] || index === lengths.length - 1) {
        const t = lengths[index] ? Math.min(1, rest / lengths[index]) : 0, [x0, y0] = points[index], [x1, y1] = points[index + 1];
        return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
      }
      rest -= lengths[index];
    }
    return points[points.length - 1];
  }
  // Two datasets for the line chart: monthly and weekly revenue, as fractions of the chart height.
  const series = [[.28, .36, .33, .48, .55, .52, .7, .82], [.6, .42, .5, .38, .62, .55, .48, .74]];
  const bars = [.55, .8, .42, .66, .9, .5];
  const chart = { x: 172, y: 110, w: 194, h: 76 };
  const chartPoint = (values, index) => [chart.x + index * chart.w / (values.length - 1), chart.y + chart.h * (1 - values[index])];

  stage.innerHTML = `
    <div class="build-app code-app">
      <div class="code-editor">
        <div class="code-bar"><i></i><i></i><i></i><span>schema.sql</span><b class="code-run"><em>▶</em><span class="code-run-label"></span></b></div>
        <pre class="code-lines">${code.map((_, index) => `<span class="code-line"><i>${index + 1}</i><span></span></span>`).join('')}</pre>
        <div class="code-terminal"><span class="code-prompt">$ migrate</span><span class="code-result"></span></div>
      </div>
      <svg class="code-links" viewBox="0 0 400 300">
        ${relations.map(points => `<path class="code-link" d="${pathData(points)}" pathLength="1"/>`).join('')}
        ${feeds.map(points => `<path class="code-link code-feed" d="${pathData(points)}" pathLength="1"/>`).join('')}
      </svg>
      ${tables.map(table => `
        <div class="code-table">
          <div class="code-table-head"><span>${table.name}</span><i></i></div>
          ${table.columns.map(([column, type]) => `<div class="code-column"><span>${column}</span><em>${type}</em></div>`).join('')}
          <div class="code-table-foot"><b>0</b> <span class="code-rows"></span></div>
        </div>`).join('')}
      <div class="dash">
        <div class="dash-head"><strong class="dash-title"></strong><span class="dash-live"><i></i><b></b></span><span class="dash-toggle"><b class="dash-month"></b><b class="dash-week"></b></span></div>
        ${[0, 1, 2].map(() => '<div class="dash-kpi"><span></span><strong>0</strong><em></em></div>').join('')}
        <div class="dash-chart"><svg viewBox="0 0 400 300"><path class="dash-area"/><path class="dash-line" pathLength="1"/>${series[0].map(() => '<circle class="dash-dot" r="2.2"/>').join('')}</svg><div class="dash-tooltip"></div></div>
        <div class="dash-bars"><span class="dash-bars-label"></span>${bars.map(() => '<i></i>').join('')}</div>
      </div>
      <div class="code-flow">${[...relations, ...feeds].map(() => '<i></i><i></i>').join('')}</div>
      <div class="code-toast"><i></i><span></span></div>
      <svg class="build-cursor" viewBox="0 0 16 22"><path d="M1 1v17l4.5-4 3 7 3-1.4-3-6.8H15z"/></svg>
      <span class="build-click"></span>
    </div>`;
  const $ = selector => stage.querySelector(selector);
  const $$ = selector => [...stage.querySelectorAll(selector)];
  const parts = {
    editor: $('.code-editor'), lines: $$('.code-line > span'), run: $('.code-run'), runLabel: $('.code-run-label'),
    terminal: $('.code-terminal'), result: $('.code-result'), tables: $$('.code-table'), links: $$('.code-link'),
    flow: $$('.code-flow i'), dash: $('.dash'), title: $('.dash-title'), live: $('.dash-live'), liveLabel: $('.dash-live b'),
    month: $('.dash-month'), week: $('.dash-week'), kpis: $$('.dash-kpi'), line: $('.dash-line'), area: $('.dash-area'),
    dots: $$('.dash-dot'), tooltip: $('.dash-tooltip'), barsLabel: $('.dash-bars-label'), bars: $$('.dash-bars i'),
    toast: $('.code-toast'), toastText: $('.code-toast span'), cursor: $('.build-cursor'), click: $('.build-click')
  };
  tables.forEach((table, index) => {
    const [x, y, width, height] = table.rect;
    Object.assign(parts.tables[index].style, { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` });
  });

  const loop = 18000;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  const span = (t, start, duration) => clamp((t - start) / duration);
  const mix = (a, b, t) => a + (b - a) * t;
  const hoverIndex = 6;
  const path = [[0, 430, 330], [1500, 430, 330], [2000, 186, 24], [2250, 186, 24], [2900, 300, 290], [6800, 300, 290],
    [7300, ...chartPoint(series[0], hoverIndex)], [9400, ...chartPoint(series[0], hoverIndex)], [10200, 360, 31], [10700, 360, 31],
    [11300, ...chartPoint(series[1], hoverIndex)], [12600, ...chartPoint(series[1], hoverIndex)], [13600, 430, 330], [loop, 430, 330]];
  const clicks = [2150, 10600];
  function cursorAt(t) {
    for (let i = 1; i < path.length; i++) {
      if (t <= path[i][0]) {
        const [t0, x0, y0] = path[i - 1], [t1, x1, y1] = path[i];
        const q = ease(span(t, t0, t1 - t0));
        return [mix(x0, x1, q), mix(y0, y1, q)];
      }
    }
    return [430, 330];
  }
  const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let shownChars = -1;
  function typeCode(chars) {
    if (chars === shownChars) return;
    shownChars = chars;
    let left = chars, caretPlaced = false;
    code.forEach((line, index) => {
      // The caret sits at the end of the line currently being typed.
      const typing = !caretPlaced && chars < totalChars && left <= lineLengths[index];
      if (typing) caretPlaced = true;
      let html = '';
      for (const [text, kind] of line) {
        if (left <= 0) break;
        const part = text.slice(0, left);
        left -= part.length;
        html += kind ? `<b class="code-${kind}">${escape(part)}</b>` : escape(part);
      }
      parts.lines[index].innerHTML = html + (typing ? '<i class="code-caret"></i>' : '');
    });
  }

  function render(t) {
    const words = copy[isEnglish() ? 'en' : 'de'];
    const number = value => value.toLocaleString(words.locale);
    parts.runLabel.textContent = words.run;
    parts.title.textContent = words.title;
    parts.liveLabel.textContent = words.live;
    parts.month.textContent = words.month;
    parts.week.textContent = words.week;
    parts.barsLabel.textContent = words.bars;
    parts.toastText.textContent = words.toast;
    // Everything fades out before the film starts over.
    const outro = 1 - span(t, 16600, 800);

    // 1. The schema is typed quickly and run; then the editor makes room.
    const editorOut = ease(span(t, 2600, 600));
    parts.editor.style.opacity = ease(span(t, 0, 300)) * (1 - editorOut);
    parts.editor.style.translate = `${-24 * editorOut}px 0`;
    typeCode(Math.min(totalChars, Math.max(0, Math.floor((t - 300) / 6))));
    parts.run.classList.toggle('is-pressed', t >= 2150 && t < 2350);
    parts.terminal.style.opacity = ease(span(t, 2200, 200));
    parts.result.textContent = t >= 2350 ? `✓ ${words.migrated}` : '';

    // 2. The tables appear and their foreign keys link up.
    parts.tables.forEach((table, index) => {
      const entry = ease(span(t, 2900 + index * 220, 450));
      table.style.opacity = entry * outro;
      table.style.translate = `${(1 - entry) * 16}px 0`;
      [...table.querySelectorAll('.code-column')].forEach((column, row) => { column.style.opacity = ease(span(t, 3050 + index * 220 + row * 90, 220)); });
      const count = Math.round(tables[index].rows * ease(span(t, 5200 + index * 150, 1400)));
      table.querySelector('.code-table-foot b').textContent = number(count);
      table.querySelector('.code-rows').textContent = words.rows;
    });
    parts.links.forEach((link, index) => {
      const start = index < relations.length ? 3700 + index * 400 : 5000 + (index - relations.length) * 180;
      link.style.strokeDashoffset = 1 - ease(span(t, start, 500));
      link.style.opacity = outro;
    });

    // 3. The analytics frontend builds up and fills with the data.
    const dashIn = ease(span(t, 4400, 600));
    parts.dash.style.opacity = dashIn * outro;
    parts.dash.style.scale = mix(.94, 1, dashIn);
    const fill = ease(span(t, 5400, 1500));
    const weekly = ease(span(t, 10650, 900));
    const kpiValues = [1248, 3902, mix(284, 296, ease(span(t, 9600, 800)))];
    parts.kpis.forEach((kpi, index) => {
      kpi.firstElementChild.textContent = words.kpis[index];
      const value = kpiValues[index] * fill;
      kpi.querySelector('strong').textContent = index === 2 ? `${number(Math.round(value))}${isEnglish() ? 'k' : ' Tsd.'}` : number(Math.round(value));
      kpi.querySelector('em').textContent = ['+12 %', '+8 %', '+18 %'][index];
      kpi.style.opacity = ease(span(t, 4800 + index * 150, 400));
    });
    const values = series[0].map((value, index) => mix(value, series[1][index], weekly));
    const points = values.map((_, index) => chartPoint(values, index));
    const line = points.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    parts.line.setAttribute('d', line);
    parts.line.style.strokeDashoffset = 1 - ease(span(t, 5500, 1400));
    parts.area.setAttribute('d', `${line} L${chart.x + chart.w} ${chart.y + chart.h} L${chart.x} ${chart.y + chart.h} Z`);
    parts.area.style.opacity = ease(span(t, 6400, 600));
    parts.dots.forEach((dot, index) => {
      dot.setAttribute('cx', points[index][0]); dot.setAttribute('cy', points[index][1]);
      dot.style.opacity = ease(span(t, 5600 + index * 150, 250));
      dot.classList.toggle('is-hovered', index === hoverIndex && ((t >= 7300 && t < 9400) || (t >= 11300 && t < 12600)));
    });
    parts.bars.forEach((bar, index) => {
      const grow = ease(span(t, 5900 + index * 120, 700));
      const boost = index === bars.length - 1 ? .08 * ease(span(t, 9600, 800)) : 0;
      bar.style.height = `${(bars[index] + boost) * 38 * grow}px`;
    });
    parts.month.classList.toggle('is-active', t < 10600);
    parts.week.classList.toggle('is-active', t >= 10600);
    parts.live.classList.toggle('is-pulsing', t >= 9600 && t < 10400);
    const tooltipOn = (t >= 7400 && t < 9400) || (t >= 11400 && t < 12600);
    const [tx, ty] = points[hoverIndex];
    parts.tooltip.textContent = words.tooltip[t >= 10600 ? 1 : 0];
    parts.tooltip.style.opacity = tooltipOn ? 1 : 0;
    parts.tooltip.style.transform = `translate(${tx - 162}px, ${ty - 94 - 22}px) translateX(-50%)`;

    // 4. Records travel from the database into the frontend.
    const flows = [...relations, ...feeds];
    parts.flow.forEach((dot, index) => {
      const delay = 6200 + (index % 2) * 700 + Math.floor(index / 2) * 160;
      if (t < delay) { dot.style.opacity = 0; return; }
      const [x, y] = pointOn(flows[Math.floor(index / 2)], ((t - delay) / 1400) % 1);
      dot.style.opacity = outro;
      dot.style.transform = `translate(${x}px, ${y}px)`;
    });
    const toast = ease(span(t, 12900, 350)) * (1 - span(t, 16200, 400));
    parts.toast.style.opacity = toast;
    parts.toast.style.translate = `-50% ${(1 - toast) * 8}px`;

    const [cx, cy] = cursorAt(t);
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
    if (motion.matches) { render(9000); return; }
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
      if (visible && !was) { started = performance.now(); shownChars = -1; queue(); }
    }, { threshold: .35 }).observe(stage);
  } else { visible = true; queue(); }
  document.addEventListener('visibilitychange', queue);
  document.addEventListener('codin:language-change', () => { if (motion.matches) render(9000); });
  motion.addEventListener('change', queue);
  fit();
  render(motion.matches ? 9000 : 0);
})();
