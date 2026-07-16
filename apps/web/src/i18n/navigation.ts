import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Locale-aware navigation helpers. Use `Link`, `useRouter`, `redirect`, etc.
 * from here instead of `next/link` / `next/navigation` so the active locale is
 * always prepended automatically.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
