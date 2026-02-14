# Design Duck — Projects

Split the vision into distinct projects.

## How to Use

The user tagged this file to ask you to work on the **projects** phase.
Use their message as context for how to split the vision into projects.

## Prerequisites

The vision must be defined first (`desgin-duck/docs/vision.yaml`).

## Steps

1. Run the context command to get the current state and instructions:

   ```bash
   dd context projects
   ```

2. Read the output carefully — it contains the current vision, existing
   projects (if any), and detailed instructions.

3. Follow the instructions from the context output. Create project directories
   under `desgin-duck/docs/projects/<name>/` with a
   `requirements.yaml` containing a `visionAlignment` field.

4. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- Each project must have a `visionAlignment` explaining how it supports the vision.
- Project names should be kebab-case (e.g. `user-auth`, `payment-flow`).

## Next Step

When you're done, suggest the user continue to the **requirements** phase to
gather user-value requirements for each project: `@dd-requirements`
