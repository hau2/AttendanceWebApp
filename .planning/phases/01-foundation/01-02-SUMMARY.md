---
phase: 01-foundation
plan: 02
subsystem: auth
tags: [nestjs, jwt, passport, supabase, nextjs, typescript, class-validator, multi-tenant]

# Dependency graph
requires:
  - phase: 01-01
    provides: SupabaseService injectable (service-role client), companies and users tables with RLS
provides:
  - POST /auth/register endpoint (creates company + owner user atomically, returns JWT)
  - POST /auth/login endpoint (validates credentials via Supabase, returns JWT)
  - JwtAuthGuard for protecting routes in future plans
  - Frontend Register page at /register
  - Frontend Login page at /login
  - Next.js middleware route protection via access_token cookie
  - saveSession() / clearSession() helpers for JWT cookie + localStorage management
affects:
  - all subsequent phases (onboarding, attendance, admin) — auth gate is entry point for all features

# Tech tracking
tech-stack:
  added:
    - "@nestjs/jwt (backend JWT signing)"
    - "@nestjs/passport + passport + passport-jwt (backend JWT strategy)"
    - "class-validator + class-transformer (DTO validation)"
    - "@types/passport-jwt (TypeScript types)"
  patterns:
    - "AuthModule pattern: JwtModule.register() with JWT_SECRET env var, 7-day expiry"
    - "Atomic registration: company insert → Supabase auth.admin.createUser → public.users insert with rollback on failure"
    - "Session pattern: JWT stored in localStorage + non-httpOnly cookie for middleware access"
    - "Route protection: Next.js middleware checks access_token cookie, redirects to /login with redirectTo param"

key-files:
  created:
    - backend/src/auth/auth.module.ts
    - backend/src/auth/auth.controller.ts
    - backend/src/auth/auth.service.ts
    - backend/src/auth/dto/register.dto.ts
    - backend/src/auth/dto/login.dto.ts
    - backend/src/auth/guards/jwt-auth.guard.ts
    - backend/src/auth/strategies/jwt.strategy.ts
    - frontend/app/(auth)/layout.tsx
    - frontend/app/(auth)/register/page.tsx
    - frontend/app/(auth)/login/page.tsx
    - frontend/src/lib/api/auth.ts
    - frontend/src/middleware.ts
  modified:
    - backend/src/app.module.ts
    - backend/src/main.ts
    - frontend/tsconfig.json

key-decisions:
  - "Session stored as non-httpOnly cookie (access_token) so Next.js Edge middleware can read it — httpOnly would block middleware access"
  - "JwtModule.register() used (not registerAsync) — JWT_SECRET is read from process.env at startup"
  - "Atomic registration uses manual rollback (not DB transactions) — Supabase Admin API and Supabase DB are separate operations"
  - "app/(auth)/ route group in Next.js — provides shared auth layout without affecting URL paths"
  - "tsconfig @/* alias points to ./src/* — matches actual source directory where lib/ lives"

patterns-established:
  - "Auth API pattern: POST body validated via class-validator DTOs with global ValidationPipe"
  - "Error handling: ConflictException for registration conflicts, UnauthorizedException for auth failures"
  - "Frontend auth calls: raw fetch in lib/api/auth.ts (not Supabase client) — backend is source of truth for user creation"

requirements-completed: [ONBD-01, AUTH-01, AUTH-02, AUTH-03]

# Metrics
duration: 3min
completed: 2026-03-01
---

# Phase 1 Plan 02: Authentication Summary

**NestJS JWT auth (register + login) with atomic multi-tenant company creation, Supabase Admin API user provisioning, and Next.js middleware route protection via access_token cookie**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-01T14:57:31Z
- **Completed:** 2026-03-01T15:00:39Z
- **Tasks:** 2 (+ 1 checkpoint awaiting human verification)
- **Files modified:** 13

## Accomplishments
- Created NestJS AuthModule with POST /auth/register (atomic company + user creation) and POST /auth/login endpoints returning JWT with sub, email, company_id, role
- Implemented JwtStrategy (passport-jwt) and JwtAuthGuard for protecting future routes
- Built Next.js Register and Login pages posting to backend API with error display and session saving
- Implemented Next.js middleware checking access_token cookie to guard all routes except /login and /register

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend auth module, register + login endpoints, JWT guard** - `201b9e9` (feat)
2. **Task 2: Frontend auth pages (register, login) and session middleware** - `d518f6b` (feat)

