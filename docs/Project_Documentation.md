# Bangers Mobile Development Documentation

This document tracks the architectural decisions, structural changes, and feature implementations for the Bangers Mobile application.

---

## Phase 1: Core Infrastructure & Offline-First Foundation

### Objective

Establish a robust, type-safe communication layer with the backend and implement an offline-first data strategy using SQLite and a Delta Sync engine.

### Structural Changes

#### 1. API Layer (`src/api/`)

- **[client.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/api/client.ts)**: Axios instance with interceptors for:
  - Automatic `Authorization: Bearer` header injection.
  - Automatic token refresh on `401 Unauthorized` responses.
- **Dedicated Modules**:
  - `auth.ts`: Registration, Login, Logout, Refresh.
  - `sync.ts`: Delta sync fetching for Events, Artists, and Acts.
  - `events.ts`: Individual event details and attendance status.
  - `search.ts`: Global search across events, artists, and acts.
  - `timetables.ts`: Personal and official timetable management.
  - `groups.ts`: Group planning and shared group timetables.
  - `friends.ts`: Friend requests and social management.
  - `favorites.ts`: Bookmarking acts.

#### 2. Offline Storage (`src/database/`)

- **[sqlite.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/database/sqlite.ts)**: Database initialization and schema definition.
- **Repositories (`src/database/repositories/`)**:
  - `events.repository.ts`: Local storage for event metadata.
  - `artists.repository.ts`: Local storage for artist profiles.
  - `acts.repository.ts`: Local storage for acts and artist-act relations.
  - `timetables.repository.ts`: Local storage for personal and group schedules.
  - `favorites.repository.ts`: Simple storage for bookmarked act IDs.

#### 3. State Management (`src/store/`)

- **`useAuthStore.ts`**: Persisted user session using `expo-secure-store`.
- **`useSyncStore.ts`**: Tracking `since` timestamps for each entity type to optimize delta syncs.

#### 4. Core Hooks (`src/hooks/`)

- `useDeltaSync.ts`: Orchestrates the sync lifecycle (runs on app start and foregrounding).
- `useOffline.ts`: Detects real-time network status changes.
- `useAttendance.ts`: Optimistic updates for event attendance.
- `useSearch.ts`, `useFriends.ts`, `useGroups.ts`: Functional abstractions for the API.

### Configuration & Modification Points

- **API URL**: Change `API_BASE_URL` in `src/api/client.ts` to point to different environments.
- **SQLite Schema**: Add new tables or columns in `src/database/sqlite.ts` and update `src/database/migrations.ts` for schema evolution.
- **Sync Logic**: Modify the `runDeltaSync` function in `src/sync/deltaSync.ts` to add new syncable entities.
- **Constants**: Global UI and API settings are located in `src/utils/constants.ts`.

---

## Phase 3: Authentication UI

### Objective

Provide a high-energy, secure onboarding experience with full registration, login, and password recovery flows.

### Structural Changes

#### 1. Auth Stack (`app/(auth)/`)

- **[login.tsx](<file:///home/voss/Projects/Bangers/bangers-mobile/app/(auth)/login.tsx>)**: Main entry point with email/password and social login placeholders.
- **[register.tsx](<file:///home/voss/Projects/Bangers/bangers-mobile/app/(auth)/register.tsx>)**: New user onboarding flow.
- **[forgot-password.tsx](<file:///home/voss/Projects/Bangers/bangers-mobile/app/(auth)/forgot-password.tsx>)**: Password recovery request.
- **[\_layout.tsx](<file:///home/voss/Projects/Bangers/bangers-mobile/app/(auth)/_layout.tsx>)**: Stack navigator for auth screens.

#### 2. Root Navigation

- **[\_layout.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/app/_layout.tsx)**: Updated with an `useEffect` hook that monitors `accessToken` and automatically switches between `(auth)` and `(tabs)` segments.

### Configuration & Modification Points

- **Validation**: Modify validation logic in `handleLogin` or `handleRegister` within the respective screen files.
- **Redirects**: Adjust the redirect paths in the root `_layout.tsx` if the tab structure changes.

---

## Phase 2: Dynamic Theming & Material YOU

### Objective

Implement a sophisticated theming system supporting multiple modes and Android-specific design language enhancements, while ensuring consistent navigation across different app contexts.

### Structural Changes

#### 1. Theming Infrastructure

- **[theme.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/utils/theme.ts)**: Centralized theme tokens.
  - Supports `MD3LightTheme`, `MD3DarkTheme`.
  - Custom `AppAmoledTheme` for deep black high-contrast display.
- **[ThemeProvider.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/src/context/ThemeProvider.tsx)**: Orchestration layer.
  - Synchronizes `React Native Paper` and `React Navigation` themes.
  - Detects system appearance and respects user overrides.
- **[useMaterialYou.ts](file:///home/voss/Projects/Bangers/bangers-mobile/src/hooks/useMaterialYou.ts)**: Hook for extracting system-level accent colors on Android.

#### 2. Navigation Components (`src/components/navigation/`)

- **[BottomNav.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/src/components/navigation/BottomNav.tsx)**: Context-aware bottom bar.
  - **Dashboard Mode**: Minimalist pill-style floating bar.
  - **Event Mode**: Full-featured tab bar with labels.
- **[TopBar.tsx](file:///home/voss/Projects/Bangers/bangers-mobile/src/components/navigation/TopBar.tsx)**: Global header.
  - Brand identity for main screens.
  - Minimalist transparent overlay for Event Details.

### Configuration & Modification Points

- **Color Palettes**: Add or modify colors in `COLORS` object within `src/utils/theme.ts`.
- **Navigation Routes**: Update `dashboardItems` or `eventItems` in `BottomNav.tsx` to change available tabs.
- **Theme Logic**: Adjust theme priority (System vs User Override) in `src/context/ThemeProvider.tsx`.

---
