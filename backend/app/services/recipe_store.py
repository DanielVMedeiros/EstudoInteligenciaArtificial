import json
import threading
from pathlib import Path

from app.models import Recipe


class RecipeStore:
    def __init__(self, data_dir: Path) -> None:
        self._path = data_dir / "recipes.json"
        self._lock = threading.Lock()
        self._recipes: dict[str, Recipe] = {}
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            return
        raw = json.loads(self._path.read_text(encoding="utf-8"))
        self._recipes = {item["id"]: Recipe.model_validate(item) for item in raw}

    def _save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        payload = [recipe.model_dump(mode="json") for recipe in self._recipes.values()]
        self._path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def all(self) -> list[Recipe]:
        with self._lock:
            return list(self._recipes.values())

    def get(self, recipe_id: str) -> Recipe | None:
        with self._lock:
            return self._recipes.get(recipe_id)

    def upsert(self, recipe: Recipe) -> str:
        """Returns 'created', 'updated', or 'unchanged'."""
        with self._lock:
            existing = self._recipes.get(recipe.id)
            if existing is None:
                self._recipes[recipe.id] = recipe
                self._save()
                return "created"
            if existing.model_dump() == recipe.model_dump():
                return "unchanged"
            self._recipes[recipe.id] = recipe
            self._save()
            return "updated"

    def count(self) -> int:
        with self._lock:
            return len(self._recipes)
