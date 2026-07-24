# ⚡ Turbo Configuration

**Purpose:** Turborepo build system configuration

---

## 📋 Overview

Thư mục `.turbo/` chứa **Turborepo cache và configuration**:
- Build cache
- Task outputs
- Hash calculations

---

## 🎯 Directory Structure

```
.turbo/
└── cache/                # Turbo cache
    ├── *.json           # Cached task outputs
    └── ...
```

---

## 🔧 Configuration

### turbo.json (root)
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

---

## 🚀 Usage

```bash
# Run across monorepo
pnpm build              # Turbo builds packages in parallel
pnpm typecheck          # Turbo typechecks all packages
pnpm dev                # Turbo runs dev servers

# Run specific package
pnpm --filter @tea/web build
pnpm --filter @tea/web dev
```

---

## 🔗 Related

- **Parent:** [`../`](../) - Project root
- **Apps:** [`../apps/`](../apps/) - Application packages
- **Packages:** [`../packages/`](../packages/) - Shared packages

---

## 📚 Turborepo Resources

- **Documentation:** https://turbo.build/repo/docs
- **Configuration:** https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks

---

*Last updated: 2026-07-22*
**Version:** Turbo 2.x
