# Trempealeau County — Open-World Game Design Doc

**Status:** v1 (GTA-style direction) — Sep 27, 2026
**Supersedes:** `storm-chaser-game-design-doc.md` (retired — that was the documentarian concept)
**Engine:** Unreal Engine 5.6 | **Platform:** PC | **Map:** 1:1 Trempealeau County, WI, 49×49 km (see `storm-chaser-map-pipeline-claude-brief.md`)

## One-line pitch

A GTA-style open-world action game on a 1:1 recreation of Trempealeau County, Wisconsin — where violent severe weather isn't backdrop, it's the system trying to kill you.

## Design pillars

1. **Real ground.** The county is the map — every road, town, bridge, and river real. Locals navigate by memory; that's the marketing hook.
2. **The sky is the enemy.** Severe weather hits often and hits hard: tornadoes, hail, flash floods. It destroys, blocks, and reshapes the play space in real time.
3. **Rural sandbox.** Country life as gameplay: trucking, farm work, hunting, dirt-track racing, flying, emergency response.
4. **Consequences stick.** Storm damage persists, the sheriff remembers, money matters.

## Player fantasy (open — needs Austin's call)

A newcomer doing odd jobs across the county, pulled into bigger trouble. Alternatives: a local trying to save the family farm; an ex-storm-chaser turned drifter. See open questions.

## Core loop

Free-roam sandbox: take jobs → earn cash → buy vehicles, gear, property → unlock mission threads. Dynamic weather events interrupt everything — a tornado warning mid-job is the game's signature moment.

## Signature system: severe weather

- **Frequency:** much higher than real life — "high severe weather rate" per Austin. Storms are content, not rare events.
- **Tornadoes:** EF0–EF3+, real paths across real towns. Damage swaths persist: flattened barns, debris-blocked roads, power out.
- **Hail:** tiered vehicle damage — shattered windshields, dented bodywork affecting handling and visibility.
- **Flash flooding:** low roads and bridge crossings flood; chokepoints close mid-drive.
- **Warnings:** county sirens, NOAA radio alerts, phone alerts — diegetic warning systems. Getting caught in the open is on you.
- **Aftermath gameplay:** downed trees and power lines, volunteer fire/EMS emergency jobs, damage surveys, a repair economy.

## On-foot & driving

- **Driving:** arcade-sim middle — readable, not punishing. Vehicle roster: pickups, semis (I-94 trucking), muscle cars, ATVs, snowmobiles, farm equipment.
- **On-foot:** GTA-style third person. Keep on-foot systems light in v1.
- **Police:** county sheriff with realistic slow rural response times — that's a feature, not a bug. You can outrun the law, but they remember.

## Economy & jobs

- Trucking routes (I-94 corridor + county deliveries), farm work contracts (planting/harvest), hunting/fishing licenses with seasons, deliveries, repo work.
- Buy: vehicles, upgrades (hail armor is real here), property (garage, farmhouse).

## Activities (from the map data)

Dirt-track racing, 6 airstrips (flying), quarries, campgrounds, hunting land, state trail (ATV/snowmobile), the I-94 truck stop as a social hub.

## The map as a mechanic

- **Road hierarchy:** highways fast, county roads medium, town/minimum-maintenance roads slow and flood-prone.
- **Bridges = chokepoints; rivers = barriers** when flooding.
- **Towns as hubs:** Whitehall (county seat — sheriff, hospital, courthouse), Arcadia (industry), Osseo (I-94), Blair, Independence, Ettrick.
- **Landmarks:** the 38 easter-egg locations (`storm-chaser-landmarks.md`) double as mission locations, fuel stops, and hideouts.

## The scale question (honest flag for Austin)

1:1 rural is ENORMOUS and EMPTY compared to GTA. Whitehall → Arcadia ≈ 20 km ≈ 15–20 real minutes of driving. GTA V crosses its entire map in ~5 minutes. At 1:1, most of the map is fields and forest with nothing to do.

Options:
- **(a) Keep 1:1, make traversal the game:** fast vehicles, highway cruising, radio, random road events, weather threats en route.
- **(b) Compress to ~1:2 or 1:3:** still "the county," just denser.
- **(c) 1:1 with content corridors:** action concentrated along US-53 / I-94 / towns; wilderness as atmospheric transit.

**Recommendation: (a) + (c).** Keep the 1:1 bragging right — "every road real" IS the hook — but design content along corridors and make driving itself fun. The weather system fills the emptiness: a tornado on the horizon is content you can see for miles.

## Scope control

**V1:** single-player, ground + air vehicles, weather system, jobs, one story thread, light sheriff system.
**Later:** multiplayer, winter season (snowmobile gameplay), expanded story, modding support.

**Explicitly out of V1:** heavy on-foot combat systems, multiplayer, second county.

## Open questions for Austin

1. Protagonist: newcomer drifter, local saving the farm, or ex-storm-chaser?
2. Story vs. pure sandbox: how much scripted story in v1?
3. Scale: 1:1 or compressed? (see above — recommendation: keep 1:1)
4. Tone: straight GTA crime, or cleaner (odd jobs, no glorified crime)? This decides how the sheriff system and story work.
