# Repository Guidelines

## Project Structure & Module Organization

This repository contains planning documents and the initial Expo scaffold for
**AI Box Catalog**.

- `docs/android-mvp-plan.md` is the implementation source of truth.
- `docs/ai-box-catalog-design.md` captures product intent and MVP behavior.
- `docs/test-plan.md` defines critical QA and eval scenarios.
- `docs/engineering-plan.md` is superseded for implementation and kept for history.

Use this shape for implementation:

- `app/` for Expo routes and screens.
- `src/domain/` for pure TypeScript business logic.
- `src/db/` for SQLite schema and repositories.
- `src/services/` for QR, search, photo, and extraction adapters.
- `tests/` for unit tests and `e2e/` for Maestro flows.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies.
- `pnpm dev` starts Expo locally.
- `pnpm backend:dev` starts the local extraction backend. Set
  `LOCAL_DESKTOP_VLM_URL` to enable `local-desktop-vlm` proxy mode.
  Set `EXPO_PUBLIC_EXTRACTION_BACKEND_URL` for the mobile app to call that backend.
- `pnpm test` runs Vitest unit tests.
- `pnpm test:e2e` runs Maestro Android flows.
- `pnpm typecheck` validates TypeScript.

## Coding Style & Naming Conventions

Use TypeScript throughout app and backend code. Prefer explicit types at module
boundaries and keep domain logic independent from UI. Use two-space indentation.

Naming:

- Components: `PascalCase`, for example `BoxCard`.
- Functions and variables: `camelCase`.
- Types/interfaces: `PascalCase`, for example `ItemSuggestion`.
- Database tables: `snake_case`, for example `box_photos`.

Keep adapters behind stable interfaces, especially `extractItemsFromPhotos`.

## Testing Guidelines

Unit-test domain logic with Vitest. E2E-test Android flows with Maestro. Every MVP
flow in `docs/test-plan.md` should have coverage before the feature is considered
done.

Use descriptive test names: `creates box with stable id`, `rejects photos from different boxes`.

## Commit & Pull Request Guidelines

Use short Russian commit messages with:

- `[+]` for additions.
- `[-]` for removals.
- `[*]` for fixes or behavior changes.

Pull requests should include a short summary, tests run, screenshots or screen
recordings for UI changes, and links to relevant docs.

## Security & Configuration

Do not put AI provider keys in mobile code. Backend extraction adapters must validate
request and response shapes. Photos are personal data; avoid logging image payloads
or item names unless explicitly needed for local debugging.
