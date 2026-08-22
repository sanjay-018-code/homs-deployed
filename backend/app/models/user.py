from typing import Optional, Annotated
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, BeforeValidator, PlainSerializer, WithJsonSchema, AliasChoices, field_validator, model_validator, ConfigDict

# Keep the department values in one place so API validation and the UI use the
# exact same identifiers.  These values are stored on students and the
# department-scoped staff who route their requests.
DEPARTMENTS = ("AI&ML", "AI&DS", "CSE", "ECE", "IT", "CS", "EEE", "CIVIL", "MECH")
DEPARTMENT_SCOPED_ROLES = {"student", "advisor", "hod", "department_admin"}
VALID_ROLES = {
    "student", "advisor", "warden", "hod", "security",
    "super_admin", "department_admin",
    # Existing deployments may still have this role. It is treated as a
    # super-admin compatibility alias by authorization checks.
    "admin",
}

# Custom type for handling MongoDB ObjectId
PyObjectId = Annotated[
    str,
    BeforeValidator(lambda x: str(x) if isinstance(x, ObjectId) else x),
    PlainSerializer(lambda x: str(x), return_type=str),
    WithJsonSchema({"type": "string", "example": "507f1f77bcf86cd799439011"}),
]

class HostelDetails(BaseModel):
    room: str = Field(..., json_schema_extra={"example": "101"})
    hostel_name: str = Field(..., json_schema_extra={"example": "A-Block"})
    occupancy_status: str = Field("Resident", json_schema_extra={"example": "Resident"})

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    role: str = Field("student", description="student, advisor, hod, warden, security, super_admin, department_admin")
    department: Optional[str] = None
    roll_number: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    hostel_details: Optional[HostelDetails] = None
    enrollment_status: str = "active"

    @field_validator("department")
    @classmethod
    def validate_department(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        department = value.strip()
        if not department:
            return None
        if department not in DEPARTMENTS:
            raise ValueError(f"Department must be one of: {', '.join(DEPARTMENTS)}")
        return department

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

    @model_validator(mode="after")
    def require_department_for_scoped_roles(self):
        if self.role in DEPARTMENT_SCOPED_ROLES and not self.department:
            raise ValueError(f"department is required for the {self.role} role")
        return self

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    roll_number: Optional[str] = None
    parent_email: Optional[EmailStr] = None
    hostel_details: Optional[HostelDetails] = None
    enrollment_status: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None

    @field_validator("department")
    @classmethod
    def validate_department(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        department = value.strip()
        if not department:
            return None
        if department not in DEPARTMENTS:
            raise ValueError(f"Department must be one of: {', '.join(DEPARTMENTS)}")
        return department

class UserInDB(UserBase):
    id: PyObjectId = Field(default=None, alias="_id")
    password_hash: str

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})

class UserResponse(UserBase):
    id: PyObjectId = Field(default=None, validation_alias=AliasChoices("_id", "id"), serialization_alias="id")
    live_status: Optional[str] = None
    active_outpass_status: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True, json_encoders={ObjectId: str})
