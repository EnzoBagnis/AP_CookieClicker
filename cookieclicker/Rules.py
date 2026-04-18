from worlds.generic.Rules import add_rule, forbid_item
from .Options import Goal
from .Locations import (
    cursor_achievements,
    grandma_achievements,
    farm_achievements,
    mine_achievements,
    factory_achievements,
    bank_achievements,
    temple_achievements,
    wizard_tower_achievements,
    shipment_achievements,
    alchemy_lab_achievements,
    portal_achievements,
    time_machine_achievements,
    antimatter_condenser_achievements,
    prism_achievements,
    chancemaker_achievements,
    fractal_engine_achievements,
    javascript_console_achievements,
    idleverse_achievements,
    cortex_baker_achievements,
    you_achievements,
    total_cookies_achievements,
    total_cps_achievements,
    achievements,
    location_table,
)

CURSOR = "Cursor"
GRANDMA = "Grandma"
FARM = "Farm"
MINE = "Mine"
FACTORY = "Factory"
BANK = "Bank"
TEMPLE = "Temple"
WIZARD_TOWER = "Wizard Tower"
SHIPMENT = "Shipment"
ALCHEMY_LAB = "Alchemy Lab"
PORTAL = "Portal"
TIME_MACHINE = "Time Machine"
ANTIMATTER_CONDENSER = "Antimatter Condenser"
PRISM = "Prism"
CHANCEMAKER = "Chancemaker"
FRACTAL_ENGINE = "Fractal Engine"
JAVASCRIPT_CONSOLE = "Javascript Console"
IDLEVERSE = "Idleverse"
CORTEX_BAKER = "Cortex Baker"
YOU = "You"

# Grandma is always available, so not listed here
building_unlock_items = {
    CURSOR: ("Unlock Cursor", cursor_achievements),
    FARM: ("Unlock Farm", farm_achievements),
    MINE: ("Unlock Mine", mine_achievements),
    FACTORY: ("Unlock Factory", factory_achievements),
    BANK: ("Unlock Bank", bank_achievements),
    TEMPLE: ("Unlock Temple", temple_achievements),
    WIZARD_TOWER: ("Unlock Wizard Tower", wizard_tower_achievements),
    SHIPMENT: ("Unlock Shipment", shipment_achievements),
    ALCHEMY_LAB: ("Unlock Alchemy Lab", alchemy_lab_achievements),
    PORTAL: ("Unlock Portal", portal_achievements),
    TIME_MACHINE: ("Unlock Time Machine", time_machine_achievements),
    ANTIMATTER_CONDENSER: ("Unlock Antimatter Condenser", antimatter_condenser_achievements),
    PRISM: ("Unlock Prism", prism_achievements),
    CHANCEMAKER: ("Unlock Chancemaker", chancemaker_achievements),
    FRACTAL_ENGINE: ("Unlock Fractal Engine", fractal_engine_achievements),
    JAVASCRIPT_CONSOLE: ("Unlock Javascript Console", javascript_console_achievements),
    IDLEVERSE: ("Unlock Idleverse", idleverse_achievements),
    CORTEX_BAKER: ("Unlock Cortex Baker", cortex_baker_achievements),
    YOU: ("Unlock You", you_achievements),
}

# Canonical Cookie Clicker building unlock order (Grandma is always available).
# Each sphere reveals exactly one building unlock, in this order.
ordered_buildings = [
    CURSOR, FARM, MINE, FACTORY,
    BANK, TEMPLE, WIZARD_TOWER, SHIPMENT,
    ALCHEMY_LAB, PORTAL, TIME_MACHINE, ANTIMATTER_CONDENSER,
    PRISM, CHANCEMAKER, FRACTAL_ENGINE,
    JAVASCRIPT_CONSOLE, IDLEVERSE, CORTEX_BAKER, YOU,
]
ordered_unlocks = [building_unlock_items[b][0] for b in ordered_buildings]

# ── General achievements organized by progression difficulty ──
# Achievements not listed here remain always available (tier 0 / sphere 0)

# Require 4 building unlocks (early-mid game)
general_require_4 = [
    # Click milestones
    "Clickolympics", "Clickorama",
    # Building/upgrade count
    "Builder", "Architect",
    "Enhancer", "Augmenter",
    # Building milestones
    "One with everything", "Mathematician", "Base 10",
    # Golden cookie progression
    "Leprechaun", "Black cat's paw",
    # First ascensions
    "Sacrifice", "Oblivion", "From scratch",
    "Rebirth", "Resurrection", "Reincarnation",
    # Grandmapocalypse (needs time to trigger)
    "Grandmapocalypse", "Wrath cookie",
    "Elder nap", "Elder slumber", "Elder calm",
    "Wrinkler poker",
    # Sugar lumps (first milestones)
    "Dude, sweet", "Sugar rush",
    # Seasonal events
    "Spooky cookies",
    "Coming to town", "All hail Santa", "Let it snow",
    "Oh deer", "Sleigh of hand]", "Reindeer sleigher",
    "Lovely cookies",
    "The hunt is on", "Egging on", "Mass Easteria", "Hide & seek champion",
]

