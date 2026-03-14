# Design Duck — Init

Initialize Design Duck in the current project.

## How to Use

The user tagged this file to ask you to **initialize** Design Duck.

## Steps

1. Run the init command:

   ```bash
   dd init
   ```

   If the npm registry is behind (e.g. a corporate mirror with a sync delay),
   use the GitHub Release source instead:

   ```bash
   dd init --github
   ```

2. Install dependencies:

   ```bash
   cd design-duck && npm install && cd ..
   ```

3. Report the created folder structure to the user and suggest next steps:
   - Start the UI: `dd ui`
   - Begin with vision: tag `@dd-vision` with a description of the product

## Notes

- Init only runs once — it will refuse to overwrite an existing setup.
- After init, all Design Duck state lives in `design-duck/`.

## Next Step

When you're done, suggest the user start with the **vision** phase to define
the product direction: `@dd-vision`
