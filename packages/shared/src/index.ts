/**
 * @tea/shared — barrel export.
 *
 * Single source of truth for the TEA Group data contract:
 *   - zod schemas (validated on the server, used as Anthropic structured-output
 *     formats, and consumed by the Admin UI),
 *   - derived TypeScript types,
 *   - shared constants (locales, default theme config, label maps).
 *
 * No build step: consumers import the .ts source directly via `transpilePackages`.
 */
export * from './schemas/project-sections';
export * from './schemas/project';
export * from './schemas/settings';
export * from './constants';
