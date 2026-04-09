from be.app import app


def main() -> None:
    print("Run with: uv run uvicorn be.app:app --reload")


__all__ = ["app", "main"]
