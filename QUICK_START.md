# Quick Start Guide - HOMS System

## 🚀 System Status: RUNNING ✅

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:5173 | ✅ Running |
| **Backend API** | http://localhost:8000 | ✅ Running |
| **API Docs** | http://localhost:8000/docs | ✅ Available |
| **Database** | MongoDB Cloud | ✅ Connected |

---

## 📋 Test Credentials (Password: `Niresh_007`)

### Quick Login Links
Click username in login form to auto-fill credentials:

| Role | Email | Dept | Access Level |
|------|-------|------|--------------|
| **Student** | `niresh@student.com` | CSE | Submit outpass requests |
| **Advisor** | `advisor@faculty.com` | CSE | First approval level |
| **HOD** | `hod@department.com` | CSE | Second approval level |
| **Warden** | `warden@hostel.com` | - | Final approval + QR generation |
| **Security** | `security@gate.com` | - | Scan QR & mark gate activity |
| **Super Admin** | `niresh@admin.com` | - | Full system access |
| **Dept Admin** | `cse-admin@college.edu` | CSE | CSE users only |

---

## 🎯 Quick Test: Complete Approval Workflow (5 minutes)

### Step 1: Submit as Student
```
1. Go to http://localhost:5173
2. Login as: niresh@student.com / Niresh_007
3. Click "Submit Outpass"
4. Fill in:
   - Destination: "Home"
   - Reason: "Family visit"
   - Out Date: Tomorrow at 9:00 AM
   - In Date: Day after tomorrow at 6:00 PM
5. Click "Submit" → See "Status: Pending"
```

### Step 2: Approve as Advisor
```
1. Logout & Login as: advisor@faculty.com / Niresh_007
2. You should see "Student Dashboard" → "Pending" tab
3. Should see 1 pending request from "Niresh Student"
4. Click "Approve" → Add comment "Looks good"
5. Status changes to "Advisor Approved"
```

### Step 3: Approve as HOD
```
1. Logout & Login as: hod@department.com / Niresh_007
2. Click "Pending" tab
3. Should see 1 "Advisor Approved" request
4. Click "Approve" → Add comment "HOD approved"
5. Status changes to "HOD Approved"
```

### Step 4: Final Approval as Warden
```
1. Logout & Login as: warden@hostel.com / Niresh_007
2. Click "Pending" tab
3. Should see 1 "HOD Approved" request
4. Click "Approve" → Add comment "Pass granted"
5. Status changes to "Approved"
6. QR Token appears: "OUT-XXXXXXXXXX"
```

### Step 5: View QR as Student
```
1. Logout & Login as: niresh@student.com / Niresh_007
2. Go to "My Requests"
3. See the approved request with QR code displayed
4. Status now shows "Approved"
```

### Step 6: Security Gate Check
```
1. Logout & Login as: security@gate.com / Niresh_007
2. Click "Lookup" tab
3. Enter QR Token: "OUT-XXXXXXXXXX"
4. Click "Mark Student Left" → Exit recorded
5. Later: Click "Mark Student Returned" → Entry recorded
6. Status changes: "Student Left" → "Student Returned"
```

**Result**: Request successfully completed the entire approval hierarchy! ✅

---

## 🔧 Admin Functions Test

### Super Admin: Full Control
```
1. Login as: niresh@admin.com / Niresh_007
2. Go to "Users" tab:
   ✅ Create new student in any department
   ✅ Create new advisor
   ✅ Edit any user
   ✅ Delete any user
   ✅ Promote/demote roles
3. Go to "Outpasses" tab:
   ✅ Edit any outpass status
   ✅ Delete any outpass
4. Go to "Audit Logs" tab:
   ✅ See all changes in system
   ✅ Rollback any change
5. Go to "Gate Logs" tab:
   ✅ See all gate activities
```

### Department Admin: CSE Only
```
1. Login as: cse-admin@college.edu / Niresh_007
2. Go to "Users" tab:
   ✅ Can create student in CSE only
   ✅ Try to create in "AI&ML" → Should FAIL
   ✅ Can edit CSE students only
   ✅ Cannot delete users
3. Go to "Outpasses" tab:
   ✅ View all CSE outpasses (read-only)
   ✅ Cannot edit or delete
4. Try to access "Audit Logs":
   ✅ Can view (read-only)
   ✅ Cannot perform rollbacks
```

---

## 📊 Available Departments

Create students/advisors/hods in any department:

