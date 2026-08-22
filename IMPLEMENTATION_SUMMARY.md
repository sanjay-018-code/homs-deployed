# HOMS (Hostel Outpass Management System) - Implementation Summary

## ✅ System Status: FULLY RUNNING

### Live URLs
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **API Docs (ReDoc):** http://localhost:8000/redoc

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)                     │
│              http://localhost:5173                           │
│  ┌─────────┬──────────┬──────────┬──────────┬────────────┐  │
│  │ Student │ Approver │ Security │  Admin   │   Login    │  │
│  │ Portal  │ (A/H/W)  │  Gate    │Dashboard │            │  │
│  └─────────┴──────────┴──────────┴──────────┴────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ JWT Token
┌─────────────────────────────────────────────────────────────┐
│         FastAPI Backend (Python + Async)                     │
│         http://localhost:8000                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Routes: /auth, /outpass, /admin, /users, /audit-logs   ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Database Layer: MongoDB (Cloud) via Motor (Async)      ││
│  │ Collections: users, outpasses, audit_logs             ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Background Services: APScheduler (daily reports, etc) ││
│  │ Email Notifications: SMTP (Gmail)                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## Approved Hierarchy & Approval Workflow

### User Roles (5-Level Hierarchy)

```
                    STUDENT (initiates request)
                           ↓
                    ADVISOR (reviews & approves)
                    [Same Department Only]
                           ↓
                       HOD (reviews & approves)
                    [Same Department Only]
                           ↓
                     WARDEN (final approval)
                    [Generates QR Token]
                           ↓
              SECURITY (scans QR & marks entry/exit)
```

### Admin Roles (2 Levels)

```
SUPER ADMIN
├─ Full access to all users and records
├─ Can create/edit/delete any user
├─ Can manage all departments
├─ Can view and rollback audit logs
└─ Can configure SMTP settings

DEPARTMENT ADMIN
├─ Restricted to own department only
├─ Can only manage: Students, Advisors, HODs
├─ Cannot promote users to restricted roles
├─ Can view all records (read-only)
└─ Cannot perform rollbacks or edit outpasses
```

---

## Departments (9 Total)

All students and department-scoped staff are assigned one of these departments:

1. **AI&ML** - Artificial Intelligence & Machine Learning
2. **AI&DS** - Artificial Intelligence & Data Science
3. **CSE** - Computer Science & Engineering
4. **ECE** - Electronics & Communication Engineering
5. **IT** - Information Technology
6. **CS** - Computer Science
7. **EEE** - Electrical & Electronics Engineering
8. **CIVIL** - Civil Engineering
9. **MECH** - Mechanical Engineering

---

## Test Credentials (Default Password: `Niresh_007`)

### Admin Users
| Email | Role | Department | Access |
|-------|------|------------|--------|
| `niresh@admin.com` | Super Admin | - | Full system access |
| `cse-admin@college.edu` | Department Admin | CSE | CSE users only |

### Approval Chain (CSE Department)
| Email | Role | Department | Function |
|-------|------|------------|----------|
| `niresh@student.com` | Student | CSE | Submit outpass requests |
| `advisor@faculty.com` | Advisor | CSE | First approval level |
| `hod@department.com` | HOD | CSE | Second approval level |
| `warden@hostel.com` | Warden | - | Final approval, generate QR |
| `security@gate.com` | Security | - | Scan QR, mark entry/exit |

---

## Approval Workflow (Step-by-Step)

### 1. Student Submits Request
```
POST /api/outpass/apply
{
  "destination": "Home",
  "reason": "Family Visit",
  "out_date": "2026-08-20T09:00:00Z",
  "in_date": "2026-08-21T18:00:00Z"
}
Status → "Pending"
History: [Student submitted request]
```

### 2. Advisor Reviews (Same Department)
```
POST /api/outpass/{id}/approve
{
  "comments": "Looks good. Approved."
}
Status → "Advisor Approved"
Checks: Advisor must be in student's department
History: [Advisor Name approved on YYYY-MM-DD HH:MM:SS]
Notification: HOD receives email
```

