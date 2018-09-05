from enum import Enum


class AugmentedEnum(Enum):
    def __hash__(self):
        return self.value.__hash__()

    def __eq__(self, other):
        if isinstance(other, type(self)) or isinstance(other, str):
            return self.value == other
        return False

    def __str__(self) -> str:
        return self.value


class Axis(AugmentedEnum):
    OBS = "obs"
    VAR = "var"