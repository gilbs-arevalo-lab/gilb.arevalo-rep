# gilbs.arevalo — Photography portfolio

Portfolio site for Gilbert Arevalo. Built with [Astro](https://astro.build), hosted on Netlify, and managed through an admin panel (Decap CMS) at `/admin`.

## Pages

| Page | Path | What it does |
| --- | --- | --- |
| Selected Work | `/` | A canvas you can drag in any direction, with inertia. Photos are black and white and turn to color on hover. Clicking a photo opens the lightbox. |
| All Projects | `/projects` | List or grid view, category filters (Portraits / Streets / Travel / Events), and a preview image that follows the cursor. |
| Project | `/projects/<slug>` | Story, project details, photo gallery with lightbox, next and previous project. |
| About | `/about` | Bio, rides, and what I love to shoot. |
| Contact | `/contact` | Inquiry form handled by Netlify Forms. |

The theme toggle (light/dark) follows the system setting on first visit and remembers the choice.

## Run locally

```bash
npm install
npm run dev          # http://localhost:4321
```

To use the admin panel locally, run `npm run cms` in a second terminal and open http://localhost:4321/admin. No login is needed, and changes are written straight to the files.

## Deploy to Netlify (one-time setup)

1. Push this folder to a GitHub repository, e.g. `gilbs-arevalo`.
2. In Netlify, choose **Add new site → Import from Git** and pick the repo. The build settings come from `netlify.toml`.
3. **Contact form emails:** go to Netlify → *Forms* → enable form detection, then redeploy. Under *Forms → Form notifications*, add an **Email notification** for the `inquiry` form to `gilbert.arevalo2021@gmail.com`.
4. **Admin login:**
   - Create a GitHub OAuth App (GitHub → Settings → Developer settings → OAuth Apps). Set the callback URL to `https://api.netlify.com/auth/done`.
   - In Netlify, open *Project configuration → Access & security → OAuth*, install the **GitHub** provider, and paste the app's Client ID and Secret.
   - In `public/admin/config.yml`, set `repo:` to your `username/repo`.
5. Optionally, change the site URL in `astro.config.mjs`, `public/admin/config.yml` and `public/robots.txt` to your own domain.

## Adding a project (admin)

1. Open `https://<your-site>/admin` and log in with GitHub.
2. Choose **Projects → New Project**.
3. Fill in the title and category (Portraits, Streets, Travel or Events), plus location and date.
4. Upload a cover photo, then add photos under **Photos**.
5. Click **Publish**. The site rebuilds in about a minute.

"Show on Selected Work" controls whether the project's photos appear on the home canvas.

Photos are stored in `public/uploads/`. On Netlify they're automatically resized and served as WebP/AVIF through the Netlify Image CDN. Upload high-quality JPEGs, ideally around 2000–2500 px on the long side.

## Replacing the placeholder photos

All current photos are placeholders from picsum.photos. Delete the sample projects in the admin (or remove the files in `src/content/projects/` and `public/uploads/`), then add your own. Replace `public/uploads/about-portrait.jpg` with your portrait.

## Customizing

- Colors and fonts are tokens at the top of `src/styles/global.css`. The accent is `--accent: #D4772C`.
- Name, email and Instagram are set in `src/lib/site.ts`.
- To change how slowly the canvas follows the mouse, edit `EASE` in `src/pages/index.astro`. A lower value adds more delay.
