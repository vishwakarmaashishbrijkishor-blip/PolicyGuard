# compliant-service

A change that follows every default PolicyGuard policy. Compared with the baseline in
`fixtures/sample-typescript-service` it adds the same capabilities as `vulnerable-service`, safely:

- `POST /admin/users` is protected with `requireRole("admin")` and has an unauthorized-access test.
- The new migration is additive and reversible (`up` and `down`).
- UI code uses the service layer instead of the database client.
- Secrets come from the environment.
- The new `lodash` dependency updates `pnpm-lock.yaml`.
- The exported `User` type only gains an optional property.
- The protected `src/auth/require-role.ts` change carries `policyguard: reviewed-by alice`.

PolicyGuard reports no findings for this change.
