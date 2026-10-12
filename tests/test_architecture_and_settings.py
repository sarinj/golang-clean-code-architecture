import ast
import sys
from pathlib import Path

from src.config.settings import Settings


def test_domain_and_usecases_have_no_framework_dependencies() -> None:
    root = Path(__file__).resolve().parents[1]
    for directory in ("domain", "usecases"):
        for path in (root / "src" / directory).rglob("*.py"):
            for node in ast.walk(ast.parse(path.read_text())):
                if isinstance(node, ast.Import):
                    imports = [alias.name for alias in node.names]
                elif isinstance(node, ast.ImportFrom):
                    imports = [node.module or ""]
                else:
                    continue
                for name in imports:
                    assert (
                        name.startswith("src.domain")
                        or name.split(".")[0] in sys.stdlib_module_names
                    ), f"{path.relative_to(root)} imports {name}"


def test_original_environment_names_and_new_name_precedence(monkeypatch) -> None:
    monkeypatch.setenv("GOAPP_SECRET_KEY", "legacy-secret")
    monkeypatch.setenv("GOAPP_NAME", "GOLANG FIRST API APP")
    monkeypatch.setenv("GOAPP_PORT", "3456")
    monkeypatch.setenv("GOAPP_POSTGRES_DB_PASSWORD", "password with @ and /")
    settings = Settings(_env_file=None)
    assert settings.secret_key == "legacy-secret"
    assert settings.name == "GOLANG FIRST API APP"
    assert settings.port == 3456
    assert settings.postgres_url.password == "password with @ and /"
    monkeypatch.setenv("APP_PORT", "4567")
    assert Settings(_env_file=None).port == 4567


def test_environment_overrides_dotenv(tmp_path: Path, monkeypatch) -> None:
    dotenv = tmp_path / ".env"
    dotenv.write_text("APP_SECRET_KEY=dotenv-secret\nAPP_NAME=From file\n")
    monkeypatch.setenv("APP_NAME", "From process")
    settings = Settings(_env_file=dotenv)
    assert settings.name == "From process"
    assert settings.secret_key == "dotenv-secret"
