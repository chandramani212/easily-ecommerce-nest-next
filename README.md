# NestJS + Next.js Monorepo Starter

A sample starter project using **NestJS** (API) and **Next.js** (web app) in a **Turborepo** monorepo with **pnpm** workspaces.

## Tech Stack

| Layer | Tech |
|-------|------|
| **API** | NestJS 11, Express |
| **Web** | Next.js 16, React 19, Tailwind CSS 4 |
| **Monorepo** | Turborepo, pnpm workspaces |
| **Shared** | TypeScript, ESLint, shared UI & API packages |

## Requirements

- **Node.js** ≥ 18  
- **pnpm** 9.x (recommended; use `corepack enable` then `corepack prepare pnpm@9.0.0 --activate`)

## Project Structure

```
├── apps/
│   ├── api/          # NestJS backend (Express)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── backend/      # Shared API types/utilities (@repo/backend)
│   ├── eslint-config # Shared ESLint config
│   ├── jest-config   # Shared Jest config
│   ├── tailwind-config
│   ├── typescript-config
│   └── ui/           # Shared React UI components (@repo/ui)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting Started

### Install dependencies

```bash
pnpm install
```

### Run everything in development

```bash
pnpm dev
```

- **Web**: Next.js at **http://localhost:3000**  
- **API**: NestJS with watch mode at **http://localhost:3001**

### Run individual apps

```bash
# API only
pnpm --filter api dev

# Web only
pnpm --filter web dev
```

### Build

```bash
pnpm build
```

Builds all apps and packages in dependency order (Turborepo).

### Lint & type-check

```bash
pnpm lint
pnpm check-types
```

### Tests

```bash
pnpm test
pnpm test:e2e
```

### Format

```bash
pnpm format
```

## Scripts (root)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Run all apps in dev mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Lint all workspaces |
| `pnpm check-types` | Type-check all workspaces |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run e2e tests |
| `pnpm format` | Format with Prettier |

## Workspace Packages

- **`@repo/ui`** – Shared React components and Tailwind styles; used by `web`.
- **`@repo/backend`** – Shared API code (e.g. DTOs, types); used by `api`.
- **`@repo/eslint-config`**, **`@repo/jest-config`**, **@repo/tailwind-config**, **@repo/typescript-config** – Shared tooling configs.

## Customization

- **Web port**: Set in `apps/web/package.json` (`"dev": "next dev --port 3000"`).
- **API port**: Configure in `apps/api/src/main.ts` (or your Nest bootstrap).
- Add new apps under `apps/` and new shared packages under `packages/`, then list them in `pnpm-workspace.yaml` (already covered by `apps/*` and `packages/*`).

## License

Private / unlicensed by default. Add a `license` field to root or app `package.json` as needed.
