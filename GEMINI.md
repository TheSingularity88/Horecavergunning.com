# HorecaVergunning.com Project Context

## Project Overview
**HorecaVergunning** is a modern B2B "Service-as-a-Product" website designed for the Dutch hospitality industry. It aims to streamline administrative, legal, and permit processes for restaurant and bar owners using a transparent subscription model.

The project is built as a **Next.js 16** application using **TypeScript** and **Tailwind CSS**.

## Directory Structure
- **`app/`**: Next.js App Router directory containing the source code.
  - `components/`: Feature-specific components (Hero, Pricing, Quiz, etc.).
    - `ui/`: Reusable UI primitives (Button, etc.).
  - `globals.css`: Global styles and Tailwind configuration.
  - `layout.tsx`: Root layout and metadata.
  - `page.tsx`: Landing page composition.
- **`public/`**: Static assets (images, icons).
- **Configuration Files**: `next.config.ts`, `package.json`, `tailwind.config.ts`, etc. are in the root.

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), `clsx`, `tailwind-merge`
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Linting**: ESLint

## Development Workflow

### Scripts
- **Start Development Server**:
  ```bash
  npm run dev
  ```
  Runs on [http://localhost:3000](http://localhost:3000).

- **Build for Production**:
  ```bash
  npm run build
  ```
  
- **Start Production Server**:
  ```bash
  npm run start
  ```

- **Lint Code**:
  ```bash
  npm run lint
  ```

## Design & Conventions
- **Visual Style**: "Horeca Dashboard" aesthetic. Deep Navy (`#0f172a`) for authority + Warm Amber (`#f59e0b`) for hospitality accents.
- **Component Architecture**: Modular components located in `app/components`. UI primitives (buttons, inputs) are separated into `app/components/ui`.
- **Path Aliases**: `@/*` is configured to point to the project root (e.g., imports from `@/app/components/...`).
- **Tailwind**: Uses Tailwind v4 CSS-first configuration in `app/globals.css`.