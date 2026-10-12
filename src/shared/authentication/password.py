import bcrypt

from src.domain.errors import InvalidInput


class BcryptPasswordHasher:
    def hash(self, password: str) -> str:
        raw = password.encode("utf-8")
        if not 1 <= len(raw) <= 72:
            raise InvalidInput("password must contain between 1 and 72 UTF-8 bytes")
        return bcrypt.hashpw(raw, bcrypt.gensalt(rounds=10)).decode("ascii")

    def verify(self, password: str, password_hash: str) -> bool:
        raw = password.encode("utf-8")
        if not 1 <= len(raw) <= 72:
            return False
        try:
            return bcrypt.checkpw(raw, password_hash.encode("ascii"))
        except (ValueError, UnicodeEncodeError):
            return False
