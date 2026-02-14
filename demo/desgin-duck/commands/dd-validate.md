# Design Duck — Validate

Validate all YAML files and cross-references.

## How to Use

The user tagged this file to ask you to **validate** the Design Duck YAML files.

## Steps

1. Run the validate command:

   ```bash
   dd validate
   ```

2. Review the output for any errors or warnings.

3. If there are validation errors, fix them:
   - **Invalid YAML**: Fix syntax in the reported file.
   - **Missing requirementRefs**: Add references to existing requirement IDs.
   - **Missing contextRefs**: Add references to existing context item IDs.
   - **Duplicate IDs**: Rename to ensure uniqueness within scope.
   - **Missing globalDecisionRefs**: Reference existing global decision IDs.

4. Re-run `dd validate` until all checks pass.