### 3. HOD Reviews (Same Department)
```
POST /api/outpass/{id}/approve
{
  "comments": "Approved by HOD"
}
Status → "HOD Approved"
Checks: HOD must be in student's department
History: [HOD Name approved on YYYY-MM-DD HH:MM:SS]
Notification: Warden receives email
```

### 4. Warden Final Approval (No Department Restriction)
```
POST /api/outpass/{id}/approve
{
  "comments": "Final approval granted"
}
Status → "Approved"
QR Token Generated: OUT-XXXXXXXXXX (unique)
History: [Warden Name approved on YYYY-MM-DD HH:MM:SS]
Notification: Student receives QR code
```

### 5. Security Gate Operations
```
POST /api/outpass/mark-gate
{
  "qr_token": "OUT-XXXXXXXXXX",
  "type": "EXIT"  // or "ENTRY"
}
Status → "Student Left" (EXIT) or "Student Returned" (ENTRY)
exit_time/entry_time: Recorded automatically
```

### Rejection at Any Level
```
POST /api/outpass/{id}/reject
{
  "rejection_reason": "Documents incomplete"
}
Status → "Rejected"
History: [Advisor Name rejected on YYYY-MM-DD HH:MM:SS]
Notification: Student receives rejection email with reason
```

---

## Admin Dashboard Features

### Super Admin Capabilities
✅ **Users Tab**
- Create users with any role (student, advisor, hod, warden, security, department_admin, super_admin)
- Edit any user's details
- Delete any user
- Search and filter users
- Assign departments freely
- Promote/demote users

✅ **Outpasses Tab**
- View all outpass requests (no filtering)
- Edit outpass details (destination, dates, status)
- Delete outpass records
- View complete approval history
- Download reports

✅ **Gate Logs Tab**
- View all security gate check-in/check-out activities
- Filter by date, student, or status
- Download daily reports in Excel format

✅ **Audit Logs Tab**
- View all changes: user creation, updates, deletions
- Track who changed what and when
- Rollback changes to previous state
- Full immutable audit trail

### Department Admin Capabilities
✅ **Users Tab (Department-Scoped)**
- Create students, advisors, HODs in own department only
- Edit users (cannot change department)
- Cannot delete users
- Cannot promote to restricted roles
- Search users in department

✅ **Outpasses Tab (View-Only)**
- View all outpass requests (department-wide)
- Cannot edit or delete requests
- View full approval history
- Download reports

✅ **Gate Logs Tab (View-Only)**
- View gate logs for department students
- Filter by status or date
- Download reports

✅ **Audit Logs Tab (View-Only)**
- View audit trail for department actions
- Cannot perform rollbacks
- Read-only access

---

## Department-Wise Flow Implementation

### Key Features
1. **Student Registration**: Must assign to one of 9 departments
2. **Advisor Assignment**: Advisor must be in same department as students they advise
3. **HOD Assignment**: HOD must be in same department
4. **Request Routing**: Student request automatically routes to department's advisor
5. **Access Control**: Advisor/HOD can only see/approve their department's requests
6. **Department Admin**: Can only manage users and view records for assigned department
7. **Database Query Enforcement**: RBAC rules enforced at database level (not just API)

### Example: CSE Student Request
```
Student (CSE) submits request
    ↓
System finds Advisor (department=CSE)
    ↓
Advisor (CSE) approves or rejects
    ↓
If approved → HOD (department=CSE) notified
    ↓
HOD (CSE) approves or rejects
    ↓
If approved → Warden (no dept restriction) notified
    ↓
Warden approves → QR generated
    ↓
Security scans QR → marks gate activity
```

---

## Verification Tests Passed

