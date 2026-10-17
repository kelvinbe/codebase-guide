from pathlib import Path
from collections import Counter
import ast
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Codebase Guide API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local development prototype: only index directories you explicitly submit.
PROJECT_ROOT: Path | None = None

IGNORED_DIRS = {
    ".git", ".next", "node_modules", ".venv", "venv",
    "dist", "build", "__pycache__", ".idea", ".vscode",
    "coverage", ".turbo",
}

ALLOWED_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".py", ".java", ".go", ".rs", ".php", ".rb",
    ".json", ".md", ".html", ".css", ".scss",
    ".yaml", ".yml", ".toml", ".sql", ".sh",
}

MAX_FILE_BYTES = 500_000
MAX_INDEXED_FILES = 5_000


class IndexRequest(BaseModel):
    path: str


class QuestionRequest(BaseModel):
    question: str


def ensure_project() -> Path:
    if PROJECT_ROOT is None:
        raise HTTPException(
            status_code=400,
            detail="No project indexed yet. Submit a project path first.",
        )
    return PROJECT_ROOT


def safe_file_path(relative_path: str) -> Path:
    root = ensure_project()
    candidate = (root / relative_path).resolve()

    if not candidate.is_relative_to(root):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    if not candidate.is_file():
        raise HTTPException(status_code=404, detail="File not found.")

    return candidate


def scan_files(root: Path) -> list[Path]:
    files: list[Path] = []

    for current, dirs, names in os.walk(root, followlinks=False):
        dirs[:] = [
            name for name in dirs
            if name not in IGNORED_DIRS
            and not (Path(current) / name).is_symlink()
        ]

        for name in names:
            path = Path(current) / name

            if path.is_symlink():
                continue

            if path.suffix.lower() not in ALLOWED_EXTENSIONS:
                continue

            try:
                if path.stat().st_size <= MAX_FILE_BYTES:
                    files.append(path)
            except OSError:
                continue

            if len(files) >= MAX_INDEXED_FILES:
                return files

    return files


def relative_path(path: Path, root: Path) -> str:
    return path.relative_to(root).as_posix()


def read_source(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return ""


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Codebase Guide API"}


@app.post("/api/index")
def index_project(request: IndexRequest):
    global PROJECT_ROOT

    supplied = Path(request.path).expanduser()

    try:
        root = supplied.resolve(strict=True)
    except (OSError, RuntimeError):
        raise HTTPException(status_code=400, detail="Project path does not exist.")

    if not root.is_dir():
        raise HTTPException(status_code=400, detail="Path must be a directory.")

    files = scan_files(root)
    PROJECT_ROOT = root

    extensions = Counter(path.suffix.lower() or "(no extension)" for path in files)

    return {
        "project": root.name,
        "path": str(root),
        "file_count": len(files),
        "extensions": dict(extensions),
        "files": [
            {
                "path": relative_path(path, root),
                "name": path.name,
                "extension": path.suffix.lower(),
            }
            for path in files
        ],
        "message": "Project indexed. File contents can now be inspected.",
    }


@app.get("/api/tree")
def get_tree():
    root = ensure_project()
    files = scan_files(root)

    tree: dict = {}

    for path in files:
        parts = Path(relative_path(path, root)).parts
        current = tree

        for part in parts[:-1]:
            current = current.setdefault(part, {})

        current[parts[-1]] = None

    return {"project": root.name, "tree": tree}


@app.get("/api/file")
def get_file(path: str):
    root = ensure_project()
    target = safe_file_path(path)

    if target.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported source file.")

    if target.stat().st_size > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File is too large.")

    content = read_source(target)

    return {
        "path": relative_path(target, root),
        "content": content,
        "lines": len(content.splitlines()),
    }


@app.post("/api/ask")
def ask_question(request: QuestionRequest):
    root = ensure_project()
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    files = scan_files(root)
    terms = {
        term.lower()
        for term in question.replace("?", " ").replace(".", " ").split()
        if len(term) >= 3
    }

    results = []

    for path in files:
        content = read_source(path)
        if not content:
            continue

        relative = relative_path(path, root)
        path_terms = set(relative.lower().replace("/", " ").replace(".", " ").split())
        score = len(terms & path_terms)

        matching_lines = []

        for number, line in enumerate(content.splitlines(), start=1):
            lowered = line.lower()

            if any(term in lowered for term in terms):
                matching_lines.append({
                    "line": number,
                    "text": line.strip()[:300],
                })
                score += 1

        if score:
            results.append({
                "path": relative,
                "score": score,
                "matching_lines": matching_lines[:8],
            })

    results.sort(key=lambda item: item["score"], reverse=True)
    results = results[:8]

    if not results:
        return {
            "question": question,
            "answer": (
                "I couldn't find source lines matching the words in your question. "
                "Try using a function name, component name, API route, or variable."
            ),
            "sources": [],
            "mode": "keyword-search",
        }

    sources_text = "\n".join(
        f"- {item['path']}: "
        + "; ".join(
            f"line {match['line']}: {match['text']}"
            for match in item["matching_lines"][:3]
        )
        for item in results
    )

    return {
        "question": question,
        "answer": (
            "I found potentially relevant code using keyword search. "
            "These are candidate matches, not a verified explanation of the "
            "full execution flow. Review the referenced lines to follow the "
            "implementation.\n\n" + sources_text
        ),
        "sources": results,
        "mode": "keyword-search",
    }