1. **AI&ML** - Artificial Intelligence & Machine Learning
2. **AI&DS** - Artificial Intelligence & Data Science
3. **CSE** - Computer Science & Engineering
4. **ECE** - Electronics & Communication Engineering
5. **IT** - Information Technology
6. **CS** - Computer Science
7. **EEE** - Electrical & Electronics Engineering
8. **CIVIL** - Civil Engineering
9. **MECH** - Mechanical Engineering

### Test Department-Wise Flow:
```
1. Super Admin: Create student in "AI&ML" department
2. Super Admin: Create advisor in "AI&ML" department
3. New AI&ML student submits outpass
4. Only AI&ML advisor can see it (department isolation)
5. CSE advisor cannot see AI&ML requests
```

---

## 🔍 Approval Workflow Rules

### ✅ Can Approve If:
- **Advisor**: Has "Pending" request, same department, active
- **HOD**: Has "Advisor Approved" request, same department, active
- **Warden**: Has "HOD Approved" request (no dept restriction), active
- **Security**: Has "Approved" request, can mark exit/entry

### ❌ Cannot Approve If:
- Cross-department (e.g., CSE advisor approving AI&ML student)
- Wrong status (e.g., HOD trying to approve "Pending" request)
- User enrolled_status is not "active"
- No department assigned (for advisor/hod)

---

## 📧 Email Features

**Automatic Notifications Sent To:**
1. Student submits → Advisor notified
2. Advisor approves → HOD notified
3. HOD approves → Warden notified
4. Warden approves → Student gets QR code
5. Any rejection → Student gets rejection reason

