/* Display-only registration codes. No cashier state, API or messenger opening. */
(() => {
  'use strict';
  const opener = document.getElementById('registration-qr-open');
  const dialog = document.getElementById('registration-qr-dialog');
  if (!opener || !dialog || typeof dialog.showModal !== 'function') return;
  const image = document.getElementById('registration-qr-image');
  const preview = document.getElementById('registration-qr-preview');
  const choice = document.getElementById('registration-qr-choice');
  const status = document.getElementById('registration-qr-status');
  const subtitle = document.getElementById('registration-qr-subtitle');
  const buttons = [...dialog.querySelectorAll('[data-registration-channel]')];
  const channels = {
    max: {name: 'MAX', src: './registration-qr-max-20261004.svg'},
    telegram: {name: 'Telegram', src: './registration-qr-telegram-20261004.svg'}
  };
  let overflow = [];
  const reset = () => {
    image.onload = image.onerror = null;
    image.removeAttribute('src');
    image.alt = '';
    preview.hidden = true;
    choice.hidden = false;
    status.textContent = '';
    subtitle.textContent = 'Выберите мессенджер клиента';
    buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
  };
  opener.addEventListener('click', () => {
    if (dialog.open) return;
    reset();
    dialog.showModal();
    overflow = [document.documentElement, document.body].map(element => ({
      element, value: element.style.getPropertyValue('overflow'),
      priority: element.style.getPropertyPriority('overflow')
    }));
    overflow.forEach(({element}) => element.style.setProperty('overflow', 'hidden'));
  });
  buttons.forEach(button => button.addEventListener('click', () => {
    const channel = channels[button.dataset.registrationChannel];
    if (!channel) return;
    preview.hidden = true;
    choice.hidden = true;
    status.textContent = 'Загружаю QR-код…';
    subtitle.textContent = 'Карта «Мои места» в ' + channel.name;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const source = new URL(channel.src, document.baseURI).href;
    image.alt = 'QR-код бота «Мои места» в ' + channel.name;
    image.onload = () => {
      if (!dialog.open || image.currentSrc !== source) return;
      status.textContent = '';
      preview.hidden = false;
    };
    image.onerror = () => {
      if (!dialog.open || image.src !== source) return;
      status.textContent = 'QR-код не загрузился. Выберите мессенджер ещё раз.';
    };
    image.src = source;
  }));
  ['registration-qr-close', 'registration-qr-return'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const first = document.getElementById('registration-qr-close');
    const last = document.getElementById('registration-qr-return');
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  });
  dialog.addEventListener('close', () => {
    overflow.forEach(({element, value, priority}) => {
      if (value) element.style.setProperty('overflow', value, priority);
      else element.style.removeProperty('overflow');
    });
    overflow = [];
    reset();
    opener.focus({preventScroll: true});
  });
  opener.hidden = false;
})();
