import uvicorn

from be.app import app


def main() -> None:
    uvicorn.run("be.app:app", host="127.0.0.1", port=8000, reload=True)


__all__ = ["app", "main"]
