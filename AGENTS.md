# Repository Guidelines

## Project Structure & Module Organization

- `src/`: TypeScript sources. Start with `src/index.ts` (entry).
- `docs/`: API specs and architecture notes (e.g., Copilot APIs).
- `data/`: Demo inputs for local testing (`demo-usage.csv`, `demo-*.json`).
- Planned modules (see README): `src/api/`, `src/models/`, `src/services/`, `src/ui/`.

## Build, Test, and Development Commands

- Install deps: `pnpm install`
- Run in dev (TS directly): `npx tsx src/index.ts`
- Build TypeScript: `npx tsgo`
- Run built code: `node dist/index.js`
- Add deps: `pnpm add <pkg>`; dev deps: `pnpm add -D <pkg>`
- Tests: `pnpm test` (placeholder). Until a runner is added, verify via demo data in `data/` and manual runs.

## Coding Style & Naming Conventions

- Language: TypeScript (strict). `module: nodenext`, `target: esnext`.
- No `any`; prefer `const`; use pure functions. For side effects, return `Result<T, E>`.
- Avoid `class`; use functions + plain objects.
- Indentation: 2 spaces; line width ~100–120.
- Names: files `kebab-case.ts`; functions/vars `camelCase`; types `PascalCase`; env vars `UPPER_SNAKE_CASE`.
- Type-check locally: `npx tsc -p tsconfig.json`. No linter is configured; keep formatting consistent.
- See `CLAUDE.md` for stricter rules specific to this repo.

## Testing Guidelines

- Framework: not yet configured. Recommended: `vitest` or `jest` with `ts-node/tsx`.
- Test naming (when added): `*.spec.ts` near source or under `tests/` mirroring `src/`.
- Use fixtures in `data/` to validate parsing, metrics, and user-management flows.
- Aim for coverage of parsing, service logic, and API adapters.

## Commit & Pull Request Guidelines

- Commits: follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`). Keep messages imperative and scoped (e.g., `feat(api): add seats fetch`).
- PRs include: clear description, motivation, before/after notes, linked issues, and CLI output/screenshots for key flows. Add test notes or demo steps using `data/`.
- Keep changes small and focused; update `README.md`/`docs/` when behavior or APIs change.

## Security & Configuration

- Create `.env` from `.env.example`; set `GITHUB_TOKEN`, `GITHUB_ORG`.
- Do not commit secrets. Limit token scopes to those in README.
- Prefer local demo data for development; stub network calls in tests.
