"""Make the press/ scripts importable in tests."""
import sys
from pathlib import Path

PRESS_DIR = Path(__file__).resolve().parent.parent
if str(PRESS_DIR) not in sys.path:
    sys.path.insert(0, str(PRESS_DIR))
