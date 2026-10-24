<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11faFi8hCGn-j96XNpkkrF0l5UJbLziz3

## Run Locally

**Prerequisites:** Node.js, pnpm

Data is stored in Cloudflare D1 through a Worker API (`worker/`). Locally, `wrangler dev` runs the API against a local D1 database in `.wrangler/` with the Access check turned off.

1. Install dependencies:
   `pnpm install`
2. Create the local database schema (once, and again whenever a new file is added to `migrations/`):
   `pnpm db:migrate:local`
3. Build the app once (`wrangler dev` needs the `dist` folder to exist):
   `pnpm build`
4. Start the API on port 8787:
   `pnpm dev:api`
5. In a second terminal, start the app (it proxies `/api` to port 8787):
   `pnpm dev`

On first load, if the server has no data yet, whatever the browser has in localStorage from the earlier localStorage version of the app is uploaded once. localStorage is left untouched as a backup.

Checks: `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Database migrations

Schema changes live in `migrations/` as numbered SQL files (`0001_init.sql`, `0002_….sql`, …) and are committed with the code. Never edit a migration that has already been applied; add a new file instead. Wrangler records applied migrations in the `d1_migrations` table, so each command only runs the new ones.

- Local: `pnpm db:migrate:local`
- Production: `pnpm db:migrate:remote`

## Deploy to Cloudflare

One-time setup:

1. Log in to Cloudflare:
   `pnpm wrangler login`
2. Create the D1 database:
   `pnpm wrangler d1 create resume-builder`
   Copy the printed `database_id` into `d1_databases[0].database_id` in `wrangler.jsonc`.
3. Protect the site with Cloudflare Access. In the Zero Trust dashboard go to Access → Applications → Add an application → Self-hosted, enter the site's domain, and add a policy that allows only your email. For a `workers.dev` URL you can instead enable Cloudflare Access from the Worker's Settings → Domains & Routes.
4. Copy the Access values into `vars` in `wrangler.jsonc`:
   - `ACCESS_TEAM_DOMAIN`: your team domain, e.g. `<team>.cloudflareaccess.com` (shown in the Zero Trust settings)
   - `ACCESS_AUD`: the application's Audience (AUD) tag (Access → Applications → your app → Overview)

   Until both are set, the API rejects every request.

Every deploy:

1. Apply any new migrations:
   `pnpm db:migrate:remote`
2. Build and deploy:
   `pnpm deploy`

After deploying, open the site, sign in through Access and check your data loads. `curl https://<your-site>/api/state` without signing in must not return data.
