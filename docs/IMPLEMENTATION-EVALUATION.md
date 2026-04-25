# MMLA EMR – Implementation Evaluation & Minimal Guidance

## Current state evaluation

### What’s already in place

| Area | Status | Notes |
|------|--------|--------|
| **Auth** | ✅ Working | NextAuth with Credentials + JWT; login at `/login`; session has `role`, `isAdmin`, `id` |
| **DB** | ✅ Good | Drizzle + PostgreSQL; `users`, `sessions`, `patients`, `appointments`, `medical_records`, `prescriptions` |
| **Role in session** | ✅ Done | JWT/session callbacks pass `role` and `isAdmin` from DB into session |
| **Route protection** | ✅ Partial | `withAuth` middleware protects `/dashboard`, `/patients`, `/appointments`, `/admin`; redirects unauthenticated to login |
| **Admin protection** | ⚠️ Mismatch | Middleware checks `role === "admin" \|\| "super_admin"` and `rn`/`pt`; schema has `admin \| doctor \| nurse \| staff` |
| **Audit table** | ✅ Created | `audit_log` exists (created via `scripts/001-create-audit-log.sql`) |
| **Audit helper** | ✅ Exists | `src/lib/audit.ts` has `logAudit()` with raw SQL insert |
| **Audit usage** | ❌ Not wired | No API or Server Action calls `logAudit()` yet |

### Gaps for the minimal solution

1. **Role alignment** – Middleware uses `super_admin`, `rn`, `pt`; schema and auth use `admin`, `doctor`, `nurse`, `staff`. Admin routes should use the same roles as the DB (and optionally `isAdmin`).
2. **Audit not used** – Patient create/update/delete (and optionally sensitive reads) should call `logAudit()` so the table is actually used.
3. **Audit robustness** – `logAudit` should handle `undefined`/null (e.g. `details`, `userId`, `ip`) so it never writes invalid SQL or `"undefined"` JSON.
4. **Schema vs DB** – `audit_log` is only in SQL; adding it to Drizzle schema keeps types and migrations in one place (optional but recommended).

---

## Minimal implementation checklist

### 1. Keep NextAuth (no change)

- Credentials provider + JWT is enough.
- Session already has `role` and `isAdmin`; use these for checks.

### 2. Role-based access

- **Single source of roles:** Use the same set everywhere: `admin | doctor | nurse | staff` (as in `schema.ts`).
- **Admin area:** Restrict `/admin/*` to users with `role === "admin"` or `isAdmin === true` (so one “admin” role or flag is enough).
- **Patient list/chart/edit:** Allow `admin`, `doctor`, `nurse`, `staff` as needed; no need for `rn`/`pt` unless you add those roles to the DB later.
- **API:** Continue using `getServerSession(authOptions)` and check `session.user.role` or `session.user.isAdmin` per route (e.g. admin-only for user management, broader for patients).

### 3. Protect admin routes

- In **middleware:**  
  - If path starts with `/admin`, allow only when `token.role === "admin"` or `token.isAdmin === true`.  
  - Redirect others to `/dashboard` (or 403).
- No need for a full RBAC matrix yet; a simple role + `isAdmin` check is enough.

### 4. Audit logging

- **What to log:** At minimum: patient create (POST), update (PUT), delete/deactivate (DELETE). Optionally: sensitive reads (e.g. GET patient by id) for HIPAA.
- **Where:** Call `logAudit()` from the same API route (or Server Action) that performs the mutation (and optionally the read).
- **Payload:** `userId` from session, `action` (e.g. `"patient.create"`), `table_name` (`"patients"`), `record_id`, `details` (e.g. changed fields or minimal context), and request `ip` / `user_agent` if available.
- **Non-blocking:** Keep `logAudit` in a try/catch and do not fail the request if logging fails (you already do this).

### 5. Optional but recommended