✅ **Full System Integration Test** - `test_full_system_flow`
- Created users for all roles
- Generated authentication tokens
- Submitted outpass request as student
- Verified approval workflow (advisor → hod → warden → security)
- Tested rejection handling
- Verified department-level access control
- Tested admin create/update/delete operations
- Validated audit logging

### Test Result
```
tests/test_api.py::test_full_system_flow PASSED [100%]
```

---

## Email Notifications (Background Tasks)

Emails are sent to approvers at each stage (async, non-blocking):

1. **Student Submission** → Advisor notified
2. **Advisor Approval** → HOD notified
3. **HOD Approval** → Warden notified
4. **Warden Approval** → Student receives QR code
5. **Rejection** → Student receives rejection reason
6. **Gate Movement** → Logs recorded (no email)

### SMTP Configuration
- **Server**: smtp.gmail.com (port 587)
- **User**: homs.system@gmail.com
- **Auth**: App-specific password (secured)
- **From Email**: homs.system@gmail.com

---

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user profile

### Outpass Management
- `POST /api/outpass/apply` - Submit new outpass (student)
- `GET /api/outpass/my-requests` - View own requests
- `GET /api/outpass/pending` - View pending at current level
- `POST /api/outpass/{id}/approve` - Approve request
- `POST /api/outpass/{id}/reject` - Reject request
- `POST /api/outpass/mark-gate` - Security marks entry/exit

### Admin Users Management
- `POST /api/admin/users` - Create user (super admin or dept admin)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/{id}` - Get user details
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/users/{id}/outpasses` - User's outpass history

### Admin Outpass Management
- `GET /api/admin/outpasses` - View all outpasses
- `PUT /api/admin/outpasses/{id}` - Edit outpass (super admin only)
- `DELETE /api/admin/outpasses/{id}` - Delete outpass (super admin only)

### Audit & Reports
- `GET /api/admin/audit-logs` - View audit trail
- `POST /api/admin/rollback/{audit_log_id}` - Rollback change (super admin only)
- `GET /api/reports/daily-excel` - Download daily report

---

## Security Features

✅ **Authentication**
- JWT tokens with 24-hour expiration
- Bcrypt password hashing
- Email validation
- Token verification on every request

✅ **Authorization**
- Role-based access control (RBAC)
- Department-scoped access for advisors/hods
- Role hierarchy enforcement
- Super admin vs department admin separation

✅ **Data Integrity**
- Unique email and roll number constraints
- MongoDB indexes on critical fields
- Atomic transactions for approval workflow
- Immutable audit log (cannot edit history)

✅ **Audit Trail**
- Every user action logged
- Track: actor, action type, affected user/record, changes, timestamp
- Rollback capability for accidental changes

---

## How to Test the System

### 1. Login with Different Roles
Visit http://localhost:5173 and use these credentials:

**Student**: niresh@student.com / Niresh_007
**Advisor**: advisor@faculty.com / Niresh_007
**HOD**: hod@department.com / Niresh_007
**Warden**: warden@hostel.com / Niresh_007
**Security**: security@gate.com / Niresh_007
**Super Admin**: niresh@admin.com / Niresh_007
**Dept Admin**: cse-admin@college.edu / Niresh_007

### 2. Test Approval Workflow
1. Login as **Student** → Click "Submit Outpass"
2. Fill destination, reason, dates → Submit
3. Login as **Advisor** → Click "Pending" tab → Approve
4. Login as **HOD** → Click "Pending" tab → Approve
5. Login as **Warden** → Click "Pending" tab → Approve
6. See QR code generated in student dashboard
7. Login as **Security** → Scan QR (or manually search) → Mark entry/exit

### 3. Test Admin Features
1. Login as **Super Admin**
   - Create new student in different department
   - Create new advisor
   - Edit outpass status
   - View audit logs
   - Download reports

2. Login as **Dept Admin** (CSE)
   - View only CSE students
   - Create new student in CSE only
   - Try to create student in AI&ML (should fail)
   - View all outpasses (read-only)

