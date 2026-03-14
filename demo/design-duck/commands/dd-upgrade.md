# Design Duck — Upgrade

Upgrade Design Duck to the latest version.

## How to Use

The user tagged this file to ask you to **upgrade** Design Duck.

## Steps

1. Run the upgrade command — it pulls the latest version from npm and applies
   any pending migrations:

   ```bash
   dd upgrade
   ```

   If the npm registry is behind (e.g. a corporate mirror with a sync delay),
   pull directly from GitHub Releases instead:

   ```bash
   dd upgrade --github
   ```

2. Review the output for any migration messages or warnings.

3. Report to the user what was upgraded and if any action is needed.

## Notes

- By default, upgrade uses npm. Pass `--github` to bypass a stale npm mirror.
- Backups of overwritten files are saved in `design-duck/.backup/`.
- AGENTS.md and command files are always regenerated to stay current.
