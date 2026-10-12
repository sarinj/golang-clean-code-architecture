from src.domain.entities.crud import CRUDModel
from src.domain.models.user import UserModel, UserPermissionModel, UserTokenModel

ENTITY_MODELS = (
    CRUDModel(entity=UserModel, table_name="users"),
    CRUDModel(entity=UserTokenModel, table_name="user_tokens"),
    CRUDModel(entity=UserPermissionModel, table_name="user_permissions"),
)
