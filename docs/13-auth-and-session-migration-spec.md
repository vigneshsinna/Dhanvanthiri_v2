# 13 — Auth and Session Migration Spec

## Objective
Move customer authentication in the old frontend to the new headless backend safely and consistently.

## Goals
- keep login and registration UX stable
- move identity source of truth to the new backend
- standardize token/session handling
- support protected pages and checkout gating

## Authentication decisions to confirm
- bearer token only, or access token + refresh token
- storage strategy: memory + secure cookie preferred over localStorage where possible
- token refresh timing
- logout semantics
- guest-to-authenticated cart merge behavior

## Required flows
### Public
- login
- registration
- forgot password
- reset password
- email verification if applicable

### Protected
- get current user
- profile read/update
- change password
- logout
- account dashboard access
- checkout eligibility

## Session lifecycle
1. User logs in
2. Frontend stores access token using approved storage pattern
3. Current user profile is fetched immediately
4. Route guards and API client use authenticated state
5. Expired sessions trigger refresh or forced logout
6. Logout clears client state and invalidates session where supported

## Adapter responsibilities
- map old login payload to new backend payload
- normalize auth success response
- normalize validation and credential errors
- expose one `getCurrentUser()` function to all consumers
- centralize logout cleanup

## Guest cart merge rule
Decide one rule and implement it everywhere:
- backend merge on login, or
- frontend requests merge endpoint after login, or
- authenticated cart replaces guest cart

Recommended: backend merge on login with explicit response indicating merge outcome.

## Route protection model
- public routes: no auth required
- soft-auth routes: allow guest but enhance for logged-in user
- protected routes: redirect to login when not authenticated
- checkout routes: require valid authenticated state unless guest checkout is intentionally supported

## Error cases
- invalid credentials
- unverified account
- locked/disabled user
- expired session
- malformed token
- duplicate email/mobile during registration

## Test cases
- login success
- login failure
- page refresh with active session
- expired token handling
- logout cleanup
- profile fetch failure
- address page without auth
- checkout redirect when not authenticated

## Acceptance criteria
- login/logout/current-user flows use only the new backend
- protected pages rely on centralized auth state
- token expiration does not leave the app in a broken state
- guest cart merge behavior is documented and tested
