(() => {
  'use strict';
  const preview = document.querySelector('#design-preview');
  const mobilePreview = matchMedia('(max-width: 700px)');
  const previewButtons = [...document.querySelectorAll('[data-preview-mode]')];
  let chosenPreview = null;
  const isEnglish = () => document.documentElement.lang === 'en';
  function updatePreviewLabel() {
    if (!preview) return;
    const mode = preview.dataset.mode === 'mobile' ? 'Mobile' : 'Desktop';
    preview.setAttribute('aria-label', isEnglish() ? `Illustrative website preview in ${mode.toLowerCase()} format` : `Illustrative Website-Vorschau im ${mode}-Format`);
  }
  document.addEventListener('codin:language-change', updatePreviewLabel);
  function syncPreview() {
    if (!preview) return;
    const mode = chosenPreview || (mobilePreview.matches ? 'mobile' : 'desktop');
    preview.dataset.mode = mode;
    previewButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.previewMode === mode)));
    updatePreviewLabel();
    document.dispatchEvent(new CustomEvent('codin:preview-mode', { detail: { mode } }));
  }
  previewButtons.forEach(button => button.addEventListener('click', () => {
    chosenPreview = button.dataset.previewMode;
    syncPreview();
  }));
  mobilePreview.addEventListener('change', syncPreview);
  syncPreview();
  const navigation = document.querySelector('.site-navigation');
  const toggle = document.querySelector('.nav-toggle');
  const servicesMenu = document.querySelector('.nav-services');
  if (navigation && toggle) {
    const close = () => {
      navigation.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (servicesMenu) servicesMenu.open = false;
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      navigation.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    navigation.addEventListener('click', event => { if (event.target.closest('a')) close(); });
    matchMedia('(min-width: 1051px)').addEventListener('change', event => { if (event.matches) close(); });
    document.addEventListener('pointerdown', event => { if (!navigation.contains(event.target)) close(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && navigation.contains(document.activeElement)) { close(); toggle.focus(); }
    });
  }

  const form = document.querySelector('.contact-form');
  if (!form) return;
  const submit = form.querySelector('.contact-submit');
  const status = form.querySelector('.contact-form-status');
  // Web3Forms access keys are public by design; they only allow sending to the address they were issued for.
  const accessKey = form.dataset.accessKey.trim();
  const messages = {
    unavailable: ['Das Kontaktformular wird in Kürze freigeschaltet.', 'The contact form will be available soon.'],
    ready: ['Deine Anfrage geht direkt an mich. Ich melde mich zeitnah.', 'Your enquiry comes straight to me. I’ll get back to you soon.'],
    sending: ['Wird gesendet …', 'Sending …'],
    sent: ['Danke! Deine Anfrage ist angekommen.', 'Thank you! Your enquiry has arrived.'],
    failed: ['Senden hat nicht geklappt. Bitte versuch es noch einmal.', 'Sending failed. Please try again.']
  };
  let state = accessKey ? 'ready' : 'unavailable';
  const renderStatus = () => { status.textContent = messages[state][isEnglish() ? 1 : 0]; };
  document.addEventListener('codin:language-change', renderStatus);
  submit.disabled = !accessKey;
  renderStatus();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!accessKey || submit.disabled || !form.reportValidity()) return;
    const data = new FormData(form);
    if (data.get('botcheck')) return;
    const name = `${data.get('firstName')} ${data.get('lastName')}`.trim();
    submit.disabled = true;
    state = 'sending';
    renderStatus();
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Projektanfrage von ${name}`,
          from_name: 'Codin-Digital Website',
          name,
          email: data.get('email'),
          message: data.get('message')
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || response.statusText);
      form.reset();
      state = 'sent';
    } catch {
      state = 'failed';
    }
    submit.disabled = false;
    renderStatus();
  });
})();
