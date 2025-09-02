# Repository Guidelines

This guide summarizes how to work effectively in this repository.

> Note: Documentation and comments should be written in Japanese where reasonable. UI texts and commit messages may be bilingual as needed, but prefer Japanese for team communication.

## Project Structure & Module Organization
- Source: `src/` (entry: `src/index.ts`). Planned: `src/api/`, `src/models/`, `src/services/`, `src/ui/`.
- Docs: `docs/` (API specs, architecture notes).
- Demo data: `data/` (e.g., `demo-usage.csv`, `demo-*.json`).
- Tests: co-located near sources or under `tests/` mirroring `src/` with `*.spec.ts`.

## Build, Test, and Development Commands
- Install: `pnpm install`
- Run (dev, TS directly): `npx tsx src/index.ts`
- Web (CSR) dev: `pnpm dev:web` (Vite app at `/app` when built)
- Type check: `npx tsc -p tsconfig.json`
- Build: `npx tsgo`
- Run build output: `node dist/index.js`
- Add deps: `pnpm add <pkg>`; dev deps: `pnpm add -D <pkg>`
- Tests: `pnpm test` (placeholder until a runner is added)

## Coding Style & Naming Conventions
- Language: TypeScript (strict), `module: nodenext`, `target: esnext`.
- Avoid `any`. Prefer `const`. Favor pure functions; avoid `class`.
- Side effects return `Result<T, E>`-like objects.
- Indent 2 spaces; typical line width ~100–120.
- Naming: files `kebab-case.ts`; vars/functions `camelCase`; types `PascalCase`; env `UPPER_SNAKE_CASE`.
- No linter configured—keep formatting consistent and run the type checker.

## Testing Guidelines
- Framework: not set (recommend `vitest` or `jest` with `tsx`).
- Naming: `*.spec.ts` near source or under `tests/` mirroring `src/`.
- Use `data/` fixtures to validate parsing, metrics, and user flows.
- Stub network calls; aim to cover parsing, service logic, and API adapters.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat(api): add seats fetch`).
- PRs: clear description, motivation, before/after notes, linked issues, and key CLI output/screenshots. Update `README.md`/`docs/` when behavior or APIs change. Keep changes focused and small.

## Security & Configuration
- Copy `.env.example` to `.env`; set `GITHUB_TOKEN` and `GITHUB_ORG`.
- Never commit secrets. Limit token scopes to those documented.
- Prefer local demo data during development; stub external calls in tests.
 - Frontend builds are static and served by the same server under `/app`. Secrets remain server-side; avoid exposing keys in client code.

## Agent-Specific Notes
- Make minimal, targeted patches; avoid unrelated changes.
- Keep to repo style; update docs alongside behavioral changes.
- Use `pnpm` consistently and include reproducible commands in PR notes.
