from enum import StrEnum


class EtsyWhenMade(StrEnum):
    BEFORE_1700 = "before_1700"
    BEFORE_2007 = "before_2007"
    MADE_TO_ORDER = "made_to_order"
    VALUE_1 = "2020_2026"
    VALUE_10 = "1950s"
    VALUE_11 = "1940s"
    VALUE_12 = "1930s"
    VALUE_13 = "1920s"
    VALUE_14 = "1910s"
    VALUE_15 = "1900s"
    VALUE_16 = "1800s"
    VALUE_17 = "1700s"
    VALUE_2 = "2010_2019"
    VALUE_3 = "2007_2009"
    VALUE_5 = "2000_2006"
    VALUE_6 = "1990s"
    VALUE_7 = "1980s"
    VALUE_8 = "1970s"
    VALUE_9 = "1960s"

    def __str__(self) -> str:
        return str(self.value)
