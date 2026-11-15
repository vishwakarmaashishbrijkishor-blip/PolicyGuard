# vulnerable-service

A deliberately non-compliant change used by PolicyGuard's integration tests and demo. Compared with the
baseline in `fixtures/sample-typescript-service`, it introduces:

| Violation | Where | Rule |
| --- | --- | --- |
| New route without authorization | `src/routes/admin-users.ts` (`POST /admin/users`) | `new-route-requires-authorization` |
| Destructive migration without rollback | `src/migrations/0002-drop-users-table.ts` | `migration-requires-rollback` |
| Direct database access in UI code | `src/ui/user-list.tsx` | `no-direct-db-access-in-ui` |
| Removed test | `tests/routes/admin-users.test.ts` | `deleted-test-requires-justification` |
| Likely secret | `src/config.ts` | `secret-detected-in-source` |
| Dependency change without lockfile update | `package.json` (`lodash`) | `dependency-without-lockfile-update` |
| Breaking change to an exported type | `src/services/user-service.ts` (`User.email` removed) | `public-api-breaking-change` |
| Protected path changed without review annotation | `src/auth/require-role.ts` | `protected-path-requires-review-annotation` |

The access key in `src/config.ts` is random and not a real credential.
