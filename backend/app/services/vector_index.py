import json
import threading
from pathlib import Path

import faiss
import numpy as np


class VectorIndex:
    def __init__(self, data_dir: Path, dimension: int = 1536) -> None:
        self._path = data_dir / "faiss.index"
        self._meta_path = data_dir / "faiss_meta.json"
        self._lock = threading.Lock()
        self._dimension = dimension
        self._index = faiss.IndexFlatIP(dimension)
        self._ids: list[str] = []
        self._load()

    def _load(self) -> None:
        if self._path.exists() and self._meta_path.exists():
            self._index = faiss.read_index(str(self._path))
            self._ids = json.loads(self._meta_path.read_text(encoding="utf-8"))

    def _save(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(self._index, str(self._path))
        self._meta_path.write_text(json.dumps(self._ids, ensure_ascii=False), encoding="utf-8")

    def rebuild(self, recipe_ids: list[str], vectors: np.ndarray) -> None:
        with self._lock:
            self._index = faiss.IndexFlatIP(self._dimension)
            self._ids = []
            if len(recipe_ids) == 0:
                self._save()
                return
            normalized = self._normalize(vectors.astype(np.float32))
            self._index.add(normalized)
            self._ids = list(recipe_ids)
            self._save()

    def is_empty(self) -> bool:
        with self._lock:
            return self._index.ntotal == 0

    def search(self, query_vector: np.ndarray, top_k: int) -> list[tuple[str, float]]:
        with self._lock:
            if self._index.ntotal == 0:
                return []
            normalized = self._normalize(query_vector.astype(np.float32).reshape(1, -1))
            scores, indices = self._index.search(normalized, min(top_k, self._index.ntotal))
            results: list[tuple[str, float]] = []
            for score, idx in zip(scores[0], indices[0], strict=True):
                if idx < 0:
                    continue
                results.append((self._ids[idx], float(score)))
            return results

    @staticmethod
    def _normalize(vectors: np.ndarray) -> np.ndarray:
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)
        return vectors / norms
