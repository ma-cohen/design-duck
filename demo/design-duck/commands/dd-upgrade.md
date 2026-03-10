# Design Duck — Upgrade

Upgrade Design Duck to the latest version.

## How to Use

The user tagged this file to ask you to **upgrade** Design Duck.

## Steps

1. Run the upgrade command — it automatically cleans and reinstalls the latest
   version from GitHub before applying migrations:

   ```bash
   dd upgrade
   ```

2. Review the output for any migration messages or warnings.

3. Report to the user what was upgraded and if any action is needed.

## Notes

- The upgrade command handles the full clean reinstall automatically (removes
  `node_modules` and `package-lock.json` to force a fresh fetch from GitHub).
- Backups of overwritten files are saved in `design-duck/.backup/`.
- AGENTS.md and command files are always regenerated to stay current.
