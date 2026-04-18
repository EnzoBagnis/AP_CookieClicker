import typing
from dataclasses import dataclass
from Options import Choice, Option, Toggle, DefaultOnToggle, Range, OptionList, DeathLink, PerGameCommonOptions

class Goal(Choice):
    """Victory condition.
    achievements: complete a configurable number of achievements.
    buildings: unlock a configurable target building (and every building before it in the canonical order).
    achievements_and_buildings: both conditions above must be satisfied.
    The parameter for the unused goal is ignored.
    """
    display_name = "Goal"
    option_achievements = 0
    option_buildings = 1
    option_achievements_and_buildings = 2
    default = 2

class AchievementGoal(Range):
    """Number of achievements required to win.
    Only used when Goal is 'achievements' or 'achievements_and_buildings'."""
    display_name = "Achievement Goal"
    range_start = 1
    range_end = 639
    default = 100

class BuildingGoal(Choice):
    """Final building whose unlock is required to win.
    All buildings preceding it in the canonical order are required too.
    Only used when Goal is 'buildings' or 'achievements_and_buildings'."""
    display_name = "Building Goal"
    option_cursor = 0
    option_farm = 1
    option_mine = 2
    option_factory = 3
    option_bank = 4
    option_temple = 5
    option_wizard_tower = 6
    option_shipment = 7
    option_alchemy_lab = 8
    option_portal = 9
    option_time_machine = 10
    option_antimatter_condenser = 11
    option_prism = 12
    option_chancemaker = 13
    option_fractal_engine = 14
    option_javascript_console = 15
    option_idleverse = 16
    option_cortex_baker = 17
    option_you = 18
    default = 18

class Traps(Range):
    """Traps Percentage"""
    display_name = "Traps Percentage"
    range_start = 1
    range_end = 70
    default = 50

class ProductionMultiplier(Range):
    """Production multiplier, as a power of ten
        0 (x1): Vanilla
        1/2 (x10/x100): Slightly faster early game
        3 (x1000): Suitable for sync (completion in several hours)
        4 (x10.000): Suitable for sync (completion in about 1 hour)
        5 (x100.000): You can stop now.
    """
    display_name = "Production Multiplier (power of ten)"
    range_start = 0
    range_end = 5
    default = 0

class LumpMultiplier(Range):
    """Lump multiplier"""
    display_name = "Lump Multiplier"
    range_start = 1
    range_end = 10
    default = 1

class EnableAutoHints(Toggle):
    """Enable revealing the items in adjacent locations when completing an achievement"""
    display_name = "Enable Auto Hints"

@dataclass
class CCOptions(PerGameCommonOptions):
    goal: Goal
    advancement_goal: AchievementGoal
    building_goal: BuildingGoal
    traps_percentage: Traps
    enable_hints: EnableAutoHints
    production_multiplier: ProductionMultiplier
    lump_multiplier: LumpMultiplier
