from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserRead(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class GroupMemberRead(BaseModel):
    user_id: int
    username: str
    role: str
    is_banned: bool
    joined_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GroupCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str | None = None


class GroupRead(BaseModel):
    id: int
    name: str
    description: str | None
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


class GroupReadWithMembership(GroupRead):
    is_member: bool


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MessageRead(BaseModel):
    id: int
    group_id: int
    user_id: int
    sender_username: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True
