# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A GitHub Action (`node24`) that posts build notifications to Slack. Used by Planning Center mobile repos to notify teams about build status (working, success, failure, cancelled) via a Slack bot ("Pico the Builder"). It supports chaining steps via a `config` output that passes state between workflow steps.

## Build & Lint

- **Build:** `npm run prepare` — bundles `src/index.ts` into `dist/index.js` using `@vercel/ncc`
- **Lint:** `npm run lint` — ESLint with auto-fix
- **Both:** `npm run all` — lint then build
- **Version bump:** `npm version <patch|minor|major>` — runs `npm run all` via `preversion` hook
- **Watch:** `npm run watch` — rebuilds on file changes

The `dist/` directory is committed to the repo (required for GitHub Actions to run the bundled output directly).

## Architecture

The entire action lives in a single file: `src/index.ts`. It:

1. Reads inputs from the GitHub Action context and a `config` JSON blob (for chaining steps)
2. Fetches commit and actor info from the GitHub API via `@actions/github` (Octokit)
3. Builds a Slack Block Kit message with build metadata (type, version, number, status, EAS build URLs, etc.)
4. Posts or updates a Slack message via `@slack/bolt` — uses `postMessage` for new notifications and `update` for subsequent status changes (keyed on the Slack thread `ts`)
5. Outputs the current config (including `ts`) so downstream steps can update the same message

Key types: `ActionConfig` (all action inputs), `MessageConfig` (Slack channel + thread ts), `Actor`, `Commit`.

## Code Style

- Prettier: no semicolons, single quotes, trailing commas (es5), arrow parens avoided
- ESLint enforces `===`, `object-shorthand`, no `var`
- TypeScript files use `@typescript-eslint/parser`; JS files use `@babel/eslint-parser`
- Node 24 (see `.node-version`)

## Tests

No test suite is currently configured (`npm test` is a no-op placeholder).
