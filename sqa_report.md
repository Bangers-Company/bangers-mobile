# 📋 Software Quality Assurance Report

### `bangers-mobile` — Expo / React Native Application
**Date:** 2026-03-19 &nbsp;|&nbsp; **Scope:** Full Application &nbsp;|&nbsp; **Files Analyzed:** 60+

---

## Executive Summary

| Pillar | Rating | Verdict |
|---|:---:|---|
| 🔒 **Security** | 6 / 10 | Decent auth foundations, but gaps in token handling, input validation, and data exposure |
| ⚡ **Performance** | 7 / 10 | Good patterns (WAL, batch ops, optimistic UI), but N+1 queries and unbounded lists present |
| 🧩 **Extensibility** | 7 / 10 | Clean layered architecture, but some tight coupling and missing abstractions |
| 🛠 **Maintainability** | 5 / 10 | Readable code, but near-zero test coverage and duplicated logic across layers |
| **Overall** | **6.25 / 10** | Solid foundation with significant room for hardening |

---

## 🤠 The Good, The Bad & The Ugly

### ✅ The Good

**1. Well-structured layered architecture**
The codebase follows a disciplined `api/ → hooks/ → store/ → database/` layered architecture with clear separation of concerns. Each API module has a corresponding hook and a dedicated repository, making the data flow easy to trace.

**2. Robust token refresh mechanism**
The [client.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/client.ts) implements a shared-promise token refresh pattern that correctly deduplicates concurrent 401 retry requests — a common pitfall handled well here.

**3. Optimistic UI updates**
Both [useAttendance.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useAttendance.ts) and [useTimetables.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useTimetables.ts) implement proper optimistic updates with rollback on error, giving users instant feedback.

**4. SQLite best practices**
[sqlite.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/sqlite.ts) configures WAL journal mode, busy timeout, and foreign keys. The custom `runExclusive` write mutex prevents `database is locked` errors.

**5. Secure token storage**
[useAuthStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useAuthStore.ts) persists tokens to `expo-secure-store` (Keychain/Keystore) on native platforms — the correct approach for sensitive credentials.

**6. Delta sync system**
The [deltaSync.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/deltaSync.ts) + [syncHelpers.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/syncHelpers.ts) pipeline supports incremental syncs with timestamp-based pagination and batch database operations.

**7. Dynamic theming system**
The [ThemeProvider.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/src/context/ThemeProvider.tsx) + [theme.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/utils/theme.ts) deliver animated accent color switching, AMOLED mode, and system theme detection — a premium UX touch.

**8. Graceful error recovery**
The root [_layout.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/_layout.tsx) has database error recovery UI with retry and reset options, plus hydration timeout fallback.

---

### 👎 The Bad

**1. Near-zero test coverage** — `SEVERITY: HIGH`
Only **3 test files** exist in the entire project:
- `sanity.test.ts` — a `1+1=2` placeholder
- `AnimatedCounter.test.tsx`
- `format.test.ts`

Zero tests for: API client, auth flow, stores, hooks, sync logic, database repositories, or any business logic.

> [!CAUTION]
> This is the single biggest quality risk. Any refactor or feature addition could silently break critical flows (auth, sync, attendance) with no safety net.

**2. Dual state management with no clear boundary** — `SEVERITY: MEDIUM`
The app uses **both** Zustand stores and TanStack Query for the same domain entities. For example:
- `useEventStore` (Zustand) caches events with optimistic updates
- `useEvent` / `useAttendance` (TanStack Query) also cache and mutate the same events

This creates a dual source of truth where Zustand and Query caches can diverge, leading to stale UI or inconsistent data.

