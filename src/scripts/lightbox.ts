export interface LightboxItem {
  full: string;
  alt: string;
  title: string;
  sub: string;
  href?: string;
}

declare global {
  interface Window {
    __lightbox?: { open: (items: LightboxItem[], index: number) => void };
  }
}

const root = document.getElementById('lightbox');

if (root && !window.__lightbox) {
  const imgEl = root.querySelector<HTMLImageElement>('.lb-stage img')!;
  const stage = root.querySelector<HTMLElement>('.lb-stage')!;
  const titleEl = root.querySelector<HTMLElement>('.lb-title')!;
  const subEl = root.querySelector<HTMLElement>('.lb-sub')!;
  const countEl = root.querySelector<HTMLElement>('.lb-count')!;
  const linkEl = root.querySelector<HTMLAnchorElement>('.lb-link')!;
  const closeBtn = root.querySelector<HTMLButtonElement>('.lb-close')!;
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-lb-next]')!;

  let items: LightboxItem[] = [];
  let index = 0;
  let lastFocus: Element | null = null;

  const preload = (i: number) => {
    const it = items[(i + items.length) % items.length];
    if (it) new Image().src = it.full;
  };

  const render = () => {
    const it = items[index];
    imgEl.classList.remove('loaded');
    imgEl.onload = () => imgEl.classList.add('loaded');
    imgEl.src = it.full;
    imgEl.alt = it.alt;
    if (imgEl.complete) imgEl.classList.add('loaded');
    titleEl.textContent = it.title;
    subEl.textContent = it.sub;
    countEl.textContent = `${String(index + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    linkEl.hidden = !it.href;
    if (it.href) linkEl.href = it.href;
    const multi = items.length > 1;
    prevBtn.hidden = nextBtn.hidden = !multi;
    preload(index + 1);
    preload(index - 1);
  };

  const go = (d: number) => {
    index = (index + d + items.length) % items.length;
    render();
  };

  const open = (list: LightboxItem[], i: number) => {
    if (!list.length) return;
    items = list;
    index = i;
    lastFocus = document.activeElement;
    render();
    root.classList.add('open');
    document.querySelector('.cursor')?.classList.remove('big');
    root.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    root.classList.remove('open');
    root.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    if (lastFocus instanceof HTMLElement) lastFocus.focus({ preventScroll: true });
  };

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  stage.addEventListener('click', (e) => {
    if (e.target === stage) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!root.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key === 'Tab') {
      // Keep focus inside the dialog.
      const f = [...root.querySelectorAll<HTMLElement>('button:not([hidden]), a:not([hidden])')];
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Swipe on touch screens.
  let sx = 0;
  let sy = 0;
  stage.addEventListener('touchstart', (e) => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  });

  // Any element with [data-lb] opens the page's #lightbox-data set at that index.
  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLElement>('[data-lb]');
    if (!trigger) return;
    const data = document.getElementById('lightbox-data');
    if (!data) return;
    e.preventDefault();
    open(JSON.parse(data.textContent || '[]'), Number(trigger.dataset.lb));
  });

  window.__lightbox = { open };
}
