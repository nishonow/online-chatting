import os
from typing import Dict, Set

from anyio import from_thread
from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import auth, crud, models, schemas
from .database import Base, SessionLocal, engine, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Online Chat API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] ,
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

DEFAULT_ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
DEFAULT_ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
DEFAULT_ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin12345")


@app.on_event("startup")
def create_default_admin():
    db = next(get_db())
    try:
        crud.create_admin_user(
            db,
            username=DEFAULT_ADMIN_USERNAME,
            email=DEFAULT_ADMIN_EMAIL,
            password=DEFAULT_ADMIN_PASSWORD,
        )
    finally:
        db.close()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, group_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(group_id, set()).add(websocket)

    def disconnect(self, group_id: int, websocket: WebSocket) -> None:
        if group_id in self.active_connections:
            self.active_connections[group_id].discard(websocket)
            if not self.active_connections[group_id]:
                del self.active_connections[group_id]

    async def broadcast(self, group_id: int, payload: dict) -> None:
        for websocket in list(self.active_connections.get(group_id, set())):
            await websocket.send_json(payload)


manager = ConnectionManager()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    payload = auth.decode_token(token)
    if payload is None or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = crud.get_user_by_username(db, payload["sub"])
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@app.post("/auth/signup", response_model=schemas.UserRead)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, user.email) or crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="User already exists")
    return crud.create_user(db, user)


@app.post("/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_username(db, form_data.username)
    if user is None:
        user = crud.get_user_by_email(db, form_data.username)
    if user is None or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/users/me", response_model=schemas.UserRead)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/groups", response_model=schemas.GroupRead)
def create_group(
    group: schemas.GroupCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    return crud.create_group(db, group, current_user.id)


@app.put("/groups/{group_id}", response_model=schemas.GroupRead)
def update_group(
    group_id: int,
    group: schemas.GroupCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    updated = crud.update_group(db, group_id, group.name, group.description)
    if not updated:
        raise HTTPException(status_code=404, detail="Group not found")
    return updated


@app.delete("/groups/{group_id}")
def delete_group(
    group_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    deleted = crud.delete_group(db, group_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"deleted": True}


@app.get("/groups", response_model=list[schemas.GroupRead])
def list_groups(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_groups(db, current_user.id)


@app.get("/groups/all", response_model=list[schemas.GroupReadWithMembership])
def list_all_groups(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    groups = crud.list_all_groups(db)
    member_ids = crud.get_member_group_ids(db, current_user.id)
    return [
        schemas.GroupReadWithMembership(
            id=group.id,
            name=group.name,
            description=group.description,
            created_by=group.created_by,
            created_at=group.created_at,
            is_member=group.id in member_ids,
        )
        for group in groups
    ]


@app.post("/groups/{group_id}/join")
def join_group(
    group_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.query(models.Group).filter(models.Group.id == group_id).first():
        raise HTTPException(status_code=404, detail="Group not found")
    membership = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == current_user.id,
        )
        .first()
    )
    if membership and membership.is_banned:
        raise HTTPException(status_code=403, detail="You are banned from this group")
    crud.add_member(db, group_id, current_user.id)
    return {"joined": True}


@app.post("/groups/{group_id}/messages", response_model=schemas.MessageRead)
def create_message(
    group_id: int,
    message: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not crud.is_member(db, group_id, current_user.id):
        raise HTTPException(status_code=403, detail="Join the group first")
    db_message = crud.add_message(db, group_id, current_user.id, message)

    payload = {
        "type": "message",
        "data": {
            "id": db_message.id,
            "group_id": db_message.group_id,
            "user_id": db_message.user_id,
            "sender_username": current_user.username,
            "content": db_message.content,
            "created_at": db_message.created_at.isoformat(),
        },
    }
    from_thread.run(manager.broadcast, group_id, payload)
    return db_message


@app.get("/groups/{group_id}/messages", response_model=list[schemas.MessageRead])
def list_messages(
    group_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = crud.get_membership(db, group_id, current_user.id)
    if membership is None:
        raise HTTPException(status_code=403, detail="Join the group first")
    if membership.is_banned:
        raise HTTPException(status_code=403, detail="You are banned from this group")
    return crud.list_messages(db, group_id)


@app.get("/groups/{group_id}/members", response_model=list[schemas.GroupMemberRead])
def list_group_members(
    group_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    membership = crud.get_membership(db, group_id, current_user.id)
    if membership is None:
        raise HTTPException(status_code=403, detail="Join the group first")
    if membership.is_banned:
        raise HTTPException(status_code=403, detail="You are banned from this group")
    members = crud.list_group_members(db, group_id)
    return [
        schemas.GroupMemberRead(
            user_id=member.user_id,
            username=member.user.username,
            role=member.role,
            is_banned=member.is_banned,
            joined_at=member.joined_at,
        )
        for member in members
    ]


@app.post("/groups/{group_id}/members/{user_id}/ban")
def ban_member(
    group_id: int,
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    membership = crud.ban_member(db, group_id, user_id)
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"banned": True}


@app.post("/groups/{group_id}/members/{user_id}/unban")
def unban_member(
    group_id: int,
    user_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    membership = crud.unban_member(db, group_id, user_id)
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"banned": False}


@app.websocket("/ws/groups/{group_id}")
async def group_ws(websocket: WebSocket, group_id: int, token: str):
    payload = auth.decode_token(token)
    if payload is None or "sub" not in payload:
        await websocket.close(code=1008)
        return

    db = SessionLocal()
    try:
        user = crud.get_user_by_username(db, payload["sub"])
        if user is None or not crud.is_member(db, group_id, user.id):
            await websocket.close(code=1008)
            return

        await manager.connect(group_id, websocket)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(group_id, websocket)
    finally:
        db.close()
