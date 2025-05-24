"""
ClaudeInstance and related data models.
"""
from dataclasses import dataclass, field
from enum import Enum, auto
from typing import Optional, Dict, Any, List
import time
import uuid


class InstanceStatus(str, Enum):
    """Status of a Claude instance."""
    INITIALIZING = "initializing"
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


class RuntimeType(str, Enum):
    """Type of runtime for an instance."""
    TMUX = "tmux"
    TERMINAL = "terminal"


class DetailedStatus(str, Enum):
    """Detailed status of a running instance."""
    READY = "ready"
    RUNNING = "running"
    WAITING = "waiting"


@dataclass
class ClaudeInstance:
    """
    Represents a Claude instance with its properties and state.
    """
    id: str
    project_dir: str
    prompt_path: str
    start_time: float
    status: InstanceStatus = InstanceStatus.INITIALIZING
    yes_count: int = 0
    last_yes_time: Optional[float] = None
    use_tmux: bool = True  # Legacy field, use runtime_type instead for new code
    runtime_type: RuntimeType = RuntimeType.TMUX
    tmux_session_name: Optional[str] = None  # Legacy field, use runtime_id instead for new code
    terminal_id: Optional[str] = None  # Legacy field, use runtime_id instead for new code
    runtime_id: Optional[str] = None  # Either tmux session name or terminal ID
    detailed_status: DetailedStatus = DetailedStatus.READY
    active_since: Optional[float] = None
    ready_since: Optional[float] = None
    generation_time: str = "0s"
    content: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    open_terminal: bool = False
    tmux_content: Optional[str] = None  # Content captured from tmux session

    @classmethod
    def create(cls, project_dir: str, prompt_path: str, 
               runtime_type: RuntimeType = RuntimeType.TMUX,
               open_terminal: bool = False) -> 'ClaudeInstance':
        """Factory method to create a new instance with defaults."""
        # Import path utilities at the method level to avoid circular imports
        from src.utils.path_utils import normalize_path
        
        # Normalize project directory to ensure consistency
        normalized_project_dir = normalize_path(project_dir)
        
        instance_id = str(uuid.uuid4())
        return cls(
            id=instance_id,
            project_dir=normalized_project_dir,
            prompt_path=prompt_path,
            start_time=time.time(),
            status=InstanceStatus.INITIALIZING,
            runtime_type=runtime_type,
            use_tmux=runtime_type == RuntimeType.TMUX,
            open_terminal=open_terminal
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert instance to dictionary for serialization."""
        return {
            "id": self.id,
            "project_dir": self.project_dir,
            "prompt_path": self.prompt_path,
            "start_time": self.start_time,
            "status": self.status,
            "yes_count": self.yes_count,
            "last_yes_time": self.last_yes_time,
            "use_tmux": self.use_tmux,
            "runtime_type": self.runtime_type,
            "tmux_session_name": self.tmux_session_name,
            "terminal_id": self.terminal_id,
            "runtime_id": self.runtime_id,
            "detailed_status": self.detailed_status,
            "active_since": self.active_since,
            "ready_since": self.ready_since,
            "generation_time": self.generation_time,
            "metadata": self.metadata,
            "open_terminal": self.open_terminal,
            "tmux_content": self.tmux_content
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ClaudeInstance':
        """Create instance from dictionary."""
        # Handle legacy data by ensuring all required fields exist
        instance_id = data.pop("id", str(uuid.uuid4()))
        
        # Handle enum conversion
        if "status" in data and isinstance(data["status"], str):
            data["status"] = InstanceStatus(data["status"])
        if "runtime_type" in data and isinstance(data["runtime_type"], str):
            data["runtime_type"] = RuntimeType(data["runtime_type"])
        if "detailed_status" in data and isinstance(data["detailed_status"], str):
            data["detailed_status"] = DetailedStatus(data["detailed_status"])
            
        # For backward compatibility
        if "runtime_type" not in data and "use_tmux" in data:
            data["runtime_type"] = RuntimeType.TMUX if data["use_tmux"] else RuntimeType.TERMINAL
            
        # For backward compatibility with runtime_id
        if "runtime_id" not in data:
            if data.get("tmux_session_name"):
                data["runtime_id"] = data["tmux_session_name"]
            elif data.get("terminal_id"):
                data["runtime_id"] = data["terminal_id"]
        
        return cls(id=instance_id, **data)
