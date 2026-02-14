# Design Duck — UI

Start the live Design Duck UI dashboard.

## How to Use

The user tagged this file to ask you to **start the UI**.

## Steps

1. Run the UI command:

   ```bash
   dd ui
   ```

2. The UI starts on an auto-selected port (starting from 3456). Report the
   URL to the user so they can open it in their browser.

3. The UI auto-updates when YAML files change — no need to restart.

## Notes

- The UI is read-only — it displays the current state from the YAML files.
- Keep it running in the background while working on other phases.
- If the port is already in use, the next available port is selected.
