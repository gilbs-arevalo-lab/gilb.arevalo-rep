// Upload status card for the admin.
// Photos picked in the media library are only drafts; they're uploaded when you click Publish.
// Decap saves photos and projects to GitHub with a few API calls: one "blob" per file, then a
// tree, a commit and a branch update. This watches those calls (it must load before Decap) and
// shows a small card: what is uploading, how far along it is, and a clear "Saved" once the
// branch update succeeds, which means the files are safely in the repository.
(function () {
  const realFetch = window.fetch.bind(window);

  let card, titleEl, detailEl, barEl;
  let hideTimer;
  let batch = null; // { photos, files, bytes, doneBytes, inFlight, failed, paths }
  let failedAt = 0; // after a failure, ignore the rest of that save so the error stays visible

  const fmtSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
  const isImage = (b64) => /^(\/9j\/|iVBOR|UklGR|R0lGOD|AAAA)/.test(b64 || '');

  function ensureCard() {
    if (card) return;
    card = document.createElement('div');
    card.className = 'ga-upload';
    card.setAttribute('role', 'status');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML =
      '<div class="ga-upload-row"><span class="ga-upload-icon"></span><strong class="ga-upload-title"></strong></div>' +
      '<div class="ga-upload-detail"></div><div class="ga-upload-track"><div class="ga-upload-bar"></div></div>';
    titleEl = card.querySelector('.ga-upload-title');
    detailEl = card.querySelector('.ga-upload-detail');
    barEl = card.querySelector('.ga-upload-bar');
    document.body.appendChild(card);
  }

  function show(state, title, detail, pct) {
    ensureCard();
    clearTimeout(hideTimer);
    card.dataset.state = state;
    titleEl.textContent = title;
    detailEl.textContent = detail || '';
    barEl.style.width = (pct == null ? 100 : Math.max(4, Math.min(100, pct))) + '%';
    card.classList.add('show');
    if (state !== 'busy') hideTimer = setTimeout(() => card.classList.remove('show'), state === 'error' ? 12000 : 7000);
  }

  function render() {
    const b = batch;
    const pct = b.bytes ? (b.doneBytes / b.bytes) * 100 : 0;
    if (b.photos) {
      const done = b.photosDone;
      show('busy', `Uploading ${b.photos === 1 ? 'photo' : b.photos + ' photos'}…`, `${done} of ${b.photos} uploaded · ${fmtSize(b.bytes)} — keep this page open`, pct * 0.9);
    } else {
      show('busy', 'Saving project…', 'Keep this page open', 50);
    }
  }

  function startBatch() {
    if (!batch) batch = { photos: 0, photosDone: 0, files: 0, bytes: 0, doneBytes: 0, inFlight: 0, failed: false, paths: [] };
    return batch;
  }

  function finish(ok, message) {
    const b = batch;
    batch = null;
    if (!b) return;
    if (!ok || b.failed) {
      failedAt = Date.now();
      show('error', 'Upload failed', message || 'Nothing was saved. Check your connection and try again.', 100);
      return;
    }
    const names = b.paths.map((p) => p.split('/').pop());
    const what = b.photos ? `${b.photos === 1 ? 'Photo' : b.photos + ' photos'} uploaded` : 'Project saved';
    const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    const where = local
      ? 'saved to your project files. Refresh the site to see it (nothing is live until you push).'
      : 'safely saved. The live site updates in about a minute.';
    const detail = (names.length ? names.join(', ') + ' — ' : '') + where;
    show('done', what + ' ✓', detail, 100);
  }

  async function track(url, init, kind, info) {
    const b = startBatch();
    b.inFlight++;
    if (kind === 'blob') {
      b.files++;
      b.bytes += info.size;
      if (info.image) b.photos++;
    }
    render();
    try {
      const res = await realFetch(url, init);
      if (!res.ok) {
        b.failed = true;
        finish(false, `GitHub answered ${res.status}. Nothing was saved — please try again.`);
      } else if (kind === 'blob') {
        b.doneBytes += info.size;
        if (info.image) b.photosDone++;
        if (batch) render();
      } else if (kind === 'commit') {
        finish(true);
      }
      return res;
    } catch (err) {
      b.failed = true;
      finish(false);
      throw err;
    } finally {
      b.inFlight--;
    }
  }

  function bodyJSON(init) {
    try {
      return init && typeof init.body === 'string' ? JSON.parse(init.body) : null;
    } catch (e) {
      return null;
    }
  }

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url;
    const method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    if (!url || method === 'GET') return realFetch(input, init);
    if (Date.now() - failedAt < 4000) return realFetch(input, init);

    // GitHub backend (live admin)
    if (/api\.github\.com\/repos\/.+\/git\/blobs$/.test(url) && method === 'POST') {
      const body = bodyJSON(init) || {};
      const size = Math.round(((body.content || '').length * 3) / 4);
      return track(input, init, 'blob', { size, image: isImage(body.content) });
    }
    if (/api\.github\.com\/repos\/.+\/git\/trees$/.test(url) && method === 'POST') {
      const body = bodyJSON(init) || {};
      const b = startBatch();
      (body.tree || []).forEach((t) => /\.(jpe?g|png|webp|gif|avif)$/i.test(t.path) && b.paths.push(t.path));
      return realFetch(input, init);
    }
    if (/api\.github\.com\/repos\/.+\/git\/refs\/heads\//.test(url) && method === 'PATCH') {
      return track(input, init, 'commit');
    }

    // Local backend (npm run cms) — one request per save
    if (/localhost:8081\/api\/v1/.test(url) && method === 'POST') {
      const body = bodyJSON(init) || {};
      if (body.action === 'persistMedia') {
        const asset = (body.params && body.params.asset) || {};
        const content = asset.content || '';
        startBatch().paths.push(asset.path || '');
        return track(input, init, 'blob', { size: Math.round((content.length * 3) / 4), image: true }).then((res) => {
          if (res.ok) finish(true);
          return res;
        });
      }
      if (body.action === 'persistEntry') {
        // Photos picked in the media library are drafts until Publish; they're sent here.
        const b = startBatch();
        ((body.params && body.params.assets) || []).forEach((a) => {
          const size = Math.round(((a.content || '').length * 3) / 4);
          b.files++;
          b.photos++;
          b.bytes += size;
          b.paths.push(a.path || '');
        });
        return track(input, init, 'commit');
      }
    }
    return realFetch(input, init);
  };

  // Keep a local copy of photos picked in the media library, so their thumbnails can show
  // before they're published (see preview.js). Keyed like Decap names the uploaded file.
  window.__gaDraftPhotos = window.__gaDraftPhotos || {};
  window.__gaPhotoKey = (name) => String(name || '').split('/').pop().toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  document.addEventListener(
    'change',
    (e) => {
      const input = e.target;
      if (!input || input.type !== 'file' || !input.files) return;
      [...input.files].forEach((f) => {
        if (/^image\//.test(f.type)) window.__gaDraftPhotos[window.__gaPhotoKey(f.name)] = URL.createObjectURL(f);
      });
    },
    true,
  );

  // Warn before closing the tab in the middle of an upload.
  window.addEventListener('beforeunload', (e) => {
    if (batch && batch.inFlight > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    .ga-upload { position: fixed; left: 20px; bottom: 20px; z-index: 100000; width: min(360px, calc(100vw - 40px));
      background: #111; color: #f5f3ef; border-radius: 12px; padding: 14px 16px 12px; font: 13px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif;
      box-shadow: 0 12px 32px rgba(0,0,0,.28); opacity: 0; transform: translateY(10px); pointer-events: none;
      transition: opacity .25s ease, transform .35s cubic-bezier(.22,1,.36,1); }
    .ga-upload.show { opacity: 1; transform: none; pointer-events: auto; }
    .ga-upload-row { display: flex; align-items: center; gap: 10px; }
    .ga-upload-title { font-size: 14px; font-weight: 600; }
    .ga-upload-detail { color: #b9b5ad; margin: 4px 0 10px 28px; overflow-wrap: anywhere; }
    .ga-upload-track { height: 4px; background: rgba(255,255,255,.14); border-radius: 4px; overflow: hidden; margin-left: 28px; }
    .ga-upload-bar { height: 100%; width: 4%; background: #D4772C; border-radius: 4px; transition: width .4s ease; }
    .ga-upload-icon { width: 18px; height: 18px; flex: none; border-radius: 50%; border: 2px solid rgba(255,255,255,.25); border-top-color: #D4772C; animation: ga-spin .8s linear infinite; }
    .ga-upload[data-state='done'] .ga-upload-icon { animation: none; border: 0; background: #3a9a5b; }
    .ga-upload[data-state='done'] .ga-upload-icon::after { content: '✓'; display: block; text-align: center; line-height: 18px; font-size: 12px; color: #fff; }
    .ga-upload[data-state='done'] .ga-upload-bar { background: #3a9a5b; }
    .ga-upload[data-state='error'] .ga-upload-icon { animation: none; border: 0; background: #c0392b; }
    .ga-upload[data-state='error'] .ga-upload-icon::after { content: '!'; display: block; text-align: center; line-height: 18px; font-weight: 700; color: #fff; }
    .ga-upload[data-state='error'] .ga-upload-bar { background: #c0392b; }
    @keyframes ga-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
})();
