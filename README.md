# journal.

A private, multi-user journal you host yourself — designed to be a *soothing* place to write.

Warm paper and sage, a long-form serif, a calm editor with autosave, a gentle heatmap of the days you showed up. Invite-only: an admin creates accounts; entries stay private to each writer.

[![CI](https://github.com/zypher-systems/journal/actions/workflows/ci.yml/badge.svg)](https://github.com/zypher-systems/journal/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-66866E)
![stack](https://img.shields.io/badge/stack-SvelteKit%202%20%C2%B7%20Postgres%2017%20%C2%B7%20Docker-66866E)

## Features

- **A quiet writing surface** — Tiptap rich text with smart punctuation (typographic dashes & quotes), a soft floating toolbar, live word count, autosave, and `⌘/Ctrl+S`.
- **Warm themes** — paper-light and candlelight-dark, both with a subtle grain texture; system/light/dark preference saved per user.
- **Fluid motion** — springy transitions, cascading entry cards, and cross-document view transitions (all disabled under `prefers-reduced-motion`).
- **Gentle motivation** — a writing heatmap with weekday and month labels, current & longest streaks, and a curated daily prompt you can write with in one click.
- **Organization** — clickable tags, full-text search (Postgres `tsvector`) with highlighted snippets, reachable from a phone.
- **Photos in entries** — upload from the toolbar; images are resized and converted to WebP (GIFs kept intact), and are only ever served to their owner.
- **Data ownership** — one-click Markdown-zip export of everything you've written; nightly database backups kept for two weeks.
- **Multi-user, admin-managed** — Argon2id passwords, sliding 30-day sessions (hashed at rest), sign-in throttling, deactivate/reactivate, password resets.

## Quick start (Docker)

Requires Docker with Compose. The app runs from the published image, `ghcr.io/zypher-systems/journal` (amd64 and arm64); nothing is built on your machine.

```sh
mkdir journal && cd journal
curl -fsSLO https://raw.githubusercontent.com/zypher-systems/journal/main/docker-compose.yml
curl -fsSL -o .env https://raw.githubusercontent.com/zypher-systems/journal/main/.env.example
# edit .env: set POSTGRES_PASSWORD (openssl rand -hex 24), ADMIN_EMAIL, ADMIN_PASSWORD,
# and ORIGIN to the address you'll type in the browser, e.g. http://192.168.1.20:3000
# If host port 3000 is taken, set JOURNAL_PORT=3001 and match ORIGIN to that port.
docker compose up -d
```

On first boot the app applies migrations, seeds 117 writing prompts, and creates the admin account from your `.env`. Open `http://<host>:3000`, sign in, and start writing.

> **Important:** `ORIGIN` must match the browser address exactly (`http://localhost:3000` when browsing on the host itself, `http://<lan-ip>:3000` from other machines) — sign-in form submissions are CSRF-checked against it.

### Services

| Service | What it does |
|---|---|
| `app` | SvelteKit (Node) server, non-root container, health-checked (including the database) |
| `db` | Postgres 17 with all data on a named volume |
| `backup` | nightly UTC-midnight `pg_dump | gzip` into the `backups` volume (14-day retention) |

### Upgrades and versions

`:latest` is the newest release. Each release is also tagged by version (`:0.2.2`, `:0.2`), and `:dev` follows unreleased work.

```sh
docker compose pull && docker compose up -d   # upgrade to the newest release
```

To upgrade on your own schedule, pin a version in `.env` with `JOURNAL_IMAGE=ghcr.io/zypher-systems/journal:0.2.2`. Migrations run automatically when the new version starts, so take a backup first (below). Release notes live in [`docs/releases`](docs/releases).

### Ops

```sh
docker compose logs -f app            # watch logs
docker compose exec backup sh -c \
  "pg_dump -h db -U journal -d journal | gzip > /backups/manual.sql.gz"   # force a backup
docker compose exec db sh -c \
  "zcat /backups/manual.sql.gz | psql -U journal -d journal"              # restore (run in db, mount backups or copy the file in)
```

Backups live inside the `journal_backups` volume; copy them out with
`docker compose exec backup cat /backups/<file> > ./<file>.sql.gz`.

To build the image from a checkout instead of pulling it:

```sh
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build
```

### HTTPS

The stack is plain HTTP for LAN use. To put it on a domain with automatic TLS, add a Caddy service in front:

```yaml
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports: ['80:80', '443:443']
    command: caddy reverse-proxy --from your.domain.com --to app:3000
    volumes: ['caddy_data:/data']   # keeps certificates across restarts; add caddy_data under volumes
```

then set `ORIGIN=https://your.domain.com`, `COOKIE_SECURE=true`, and `ADDRESS_HEADER=X-Forwarded-For` (so sign-in throttling sees each visitor rather than the proxy). Only set `ADDRESS_HEADER` behind a proxy — without one, clients could fake it.

## Development

```sh
npm install
docker compose -f docker-compose.dev.yml up -d   # Postgres on 127.0.0.1:5432
node scripts/migrate.mjs                         # migrations + prompts (+ first admin via env)
npm run dev                                      # http://localhost:5177
```

Useful scripts: `npm run check` (types), `npm run db:generate` (drizzle migrations),
`node scripts/create-admin.mjs <email> <name> <password>` (create/reset an admin).

`npm test` runs the HTTP smoke test against a running server: sign-in, every main page, the admin boundary, and the security checks. CI runs it against a fresh Postgres on every push; locally, build and start the app, then:

```sh
BASE_URL=http://127.0.0.1:3000 ORIGIN=http://127.0.0.1:3000 \
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npm test
```

## Writing experience notes

- Fonts are self-hosted variable fonts: **Newsreader** (entries, titles) with optical sizing for headings, **Inter** (interface), **JetBrains Mono** (dates, word counts, tags).
- The entry column is capped near 66 characters at 19px/1.78 line-height — a comfortable print-like measure.
- The editor pads its bottom by 30vh so the cursor is never cramped at the fold.
- Theme preference is stored per account and applied before first paint (no flash).

## Data model

`users` · `sessions` (sha-256 token hashes) · `entries` (Tiptap JSON + `tsvector` generated column for search) · `tags` / `entry_tags` · `images` · `prompts`.

## Contributing

Issues and pull requests are welcome. Keep changes in the spirit of the app: calm, private, and small. Before opening a PR, run `npm run check` and the smoke test. The [roadmap](docs/ROADMAP.md) shows what's planned.

## Security

Please report vulnerabilities privately; see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Zypher Systems
