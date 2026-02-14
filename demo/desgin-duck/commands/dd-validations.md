# Design Duck — Validations

Define global cross-cutting validations that all projects must respect.

## How to Use

The user tagged this file to ask you to work on **global validations**.
These are checks that apply across all projects (linting, testing, security, CI, etc.).

## Steps

1. Run the context command to get the current state and instructions:

   ```bash
   dd context validations
   ```

2. Read the output carefully — it contains existing validations and
   detailed instructions.

3. Follow the instructions from the context output. Edit
   `desgin-duck/docs/implementation.yaml` to add or update
   cross-cutting validation rules.

4. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- Each validation needs an `id`, `description`, and `category`.
- Categories group validations (e.g. `linting`, `testing`, `ci`, `security`).

## Next Step

When you're done, let the user know the design process is complete. They can
now start implementing based on the plans in each project's `implementation.yaml`.
If any projects still need an implementation plan, suggest: `@dd-implementation`
