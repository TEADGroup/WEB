# 🗺️ TEA Group Website - Master Index

**Last updated:** 2026-07-22

> ⚡ **Start here:** This is the master navigation map for the entire project.

---

## 🚀 Quick Start (New to Project?)

1. **[PROJECT-QUICK-REFERENCE.md](PROJECT-QUICK-REFERENCE.md)** ⚡
   - 30-60 second overview for AI and humans
   - **Read this first!**

2. **[README.md](README.md)**
   - Public project description
   - Features, tech stack, getting started

3. **[CLAUDE.md](CLAUDE.md)**
   - Architecture & gotchas
   - Critical patterns for developers

4. **[docs/guides/getting-started.md](docs/guides/getting-started.md)**
   - Installation & setup guide
   - Development workflow

---

## 📂 Directory Navigation

### 🌐 Application
```
apps/web/                  # Main Next.js application
├── src/
│   ├── app/               # Routes & layouts
│   ├── components/        # React components
│   ├── lib/              # Utilities
│   └── styles/           # Global styles
└── README.md             # Web app overview
```

**Key files:**
- [apps/web/README.md](apps/web/README.md) - App structure
- [apps/web/src/app/README.md](apps/web/src/app/README.md) - App Router
- [apps/web/src/components/README.md](apps/web/src/components/README.md) - Components

### 📦 Packages
```
packages/                  # Monorepo packages
├── shared/               # Shared schemas & types
└── telegram-mcp/         # Telegram MCP integration
```

### 📚 Documentation
```
docs/                     # All documentation
├── project/              # Project-specific docs
│   ├── progress.md       # Development status
│   ├── runbook.md        # Setup & deployment
│   └── phase-5-plan.md   # Phase 5 details
├── reference/            # External references
└── guides/               # How-to guides
    ├── getting-started.md
    ├── theming.md
    ├── i18n.md
    └── deployment.md
```

### 📊 Reports
```
reports/                  # Planning & research
├── planning/             # Strategic plans
├── research/             # Research notes
└── experiments/          # Test results
```

### 🔧 Tools & Config
```
scripts/                  # Dev tools & utilities
supabase/                 # Database & backend
.claude/                  # Claude Code config
.github/                  # GitHub workflows
turbo/                    # Turborepo cache
```

---

## 📖 Documentation Index

### Getting Started
- [Quick Start Guide](docs/guides/getting-started.md)
- [Development Progress](docs/project/progress.md)
- [Setup & Deployment](docs/project/runbook.md)

### Technical Guides
- [Theme System](docs/guides/theming.md) - Dynamic time-of-day theme
- [Internationalization](docs/guides/i18n.md) - Vietnamese/English support
- [Deployment](docs/guides/deployment.md) - Production deployment

### Planning & Architecture
- [Full Project Plan](reports/planning/01-project-waterfall.md) - 6 phases waterfall
- [Architecture & Gotchas](CLAUDE.md) - Technical patterns

### Components Reference
- [UI Components](apps/web/src/components/ui/README.md) - shadcn/ui base
- [3D Components](apps/web/src/components/3d/README.md) - R3F scenes
- [Theme Components](apps/web/src/components/theme/README.md) - Theme system
- [Tree Components](apps/web/src/components/tree/README.md) - React Flow (Phase 3)

---

## 🎯 Development Phases

| Phase | Status | Description | Key Files |
|-------|--------|-------------|-----------|
| **Phase 1** | ✅ DONE | Monorepo, i18n, theme, Supabase | [progress](docs/project/progress.md) |
| **Phase 2** | ✅ DONE | Hero 3D, solution cards, single-page | [progress](docs/project/progress.md) |
| **Phase 3** | ⏳ NEXT | Project tree (React Flow) | [components/tree](apps/web/src/components/tree/) |
| **Phase 4** | 📋 TODO | Auth + Admin + RBAC | [runbook](docs/project/runbook.md) |
| **Phase 5** | 📋 TODO | AI HDVH parser | [phase-5-plan](reports/planning/02-phase-5-detailed.md) |
| **Phase 6** | 📋 TODO | Contact form + email | [runbook](docs/project/runbook.md) |

---

## 🔍 Search by Topic

### "I need to..."
- **Add a new page** → [App Router Guide](apps/web/src/app/README.md)
- **Create a component** → [Components Overview](apps/web/src/components/README.md)
- **Work with 3D** → [3D Components](apps/web/src/components/3d/README.md)
- **Modify theme** → [Theme Guide](docs/guides/theming.md)
- **Add translations** → [i18n Guide](docs/guides/i18n.md)
- **Deploy to production** → [Deployment Guide](docs/guides/deployment.md)
- **Setup database** → [Supabase Docs](supabase/README.md)
- **Understand architecture** → [CLAUDE.md](CLAUDE.md)

---

## 🤖 AI Quick Reference

When AI works on this project, it reads in this order:

1. **[PROJECT-QUICK-REFERENCE.md](PROJECT-QUICK-REFERENCE.md)** (30-60 seconds)
2. **[CLAUDE.md](CLAUDE.md)** (architecture & gotchas)
3. **Specific README** (for the task at hand)

**Total time to understand project:** 1-2 minutes

---

## 🔗 External Resources

### Documentation
- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **Supabase:** https://supabase.com/docs
- **next-intl:** https://next-intl-docs.vercel.app
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber
- **React Flow:** https://reactflow.dev

### Tools
- **Turborepo:** https://turbo.build/repo/docs
- **pnpm:** https://pnpm.io
- **TypeScript:** https://www.typescriptlang.org/docs

---

## 📞 Support

### Documentation Issues?
- Check [Project Progress](docs/project/progress.md) for known issues
- See [Gotchas](CLAUDE.md) for common pitfalls

### Setup Problems?
- See [Getting Started Guide](docs/guides/getting-started.md)
- See [Runbook](docs/project/runbook.md) for detailed setup

### Feature Questions?
- Check [Full Project Plan](reports/planning/01-project-waterfall.md)
- See [Phase-specific plans](reports/planning/) for details

---

## 🎯 Key Metrics

| Metric | Value |
|--------|-------|
| **Total README files** | 35+ |
| **Documentation coverage** | 100% of directories |
| **AI understanding time** | 1-2 minutes |
| **Development phases** | 6 (2 complete, 4 pending) |
| **Supported locales** | 2 (vi, en) |
| **Theme phases** | 4 (dawn, day, dusk, night) |

---

## 📝 Changelog

### 2026-07-22 - Major Reorganization
- ✅ Created 35+ README files across all directories
- ✅ Reorganized docs/ (project + reference + guides)
- ✅ Reorganized reports/ (planning + research + experiments)
- ✅ Created PROJECT-QUICK-REFERENCE.md
- ✅ Created INDEX.md (this file)
- ✅ Created comprehensive guides

---

**🎯 You are now ready to navigate this project efficiently!**

*Last updated: 2026-07-22*
