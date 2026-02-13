/**
 * Migration type definition.
 *
 * Each migration transforms the user's desgin-duck/ directory
 * from one version's schema to the next.
 */
export interface Migration {
  /** Target version this migration upgrades TO (e.g., "0.2.0") */
  version: string;
  /** Human-readable description of what this migration does */
  description: string;
  /** Transform files in the desgin-duck/ directory */
  migrate: (duckDir: string) => void;
}