# Require 8 building unlocks (mid game)
general_require_8 = [
    # Click milestones
    "Clickasmic", "Clickageddon", "Clicknarok",
    # Building/upgrade count
    "Engineer",
    "Upgrader",
    # Building milestones
    "Centennial", "Centennial and a half",
    "Bicentennial", "Bicentennial and a half",
    # Golden cookie
    "Thick-skinned", "Jellicles",
    "Four-leaf cookie", "Seven horseshoes",
    # Ascension progression
    "Nihilism", "Dematerialize", "Nil zero zilch",
    "When the cookies ascend just right",
    # Wrinklers
    "Itchscratcher", "Wrinklesquisher", "Moistburster",
    "In her likeness",
    # Sugar lumps
    "Year's worth of cavities", "Hand-picked",
    "All-natural cane sugar",
    # Dragon
    "Here be dragon",
    # Seasonal
    "Eldeer",
    # Misc
    "O Fortuna",
    "Endless cycle",
    "No time like the present",
]

# Require 12 building unlocks (mid-late game)
general_require_12 = [
    # Click milestones
    "Clickastrophe", "Clickataclysm",
    # Building/upgrade count
    "Lord of Constructs",
    "Lord of Progress",
    "Polymath", "Renaissance baker",
    # Building milestones
    "Tricentennial", "Tricentennial and a half",
    "Quadricentennial", "Quadricentennial and a half",
    # Golden cookie
    "Just plain lucky",
    # Ascension progression
    "Transcendence", "Obliterate", "Negative void",
    "To crumbs, you say?", "You get nothing", "Humble rebeginnings",
    "The end of the world", "Oh, you're back", "Lazarus",
    # Sugar lumps
    "Sugar sugar", "Sweetmeats",
    "Maillard reaction",
    # Seasonal
    "Baby it's old outside",
    # Misc
    "Cookie Clicker",
    "Last Chance to See",
    "So much to do so much to see",
]

# Require 16 building unlocks (late/endgame)
general_require_16 = [
    # Click milestones
    "The ultimate clickdown", "All the other kids with the pumped up clicks",
    "One...more...click...", "Clickety split",
    "Ain't that a click in the head", "What's not clicking",
    # Building/upgrade count
    "Grand design", "Ecumenopolis", "Myriad",
    "The full picture", "When there's nothing left to add",
    "Kaizen", "Beyond quality", "Oft we mar what's well",
    "All the stars in heaven",
    # Building milestones
    "Quincentennial", "Quincentennial and a half",
    "Sexcentennial", "Sexcentennial and a half",
    "Septcentennial",
    # Ascension
    "Smurf account", "If at first you don't succeed",
    "No more room in hell",
]

# Achievements requiring a specific building unlock (minigame features)
require_wizard_tower = [
    "Bibbidi-bobbidi-boo", "I'm the wiz", "A wizard is you",
]

require_farm = [
    "Botany enthusiast", "Green, aching thumb",
    "In the garden of Eden (baby)",
    "Keeper of the conservatory", "Seedless to nay",
]

require_bank = [
    "Initial public offering", "Rookie numbers",
    "No nobility in poverty", "Full warehouses",
    "Make my day", "Buy buy buy",
    "Pyramid scheme", "Liquid assets",
    "Debt evasion", "Gaseous assets",
]


