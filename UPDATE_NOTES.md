# Update notes (this pass)

## ⚠️ Security — rotate your credentials now
`backend/.env` was committed to the repo with a **live MongoDB Atlas password**
and a **live Gmail app password** in plaintext. Anyone with repo access (or
who finds it in your git history) can read and use them.

**Do this immediately:**
1. MongoDB Atlas → Database Access → rotate/delete the `Outpass_system_Cloud` user's password.
2. Google Account → Security → App Passwords → revoke the leaked app password, generate a new one.
3. Rotate `SECRET_KEY` too (it signs your JWTs) — generate a fresh random 64-char hex string.

I removed `backend/.env` from this delivered copy and replaced it with
`backend/.env.example` (placeholders only). Copy it to `.env` and fill in
your **new** rotated credentials. Also added a root `.gitignore` so `.env`
never gets committed again — if you're pushing this to GitHub, first run
`git rm --cached backend/.env` and consider scrubbing it from git history
(e.g. with `git filter-repo` or BFG), since old commits still contain it.

## Backend fixes
- Removed all Pydantic v2 deprecation warnings:
  - `Field(..., example=...)` → `Field(..., json_schema_extra={"example": ...})` across
    `models/audit.py`, `models/hostel.py`, `models/user.py`, `routes/admin.py`.
  - Class-based `class Config:` → `model_config = ConfigDict(...)` in
    `models/audit.py`, `models/hostel.py`, `models/outpass.py`, `models/user.py`.
  - `pydantic_settings` class-based `Config` → `SettingsConfigDict` in `core/config.py`.
- Replaced deprecated `@app.on_event("startup"/"shutdown")` in `main.py` with a
  modern `lifespan` context manager (FastAPI's recommended pattern) — same
  startup/shutdown behavior (Mongo connect/close, scheduler start/stop), no
  deprecation warning.
- Full test collection and app import now run with **zero warnings**. The one
  remaining test failure (`test_full_system_flow`) is a live network call to
  your MongoDB Atlas cluster, which this sandbox can't reach — it should pass
  fine in an environment with real network/DB access.

## Frontend fixes
- Cleared every `oxlint` warning in the actual project source (`src/`):
  removed unused icon imports, an unused `catch` binding (now logged instead
  of silently dropped), a dead `getValidityStatus` helper, and an unused/
  unwired 3D card-tilt effect.
- `npm run build` and `npx oxlint src` both now report **0 warnings, 0 errors**.

## New feature: personalized welcome greeting
The user's name was already being saved to `localStorage` on login but was
never shown anywhere. Wired it through as a `userName` prop from `App.jsx`
into all four dashboards (`StudentDashboard`, `ApproverDashboard`,
`SecurityDashboard`, `AdminDashboard`) and added a "Welcome, `<name>`" label
next to the logout button in each header.

## Not changed
Business logic, approval workflow, RBAC, QR generation, and API
routes/contracts are untouched — this pass was fixes + the one feature above.

---

# Update notes (follow-up pass)

## New: hostel details on warden accounts
The backend `hostel_details` field (`hostel_name`, `room`, `occupancy_status`)
was already generic on the `User` model and accepted for any role — but the
admin UI only exposed it for students, and the "edit user" form didn't expose
it for anyone at all.

- **Create User** form (`AdminDashboard.jsx`): selecting role "Warden" now
  shows a "Hostel Assigned" field, submitted as `hostel_details` alongside the
  account. Room number stays student-only (wardens aren't tied to a specific
  room); the record is saved with `occupancy_status: "Staff"` for wardens vs
  `"Resident"` for students.
- **Edit User** form: previously had no hostel fields for any role, including
  students. Added "Hostel Name"/"Room Number" (students) and "Hostel Assigned"
  (wardens), pre-filled from the user's existing `hostel_details` when
  present, and included in the update payload on save.
- No backend changes were needed — `UserCreate`/`UserUpdate` already accepted
  `hostel_details` for any role.

