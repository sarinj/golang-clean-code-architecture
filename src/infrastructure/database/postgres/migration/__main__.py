import logging
from pathlib import Path

from alembic import command
from alembic.config import Config

from src.config.settings import Settings


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    config = Config()
    config.set_main_option("script_location", str(Path(__file__).parent))
    config.attributes["settings"] = Settings()
    command.upgrade(config, "head")


if __name__ == "__main__":
    main()
