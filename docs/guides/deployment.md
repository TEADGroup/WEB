# 🚀 Deployment Guide

**Last updated:** 2026-07-22

---

## 📋 Overview

Deployment guide cho TEA Group website lên production.

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Option 2: Docker
```bash
# Build image
docker build -t tea-group-website .

# Run container
docker run -p 3000:3000 tea-group-website
```

### Option 3: Traditional Hosting
```bash
# Build
pnpm build

# Start
pnpm start
# → Runs on port 3000
```

---

## 🔧 Environment Variables

### Required (Production)
```bash
# Supabase (Phase 4+)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Anthropic AI (Phase 5+)
ANTHROPIC_API_KEY=sk-ant-xxx...

# Resend Email (Phase 6+)
RESEND_API_KEY=re_xxx...
```

### Optional
```bash
# Custom domain
NEXT_PUBLIC_APP_URL=https://teagroup.vn

# Feature flags
NEXT_PUBLIC_ENABLE_ADMIN=true
NEXT_PUBLIC_ENABLE_AI_PARSER=true
```

---

## 🗄️ Database Setup (Supabase)

### 1. Create Project
```bash
# Go to https://app.supabase.com
# Create new project
```

### 2. Apply Migrations
```bash
# Link to project
supabase link --project-ref <your-ref>

# Push migrations
supabase db push

# Seed data
supabase db reset
```

### 3. Generate Types
```bash
pnpm db:types
```

---

## 🔒 Security Checklist

### Before Deploying

- [ ] **Environment variables:** Set in production, not committed
- [ ] **Supabase RLS:** All tables have RLS policies
- [ ] **API keys:** Rotate if compromised
- [ ] **CORS:** Configure allowed origins
- [ ] **Rate limiting:** Enable on API routes
- [ ] **HTTPS:** Force HTTPS in production

### Supabase Security

```bash
# Check RLS policies
supabase db reset --dry-run

# Verify anon user permissions
# → Should only read status='published' rows
```

---

## 📊 Performance Optimization

### Build Optimization
```bash
# Production build
pnpm build

# Check bundle size
pnpm analyze
```

### Image Optimization
- ✅ Use Next.js Image component
- ✅ Compress images before upload
- ✅ Use WebP format when possible
- ✅ Lazy load below-fold images

### 3D Performance
- ✅ Lazy load 3D components with `ssr: false`
- ✅ Optimize 3D models (< 50k polygons)
- ✅ Compress textures
- ✅ Use LOD for complex scenes

---

## 🔍 Monitoring

### Vercel Analytics
```bash
# Enable in Vercel dashboard
# → Web vitals, page views, conversions
```

### Supabase Logs
```bash
# View logs
supabase functions logs

# Monitor database
supabase db inspect
```

### Custom Logging
```typescript
// API routes
console.log('[API]', method, path, status);
```

---

## 🔄 CI/CD Setup

### GitHub Actions (.github/workflows/cd.yml)
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 🐛 Troubleshooting

### Build Failures
```bash
# Clear cache
rm -rf .next node_modules
pnpm install
pnpm build
```

### Runtime Errors
```bash
# Check environment variables
vercel env ls

# View logs
vercel logs
```

### Database Issues
```bash
# Check connection
supabase status

# Reset if needed
supabase db reset
```

---

## 📚 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Build succeeds locally

### Post-deployment
- [ ] Smoke test critical paths
- [ ] Check analytics working
- [ ] Verify database connection
- [ ] Test authentication flow
- [ ] Monitor error logs

---

## 🔗 Related

- **Parent:** [`../`](../) - Docs
- **Runbook:** [`project/runbook.md`](project/runbook.md) - Detailed setup
- **Progress:** [`project/progress.md`](project/progress.md) - Development status

---

## 📚 Resources

- **Vercel docs:** https://vercel.com/docs
- **Supabase deployment:** https://supabase.com/docs/guides/deployment
- **Next.js deployment:** https://nextjs.org/docs/deployment

---

*Last updated: 2026-07-22*
