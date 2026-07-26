# 🛡️ SQA Changes Needed — Mobile

The following changes are required in the `bangers-mobile` project to align with security improvements in the backend.

## Phase 1 — Critical Security & Stability

### 1.1 Strengthen Password Validation
The backend now requires stricter password validation for registration. 
**Changes needed:**
- Update registration forms to require:
    - Minimum 8 characters
    - At least one uppercase and one lowercase letter
    - At least one number
- Update UI error messaging to reflect these requirements.

### 1.2 Rate Limiting Handling
The backend now implements rate limiting (5 attempts per minute) on login and registration endpoints.
**Changes needed:**
- Ensure the app gracefully handles `429 Too Many Requests` responses.
- Display a user-friendly message when the rate limit is exceeded (e.g., "Too many attempts. Please try again in a minute.").

### 1.3 Pagination Caps
The backend now enforces a maximum of 100 items per page for all paginated endpoints.
**Changes needed:**
- Ensure any requests using `per_page` do not exceed 100.
- If the app was relying on `per_page=-1` to get all results, it must be updated to handle pagination properly.

## Phase 2 — Architecture & Maintainability

### 2.1 User PII Protection
The backend `UserResource` now hides `email`, `dob`, `first_name`, and `last_name` fields unless the authenticated user is viewing their own profile or is an administrator.
**Changes needed:**
- Update profile and friend list screens to handle the absence of these fields for other users (they will now be returned as `null` or missing).
- Verify that only the user's own profile shows these sensitive fields.

### 2.2 Route Parameter Changes (Model Binding) & Policy Refinement
Several routes have been updated to use standard model identifiers instead of generic IDs, and authorization policies have been tightened.
**Changes needed:**
- **Friendships**: Update API calls to use `{user}` (UUID) instead of `{userId}` for all friendship actions (Store, Accept, Reject, Block, Destroy).
- **Groups**: 
    - Update `removeMember` to use the target's `{user}` UUID instead of `{user_id}`.
    - **Authorization**: Only the group owner can remove other members. Any member can leave the group (self-removal).
- **Group Timetables**: 
    - Ensure all timetable-related calls match the new `{group}/timetables/{timetable}/...` structure.
    - **Data Integrity**: The `updateEntries` endpoint now validates that all `entry_ids` belong to the same event as the timetable. Any mismatch will result in a `400 Bad Request`.
- **Attendance**:
    - `PUT /events/{eventId}/attendance` now strictly validates `status` to be one of: `going`, `interested`.
    - **User Stats**: The `UserResource` now includes a `stats` object with `upcoming_count` and `past_count`. Use these for dashboard display instead of calculating them client-side.
- **Friendships**:
    - The `UserResource` now optionally includes `friend_requests` (via `pendingFriendRequests` relation). Verify if the app needs to explicitly request this or if it's used in specific profile/friend views.

## Phase 3 — 🟢 Technical Refinements & Testing alignment

### 3.1 Registration Requirements
- **DOB Required**: The registration endpoint now strictly requires a `dob` (Date of Birth) in `YYYY-MM-DD` format.
- **Status Code**: A successful registration now returns `201 Created` instead of `200 OK`. Update any status checks in the registration flow.

### 3.2 Act & Stage Linking
- **Event ID Required**: Attaching an act to a stage (or vice versa) now requires an `event_id`.
 - **Pivot Table**: The underlying database structure has moved from `stage_acts` to `event_stage_acts` to support multiday events and stage reusability. Ensure any custom queries or deep-linked data expectations are updated.

## Phase 4 — 🔵 Extensibility & Performance Optimization

### 4.1 API Versioning (`/v1`)
The API has been versioned to support future changes without breaking existing clients.
**Changes needed:**
- Update all base URIs to include the version prefix:
    - Change `/api/auth/...` to `/api/v1/auth/...`
    - Change `/api/mobile/...` to `/api/mobile/v1/...`
- Ensure all deep links and hardcoded strings are updated.

### 4.2 Proper Refresh Tokens (Rotation)
A more secure token management system is now in place.
**Changes needed:**
- **Refresh Flow**: When the access token expires (`401 Unauthorized`), use the `POST /api/mobile/v1/auth/refresh` endpoint with the current refresh token to obtain a new pair.
- **Rotation**: Tokens are now rotatable; each refresh invalidates the previous token.
- **Expiry**: Access tokens now have a shorter lifespan.

### 4.3 Dashboard Caching
The mobile dashboard is now cached to improve performance.
**Changes needed:**
- The mobile dashboard response may be cached. Use `X-Refresh: true` header to force bypass if needed (standard Laravel cache pattern).
- Backend listeners handle automatic invalidation on key events (event updates, attendance changes).

### 4.4 Optimized Membership Checks & Custom Exceptions
The backend now uses optimized database queries for group membership.
**Changes needed:**
- **GroupMembershipException**: Unauthorized group actions now return a `403 Forbidden` with a specific JSON structure. Ensure the app handles this exception gracefully.
