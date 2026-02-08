from sqlalchemy.orm import Session

from . import auth, models, schemas


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.hash_password(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hashed_password,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_admin_user(db: Session, username: str, email: str, password: str):
    existing = get_user_by_username(db, username) or get_user_by_email(db, email)
    if existing:
        return existing

    hashed_password = auth.hash_password(password)
    admin_user = models.User(
        username=username,
        email=email,
        password_hash=hashed_password,
        is_admin=True,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    return admin_user


def create_group(db: Session, group: schemas.GroupCreate, user_id: int):
    db_group = models.Group(
        name=group.name,
        description=group.description,
        created_by=user_id,
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)

    membership = models.GroupMember(group_id=db_group.id, user_id=user_id, role="owner")
    db.add(membership)
    db.commit()

    return db_group


def list_groups(db: Session, user_id: int):
    return (
        db.query(models.Group)
        .join(models.GroupMember)
        .filter(models.GroupMember.user_id == user_id)
        .all()
    )


def list_all_groups(db: Session):
    return db.query(models.Group).all()


def get_member_group_ids(db: Session, user_id: int):
    return {
        membership.group_id
        for membership in db.query(models.GroupMember)
        .filter(models.GroupMember.user_id == user_id)
        .all()
    }


def get_membership(db: Session, group_id: int, user_id: int):
    return (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id,
        )
        .first()
    )


def is_member(db: Session, group_id: int, user_id: int) -> bool:
    return (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id,
            models.GroupMember.is_banned.is_(False),
        )
        .first()
        is not None
    )


def add_member(db: Session, group_id: int, user_id: int):
    membership = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id,
        )
        .first()
    )

    if membership:
        return membership

    membership = models.GroupMember(group_id=group_id, user_id=user_id, role="member")
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def list_group_members(db: Session, group_id: int):
    return (
        db.query(models.GroupMember)
        .join(models.User)
        .filter(models.GroupMember.group_id == group_id)
        .all()
    )


def ban_member(db: Session, group_id: int, user_id: int):
    membership = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        return None
    membership.is_banned = True
    db.commit()
    db.refresh(membership)
    return membership


def unban_member(db: Session, group_id: int, user_id: int):
    membership = (
        db.query(models.GroupMember)
        .filter(
            models.GroupMember.group_id == group_id,
            models.GroupMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        return None
    membership.is_banned = False
    db.commit()
    db.refresh(membership)
    return membership


def add_message(db: Session, group_id: int, user_id: int, message: schemas.MessageCreate):
    db_message = models.Message(
        group_id=group_id,
        user_id=user_id,
        content=message.content,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def update_group(db: Session, group_id: int, name: str, description: str | None):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        return None

    group.name = name
    group.description = description
    db.commit()
    db.refresh(group)
    return group


def delete_group(db: Session, group_id: int):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        return None

    db.delete(group)
    db.commit()
    return group


def list_messages(db: Session, group_id: int):
    return (
        db.query(models.Message)
        .filter(models.Message.group_id == group_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
