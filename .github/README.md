# 🐙 GitHub Configuration

**Purpose:** GitHub workflows, actions, và automation

---

## 📋 Overview

Thư mục `.github/` chứa **GitHub automation**:
- CI/CD workflows
- Issue templates
- PR templates
- GitHub Actions

---

## 🎯 Directory Structure

```
.github/
└── workflows/            # GitHub Actions workflows
    ├── ci.yml           # Continuous integration
    ├── cd.yml           # Continuous deployment
    └── test.yml         # Test automation
```

---

## 🔧 Workflows

### CI Workflow (.github/workflows/ci.yml)
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm build
```

### CD Workflow (.github/workflows/cd.yml)
```yaml
name: CD
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: # Deployment commands
```

---

## 🔗 Related

- **Parent:** [`../`](../) - Project root
- **Supabase:** [`../supabase/`](../supabase/) - Database migrations
- **Scripts:** [`../scripts/`](../scripts/) - Build/deploy scripts

---

*Last updated: 2026-07-22*
**Status:** Basic setup, expandable as needed
