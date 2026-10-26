# Enabling AI suggestions (OpenAI)

You build each CV and cover letter yourself: new, copied from another application, or imported from JSON. While you edit, the app can review it against the job description and suggest changes that you accept or decline one by one:

- **Add**: achievements, roles, projects, languages, references, abilities or cover letter paragraphs from your job bank and CV facts that the job needs and the CV lacks.
- **Remove**: roles, bullets or sections that are irrelevant or distracting for this job.
- **Refine**: wording, the tagline, ability titles and job keywords, without adding facts.

The Worker calls the OpenAI Responses API with one prompt (`worker/prompts/suggestions.ts`). To turn this on you need an OpenAI API key, plus the settings already in `wrangler.jsonc`.

## What you need

- An OpenAI account with billing enabled.
- An API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys). It starts with `sk-`.
- A model that supports structured outputs (JSON schema) and the `reasoning` parameter. It is set in `wrangler.jsonc` (see [Settings](#settings)).

## Production (the deployed site)

Run these from the project folder.

**1. Log in to Cloudflare** (skip if you already are)

```sh
pnpm wrangler login
```

**2. Add the key as a Worker secret**

```sh
pnpm wrangler secret put OPENAI_API_KEY
```

Wrangler asks for the value. Paste the key and press Enter. The prompt keeps the key out of your shell history and the repo. The secret applies to the deployed Worker straight away; you don't need to deploy again. If the Worker hasn't been deployed yet, Wrangler offers to create it; answer `y`.

**3. Check the secret is there**

```sh
pnpm wrangler secret list
```

`OPENAI_API_KEY` should be listed. The value is never shown.

**4. Create the usage table** (once)

Each AI call is recorded with its token counts and estimated cost. That needs the `llm_usage` table:

```sh
pnpm db:migrate:remote
```

If it says there is nothing to apply, the table already exists.

**5. Deploy** (only if you changed code or `wrangler.jsonc`)

```sh
pnpm run deploy
```

To replace the key, run the `secret put` command again. To remove it:

```sh
pnpm wrangler secret delete OPENAI_API_KEY
```

## Local development

**1. Create `.dev.vars`** in the project root (next to `wrangler.jsonc`) with one line:

```
OPENAI_API_KEY=sk-...
```

The file is in `.gitignore`, so it is never committed. Don't put the key in `wrangler.jsonc`; that file is committed.

**2. Create the local tables**

```sh
pnpm db:migrate:local
```

**3. Start the API and the app**

```sh
pnpm dev:api   # terminal 1, port 8787
pnpm dev       # terminal 2
```

Wrangler only reads `.dev.vars` when it starts. Restart `pnpm dev:api` after changing it.

## Using it

1. **Settings → Job bank**: paste your complete work history: roles, dates, projects, achievements and numbers. Suggestions to add things come only from here and from CV facts.
2. **Settings → Profile**: check your details and set your **Work authorisation**. Your name, residence, nationality and links are sent to the AI; phone, email and photo are not.
3. **Settings → CV facts**: add your languages (level and how you got it), references (whether they agreed to be listed and whether they are your current manager) and education. These are trusted over the job bank.
4. **Create the application** with the full **job description**, starting from a new CV, a copy of another application's CV, or JSON.
5. Open the application's **CV** or **Cover letter** tab and switch the right-hand panel from **Preview** to **AI suggestions** (the panel shows on wide screens). Click **Get suggestions**.
6. Read the summary and gaps, then **Accept** or **Decline** each suggestion. Accepting changes the CV straight away; nothing changes otherwise. If you edited the text a suggestion refers to, it can no longer be applied and you can only decline it.
7. Answer any questions and click **Save to CV facts**, then **Refresh suggestions** to use the answers.

The CV tab shows CV suggestions; the Cover letter tab shows cover letter suggestions. Both come from the same request.

The CV guide PDF in **Settings → CV guide** is for your reference only. Its rules are built into the prompt and it is not sent to OpenAI.

## Costs

- Each **Get suggestions** or **Refresh suggestions** is one call, covering both the CV and the cover letter. With `gpt-6.1-sol` a call costs roughly $0.05–0.15, depending on the size of your CV and job bank.
- **Settings → AI usage** shows the estimated cost of each call, this month's total and the all-time total.
- The estimate uses the prices in `wrangler.jsonc`. Keep them in line with OpenAI's pricing for your model; they don't change what OpenAI charges you.

## Settings

All in `vars` in `wrangler.jsonc`. They are not secret. Deploy after changing them.

| Variable | Meaning | Default if missing |
|---|---|---|
| `LLM_PROVIDER` | Must be `openai` (the only provider supported) | none: suggestions are disabled |
| `LLM_MODEL` | OpenAI model ID | none: suggestions are disabled |
| `LLM_REASONING_EFFORT` | `low`, `medium` or `high`. Higher is slower and costs more | `medium` |
| `LLM_PRICE_INPUT_PER_M` | USD per 1M input tokens, for the cost estimate | `0` |
| `LLM_PRICE_CACHED_INPUT_PER_M` | USD per 1M cached input tokens | `0` |
| `LLM_PRICE_OUTPUT_PER_M` | USD per 1M output tokens | `0` |

`OPENAI_API_KEY` is the only secret.

## Troubleshooting

| You see | Cause | Fix |
|---|---|---|
| `OpenAI is not configured` | `OPENAI_API_KEY` or `LLM_MODEL` is missing | Add the secret (production) or `.dev.vars` (local) and restart `pnpm dev:api`; check `LLM_MODEL` |
| `Unknown LLM provider …` | `LLM_PROVIDER` isn't `openai` | Set it to `openai` in `wrangler.jsonc` and deploy |
| `Incorrect API key provided …` | The key is wrong or was revoked | Create a new key and run `secret put` again |
| `You exceeded your current quota …` | No billing or credit left on OpenAI | Add billing on platform.openai.com |
| `OpenAI response incomplete: max_output_tokens` | The model ran out of output tokens | Try again, or lower `LLM_REASONING_EFFORT` |
| `Add your job bank in Settings first.` | The job bank is empty | Fill in **Settings → Job bank** |
| `Add the job description in Overview first.` | The application has no job description | Add it on the application's Overview tab |
| Errors about a missing `llm_usage` table | The migration hasn't run | `pnpm db:migrate:remote` (production) or `pnpm db:migrate:local` |

For anything else, run `pnpm wrangler tail` and try again to see the Worker's logs.
