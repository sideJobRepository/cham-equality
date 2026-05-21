from pathlib import Path


def find_project_root() -> Path:
    start = Path(__file__).resolve()
    for p in [start, *start.parents]:
        if (p / 'pyproject.toml').exists():
            return p
    raise RuntimeError('pyproject.toml not found')


PROJECT_ROOT = find_project_root()
RESOURCES = PROJECT_ROOT / 'resources'
GENERATED = PROJECT_ROOT / 'generated'
