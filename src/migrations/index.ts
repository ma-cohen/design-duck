/**
 * Migration registry – exports all migrations sorted by semver.
 *
 * To add a new migration:
 * 1. Create a file in src/migrations/ named after the target version (e.g., 0.2.0.ts)
 * 2. Export a Migration object from that file
 * 3. Import it here and add it to the `migrations` array in version order
 */

import type { Migration } from "./types";
import { migration as m020 } from "./0.2.0";
import { migration as m030 } from "./0.3.0";
import { migration as m040 } from "./0.4.0";
import { migration as m050 } from "./0.5.0";
import { migration as m060 } from "./0.6.0";

/**
 * All registered migrations, sorted by target version (oldest first).
 * The upgrade command filters this list to only run migrations between
 * the user's current version and the installed version.
 */
export const migrations: Migration[] = [
  m020,
  m030,
  m040,
  m050,
  m060,
];