(Emails sent asynchronously, don't block the API)

---

## 📝 API Testing with Postman

### 1. Get API Documentation
Visit: http://localhost:8000/docs
- Swagger UI with all endpoints
- Try it out button for direct testing
- Request/response examples

### 2. Example API Test Flow
```
POST /api/auth/login
{
  "email": "niresh@student.com",
  "password": "Niresh_007"
}
↓ Response: {"access_token": "eyJ...", "token_type": "bearer"}

POST /api/outpass/apply
Headers: Authorization: Bearer eyJ...
{
  "destination": "Home",
  "reason": "Family visit",
  "out_date": "2026-08-20T09:00:00Z",
  "in_date": "2026-08-21T18:00:00Z"
}
↓ Response: Outpass created with status "Pending"

POST /api/outpass/{id}/approve
{
  "comments": "Looks good"
}
↓ Response: Status updated to "Advisor Approved"
```

---

## 🛑 Troubleshooting Quick Fixes

### Issue: "Cannot connect to backend"
```powershell
# Check if backend is running
Get-Process | Where-Object {$_.ProcessName -eq "python"}

# If not running, restart backend
cd e:\homs-deployed\backend
$env:SECRET_KEY='7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b'
$env:MONGODB_URI='mongodb+srv://Outpass_system_Cloud:Niresh_007@niresh.uhlva1x.mongodb.net/homs?appName=Niresh'
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Issue: "Cannot login"
```
1. Verify email is correct (see credentials table)
2. Verify password is: Niresh_007
3. Check browser console (F12) for API errors
4. Verify backend is responding: curl http://localhost:8000/docs
```

### Issue: "Advisor cannot see pending request"
```
1. Verify advisor is in SAME department as student
2. Verify student's department field is set
3. Verify request status is "Pending" (for advisor)
4. Super Admin can see all (for debugging)
```

### Issue: "Can't submit outpass as student"
```
Possible reasons:
1. Already have pending request (only 1 allowed at a time)
2. Student doesn't have department assigned
3. No active advisor in student's department
Try: Super Admin creates advisor first, then retry
```

---

## 🧪 Running Tests

### Run All Tests
```powershell
cd e:\homs-deployed\backend
$env:SECRET_KEY='7a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b'
$env:MONGODB_URI='mongodb+srv://Outpass_system_Cloud:Niresh_007@niresh.uhlva1x.mongodb.net/homs?appName=Niresh'
python -m pytest tests/test_api.py -v
```

### Expected Output
```
tests/test_api.py::test_full_system_flow PASSED [100%]
```

---

## 📱 Mobile Testing

Frontend is mobile-responsive! Test on:
- Desktop browser
- Mobile browser (Chrome DevTools → Toggle device toolbar)
- Tablet

All dashboards adapt to screen size.

---

## 🔐 Security Features Verified

✅ JWT Authentication (24-hour tokens)  
✅ Password Hashing (Bcrypt)  
✅ Role-Based Access Control (RBAC)  
✅ Department-Level Isolation  
✅ Audit Logging (all changes tracked)  
✅ Immutable Audit Trail  
✅ Email Validation  
✅ Unique Email & Roll Number Constraints  

---

## 📊 Data Schema Overview

### Users Collection
```json
{
  "_id": ObjectId,
  "name": "Niresh Student",
  "email": "niresh@student.com",
  "role": "student",           // student|advisor|hod|warden|security|super_admin|department_admin
  "department": "CSE",          // Required for: student|advisor|hod|department_admin
  "roll_number": "STU101",      // Unique (sparse index)
  "parent_email": "parent@...",
  "hostel_details": {
    "room": "101",
    "hostel_name": "A-Block",
    "occupancy_status": "Resident"
  },
  "enrollment_status": "active",
  "password_hash": "bcrypt_hash",
  "created_at": "2026-08-18T...",
  "updated_at": "2026-08-18T..."
}
```

### Outpasses Collection
```json
{
  "_id": ObjectId,
  "student_id": ObjectId,       // FK to users
  "student_name": "Niresh Student",
  "roll_number": "STU101",
  "department": "CSE",
  "destination": "Home",
  "reason": "Family visit",
  "out_date": "2026-08-20T09:00:00Z",
  "in_date": "2026-08-21T18:00:00Z",
  "room": "101",
  "hostel_name": "A-Block",
  "status": "Approved",         // Pending|Advisor Approved|HOD Approved|Approved|Student Left|Student Returned|Rejected
  "qr_token": "OUT-XXXXXXXXXX",
  "rejection_reason": null,
  "exit_time": null,
  "entry_time": null,
  "history": [
    {
      "status": "Pending",
      "updated_by": ObjectId,
      "updated_by_name": "Niresh Student",
      "updated_at": "2026-08-18T...",
      "comments": "Submitted by student"
    },
    // ... more history items ...
  ],
  "created_at": "2026-08-18T..."
}
```

### Audit Logs Collection
```json
{
  "_id": ObjectId,
  "timestamp": "2026-08-18T...",
  "actor_id": ObjectId,
  "actor_name": "Niresh Admin",
  "action": "CREATE_USER",      // CREATE_USER|UPDATE_USER|DELETE_USER|ROLLBACK
  "affected_model": "User",
  "affected_id": ObjectId,
  "changes": {
    "name": ["old_name", "new_name"],
    "email": ["old_email", "new_email"],
    "role": ["student", "advisor"]
  },
  "immutable": true
}
```

---

## 🎓 Approval Hierarchy Recap

```
┌─────────────────────────────────┐
│  STUDENT submits outpass        │
│  Status: "Pending"              │
└────────────┬────────────────────┘
             │ Email to Advisor (same dept)
             ▼
┌─────────────────────────────────┐
│  ADVISOR reviews & approves     │
│  Status: "Advisor Approved"     │
└────────────┬────────────────────┘
             │ Email to HOD (same dept)
             ▼
┌─────────────────────────────────┐
│  HOD reviews & approves         │
│  Status: "HOD Approved"         │
└────────────┬────────────────────┘
             │ Email to Warden
             ▼
┌─────────────────────────────────┐
│  WARDEN final approval          │
│  Status: "Approved"             │
│  ✨ QR Token Generated ✨       │
└────────────┬────────────────────┘
             │ Email to Student with QR
             ▼
┌─────────────────────────────────┐
│  SECURITY scans QR              │
│  Mark: "Student Left"           │
│  Then: "Student Returned"       │
└─────────────────────────────────┘
```

---

## 🎉 System Highlights

✨ **5-Level Approval Hierarchy** - Student → Advisor → HOD → Warden → Security  
✨ **9 Departments** - AI&ML, AI&DS, CSE, ECE, IT, CS, EEE, CIVIL, MECH  
✨ **Department-Wise Flow** - Each student/advisor/hod scoped to department  
✨ **Dual Admin Roles** - Super Admin (full access) + Department Admin (dept-only)  
✨ **Role-Based Dashboards** - Different UI for each role  
✨ **QR Code Generation** - Warden approval generates unique QR  
✨ **Audit Logging** - Track all changes with rollback capability  
✨ **Email Notifications** - Async notifications at each approval stage  
✨ **Gate Operations** - Security can scan QR and mark entry/exit  
✨ **Full Integration Tests** - Verified complete workflow  

---

**Happy Testing! 🚀**

For detailed information, see `IMPLEMENTATION_SUMMARY.md`
