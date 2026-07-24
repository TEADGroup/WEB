# 🚀 Getting Started Guide

**Last updated:** 2026-07-22

---

## 🎯 Prerequisites

- **Node.js:** ≥ 20
- **pnpm:** 9+ (`corepack enable`)
- **Supabase CLI:** (Phase 4+)
- **Git:** For version control

---

## 📦 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd WEB_TEA
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your keys (Phase 4+)
```

---

## 🏃 Running the App

### Development Mode
```bash
pnpm dev              # Start all packages
# → http://localhost:3000 → redirects to /vi
```

### Web App Only
```bash
pnpm --filter @tea/web dev
# → http://localhost:3000
```

---

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check |
| `pnpm --filter @tea/web dev` | Web app only |

---

## 📂 Project Structure

Quick overview:
```
apps/web/         # Next.js app
packages/shared/  # Shared schemas/types
docs/             # Project documentation
scripts/          # Dev tools
supabase/         # Database & backend
```

See [`PROJECT-QUICK-REFERENCE.md`](../PROJECT-QUICK-REFERENCE.md) for details.

---

## 🌐 Locales

- **Vietnamese (vi):** Default locale
- **English (en):** Available via `/en` route

---

## 🎨 Theme System

Theme has 4 phases (not just light/dark):
- **Dawn:** 05:00-07:00
- **Day:** 07:00-17:00
- **Dusk:** 17:00-19:00
- **Night:** 19:00-05:00

Manual override: Set `localStorage['tea-theme']` to `'auto'`, `'light'`, or `'dark'`.

---

## 📚 Next Steps

1. **Explore the code:**
   - [`apps/web/README.md`](../../apps/web/README.md) - Web app structure
   - [`CLAUDE.md`](../CLAUDE.md) - Architecture & gotchas

2. **Development workflow:**
   - [`project/runbook.md`](project/runbook.md) - Setup & deployment
   - [`project/progress.md`](project/progress.md) - Development status

3. **Understand the plan:**
   - [`../reports/federated-swimming-waterfall.md`](../reports/federated-swimming-waterfall.md) - Full project plan

---

## ❓ Troubleshooting

### Port 3000 already in use
```bash
# Kill process on port 3000
npx kill-port 3000
# Or use different port
PORT=3001 pnpm dev
```

### Type errors
```bash
# Regenerate types
pnpm typecheck
```

### Supabase connection issues
```bash
# Check local Supabase
supabase status
# Restart if needed
supabase stop && supabase start
```

---

## 🔗 Resources

- **Quick reference:** [`../PROJECT-QUICK-REFERENCE.md`](../PROJECT-QUICK-REFERENCE.md)
- **Architecture:** [`../CLAUDE.md`](../CLAUDE.md)
- **Progress tracking:** [`project/progress.md`](project/progress.md)

---

*For detailed setup, see [`project/runbook.md`](project/runbook.md)*
