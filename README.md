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
4. To use AI generation locally, create a `.dev.vars` file in the project root with your OpenAI API key (it is gitignored):
   ```
   OPENAI_API_KEY=sk-...
   ```
   Restart `pnpm dev:api` whenever you change it.
5. Start the API on port 8787:
   `pnpm dev:api`
6. In a second terminal, start the app (it proxies `/api` to port 8787):
   `pnpm dev`

On first load, if the server has no data yet, whatever the browser has in localStorage from the earlier localStorage version of the app is uploaded once. localStorage is left untouched as a backup.

Checks: `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Database migrations

Schema changes live in `migrations/` as numbered SQL files (`0001_init.sql`, `0002_….sql`, …) and are committed with the code. Never edit a migration that has already been applied; add a new file instead. Wrangler records applied migrations in the `d1_migrations` table, so each command only runs the new ones.

- Local: `pnpm db:migrate:local`
- Production: `pnpm db:migrate:remote`

## Deploy to Cloudflare

The whole app runs as one Cloudflare Worker. The Worker serves the built frontend and the `/api` endpoints, and stores your data in a D1 database. Cloudflare Access puts a login in front of the site so only you can open it.

### Before you start

- A Cloudflare account. The free plan is enough.
- Zero Trust turned on for that account. Open **Zero Trust** in the Cloudflare dashboard once; it asks you to pick a team name and a plan (choose Free).
- Dependencies installed:

  ```sh
  pnpm install
  ```

> Always deploy with `pnpm run deploy`. Plain `pnpm deploy` is a different, built-in pnpm command and won't deploy anything.

### First deploy (one time only)

**1. Log in to Cloudflare**

```sh
pnpm wrangler login
```

A browser window opens; approve the request.

**2. Create the database**

```sh
pnpm wrangler d1 create resume-builder
```

The output includes a `database_id`. Open `wrangler.jsonc` and paste it in place of `REPLACE_WITH_DATABASE_ID`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "resume-builder",
    "database_id": "<paste the database_id here>",
    "migrations_dir": "migrations"
  }
],
```

**3. Create the tables**

```sh
pnpm db:migrate:remote
```

Type `y` if Wrangler asks you to confirm.

**4. Deploy**

```sh
pnpm run deploy
```

At the end Wrangler prints your site's URL, for example `https://resume-builder.<your-subdomain>.workers.dev`. The page loads, but no data will load until you've done steps 5 to 7. That's expected.

**5. Put a login in front of the site**

In the Cloudflare dashboard, go to **Workers & Pages** → **resume-builder** → **Settings** → **Domains & Routes**.

- To use the `workers.dev` URL: turn on **Cloudflare Access** for the `workers.dev` route.
- To use your own domain instead: add it here first, then in **Zero Trust** go to **Access** → **Applications** → **Add an application** → **Self-hosted** and enter that domain.

Then open the Access application that was created and edit its policy so it only allows your email address.

**6. Tell the Worker about the login**

Fill in the two values under `vars` in `wrangler.jsonc`:

```jsonc
"vars": {
  "ACCESS_TEAM_DOMAIN": "<team>.cloudflareaccess.com",
  "ACCESS_AUD": "<audience tag>"
}
```

- `ACCESS_TEAM_DOMAIN`: your team name followed by `.cloudflareaccess.com`. It's shown in the Zero Trust settings.
- `ACCESS_AUD`: in **Zero Trust** go to **Access** → **Applications**, open your application, and copy the **Application Audience (AUD) Tag**.

The API rejects every request until both values are set.

**7. Deploy again**

```sh
pnpm run deploy
```

**8. Check it works**

- Open the site. You should be asked to log in. After logging in, your data loads.
- From a terminal, without logging in:

  ```sh
  curl -i https://<your-site>/api/state
  ```

  This must **not** return your data. You should see either a redirect to the Cloudflare login page or `401 Unauthorized`.

Commit the updated `wrangler.jsonc`. The database ID and the Access values aren't secrets.

### Add the OpenAI API key (AI generation)

CV and cover letter generation calls OpenAI from the Worker. The provider, model, reasoning effort and prices are set under `vars` in `wrangler.jsonc`; the API key is a secret and is never stored in the repo.

**1. Get a key**

Create an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys). It starts with `sk-`.

**2. Store it as a Worker secret**

From the project folder:

```sh
pnpm wrangler secret put OPENAI_API_KEY
```

Wrangler asks for the value; paste the key and press Enter. The prompt keeps the key out of your shell history. The secret takes effect immediately on the deployed Worker; you don't need to deploy again.

If you haven't deployed yet, Wrangler offers to create the Worker first; answer `y`.

**3. Check it is set**

```sh
pnpm wrangler secret list
```

`OPENAI_API_KEY` should be listed (the value is never shown).

**4. Try it**

Open the site, save your job bank in **Settings → Job bank**, then start a new application with a job description and choose **Generate from job bank** in the CV step. If the key is missing, generation shows `OpenAI is not configured`.

To replace the key, run the same `secret put` command again. To remove it: `pnpm wrangler secret delete OPENAI_API_KEY`.

### Deploying updates

Run these from the project folder each time:

```sh
pnpm typecheck && pnpm test   # make sure everything passes
pnpm db:migrate:remote        # apply new migrations, if there are any
pnpm run deploy               # build and deploy
```

### Troubleshooting

- **The site loads but your data doesn't:** run `pnpm wrangler tail` and reload the page to see the Worker's logs. If the API returns `401`, `ACCESS_TEAM_DOMAIN` or `ACCESS_AUD` in `wrangler.jsonc` is empty or doesn't match your Access application. Fix it and run `pnpm run deploy` again.
- **Errors about a missing table:** the migrations haven't run against production yet. Run `pnpm db:migrate:remote`.
- **Generation says `OpenAI is not configured`:** the `OPENAI_API_KEY` secret is missing. See [Add the OpenAI API key](#add-the-openai-api-key-ai-generation).
- **`pnpm deploy` printed an error instead of deploying:** use `pnpm run deploy` instead.
