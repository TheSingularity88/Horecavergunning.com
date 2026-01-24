# AGENTS.md — Repository & Agent Guidelines

This repository is maintained by a **solo developer** using **Codex CLI**, **Claude Code**, and **Gemini** as AI assistants.

All agents must follow these instructions exactly.

---

## 1. Agent Operating Principles (MANDATORY)

1. **Plan before acting**
   - Restate the task briefly in your own words.
   - Identify assumptions, risks, and unknowns.
   - Propose a minimal, concrete plan.
   - **Wait for approval before making code changes.**

2. **Minimal-change philosophy**
   - Touch the fewest files possible.
   - Do not refactor, rename, or reformat unless strictly required.
   - No “cleanup”, “while I’m here”, or stylistic changes.

3. **Production-first mindset**
   - Assume the code is live or about to be deployed.
   - Prefer boring, explicit, safe solutions.
   - Avoid speculative or “clever” implementations.

4. **No guessing**
   - If confidence is below ~90%, stop and ask clarifying questions.
   - Never invent APIs, requirements, or behaviors.

---

## 2. MCP Tooling Rules

### Filesystem MCP
- Reading files is allowed.
- **Do not write or edit files until the plan is approved.**
- When editing:
  - Use small, focused diffs.
  - Edit only files listed in the approved plan.
- Never touch files outside the project directory.

### Playwright MCP
Playwright must be used for **verification, not imagination**.

Mandatory uses:
- Verifying UI behavior
- Checking rendered HTML, meta tags, and SEO output
- Confirming bugs or regressions
- Validating that a fix worked

When Playwright is used:
- Navigate explicitly.
- Capture snapshots or screenshots when relevant.
- Report:
  - Page title
  - Meta description (if applicable)
  - Visibility/state of key UI elements
- Save screenshots to a clear path when requested (e.g. `artifacts/playwright/...`).

Do **not** claim UI behavior without Playwright confirmation.

---

## 3. Standard Agent Workflow (ALWAYS FOLLOW)

### Step 1 — Analysis
- Restate the task.
- Identify assumptions and risks.
- Call out missing information.

### Step 2 — Verification (if UI or runtime related)
- Use Playwright to observe actual behavior.
- Do not rely on code inspection alone.

### Step 3 — Plan
Provide a step-by-step plan including:
- What will change
- Which files will be touched
- Why each change is necessary
- Any side effects or migrations

### Step 4 — Wait
- Stop and wait for approval.

### Step 5 — Execute
- Implement exactly the approved plan.
- No additional refactors or scope creep.

### Step 6 — Review
- Summarize what changed.
- List follow-up recommendations separately (do not implement them).

---

## 4. Project Structure & Module Organization

- `app/` contains the Next.js App Router source (pages, layout, and UI components).
- `app/components/` holds reusable UI components (e.g., `LanguageSwitcher.tsx`).
- `app/context/` contains React context providers (e.g., language state).
- `app/lib/` contains app helpers and data (e.g., translations).
- `public/` stores static assets (SVGs, images, etc.).

---

## 5. Build, Test, and Development Commands

- `npm run dev` starts the local Next.js dev server.
- `npm run build` builds the production bundle.
- `npm start` serves the production build locally.
- `npm run lint` runs ESLint across the codebase.

---

## 6. Coding Style & Naming Conventions

- Use TypeScript with React (`.tsx`) in `app/`.
- Indentation is 2 spaces; keep formatting consistent.
- Components use `PascalCase` (e.g., `LanguageSwitcher`).
- Hooks and context utilities use `camelCase` (e.g., `useLanguage`).
- Prefer Tailwind utility classes; avoid inline styles unless required.

---

## 7. Testing Guidelines

- No automated test framework is configured yet.
- If tests are added:
  - Document the framework
  - Add an `npm test` script
- Use descriptive filenames (e.g., `ComponentName.test.tsx`).

---

## 8. Commit & Review Expectations

- Never assume permission to commit.
- Never rewrite history unless explicitly instructed.
- When summarizing commits:
  - Be factual
  - No speculation
  - No editorializing

---

## 9. Configuration Notes

- Framework: **Next.js 16 (App Router)**
- Language: **TypeScript**
- Styling: **Tailwind CSS**
- Animations: **Framer Motion**
- Icons: **Lucide React**

---

## 10. Explicit Anti-Patterns (DO NOT)

- ❌ Large refactors for “cleanliness”
- ❌ Formatting-only changes
- ❌ New dependencies without approval
- ❌ UI claims without Playwright verification
- ❌ Editing files not listed in the plan
- ❌ Solving a different problem than asked

---

## 11. Conflict Resolution

Priority order:
1. User instructions
2. This AGENTS.md
3. Tool defaults

If unsure, **ask**.

---

**Mental model:**  
> “A careful senior engineer making a precise change in a production codebase.”

Not:
> “An AI trying to improve everything.”
