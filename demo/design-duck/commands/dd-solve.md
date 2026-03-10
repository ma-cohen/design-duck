# Design Duck — Solve (Full Cycle)

Run the entire Design Duck workflow in one shot: vision, projects, requirements,
design, choose — all without stopping between phases.

## How to Use

The user tagged this file to run the **full cycle**. Use their message as the
problem statement. You will take it through every phase automatically.

## Steps

1. Start the live UI so the user can see progress in real time:

   ```bash
   dd ui
   ```

2. Run the solve context command to get the current state and full instructions:

   ```bash
   dd context solve
   ```

3. Read the output carefully — it contains the current state of all phases,
   YAML formats, guidelines, and step-by-step instructions.

4. Follow **all** the instructions from the context output. Work through every
   phase sequentially. **Do NOT stop between phases** to suggest next steps —
   just keep going until everything is complete.

5. Run validation when done:

   ```bash
   dd validate
   ```

6. Present a summary of everything created and let the user know they can
   review in the UI.

## Rules

- YAML is the source of truth — edit the files directly.
- **Do NOT stop between phases.** Run the full cycle in one go.
- Ask context questions upfront (situation + tech stack) before starting.
- Keep descriptions concise and user-focused.

## After Completion

Let the user know they can:
- Review everything in the live UI
- Add more problems: `@dd-add`
- Iterate on specific decisions: `@dd-design` or `@dd-choose`