## Files Created/Modified
- `backend/src/auth/auth.module.ts` - AuthModule with JwtModule, PassportModule, AuthService, JwtStrategy
- `backend/src/auth/auth.controller.ts` - POST /auth/register and POST /auth/login controllers
- `backend/src/auth/auth.service.ts` - register() and login() business logic with Supabase integration
- `backend/src/auth/dto/register.dto.ts` - RegisterDto (companyName, fullName, email, password with validation)
- `backend/src/auth/dto/login.dto.ts` - LoginDto (email, password with validation)
- `backend/src/auth/guards/jwt-auth.guard.ts` - JwtAuthGuard extending AuthGuard('jwt')
- `backend/src/auth/strategies/jwt.strategy.ts` - JwtStrategy extracting userId, email, companyId, role from payload
- `backend/src/app.module.ts` - Updated with AuthModule import and global ValidationPipe
- `backend/src/main.ts` - Updated with CORS configuration pointing to FRONTEND_URL
- `frontend/app/(auth)/layout.tsx` - Auth layout with centered container and app branding
- `frontend/app/(auth)/register/page.tsx` - Company registration form with 4 fields
- `frontend/app/(auth)/login/page.tsx` - Login form with onboarding/dashboard redirect logic
- `frontend/src/lib/api/auth.ts` - API helper with registerCompany(), loginUser(), saveSession(), clearSession()
- `frontend/src/middleware.ts` - Route protection checking access_token cookie
- `frontend/tsconfig.json` - Updated @/* path alias to ./src/*

## Decisions Made
- Non-httpOnly cookie for access_token: Next.js Edge middleware cannot read httpOnly cookies, so the cookie must be client-accessible. This is a known trade-off — the JWT is also stored in localStorage for client-side reads.
- Atomic registration uses sequential operations with manual rollback (not a DB transaction) because Supabase Auth Admin API and the Supabase DB are independent systems.
- JwtModule.register() (synchronous) rather than registerAsync — acceptable since process.env is available at module load time in NestJS.
- tsconfig path alias changed from `"./*"` to `"./src/*"` because Next.js scaffolded the project with `app/` at the root but source utilities live under `src/`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict mode catch clause type**
- **Found during:** Task 2 (Register and Login pages)
- **Issue:** Plan used `catch (err: any)` which triggers TypeScript strict mode warnings with `@typescript-eslint/no-explicit-any`
- **Fix:** Changed to `catch (err: unknown)` with `err instanceof Error ? err.message : 'fallback'` pattern
- **Files modified:** frontend/app/(auth)/register/page.tsx, frontend/app/(auth)/login/page.tsx
- **Verification:** Frontend TypeScript build passes
- **Committed in:** d518f6b (Task 2 commit)

**2. [Rule 1 - Bug] Fixed tsconfig @/* path alias**
- **Found during:** Task 2 (setting up frontend files)
- **Issue:** tsconfig had `"@/*": ["./*"]` (maps to frontend root) but all source files are under `src/`. Import `@/lib/api/auth` would resolve to `frontend/lib/api/auth` (non-existent) instead of `frontend/src/lib/api/auth`
- **Fix:** Changed path alias to `"@/*": ["./src/*"]`
- **Files modified:** frontend/tsconfig.json
- **Verification:** Frontend TypeScript build resolves imports correctly
- **Committed in:** d518f6b (Task 2 commit)

**3. [Rule 1 - Bug] Fixed duplicate await in main.ts**
- **Found during:** Task 1 (updating main.ts)
- **Issue:** Plan had double-await pattern: `(await app).enableCors(...)` and `(await app).listen(port)` — these don't correctly use the single awaited NestFactory.create() result
- **Fix:** Used single `const app = await NestFactory.create(AppModule)` with direct calls on `app`
- **Files modified:** backend/src/main.ts
- **Verification:** Backend builds and runs correctly
- **Committed in:** 201b9e9 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bug fixes, 1 blocking path issue)
**Impact on plan:** All fixes required for correct TypeScript compilation and runtime behavior. No scope creep.

## Issues Encountered
- Next.js app directory is at frontend root (`app/`) not `src/app/` — this is the standard Next.js scaffold layout. Auth pages created at `frontend/app/(auth)/` accordingly.

## User Setup Required

**Before testing the auth flow, manual configuration is required:**

1. Copy `backend/.env.example` to `backend/.env` and fill in:
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your Supabase project settings
   - `JWT_SECRET` — use any secure random string (or your Supabase JWT secret)
   - `FRONTEND_URL=http://localhost:3000`

2. Copy `frontend/.env.example` to `frontend/.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL=http://localhost:3001`

3. Ensure the SQL migrations from plan 01-01 are applied to your Supabase project (companies and users tables with RLS).

## Next Phase Readiness
- Auth endpoints ready: POST /auth/register and POST /auth/login return JWT with company_id and role
- JwtAuthGuard available for protecting any future NestJS routes
- Frontend session management in place (cookie + localStorage)
- Route protection middleware active — all non-public routes redirect to /login
- Next phase (01-03 onboarding) can use session data and the JWT guard

## Self-Check: PASSED

Files verified on disk:
- backend/src/auth/auth.module.ts: EXISTS
- backend/src/auth/auth.controller.ts: EXISTS
- backend/src/auth/auth.service.ts: EXISTS
- backend/src/auth/dto/register.dto.ts: EXISTS
- backend/src/auth/dto/login.dto.ts: EXISTS
- backend/src/auth/guards/jwt-auth.guard.ts: EXISTS
- backend/src/auth/strategies/jwt.strategy.ts: EXISTS
- frontend/app/(auth)/layout.tsx: EXISTS
- frontend/app/(auth)/register/page.tsx: EXISTS
- frontend/app/(auth)/login/page.tsx: EXISTS
- frontend/src/lib/api/auth.ts: EXISTS
- frontend/src/middleware.ts: EXISTS

Commits verified: 201b9e9 (Task 1), d518f6b (Task 2) - both in git log.

---
*Phase: 01-foundation*
*Completed: 2026-03-01*
