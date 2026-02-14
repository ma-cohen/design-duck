/**
 * Migration registry – exports all migrations sorted by semver.
 *
 * v1.0.0: First public release — no migrations needed since init creates
 * the latest directory layout. Future migrations can be added here when
 * the schema evolves.
 *
 * To add a new migration:
 * 1. Create a file in src/migrations/ named after the target version (e.g., 1.1.0.ts)
 * 2. Export a Migration object from that file
 * 3. Import it here and add it to the `migrations` array in version order
 */

import type { Migration } from "./types";

/**
 * All registered migrations, sorted by target version (oldest first).
 * The upgrade command filters this list to only run migrations between
 * the user's current version and the installed version.
 */
export const migrations: Migration[] = [];
