/* global CMS, h, createClass */

// Preview pane for Projects: looks like the real project page, and loads photos reliably.
// Decap normally loads each preview image through the GitHub API, which can fail and show a
// broken image. Each photo here tries, in order:
//   0. the local copy of a photo picked in this session (not published yet)
//   1. Decap's own asset URL
//   2. the live site
//   3. GitHub's public raw file URL (published but not yet deployed)
const LIVE = 'https://gilbs-arevalo.netlify.app';
const RAW = 'https://raw.githubusercontent.com/gilbs-arevalo-lab/gilb.arevalo-rep/main/public';

const CATEGORIES = { portraits: 'Portraits', streets: 'Streets', travel: 'Travel', events: 'Events' };

function sources(path, getAsset, field) {
  if (!path) return [];
  if (/^https?:/.test(path)) return [path];
  const list = [];
  // A photo picked in this session but not published yet (captured in upload-status.js).
  const draft = window.__gaDraftPhotos && window.__gaDraftPhotos[window.__gaPhotoKey(path)];
  if (draft) list.push(draft);
  try {
    const asset = getAsset(path, field);
    if (asset) list.push(String(asset));
  } catch (e) {
    /* fall through to the other sources */
  }
  list.push(LIVE + path, RAW + path);
  return list.filter((s, i) => s && list.indexOf(s) === i);
}

// An <img> that moves on to the next source when one fails to load.
function photo(path, getAsset, alt, className) {
  return fallbackImg(sources(path, getAsset), alt, className);
}

function fallbackImg(list, alt, className) {
  if (!list.length) return null;
  return h('img', {
    // A new key whenever the sources change, so the <img> starts again from the first source
    // (Decap first gives a placeholder path for new photos, then the real draft file).
    key: list.join('|'),
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

// Photo field ("ga-image" in config.yml): Decap's own image field, with its thumbnail replaced
// by one that uses the same fallback sources as the preview, plus the file name.
const BaseImage = CMS.getWidget('image');

const PhotoControl = createClass({
  getInitialState() {
    return { list: [] };
  },
  componentDidMount() {
    this.resolve();
  },
  // Decap asks the field whether to re-render (e.g. when a photo is chosen in the media
  // library). Pass that question on to Decap's own image control inside this wrapper.
  shouldComponentUpdate(nextProps, nextState) {
    if (nextState && nextState !== this.state) return true;
    const inner = this.inner;
    return inner && inner.shouldComponentUpdate ? inner.shouldComponentUpdate(nextProps) : true;
  },
  componentDidUpdate(prev) {
    if (prev.value !== this.props.value || prev.getAsset !== this.props.getAsset) this.resolve();
  },
  resolve() {
    const { value, getAsset, field } = this.props;
    const list = typeof value === 'string' ? sources(value, getAsset, field) : [];
    if (list.join() !== this.state.list.join()) this.setState({ list });
  },
  render() {
    const { value } = this.props;
    const has = typeof value === 'string' && value;
    return h(
      'div',
      { className: 'ga-image' + (has ? ' has-value' : '') },
      has
        ? h(
            'div',
            { className: 'ga-thumb' },
            fallbackImg(this.state.list, '', 'ga-thumb-img'),
            h('span', { className: 'ga-thumb-name' }, value.split('/').pop()),
          )
        : null,
      h(BaseImage.control, Object.assign({}, this.props, { ref: (r) => (this.inner = r) })),
    );
  },
});

CMS.registerWidget('ga-image', PhotoControl, BaseImage.preview, BaseImage.schema);

// Hide Decap's own (sometimes broken) thumbnail inside our field; ours is shown above it.
const adminStyle = document.createElement('style');
adminStyle.textContent = `
  .ga-image.has-value div:has(> img[role='presentation']) { display: none; }
  .ga-thumb { display: flex; align-items: flex-end; gap: 12px; margin: 4px 0 12px; }
  .ga-thumb-img { width: 150px; height: 110px; object-fit: contain; background: #f1f0ee; border: 1px solid #dfdfe3; border-radius: 5px; }
  .ga-thumb-name { font-size: 12px; color: #798291; overflow-wrap: anywhere; }
`;
document.head.appendChild(adminStyle);

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
