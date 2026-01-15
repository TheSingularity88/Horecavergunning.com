# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Next.js App Router source (pages, layout, and UI components).
- `app/components/` holds reusable UI components (e.g., `LanguageSwitcher.tsx`).
- `app/context/` contains React context providers (e.g., language state).
- `app/lib/` contains app helpers and data (e.g., translations).
- `public/` stores static assets (SVGs, images, etc.).

## Build, Test, and Development Commands
- `npm run dev` starts the local Next.js dev server.
- `npm run build` builds the production bundle.
- `npm start` serves the production build locally.
- `npm run lint` runs ESLint across the codebase.

## Coding Style & Naming Conventions
- Use TypeScript with React (`.tsx`) in `app/`.
- Indentation is 2 spaces; keep formatting consistent with existing files.
- Components use `PascalCase` (e.g., `LanguageSwitcher`).
- Hooks and context utilities use `camelCase` (e.g., `useLanguage`).
- Prefer Tailwind utility classes for styling; avoid inline styles unless needed.

## Testing Guidelines
- No automated test framework is configured yet.
- If you add tests, document the framework and add a script like `npm test`.
- Keep test filenames descriptive (e.g., `ComponentName.test.tsx`).

## Commit & Pull Request Guidelines
- Commit history follows a loose Conventional Commits style (e.g., `feat: ...`, `feat(ui): ...`).
- Prefer short, imperative summaries with optional scope.
- For PRs, include a clear description of changes and screenshots for UI updates.
- Link related issues if they exist.

## Configuration Notes
- The app uses Next.js 16 and React 19.
- Tailwind CSS is configured via `tailwindcss` and PostCSS in project root.
