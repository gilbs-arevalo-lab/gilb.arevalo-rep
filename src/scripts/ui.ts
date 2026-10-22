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
