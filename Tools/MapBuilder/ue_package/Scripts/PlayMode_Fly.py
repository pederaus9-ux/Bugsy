"""Switch this level to fly mode (free camera pawn at the PlayerStarts)."""
import importlib.util
import os

_spec = importlib.util.spec_from_file_location("playable", os.path.join(os.path.dirname(os.path.abspath(__file__)), "06_Playable.py"))
_p = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_p)
_p.set_play_mode("fly")
