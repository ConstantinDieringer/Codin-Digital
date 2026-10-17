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
  const recipient = form.dataset.recipient.trim();
  if (recipient) {
    submit.disabled = false;
    status.textContent = 'Öffnet deine Anfrage in deinem E-Mail-Programm.';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!recipient || !form.reportValidity()) return;
    const data = new FormData(form);
    const subject = isEnglish() ? 'Project enquiry – Web design' : 'Projektanfrage – Webdesign';
    const body = `${isEnglish() ? 'First name' : 'Vorname'}: ${data.get('firstName')}\n${isEnglish() ? 'Last name' : 'Nachname'}: ${data.get('lastName')}\n${isEnglish() ? 'Email' : 'E-Mail'}: ${data.get('email')}\n\n${data.get('message')}`;
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
