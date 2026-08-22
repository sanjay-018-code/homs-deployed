from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_database
from app.routes.dependencies import RoleChecker, SUPER_ADMIN_ROLES
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/api/warden", tags=["Warden Management"])

# Endpoint to get summary of all hostels (name, capacity, resident count)
@router.get("/summary", response_model=List[dict])
async def get_hostel_summary(current_user: dict = Depends(RoleChecker(SUPER_ADMIN_ROLES))):
    """Return a list of hostels with their name, capacity, and current resident count.
    Accessible by super_admins (and potentially other admin roles as needed).
    """
    db = get_database()
    hostels_cursor = db.hostels.find()
    hostels = await hostels_cursor.to_list(length=500)
    summary_list = []
    for hostel in hostels:
        hostel_name = hostel.get("name")
        capacity = hostel.get("capacity", 0)
        resident_count = await db.users.count_documents({
            "role": "student",
            "hostel_details.hostel_name": hostel_name
        })
        summary_list.append({
            "hostel_name": hostel_name,
            "capacity": capacity,
            "resident_count": resident_count,
        })
    return summary_list
