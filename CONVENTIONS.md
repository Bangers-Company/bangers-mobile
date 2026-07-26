# Bangers Mobile Development Conventions

## State Management Boundaries

To maintain a clean and scalable architecture, we strictly separate state into two categories:

### 1. Server State (TanStack Query)
**Location**: `src/hooks/`
**Purpose**: Any data that originates from or is persisted to the server (API) or local database.
**Guidelines**:
- Use `useQuery` for fetching data.
- Use `useMutation` for actions that change data.
- Implement **Optimistic Updates** in `onMutate` using `queryClient.setQueryData`.
- Use centralized cache update helpers in `src/utils/cacheUpdates.ts` to ensure consistency.
- **DO NOT** sync server data into Zustand stores unless absolutely necessary for cross-cutting UI logic (e.g., auth session).

### 2. Client-Only State (Zustand)
**Location**: `src/store/`
**Purpose**: Purely client-side UI state, preferences, and session metadata.
**Examples**:
- `useAuthStore`: Authentication session (tokens, current user profile).
- `useSyncStore`: Local database synchronization status.
- `useThemeStore`: UI theme preferences (accent colors, dark mode).
**Guidelines**:
- Keep stores small and focused.
- Use `persist` middleware only for data that must survive app restarts (e.g., tokens).
- Avoid storing complex entity lists; leave that to the TanStack Query cache.

## Local Database (SQLite)

- **Repositories**: Standardize all database access through repository classes extending `BaseRepository`.
- **Row Types**: Always define `*Row` interfaces for raw database rows to maintain type safety.
- **Migrations**: Add new schema changes to `src/database/migrations.ts` and increment the version in the migration runner.

## Error Handling

- **Reporting**: Use `reportError()` from `src/utils/errorReporter.ts` instead of raw `console.error`.
- **Resilience**: Wrap critical UI sections in `ErrorBoundary` (or use the `GlobalErrorBoundary` in root layout).

## Sync System

- **Registry**: Add new entities to the `syncRegistry` in `src/sync/syncHelpers.ts` to enable delta sync support.
- **Throttling**: Ensure foreground syncs are throttled (default: 1 minute) to conserve resources.
