# SQA Implementation Plan — bangers-mobile

Phased implementation plan to address all 33 findings from the [SQA Report](file:///home/voss/Projects/Bangers/bangers-mobile/sqa_report.md). Organized into 6 phases, ordered by dependency chain and ROI (high-impact low-effort first).

> [!IMPORTANT]
> This plan covers the **mobile app only**. Tasks requiring backend changes (P1 — friendship status API) are flagged but out of scope for this plan.

---

## Phase 1 — Quick Wins (Low Effort, High Impact)

*Estimated: ~2 hours. No architectural changes, all isolated fixes.*

---

### Bugfixes & Correctness

#### [MODIFY] [useSearch.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useSearch.ts)
**Task M4** — Fix the wrong import. Change `../api/events` → `../api/search`.

#### [MODIFY] [acts.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/acts.repository.ts)
**Task P4** — Fix `getAllByEvent` to actually filter by `eventId`. Replace the unfiltered `SELECT *` with a JOIN through `timetable_entries` → `timetables` → `events`.

```sql
SELECT DISTINCT a.* FROM acts a
  JOIN timetable_entries te ON a.id = te.act_id
  JOIN timetables t ON te.timetable_id = t.id
  WHERE t.event_id = ? AND a.deleted_at IS NULL
```

#### [MODIFY] [settings.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/settings.tsx)
**Task M8** — Route the logout `DELETE` queries through `runExclusive` to prevent write mutex bypass:

```typescript
import { runExclusive, getDb } from "../src/database/sqlite";
// ...
await runExclusive(async () => {
  const db = await getDb();
  await db.execAsync(`DELETE FROM user_event_attendance; DELETE FROM favorites;`);
});
```

---

### Data Unwrapping Cleanup

#### [MODIFY] [client.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/client.ts)
**Task M3** — Add a JSDoc comment above the response interceptor explaining the auto-unwrapping behavior, so future devs don't add redundant unwraps.

#### [MODIFY] [useEventStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useEventStore.ts)
**Task M3** — Remove the double-unwrap fallback on line 82:
```diff
-const fetchedEvent = (eventRes.data as any).data || eventRes.data;
+const fetchedEvent = eventRes.data;
```

#### [MODIFY] [useFriends.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useFriends.ts)
**Task M3** — Remove the double-unwrap fallback on line 12:
```diff
-return (res as any).data.data || res.data || [];
+return res.data || [];
```

---

### Database Performance

#### [MODIFY] [sqlite.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/sqlite.ts)
**Task P2** — Add indexes after table creation in `initDatabase`:

```sql
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON user_event_attendance(status);
CREATE INDEX IF NOT EXISTS idx_timetable_event ON timetables(event_id);
CREATE INDEX IF NOT EXISTS idx_timetable_entries_timetable ON timetable_entries(timetable_id);
CREATE INDEX IF NOT EXISTS idx_act_artists_act ON act_artists(act_id);
CREATE INDEX IF NOT EXISTS idx_act_artists_artist ON act_artists(artist_id);
```

#### [MODIFY] [timetables.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/timetables.repository.ts)
**Task P3** — Rewrite `getByEventId` to use a single JOIN query instead of the N+1 loop.

#### [MODIFY] All 5 repository files
**Task P5** — Replace `for (id of ids) { DELETE ... }` loops with a single `DELETE FROM table WHERE id IN (?)` using dynamic placeholder generation:

```typescript
const placeholders = ids.map(() => '?').join(',');
await db.runAsync(`DELETE FROM events WHERE id IN (${placeholders})`, ids);
```

---

### Security Quick Wins

#### [MODIFY] [env.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/config/env.ts)
**Task S5** — Add HTTPS enforcement for production:

```typescript
if (!__DEV__ && !ENV.API_BASE_URL.startsWith('https://')) {
  throw new Error('Production builds must use HTTPS API URLs');
}
```

**Task E5** — Replace hardcoded env var name lookups with a generic `process.env[name]` fallback.

---

## Phase 2 — Input Validation Layer (Low Effort, Critical Impact)

*Estimated: ~2-3 hours. New module, standalone.*

---

#### [NEW] [src/validation/schemas.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/validation/schemas.ts)
**Task S1** — Create Zod schemas for all user-facing inputs:

- `loginSchema` — email format, password min length
- `registerSchema` — email, password, username (alphanumeric, 3-30 chars)
- `searchSchema` — query string length limit (1-100), XSS strip
- `groupSchema` — name (1-50 chars), description optional
- `profileUpdateSchema` — bio length, name constraints

#### [NEW] [src/validation/index.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/validation/index.ts)
Export a `validate<T>(schema, data)` helper that throws user-friendly errors.

#### [MODIFY] Auth screens (login, register)
Wire validation to form submission before API calls.

#### [MODIFY] Search, group creation, profile update hooks
Add `validate()` calls before API calls.

**Dependency:** Install `zod` — `npm install zod`

---

## Phase 3 — Security Hardening (Low–Medium Effort)

*Estimated: ~3-4 hours. Touches auth flow.*

---

#### [MODIFY] [useAuthStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useAuthStore.ts)
**Task S2** — Encapsulate tokens:
- Remove `accessToken` and `refreshToken` from exposed Zustand state
- Keep them in a closure-scoped variable or a non-exposed part of the store
- Expose only `isAuthenticated: boolean`, `user`, and the action methods
- The API client interceptor already reads tokens via `getState()` — create a dedicated `getAccessToken()` / `getRefreshToken()` internal API

#### [MODIFY] [_layout.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/_layout.tsx)
- Replace `useAuthStore((s) => s.accessToken)` with `useAuthStore((s) => s.isAuthenticated)`

#### [MODIFY] [useAuthStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useAuthStore.ts)
**Task S3** — Replace `localStorage` web fallback with in-memory storage for tokens (sessionStorage as minimum, or a closure-scoped map).

#### Git History Cleanup
**Task S4** — Purge `.env` from Git history:
```bash
# Install BFG if needed
git filter-repo --path .env --invert-paths
git push --force-with-lease
```

---

## Phase 4 — Architecture & Extensibility (Medium Effort)

*Estimated: ~4-5 hours. Structural improvements.*

---

### Sync System

#### [MODIFY] [syncHelpers.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/syncHelpers.ts)
**Task E1** — Replace switch statements with registry:

```typescript
const syncRegistry = new Map<string, { batchUpsert: Function; batchHardDelete: Function }>();
syncRegistry.set("events", eventsRepository);
syncRegistry.set("artists", artistsRepository);
syncRegistry.set("acts", actsRepository);

batchHandleUpsert: async (entityType, items) => {
  const repo = syncRegistry.get(entityType);
  if (!repo) throw new Error(`Unknown entity type: ${entityType}`);
  await repo.batchUpsert(items);
},
```

### Error Handling

#### [NEW] [src/utils/errorReporter.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/utils/errorReporter.ts)
**Task M6** — Centralized error reporting:

```typescript
export const reportError = (error: unknown, context?: Record<string, unknown>) => {
  const err = error instanceof Error ? error : new Error(String(error));
  if (__DEV__) {
    console.error(`[${context?.source || 'App'}]`, err.message, context);
  } else {
    // Future: Sentry.captureException(err, { extra: context });
  }
};
```

#### [MODIFY] All files with `console.error`
Replace 15+ `console.error` calls with `reportError()`.

### Error Boundaries

#### [NEW] [src/components/ErrorBoundary.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/src/components/ErrorBoundary.tsx)
**Task E2** — React Error Boundary with user-friendly fallback UI (retry button, error description).

#### [MODIFY] [_layout.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/_layout.tsx)
Wrap route groups with `<ErrorBoundary>`.

### Database Improvements

#### [MODIFY] [migrations.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/migrations.ts)
**Task E3** — Implement proper sequential migrations:

```typescript
const migrations: Record<number, (db: SQLiteDatabase) => Promise<void>> = {
  1: async (db) => { /* schema already created in initDatabase */ },
  2: async (db) => { /* future schema changes */ },
};

export const runMigrations = async (db: SQLiteDatabase) => {
  const { user_version } = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version") || { user_version: 0 };
  for (const [version, migrate] of Object.entries(migrations)) {
    if (user_version < Number(version)) {
      await migrate(db);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    }
  }
};
```

#### [MODIFY] All repository files
**Task M7** — Add typed row interfaces:

```typescript
interface EventRow {
  id: string; name: string; description: string | null;
  location: string | null; start_date: string; end_date: string;
  version: number; banner_url: string | null;
  created_at: string; updated_at: string; deleted_at: string | null;
}
```

Use `db.getAllAsync<EventRow>(...)` instead of casting to `any`.

### Performance

#### [MODIFY] [useDeltaSync.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useDeltaSync.ts)
**Task P6** — Throttle foreground syncs with a minimum interval:

```typescript
const SYNC_COOLDOWN_MS = 60_000;
let lastSyncTime = 0;

const sync = useCallback(async () => {
  if (isSyncing || Date.now() - lastSyncTime < SYNC_COOLDOWN_MS) return;
  lastSyncTime = Date.now();
  // ...existing sync logic
}, [isSyncing]);
```

---

## Phase 5 — Refactoring & Code Quality (Medium–High Effort)

*Estimated: ~4-6 hours. Larger refactors.*

---

#### [MODIFY] [useTimetables.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useTimetables.ts)
**Task M5** — Extract duplicated optimistic toggle logic into a shared helper:

```typescript
// New helper function
const applyToggleToEntries = (
  entries: TimetableEntry[],
  entryId: string,
  userId: string,
  isGroup: boolean
): TimetableEntry[] => {
  return entries.map(entry => {
    if (String(entry.id) !== String(entryId)) return entry;
    const wasAttending = isGroup ? (entry.pivot?.is_attending ?? false) : (entry.is_attending ?? false);
    // ...shared toggle logic
    return updatedEntry;
  });
};
```

Use this in `onMutate`, `onSuccess`, and for the groups cache update.

#### [NEW] [src/database/repositories/BaseRepository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/BaseRepository.ts)
**Task E4** — Generic base repository factory:

```typescript
export const createBaseRepository = <T extends { id: string }>(tableName: string) => ({
  getAll: async (): Promise<T[]> => { ... },
  getById: async (id: string): Promise<T | null> => { ... },
  batchHardDelete: async (ids: string[]) => { ... },
});
```

Extend each concrete repository from this base.

#### [MODIFY] [eslint.config.js](file:///home/voss/Projects/Bangers/bangers-mobile/eslint.config.js)
**Task M9** — Add strict rules:
- `@typescript-eslint/no-explicit-any: warn`
- `no-console: warn`
- Prettier integration

#### State Management Audit
**Task M2** — Document and enforce state management boundaries. Add a `CONVENTIONS.md` that states:
- **Zustand** = client-only state (UI prefs, auth, sync status)
- **TanStack Query** = server state (events, friends, groups, timetables)

> [!WARNING]
> Full `useEventStore` migration (M2) is the highest-effort task. Consider deferring to a dedicated sprint. The immediate win is documenting the convention and preventing further divergence.

---

## Phase 6 — Test Coverage (High Effort, Critical Impact)

*Estimated: ~8-12 hours. Highest ROI for long-term stability.*

---

The existing test infrastructure is already configured: Jest with `jest-expo/node` preset, `@testing-library/react-native`, coverage collection on `src/**/*.{ts,tsx}`.

### Test Priority Order

#### [NEW] [src/api/__tests__/client.test.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/__tests__/client.test.ts)
**M1.1** — API client interceptor tests:
- ✅ Adds Authorization header when token exists
- ✅ Auto-unwraps Laravel `{ data: ... }` wrapper
- ✅ Retries on 401 with refreshed token
- ✅ Deduplicates concurrent refresh requests
- ✅ Calls `logout()` when refresh fails
- ✅ Does not retry non-401 errors

#### [NEW] [src/store/__tests__/useAuthStore.test.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/__tests__/useAuthStore.test.ts)
**M1.2** — Auth store tests:
- ✅ `setAuth` stores tokens and user
- ✅ `logout` clears state and fires callbacks
- ✅ `updateFriendsCount` handles delta correctly
- ✅ Persists only tokens (not user) to SecureStore

#### [NEW] [src/sync/__tests__/deltaSync.test.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/__tests__/deltaSync.test.ts)
**M1.3** — Delta sync pipeline tests:
- ✅ Fetches all 3 entities in parallel
- ✅ Processes upserts and deletes correctly
- ✅ Updates sync timestamps on success
- ✅ Sets `isSyncing` flag correctly
- ✅ Handles abort signals
- ✅ Handles partial failures

#### [NEW] [src/database/repositories/__tests__/events.repository.test.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/__tests__/events.repository.test.ts)
**M1.4** — Repository tests (using in-memory SQLite):
- ✅ `batchUpsert` inserts and updates events
- ✅ `batchHardDelete` removes events
- ✅ `getAttendingEvents` returns only future going events
- ✅ `getAll` excludes soft-deleted events

#### [NEW] [src/hooks/__tests__/useAttendance.test.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/__tests__/useAttendance.test.ts)
**M1.5** — Optimistic update + rollback tests:
- ✅ Optimistically increments attendee count
- ✅ Rolls back on API error
- ✅ Invalidates correct query keys on settle

---

## Verification Plan

### Automated Tests

All existing + new tests run via:
```bash
cd /home/voss/Projects/Bangers/bangers-mobile
npx jest --coverage
```

**Target:** ≥60% coverage on `src/api/`, `src/hooks/`, `src/store/`, `src/database/`.

The 3 existing tests (`sanity.test.ts`, `AnimatedCounter.test.tsx`, `format.test.ts`) must continue to pass.

### Build Verification

After each phase, verify the app compiles and starts:
```bash
npx expo start --tunnel --clear
```

### Manual Verification

For phases 1-4, after making changes:
1. **Launch the app** on your device/emulator
2. **Login** → verify auth flow still works
3. **Dashboard** → verify events load (tests data unwrapping fixes)
4. **Search** → verify search works (tests import fix)
5. **Open a timetable** → toggle attendance → verify optimistic update
6. **Settings → Logout** → verify clean logout without database errors
7. **Pull to refresh** on dashboard → verify delta sync runs

---

## Out of Scope (Backend Required)

| Task | Description |
|---|---|
| P1 | Add `GET /friends/{userId}/status` endpoint — requires backend change |
| S6 | SSL certificate pinning — requires production certificates |
| S8 | Biometric/PIN lock — product decision needed |
| S9 | Refresh token rotation — requires backend verification |
| E6 | Feature flags system — requires remote config infrastructure |
| M10 | Settings placeholder sections — requires product design for Notifications, Account, Privacy |
