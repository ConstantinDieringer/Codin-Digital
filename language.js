(() => {
  'use strict';
  const translations = {
    'Start': 'Home',
    'Symbolbild: Arbeitsplatz mit Laptop und Notizen für ein erstes Gespräch': 'Illustrative image: laptop and notes for an initial conversation',
    'Symbolbild: Skizzenbuch mit ersten Layout-Ideen und Materialmustern': 'Illustrative image: sketchbook with early layout ideas and material samples',
    'Symbolbild: Gemeinsame Besprechung von Website-Entwürfen': 'Illustrative image: reviewing website designs together',
    'Symbolbild: Fertiger Website-Auftritt auf Monitor und Laptop': 'Illustrative image: finished website on a monitor and laptop',
    'Von der Idee': 'From the first idea',
    'bis zum': 'to',
    'Kickoff & Discovery': 'Kickoff & discovery',
    'Wir lernen uns kennen und klären, was deine Website zeigen und erreichen soll.': 'We get to know each other and define what your website should communicate and achieve.',
    'Du bekommst einen ersten Entwurf, der deine Idee in Form, Farbe und Struktur übersetzt.': 'You receive a first draft that translates your idea into layout, colour and structure.',
    '2–3 Review Sessions': '2–3 Review Sessions',
    'Wir gehen die Website gemeinsam durch und verfeinern Design, Inhalte und Details.': 'We review the website together and refine the design, content and details.',
    'Wir prüfen den fertigen Auftritt, richten das Hosting ein und bringen deine Website online.': 'We check the finished website, set up hosting and bring your site online.',
    'Website-Konzept': 'Website concept',
    'Ich habe Business Informatics mit Schwerpunkt Data Science studiert und in zwei Tech-Startups gearbeitet – zuletzt als Engineer bei einem der am schnellsten wachsenden Startups Deutschlands.': 'I studied Business Informatics with a focus on Data Science and have worked at two tech startups — most recently as an engineer at one of Germany’s fastest-growing startups.',
    'Am Webdesign begeistert mich, Ideen sichtbar zu machen. Ich möchte Selbstständigen und Unternehmen helfen, ihre Arbeit klar zu zeigen und mit einem eigenen Auftritt die richtigen Menschen zu erreichen.': 'What I love about web design is making ideas tangible. I want to help independent professionals and businesses present their work clearly and reach the right people with a website of their own.',
    'Über mich': 'About me',
    'Kontakt': 'Contact',
    'Menü': 'Menu',
    'Webdesign.': 'Web design.',
    'Mit Charakter.': 'With character.',
    'Du hast etwas zu zeigen.': 'You have something to share.',
    'Geben wir ihm den richtigen Auftritt.': 'Let’s give it the presence it deserves.',
    'Von der ersten Idee bis zur fertigen Website: durchdachtes Design, klare Inhalte und eine Entwicklung, die auf jedem Bildschirm funktioniert.': 'From the first idea to your finished website: thoughtful design, clear content and development that works on every screen.',
    'Deine Website besprechen': 'Let’s talk about your website',
    'Arbeiten entdecken': 'Explore my work',
    'Gutes Design passt sich an.': 'Good design adapts.',
    'Deine Idee. Dein Auftritt.': 'Your idea. Your presence.',
    'Ein Gefühl dafür, was möglich ist.': 'A glimpse of what’s possible.',
    'DESIGN-KONZEPT / KEIN KUNDENPROJEKT': 'DESIGN CONCEPT / NOT A CLIENT PROJECT',
    'AUS IDEEN WERDEN WEBSITES.': 'TURNING IDEAS INTO WEBSITES.',
    'Zwei Projekte.': 'Two projects.',
    'Deines kommt als Nächstes.': 'Yours could be next.',
    'Website entdecken': 'Explore website',
    'Unabhängige Beratung': 'Independent advice',
    'für Unternehmerfamilien': 'for entrepreneurial families',
    'Deine nächste Website': 'Your next website',
    'Platz für deine Idee.': 'Room for your idea.',
    'Projekt starten': 'Start a project',
    '03 / DEIN PROJEKT': '03 / YOUR PROJECT',
    'Deine Website': 'Your website',
    'CODIN-DIGITAL / SEIT 2026': 'CODIN-DIGITAL / SINCE 2026',
    'Hi, ich bin': 'Hi, I’m',
    'Individuelle Websites.': 'Individual websites.',
    'Mit Persönlichkeit und klarem Design.': 'With personality and clear design.',
    'Webdesign': 'Web design',
    'DAS BRINGE ICH MIT': 'WHAT I BRING',
    'Meine Expertise': 'My expertise',
    'Abläufe intelligent verbinden.': 'Connecting workflows intelligently.',
    'Ideen in funktionierende Lösungen übersetzen.': 'Turning ideas into working solutions.',
    'Auftritte mit Charakter gestalten.': 'Designing websites with character.',
    'Lernen wir uns kennen': 'Let’s get to know each other',
    'DEINE IDEE. UNSER NÄCHSTES PROJEKT.': 'YOUR IDEA. OUR NEXT PROJECT.',
    'Eine neue Website oder ein frischer Blick auf deinen bestehenden Auftritt? Erzähl mir, was du vorhast.': 'A new website or a fresh look at your existing one? Tell me what you have in mind.',
    'Vorname': 'First name',
    'Nachname': 'Last name',
    'Deine E-Mail': 'Your email',
    'Deine Idee': 'Your idea',
    'Anfrage senden': 'Send enquiry',
    'Dein Vorname': 'Your first name',
    'Dein Nachname': 'Your last name',
    'du@unternehmen.de': 'you@company.com',
    'Was möchtest du verändern oder aufbauen?': 'What would you like to change or build?',
    'Codin Digital — zurück zum Anfang': 'Codin Digital — back to the top',
    'Hauptnavigation': 'Main navigation',
    'Sprache auswählen': 'Choose language',
    'Nach unten scrollen': 'Scroll down',
    'Website-Vorschau auswählen': 'Choose website preview',
    'Runa Advisors – Website in neuem Tab öffnen': 'Runa Advisors — open website in a new tab',
    'Thugatra – Website in neuem Tab öffnen': 'Thugatra — open website in a new tab',
    'You could be next – dein Projekt besprechen': 'You could be next — discuss your project',
    'Porträt von Constantin, dem Kopf hinter Codin-Digital': 'Portrait of Constantin, the person behind Codin-Digital',
    'Constantin Dieringer auf LinkedIn – öffnet in einem neuen Tab': 'Constantin Dieringer on LinkedIn — opens in a new tab',
    'Projektanfrage': 'Project enquiry'
  };
  // Keep references to text nodes so switching language preserves icons and markup.
  const textRecords = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script, style, #word, .pixel-logo, .language-switch')) continue;
    const key = node.nodeValue.trim();
    if (Object.hasOwn(translations, key)) textRecords.push({ node, original: node.nodeValue, key });
  }
  const attributes = [];
  document.querySelectorAll('[aria-label], [placeholder], img[alt]').forEach(element => {
    for (const name of ['aria-label', 'placeholder', 'alt']) {
      const original = element.getAttribute(name);
      if (original && Object.hasOwn(translations, original)) attributes.push({ element, name, original });
    }
  });
  const buttons = [...document.querySelectorAll('[data-language]')];
  function applyLanguage(language) {
    if (language !== 'de' && language !== 'en') return;
    document.documentElement.lang = language;
    for (const record of textRecords) {
      record.node.nodeValue = language === 'de' ? record.original : record.original.replace(record.key, translations[record.key]);
    }
    for (const record of attributes) record.element.setAttribute(record.name, language === 'de' ? record.original : translations[record.original]);
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    document.querySelector('meta[name="description"]').setAttribute('content', language === 'en'
      ? 'Codin-Digital — individual web design and development. Thoughtful websites with personality, since 2026.'
      : 'Codin-Digital — individuelles Webdesign und Entwicklung. Durchdachte Websites mit Persönlichkeit, seit 2026.');
    document.dispatchEvent(new CustomEvent('codin:language-change', { detail: { language } }));
    try { localStorage.setItem('codin-language', language); } catch { /* Storage may be unavailable for local files. */ }
  }
  const indicator = document.querySelector('.language-indicator');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let morph = null;
  buttons.forEach(button => button.addEventListener('click', () => {
    const changed = document.documentElement.lang !== button.dataset.language;
    applyLanguage(button.dataset.language);
    if (!changed || !indicator || reducedMotion.matches) return;
    if (morph) morph.cancel();
    morph = indicator.animate([
      { transform: 'scale(1, 1)', borderRadius: '999px' },
      { transform: 'scale(1.28, .78)', borderRadius: '12px', offset: .35 },
      { transform: 'scale(.94, 1.06)', borderRadius: '20px', offset: .72 },
      { transform: 'scale(1, 1)', borderRadius: '999px' }
    ], { duration: 480, easing: 'cubic-bezier(.22, .7, .25, 1)' });
  }));
  let preferred = 'de';
  try { preferred = localStorage.getItem('codin-language') || 'de'; } catch { /* Default to German. */ }
  applyLanguage(preferred === 'en' ? 'en' : 'de');
})();
