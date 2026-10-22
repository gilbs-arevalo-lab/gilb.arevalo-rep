/* global CMS, h, createClass */

// Preview pane for Projects: looks like the real project page, and loads photos reliably.
// Decap normally loads each preview image through the GitHub API, which can fail and show a
// broken image. Each photo here tries, in order:
//   1. Decap's own asset URL (needed for photos just uploaded and not yet published)
//   2. the live site
//   3. GitHub's public raw file URL (published but not yet deployed)
const LIVE = 'https://gilbs-arevalo.netlify.app';
const RAW = 'https://raw.githubusercontent.com/gilbs-arevalo-lab/gilb.arevalo-rep/main/public';

const CATEGORIES = { portraits: 'Portraits', streets: 'Streets', travel: 'Travel', events: 'Events' };

function sources(path, getAsset) {
  if (!path) return [];
  if (/^https?:/.test(path)) return [path];
  const list = [];
  try {
    const asset = getAsset(path);
    if (asset) list.push(String(asset));
  } catch (e) {
    /* fall through to the other sources */
  }
  list.push(LIVE + path, RAW + path);
  return list.filter((s, i) => s && list.indexOf(s) === i);
}

// An <img> that moves on to the next source when one fails to load.
function photo(path, getAsset, alt, className) {
  const list = sources(path, getAsset);
  if (!list.length) return null;
  return h('img', {
    className,
    alt: alt || '',
    src: list[0],
    'data-step': '0',
    onError: (e) => {
      const img = e.target;
      const next = Number(img.dataset.step) + 1;
      if (next < list.length) {
        img.dataset.step = String(next);
        img.src = list[next];
      }
    },
  });
}

const ProjectPreview = createClass({
  render() {
    const { entry, getAsset, widgetFor } = this.props;
    const data = entry.get('data');
    const title = data.get('title') || 'Untitled project';
    const category = CATEGORIES[data.get('category')] || '';
    const date = data.get('date');
    const year = date ? String(date).slice(0, 4) : '';
    const meta = [category, data.get('location'), year].filter(Boolean).join(' · ');
    const photos = (data.get('photos') || []).toJS ? data.get('photos').toJS() : [];

    return h(
      'main',
      { className: 'pv' },
      h('p', { className: 'pv-eyebrow' }, meta),
      h('h1', { className: 'pv-title' }, title),
      data.get('client') ? h('p', { className: 'pv-client' }, 'Client: ' + data.get('client')) : null,
      h('div', { className: 'pv-story' }, widgetFor('body')),
      data.get('cover')
        ? h('section', null, h('p', { className: 'pv-label' }, 'Cover photo'), photo(data.get('cover'), getAsset, title, 'pv-cover'))
        : null,
      h('p', { className: 'pv-label' }, `Photos (${photos.length})`),
      h(
        'div',
        { className: 'pv-grid' },
        photos.map((p, i) => h('figure', { key: i }, photo(p.image, getAsset, p.alt, 'pv-photo'))),
      ),
    );
  },
});

CMS.registerPreviewTemplate('projects', ProjectPreview);

CMS.registerPreviewStyle(
  `
  body { margin: 0; background: #f5f3ef; color: #111; font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .pv { padding: 32px; max-width: 1100px; }
  .pv-eyebrow, .pv-label { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: #6d6a64; margin: 0 0 8px; }
  .pv-label { margin-top: 32px; }
  .pv-title { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-size: 56px; line-height: 1; margin: 0 0 16px; }
  .pv-client { color: #6d6a64; margin: 0 0 8px; }
  .pv-story { color: #6d6a64; max-width: 560px; line-height: 1.6; }
  .pv-cover { display: block; width: 100%; max-width: 420px; aspect-ratio: 4 / 5; object-fit: cover; background: #ebe8e2; }
  .pv-grid { columns: 2 220px; column-gap: 16px; }
  .pv-grid figure { margin: 0 0 16px; break-inside: avoid; }
  .pv-photo { display: block; width: 100%; height: auto; background: #ebe8e2; min-height: 40px; }
  `,
  { raw: true },
);
