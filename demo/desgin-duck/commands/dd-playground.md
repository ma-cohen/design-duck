# Design Duck — Playground

Create or work on an isolated playground for exploring a specific design problem.

## How to Use

The user tagged this file to ask you to work on a **playground** — an isolated
exploration that is not tied to the main product vision. Use this when you want
to explore a specific problem, spike a solution, or just play with Design Duck
on one focused thing.

## Steps

1. Start the live UI so the user can see progress in real time:

   ```bash
   dd ui
   ```

2. Run the playground context command to see existing playgrounds:

   ```bash
   dd context playground
   ```

3. Read the output carefully — it lists existing playgrounds and instructions
   for creating new ones.

4. **Ask the user what specific problem they want to explore.** A playground
   should focus on one specific problem or question.

5. Create a playground directory at
   `desgin-duck/docs/playgrounds/<playground-name>/requirements.yaml`
   with a clear `problemStatement`.

6. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- YAML is the source of truth — edit the files directly.
- Playground names should be kebab-case (e.g. `caching-strategy`, `auth-spike`).
- Each playground must have a `problemStatement` describing what problem it explores.
- Playgrounds are independent of the vision — they have no `visionAlignment`.
- Playgrounds can be thrown away or promoted into real projects later.

## Next Step

When the playground is created, continue to gather requirements:
`dd context playground-requirements <playground-name>`

Then follow the same flow:
- `dd context playground-design <playground-name>`
- `dd context playground-choose <playground-name>`
- `dd context playground-implementation <playground-name>`
