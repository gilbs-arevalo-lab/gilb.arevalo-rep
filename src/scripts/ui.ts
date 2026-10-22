// Theme toggle (initial theme is set inline in <head> to avoid a flash).
const toggle = document.querySelector<HTMLButtonElement>('.theme-toggle');
toggle?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  toggle.setAttribute('aria-pressed', String(next === 'dark'));
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* storage unavailable: theme simply won't persist */
  }
});
toggle?.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));

// Mobile menu.
const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn');
const menu = document.querySelector<HTMLElement>('.mobile-menu');
menuBtn?.addEventListener('click', () => {
  const open = !menu?.classList.contains('open');
  menu?.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.textContent = open ? 'Close' : 'Menu';
});

// Cursor follower: an orange dot that eases toward the pointer and grows over photos.
const cursor = document.querySelector<HTMLElement>('.cursor');
if (cursor && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let cx = x;
  let cy = y;
  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    cursor.classList.add('visible');
    const target = (e.target as Element).closest<HTMLElement>('[data-cursor]');
    cursor.classList.toggle('big', !!target && !document.querySelector('.lightbox.open'));
    cursor.textContent = target?.dataset.cursor ?? '';
  });
  document.addEventListener('pointerleave', () => cursor.classList.remove('visible'));
  const tick = () => {
    cx += (x - cx) * 0.2;
    cy += (y - cy) * 0.2;
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();
}

// Touch screens have no hover: turn photos to colour while they're in view.
if (matchMedia('(hover: none)').matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.target.classList.toggle('is-color', e.isIntersecting)),
    { rootMargin: '-30% 0px -30% 0px' },
  );
  document.querySelectorAll('.bw').forEach((el) => {
    if (!el.closest('.canvas')) io.observe(el);
  });
}

// Photo protection: no right-click menu, drag-to-save or long-press save on photos.
// A small speech bubble explains why instead. (Text and links keep their normal menu.)
const PHOTO = 'img, .tile, .shot, .card-img, .portrait, .lb-stage, .preview';
const guard = document.querySelector<HTMLElement>('.guard');
let guardTimer: number | undefined;

const hideGuard = () => guard?.classList.remove('show');

document.addEventListener('contextmenu', (e) => {
  const target = e.target as Element;
  if (!target.closest(PHOTO)) return;
  e.preventDefault();
  if (!guard) return;
  // Place the bubble above the pointer, kept inside the screen.
  guard.classList.remove('show');
  guard.style.left = '0px';
  guard.style.top = '0px';
  const { width, height } = guard.getBoundingClientRect();
  const x = Math.min(Math.max(12, e.clientX - width / 2), innerWidth - width - 12);
  const above = e.clientY - height - 18;
  const y = above > 12 ? above : e.clientY + 18;
  guard.style.left = `${x}px`;
  guard.style.top = `${y}px`;
  guard.style.setProperty('--tail', `${Math.min(Math.max(16, e.clientX - x), width - 16)}px`);
  guard.classList.toggle('below', above <= 12);
  void guard.offsetWidth; // restart the pop-in animation
  guard.classList.add('show');
  clearTimeout(guardTimer);
  guardTimer = window.setTimeout(hideGuard, 3200);
});

document.addEventListener('dragstart', (e) => {
  if ((e.target as Element).closest?.(PHOTO)) e.preventDefault();
});
document.addEventListener('pointerdown', (e) => {
  if (!(e.target as Element).closest('.guard')) hideGuard();
});
addEventListener('scroll', hideGuard, { passive: true });
addEventListener('keydown', (e) => e.key === 'Escape' && hideGuard());
