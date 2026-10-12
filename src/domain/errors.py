class DomainError(Exception):
    """An expected application failure, independent of HTTP or a database driver."""


class InvalidInput(DomainError):
    pass


class AuthenticationError(DomainError):
    pass


class DuplicateEmail(DomainError):
    pass


class NotFound(DomainError):
    pass