- Add `audit_log` to Drizzle schema and use `db.insert(auditLog).values(...)` in `logAudit` so types and nulls are handled correctly.
- Add a small `requireAdmin()` or `requireRole(roles)` helper that uses `getServerSession` and returns 401/403 so API routes stay DRY.

---

## Suggested next steps (in order)

1. **Align middleware with schema**  
   - Use only `admin`, `doctor`, `nurse`, `staff` in middleware.  
   - For `/admin`, require `token.role === "admin"` or `token.isAdmin === true`.

2. **Harden and optionally move audit to Drizzle**  
   - Add `audit_log` to `src/db/schema.ts` (to match the existing table).  
   - In `logAudit`, handle null/undefined for `userId`, `details`, `ip`, `user_agent` (e.g. pass `null` to DB, don’t `JSON.stringify(undefined)`).

3. **Wire audit into patients API**  
   - In `POST /api/patients`: after successful insert, call `logAudit({ userId, action: "patient.create", tableName: "patients", recordId: newPatient.id, details: { patientId: newPatient.patientId }, ip, userAgent })`.  
   - In `PUT /api/patients/[id]`: after successful update, call `logAudit(..., action: "patient.update", recordId, details: { updated: ... })`.  
   - In `DELETE /api/patients/[id]` (deactivate): call `logAudit(..., action: "patient.deactivate", recordId, details: { reason: "soft delete" })`.  
   - Get `ip` and `user_agent` from request headers when available.

4. **Later (when you need stricter RBAC)**  
   - Add a `permissions` table and checks only if you outgrow simple role + `isAdmin`.  
   - Add “OWN” scope (e.g. only assigned patients) by joining with assignments and filtering by `session.user.id`.

---

## Architecture vs current implementation

| Design doc | Current | Recommendation |
|------------|--------|----------------|
| Custom RBAC with session tokens | NextAuth JWT + role + isAdmin | Keep NextAuth; use role + isAdmin for now. |
| roles / permissions tables | Single `role` + `isAdmin` on users | Keep single role; add permissions table only when needed. |
| audit_log (middleware + table) | Table + `logAudit()` unused | Use table + `logAudit()` in API routes (and optional middleware for route access). |
| Server Actions for mutations | API routes (e.g. `/api/patients`) | Either is fine; use Server Actions when you want no client-side fetch. |
| RLS in DB | Not implemented | Add later for defense-in-depth. |

---

## Summary

- **Auth:** Keep NextAuth; session already has role and isAdmin.  
- **Roles:** Use one set of roles everywhere (`admin`, `doctor`, `nurse`, `staff`) and align middleware with schema.  
- **Admin routes:** Protect with a simple check in middleware (admin role or isAdmin).  
- **Audit:** Harden `logAudit`, add `audit_log` to Drizzle, and call `logAudit` from patient create/update/delete (and optionally sensitive GET).  

That gives you a minimal, working foundation you can extend later (e.g. permissions table, RLS, “OWN” scope) without rewriting auth.

---

## Applied changes (minimal implementation)

- **Middleware** (`src/middleware.ts`): Admin routes require `role === "admin"` or `isAdmin === true`. Patient edit allows `admin`, `doctor`, `nurse`, `staff` (and `isAdmin`).
- **Schema** (`src/db/schema.ts`): `auditLog` table added to Drizzle so the app has a single source of truth (matches `scripts/001-create-audit-log.sql`). If your DB uses `ip_address INET`, Drizzle inserts a string and PostgreSQL accepts it; if you see type errors, alter the column to `TEXT` or use a custom Drizzle type.
- **Audit helper** (`src/lib/audit.ts`): Uses Drizzle insert; handles `null`/`undefined` for all optional fields; no raw SQL.
- **Patients API**: `logAudit()` called on POST (create), PUT (update), and DELETE (deactivate), with `userId`, `action`, `table_name`, `record_id`, `details`, and request `ip` / `user-agent`.
