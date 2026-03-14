# Design Duck — Reset

Reset Design Duck to a clean state, deleting all docs and starting fresh.

## How to Use

The user tagged this file to ask you to **reset** Design Duck.

## Steps

1. Run the reset command with `--force` to skip the confirmation prompt:

   ```bash
   dd reset --force
   ```

2. This will:
   - Delete the entire `design-duck/docs/` directory (all projects, vision, design, etc.)
   - Delete and regenerate the `design-duck/commands/` directory
   - Re-create everything with fresh empty templates (same as `dd init`)

3. Report to the user that the reset is complete.

## Notes

- Without `--force`, the command prompts for confirmation before deleting.
- This is destructive — all existing YAML content will be lost.
- The `design-duck/` directory itself, `package.json`, `.gitignore`, and the
  `duck` wrapper scripts are preserved.

## Next Step

After resetting, suggest the user start fresh with the **vision** phase: `@dd-vision`