def set_rules(self: "CookieClicker"):
    world  = self.multiworld
    player = self.player

    def count_unlocks(state, unlock_list):
        return sum(1 for item in unlock_list if state.has(item, player))

    # ── Identify location tiers for item placement restrictions ──
    cookie_list = list(total_cookies_achievements.keys())
    cookie_chunk = len(cookie_list) // 3
    cps_list = list(total_cps_achievements.keys())
    cps_chunk = len(cps_list) // 3

    gated_general = set(
        general_require_4 + general_require_8 + general_require_12 + general_require_16 +
        require_wizard_tower + require_farm + require_bank
    )
    general_tier_0 = [name for name in achievements.keys() if name not in gated_general]

    # Tier 0: always accessible (sphere 0) — only "Unlock Cursor" is allowed here.
    tier_0_locations = (
        list(grandma_achievements.keys()) +
        cookie_list[:cookie_chunk] +
        cps_list[:cps_chunk] +
        general_tier_0
    )

    # Locations gated by total unlock count (not by a specific building) — no
    # building unlocks allowed here, keeping the linear sphere chain clean.
    count_gated_locations = (
        general_require_4 + general_require_8 + general_require_12 + general_require_16 +
        require_wizard_tower + require_farm + require_bank +
        cookie_list[cookie_chunk:] + cps_list[cps_chunk:]
    )

    def restrict_to_single_unlock(location, allowed_unlock):
        for unlock in ordered_unlocks:
            if unlock != allowed_unlock:
                forbid_item(location, unlock, player)

    # ── Strict linear unlock placement ──
    # Tier 0 → only "Unlock Cursor" allowed (found in sphere 1).
    for loc_name in tier_0_locations:
        location = world.get_location(loc_name, player)
        restrict_to_single_unlock(location, ordered_unlocks[0])

    # Building[i] achievements → only "Unlock[i+1]" allowed.
    # The last building's achievements (YOU) get no unlock at all.
    for i, building_name in enumerate(ordered_buildings):
        _, achievement_list = building_unlock_items[building_name]
        allowed = ordered_unlocks[i + 1] if i + 1 < len(ordered_unlocks) else None
        for loc_name in achievement_list:
            location = world.get_location(loc_name, player)
            restrict_to_single_unlock(location, allowed)

    # Count-gated locations → no building unlocks allowed.
    for loc_name in count_gated_locations:
        location = world.get_location(loc_name, player)
        restrict_to_single_unlock(location, None)

    # ── 1) Building achievements: require own unlock + all earlier buildings ──
    for i, building_name in enumerate(ordered_buildings):
        _, achievement_list = building_unlock_items[building_name]
        required = ordered_unlocks[:i + 1]
        for loc_name in achievement_list:
            location = world.get_location(loc_name, player)
            for req in required:
                add_rule(location, lambda state, r=req: state.has(r, player))

    # ── 2) Total cookies achievements: progressive gating by building count ──
    for loc_name in cookie_list[cookie_chunk:2 * cookie_chunk]:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 4)
    for loc_name in cookie_list[2 * cookie_chunk:]:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 10)

    # ── 3) Total CPS achievements: progressive gating by building count ──
    for loc_name in cps_list[cps_chunk:2 * cps_chunk]:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 4)
    for loc_name in cps_list[2 * cps_chunk:]:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 10)

    # ── 4) General achievements: tiered by game progression difficulty ──
    for loc_name in general_require_4:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 4)
    for loc_name in general_require_8:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 8)
    for loc_name in general_require_12:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 12)
    for loc_name in general_require_16:
        add_rule(world.get_location(loc_name, player),
                 lambda state: count_unlocks(state, ordered_unlocks) >= 16)

    # ── 5) Achievements requiring specific building unlocks (minigame features) ──
    for loc_name in require_wizard_tower:
        add_rule(world.get_location(loc_name, player),
                 lambda state: state.has("Unlock Wizard Tower", player))
    for loc_name in require_farm:
        add_rule(world.get_location(loc_name, player),
                 lambda state: state.has("Unlock Farm", player))
    for loc_name in require_bank:
        add_rule(world.get_location(loc_name, player),
                 lambda state: state.has("Unlock Bank", player))

    # ── 6) Victory: honor configured Goal ──
    victory_location = world.get_location("Victory location", player)

    goal_type = self.options.goal.value            # 0 ach, 1 buildings, 2 both
    achievement_target = self.options.advancement_goal.value
    building_goal_index = self.options.building_goal.value  # 0..18

    required_building_unlocks = tuple(ordered_unlocks[:building_goal_index + 1])
    countable_achievement_locs = tuple(
        loc_name for loc_name in location_table.keys()
        if loc_name != "Victory location"
    )

    def buildings_satisfied(state):
        return all(state.has(u, player) for u in required_building_unlocks)

    def achievements_satisfied(state):
        count = 0
        for loc_name in countable_achievement_locs:
            if state.can_reach_location(loc_name, player):
                count += 1
                if count >= achievement_target:
                    return True
        return False

    if goal_type == Goal.option_buildings:
        add_rule(victory_location, lambda state: buildings_satisfied(state))
    elif goal_type == Goal.option_achievements:
        add_rule(victory_location, lambda state: achievements_satisfied(state))
    else:  # option_achievements_and_buildings
        add_rule(victory_location,
                 lambda state: buildings_satisfied(state) and achievements_satisfied(state))

    self.multiworld.completion_condition[player] = lambda state: state.has("Victory", self.player)