### 4. Test Department-Wise Flow
1. Create student in **AI&ML** department
2. Create advisor in **AI&ML** department
3. Submit outpass as AI&ML student
4. Verify only AI&ML advisor can see request
5. Try to approve with CSE advisor (should fail)

---

## File Structure

```
e:\homs-deployed\
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app definition
│   │   ├── core/
│   │   │   ├── config.py            # Settings & env variables
│   │   │   ├── database.py          # MongoDB connection
│   │   │   └── security.py          # JWT & password hashing
│   │   ├── models/
│   │   │   ├── user.py              # User model with roles/depts
│   │   │   ├── outpass.py           # Outpass model
│   │   │   ├── audit.py             # Audit log model
│   │   │   └── __init__.py
│   │   ├── routes/
│   │   │   ├── auth.py              # Login/register endpoints
│   │   │   ├── outpass.py           # Approval workflow endpoints
│   │   │   ├── admin.py             # User management endpoints
│   │   │   ├── dependencies.py      # Auth helpers & RBAC
│   │   │   └── __init__.py
│   │   └── services/
│   │       ├── email.py             # Email notifications
│   │       ├── excel.py             # Report generation
│   │       ├── scheduler.py         # Background jobs
│   │       └── __init__.py
│   ├── tests/
│   │   ├── test_api.py              # Full integration tests
│   │   └── __init__.py
│   ├── seed_db.py                   # Database initialization
│   ├── requirements.txt             # Python dependencies
│   ├── pytest.ini                   # Test configuration
│   ├── .env                         # Environment variables
│   └── vercel.json                  # Deployment config
│
└── fixed-frontend/                  # React frontend
    ├── src/
    │   ├── App.jsx                  # Main component
    │   ├── main.jsx                 # Entry point
    │   ├── pages/
    │   │   ├── Login.jsx            # Login page
    │   │   ├── StudentDashboard.jsx # Student outpass portal
    │   │   ├── ApproverDashboard.jsx# Approval workflow UI
    │   │   ├── SecurityDashboard.jsx# Gate operations UI
    │   │   └── AdminDashboard.jsx   # Admin management UI
    │   ├── App.css                  # Global styles
    │   └── index.css                # Base styles
    ├── public/                      # Static assets
    ├── index.html                   # HTML entry point
    ├── package.json                 # NPM dependencies
    ├── vite.config.js               # Vite configuration
    ├── tailwind.config.js           # Tailwind CSS config
    └── postcss.config.js            # PostCSS config
```

---

## Stopping the Services

### Stop Backend (in PowerShell terminal running backend)
```powershell
Ctrl + C
```

### Stop Frontend (in PowerShell terminal running frontend)
```powershell
Ctrl + C
```

### Stop Both Terminals
```powershell
# In PowerShell
Get-Process uvicorn | Stop-Process -Force  # Stop backend
Get-Process node | Stop-Process -Force     # Stop frontend
```

---

## Restarting the Services

