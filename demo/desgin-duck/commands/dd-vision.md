# Design Duck — Vision

Define or refine the product vision, mission, and problem statement.

## How to Use

The user tagged this file to ask you to work on the **vision** phase.
Use their message as context for what the vision should be about.

## Steps

1. Start the live UI so the user can see progress in real time:

   ```bash
   dd ui
   ```

2. Run the context command to get the current state and instructions:

   ```bash
   dd context vision
   ```

3. Read the output carefully — it contains the current `vision.yaml` state,
   any existing context items, and detailed instructions for what to do.

4. **Ask the user about their situation first** — company stage, team size,
   budget, constraints, target users, etc. Capture these as context items in
   `desgin-duck/docs/context.yaml`. Do not define the vision in a vacuum.

5. Follow the instructions from the context output. Edit
   `desgin-duck/docs/vision.yaml` with a clear **vision**, **mission**,
   and **problem** statement, informed by the context and the user's request.

6. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- YAML is the source of truth — edit the files directly.
- Keep descriptions concise and user-focused.
- Every downstream decision traces back to the vision.
- Context items should be one-liner factual statements.

## Next Step

When you're done, suggest the user continue to the **projects** phase to split the
vision into deliverable work streams: `@dd-projects`
