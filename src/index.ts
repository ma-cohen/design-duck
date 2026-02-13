/**
 * Design Duck
 * Requirements gathering and management tool
 *
 * This is the main library entry point for programmatic usage.
 */

import pkg from '../package.json';

/**
 * The installed version, derived from package.json (single source of truth).
 * Bump the version in package.json — it automatically propagates here.
 */
export const VERSION: string = pkg.version;

// Domain exports will be added here as they are implemented
// export * from './domain/requirements';

// Infrastructure exports
// export * from './infrastructure/file-store';

console.log('[design-duck] Library loaded');
