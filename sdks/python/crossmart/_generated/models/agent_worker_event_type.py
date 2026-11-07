from enum import StrEnum


class AgentWorkerEventType(StrEnum):
    ACTION_DECIDED = "action_decided"
    ACTION_PROPOSED = "action_proposed"
    ERROR = "error"
    MESSAGE = "message"
    TEXT_DELTA = "text_delta"
    TOOL_FINISHED = "tool_finished"
    TOOL_STARTED = "tool_started"
    TURN_FINISHED = "turn_finished"
    TURN_STARTED = "turn_started"

    def __str__(self) -> str:
        return str(self.value)
