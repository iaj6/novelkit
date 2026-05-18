// @ts-check
import { defineConfig } from "astro/config";

/**
 * Deployment target: GitHub Pages, project page.
 *
 *   https://<user>.github.io/novelkit/
 *
 * For local dev with `npm run dev`, Astro will serve at
 *   http://localhost:4321/novelkit/
 * to match production URL shape (so internal links exercised in dev
 * behave the same as in deploy).
 *
 * Switching to a custom domain later: remove the `base` line and
 * update `site` to the new domain. Astro's URL helpers and
 * `import.meta.env.BASE_URL` will pick up the change automatically.
 */
const repoName = "novelkit";

// In CI (GitHub Actions), GITHUB_REPOSITORY_OWNER is auto-populated.
// Locally, fall back to a placeholder so the site builds.
const owner = process.env.GITHUB_REPOSITORY_OWNER || "your-github-username";

export default defineConfig({
  site: `https://${owner}.github.io`,
  base: `/${repoName}/`,
  trailingSlash: "always",
});