**3. `useFriendshipStatus` is an N+1 anti-pattern** — `SEVERITY: MEDIUM`
[useFriendship.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useFriendship.ts#L10-L42) fetches the **entire friends list AND all requests** just to check the status of a single user. If a user has 500 friends, this downloads all 500 every time a profile is opened.

**4. Duplicate optimistic update logic** — `SEVERITY: MEDIUM`
The timetable toggle attendance logic is duplicated ~3 times in [useTimetables.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useTimetables.ts): once in `onMutate` for timetable cache, once in `onMutate` for groups cache, and again in `onSuccess`. This creates a high risk of bugs when any update is made.

**5. `useSearch` imports from wrong module** — `SEVERITY: LOW`
[useSearch.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useSearch.ts#L2) imports `searchApi` from `../api/events` instead of `../api/search`. This likely compiles because of re-exports but is misleading and fragile.

**6. Inconsistent data unwrapping patterns** — `SEVERITY: LOW`
The API client auto-unwraps Laravel's `{ data: ... }` wrapper, but code throughout the app still manually unwraps:
```typescript
// client.ts already unwraps "data" wrapper, but then:
const fetchedEvent = (eventRes.data as any).data || eventRes.data;  // useEventStore
return (res as any).data.data || res.data || [];                    // useFriends
```
This leads to double-unwrapping or fallback chains that mask bugs.

**7. Database queries return `any` types** — `SEVERITY: LOW`
All repository methods cast SQLite results to `any` before mapping:
```typescript
const rows = await db.getAllAsync("SELECT * FROM events...");
return rows.map((row: any) => ({ ...row }));  // No type safety
```

---

### 💀 The Ugly

**1. No input validation or sanitization anywhere** — `SEVERITY: CRITICAL`

No user input is validated before sending to the API or writing to the database:
- [auth.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/auth.ts): `register` accepts raw `Partial<User>` — no email/password format checks
- [search.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/search.ts): search queries pass raw strings directly
- [timetables.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/timetables.ts): group names passed without length/content checks
- Database operations rely entirely on server-side validation

> [!WARNING]
> While parameterized queries protect against SQL injection in the local DB, the complete absence of client-side validation means malformed data, XSS payloads, or excessively long strings can be sent to the API without any guard.

**2. Auth tokens accessible to all Zustand consumers** — `SEVERITY: HIGH`

The `useAuthStore` exposes `accessToken` and `refreshToken` as readable state to every component:
```typescript
const accessToken = useAuthStore((state) => state.accessToken);
```
Any component can read raw tokens. A better pattern is to keep tokens fully internal to the API client and only expose an `isAuthenticated` boolean.

**3. Settings logout bypasses the write mutex** — `SEVERITY: MEDIUM**

In [settings.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/settings.tsx#L101-L113), logout directly calls `db.execAsync()`, bypassing the `runExclusive` write mutex that exists to prevent concurrent write conflicts:
```typescript
const db = await getDb();
await db.execAsync(`DELETE FROM user_event_attendance; DELETE FROM favorites;`);
```
If a sync operation is writing at the same time, this could trigger a `database is locked` error.

**4. `timetablesRepository.getByEventId` is an N+1 query** — `SEVERITY: MEDIUM`

[timetables.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/timetables.repository.ts#L76-L89) fetches all timetable rows, then calls `getById()` for each one individually — triggering a separate query per timetable:
```typescript
for (const row of rows) {
  const timetable = await timetablesRepository.getById((row as any).id);
}
```

**5. `actsRepository.getAllByEvent` ignores the `eventId` parameter** — `SEVERITY: MEDIUM`

[acts.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/acts.repository.ts#L43-L51) accepts `eventId` but returns ALL acts from the database:
```typescript
getAllByEvent: async (eventId: string): Promise<Act[]> => {
  // For now returning all active acts
  const rows = await db.getAllAsync("SELECT * FROM acts WHERE deleted_at IS NULL");
```

---

## 🔒 Security — Detailed Analysis

| Finding | Severity | Location |
|---|:---:|---|
| No input validation on any user-facing form | 🔴 Critical | All API modules |
| Tokens exposed as readable state to all components | 🔴 High | [useAuthStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useAuthStore.ts) |
| Web fallback stores tokens in `localStorage` (insecure) | 🟡 Medium | [useAuthStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useAuthStore.ts#L29-L31) |
| `.env` file committed to repo despite being in `.gitignore` | 🟡 Medium | [.env](file:///home/voss/Projects/Bangers/bangers-mobile/.env) |
| No HTTPS enforcement or certificate pinning | 🟡 Medium | [client.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/client.ts) |
| No rate limiting on auth endpoints (client-side) | 🟢 Low | [auth.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/auth.ts) |
| No biometric or PIN lock for app access | 🟢 Low | — |
| Refresh token rotation not verified | 🟢 Low | Token refresh flow |

### Security Improvement Tips

1. **Add a Zod validation layer** — Create a `src/validation/` module with schemas for auth forms, search queries, and group creation. Validate before API calls.
2. **Encapsulate tokens** — Remove `accessToken`/`refreshToken` from exposed state. Only expose `isAuthenticated` and let the interceptor handle tokens internally.
3. **Enforce HTTPS** — Add a base URL check that blocks non-HTTPS URLs in production builds.
4. **Add certificate pinning** — Use `expo-secure-store` or a native module for SSL pinning in production.
5. **Purge `.env` from Git history** — Run `git filter-branch` or BFG to remove the committed `.env` containing your local IP.

---

## ⚡ Performance — Detailed Analysis

| Finding | Severity | Location |
|---|:---:|---|
| `useFriendshipStatus` fetches all friends + requests per profile view | 🔴 High | [useFriendship.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useFriendship.ts) |
| `getByEventId` is an N+1 query loop | 🟡 Medium | [timetables.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/timetables.repository.ts#L76-L89) |
| `getAllByEvent` returns all acts regardless of event filter | 🟡 Medium | [acts.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/acts.repository.ts#L43-L51) |
| Batch delete uses individual DELETE statements in a loop | 🟡 Medium | All repositories |
| No database indexes beyond primary keys | 🟡 Medium | [sqlite.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/sqlite.ts) |
| EventStore spreads entire store state on each event update | 🟢 Low | [useEventStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useEventStore.ts) |
| `useDeltaSync` triggers on every `AppState.active` transition | 🟢 Low | [useDeltaSync.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useDeltaSync.ts) |

### Performance Improvement Tips

1. **Add database indexes** — Add indexes on frequently queried columns:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
   CREATE INDEX IF NOT EXISTS idx_events_deleted_at ON events(deleted_at);
   CREATE INDEX IF NOT EXISTS idx_attendance_status ON user_event_attendance(status);
   CREATE INDEX IF NOT EXISTS idx_timetable_event ON timetables(event_id);
   ```
2. **Fix N+1 in `getByEventId`** — Use a single JOIN query instead of a loop.
3. **Add a dedicated friendship status API** — Replace the "fetch all friends" approach with a `GET /friends/{userId}/status` endpoint.
4. **Use `IN (?)` clauses for batch deletes** — Replace loops with `DELETE FROM events WHERE id IN (?, ?, ?)`.
5. **Throttle app-foreground syncs** — Add a minimum interval (e.g., 60s) between delta syncs to avoid rapid fire on frequent tab switches.
6. **Add FlatList/FlashList to all list renders** — Ensure large event lists use virtualized lists.

---

## 🧩 Extensibility — Detailed Analysis

| Finding | Severity | Location |
|---|:---:|---|
| Sync system hardcoded to 3 entity types only | 🟡 Medium | [deltaSync.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/deltaSync.ts), [syncHelpers.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/syncHelpers.ts) |
| Switch statements for entity routing in sync helpers | 🟡 Medium | [syncHelpers.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/syncHelpers.ts) |
| No error boundary components | 🟡 Medium | App-wide |
| Migration system exists but is essentially a no-op | 🟡 Medium | [migrations.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/migrations.ts) |
| Schema creation and migration are separated with no versioning bridge | 🟢 Low | [sqlite.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/sqlite.ts) |
| `env.ts` hardcoded env var name lookups | 🟢 Low | [env.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/config/env.ts) |

### Extensibility Improvement Tips

1. **Registry-based sync** — Replace the switch statements with a registry pattern:
   ```typescript
   const syncRegistry = new Map<string, Repository>();
   syncRegistry.set("events", eventsRepository);
   // Adding a new entity = one line
   ```
2. **Add React Error Boundaries** — Wrap route groups with error boundary components to prevent full-app crashes.
3. **Implement proper migrations** — Use sequential numbered migrations with a version table, so schema changes can be applied incrementally.
4. **Create a base repository** — Extract common CRUD operations (`batchUpsert`, `batchHardDelete`, `getById`, `getAll`) into a generic base class to reduce repeated code.
5. **Add feature flags** — Use a config/flags system to toggle features without deploys (useful for A/B testing, staged rollouts).

---

## 🛠 Maintainability — Detailed Analysis

| Finding | Severity | Location |
|---|:---:|---|
| 3 test files for 60+ source files (~2% coverage) | 🔴 Critical | [src/__tests__/](file:///home/voss/Projects/Bangers/bangers-mobile/src/__tests__) |
| `useTimetables.ts` is 287 lines with deeply nested optimistic updates | 🟡 Medium | [useTimetables.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useTimetables.ts) |
| Dual state management (Zustand + TanStack Query) without clear boundaries | 🟡 Medium | Stores vs Hooks |
| Inconsistent data unwrapping (`(res as any).data.data`) | 🟡 Medium | Multiple hooks |
| `any` type used extensively in repositories and hooks | 🟡 Medium | All repositories |
| Console.error used instead of structured error reporting | 🟡 Medium | All async operations |
| No linting rules enforced for code quality (basic ESLint config) | 🟢 Low | [eslint.config.js](file:///home/voss/Projects/Bangers/bangers-mobile/eslint.config.js) |
| Settings page placeholder sections (Notifications, Account, Privacy) | 🟢 Low | [settings.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/settings.tsx) |

### Maintainability Improvement Tips

1. **Invest in test coverage** — Prioritize testing these critical paths first:
   - Auth flow (login, refresh, logout)
   - Delta sync pipeline
   - Optimistic update + rollback in `useAttendance`
   - Database repository batch operations
   - API client interceptors (401 retry, data unwrapping)

2. **Consolidate state management** — Pick one source of truth per entity:
   - Use **TanStack Query** for server-state (events, friends, timetables)
   - Use **Zustand** only for client-state (UI preferences, auth tokens, sync status)

3. **Add structured error handling** — Replace `console.error` with a centralized error service:
   ```typescript
   // src/utils/errorReporter.ts
   export const reportError = (error: Error, context?: Record<string, any>) => {
     if (__DEV__) console.error(error, context);
     else Sentry.captureException(error, { extra: context });
   };
   ```

4. **Refactor `useTimetables.ts`** — Extract the deeply nested optimistic update logic into a helper function that both `onMutate` and `onSuccess` can share.

5. **Type the database layer** — Create typed row interfaces for each SQLite table and use them in repository return types instead of `any`.

6. **Add strict ESLint rules** — Enable `@typescript-eslint/no-explicit-any`, `no-console` (warn), and `@typescript-eslint/strict-boolean-expressions`.

---

## 📊 Quality Heatmap

| Layer | Security | Performance | Extensibility | Maintainability |
|---|:---:|:---:|:---:|:---:|
| **API Client** | 🟡 | 🟢 | 🟢 | 🟡 |
| **API Modules** | 🔴 | 🟢 | 🟢 | 🟢 |
| **Zustand Stores** | 🟡 | 🟡 | 🟢 | 🟡 |
| **TanStack Hooks** | 🟢 | 🔴 | 🟢 | 🟡 |
| **Database/SQLite** | 🟢 | 🟡 | 🟡 | 🔴 |
| **Repositories** | 🟢 | 🟡 | 🟡 | 🟡 |
| **Sync System** | 🟢 | 🟢 | 🟡 | 🟢 |
| **Components** | 🟢 | 🟢 | 🟢 | 🟢 |
| **Routing/Layout** | 🟢 | 🟢 | 🟢 | 🟢 |
| **Tests** | — | — | — | 🔴 |

🟢 = Good &nbsp; 🟡 = Needs attention &nbsp; 🔴 = Critical

---

## 🎯 Complete Action Plan

### 🔒 Security Tasks

| # | Task | Severity | Effort | Files Affected |
|:---:|---|:---:|:---:|---|
| S1 | **Add Zod input validation layer** — Create `src/validation/` module with schemas for auth forms (email/password format), search queries (length limits, XSS sanitization), group names, and profile updates. Validate before every API call. | 🔴 Critical | Low | All API modules, new `src/validation/` |
| S2 | **Encapsulate auth tokens** — Move `accessToken`/`refreshToken` out of Zustand's exposed state. Keep them internal to the API client module and only expose `isAuthenticated: boolean` + `user` to components. | 🔴 High | Low | [useAuthStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useAuthStore.ts), [client.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/client.ts), [_layout.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/_layout.tsx) |
| S3 | **Replace `localStorage` web fallback with `httpOnly` cookie or in-memory storage** — The current web fallback stores tokens in `localStorage`, which is accessible via XSS. Use a more secure alternative for web builds. | 🟡 Medium | Low | [useAuthStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useAuthStore.ts#L29-L31) |
| S4 | **Purge `.env` from Git history** — The `.env` file with local IP is committed despite being in `.gitignore`. Run BFG Repo-Cleaner or `git filter-repo` to remove it from history. | 🟡 Medium | Low | `.env`, Git history |
| S5 | **Add HTTPS enforcement** — Add a runtime check in `env.ts` that blocks non-HTTPS base URLs in production builds (`!__DEV__`). Log a warning in dev mode. | 🟡 Medium | Low | [env.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/config/env.ts) |
| S6 | **Add SSL certificate pinning** — Integrate a certificate pinning solution (e.g., `react-native-ssl-pinning` or custom Axios adapter) for production API calls to prevent MITM attacks. | 🟡 Medium | Medium | [client.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/client.ts) |
| S7 | **Add client-side rate limiting on auth endpoints** — Implement a simple cooldown (e.g., 3 attempts per 30s) on login and register forms to prevent brute-force from the client side. | 🟢 Low | Low | Auth screens, [auth.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/auth.ts) |
| S8 | **Add biometric/PIN app lock** — Use `expo-local-authentication` to add optional biometric unlock for returning users, protecting sensitive data if the device is shared. | 🟢 Low | Medium | New `src/hooks/useBiometricAuth.ts`, [_layout.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/_layout.tsx) |
| S9 | **Verify refresh token rotation** — Confirm the backend issues a new refresh token on each refresh call and invalidates the old one. If not, implement rotation to limit token reuse attack window. | 🟢 Low | Low | [client.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/client.ts#L52-L70), Backend |

---

### ⚡ Performance Tasks

| # | Task | Severity | Effort | Files Affected |
|:---:|---|:---:|:---:|---|
| P1 | **Add a dedicated friendship status API endpoint** — Create `GET /friends/{userId}/status` on the backend and use it in `useFriendshipStatus` instead of downloading all friends + all requests per profile view. | 🔴 High | Medium | [useFriendship.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useFriendship.ts), Backend |
| P2 | **Add database indexes** — Create indexes on `events(start_date)`, `events(deleted_at)`, `user_event_attendance(status)`, `timetables(event_id)`, and `timetable_entries(timetable_id)` to accelerate all filtered queries. | 🟡 Medium | Low | [sqlite.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/sqlite.ts) |
| P3 | **Fix `getByEventId` N+1 query** — Replace the loop that calls `getById()` per row with a single JOIN query that fetches timetables + entries + acts in one go. | 🟡 Medium | Low | [timetables.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/timetables.repository.ts#L76-L89) |
| P4 | **Fix `getAllByEvent` to actually filter by event** — Add a JOIN through `timetable_entries` → `timetables` to filter acts by the given event ID instead of returning all acts. | 🟡 Medium | Low | [acts.repository.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/repositories/acts.repository.ts#L43-L51) |
| P5 | **Use `IN (?)` for batch deletes** — Replace `for (const id of ids) { DELETE ... }` loops with a single `DELETE FROM table WHERE id IN (?, ?, ?)` parameterized query using dynamic placeholder generation. | 🟡 Medium | Low | All 5 repositories |
| P6 | **Throttle foreground sync** — Add a minimum interval check (e.g., 60 seconds since last sync) in `useDeltaSync` to avoid triggering a full sync on every rapid app-foreground transition. | 🟢 Low | Low | [useDeltaSync.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useDeltaSync.ts) |
| P7 | **Use `immer` middleware or selective updates in EventStore** — The current `setEventData` spreads the entire `events` record on every single event update, creating unnecessary object allocations. Use Zustand's `immer` middleware or selective key updates. | 🟢 Low | Low | [useEventStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useEventStore.ts) |
| P8 | **Audit list renders for virtualization** — Verify all screens rendering event lists, friend lists, and search results use `FlashList` or `FlatList` instead of `ScrollView` + `.map()` to ensure smooth scrolling at scale. | 🟢 Low | Medium | Components in `dashboard/`, `event/` |

---

### 🧩 Extensibility Tasks

| # | Task | Severity | Effort | Files Affected |
|:---:|---|:---:|:---:|---|
| E1 | **Implement registry-based sync** — Replace the hardcoded switch statements in `syncHelpers.ts` with a `Map<string, Repository>` registry so adding a new entity type requires one line instead of modifying three switch blocks. | 🟡 Medium | Low | [syncHelpers.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/syncHelpers.ts), [deltaSync.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/sync/deltaSync.ts) |
| E2 | **Add React Error Boundaries** — Create an `ErrorBoundary` component and wrap each route group (`(tabs)`, `(auth)`, `event/`) so crashes in one screen don't take down the entire app. Show a user-friendly fallback UI with retry. | 🟡 Medium | Low | New `src/components/ErrorBoundary.tsx`, [_layout.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/_layout.tsx) |
| E3 | **Implement proper database migrations** — Expand `migrations.ts` to run sequentially versioned migrations (version 2, 3, etc.) using the `PRAGMA user_version` already in place. Move schema creation out of `initDatabase` into migration v1. | 🟡 Medium | Medium | [migrations.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/migrations.ts), [sqlite.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/sqlite.ts) |
| E4 | **Create a generic base repository** — Extract common operations (`batchUpsert`, `batchHardDelete`, `getById`, `getAll`) into a `BaseRepository<T>` class or factory function to reduce the ~50% code duplication across 5 repository files. | 🟡 Medium | Medium | All files in `src/database/repositories/` |
| E5 | **Make `env.ts` data-driven** — Replace the hardcoded `if (name === "EXPO_PUBLIC_...")` checks with a generic `process.env[name]` lookup or a config schema object, so adding a new env var doesn't require code changes. | 🟢 Low | Low | [env.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/config/env.ts) |
| E6 | **Add a feature flags system** — Create `src/config/featureFlags.ts` using remote config or a local JSON file to gate features without code deploys. Useful for staged rollouts and A/B testing. | 🟢 Low | Medium | New `src/config/featureFlags.ts` |

---

### 🛠 Maintainability Tasks

| # | Task | Severity | Effort | Files Affected |
|:---:|---|:---:|:---:|---|
| M1 | **Add test coverage for critical paths** — Write tests for: API client interceptors (401 refresh, data unwrapping), auth flow (login → store → token refresh → logout), delta sync pipeline, optimistic updates + rollback in `useAttendance`, and batch repository operations. Target: ≥60% coverage on `src/api/`, `src/hooks/`, `src/store/`, `src/database/`. | 🔴 Critical | High | New test files in `src/__tests__/`, `src/hooks/__tests__/`, `src/store/__tests__/`, `src/database/__tests__/` |
| M2 | **Consolidate state management rules** — Establish and enforce a clear boundary: Zustand = client-only state (UI prefs, auth, sync status), TanStack Query = server state (events, friends, groups, timetables). Remove `useEventStore` and migrate its caching/optimistic logic to TanStack Query mutations. | 🟡 Medium | High | [useEventStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useEventStore.ts), all components consuming it |
| M3 | **Fix data unwrapping inconsistencies** — Audit all hooks and store actions that access API responses. The client auto-unwraps `{ data: ... }`, so remove all manual `.data.data` fallback chains. Add a doc comment to `client.ts` explaining the unwrapping so future devs don't add redundant unwraps. | 🟡 Medium | Low | [useEventStore.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/store/useEventStore.ts#L82), [useFriends.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useFriends.ts#L12), [useSearch.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useSearch.ts) |
| M4 | **Fix `useSearch` import** — Change the import from `../api/events` to `../api/search` to match the actual module location of `searchApi`. | 🟡 Medium | Low | [useSearch.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useSearch.ts#L2) |
| M5 | **Refactor `useTimetables.ts`** — Extract the 3× duplicated optimistic toggle attendance logic into a shared helper (e.g., `applyToggleToEntries(entries, entryId, userId)`) used by both `onMutate` and `onSuccess`. Reduces the file from 287 to ~180 lines. | 🟡 Medium | Medium | [useTimetables.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useTimetables.ts) |
| M6 | **Add centralized error reporting** — Replace all `console.error` calls with a `reportError(error, context)` utility that logs in dev and sends to Sentry/Crashlytics in production. There are 15+ unstructured `console.error` calls across the codebase. | 🟡 Medium | Low | New `src/utils/errorReporter.ts`, all files with `console.error` |
| M7 | **Type the database layer** — Create typed row interfaces (e.g., `EventRow`, `ArtistRow`) for each SQLite table and use `db.getAllAsync<EventRow>()` instead of casting to `any`. Catches schema mismatches at compile time. | 🟡 Medium | Medium | All files in `src/database/repositories/` |
| M8 | **Route settings logout through `runExclusive`** — Fix the logout in `settings.tsx` to use the write mutex to prevent concurrent write conflicts with sync operations. | 🟡 Medium | Low | [settings.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/settings.tsx#L101-L113) |
| M9 | **Add strict ESLint rules** — Extend ESLint config with `@typescript-eslint/no-explicit-any` (warn), `no-console` (warn), `@typescript-eslint/strict-boolean-expressions`, and Prettier integration for consistent formatting. | 🟢 Low | Low | [eslint.config.js](file:///home/voss/Projects/Bangers/bangers-mobile/eslint.config.js) |
| M10 | **Implement or remove settings placeholder sections** — The Notifications, Account, and Privacy sections in settings show placeholder text. Either implement them or remove them to avoid confusing users. | 🟢 Low | Low–High | [settings.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/settings.tsx#L272-L300) |

---

## 📈 Effort / Impact Matrix

```
                        HIGH IMPACT
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          │   S1, S2, M3    │  M1, M2, P1     │
          │   S4, S5, P2    │                 │
          │   P3, P4, P5    │                 │
          │   M4, M8, E1    │                 │
   LOW    │   E2, M6, M9    │                 │  HIGH
  EFFORT  │─────────────────┼─────────────────│ EFFORT
          │                 │                 │
          │   S7, P6, P7    │  S6, S8, E3     │
          │   E5            │  E4, E6, M5     │
          │                 │  M7, P8, M10    │
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                        LOW IMPACT
```

> [!TIP]
> **Start top-left** for maximum ROI: tasks like **S1** (Zod validation), **S2** (token encapsulation), **P2–P5** (database indexes + query fixes), and **M3–M4** (data unwrapping fixes) deliver high impact with minimal effort. Then move to top-right for the bigger-ticket items like **M1** (test coverage) and **M2** (state management consolidation).

---

> [!NOTE]
> The codebase has a **strong architectural foundation**. The layered design, optimistic updates, and delta sync are above-average for a mobile app at this stage. The highest ROI improvements are **test coverage** (M1) and **input validation** (S1) — both dramatically reduce regression risk and security surface area.
