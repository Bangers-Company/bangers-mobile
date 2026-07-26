# Bangers Mobile App

Mobile social platform for discovering events, managing attendance, building personal timetables, and collaborating in planning groups.

Built directly against the **Bangers Mobile API (`/api/mobile/*`)** with a strict **Delta Sync + offline-first architecture** and a highly animated, gesture-driven UX.

---

# Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Server State**: TanStack React Query
- **Client State**: Zustand
- **Networking**: Axios
- **Offline Storage**: expo-sqlite
- **Realtime Ready**: WebSocket-compatible (future shared timetable broadcast)
- **Connectivity Detection**: @react-native-community/netinfo
- **Secure Token Storage**: expo-secure-store
- **Lists**: FlashList
- **Animations**: react-native-reanimated
- **UI**: NativeWind + React Native Paper
- **Icons**: Lucide (lucide-react-native) or Expo Vector Icons (Feather)

---

# Commands

```bash
npm install
npm run start
npm run android
npm run ios
npm run lint
eas build
eas submit
```

---

# API Integration Context

All mobile requests target:

```
/api/mobile/*
```

Required headers:

```
Authorization: Bearer <access_token>
Accept: application/json
```

Authentication endpoints:

```
POST /api/mobile/auth/register
POST /api/mobile/auth/login
POST /api/mobile/auth/refresh
POST /api/mobile/auth/logout
```

Access tokens are stored using `expo-secure-store`.

---

# Project Structure

```
bangers-app/
  app/                            # Expo Router entry (file-based navigation)
    (auth)/                       # Register, login flows
    (tabs)/                       # Bottom tab navigation
      home/                       # Dashboard
      search/                     # Search
      profile/                    # Profile
    event/[id].tsx                # Event details
    group/[id].tsx                # Group details & shared timetable

  src/
    api/                          # API client and endpoint modules
      client.ts                   # Axios wrapper (auth header, errors)
      auth.ts                     # Auth endpoints
      dashboard.ts                # GET /dashboard
      search.ts                   # GET /search
      sync.ts                     # /sync/events, /sync/artists, /sync/acts
      friends.ts                  # Friends endpoints
      events.ts                   # Attendance endpoints
      timetables.ts               # Personal timetable endpoints
      groups.ts                   # Group endpoints
      favorites.ts                # Favorites endpoints

    features/                     # Business logic grouped by domain
      auth/                       # Login, refresh, logout logic
      dashboard/                  # Dashboard data aggregation
      sync/                       # Delta sync orchestration
      events/                     # Attendance management
      timetables/                 # Personal schedule management
      groups/                     # Shared planning groups
      friends/                    # Friend management
      favorites/                  # Act bookmarking

    components/                   # Reusable UI components
      ui/                         # Base UI (Button, Card, Badge, Avatar)
      navigation/                 # BottomNav, TopBar, Popover
      event/                      # Event cards & lineup components
      timetable/                  # Timetable visual components
      profile/                    # Profile header & lists
      shared/                     # Generic shared components

    database/                     # SQLite offline layer
      sqlite.ts                   # DB initialization
      migrations.ts               # Table migrations
      repositories/
        events.repository.ts
        artists.repository.ts
        acts.repository.ts
        timetables.repository.ts
        favorites.repository.ts

    sync/                         # Delta Sync engine
      deltaSync.ts                # Sync runner
      syncHelpers.ts              # Timestamp handling
      conflictResolver.ts         # Conflict logic

    store/                        # Zustand stores
      useAuthStore.ts
      useSyncStore.ts
      useUIStore.ts

    hooks/
      useOffline.ts
      useDeltaSync.ts
      useAttendance.ts

    types/
      event.ts
      artist.ts
      act.ts
      timetable.ts
      group.ts

    utils/
      date.ts
      constants.ts
      format.ts

  assets/
  app.config.ts
  eas.json
```

---

# Navigation & UX Architecture

---

# Bottom Navigation

## Tabs

- **Home**
- **Search**
- **Profile**

Icons (Free Assets):

- `home`
- `search`
- `user`

Using:

- lucide-react-native  
  or
- Expo Vector Icons (Feather)

---

## Floating Behavior

Default:

- Anchored bottom
- Rounded container
- Blur background
- Soft shadow

When scrolling down:

- Smooth translateY upward
- Slight scale (0.96)
- Increased elevation
- Floating visual effect

Implementation:

- Reanimated `useAnimatedScrollHandler`
- Interpolated transform + shadow

---

## Selected Tab Expansion

When selected:

- Icon scales to 1.15
- Label fades in
- Background pill expands smoothly

Example:

Selected:

```
[ 🏠 Home ]   🔍   👤
```

Unselected:

```
🏠   🔍   👤
```

---

# Global Top Bar

## Dashboard

Left:

```
bangers
```

Right:

- Circular profile picture

Clicking profile picture opens animated popover:

Options:

- Profile
- Edit Profile
- Attending Events
- Past Events
- Settings
- Logout

Animation:

- Scale + fade
- Reanimated or react-native-paper Menu

---

## Other Pages

Left:

- Back button (Chevron left icon)

Right:

- Profile picture remains

---

# Dashboard Page

Source:

```
GET /api/mobile/dashboard
```

Layout order:

1. My Events (Horizontal Carousel)
2. Animated Droplet (Scroll-to-top)
3. Suggested Events (Vertical List)

---

## My Events — Horizontal Carousel

- FlashList horizontal
- Snap-to-card
- Parallax banner
- Focus scale interpolation

Each card:

- Banner
- Name
- Location
- Date
- "Going" state

---

## Animated Droplet

- Floating animation loop
- Visible when scrolling
- On press → smooth scroll to top

Implementation:

- `scrollTo` with ref
- Reanimated `withTiming`

Icon suggestion:

- `droplet`

---

## Suggested Events

Source:

```
GET /api/mobile/events/suggested
```

- Vertical FlashList
- Pull-to-refresh triggers delta sync
- Compact card style

---

# Search Page

Source:

```
GET /api/mobile/search?query=
```

Features:

- Debounced input (300ms)
- Vertical result list
- Event + Artist cards
- Skeleton loading
- Empty state illustration

---

# Profile Page

Layout:

Top section:

- Large circular profile picture
- Full name (bold)
- Username (small muted text)
- Friends counter
- Edit Profile button (if own profile)

Below:

1. Attending Events (Vertical list)
2. Past Events (Vertical list)

Data sources:

- Attendance via `/events/{id}/attendance`
- Friends via `/friends`

---

# Event Page

Tabs (swipe-enabled):

- Overview
- Lineup
- Timetable
- Friends

Implementation:

- react-native-tab-view
  or
- Reanimated pager

---

## Timetable Page (Special Rule)

Swipe left/right should NOT change tab.

Reason:
Timetable uses horizontal stage scrolling.

Solution:

- Disable tab swipe when Timetable tab active
- Let horizontal gestures control stage scroll

---

# Delta Sync Architecture

Core endpoints:

```
GET /api/mobile/sync/events?since=
GET /api/mobile/sync/artists?since=
GET /api/mobile/sync/acts?since=
```

---

## Sync Lifecycle

### Initial Launch

- Full sync (no `since`)
- Store highest `updated_at`

### Background Triggers

- App foreground
- Pull-to-refresh
- Attendance change
- Timetable update

---

## Data Handling

If:

```
deleted_at != null
```

→ Remove locally

Else:
→ Upsert record

---

## Timestamp Integrity

- Always use last successful sync timestamp
- Never use device time
- Store per-entity sync timestamps

---

# Offline Strategy

Only hydrate:

- Attending events
- Related artists
- Related acts
- Personal timetables
- Favorites

Local tables:

- events
- artists
- acts
- personal_timetables
- personal_timetable_entries
- favorites
- groups
- pending_mutations

---

# Optimistic Updates

All mutations:

1. Update UI instantly
2. Store pending mutation
3. Send API request
4. On success → confirm
5. On failure → rollback

---

# Performance Strategy

- FlashList everywhere
- Memoized cards
- Lazy image caching
- Batched sync calls
- Sync mutex lock
- Avoid unnecessary re-renders

---

# Security Requirements

- Always send `Accept: application/json`
- Always send `Authorization: Bearer`
- Validate UUIDs client-side
- Refresh tokens before expiry
- Clear SecureStore on logout

---

# Development Conventions

- Feature-first architecture
- All API calls in `src/api`
- Repository pattern for SQLite
- No business logic inside UI components
- React Query for all server state
- Delta Sync isolated in `src/sync`
- Optimistic UI everywhere

---

# Product Vision

Bangers Mobile is:

- Gesture-driven
- Offline-first
- Bandwidth efficient
- Built for real-world festivals
- Smooth, animated, premium feeling
- Strictly aligned with `/api/mobile/*`

---

If you'd like next:

- Full SQLite schema (SQL)
- Delta Sync implementation example
- Component architecture breakdown
- Animation timing system
- Production deployment architecture

Tell me which layer we refine next.

## USEFULL LINKS

[https://docs.expo.dev/llms-full.txt](https://docs.expo.dev/llms-full.txt)https://docs.expo.dev/llms-full.txt
