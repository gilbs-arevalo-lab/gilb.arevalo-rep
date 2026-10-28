import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://gilbs-arevalo.netlify.app',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  vite: {
    plugins: [
      {
        // In `npm run dev` / `npm run local`, open the admin at /admin (Netlify does this itself).
        name: 'admin-index',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Redirect first so the admin finds config.yml next to it (/admin/config.yml).
            if (req.url === '/admin') {
              res.writeHead(301, { Location: '/admin/' });
              return res.end();
            }
            if (req.url === '/admin/') req.url = '/admin/index.html';
            next();
          });
        },
      },
    ],
  },
});
