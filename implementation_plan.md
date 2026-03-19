# Bangers Mobile — Comprehensive Implementation Plan

**Based on**: [SQA Report](file:///home/voss/Projects/Bangers/bangers-mobile/sqa_report.md)
**Scope**: Immediate (4 items), Short-term (4 items), Medium-term (5 items)
**Total Estimated Work**: ~13 work items across 3 phases

---

## Table of Contents

1. [Phase 1: Immediate — Before Beta Release](#phase-1-immediate--before-beta-release)
   - [1.1 Fix Hardcoded API URLs](#11-fix-hardcoded-api-urls)
   - [1.2 Reset QueryClient on Logout](#12-reset-queryclient-on-logout)
   - [1.3 Show Error State on DB Init Failure](#13-show-error-state-on-db-init-failure)
   - [1.4 Remove Dead Code](#14-remove-dead-code)
2. [Phase 2: Short-term — Next Sprint](#phase-2-short-term--next-sprint)
   - [2.1 Centralize API Response Unwrapping](#21-centralize-api-response-unwrapping)
   - [2.2 Replace `any` Types](#22-replace-any-types)
   - [2.3 Add Test Infrastructure](#23-add-test-infrastructure)
   - [2.4 Use FlashList for Search Results](#24-use-flashlist-for-search-results)
3. [Phase 3: Medium-term — Next Quarter](#phase-3-medium-term--next-quarter)
   - [3.1 Unify State Management Strategy](#31-unify-state-management-strategy)
   - [3.2 Consolidate Attendance Logic](#32-consolidate-attendance-logic)
   - [3.3 Add Error Monitoring](#33-add-error-monitoring)
   - [3.4 Add API Pagination](#34-add-api-pagination)
   - [3.5 Extract Shared Components](#35-extract-shared-components)

---

# Phase 1: Immediate — Before Beta Release

> [!IMPORTANT]
> These 4 items are **blocking issues** that should be resolved before any external users touch the app. They address security, data leakage, and crash resilience.

---

## 1.1 Fix Hardcoded API URLs

**Priority**: 🔴 Critical
**Effort**: ~1 hour
**Risk if skipped**: App only works on one specific Wi-Fi network

### Problem

Two files contain hardcoded network addresses that break when the app runs anywhere other than the developer's local network:

| File | Line | Current Value | Purpose |
|---|---|---|---|
| `src/api/client.ts` | L5 | `http://192.168.5.240:8080/api/mobile` | Backend API base URL |
| `src/utils/format.ts` | L22 | `http://localhost:8080` | Media/storage base URL |

### Implementation Steps

#### Step 1: Create the environment configuration file

**Create**: `src/config/env.ts`

```typescript
import Constants from "expo-constants";

/**
 * Centralized environment configuration.
 *
 * Values are read from app.json > expo.extra at build time via expo-constants.
 * For local development, override via .env file with EXPO_PUBLIC_ prefix.
 *
 * IMPORTANT: All environment variables MUST be prefixed with EXPO_PUBLIC_
 * to be available in the client bundle. Expo strips non-prefixed vars.
 */

const ENV = {
  /**
   * The full base URL for the mobile API.
   * Example: "https://api.bangers.app/api/mobile"
   * Dev:     "http://192.168.x.x:8080/api/mobile"
   */
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    Constants.expoConfig?.extra?.apiBaseUrl ||
    "http://localhost:8080/api/mobile",

  /**
   * The base URL for serving media files (images, banners, profile photos).
   * Should point to the same backend or a CDN in production.
   * Example: "https://cdn.bangers.app" or "http://192.168.x.x:8080"
   */
  STORAGE_BASE_URL:
    process.env.EXPO_PUBLIC_STORAGE_BASE_URL ||
    Constants.expoConfig?.extra?.storageBaseUrl ||
    "http://localhost:8080",
} as const;

export default ENV;
```

#### Step 2: Create `.env` file for local development

**Create**: `.env` (project root)

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.5.240:8080/api/mobile
EXPO_PUBLIC_STORAGE_BASE_URL=http://192.168.5.240:8080
```

#### Step 3: Add `.env` to `.gitignore`

**Modify**: `.gitignore` — append:

```gitignore
# Environment
.env
.env.local
.env.*.local
```

#### Step 4: Create `.env.example` for other developers

**Create**: `.env.example` (project root)

```env
# Backend API base URL (include /api/mobile path)
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080/api/mobile

# Storage/CDN base URL for media files
EXPO_PUBLIC_STORAGE_BASE_URL=http://localhost:8080
```

#### Step 5: Update `app.json` with fallback values

**Modify**: `app.json` — add to `expo.extra`:

```json
{
  "expo": {
    "extra": {
      "router": {},
      "apiBaseUrl": "http://localhost:8080/api/mobile",
      "storageBaseUrl": "http://localhost:8080",
      "eas": {
        "projectId": "a51da2ca-12a7-44ee-8645-87bd864d297a"
      }
    }
  }
}
```

#### Step 6: Update `src/api/client.ts`

**Modify** lines 1–5:

```diff
 import axios from "axios";
 import { useAuthStore } from "../store/useAuthStore";
 import { AuthResponse } from "../types/user";
+import ENV from "../config/env";

-const API_BASE_URL = "http://192.168.5.240:8080/api/mobile"; // Replace with actual API URL or env var
+const API_BASE_URL = ENV.API_BASE_URL;
```

#### Step 7: Update `src/utils/format.ts`

**Modify** the `resolveMediaUrl` function (lines 17–24):

```diff
+import ENV from "../config/env";

 export const resolveMediaUrl = (url?: string | null) => {
   if (!url) return null;
   if (url.startsWith("http")) return url;

-  // For local development, we assume media is served from the root of the backend
-  const STORAGE_BASE = "http://localhost:8080";
+  const STORAGE_BASE = ENV.STORAGE_BASE_URL;
   return `${STORAGE_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
 };
```

### Verification

- Run `npx expo start` and confirm the app connects to the API
- Change `.env` values and restart — confirm the app picks up the new values
- Delete `.env` — confirm the app falls back to `localhost`

---

## 1.2 Reset QueryClient on Logout

**Priority**: 🔴 Critical
**Effort**: ~30 minutes
**Risk if skipped**: User A's private data (events, friends, profile) visible to User B after login

### Problem

`queryClient` is a module-scoped singleton in `app/_layout.tsx:13`. When `logout()` is called (in `settings.tsx:101` and in `client.ts:67`), caching is not cleared. The next user who logs in will briefly see stale React Query cache data from the previous session.

### Implementation Steps

#### Step 1: Export `queryClient` from `_layout.tsx`

**Modify**: `app/_layout.tsx` — line 13:

```diff
-const queryClient = new QueryClient();
+export const queryClient = new QueryClient({
+  defaultOptions: {
+    queries: {
+      retry: 2,
+      staleTime: 1000 * 60 * 2, // 2 minutes
+    },
+  },
+});
```

> [!NOTE]
> While exporting, it's a good time to add sensible defaults. The `staleTime` prevents unnecessary refetches within 2 minutes.

#### Step 2: Update `useAuthStore.ts` — clear query cache on logout

**Modify**: `src/store/useAuthStore.ts`

Add a new logout function that clears the query cache. Because Zustand stores cannot import React components/hooks, we use a callback pattern:

```diff
+// Callbacks registered by the app layer for cleanup on logout
+const logoutCallbacks: (() => void)[] = [];

+export const registerLogoutCallback = (callback: () => void) => {
+  logoutCallbacks.push(callback);
+};

 export const useAuthStore = create<AuthState>()(
   persist(
     (set) => ({
       // ... existing state ...
-      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
+      logout: () => {
+        // Clear auth state
+        set({ accessToken: null, refreshToken: null, user: null });
+        // Execute registered cleanup callbacks (e.g., QueryClient.clear())
+        logoutCallbacks.forEach((cb) => cb());
+      },
     }),
     // ... persist config ...
   ),
 );
```

#### Step 3: Register the QueryClient cleanup in `_layout.tsx`

**Modify**: `app/_layout.tsx` — inside `RootLayout`, add a `useEffect`:

```diff
+import { registerLogoutCallback } from "../src/store/useAuthStore";

 export default function RootLayout() {
+  // Register QueryClient cleanup on logout — runs once on mount
+  useEffect(() => {
+    registerLogoutCallback(() => {
+      queryClient.clear();
+    });
+  }, []);
+
   // ... rest of component ...
 }
```

#### Step 4: Also clear local SQLite cache on logout (optional but recommended)

**Modify**: `app/settings.tsx` — `handleLogout` function (line 100–103):

```diff
+import { getDb } from "../src/database/sqlite";

 const handleLogout = async () => {
+  // Clear user-specific local data
+  try {
+    const db = await getDb();
+    await db.execAsync(`
+      DELETE FROM user_event_attendance;
+      DELETE FROM favorites;
+    `);
+  } catch (e) {
+    console.error("Failed to clear local data on logout:", e);
+  }
   logout();
   router.replace("/(auth)/login");
 };
```

### Verification

- Log in as User A, navigate to profile, events, friends
- Log out
- Log in as User B before the `staleTime` window
- Confirm User B does NOT see User A's data at any point

---

## 1.3 Show Error State on DB Init Failure

**Priority**: 🔴 Critical
**Effort**: ~1 hour
**Risk if skipped**: App crashes with opaque errors when SQLite init fails (e.g., corrupted DB, storage full)

### Problem

In `app/_layout.tsx:35–38`, the `.catch()` handler sets `isDbReady = true` even when database initialization fails. This allows the app to proceed with a non-functional database, causing every subsequent SQLite operation to throw unhandled errors.

### Implementation Steps

#### Step 1: Track the error state in `_layout.tsx`

**Modify**: `app/_layout.tsx`

```diff
 export default function RootLayout() {
   const [isHydrated, setIsHydrated] = useState(false);
   const [isDbReady, setIsDbReady] = useState(false);
+  const [dbError, setDbError] = useState<Error | null>(null);

   useEffect(() => {
     initDatabase()
       .then(() => {
         console.log("[RootLayout] Database initialized successfully.");
         setIsDbReady(true);
       })
       .catch((err) => {
         console.error("[RootLayout] Database initialization failed:", err);
-        setIsDbReady(true);
+        setDbError(err);
       });
   }, []);
```

#### Step 2: Add a retry handler

```typescript
const retryDbInit = useCallback(() => {
  setDbError(null);
  initDatabase()
    .then(() => {
      console.log("[RootLayout] Database initialized on retry.");
      setIsDbReady(true);
    })
    .catch((err) => {
      console.error("[RootLayout] Database retry failed:", err);
      setDbError(err);
    });
}, []);
```

#### Step 3: Add a "reset database" handler for corrupted DB

```typescript
const resetDatabase = useCallback(async () => {
  try {
    const db = await SQLite.openDatabaseAsync("bangers.db");
    await db.closeAsync();
    await SQLite.deleteDatabaseAsync("bangers.db");
    // Re-initialize
    retryDbInit();
  } catch (err) {
    console.error("[RootLayout] Failed to reset database:", err);
    setDbError(err as Error);
  }
}, [retryDbInit]);
```

#### Step 4: Render an error screen if DB init fails

Insert before the existing `if (!isHydrated || !isDbReady)` check:

```typescript
if (dbError) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#040405",
        padding: 32,
      }}
    >
      <Text
        style={{
          color: "#ff5252",
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Database Error
      </Text>
      <Text
        style={{
          color: "#ffffff",
          fontSize: 14,
          opacity: 0.7,
          textAlign: "center",
          marginBottom: 24,
          lineHeight: 20,
        }}
      >
        Failed to initialize the local database. This might be caused by
        insufficient storage or a corrupted database file.
      </Text>
      <View style={{ gap: 12, width: "100%" }}>
        <TouchableOpacity
          onPress={retryDbInit}
          style={{
            backgroundColor: "#a60df2",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>
            Retry
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={resetDatabase}
          style={{
            backgroundColor: "rgba(255,82,82,0.2)",
            borderWidth: 1,
            borderColor: "rgba(255,82,82,0.3)",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ff5252", fontWeight: "bold" }}>
            Reset Database
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

> [!WARNING]
> "Reset Database" deletes **all** local data (cached events, favorites, attendance). Make sure the button label and description make this clear to the user.

### Verification

- Temporarily break `initDatabase()` (e.g., invalid SQL) — confirm the error screen appears
- Press "Retry" — confirm it re-attempts
- Press "Reset Database" — confirm it deletes and re-creates the DB
- Remove the break — confirm the app works normally again

---

## 1.4 Remove Dead Code

**Priority**: 🟡 Medium
**Effort**: ~30 minutes
**Risk if skipped**: Confuses developers, increases cognitive overhead

### Items to Remove

#### Delete Empty Directories

```bash
rm -rf services/
rm -rf context/
rm -rf db/
rm -rf src/features/
rm -rf src/components/shared/
rm -rf src/components/profile/
```

#### Delete Expo Boilerplate Files

```bash
rm components/hello-wave.tsx
rm components/parallax-scroll-view.tsx
rm components/themed-text.tsx
rm components/themed-view.tsx
rm components/external-link.tsx
rm hooks/use-color-scheme.ts
rm hooks/use-color-scheme.web.ts
rm hooks/use-theme-color.ts
```

#### Verify No Imports Reference These Files

Before deleting, run:

```bash
grep -r "hello-wave\|parallax-scroll\|themed-text\|themed-view\|external-link\|use-color-scheme\|use-theme-color" \
  --include="*.ts" --include="*.tsx" \
  src/ app/
```

If no results, safe to delete. If matches exist, update those imports first.

#### Delete Empty Root Directories After Cleanup

If `components/` and `hooks/` (root-level) directories become empty after removing the boilerplate files, check if `components/ui/` has content. If `components/ui/` is also unused or empty, delete the entire root `components/` dir.

### Verification

- Run `npx expo start` — confirm the app builds and runs without errors
- Verify the project tree no longer contains empty directories or unused boilerplate

---

# Phase 2: Short-term — Next Sprint

> [!NOTE]
> These items improve code quality, developer experience, and performance. They form the foundation for safe refactoring in Phase 3.

---

## 2.1 Centralize API Response Unwrapping

**Priority**: 🔴 High
**Effort**: ~2–3 hours
**Depends on**: Phase 1.1 (env config) is recommended first

### Problem

The backend's Laravel API wraps all responses in `{ data: ... }`. The frontend handles this inconsistently with `(res.data as any).data || res.data` in 9+ locations, all using `any` to bypass TypeScript.

### Implementation Steps

#### Step 1: Define the generic API response type

**Create**: `src/types/api.ts`

```typescript
/**
 * Standard Laravel API response wrapper.
 * All endpoints return responses in this shape.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Paginated API response (for future pagination support).
 */
export interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    next: string | null;
    prev: string | null;
  };
}
```

#### Step 2: Add a response interceptor to `client.ts`

**Modify**: `src/api/client.ts` — add after line 14 (after `apiClient` creation), BEFORE the existing interceptors:

```typescript
// Response interceptor to unwrap Laravel's { data: ... } envelope.
// After this interceptor, res.data contains the INNER data directly.
// This MUST be registered before the auth interceptor.
apiClient.interceptors.response.use(
  (response) => {
    // Only unwrap if the response has the Laravel envelope shape
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      !Array.isArray(response.data)
    ) {
      response.data = response.data.data;
    }
    return response;
  },
);
```

> [!IMPORTANT]
> The interceptor order matters. This unwrapping interceptor must be registered **before** the 401 refresh interceptor. Axios applies response interceptors in registration order.

#### Step 3: Update all consumers to remove manual unwrapping

Update every file that currently does `(res.data as any).data || res.data`:

**`src/hooks/useTimetables.ts`** — 4 locations:

```diff
 // Line 11 — useOfficialTimetable
-      return (res.data as any).data || res.data;
+      return res.data;

 // Line 23 — useGroupTimetables
-      const list = Array.isArray(res.data) ? res.data : (res.data as any).data;
+      const list = Array.isArray(res.data) ? res.data : res.data;

 // Line 36 — useGroupTimetable
-      return (res.data as any).data || res.data;
+      return res.data;

 // Line 47 — useGroups
-      return (res.data as any).data || res.data;
+      return res.data;
```

**`src/hooks/useProfile.ts`** — 2 locations:

```diff
-      const userData = (response as any).data.data || (response as any).data;
-      const friendsResData = friendsRes?.data?.data || friendsRes?.data || [];
+      const userData = response.data;
+      const friendsResData = friendsRes.data;
```

**`src/hooks/useDashboardData.ts`** — 1 location:

```diff
-      const dashboardData = response.data?.data;
+      const dashboardData = response.data;
```

**`src/store/useEventStore.ts`** — 1 location:

```diff
-      const fetchedEvent = (eventRes.data as any).data || eventRes.data;
+      const fetchedEvent = eventRes.data;
```

**`app/(tabs)/index.tsx`** — 3 locations (the `rawAttending`, `rawUpcoming`, `rawSuggested` unwrapping):

```diff
-  const rawAttending = data?.attending_events;
-  const attendingEvents = Array.isArray(rawAttending)
-    ? rawAttending
-    : (rawAttending as any)?.data || [];
+  const attendingEvents = data?.attending_events || [];
```

_(Repeat for `rawUpcoming` → `upcomingEvents` and `rawSuggested` → `suggestedEvents`)_

#### Step 4: Update API module return types

Update the generic types in each API module to reflect what the consumer will receive (after unwrapping):

**`src/api/events.ts`**:

```diff
 export const eventsApi = {
-  getById: (id: string, config?: AxiosRequestConfig) =>
-    apiClient.get<Event>(`/events/${id}`, config),
+  getById: (id: string, config?: AxiosRequestConfig) =>
+    apiClient.get<Event>(`/events/${id}`, config),
   // ... (types stay the same, interceptor handles unwrapping)
 };
```

### Verification

- Run the app and verify all screens load data correctly (dashboard, event detail, profile, search, timetable)
- Confirm that no `(res.data as any).data` patterns remain:
  ```bash
  grep -rn "as any).data" --include="*.ts" --include="*.tsx" src/ app/
  ```

---

## 2.2 Replace `any` Types

**Priority**: 🟡 High
**Effort**: ~4–6 hours (iterative)
**Depends on**: Phase 2.1 (response unwrapping simplifies this)

### Strategy

Attack `any` elimination in order of impact:

1. **API response types** — highest value, affects every consumer
2. **Store state types** — affects all Zustand consumers
3. **Repository return types** — affects database layer
4. **Component prop types** — local impact, lower priority

### Implementation Steps

#### Step 1: Fix store types — `useTimetableStore.ts`

**Modify**: `src/store/useTimetableStore.ts`

```diff
+import { Group } from "../types/group";

 interface TimetableState {
-  groups: any[];
+  groups: Group[];
   viewMode: "vertical" | "horizontal";
   groupsFetched: boolean;
   // ...
 }
```

**Create**: `src/types/group.ts`

```typescript
import { Timetable } from "./timetable";
import { User } from "./user";

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: "owner" | "admin" | "member";
  invitation_status: "pending" | "accepted" | "rejected";
  user?: User;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  owner?: User;
  members?: GroupMember[];
  members_count?: number;
  timetables?: Timetable[];
  pivot?: {
    invitation_status: "pending" | "accepted" | "rejected";
  };
  created_at: string;
  updated_at: string;
}
```

#### Step 2: Fix repository return types — `events.repository.ts`

**Modify**: `src/database/repositories/events.repository.ts`

```diff
+interface EventRow {
+  id: string;
+  name: string;
+  description: string | null;
+  location: string | null;
+  start_date: string;
+  end_date: string;
+  version: number;
+  banner_url: string | null;
+  created_at: string;
+  updated_at: string;
+  deleted_at: string | null;
+}
+
+const mapRowToEvent = (row: EventRow): Event => ({
+  ...row,
+  description: row.description ?? "",
+  location: row.location ?? "",
+  banner: row.banner_url ? { url: row.banner_url } as any : null,
+  created_at: row.created_at,
+  updated_at: row.updated_at,
+});

// Then replace all `(row: any)` with `(row: EventRow)` and use mapRowToEvent
```

Apply the same pattern to `artists.repository.ts`, `acts.repository.ts`, `timetables.repository.ts`.

#### Step 3: Fix `TimetableEntry.attendees` type

**Modify**: `src/types/timetable.ts`

```diff
+export interface TimetableAttendee {
+  id: string;
+  name: string;
+  profile_photo_path: string | null;
+}

 export interface TimetableEntry {
   // ...
-  attendees?: any[];
+  attendees?: TimetableAttendee[];
 }
```

#### Step 4: Fix User type union confusion

**Modify**: `src/types/user.ts` — lines 32–35:

```diff
-  past_events?: { data: import("./event").Event[] } | import("./event").Event[];
-  upcoming_events?: { data: import("./event").Event[] } | import("./event").Event[];
+  past_events?: import("./event").Event[];
+  upcoming_events?: import("./event").Event[];
```

> [!NOTE]
> This is safe to do after Phase 2.1, because the response interceptor normalizes the shape before it reaches the type layer.

#### Step 5: Move `Friendship` interface from API to types

**Move** the `Friendship` interface from `src/api/friends.ts` to `src/types/user.ts` (or create `src/types/friendship.ts`). Update the import in `friends.ts`.

### Verification

- Run `npx tsc --noEmit` — count remaining `any` occurrences
- Target: reduce from 80+ to under 15 (some `any` in third-party lib interactions is acceptable)

---

## 2.3 Add Test Infrastructure

**Priority**: 🟡 High
**Effort**: ~3–4 hours for setup + first tests
**Depends on**: None (can be done in parallel with other items)

### Implementation Steps

#### Step 1: Install dependencies

```bash
npx expo install -- --save-dev \
  jest \
  @types/jest \
  ts-jest \
  @testing-library/react-native \
  @testing-library/jest-native \
  jest-expo
```

#### Step 2: Create Jest config

**Create**: `jest.config.js` (project root)

```javascript
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|native-base|react-native-svg|nativewind|react-native-reanimated|@shopify/flash-list)",
  ],
  setupFilesAfterSetup: ["./jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
};
```

#### Step 3: Create Jest setup

**Create**: `jest.setup.js` (project root)

```javascript
// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn().mockResolvedValue([]),
    withTransactionAsync: jest.fn((cb) => cb()),
  }),
}));
```

#### Step 4: Add test script to `package.json`

```diff
 "scripts": {
   "start": "expo start",
+  "test": "jest",
+  "test:watch": "jest --watch",
+  "test:coverage": "jest --coverage",
   "lint": "expo lint"
 },
```

#### Step 5: Write initial test files

Start with **pure utility functions** — highest value, easiest to test:

**Create**: `src/utils/__tests__/format.test.ts`

```typescript
import { formatCurrency, truncateString, resolveMediaUrl, formatDate } from "../format";

describe("format utilities", () => {
  describe("formatCurrency", () => {
    it("formats EUR amounts in Dutch locale", () => {
      expect(formatCurrency(10)).toContain("10");
    });
  });

  describe("truncateString", () => {
    it("returns original if shorter than limit", () => {
      expect(truncateString("hello", 10)).toBe("hello");
    });
    it("truncates and adds ellipsis", () => {
      expect(truncateString("hello world", 5)).toBe("hello...");
    });
  });

  describe("resolveMediaUrl", () => {
    it("returns null for null/undefined input", () => {
      expect(resolveMediaUrl(null)).toBeNull();
      expect(resolveMediaUrl(undefined)).toBeNull();
    });
    it("returns absolute URLs unchanged", () => {
      expect(resolveMediaUrl("https://cdn.example.com/img.jpg")).toBe("https://cdn.example.com/img.jpg");
    });
    it("prepends storage base for relative paths", () => {
      const result = resolveMediaUrl("/storage/img.jpg");
      expect(result).toContain("/storage/img.jpg");
    });
  });
});
```

**Create**: `src/utils/__tests__/theme.test.ts`

```typescript
import { getDynamicBackground, getDynamicSurface, addAlpha, COLORS } from "../theme";

describe("theme utilities", () => {
  describe("getDynamicBackground", () => {
    it("returns pure black for amoled mode", () => {
      expect(getDynamicBackground("#ff0000", "amoled")).toBe("#000000");
    });
    it("returns a light tint for light mode", () => {
      const bg = getDynamicBackground(COLORS.primary, "light");
      expect(bg).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("addAlpha", () => {
    it("adds alpha to hex colors", () => {
      const result = addAlpha("#ff0000", 0.5);
      expect(result).toBe("#ff000080");
    });
  });
});
```

**Create**: `src/database/repositories/__tests__/events.repository.test.ts` — test the data mapping logic.

### Verification

- Run `npm test` — confirm tests pass
- Run `npm run test:coverage` — confirm coverage report generates

---

## 2.4 Use FlashList for Search Results

**Priority**: 🟡 Medium
**Effort**: ~2 hours
**Depends on**: None

### Problem

`app/(tabs)/search.tsx` renders all search results inside a plain `ScrollView`. At scale, searches for common terms ("DJ", "festival") could return hundreds of results, all rendered simultaneously, causing:
- Jank and dropped frames during scrolling
- High memory usage from off-screen components
- Slow initial render time

### Implementation Steps

#### Step 1: Restructure search results into a flat list

The current screen renders 4 sections (events, artists, acts, users) inside a `ScrollView` using `data.map()`. To use `FlashList`, we need a single flat array with section headers.

**Modify**: `app/(tabs)/search.tsx`

```typescript
import { FlashList } from "@shopify/flash-list";

// Define a union type for list items
type SearchListItem =
  | { type: "header"; title: string }
  | { type: "event"; data: any }
  | { type: "artist"; data: any }
  | { type: "act"; data: any }
  | { type: "user"; data: any };
```

#### Step 2: Build a flat list from search results

```typescript
const flatData = useMemo((): SearchListItem[] => {
  if (!results) return [];
  const items: SearchListItem[] = [];

  if (results.events?.data?.length) {
    items.push({ type: "header", title: "Events" });
    results.events.data.forEach((e: any) => items.push({ type: "event", data: e }));
  }
  if (results.artists?.data?.length) {
    items.push({ type: "header", title: "Artists" });
    results.artists.data.forEach((a: any) => items.push({ type: "artist", data: a }));
  }
  if (results.acts?.data?.length) {
    items.push({ type: "header", title: "Acts" });
    results.acts.data.forEach((a: any) => items.push({ type: "act", data: a }));
  }
  if (results.users?.data?.length) {
    items.push({ type: "header", title: "Users" });
    results.users.data.forEach((u: any) => items.push({ type: "user", data: u }));
  }

  return items;
}, [results]);
```

#### Step 3: Replace `ScrollView` with `FlashList`

Replace the `<ScrollView>` containing `renderSection(...)` calls with:

```tsx
<FlashList
  data={flatData}
  estimatedItemSize={72}
  contentContainerStyle={styles.scrollContent}
  renderItem={({ item }) => {
    switch (item.type) {
      case "header":
        return (
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {item.title}
          </Text>
        );
      case "event":
        return (
          <View style={styles.itemWrapper}>
            <EventHorizontalCard
              event={item.data}
              onPress={(ev) => router.push(`/event/${ev.id}` as any)}
            />
          </View>
        );
      case "user":
        return (
          <View style={styles.itemWrapper}>
            {/* Move existing user card JSX from renderSection here */}
          </View>
        );
      case "artist":
      case "act":
        return (
          <View style={styles.itemWrapper}>
            {/* Move existing artist/act card JSX here */}
          </View>
        );
    }
  }}
  ListEmptyComponent={
    searchQuery.length > 0 ? (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge">No results found for "{searchQuery}"</Text>
      </View>
    ) : (
      <View style={styles.emptyContainer}>
        <SearchIcon size={64} color={theme.colors.outlineVariant} style={{ marginBottom: 16 }} />
        <Text variant="headlineSmall" style={{ color: theme.colors.outline }}>Search Bangers</Text>
        <Text variant="bodyMedium" style={styles.emptySubtext}>
          Find events, artists, and acts
        </Text>
      </View>
    )
  }
  keyExtractor={(item, index) =>
    item.type === "header" ? `header-${item.title}` : `${item.type}-${item.data.id}`
  }
  getItemType={(item) => item.type}
/>
```

#### Step 4: Also consider FlashList for profile's horizontal event lists

The profile screen (`app/(tabs)/profile.tsx`) uses `Animated.ScrollView` for horizontal event cards. For consistency and performance at scale, consider switching to `FlashList` with `horizontal={true}` for those lists as well.

### Verification

- Search for common terms — confirm smooth scrolling
- Monitor with React Native performance monitor (shake menu → "Show Perf Monitor")
- Confirm `FlashList` shows a blanking warning if `estimatedItemSize` is way off

---

# Phase 3: Medium-term — Next Quarter

> [!NOTE]
> These items require deeper architectural changes. Complete Phase 1 and Phase 2 first — they provide the type safety and test infrastructure needed for safe refactoring.

---

## 3.1 Unify State Management Strategy

**Priority**: 🟡 High
**Effort**: ~8–12 hours
**Depends on**: Phase 2.1 (API unwrapping), Phase 2.2 (type fixes), Phase 2.3 (tests)

### Current State

Three state management systems run simultaneously:

| System | Currently manages |
|---|---|
| **Zustand** | Auth tokens, UI preferences, sync timestamps, timetable groups, event cache |
| **React Query** | Timetables, profile, search, event details, friends, attendance |
| **Manual useState** | Dashboard data, action loading states, refresh states |

### Target Architecture

| System | Should manage | Rationale |
|---|---|---|
| **Zustand** | Auth tokens, UI preferences (theme, view mode) | Client-only state that never comes from the server |
| **React Query** | **Everything from the server**: events, profile, friends, groups, timetables, dashboard, attendance, search | Server-state with caching, deduplication, background refetch |

### Implementation Steps

#### Step 3.1.1: Migrate `useDashboardData` to React Query

**Modify**: `src/hooks/useDashboardData.ts`

Replace the entire manually-managed hook with `useQuery`:

```typescript
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard";
import { useAuthStore } from "../store/useAuthStore";

export const useDashboardData = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await dashboardApi.getDashboard();
      const data = response.data;

      // Side-effect: sync user data to auth store
      if (data?.user) {
        useAuthStore.getState().setUser(data.user);
      }

      // Side-effect: persist events to SQLite (fire-and-forget)
      const allEvents = [
        ...(data?.attending_events || []),
        ...(data?.upcoming_events || []),
        ...(data?.past_events || []),
        ...(data?.suggested_events || []),
        ...(data?.friends_events || []),
      ].filter((e) => e && e.id);

      if (allEvents.length > 0) {
        eventsRepository.batchUpsert(allEvents).catch(console.error);
      }

      return data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    data: query.data,
    loading: query.isLoading,
    refreshing: query.isFetching && !query.isLoading,
    error: query.error,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
  };
};
```

#### Step 3.1.2: Retire `useEventStore`

The `useEventStore` Zustand store duplicates caching that React Query already provides. Migrate its consumers:

1. Remove `useEventStore` entirely from `src/store/useEventStore.ts`
2. Update consumers to use the React Query-based `useEvent` hook instead
3. Move the `setAttendanceStatus` optimistic logic into the `useAttendance` React Query mutation

#### Step 3.1.3: Retire `useTimetableStore` data fetching

Move `fetchGroups`, `acceptInvitation`, `rejectInvitation`, `createGroup`, `deleteGroup`, `createGroupTimetable` to React Query mutations. Keep only `viewMode` in Zustand (it's client-only state).

#### Step 3.1.4: Remove `useSyncStore` persistence

The sync timestamp can be managed by React Query's `dataUpdatedAt` timestamps or kept in Zustand but simplified (it's borderline client state).

### Verification

- All screens load data from React Query
- Zustand only stores: `accessToken`, `refreshToken`, `user` (minimal), `themeMode`, `isAmoled`, `accentColor`, `viewMode`
- Zero `useState` for remote data
- React Query DevTools shows all active queries (add `@tanstack/react-query-devtools` temporarily)

---

## 3.2 Consolidate Attendance Logic

**Priority**: 🟡 High
**Effort**: ~6–8 hours
**Depends on**: Phase 3.1 (unified state management)

### Current State

Attendance toggling logic exists in **3 separate places**:

| File | Lines | What |
|---|---|---|
| `src/hooks/useAttendance.ts` | ~108 | Event-level going/remove via React Query mutation |
| `src/hooks/useTimetables.ts` | L52–213 (~160) | Timetable entry attendance via React Query mutation |
| `src/store/useEventStore.ts` | L112–155 (~44) | Event-level Zustand optimistic update |

### Target: Single Unified Hook

**Create**: `src/hooks/useUnifiedAttendance.ts`

```typescript
/**
 * Unified attendance hook.
 * Handles all attendance toggling across:
 * - Event-level (going/interested/remove)
 * - Official timetable entries
 * - Group timetable entries
 *
 * All optimistic updates and cache invalidation are centralized here.
 */
export const useUnifiedAttendance = (
  context: {
    type: "event" | "timetable-official" | "timetable-group";
    eventId: string;
    groupId?: string;
    timetableId?: string;
    entryId?: string;
  }
) => {
  const queryClient = useQueryClient();

  // ... single mutation that handles all 3 contexts
  // ... single optimistic update function
  // ... single rollback function
  // ... single invalidation function
};
```

### Key Design Decisions

1. **One `useMutation`** with a `context` discriminator
2. **The optimistic update helper** is extracted to a pure function that takes the cache and context, returns the updated cache — easy to unit test
3. **Cache invalidation** consolidated into one function that knows which query keys to invalidate based on context
4. **Rollback** uses React Query's context pattern (snapshot → restore)

### Migration

1. Delete `useEventStore.setAttendanceStatus`
2. Refactor `useAttendance` consumers to use `useUnifiedAttendance`
3. Refactor `useToggleAttendance` consumers to use `useUnifiedAttendance`
4. Delete the old hooks once all consumers are migrated

---

## 3.3 Add Error Monitoring

**Priority**: 🟡 Medium
**Effort**: ~2–3 hours
**Depends on**: None (can be done independently)

### Implementation Steps

#### Step 1: Install Sentry

```bash
npx expo install @sentry/react-native
```

#### Step 2: Configure Sentry

**Create**: `src/config/sentry.ts`

```typescript
import * as Sentry from "@sentry/react-native";
import ENV from "./env";

export const initSentry = () => {
  Sentry.init({
    dsn: ENV.SENTRY_DSN,
    enabled: !__DEV__,
    tracesSampleRate: 0.2,
    attachScreenshot: true,
    environment: __DEV__ ? "development" : "production",
  });
};
```

#### Step 3: Wrap the app with Sentry

**Modify**: `app/_layout.tsx` — wrap the export:

```typescript
import * as Sentry from "@sentry/react-native";
export default Sentry.wrap(RootLayout);
```

#### Step 4: Replace `console.error` with Sentry captures

```bash
grep -rn "console.error" --include="*.ts" --include="*.tsx" src/ app/
```

For each occurrence, add `Sentry.captureException(error)` alongside (or replacing) the `console.error`.

#### Step 5: Add user context

After successful login:
```typescript
Sentry.setUser({ id: user.id, email: user.email, username: user.username });
```

On logout:
```typescript
Sentry.setUser(null);
```

---

## 3.4 Add API Pagination

**Priority**: 🟡 Medium
**Effort**: ~4–6 hours (frontend) + backend changes required
**Depends on**: Phase 2.1 (API types), Phase 2.4 (FlashList)

### Implementation Steps

#### Step 1: Backend — Add cursor-based pagination endpoints

> [!IMPORTANT]
> This requires backend changes in `bangers-backend`. Coordinate with backend work.

All list endpoints should support `?page=1&per_page=20` query params and return the `PaginatedApiResponse` shape defined in Phase 2.1.

#### Step 2: Frontend — Use `useInfiniteQuery`

**Create**: `src/hooks/usePaginatedSearch.ts`

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

export const usePaginatedSearch = (query: string, entities: string[]) => {
  return useInfiniteQuery({
    queryKey: ["search", query, entities],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await searchApi.search(query, {
        params: { page: pageParam, per_page: 20, entities: entities.join(",") },
      });
      return res.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.current_page < lastPage.meta.last_page
        ? lastPage.meta.current_page + 1
        : undefined,
    enabled: query.length > 0,
    initialPageParam: 1,
  });
};
```

#### Step 3: Connect to FlashList

```typescript
<FlashList
  data={allItems}
  onEndReached={() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }}
  onEndReachedThreshold={0.5}
  ListFooterComponent={
    isFetchingNextPage ? <ActivityIndicator /> : null
  }
/>
```

#### Step 4: Apply same pattern to dashboard events

The dashboard hook should use pagination for "suggested events" (potentially the largest list).

---

## 3.5 Extract Shared Components

**Priority**: 🟢 Low
**Effort**: ~3–4 hours
**Depends on**: Phase 2.2 (type fixes)

### Components to Extract

#### 3.5.1 `RoleBadge`

**Create**: `src/components/shared/RoleBadge.tsx`

Extract the duplicated role-checking badge logic from `search.tsx:112-133` and `profile.tsx:100-106`:

```typescript
import React from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react-native";
import { useTheme } from "react-native-paper";

interface RoleBadgeProps {
  roles?: (string | { name: string })[];
  size?: number;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ roles, size = 16 }) => {
  const theme = useTheme();
  if (!roles) return null;

  const hasRole = (name: string) =>
    roles.some((r) => (typeof r === "string" ? r === name : r?.name === name));

  if (hasRole("admin")) {
    return <ShieldAlert size={size} color={theme.colors.error} />;
  }
  if (hasRole("moderator")) {
    return <ShieldCheck size={size} color={theme.colors.primary} />;
  }
  return null;
};
```

**Consumers**: Replace inline badge logic in `search.tsx` and `profile.tsx` with `<RoleBadge roles={user.roles} />`.

#### 3.5.2 `UserCard`

**Create**: `src/components/shared/UserCard.tsx`

Extract the user rendering from `search.tsx` (lines 74–141):

```typescript
interface UserCardProps {
  user: User;
  onPress: (user: User) => void;
}
```

#### 3.5.3 `EmptyState`

**Create**: `src/components/shared/EmptyState.tsx`

A reusable empty-state component for search, profile events, timetable, etc.:

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
}
```

### Verification

- Run `npx tsc --noEmit` — no type errors
- Visually verify the components render identically to the inline versions
- Confirm the extracted components are used in all previous locations

---

## Summary Checklist

| # | Item | Phase | Effort | Depends On |
|---|---|---|---|---|
| 1.1 | Fix hardcoded API URLs | Immediate | ~1h | — |
| 1.2 | Reset QueryClient on logout | Immediate | ~30m | — |
| 1.3 | Show error state on DB init failure | Immediate | ~1h | — |
| 1.4 | Remove dead code | Immediate | ~30m | — |
| 2.1 | Centralize API response unwrapping | Short-term | ~2–3h | 1.1 |
| 2.2 | Replace `any` types | Short-term | ~4–6h | 2.1 |
| 2.3 | Add test infrastructure | Short-term | ~3–4h | — |
| 2.4 | Use FlashList for search results | Short-term | ~2h | — |
| 3.1 | Unify state management strategy | Medium-term | ~8–12h | 2.1, 2.2, 2.3 |
| 3.2 | Consolidate attendance logic | Medium-term | ~6–8h | 3.1 |
| 3.3 | Add error monitoring | Medium-term | ~2–3h | — |
| 3.4 | Add API pagination | Medium-term | ~4–6h | 2.1, 2.4 |
| 3.5 | Extract shared components | Medium-term | ~3–4h | 2.2 |

**Total estimated effort**: ~36–55 hours across all 3 phases.
