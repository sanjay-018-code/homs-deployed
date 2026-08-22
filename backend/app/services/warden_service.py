from app.core.database import get_database
from bson import ObjectId

async def get_warden_summary(warden_id: str):
    """Return summary for a warden: hostel name, capacity, resident count.
    Assumes a Hostel document has a `warden_id` field referencing the User _id.
    """
    db = get_database()
    warden_obj_id = ObjectId(warden_id)
    # Find the hostel assigned to this warden
    hostel = await db.hostels.find_one({"warden_id": warden_obj_id})
    if not hostel:
        return {"hostel_name": None, "capacity": 0, "resident_count": 0}
    hostel_name = hostel.get("name")
    capacity = hostel.get("capacity", 0)
    # Count students whose hostel_details.hostel_name matches
    resident_count = await db.users.count_documents({
        "role": "student",
        "hostel_details.hostel_name": hostel_name
    })
    return {
        "hostel_name": hostel_name,
        "capacity": capacity,
        "resident_count": resident_count,
    }