### Restart Backend
```powershell
cd e:\homs-deployed\backend
$env:SECRET_KEY='7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b'
$env:MONGODB_URI='mongodb+srv://Outpass_system_Cloud:Niresh_007@niresh.uhlva1x.mongodb.net/homs?appName=Niresh'
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Restart Frontend
```powershell
cd e:\homs-deployed\fixed-frontend
npm run dev
```

---

## Key Implementation Details

### Role-Based Access Control (RBAC)

**Database-Level Enforcement** (`get_role_based_outpass_filter` in dependencies.py):
- Students: see only own requests
- Advisors: see department's requests at "Pending" or later
- HODs: see department's requests at "Advisor Approved" or later
- Wardens: see requests at "HOD Approved" or later
- Security: see only "Approved", "Student Left", "Student Returned"
- Super Admin/Dept Admin: see all requests

**Route-Level Enforcement** (RoleChecker):
- Each endpoint validates user has required role
- Raises 403 Forbidden if unauthorized
- Returns 401 Unauthorized if not authenticated

### Approval Sequence Validation

Each role can only approve from specific status:
- **Advisor** → only "Pending" → "Advisor Approved"
- **HOD** → only "Advisor Approved" → "HOD Approved"
- **Warden** → only "HOD Approved" → "Approved" (+ QR generation)
- **Security** → only "Approved" → "Student Left" or "Student Returned"

Prevents skipping levels or out-of-order approvals.

### Department-Scoped Roles

These roles MUST have a department assigned:
- `student`
- `advisor`
- `hod`
- `department_admin`

Roles that don't require department:
- `warden`
- `security`
- `super_admin`

### Audit Logging

Every admin action creates an audit log entry with:
- Timestamp (UTC)
- Actor ID and name
- Action type (CREATE_USER, UPDATE_USER, DELETE_USER)
- Affected model and ID
- Changes (before/after values)
- Immutable flag (cannot be edited)

---

## Known Limitations & Future Improvements

1. **Single Advisor Per Department**: Currently, only one advisor per department. Could support multiple advisors.
2. **Hardcoded Department List**: Departments are hardcoded in models. Could be database-driven.
3. **QR Code Format**: Simple text token. Could use actual QR image generation.
4. **Rejection Flow**: Once rejected, student must resubmit. Could allow immediate resubmission.
5. **Email Sending**: Currently background tasks. Could use message queue (Celery/RabbitMQ) for reliability.
6. **Testing**: Basic integration tests. Could expand to unit tests and E2E tests.

---

## Troubleshooting

### Backend Won't Start
```
Error: "FATAL: SECRET_KEY environment variable is not set"
Solution: Set environment variables before starting:
$env:SECRET_KEY='7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b'
$env:MONGODB_URI='mongodb+srv://Outpass_system_Cloud:Niresh_007@niresh.uhlva1x.mongodb.net/homs?appName=Niresh'
```

### MongoDB Connection Error
```
Error: "Could not connect to MongoDB"
Solution: Verify MongoDB connection string in .env
Check network connectivity to cloud MongoDB
Try connecting with MongoDB Compass
```

### Frontend Blank Screen
```
Error: Frontend loads but shows nothing
Solution: Check browser console (F12) for errors
Verify backend is running on http://localhost:8000
Check CORS settings in FastAPI app
Clear browser cache and reload
```

### Port Already in Use
```
Error: "Address already in use :8000" or ":5173"
Solution: 
# Kill existing processes
Get-Process | Where-Object {$_.ProcessName -eq "uvicorn"} | Stop-Process -Force
Get-Process node | Stop-Process -Force
# Then restart services
```

---

## Support & Documentation

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- Full endpoint documentation with request/response examples

### Code Comments
- Every function has detailed docstrings
- Role requirements documented in route decorators
- Complex logic explained inline

### Contact
For issues or questions, refer to code comments and type hints throughout the codebase.

---

## System Summary Table

| Component | Status | Port | Technology |
|-----------|--------|------|-----------|
| **Backend API** | ✅ Running | 8000 | FastAPI + Python 3.13 |
| **Frontend UI** | ✅ Running | 5173 | React + Vite |
| **Database** | ✅ Connected | Cloud | MongoDB (Atlas) |
| **Authentication** | ✅ Active | - | JWT (24h expiration) |
| **Email Service** | ✅ Active | 587 | Gmail SMTP |
| **Scheduler** | ✅ Running | - | APScheduler |
| **Tests** | ✅ Passing | - | Pytest |
| **Audit Logs** | ✅ Tracking | - | MongoDB collection |
| **QR Codes** | ✅ Generating | - | Unique tokens |
| **Department Flow** | ✅ Enforced | - | Database-level RBAC |

---

**Implementation Date**: 2026-08-18  
**Status**: ✅ COMPLETE AND OPERATIONAL  
**All Systems**: Go ✅
