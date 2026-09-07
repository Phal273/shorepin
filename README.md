# Shorepin

Temporary escapes in code do not expire on their own. `eslint-disable`, `@ts-ignore`, `as any`, `it.skip`, `# noqa`, and the rest stay in the tree until someone owns them. Shorepin is the ledger: every escape is a shore pin with an owner, a reason, and a pull date. Unregistered or expired pins fail CI.

Named for construction shore pins. They hold the formwork. They come out before the pour sets.

**Public source of truth:** [github.com/Phal273/shorepin](https://github.com/Phal273/shorepin)

**Deploy target:** [https://shorepin.zoitra.com](https://shorepin.zoitra.com)

This GitHub repo is the canonical tree for Cloudflare deploys going forward. Push to `main` here; do not treat the original Cursor Origin project as the deploy source.

## What it does

- Scans files in the browser or via `scripts/scan.mjs`
- Registers pins (path, kind, owner, reason, mandatory expiry)
- Matches findings to pins by path + kind + nearby line fingerprint
- Dashboard: active, expiring in 7 days, overdue, unregistered
- CI gate: `scripts/check.mjs` exits non-zero on unregistered or expired

There is no hosted tenant and no fake company seed data. Pins and the last scan live in this browser's localStorage. Export `pins.json` when you want the CLI to use the same ledger.

## Run the app

```bash
npm install
npm run dev
```

Dev server: `http://0.0.0.0:4567`

Or: `npm run dev -- -H 0.0.0.0 -p 4567`

## Try the sample workspace

`fixtures/sample-repo/` is a tiny tree with intentional escapes. In the app, open Scan and click **Load sample workspace**. Register a pin from an unregistered finding. Set expiry in the past to see overdue / expired. Set it a few days out to see expiring.

## CLI

```bash
node scripts/scan.mjs --dir fixtures/sample-repo --out /tmp/sample-scan.json
node scripts/check.mjs --pins pins.json --scan /tmp/sample-scan.json
```

`pins.json` in this repo starts empty. The sample tree will fail the check until you register pins and point `--pins` at that file.

This product's own GitHub Action scans the app source (not the fixtures) and fails on unregistered or expired findings. Detector definition files are listed in `.shorepinignore`.

```yaml
# .github/workflows/shorepin.yml
- run: node scripts/scan.mjs --dir . --out shorepin-scan.json --ignore node_modules,.next,.git,fixtures
- run: node scripts/check.mjs --pins pins.json --scan shorepin-scan.json
```

## Detected kinds

ESLint disable comments, `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`, `as any` / `as unknown as`, `it.skip` / `describe.skip` / `test.skip` / `xit` / `xdescribe`, `# noqa`, `# nosec`, `// nosemgrep`, and optional `HACK:` / `FIXME:` markers.

## Stack

Next.js App Router, TypeScript, Tailwind, shadcn/ui. Local-first. No database.
