# STORMCHASER — Technical Design Document

**Engine:** Unreal Engine 5.6 · **Targets:** PC (DX12/Vulkan, SM6), iOS/Android high tier · **Genre:** Systemic open-world life sim with emergent disasters (GTA-style), solo or up to 16-player sessions (dedicated server)
**Doc owner:** Lead Systems Architect / TD · **Status:** v1.1 (random, unplanned storms; prompt-free open world)

> Conventions used throughout
> - All storm math runs in **SI units (m, s, kg, N)** inside the `StormCore` module. Convert only at the engine boundary: `m = uu * 0.01`, and a force in N becomes `N * 100` for `AddForce` (UE force units are kg·cm/s²).
> - UE is **left-handed, Z-up**. `FVector::CrossProduct(Up, R)` rotates **clockwise** seen from above. Cyclonic (counter-clockwise, northern hemisphere) spin therefore needs `s = -1` (see §2.1).
> - "Server" means the authoritative dedicated server. Anything that changes gameplay state is server-authoritative. Clients only make cosmetic decisions locally.
> - Anything marked **[VERIFY 5.6]** depends on an engine feature whose API or maturity changes between point releases. Confirm it against the 5.6 source before you lock the implementation.

---

## 0. Architecture at a Glance

```
                ┌───────────────────── UStormWorldSubsystem (server + client) ─────────────────────┐
                │  Registry of AStormActor · SampleWind(P,t) batch API · Material Param Collection │
                └──────┬──────────────────────┬──────────────────────────┬─────────────────────────┘
                       │ analytic field       │ same formula (HLSL)      │ same formula (Niagara HLSL)
         ┌─────────────▼────────┐   ┌─────────▼──────────┐    ┌──────────▼───────────┐
         │ UWindReceiverComponent│   │ MF_StormWind (WPO) │    │ NM_StormWind (GPU)   │
         │ players/props/vehicles│   │ foliage/cloth/flags│    │ Tier-0 debris/dust   │
         └─────────────┬────────┘   └────────────────────┘    └──────────────────────┘
                       │ forces (async physics tick)
         ┌─────────────▼─────────────┐      break events       ┌────────────────────────┐
         │ Chaos rigid bodies (T2/T3)│◄────────────────────────│ UStructuralIntegrityComp│
         │ Mass kinematic debris (T1)│                          │ (per ABasePlot, SoA)    │
         └───────────────────────────┘                          └────────────────────────┘
```

**The core design decision:** the wind field is a **closed-form, deterministic function** `V(P, t | StormNetState)`. The server replicates only a few bytes of storm state (seed, sampled parameters, path keys). Every machine can then evaluate the same wind at any point. This one choice drives:
1. **Netcode.** Player wind forces run inside client-side movement prediction with zero corrections, and cosmetic debris costs no bandwidth.
2. **Visual coherence.** Grass, trees, cloth, Niagara and physics all read the same field.
3. **Performance.** No fluid sim. A field sample costs about 60 flops.

---

## 1. Core Experience: A Living Open World Where Storms Just Happen

**Design rule:** there are no prompts, no storm timers, no schedules and no menus that tell the player what to do about a storm. Storms are **weather, not missions**. The world simulates weather continuously, whether or not anyone is watching. A tornado's strength, size, path, timing and lifespan are rolled at random when it forms (§2.0), and nobody, including the designers, knows what the next one will be. The player finds out the way a real person would, by reading the world.

### 1.1 The world

| Pillar | Spec |
|---|---|
| Map | **1:1 recreation of the lead's real home area** (§8): about **49 × 49 km (2,380 km²)** at true scale: the home village plus 10 more villages, one town, 21 hamlets, an interstate corridor, cropland, gravel roads, farmsteads, coulees and creeks (§8.9) |
| Time | Continuous day/night (1 in-game day = 48 real min). Seasons drive the climate (spring peak). No session phases, no cycles |
| Weather | The stormiest place in the country. Most days bring something: tornadoes, hail, derechos, lightning, floods, fog, dust, and ice or blizzards in winter. **Good days are rare** (15–25% by season, §2.0.5) |
| Population | Mass AI crowds and traffic that react to weather systemically (§4.2) |
| Player life | Houses, garages, vehicles, jobs, businesses. GTA-style freedom: drive, work, mess around, commit crimes, get chased |
| Storm opportunities | None forced, all emergent. Film storms and sell footage to the TV station, run storm tours, pick up salvage and repair contracts after damage, commit insurance fraud, loot (police respond), run rescue calls (EMS job) |
| Multiplayer | Public sessions of up to 16 players, or solo / invite-only. Cross-progression on properties, vehicles, cosmetics and money |

### 1.2 How the player learns a storm is coming (all diegetic)

| Signal | Typical lead time | Reliability |
|---|---|---|
| **Sky.** Supercell structure (volumetric, §5.7) visible from 30+ km: anvil, wall cloud, rotation, green tint | 10–60 min | Always there on a clear day. Useless at night or when rain-wrapped |
| **Radio / TV.** The in-world weather service gives a day outlook ("slight / enhanced / moderate risk") from the current atmosphere state | Hours | Probabilistic; often wrong, exactly like real forecasts |
| **Phone radar app.** Reflectivity and velocity rendered from the real simulation state. A skilled player can spot a hook echo or a velocity couplet before any warning is issued | Minutes | As good as the player's ability to read it (skill ceiling) |
| **Phone alert + town sirens.** Issued by the in-world warning service when it "detects" rotation (§2.0.4) | 0–20 min, random | About 20% of tornadoes are never warned, and about 30% of warnings are false alarms |
| **NPC behaviour.** People run inside, drive away, stop to film, or pull over under overpasses (a bad idea, as in reality). Shops drop their shutters | Seconds–minutes | Reactive: NPCs only respond to warnings or to what they can see |
| **Senses.** Wind shift, hail, sudden calm, the freight-train roar, the pressure drop in the audio, power flickers and lines coming down | Seconds | Always, but late |

There is **no HUD storm meter and no storm marker on the map**. Knowing how to read these signals is where the skill ceiling lives.

### 1.3 When a tornado is close (no choice menu)

Everything is systemic. The player can do anything that is physically possible in the world, and the physics decides the outcome:
- **Drive away.** Vehicles feel the real wind force (§2.6), so vans and trucks with tall, flat sides can blow over. Roads get blocked by debris and by fleeing traffic.
- **Get inside.** Protection is not a "safe zone" flag. It comes from the building itself: wind shadow (§3.6) plus the structure standing up (§3). A basement is excellent. An interior bathroom helps. A mobile home is a death trap.
- **Hold on.** A contextual grab, in the style of climbing and ledge-grab systems, with no button prompt. Hold the grab input near anything solid. Your grip strength against the wind decides whether you hang on (§2.6).
- **Get taken.** You get lifted, ragdoll, maybe survive, maybe open a parachute. This is the viral clip.
- **Film it.** Point the phone camera at it. What the footage is worth is only worked out later, when you sell it (§2.9).

Feedback is physical, never a UI element: camera buffeting, character lean and stumble animations, audio (roar, debris impacts, ear-pop), controller rumble and phone haptics.

### 1.4 Aftermath is part of the world, not a phase

- **Damage persists.** The Damage Ledger (§5.6) and the `DL_StormScars` data layer keep damaged houses, debris fields, snapped trees, downed power lines and closed roads. NPC repair crews fix things over several in-game days.
- **The economy reacts.** Construction prices go up in towns that were hit. Salvage and repair contracts appear. Property insurance pays out, or refuses.
- **Player property** takes real structural damage (§3). The loss is money and time, never account progression. Rebuilding and reinforcing the house is an ongoing choice, not a scheduled "build phase".

### 1.5 Clip generation (invisible)

The server raises `Event.Clip.Highlight` when a player is carried airborne faster than 25 m/s, is hit by an object heavier than 200 kg, is within 100 m of a funnel of EF3 or stronger, or sees a structure collapse with more than 20 joints. The client saves its rolling replay buffer (`UClipBufferComponent`, §4.2). Nothing appears on screen. The clip is waiting in the phone's gallery or in the replay editor.

---

## 2. Physics and Math Spec: Tornado Wind Field

### 2.0 Storm Generation: random, unplanned, emergent

Nothing about a tornado is authored per storm. The pipeline is **atmosphere → supercell → tornado**. Each stage is stochastic and seeded at runtime from server entropy (`FPlatformTime::Cycles64() ^ FPlatformMisc::GetMachineId hash`), never from a schedule. The seed is replicated, so clients reproduce the same storm (§5.2). **Random does not mean desynced.**

#### 2.0.1 Atmosphere simulation (`UAtmosphereSubsystem`, server, 0.2 Hz)

A coarse 2-D grid of 1 km cells, 65 × 65, covering the map plus an 8 km off-map margin on each side so storms can form outside the map and drift in. Each cell holds CAPE (J/kg), CIN (J/kg), LCL height (m), 0–1 km storm-relative helicity SRH (m²/s²) and 0–6 km bulk shear BWD (m/s).

- **Weather regime.** A Markov chain rolled once per in-game day over the regimes in §2.0.5 (clear through outbreak, plus winter regimes). The transition matrix lives in `DA_Climate`, is modulated by season, and is calibrated from the real local climate records (§8.2). Regimes set the target field means. The fields relax toward those means (τ = 2 in-game hours) with spatial Perlin noise, plus diurnal heating that peaks late in the afternoon.
- **Supercell initiation.** A Poisson process per cell. Hazard: `λ_SC = λ₀ · f(CAPE) · g(BWD) · h(CIN)` per in-game hour. Storms can therefore fire anywhere, at any time. Quiet weeks and wild outbreak days both emerge naturally.
- **Supercell motion.** Mean wind plus the Bunkers right-mover deviation, 7.5 m/s perpendicular to the shear vector.

#### 2.0.2 Tornadogenesis: the Significant Tornado Parameter

Each supercell evaluates the standard fixed-layer STP each minute from the cell it sits over:

```
STP = (CAPE/1500) · LCLterm · (SRH/150) · SHRterm · CINterm
      LCLterm = 1 if LCL < 1000 m;  0 if LCL > 2000 m;  (2000 − LCL)/1000 otherwise
      SHRterm = 0 if BWD < 12.5 m/s;  1.5 if BWD > 30 m/s;  BWD/20 otherwise
      CINterm = 1 if CIN > −50;  0 if CIN < −200;  (200 + CIN)/150 otherwise
Tornado hazard per minute:  λ_T = λ_T0 · max(STP, 0)      (λ_T0 ≈ 0.02)
```

A supercell can produce zero, one or several tornadoes in a row (cyclic tornadogenesis). After a tornado dies there is a random 3–10 min cooldown before the same cell can spawn again.

#### 2.0.3 Tornado parameters: sampled at genesis, never chosen

Intensity, size and lifespan are drawn together with a Gaussian copula. They are correlated, but independent enough that a tiny violent rope and a huge weak wedge are both possible.

```
z ~ N(0, Σ),   Σ = | 1    0.35  0.50 |      (intensity, size, duration)
                   | 0.35 1     0.30 |
                   | 0.50 0.30  1    |
z₁ ← z₁ + 0.35 · ln(1 + STP)                       (strong environments skew stronger, not deterministically)

Intensity:  u = Φ(z₁)  →  inverse CDF of the game climatology, then uniform within the band
            EF0 40% · EF1 30% · EF2 16% · EF3 9% · EF4 4% · EF5 1%     (real US is about 90% EF0–1; boosted for play)
            V_peak continuous: EF0 29–38 · EF1 38–49 · EF2 50–60 · EF3 61–74 · EF4 74–89 · EF5 89–135 m/s (/0.86 for B(10 m))
Size:       R_m0 = clamp( 45 m · e^(0.75·z₂) , 8 m, 450 m )
            → damage-path width (where v > 29 m/s) ≈ 2·R_m0·(1.4·V_peak/29) → 50 m ropes up to 4+ km wedges (El Reno scale)
Duration:   T_life = clamp( 180 s · e^(0.9·z₃) , 15 s, 45 min )
Height:     H ~ U(700, 1500) m (cloud base follows LCL)
Morphology: emerges from R_m0/H and I(t); never picked. Rope < 0.02 < cone < 0.08 < stovepipe < 0.15 < wedge
Multi-vortex:  P = sigmoid((R_m0 − 120)/40) if V_peak > 50;  count ~ U{2..6}; sub-vortex radius 0.15·R_m, orbit at 0.7·R_m
Rain-wrapped:  P = 0.25 (HP supercell); hides the funnel visually, radar still shows it
Satellite:     P = 0.10 if V_peak > 61; lifetime 20–90 s
```

#### 2.0.4 Procedural lifecycle (replaces the authored lifecycle curve)

```
Envelope:   E(t) = (t/t_p)^a · e^(a(1 − t/t_p)) · (1 − smoothstep(0.85·T_life, T_life, t))
            t_p ~ U(0.2, 0.6)·T_life ,  a ~ U(1.5, 4)                  (peak = 1 at t_p)
Wobble:     ε(t) = Ornstein–Uhlenbeck, σ = 0.15, τ = 15 s
Surges:     Poisson rate 1/60 s; Gaussian bump, amplitude ~ U(0.1, 0.3), width 8 s
I(t)      = clamp( E(t)·(1 + ε(t)) + Σ bumps , 0, 1.15 )
V_max(t)  = V_peak · I(t) · RopeBoost(t)
R_m(t)    = R_m0 · (1 + 0.15·ε_R(t)) · RopeShrink(t)                  (ε_R: an independent OU process)
Rope-out (final 20% of life):  RopeShrink goes 1 → 0.3 ;  RopeBoost = min(1.3, RopeShrink^(−0.5))
```

All OU processes are generated at fixed 1 s steps from the replicated seed with `FRandomStream`, and interpolated. Server and clients produce bit-identical `I(t)` and `R_m(t)` with no ongoing bandwidth.

**Warning service.** The in-world warning service "detects" a tornado with lead time `L ~ N(10 min, 6 min)` relative to genesis. If `L < 0` the warning comes late, and a random 20% of tornadoes are never warned at all. False-alarm warnings are raised on 30% of rotating supercells that never produce a tornado. The warning area is a polygon along the supercell's projected motion.

#### 2.0.5 Daily weather: mostly stormy, good days are rare

The map is set in the stormiest place in the country, so the **weather regime chain** (§2.0.1) is weighted heavily toward bad weather. Every in-game day draws a regime from a season-dependent Markov chain. Each regime sets the atmosphere field targets and turns on the hazard modules in §2.0.6. Regimes can also change *during* a day through the diurnal cycle: morning fog can burn off into afternoon supercells, and a clear morning can turn into an evening squall line.

**Peak-season daily share** (spring in the Plains; May–July for this map, §8.6):

| Regime (`Weather.Regime.*`) | Share | What it feels like |
|---|---|---|
| `Clear` (**good day**) | 8% | Blue sky, light wind, long golden-hour light |
| `FairBreezy` (**good day**) | 7% | Fair-weather cumulus, 5–10 m/s wind, dry roads |
| `OvercastDrizzle` | 12% | Low stratus, drizzle, morning fog, wet roads |
| `GeneralStorms` | 20% | Pop-up thunderstorms, lightning, heavy rain, gusty outflows |
| `SevereHailWind` | 20% | Non-tornadic supercells, big hail, downbursts, derecho segments |
| `Tornadic` | 18% | Supercells capable of tornadoes (STP-driven, §2.0.2) |
| `Outbreak` | 5% | Multiple tornadic supercells, some long-track |
| `FloodTraining` | 6% | Storms repeatedly crossing the same area, flash floods |
| `DryLineWind` | 4% | No storms, 15–25 m/s wind, blowing dust, grass-fire weather |

**Good-day share by season:** Spring 15% · Summer 20% (heat waves, derechos, fewer tornadoes) · Fall 25% (a second, smaller tornado peak) · Winter 20% (`IceStorm`, `Blizzard` and `ArcticClear` join the chain; tornadoes are rare but possible).

**Keeping good days sparse:** the chain has a low self-transition probability for good regimes (`P(Clear → Clear) = 0.30`) and a high one for stormy regimes (`0.55`). Good days usually arrive one at a time, and a run of three is a rare event. There is no "good-day pity" either. The calendar is `DA_Climate.DaysPerSeason = 24` in-game days, which is about 19 real hours per season (tunable). After any storm there is a clearing window: when the sun is lower than 42° and rain lies opposite the sun, a rainbow renders from the actual geometry. It is never scripted.

#### 2.0.6 Non-tornado hazards

Every hazard is a module on `UAtmosphereSubsystem`. It is triggered by the atmosphere fields, never by a timer, and it reuses the existing systems: the wind field, the structural integrity graph, GAS damage and the debris tiers.

| Hazard | Trigger (from fields) | Model | Gameplay effect |
|---|---|---|---|
| **Hail** | Any supercell; size scales with CAPE | See the maths below. A statistical hit model, with no per-stone simulation | Dents cars, smashes windshields and windows (opening buildings to wind, `C_int ↑`), hurts people in the open (`GE_HailImpact`), shreds crops |
| **Straight-line wind / downburst / derecho** | Precipitation cores, bow echoes when BWD is high | Adds to `V_amb` (§2.5). A downburst is a radial outflow that reuses the inflow shape `Ψ` with the sign reversed | Barns, trees and power lines fail across a wide swath with no funnel. Semi trucks tip over |
| **Lightning** | CAPE plus precipitation → strike rate per km² | Poisson strikes. The strike point is biased toward tall objects: `P ∝ e^(h/15 m)` within a 30 m capture radius | Damage and death, grass and structure fires, transformer blowouts, power outages |
| **Grass fire** | Lightning or a spark while `DryLineWind`, heat or drought is active | Cellular automaton on a 10 m land-cover grid. `ROS = ROS₀ · (1 + 0.8·U^1.5) · Dryness` along the wind vector | Wind-driven fire fronts, smoke that cuts visibility, a rural firefighting job |
| **Flash flood** | `FloodTraining`, or when rain accumulated over a catchment exceeds a threshold | Offline: D8 flow accumulation and watershed basins from the DEM (§8). Runtime: a bucket model per basin: `dV/dt = P·A·C_runoff − Q_out(h)`. A precomputed stage–volume curve gives water height `h`, which drives Water-plugin bodies at low spots | Low-water crossings flood on the gravel roads. Cars float at 0.4–0.6 m depth (buoyancy vs. mass). Creeks leave their banks |
| **Heavy rain / fog / drizzle** | `OvercastDrizzle`, storm cores | Height fog density, rain curtain particles (Niagara), global wetness in material parameters | Visibility 50 m – 2 km. Road friction `μ`: dry 0.8, wet 0.5 (Chaos Vehicle tire friction through the physical surface) |
| **Dust** | `DryLineWind` or an outflow crossing fallow and tilled fields (from the Cropland Data Layer, §8) | A volumetric dust wall advected by `V_amb` | Near-zero visibility, highway pile-ups (NPC traffic reacts) |
| **Ice storm** (winter) | Warm air aloft over a sub-zero surface | Ice accretion rate on lines and branches. Power-line spans become integrity-graph members with a sag load of `ice + wind` | Lines and limbs snap. Roads at `μ = 0.1`. Multi-day blackouts |
| **Blizzard** (winter) | Cold regime plus high `V_amb` | Snow accumulation mask in a runtime virtual texture, drifts downwind of the wind shadow (§3.6) | Whiteout, stranded vehicles, snow load on roofs (integrity graph) |
| **Heat wave** (summer) | Hot regime with high CAPE capped by CIN | Stamina and heat attributes, crop stress | Exhaustion, fire risk; the cap can break explosively late in the day |

**Hail maths (no per-stone physics):**

```
Updraft (parcel theory, entrainment-reduced):  w_up ≈ 0.5 · √(2·CAPE)
Stone terminal velocity:  v_h(D) = √( 4·ρ_ice·g·D / (3·ρ_air·C_D) ) ≈ 126.6·√D      (ρ_ice = 900, C_D = 0.6, D in m)
Largest stone the updraft can hold:  D_max = w_up² / 16016       (CAPE 3000 → w_up 38.7 m/s → D_max ≈ 9 cm, softball size)
Stone size in a hail swath: exponential, n(D) = N₀·e^(−D/D̄), truncated at D_max
Hits on exposed area A in Δt:  N_hits ~ Poisson( n_tot · v_h · A · Δt )
Energy per hit:  E = ½ · (ρ_ice·π·D³/6) · v_h²         (5 cm stone ≈ 24 J; 9 cm ≈ 250 J)
Windshield breaks when a single hit exceeds 30 J; a person takes damage = k·E through GE_HailImpact (reduced when under cover)
```

Hail, lightning and fire outcomes that change gameplay are server-authoritative. Clients render hail and rain Niagara from the replicated swath parameters only (§5.2).

### 2.1 Symbols and frame

| Symbol | Meaning | Example value (a mid-EF3 draw; real values are sampled per tornado, §2.0.3) |
|---|---|---|
| `P` | Sample point (m, world) | – |
| `C_g(t)` | Storm ground center | replicated path |
| `Û = (0,0,1)` | World up | – |
| `H` | Funnel height to cloud base | 900 m |
| `R_m0` | Radius of maximum wind at the ground | 60 m |
| `κ` | Funnel flare (radius growth with height) | 1.5 |
| `V_max(t)` | Peak tangential speed = `V_peak · I(t)` | 70 m/s |
| `U_in` | Peak radial inflow | `0.4 · V_max` |
| `R_in` | Inflow peak radius | `2.0 · R_m` |
| `W_max` | Peak updraft | `0.6 · V_max` |
| `n` | Outer decay exponent | 0.7 |
| `R_out` | Field cutoff radius | `12 · R_m0` |
| `s` | Spin sign | −1 (cyclonic in UE's left-handed frame) |
| `ρ` | Air density | 1.225 kg/m³ |

**Step 1: local frame at height z**

```
z      = (P − C_g) · Û                                         (height above storm base)
ζ      = clamp(z / H, 0, 1)
A(z)   = C_g + Û·z + D̂_lean · L_lean · ζ²                    (tilted axis; D̂_lean = −V̂_trans typically)
d      = P − A(z)                    (already horizontal, since A shares z)
r      = |d| ,   r̂ = d / max(r, ε)                            (ε = 0.01 m)
θ̂      = s · (Û × r̂)                                          (tangential unit vector)
R_m(z) = R_m0 · (1 + κ·ζ)                                      (funnel widens upward)
ξ      = r / R_m(z)                                            (normalised radius)
```

### 2.2 Tangential wind speed curves

Three profiles are shipped. None is picked by a designer: (a) is the default, (b) is the mobile and far-LOD fallback, and (c) switches on automatically whenever the sampled `V_peak > 74 m/s`.

**(a) Burgers–Rott (default, smooth and physical)**, normalized so that `Φ(1) = 1`:

```
Φ_BR(ξ) = (1 − e^(−1.25643·ξ²)) / (0.71533·ξ)
    ξ→0 :  Φ ≈ 1.7564·ξ         (solid-body core)
    ξ=1 :  Φ = 1.0              (radius of max wind)
    ξ≫1 :  Φ ≈ 1.398 / ξ        (potential vortex)
```

**(b) Modified Rankine (cheap, tunable outer decay)**:

```
Φ_MR(ξ) = ξ              , ξ ≤ 1
        = ξ^(−n)         , ξ > 1        (n = 0.5…1.0; observed tornadoes ≈ 0.6–0.8)
```

**(c) Two-cell (EF4+ only)**: a central downdraft creates a calm-ish eye inside a violent annulus:

```
Φ_2C(ξ) = Φ_BR(ξ) · (1 − 0.6·e^(−(ξ/0.35)²))
v_z inner correction: v_z ← v_z − W_max · 0.5·e^(−(ξ/0.35)²)
```

**Height profile** (surface boundary layer, a power law with a floor so that feet still feel wind):

```
B(z) = clamp( ((z + z₀) / z_bl)^α , B_min, 1 ) · (1 − smoothstep(0.85H, H, z))
       z₀ = 0.5 m, z_bl = 30 m, α = 0.14, B_min = 0.55
       → at z = 1.8 m (head height), B ≈ 0.70
```

**Far-field taper** (so the field has compact support and a cheap broad-phase):

```
T(r) = 1 − smoothstep(0.7·R_out, R_out, r)
```

**Tangential speed:**

```
v_t(r, z, t) = V_max(t) · Φ(ξ) · B(z) · T(r)
```

**Enhanced Fujita reference.** `V_peak` is sampled continuously (§2.0.3) and divided by `B(10 m) ≈ 0.86`, so ground-level gusts land inside the rated band. Size is sampled **independently** of rating (correlation 0.35 only), so any row can come as a narrow rope or a wide wedge.

| Rating | 3-s gust (m/s) | Spawn share | What the physics produces |
|---|---|---|---|
| EF0 | 29–38 | 40% | Props tumble, people stagger, shingles fly |
| EF1 | 38–49 | 30% | People without a grip lift inside the core. Mobile homes roll |
| EF2 | 50–60 | 16% | Wood-frame walls fail on a direct hit. Cars slide |
| EF3 | 61–74 | 9% | Houses lose their roofs and walls. Trucks tip |
| EF4 | 74–89 | 4% | Two-cell core. Only braced concrete stays standing |
| EF5 | 89–135 | 1% | Only reinforced basements and bunkers survive |

Bake `Φ(ξ)` for ξ ∈ [0, 12] into a 256-entry `UCurveFloat` or LUT at load time. The runtime cost is one lerp. Burgers–Rott needs `exp`, and the LUT avoids that on mobile.

### 2.3 Radial inflow (the "suction" that pulls you in)

Inflow is concentrated near the ground and peaks just outside the core:

```
Ψ(ξ_in) = ξ_in · e^((1 − ξ_in²)/2)            ξ_in = r / R_in       (peak = 1 at ξ_in = 1)
G(z)    = e^(−z / z_in)                                              z_in = 60 m
v_r     = −U_in(t) · Ψ(ξ_in) · G(z) · T(r)                           (negative = toward axis)
```

### 2.4 Updraft

```
W(r) = e^(−(r / R_w)²) ,   R_w = 1.2 · R_m(z)
Z(z) = (1 − e^(−(z + z₀)/z_u)) · (1 − smoothstep(0.8H, H, z))       z_u = 40 m
v_z  = W_max(t) · W(r) · Z(z)
```

### 2.5 Total wind velocity vector

```
V_wind(P,t) = ( v_t·θ̂ + v_r·r̂ + v_z·Û )                             (vortex)
            + V_trans(t) · T(r)                                        (storm motion → asymmetric winds)
            + V_amb(P,t)                                               (gust front / RFD, from the parent supercell)
            + σ_g · N₃(P/λ_g, t·f_g, seed) · T(r)                      (gusts: seeded 3-D curl-noise)
```

- The translation term matters. It makes the right-forward quadrant (relative to motion, NH) about `|V_trans|` faster, which matches real damage-path asymmetry and gives players a readable "safe side".
- Multiple storms add together: `V = Σ_k V_k`. The subsystem culls by `r > R_out`, which is an AABB test.
- The field is kinematic, not divergence-free. That is acceptable for gameplay, and it is roughly 1000× cheaper than any fluid solve.

### 2.6 Forces on bodies: the suction equations

Relative air velocity is `u = V_wind(P_com) − V_body`, with `û = u/|u|`.

**Aerodynamic drag** (the dominant term):

```
F_D = ½ · ρ · C_D · A_eff(û) · |u| · u
A_eff(û) = A_x·|û·X̂_body| + A_y·|û·Ŷ_body| + A_z·|û·Ẑ_body|        (box projection; A_* from DataAsset)
```

**Aerodynamic lift** (flat bodies: roofs, sheets, cars, gliders):

```
u_h   = u − (u·Û)Û
F_L   = ½ · ρ · C_L(α) · A_plan · |u_h|² · Û                          (C_L(α) curve per WindProfile; roof panels ≈ 0.8)
```

**Pressure-gradient suction** (the "true" suction). Cyclostrophic balance gives `∂p/∂r = ρ·v_t²/r`, so every body of volume `Vol` feels an inward buoyancy-like force:

```
F_P = −Vol · ρ · (v_t² / r) · r̂
```

**Pressure deficit** (used for roof uplift and the ear-pop audio). Integrate `ρ v_t²/r` from r to ∞:

```
ΔP(r) = ρ · V_max² · Π(ξ)
Modified Rankine:  Π(ξ) = 1/(2n) + (1 − ξ²)/2     ξ ≤ 1
                   Π(ξ) = ξ^(−2n) / (2n)          ξ > 1
(n = 1 recovers classic Rankine: Π = 1 − ξ²/2 inside, 1/(2ξ²) outside)
Burgers–Rott: integrate numerically at load → LUT.
EF3 sanity check: ρ·V² = 1.225·70² ≈ 6.0 kPa (60 hPa central deficit, in the observed range)
```

**Orbit assist** (gameplay, tunable β ∈ [0,1]). Pure drag flings debris outward, because centrifugal ejection is realistic. For the cinematic debris ring, add the missing centripetal term only inside `ξ < 3`:

```
v_θ   = V_body · θ̂
F_orb = β · m · (v_θ² / r) · (−r̂) · (1 − smoothstep(2, 3, ξ))
```

**Total:**

```
F_total = F_D + F_L + F_P + F_orb + m·g
```

**Lift-off threshold** (precomputed per WindProfile, drives the tier and HUD warnings):

```
v_liftoff = sqrt( 2·m·g / (ρ · (C_D·A_z + C_L·A_plan)) )
Player (80 kg, C_D·A_z ≈ 0.7 m²): v_liftoff ≈ 42.8 m/s  → a player who isn't holding on lifts in an EF1 core. Intended.
```

**Hold / Grip check** (`GA_Hold`, contextual, no prompt): the grip holds while `|F_total,horizontal + F_total,vertical⁺| < Grip`. `Grip` is a GAS attribute in N (base 3 kN, upgrades up to 8 kN). On failure: `State.Airborne.Wind`, a ragdoll blend, and a clip flag.

### 2.7 Numerically stable integration

With explicit Euler, light bodies explode under quadratic drag when `dt > m / (½ρC_DA|u|)`. Use the semi-implicit relaxation instead. It is unconditionally stable:

```
k      = ½ · ρ · C_D · A_eff / m
u'     = u / (1 + k·|u|·Δt)                          (implicit quadratic drag, |u| frozen)
Δv_D   = u − u'
F_D,applied = m · Δv_D / Δt                          (feed to Chaos as force, or apply Δv directly for Tier-1)
```

The other terms (`F_L`, `F_P`, `F_orb`) are explicit, with a clamp of `|a| ≤ a_max` (`DA_Climate`, default 60 m/s²) so that nothing gets launched at orbital speed.

### 2.8 Storm path

```
C_g(t+Δt) = C_g(t) + Δt · Rot_z(ψ_hook(t)) · ( V_sc(t) + V_wander(t) )
V_sc      : parent supercell motion (mean wind + Bunkers deviation, §2.0.1); 0–25 m/s, can nearly stall
V_wander  : Ornstein–Uhlenbeck,  dW = −W/τ_w·dt + σ_w·√dt·N(0,1),  σ_w ~ U(1, 6) m/s, τ_w ~ U(10, 40) s
ψ_hook    : occlusion hook. With P = 0.4, over the final 25% of life the track turns left by up to 90°
            (in UE's left-handed frame "left" is a negative yaw about Z)
```

**No player attraction, no designer steering.** The track depends only on the atmosphere and the seed, so a tornado ignores players entirely. It can miss a town completely, loop, stall over a farm, or cross the interstate at rush hour.

The server bakes the path into **Hermite keys every 2 s with 10 s look-ahead** and replicates them. Clients evaluate the spline, so the path is smooth and cheap and never mispredicts more than 10 s ahead.

### 2.9 Footage value (optional economy, never shown live)

When a player sells a clip to the TV station, the game scores it after the fact from logged frames (camera position, view direction, the storm state at that moment):

```
Value = k_$ · max_frames[ Vis · (V_max/40)² · (R_m / max(d_cam, R_m))^1.2 ] · Rarity · (1 + 0.5·Exclusive)
        Vis       = funnel screen coverage × (1 − rain/occlusion)  (from a depth-buffer sample at capture)
        Rarity    = 1 + 3·[EF4+] + 2·[multi-vortex] + 1·[debris-lofted-vehicle in frame]
        Exclusive = 1 if no other player sold footage of this tornado first
```

No meter and no score appear while filming. Players only learn what a clip was worth when they sell it.

### 2.10 Reference implementation (StormCore, C++, exposed to BP)

```cpp
// StormFieldMath.h — header-only, ISPC-friendly, no UObject access. Units: SI.
#pragma once
#include "CoreMinimal.h"

struct FStormFieldParams            // built from FTornadoSample (§2.0.3) + I(t)/R_m(t) (§2.0.4) + path each frame
{
    FVector3f GroundCenter;         // m
    FVector3f TranslationVel;       // m/s
    FVector3f LeanDir;              // unit, horizontal
    float VMax, Rm0, Flare, Height, Lean, UIn, RIn, WMax, ROut;
    float Spin = -1.f;              // cyclonic in UE left-handed frame
    const float* PhiLUT = nullptr;  // 256 entries over xi ∈ [0,12]
};

namespace StormMath
{
    FORCEINLINE float SampleLUT(const float* LUT, float Xi)
    {
        const float T = FMath::Clamp(Xi * (255.f / 12.f), 0.f, 254.999f);
        const int32 I = (int32)T;
        return FMath::Lerp(LUT[I], LUT[I + 1], T - I);
    }

    FORCEINLINE float SmoothStep(float A, float B, float X)
    {
        const float T = FMath::Clamp((X - A) / (B - A), 0.f, 1.f);
        return T * T * (3.f - 2.f * T);
    }

    FORCEINLINE FVector3f SampleVortex(const FStormFieldParams& S, const FVector3f& P, float& OutVt, float& OutR)
    {
        const float Z    = P.Z - S.GroundCenter.Z;
        const float Zeta = FMath::Clamp(Z / S.Height, 0.f, 1.f);
        const FVector3f Axis = S.GroundCenter + FVector3f(0, 0, Z) + S.LeanDir * (S.Lean * Zeta * Zeta);
        FVector3f D = P - Axis; D.Z = 0.f;
        const float R = D.Size();
        OutR = R;
        if (R >= S.ROut) { OutVt = 0.f; return FVector3f::ZeroVector; }

        const FVector3f RHat  = R > 0.01f ? D / R : FVector3f(1, 0, 0);
        const FVector3f Theta = S.Spin * FVector3f::CrossProduct(FVector3f::UpVector, RHat);
        const float Rm  = S.Rm0 * (1.f + S.Flare * Zeta);
        const float Xi  = R / Rm;
        const float Taper = 1.f - SmoothStep(0.7f * S.ROut, S.ROut, R);
        const float B   = FMath::Clamp(FMath::Pow((Z + 0.5f) / 30.f, 0.14f), 0.55f, 1.f)
                        * (1.f - SmoothStep(0.85f * S.Height, S.Height, Z));

        const float Vt = S.VMax * SampleLUT(S.PhiLUT, Xi) * B * Taper;
        const float XiIn = R / S.RIn;
        const float Vr = -S.UIn * XiIn * FMath::Exp(0.5f * (1.f - XiIn * XiIn)) * FMath::Exp(-Z / 60.f) * Taper;
        const float Rw = 1.2f * Rm;
        const float Vz = S.WMax * FMath::Exp(-(R * R) / (Rw * Rw))
                       * (1.f - FMath::Exp(-(Z + 0.5f) / 40.f)) * (1.f - SmoothStep(0.8f * S.Height, S.Height, Z));

        OutVt = Vt;
        return Theta * Vt + RHat * Vr + FVector3f::UpVector * Vz + S.TranslationVel * Taper;
    }

    // Semi-implicit drag: returns the force (N) to apply this substep.
    FORCEINLINE FVector3f DragForce(const FVector3f& Wind, const FVector3f& BodyVel, float Mass,
                                    float CdA, float Dt, float Rho = 1.225f)
    {
        const FVector3f U = Wind - BodyVel;
        const float USz = U.Size();
        const float K = 0.5f * Rho * CdA / Mass;
        const FVector3f UNew = U / (1.f + K * USz * Dt);
        return Mass * (U - UNew) / Dt;
    }
}
```

`UStormWorldSubsystem::SampleWindBatch(TConstArrayView<FVector3f> Points, TArrayView<FVector3f> Out)` runs a `ParallelFor` over chunks of 64 points. It is exposed to Blueprint as `SampleWind(Vector WorldPos) → Vector WindVel_cms` (BlueprintPure, cm/s at the boundary).

**Single source of truth.** `MF_StormWind` (Material Function) and `NM_StormWind` (Niagara module) implement §2.5 in HLSL, and read storm params from `MPC_Storm` (max 6 tornadoes × 8 float4, matching the outbreak cap). An **automation test** (`Stormchaser.Wind.Parity`) samples 10k points on CPU and GPU (a render-target readback) and fails if `|ΔV| > 0.5 m/s`.

---

## 3. Structural Integrity under Chaos Destruction

Chaos has no built-in load-path solver. Bases therefore use a **two-layer model**:
1. **The gameplay graph** (C++ SoA, deterministic, server-authoritative). It decides *what* breaks and *when*.
2. **Chaos Geometry Collections**, spawned on demand. They decide *how* a part breaks apart (cosmetic plus Tier-2 chunks).

Intact parts are **never** Geometry Collections. They are ISM instances. A part is hot-swapped to its pre-fractured GC at the moment it breaks or detaches.

### 3.1 The graph

`G = (V, E)`. A node `i` is a placed part with mass `m_i`, material `M_i`, and area and normal data from `UBasePartDataAsset`. An edge `(i,j)` is a snap-socket joint with capacities `C_t` (tension), `C_c` (compression) and `C_s` (shear) in N. The joint's capacity is the weaker of the two parts' capacities, multiplied by the joint-type modifier.

### 3.2 Support stability (static; recomputed incrementally on add or remove)

This is a max-bottleneck propagation from the ground: a modified Dijkstra with a max-heap.

```
S_i = 1                                             if i is a foundation touching terrain/anchor
S_i = max_{j ∈ N(i)} ( S_j − λ_{M_i} · δ_ij )        otherwise
      δ_ij = 1 for vertical support (j below i), δ_ij = 1.6 for horizontal/cantilever
      λ: Wood 0.20 · Metal 0.12 · Concrete 0.08 · Reinforced 0.05
Part invalid if S_i < S_min (0.05) → cannot be placed / collapses immediately.
```

On removal, only the nodes whose best support path went through the removed node are dirtied. Recompute that subgraph (it is typically fewer than 50 nodes).

### 3.3 Loads per tick (10 Hz, only for plots with any storm within R_out)

For each part `i`, sample the wind at the part center (`V_i`, `q_i = ½ρ|V_i|²`):

```
Wind load (panels):   F_w,i  = q_i · C_p,i · A_i · (n̂_i·V̂_i) · n̂_i          (C_p: walls 0.8 windward / −0.5 leeward)
Roof uplift:          F_u,i  = (ΔP(r_i) · C_int + C_L,roof · q_i) · A_i · Û   (C_int = 0.7: interior pressure lags; shutters closed → 0.3)
Self-weight:          F_g,i  = m_i · g
Sheltering:           q_i ← q_i · (1 − Shelter_i)     from the plot's wind-shadow grid (§3.6)
F_i = F_w,i + F_u,i + F_g,i
```

**Load-path distribution.** Process nodes in ascending `S`, from farthest-from-ground to ground. Each node pushes its accumulated load to its supports, weighted by their stability:

```
L_i^acc = F_i + Σ_{k→i} L_ki
w_ij    = S_j / Σ_{j'∈Sup(i)} S_j'
L_ij    = w_ij · L_i^acc
```

**Joint stress ratio** (joint normal `n̂_ij`, pointing from support j to i):

```
L_n = L_ij · n̂_ij ,   L_s = |L_ij − L_n·n̂_ij|
σ_ij = max(  max(L_n,0)/C_t ,  max(−L_n,0)/C_c ,  L_s/C_s  ) / S_i^γ        (γ = 0.5: weakly supported parts are weaker)
```

### 3.4 Failure and fatigue

```
Instant failure:  σ_ij ≥ 1
Fatigue:          D_ij += Δt · max(0, σ_ij − σ_f)^p / τ_f     σ_f = 0.6, p = 2, τ_f = 4 s
                  fail if D_ij ≥ 1                       (sustained 0.9σ breaks in ≈ 44 s; 0.95σ in ≈ 33 s)
Impact damage:    HP_i −= k_M · ½ · m_d · ((v_d − v_i)·n̂)²     (debris hits, from Chaos collision events)
                  fail all joints of i if HP_i ≤ 0
```

**Balance reference:** a 3 × 3 m wood wall at the EF3 core edge has `q ≈ 3.0 kPa`, so `F_w ≈ 3000·0.8·9 ≈ 21.6 kN`. Two wood joints of `C_s = 8 kN` each fail, which is intended: wood dies to a direct EF3 hit. Metal (`C_s` = 30 kN per joint) survives the edge but not the core.

### 3.5 Hand-off to Chaos

When a joint breaks:
1. Remove the edge and recompute `S` for the dirty subgraph.
2. **Island detection** (union-find): every connected component without a foundation detaches.
3. For each detached part:
   - Remove the ISM instance. Spawn its `UGeometryCollection` (async-preloaded soft pointer) from the **GC pool** (§4.5).
   - Set initial linear velocity `= V_wind(P_i) · 0.3`.
   - Apply an **external strain** proportional to the failure severity, so that overloaded parts shatter while gently detached parts fall mostly intact:

```
Strain_i = clamp(σ_last,i, 1, 3) · T₀,M · k_shatter           (k_shatter = 1.1)
DamageThreshold per cluster level L:  T_L = T₀,M · 0.5^L        (T₀: Wood 5e4, Metal 2e5, Concrete 5e5, Reinforced 1.2e6)
```

```cpp
// On server and clients (both replay the break event; cosmetic fragments may differ, Tier-2 chunks are server-owned)
URadialFalloff* Falloff = NewObject<URadialFalloff>(this);
Falloff->SetRadialFalloff(Strain, 0.f, 1.f, 0.f, PartRadiusCm, PartCenterUU, EFieldFalloffType::Field_FallOff_None);
FieldSystemComp->ApplyPhysicsField(true, EFieldPhysicsType::Field_ExternalClusterStrain, nullptr, Falloff);
```

4. Fragments are driven by the same `UWindReceiverComponent` logic in batched form (§4.5), so they fly *with* the storm.
5. Fragments that sleep for more than 2 s are converted to salvage ISM (`ASalvagePile`), the GC is returned to the pool, and a Tier-0 dust burst plays.

**Pre-placed world buildings** (towns, barns, silos) use the same pattern. They are ISM or Packed Level Actors with a lightweight integrity graph generated at cook time. Hero collapses such as the water tower or grain elevator use **Chaos Cache Manager** playback: pre-simulated, deterministic, identical on every client, and almost free at runtime. That makes them the mobile-safe spectacle.

### 3.6 Wind shadow (why walls matter)

Each plot keeps a 2-D grid of 1 m cells. Solid parts rasterize a downwind shadow:

```
Shelter(x) = s_max,M · (1 − x / (L_s · h))       0 ≤ x ≤ L_s·h ,  L_s = 8
             s_max: solid 0.85, slatted/porous 0.5, fence 0.3
```

The grid is rebuilt when the plot changes or when the wind direction rotates by more than 15°. Players and parts read `Shelter` with an O(1) lookup, so no per-frame traces are needed.

---

## 4. Blueprint Class Architecture

### 4.1 Module and plugin layout

```
Plugins/StormCore/            (Runtime; all hot math in C++, BP-exposed)
  Source/StormCore/Storm/       AStormActor, UStormWorldSubsystem, StormFieldMath.h, FStormNetState
  Source/StormCore/Wind/        UWindReceiverComponent, UWindShadowGrid, Mass processors
  Source/StormCore/Structure/   ABasePlot, UStructuralIntegrityComponent, UBuildGridComponent
  Source/StormCore/Debris/      UDebrisPoolSubsystem, FDebrisNetArray, Mass fragments/traits
  Source/StormCore/Data/        all UPrimaryDataAsset types
Source/Stormchaser/           (Game: GAS, characters, UI, modes)
  Abilities/ AttributeSets/ Characters/ GameModes/ UI/
Content/Stormchaser/Blueprints/  BP_ subclasses; data-only children for content variety
```

**Rule:** C++ owns anything that runs per-frame over N items. Blueprint owns composition, tuning, flow, VFX and SFX hookup and events. No Blueprint Tick on any class in this document. BP reacts to events and delegates.

### 4.2 Actor and Component hierarchy

```
UAtmosphereSubsystem (UWorldSubsystem, server, 0.2 Hz)
   65×65 km field grid · regime Markov chain · diurnal cycle · supercell Poisson spawner (§2.0.1)
UWarningServiceSubsystem (server)
   random-lead-time warnings/false alarms → warning polygons → sirens, phone alerts, radio/TV (§2.0.4)

ASupercell (C++) → BP_Supercell
 ├─ USupercellCloudComponent      volumetric cloud cell params (anvil, wall cloud, RFD curtain)
 ├─ UPrecipitationComponent       rain/hail cores → Niagara + radar reflectivity source
 ├─ URadarSourceComponent         feeds the phone radar app (reflectivity + velocity couplet)
 └─ UTornadogenesisComponent      STP hazard roll each minute, cyclic cooldown → spawns AStormActor

AStormActor (C++)  →  BP_Storm_Tornado   (one BP; every visual/physical difference comes from the sampled params)
 ├─ USceneComponent (Root, at C_g)
 ├─ UStormFieldComponent          builds FStormFieldParams from FTornadoSample + lifecycle; registers with subsystem
 ├─ UStormPathComponent           server: supercell motion + OU wander + hook → Hermite keys; client: spline eval
 ├─ UStormLifecycleComponent      procedural I(t), R_m(t) from seed (§2.0.4); internal phase tags; no scripted events
 ├─ UStormDebrisSpawnerComponent  ground-scrape spawns (T0 Niagara via Data Channel, T1 Mass, T2 pool)
 ├─ UNiagaraComponent  (Funnel)   funnel particles/ribbons; params from MPC_Storm
 ├─ UStaticMeshComponent (FunnelShell) raymarched funnel material (PC Epic: Heterogeneous Volume [VERIFY 5.6])
 ├─ UAudioComponent ×3            MetaSounds: roar (distance+Vt), debris bed, pressure/ear-pop
 └─ UFieldSystemComponent         radial strain/force fields for ground-level destruction

UStormWorldSubsystem (UTickableWorldSubsystem, C++)
   Storms[] · SampleWind/Batch · ΔP lookup · MPC_Storm writer · Deferred Damage Ledger (server)

APlayerState (C++) → BP_PlayerState
 └─ UAbilitySystemComponent (Mixed)  + UCoreAttributeSet, UStormAttributeSet, UCareerAttributeSet

ACharacter (C++ AStormCharacter) → BP_Player
 ├─ UStormCharacterMovementComponent  wind force INSIDE predicted move (§5.3); custom mode MOVE_Custom:Tumble
 ├─ UWindReceiverComponent            profile = DA_Wind_Player; mode = Predicted (no physics body)
 ├─ UGrappleComponent                 rope constraint (predicted); anchor validation server-side
 ├─ UHoldComponent                   contextual grab-point search (sphere overlap + socket tags), no UI
 ├─ UStormPerceptionComponent (local) V_local, ΔP, Shelter → camera buffet, lean anims, audio, rumble (no HUD)
 ├─ UPhoneComponent                   radar app, alerts, camera (footage log §2.9), contacts/jobs
 ├─ UInventoryComponent / UEquipmentComponent
 └─ UClipBufferComponent (local only) rolling replay flagger

Mass AI (crowds + traffic): UMassEntityConfigAsset traits
   UStormReactionTrait → processors: evacuate / flee-drive / film / shelter-in-place / freeze, driven by
   warning polygons + line-of-sight to funnel; per-NPC random temperament so crowds split realistically
   Near-player NPCs promote to full actors (ragdoll-able, wind-affected); far NPCs stay Mass (cheap wind drift only)

ATownSiren (C++) → BP_TownSiren       listens to UWarningServiceSubsystem; MetaSound rotating siren (attenuated)

APawn (vehicles) → BP_Vehicle_Base  (Chaos Vehicles)
 └─ UWindReceiverComponent            mode = PhysicsBody (async physics tick)

AStormProp (C++) → BP_Prop_Base → BP_Prop_Car / BP_Prop_Hay / BP_Prop_Cow (data-only)
 ├─ UStaticMeshComponent (sim physics, pooled)
 ├─ UWindReceiverComponent            mode = PhysicsBody
 └─ UDebrisTierComponent              tier promotion/demotion, net relevancy, pooling

ABasePlot (C++) → BP_BasePlot   (every player-ownable house/garage/business lot; also pre-placed town buildings)
 ├─ UInstancedStaticMeshComponent ×N  one per (mesh, material tier); parts are instances
 ├─ UBuildGridComponent               snapping, placement validation, S-preview
 ├─ UStructuralIntegrityComponent     SoA graph, loads, fatigue, island detection (server tick 10 Hz)
 ├─ UWindShadowGridComponent          2-D shelter grid
 ├─ UFieldSystemComponent             strain on hand-off
 └─ FBasePartNetArray (FastArray)     replicated part state (§5.4)

ASalvagePile (C++) → BP_SalvagePile  (ISM of settled fragments, interactable)
AProbe (C++) → BP_Probe               optional equipment (bought, not prompted); logs V_local for sellable data
```

**`UWindReceiverComponent` modes:**

| Mode | Used by | Where the force goes |
|---|---|---|
| `Predicted` | Characters | `UStormCharacterMovementComponent::CalcVelocity` / `PhysCustom`, deterministic on both ends |
| `PhysicsBody` | Props, vehicles, T2 debris | `AsyncPhysicsTickComponent`, force through the physics-thread body handle **[VERIFY 5.6 API names]** |
| `Kinematic` | T1 Mass debris | `UStormDebrisWindProcessor` (Mass), velocity integrated directly |
| `Cosmetic` | Cloth, flags, foliage | Material or Niagara via MPC only; no CPU cost |

**Receiver LOD** (Significance Manager): `significance = size² · speedFactor / distance²` against the nearest local camera on clients, or the nearest player on the server.

| Bucket | Tick | Notes |
|---|---|---|
| Hero (top 16) | every physics substep (60 Hz) | full forces including lift and orbit |
| Near | 20 Hz | drag + pressure |
| Far | 5 Hz | drag only |
| Dormant | 0 | body asleep; woken by the storm broad-phase (r < R_out) |

### 4.3 Blueprint logic: representative graphs

**BP_WarningService: warning issued → world reacts (server)**
```
Event OnWarningIssued (from UWarningServiceSubsystem, C++ delegate; may never fire for a given tornado)
 → For Each ATownSiren overlapping WarningPolygon → StartSiren (replicated bool, RepNotify drives MetaSound)
 → For Each Player whose Pawn is inside WarningPolygon
       → Client RPC on UPhoneComponent: PushAlert(WarningText)   (the phone buzzes; the player chooses whether to look)
 → Broadcast to Mass: UStormReactionSubsystem.SetWarningPolygon(Polygon)   (NPCs react on their own)
 → Radio/TV director: queue bulletin (interrupts the current station after the song ends)
```

**GA_Hold (LocalPredicted, activated by holding the grab input; no prompt, no icon)**
```
ActivateAbility
 → UHoldComponent.FindGrabPoint(1.2 m, prefer tagged sockets: rail, pole, doorframe, car door) → none → EndAbility
 → Play hold montage (IK hands to grab point) → Apply GE_Holding (State.Holding, CMC routes wind force into GripCheck)
 → Wait Gameplay Event (Event.Grip.Broken)  ← fired by UStormCharacterMovementComponent when |F| > Grip
     → Remove GE_Holding → Apply GE_WindTumble (State.Airborne.Wind, 1.5 s) → EndAbility
 → Wait Input Release → EndAbility
Grip also drains with Stamina, so holding on for a long time is a real test, and nothing on screen tells you.
```

**GA_Build (LocalPredicted preview, ServerOnly commit)**
```
Input Pressed → UBuildGridComponent.UpdatePreview(Hit) → preview mesh tint = Lerp(Red, Green, PreviewS)
Confirm → Server RPC (via ability TargetData) → Server: ValidatePlacement (cost, overlap, S ≥ S_min)
        → AddPart → FastArray MarkItemDirty → Commit cost (GE_SpendMaterial, SetByCaller)
```

### 4.4 Gameplay Ability System

**Placement:** the ASC lives on the PlayerState (`Mixed`) for players and on the Pawn (`Minimal`) for wildlife and AI. **Structures and props never get an ASC.** They are too numerous; structure health lives in the SoA graph. Storms apply effects **to players only**, via server GE application.

**Gameplay Tags (`Config/Tags/StormchaserTags.ini`, native-declared in `StormchaserGameplayTags.h`):**

```
Storm.Type.Supercell | Storm.Type.Tornado | Storm.Type.Derecho | Storm.Type.Hail
Storm.Rating.EF0 … Storm.Rating.EF5
Storm.Phase.Forming | Touchdown | Mature | Roping | Dissipated
Storm.Feature.TwoCell | Storm.Feature.Satellite | Storm.Feature.RainWrapped | Storm.Feature.MultiVortex
Storm.Morph.Rope | Cone | Stovepipe | Wedge       (derived from sampled params; drives VFX/audio only)
Weather.Regime.Clear | FairBreezy | OvercastDrizzle | GeneralStorms | SevereHailWind | Tornadic | Outbreak | FloodTraining | DryLineWind | IceStorm | Blizzard | ArcticClear | HeatWave
Weather.Hazard.Hail | Downburst | Derecho | Lightning | GrassFire | FlashFlood | Fog | Dust | Ice | Blizzard | Heat
Damage.Type.Fire | Damage.Type.Drowning | Damage.Type.Cold | Damage.Type.Heat

State.Exposed | State.Sheltered | State.Holding | State.Grappled | State.Gliding
State.Airborne.Wind | State.Tumbling | State.Downed | State.InVehicle | State.Stunned

Ability.Movement.Sprint | Ability.Movement.Slide | Ability.Movement.Grapple | Ability.Movement.WindSurf
Ability.Survival.Hold
Ability.Tool.Film | Ability.Tool.DeployProbe | Ability.Tool.Radar
Ability.Build.Place | Ability.Build.Repair | Ability.Build.Salvage | Ability.Build.Demolish

Damage.Type.Debris | Damage.Type.Fall | Damage.Type.Hail | Damage.Type.Lightning | Damage.Type.Crush
Build.Material.Wood | Metal | Concrete | Reinforced
Build.Part.Foundation | Wall | Roof | Floor | Brace | Door | Shutter | Anchor | Cellar

Event.Weather.WarningIssued | Event.Weather.WarningExpired | Event.Storm.Touchdown | Event.Storm.Dissipated
Event.Grip.Broken | Event.Probe.Deployed | Event.Structure.Collapsed | Event.Clip.Highlight

GameplayCue.Storm.Siren | GameplayCue.Storm.PressureDrop | GameplayCue.Impact.Debris
GameplayCue.Player.WindTumble | GameplayCue.Build.Snap | GameplayCue.Structure.Creak

SetByCaller.Damage | SetByCaller.MaterialCost | SetByCaller.Data
Cooldown.Grapple | Cooldown.Probe
```

**Attribute sets:**

| Set | Attributes | Notes |
|---|---|---|
| `UCoreAttributeSet` | Health, MaxHealth, Stamina, MaxStamina, `IncomingDamage` (meta) | Standard clamp in `PreAttributeChange` |
| `UStormAttributeSet` | Grip (N), MaxGrip, WindResist (multiplier on `C_D·A`, 0.5–1), Exposure (0–1, internal only, never shown), DebrisArmor | The CMC reads `Grip` and `WindResist` from a locally cached copy (predicted). Grip is improved through gear such as gloves and boots, not a skill tree |
| `UCareerAttributeSet` | Money, Reputation (TV station, contractors, police) | Open-world economy hooks; nothing here influences storms |

**Core effects:** `GE_DebrisImpact` (instant, SetByCaller.Damage = `k·½m v²`), `GE_ExposureTick` (periodic 0.5 s, stamina drain ∝ Exposure), `GE_Holding` (infinite while held, grants `State.Holding`), `GE_WindTumble` (duration, blocks `Ability.Movement.*`), `GE_FallDamage`, `GE_SpendMaterial`.

### 4.5 Debris tiers and pooling

| Tier | Representation | Sim | Replicated | PC budget | Mobile budget |
|---|---|---|---|---|---|
| T0 cosmetic | Niagara GPU sprites and meshes (dust, leaves, shingles) | GPU, `NM_StormWind` + depth-buffer collision | No (spawned from replicated events) | 200k particles | 20k |
| T1 kinematic | Mass entities rendered as ISM (boards, branches) | CPU Mass processor, §2.7 integrator, one ray per 4 frames | No; deterministic seeded spawn from break/scrape events | 4,000 | 600 |
| T2 rigid | Pooled physics actors / GC chunks (cars, roof panels) | Chaos, async physics | Yes (§5.2) | 96 active | 24 |
| T3 hero | Players, vehicles, probes, cows | Chaos / CMC | Yes | – | – |

Promotion and demotion: T1 → T2 when it comes within 15 m of a player **and** mass × speed exceeds a threshold, because it can then hurt someone. T2 → T1 when it has been far and asleep for more than 3 s. **Only T2 and T3 can deal gameplay damage**, which keeps authority clean.

Pools (`UDebrisPoolSubsystem`) are prewarmed at map load from `UPlatformScalabilityDataAsset`. Spawning at runtime is forbidden in the storm phase.

### 4.6 DataAsset structure (all `UPrimaryDataAsset`, registered in the Asset Manager)

| Primary Asset Type | Key fields | Bundles |
|---|---|---|
| **`StormClimate`** (`DA_Climate`) | **Distributions only, no individual storms.** EF share table, `V_peak` band edges, copula `Σ`, STP skew, `R_m0` lognormal (median, σ, clamp), `T_life` lognormal, `H` range, multi-vortex/satellite/rain-wrap probabilities, lifecycle ranges (`t_p`, `a`, OU σ/τ, surge rate), wander ranges, hook probability, `a_max`, warning-service lead-time distribution and miss / false-alarm rates | Server |
| **`AtmosphereRegime`** | Regime Markov matrix (per season, including good-regime self-transition), per-regime field means (CAPE, CIN, LCL, SRH, BWD, temperature, moisture), noise scales, diurnal curve, `λ₀` and `λ_T0` hazard rates, enabled hazard modules | Server |
| **`WeatherHazard`** | One per hazard (§2.0.6): trigger thresholds, model constants (hail `C_D`/density/damage thresholds, lightning rate and height bias, fire ROS, flood runoff coefficients), VFX/SFX soft refs | Server, Client |
| **`RealMapManifest`** | Generated by `Tools/MapBuilder` (§8.3): CRS/UTM zone, *relative* extents, landscape scale, basin table and stage–volume curves, data-source versions and licences. Never holds the absolute home coordinates | Server, Client |
| **`TornadoVisuals`** | Funnel FX, shell materials and MetaSounds keyed by *morphology tag* (not by storm): `TMap<FGameplayTag, TSoftObjectPtr<UNiagaraSystem>>` etc., blended continuously by `R_m/H` and `I(t)` | Client |
| **`WindProfile`** | `Mass (0 = use body)` · `FVector AreaXYZ` · `CD, CL curve, APlan, Volume` · `BetaOrbit` · `LiftoffSpeed (computed in PostEditChangeProperty)` · `DefaultTier` | Server, Client |
| **`BasePart`** | `FGameplayTag PartType` · `TSoftObjectPtr<UStaticMesh> Mesh` · `TSoftObjectPtr<UGeometryCollection> Fractured` · `UMaterialTier* Material` · `FVector Size, float Mass, Area, Cp, ClRoof` · `TArray<FSnapSocket> Sockets (type, transform, joint modifier)` · `bIsFoundation, bIsSolidForShadow, Porosity` · `FItemCost Cost` · `UIcon` | Server (graph), Client (mesh/GC) |
| **`MaterialTier`** | `Ct, Cc, Cs (N)` · `Lambda (support loss)` · `T0 (GC strain)` · `HPPerKg` · `ImpactK` · `ShelterMax` · salvage yield · cosmetic skins (IAP hook) | Server, Client |
| **`DebrisSet`** | Weighted `TArray<{WindProfile, Mesh/Mass config, Tier}>` per biome (farm, town, forest) | Client, Server |
| **`PlatformScalability`** | tier budgets (T0/T1/T2 counts), receiver Hz per bucket, integrity Hz, net budgets, funnel quality | Client |

**Content scaling rule:** designers never author a storm. They tune *climate distributions* and add parts, vehicles and props by creating a **new DataAsset only**. No new Blueprint class is needed unless there is new behaviour. Validation runs through `UEditorValidatorBase` subclasses: every BasePart needs a GC, sockets must be symmetric, liftoff speed must be sane, `Φ` LUT generation must succeed, and the climate `Σ` must be positive-definite (Cholesky check).

---

## 5. Scalability and Netcode Plan

### 5.1 Server model

- **Dedicated server**, 30 Hz net tick. Chaos **async physics at a fixed 60 Hz** (Project Settings → Physics → *Tick Physics Async*, fixed Δt = 1/60), same on clients for parity.
- **Replication system:** Iris, for its per-connection prioritization and filtering (`SetupIrisSupport(Target)` in `Build.cs`, `net.Iris.UseIrisReplication 1`). The fallback is Replication Graph with spatial grid plus always-relevant nodes. **[VERIFY 5.6]** Iris maturity and the plugin set.
- **Session:** 1–16 players in one persistent open world (public, invite-only or solo). Several tornadoes can be alive at once in an outbreak (hard cap 6, oldest-weakest culled). Per-connection outgoing budget: PC 120 kbps, mobile 64 kbps sustained, burst 200 kbps.

### 5.2 What replicates, and how

| Thing | Method | Size / rate |
|---|---|---|
| Supercell | `FSupercellNetState`: pos, motion, cloud/precip params (quantised), radar seed | ~40 B at 0.2 Hz |
| Weather regime + hazards | `FWeatherNetState` on GameState: regime tag, day seed, hail swaths (center, radius, D̄, D_max), flood basin levels (uint8 per basin, delta-only), fire grid changes (RLE), wind/dust fronts | < 1 KB/s during storms, ~0 otherwise |
| Lightning | Unreliable multicast `{pos, seed}`. Fire and damage results replicate through the normal state paths | 10 B per strike |
| Tornado | `FStormNetState` (RepNotify): seed (uint64), `FTornadoSample` (quantised V_peak, R_m0, T_life, H, flags ≈ 12 B), spawn server-time, `TArray<FStormPathKey>` (6 keys × {pos NetQuantize10, vel NetQuantize10, t}). I(t) and R_m(t) are regenerated from the seed on each client | ~160 B at 0.5 Hz |
| Wind field | **Not replicated.** Evaluated locally from the storm state plus `GameState->GetServerWorldTimeSeconds()` | 0 |
| T0 / T1 debris | **Not replicated.** Spawned locally from replicated *events* (break event carries `seed`, scrape events come from the storm state) | 0 |
| T2 debris | Custom `FDebrisNetArray` (FastArraySerializer), per-connection prioritized, top-K | see below |
| T3 props / vehicles | Standard actor replication, `Physics Replication Mode = Predictive Interpolation` **[VERIFY 5.6]** | engine |
| Players | CMC-predicted movement (wind inside the prediction) | engine |
| Base parts | `FBasePartNetArray` on ABasePlot (FastArray) | delta-only |
| Break events | Unreliable multicast `{PlotId, PartIdx, uint8 strainQ, uint16 seed}`, plus a state bit in `FBasePartNetArray` for late joiners / relevancy | 8 B/event |

**T2 debris item (19 bytes):**

```cpp
USTRUCT() struct FDebrisNetItem : public FFastArraySerializerItem
{
    GENERATED_BODY()
    UPROPERTY() uint16 Id;                 // pool slot
    UPROPERTY() FVector_NetQuantize10 Pos; // ~6 B after quantisation at map scale (packed via NetSerialize)
    UPROPERTY() uint32 RotSmallest3;       // 2+10+10+10 bits quaternion
    UPROPERTY() FVector_NetQuantize Vel;   // ~6 B
    UPROPERTY() uint8 Flags;               // asleep | tier | owner-hint
};
```

`Priority = (m·|v|) / max(d, 5 m)² × (InView ? 2 : 1)`. Each connection gets the top 48 (PC) or 24 (mobile) items at 10 Hz: `48 × 19 B × 10 Hz ≈ 9.1 KB/s ≈ 73 kbps`. Clients run a **local proxy simulation** with the same wind field, which keeps them visually correct between updates. They blend to server state with critically damped spring correction (`ω = 12`), and snap when the error exceeds 3 m.

### 5.3 Why the player wind costs zero corrections

`UStormCharacterMovementComponent` computes `F_total` (§2.6, player profile) in `CalcVelocity` from `StormSubsystem->SampleWind(Location, ServerTime)`. The server time is taken from the move's timestamp, synced through `FSavedMove`. The field is a pure function of (position, time, replicated state). Client and server therefore compute identical accelerations, and **no wind data is ever sent in a move**. The only non-deterministic inputs are:
- `Shelter`, read from the replicated plot grid. It is identical on both sides once the grid replicates, and it lags by at most one net update. Hysteresis of 0.1 hides that lag.
- Debris impacts, which are server-authoritative GE applications followed by a knockback impulse. These are rare, and the resulting corrections are acceptable and even desirable, because they read as the "hit".

Tumble / ragdoll: a custom movement mode `Tumble` stays predicted (a capsule rolling through the wind field) while the ragdoll is **cosmetic only**, as a physical-animation blend on the mesh. There is never a replicated full ragdoll.

### 5.4 Base-part replication

```cpp
USTRUCT() struct FBasePartNetItem : public FFastArraySerializerItem
{
    UPROPERTY() uint16 PartIdx;
    UPROPERTY() uint16 DataAssetIdx;       // into plot's part palette (replicated once)
    UPROPERTY() FIntVector GridPos;        // snapped grid, 3×int16 packed
    UPROPERTY() uint8 Rot;                 // 24 orientations
    UPROPERTY() uint8 HealthQ;             // HP 0..255
    UPROPERTY() uint8 IntegrityQ;          // max σ over joints 0..255 → creak VFX/SFX + HUD
    UPROPERTY() uint8 StateFlags;          // Intact | Detached | Destroyed
};
```

`IntegrityQ` updates only when it changes by more than 8/255, which bounds churn during a storm. Clients rebuild their ISM from the net array, and `PostReplicatedChange` drives the creak cues.

### 5.5 Relevancy and prioritization

- `NetCullDistanceSquared`: storms are always relevant. Plots are relevant within 1.5 km. T3 props within 400 m. The T2 net array is per-connection filtered (Iris filter / ReplicationGraph node) within 250 m.
- `NetUpdateFrequency`: storm 2 Hz with ForceNetUpdate on phase change, plots 2 Hz idle / 10 Hz in storm, T3 props 20 Hz near / 5 Hz far (adaptive net update frequency).
- Dormancy: plots are `DORM_DormantAll` outside storms, flushed on edit and on storm entry. Props become dormant on sleep.

### 5.6 World Partition guidelines

**Map:** a 48.77 × 48.77 km 1:1 real-world recreation (§8), built as 3 × 3 landscape tiles of 8129 px, plus a 50 km non-walkable horizon ring. The dedicated server streams cells only around players (server-side World Partition streaming **[VERIFY 5.6]** cvar name). With 16 players spread over 2,380 km², that keeps server memory proportional to the number of player bubbles, not the map size. Storms can form anywhere, including 8 km off-map, and drift in.

| Runtime grid | Cell size | Loading range (PC / mobile) | Contents |
|---|---|---|---|
| `Grid_Terrain` | 256 m | 1024 / 512 m | Landscape proxies, roads, large rocks |
| `Grid_Main` | 128 m | 512 / 256 m | Buildings (Packed Level Actors), fences, trees |
| `Grid_Props` | 64 m | 192 / 128 m | Destructible props, T3 physics props (pooled spawners, not placed bodies) |
| `Grid_Landmarks` | 512 m | 3072 / 1536 m | Silos, water towers, radio masts (visible storm reference points) |

- **HLODs.** Layer 1 is Instanced for foliage and props, Layer 2 is Merged Mesh for towns, Layer 3 is Simplified Mesh for everything beyond 2 km. Enable HLODs on every grid. Mobile HLOD distances are 0.5×.
- **Data Layers.** `DL_StormScars` (runtime) holds post-storm debris fields and snapped trees. It is toggled per region by the Damage Ledger. `DL_Season_*` holds seasonal biomes (live-ops).
- **Streaming sources.** Player controllers, plus **each active storm on clients only** as a low-priority source (radius 300 m). This makes sure the ground the storm is about to hit is loaded *before* it arrives, so no pop-in occurs during the money shot.
- **Server.** The server streams around all player sources. The **Deferred Damage Ledger** handles storm damage in unloaded cells. The server records the storm's swept path as capsules `{segment, R_m, V_max, t}`. When a cell loads, `IStormDamageable::ApplyLedger()` runs on its actors and applies analytic damage (`σ` estimated from `q(r)`) without simulating. The world stays consistent everywhere, and the cost is nearly zero.
- **Actor budget.** Keep fewer than 1,500 actors per loaded `Grid_Main` cell area. Use Packed Level Actors and ISM everywhere. No per-prop Blueprint actors for static clutter.
- **One File Per Actor** stays on. The cell sizes above keep each streaming request under about 2 MB on mobile.

### 5.7 Rendering scalability

| Feature | PC Epic (RTX 3080+, 1440p/60) | PC High (RTX 3060, 1080p/60) | Mobile High (A17 Pro / SD 8 Gen 3, 30–60) |
|---|---|---|---|
| Geometry | Nanite everywhere, including foliage (5.6 Nanite foliage path **[VERIFY 5.6]**) | Nanite | Authored LODs + HLOD; Nanite fallback meshes |
| GI / reflections | Lumen HW-RT, Hit Lighting off | Lumen SW (global SDF) | No Lumen; stationary sky + precomputed storm "lighting scenario" blends; SSR off, planar off |
| Shadows | Virtual Shadow Maps | VSM, lower page pool | CSM, 2 cascades, 1024 |
| Sky / clouds | Volumetric Clouds, storm cell authored; funnel = Heterogeneous Volume **[VERIFY 5.6]** | Volumetric Clouds (lower samples); funnel = raymarched shell | 2-D cloud dome + funnel mesh shell with animated flowmap |
| Rain / debris FX | Niagara GPU, 200k | 80k | 20k, depth-collision off, soft particles off |
| Upscaler | TSR 67% (or DLSS/FSR plugin) | TSR 58% | Mobile TSR / spatial, 70% |
| Foliage wind | MF_StormWind WPO, full | full | Simplified (vortex term only, no noise) |

**Frame budgets:**

| Budget | PC High (16.6 ms) | Mobile High (33.3 ms, 30 fps mode) |
|---|---|---|
| GPU: Lumen GI + reflections | 4.0 | – |
| GPU: Base pass + Nanite / VSM | 4.5 | 12.0 (base + shadows) |
| GPU: Clouds + funnel | 2.5 | 3.0 |
| GPU: Niagara | 1.5 | 3.0 |
| GPU: Post + upscaler | 2.0 | 4.0 |
| GPU headroom | 2.1 | 11.3 (thermal) |
| Game thread: storm subsystem + receivers | 1.0 | 2.0 |
| Game thread: Mass T1 debris | 0.8 (worker threads) | 1.5 |
| Physics thread (async) | 4.0 | 6.0 |
| Structural integrity (server only) | 0.5 per plot at 10 Hz | – |

**Custom CVars** (driven by Device Profiles and `UPlatformScalabilityDataAsset`):

```
storm.Debris.MaxT0        200000 | 80000 | 20000
storm.Debris.MaxT1        4000   | 2500  | 600
storm.Debris.MaxT2        96     | 64    | 24
storm.Wind.NearHz         20     | 20    | 15
storm.Wind.FarHz          5      | 5     | 2
storm.Funnel.Quality      3      | 2     | 0
storm.Foliage.WindNoise   1      | 1     | 0
storm.Net.T2TopK          48     | 48    | 24
```

**Mobile specifics:** 30 fps lock by default, with a 60 fps "Performance" toggle that halves T0/T1. Thermal-state polling (`FPlatformMisc` thermal APIs) steps `storm.Debris.*` down one tier when throttling is detected. Use ASTC textures and a 1.5 GB memory ceiling, and budget PSO precaching (the PSO precache and bundled PSO cache) for the storm VFX specifically, because the first touchdown is the worst hitch risk.

### 5.8 Profiling and CI gates

- Insights markers: `TRACE_CPUPROFILER_EVENT_SCOPE(Storm_SampleBatch)`, `Storm_Integrity_Solve`, `Storm_T1_Integrate`, `Storm_Net_T2Prioritize`.
- **Gauntlet perf test** `Perf.OutbreakTown`: a fixed-seed EF5 wedge (test-only seed override, never in shipping builds) crossing a town with 16 bots. The build fails if PC p95 exceeds 16.6 ms, mobile p95 exceeds 33.3 ms, server p99 exceeds 33 ms, or any connection's p95 goes above its budget.
- **Automation tests.** `Wind.Parity` (CPU vs GPU), `Wind.Determinism` (the same seed gives the same path, bit-exact on the server), `Integrity.KnownCases` (a wood wall fails at EF3 and a reinforced bunker survives EF5), `Net.WindPredictionNoCorrections` (8-bot soak, correction count must be 0 when no debris hits).

---

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| GC spawn hitch at touchdown | Frame spikes in the money shot | GC pool prewarmed; async-load funnel bundles when a supercell spawns (minutes before any touchdown); no more than 4 GC spawns per frame (queue) |
| Chaos non-determinism across platforms | Divergent debris on clients | Only T2/T3 can affect gameplay (server-owned); everything else is cosmetic by design |
| Randomness produces long quiet stretches | Players bored waiting for storms | By design there is no pity timer. The open world (jobs, driving, property, crime, multiplayer) carries quiet days. Tune `λ` in the climate, and use live-ops *seasons* that change regime probabilities, never individual storms |
| Real-world map data gaps (no 1 m lidar, stale OSM) | Wrong terrain or missing buildings | Fall back to 10 m DEM plus a NAIP-guided manual fix-up pass; pipeline flags any footprint without a height |
| Legal or PR exposure from destroying a real place | Complaints or takedown | §8.5 rules, generic neighbour homes, `bFictionalizePlaceNames`, legal review before launch |
| A 2,380 km² map feels empty | Long drives with nothing happening | Activity density follows the real places (§8.9); the weather keeps the open country eventful; vehicles, including small planes from real airstrips, make distance part of the fun; POI-driven detail budget (towns full detail, farmland procedural) |
| A random EF5 wipes out a new player's house | Churn | Loss is money/time only; insurance economy; starter homes cheap to rebuild; the event itself is the best clip they'll ever get |
| Players exploiting sheltered spots | Stale | Random paths, sizes and rain-wrap mean no spot is safe every time; basements can still collapse (§3) |
| Mobile thermal throttling in long sessions | Frame drops during outbreaks | Thermal step-down; Chaos Cache playback for hero collapses; 30 fps default |
| Engine-version API drift (async physics handles, Iris, Heterogeneous Volumes) | Rework | Isolate behind `StormCore` interfaces; each marked **[VERIFY 5.6]** item gets a spike ticket in sprint 1 |

---

## 7. Sprint-1 Vertical Slice (deliverables)

1. `StormFieldMath.h` + subsystem + LUT bake, with the `Wind.Parity` test passing.
2. `UAtmosphereSubsystem` + `ASupercell` + tornadogenesis + copula sampler + procedural lifecycle. Run a histogram test over 10k simulated in-game days: EF shares within ±2% of `DA_Climate`, and no two consecutive tornadoes identical. Seed parity is bit-exact on client and server.
3. `UWindReceiverComponent` (Predicted + PhysicsBody), with a player holding on in EF2 during a netcode soak at 0 corrections.
4. `ABasePlot` with 30 parts: stability, loads, failure, GC hand-off, salvage conversion.
5. T0/T1/T2 debris with pools and the T2 net array at 73 kbps measured.
6. Warning service, town sirens, phone alert/radar app, and the Mass crowd storm reactions, all diegetic, zero HUD prompts.
7. A 4 × 4 km World Partition slice (one town plus farmland) running the live weather simulation for 2 real hours unattended, profiled on an RTX 3060 and an iPhone 15 Pro.
8. `Tools/MapBuilder` run on the real center point: the 6 × 6-tile landscape, roads, fields and generated destructible farmsteads imported into World Partition, plus the hero-zone home, with `DA_Climate` calibrated from the local SPC/NOAA records.

---

## 8. The Map: 1:1 Recreation of a Real Rural Area

The game map is a **1:1 real-world recreation** of the lead's home area in the Upper Midwest: rural **ridge-and-coulee terrain**, with broad valley floors of cropland cut by steep wooded coulees and topped by open ridgetop farms with long sightlines. Every road, field boundary, creek, tree line, farmstead and town is where it is in real life, at true scale.

### 8.1 Extent and scale

| Item | Spec |
|---|---|
| Center | The chosen real-world point (stored locally only, §8.5) |
| Playable area | **48.77 × 48.77 km** (≈ 30 × 30 mi, 2,380 km², about 30× the land area of a GTA V-scale map): **3 × 3 landscape tiles of 8129 × 8129 px at 2 m/px** (Scale X/Y = 200). 8129 is Epic's largest listed single-landscape size (32 × 32 components, 2 × 2 sections, 127 quads). Neighbouring tiles share edge vertices, verified bit-exact. Import through World Partition tiled heightmap import (`heightmap_x#_y#.r16`) **[VERIFY 5.6]**. `--tile-quads 4064` gives an equivalent 6 × 6 grid of 4065 px tiles if smaller import units are easier. Mobile cooks a 4 m/px downsample |
| Framing | The map center is offset from home so that all nearby towns, the interstate and the raceway fit. Home sits a few km south-west of the center, well inside the map |
| Hero zone | A 2 × 2 km area around home, rebuilt from 1 m lidar with Landscape Patch detail and hand-authored buildings |
| Horizon ring | A further 50 km in every direction as low-poly terrain mesh HLOD from 10 m DEM. Never walkable, but it makes distant supercells sit correctly on the real horizon |
| Weather margin | 8 km of atmosphere simulation beyond the playable edge (§2.0.1), so storms form off-map and roll in |
| Terrain character (measured) | Branching valley network, a broad river floodplain crossing the map, steep 40–120 m coulee walls, flat ridgetop uplands. Valley floors are cropland; the slopes are mostly hardwood forest |
| Z scale | Set from the real relief: `ZScale = ((maxElev − minElev)/2 + 20 m) · 100 · 128 / 32768`. **Measured over the full map:** elevation 217–428 m, relief 211 m → `ZScale = 49.07`, Landscape Z = 10,561 cm (lowest point at Z = 0), 0.38 cm vertical precision. The DEM came back complete, with zero gaps across all tiles |
| Origin | The `AGeoReferencingSystem` actor (GeoReferencing plugin), with a projected CRS set to the UTM zone of the center point. World origin = center. 1 uu = 1 cm; Large World Coordinates cover ±8 km trivially |

Drive times at true scale: about 30 min edge to edge at 100 km/h on highways, longer on gravel. That is the point: real distance between towns, with storms visible across it.

### 8.2 Source data (all public; US assumed)

| Layer | Source | Resolution | Used for |
|---|---|---|---|
| Elevation | USGS 3DEP lidar DEM (1 m where flown, 1/3″ ≈ 10 m everywhere) | 1–10 m | Landscape heightmap, basins and flood routing (§2.0.6) |
| Surface heights | 3DEP lidar point cloud (first return), DSM − DEM | 1 m | Building heights, tree heights and canopy extents |
| Street-level reference | The lead's own photos and video (primary), Mapillary (CC BY-SA, attribution required). **Google Earth / Street View are not used**: Google's terms forbid copying or tracing their imagery into another product, so it cannot be a source for a commercial game | – | Building styles, road-edge detail, signage types, fence and mailbox styles, barn colours |
| Aerial imagery | USDA NAIP | 0.6 m | Reference only: material tinting via a runtime virtual texture, placement validation. Never used as the final ground texture |
| Roads, rail, power, POIs | OpenStreetMap | vector | Road splines (surface type: paved / gravel / dirt), rail, **power lines** (poles and spans for storm damage), town layout |
| Building footprints | **Microsoft Global ML Building Footprints** (`mapbuilder.py buildings`) + OSM + lidar | vector | Every house, barn, shed and silo. **Measured over the full map:** Microsoft has 27,089 footprints (26,339 with a height estimate) against 1,674 in OSM. Lidar (§8.7) refines height, eave and roof shape |
| Bridges | **FHWA National Bridge Inventory 2025 via BTS NTAD** (`mapbuilder.py bridges`) | points | **Measured:** 314 bridges and culverts with real length, deck width, span count, material and design (the oldest is from 1920, the longest is 92.7 m). A procedural bridge is placed wherever a road spline crosses NHD water, and each is matched to the nearest NBI record within 50 m for its dimensions and type |
| Fields and crops | USDA Cropland Data Layer | 30 m | Per-field crop type (corn, wheat, soy, pasture, fallow). Crop height follows the in-game calendar |
| Land cover / canopy | NLCD 2021 land cover + tree canopy | 30 m | Biome masks and PCG density for ground cover and forest fill. There is no public per-tree dataset, so individual trees come from lidar canopy-height analysis instead (§8.7). NLCD drives the fill and species mix |
| Water | USGS National Hydrography Dataset, large scale (`mapbuilder.py water`) | vector | **Measured:** 3,460 km of flowlines (80 named streams), 758 waterbodies, 109 river areas → Water-plugin rivers and lakes. The lidar DEM is already hydro-flattened, so channels are in the terrain before import; spline masks refine them |
| Local storm climate | NOAA/SPC tornado tracks since 1950, NOAA Storm Events (hail, wind, flood) within 80 km | records | Calibrates `DA_Climate`: EF shares, month-by-month seasonality, dominant storm motion (usually SW → NE), path lengths. The game then boosts the frequencies (§2.0.3) |

**Measured road network:** about 650 km of road in the square. Roughly 46% is tagged asphalt, but about 48% has no surface tag, so gravel and dirt town roads must be classified from NAIP imagery and the lead's knowledge.

**Licensing.**
- **Public domain:** USGS (3DEP, NHD), USDA (NAIP, CDL, NLCD), NOAA/SPC and FHWA/BTS (NBI). Citation is appreciated.
- **OpenStreetMap = ODbL.** The in-game credits must say "© OpenStreetMap contributors". Share-alike applies to a redistributed derived *database*, not to the game's art or code.
- **Microsoft Global ML Building Footprints = CDLA Permissive 2.0** (the legacy US dataset was ODbL). Attribute Microsoft/Bing, and legal reads the CDLA before ship.
- **Not used:** Google or Bing photorealistic 3D tiles, and Google Earth / Street View. Their terms prohibit extracting or tracing their data into a shipped product.
- **Cesium ion is not shipped on.** The Community tier is non-commercial; the terms ban offline or baked use and require an in-game Cesium ion logo; display rights end if the plan lapses. Cesium for Unreal (Apache 2.0) may be used as a development-only reference layer. The shipped build is fully self-contained, with all data baked in.
- **Real brands** (the regional convenience-store chain, the furniture maker, restaurants) appear with their real names and signage only under a trademark licence. Otherwise they get a close local-flavour lookalike (§8.5).

**Import tooling options (UE 5.6):**
- **Our own Editor Utility** (default): reads the MapBuilder JSON directly.
- **Landscape Combinator** (Fab, paid; heightmap → landscape, OSM → splines, buildings, foliage): **[VERIFY]** the current price and EULA before relying on it.
- **StreetMap plugin forks and blosm** (Blender, GPL): acceptable for one-off asset generation only after each repo's licence is checked for commercial use.

**Open data questions and their status:**

| # | Question | Status |
|---|---|---|
| 1 | DEM completeness across the map | **Closed:** zero nodata across all tiles; the 1 m lidar is also confirmed (2022 flight) |
| 2 | OSM completeness | **Closed:** roads are complete in every village (4,390 km, verified visually against the terrain). Buildings are **not** complete (1,674), so Microsoft footprints are used |
| 3 | County road-centerline set on geodata.wisc.edu | Open. Only needed if an OSM road proves wrong |
| 4 | WisDOT bulk centerlines | Open, and unlikely to be public (WISLR is internal). Not needed |
| 5 | NBI lat/long withheld | **Closed:** the BTS NTAD feature service returns positions for all 314 bridges |
| 6 | Landscape Combinator price and EULA | Open **[VERIFY]** |
| 7 | Cesium ion pricing | Not needed; not shipping on Cesium |

### 8.3 Build pipeline (`Tools/MapBuilder/`, Python + UE Editor Utility)

```
location.local.json (lat, lon, size_km; git-ignored)
  └─ fetch.py     3DEP DEM + lidar tiles, NAIP, CDL, NLCD, NHD, OSM (Overpass), MS footprints → cache/
  └─ project.py   everything reprojected to UTM (GDAL/rasterio), clipped to the square, origin shifted to center
  └─ terrain.py   DEM → 3×3 tiles of 8129² 16-bit heightmaps, one shared Z scale (+ hero-zone 0.5 m patch), road-corridor flattening mask,
                  D8 flow accumulation → basins + stage–volume curves (flood model)
  └─ layers.py    NLCD/CDL → landscape weight maps (grass, dirt, gravel, crop-row, mud, water edge)
  └─ vectors.py   roads/rail/power/buildings/trees/fields → GeoJSON in local meters with attributes
                  (road width from lane tags, building height from lidar DSM, tree height from canopy)
  ▼
UE 5.6 Editor Utility "BuildRealMap"
  Landscape import (World Partition, streaming proxies) → Landscape splines/patches for roads
  PCG graphs:  fields (crop per CDL class, row direction from field geometry), tree lines/windbreaks,
               fences along parcel/field edges, mailboxes/driveways from footprint-to-road nearest point
  PCG shape grammar: footprint + height + roof class → modular farmhouse/barn/shed/silo from the
               destructible kit, so every generated building is automatically an ABasePlot integrity graph (§3)
  Power grid:  OSM lines → poles + cable spans registered as integrity-graph members (§2.0.6 ice/wind)
  Water:       NHD → Water bodies; flood basins → dynamic water level actors
```

Everything is regenerable. Re-running the pipeline with a new center point builds a new map. Hand-authored hero content (the home, landmarks) lives in separate data layers, so a rebuild never touches it.

### 8.4 Why this terrain suits the game

- **Hidden approaches.** In coulee country a supercell is visible from the ridgetops 30+ km out, but a tornado can come over the ridge with almost no warning if you are down in a valley. Players learn to get up high to read the sky, which is exactly the diegetic skill loop from §1.2.
- **Sightlines.** Ridgetop farms and the broad river floodplain give the long, open views where a funnel frames against the sky, with the 50 km horizon ring behind it.
- **Terrain changes the wind.** The wind field samples height above the storm's base (§2.1), so a funnel crossing a 100 m ridge-to-valley drop visibly stretches and shifts. Coulees also channel straight-line winds and floodwater (§2.0.6).
- **Flash floods.** Steep, narrow coulees with roads along the creek beds are real flash-flood terrain. The flood model gets its most dramatic use here.
- **Performance.** A rural density of about 5–20 buildings per km², plus forest that is instanced foliage on the slopes, keeps actor counts far under the §5.6 budget.
- **Readable damage.** A track across valley cropland and forested ridges leaves a visible scar (flattened corn, snapped hardwoods, debris lines) that stays in `DL_StormScars`.

### 8.5 Privacy and real-world content rules

- **The exact home coordinates are never committed.** This repository is public, so `location.local.json` is git-ignored and the committed map uses coordinates relative to the center only. The build machine holds the real anchor.
- **Neighbours' homes** are generated as *generic* buildings from footprint and height data. No names on mailboxes, no real house numbers, no interiors modelled from real photos, and nothing that identifies a private person.
- **Businesses and brands** are renamed or generic (e.g. the co-op grain elevator becomes a fictional name) unless they are licensed.
- **Town and road names:** real ones are allowed. The shipping build has a `bFictionalizePlaceNames` switch in case legal review prefers fictional names; since the map shows real places being destroyed, legal must review it before the game ships commercially.
- **The home itself** is hand-authored at hero quality from the lead's own reference photos, and is the lead's choice to include.

### 8.6 Local climate calibration (measured)

`mapbuilder.py climate` read the SPC database for tornadoes within 80 km of the map center, 1951–2025:

| Metric | Real value | How the game uses it |
|---|---|---|
| Tornadoes per year | 3.1 (232 total) | The real area is active for the region but is **not** the country's stormiest spot. The game multiplies the hazard rate so tornadoes happen on about 18% of peak-season days (§2.0.5). That is the "most storms around" fiction |
| EF share | EF0 33% · EF1 42% · EF2 19% · EF3 5% · EF4 1% · EF5 0% | Shape of the game climatology. The game keeps the curve and fattens the tail to EF3 9%, EF4 4%, EF5 1% |
| Season | May 19% · **Jun 26% · Jul 22%** · Sep 11% · Dec 6.5% · Aug 6% · Apr 6% | The **peak season for this map is early summer (May–July)**, not spring. There is a secondary September peak, and rare December events are real (a December 2021 outbreak hit the region), so winter tornadoes stay possible at low odds |
| Mean storm motion | 67° (from the WSW toward the ENE) | Default direction for supercell motion (§2.0.1) and warning polygons. Most storms enter the map from the west or southwest |
| Path length | median 3.1 km, 90th percentile 26.8 km | Lifespan distribution (§2.0.3): median `T_life` about 4 min at typical speeds, with a long tail |
| Path width | median 46 m, max 823 m | Size distribution (§2.0.3): the `R_m0` median stays near 45 m, and the widest local tornadoes sit in the upper tail |

The season table in §2.0.5 is written for the peak season. For this map, "peak season" means May–July.

### 8.7 Street-level fidelity: the "that's my road" standard

**Goal:** a local player driving any road in the map recognises it as their own road: the same curves, hills, barns, tree lines, signs and mailboxes in the right places. **Nobody drives the roads to capture it.** Everything comes from remote data, from highest to lowest priority:

| Source | Coverage | What it gives |
|---|---|---|
| **3DEP lidar point cloud** (primary; `mapbuilder.py lidar`) | 100% (about 46 billion points over the full map; processed tile by tile on a workstation, and only the derived objects are kept). Dataset `WI_12County_7_B22` (2022), **measured at 19.5 points/m²** | Every tree (position, height, crown), every building (footprint, height, eave, roof type and ridge direction), road crown and ditches, **power lines and poles** (visible as wire returns), fences and hedgerows. First 1 × 1 km test: 19.5 M points → 6,035 trees (tallest 27.6 m) and 6 buildings, matching the farmstead layout |
| **NAIP + state/county orthophotos** | 100%, 0.15–0.6 m | Roof and siding colours, gravel vs. paved roads, driveways, field edges, silos and grain bins, yard layout |
| **Mapillary** | Whatever the community has uploaded | CC BY-SA street photos and machine-detected signs with positions. Used where available to confirm sign types |
| **Statewide parcels and address points** (public GIS) | 100% | Every driveway location (address point → road link), parcel lines for fences. Owner names and house numbers are dropped on import (§8.5) |
| **MUTCD rules** | 100% | Sign placement where no photo exists: stops and yields at minor-road approaches, curve and hill warnings from the lidar road geometry, speed limits by road class, road-name blades at every intersection. Rural Wisconsin signage is standardised, so rule-placed signs read as correct |
| **The lead's own photos** | Hero zone only | The home, and a handful of landmarks the lead picks. Phone photos taken on normal trips are enough; no dedicated drive |
| *Optional later:* a hired local driver with a 360° camera, or community capture after launch | Gaps only | For the few spots the blind-drive test (below) flags |

**Remote-data → map pipeline:**

```
3DEP lidar (EPT tiles on AWS) ─► per 1–2 km tile: ground, surface and canopy-height grids at 0.5 m
    ├─ buildings = tall, planar, single-return surfaces → footprint, height, eave, roof type, ridge axis
    ├─ trees     = canopy-height local maxima outside buildings → (x, y, height, crown radius)
    └─ wires     = linear returns above ground between pole candidates → power spans (§2.0.6 ice/wind)
NAIP/orthophoto ─► roof/siding colour per building, surface class per road segment, driveway polygons
Parcels/address points ─► driveway entry points, fence lines
Rules (MUTCD) + Mapillary ─► signs
    ▼
street_furniture.json + lidar_objects_*.json (local meters) → PCG spawns the matching kit asset at each position and heading
```

**Per-object fidelity rules:**

| Object | Source of truth | In-game |
|---|---|---|
| Road geometry, crown, ditches, culverts | Lidar ground returns (0.5 m) | Landscape splines follow the real centerline; ditch profile comes from lidar |
| Road signs | MUTCD rules from the road geometry (stop/yield at minor approaches, curve warnings where the radius is under 150 m, hill warnings from lidar grades), confirmed or overridden by Mapillary detections | Real type, text and position. Road-name blades use the real names (subject to the §8.5 switch) |
| Fire-number / address posts | Statewide address points (positions only) | Placed at every real driveway with the local colour and style. **Numbers are generic**, never the real address (§8.5) |
| Mailboxes, driveways, gates, fences | Address points + parcels + orthophotos | Real positions; styles picked from the kit to match the photos |
| Houses, barns, sheds, silos, grain bins | Lidar footprint, height and roof shape + orthophoto colour; style picked from the regional kit (gambrel barns, stone-foundation farmhouses, steel machine sheds, grain bins) | Kit assembly (destructible, §3): gambrel/gable/shed roof, siding colour, barn red/white, stone foundations. Generic interiors |
| Trees | Lidar canopy-height model: one tree per local maximum (height, crown radius) + species from leaf-on/off NAIP | Every real tree in the right place with the right size. Forest interiors are PCG-filled to the same density |
| Fields | Cropland Data Layer + orthophotos | Real crop per field and row direction; crop growth follows the in-game calendar |
| People, license plates, real vehicles | **Never captured, never reproduced** | – |

**Easter-egg standard.** The acceptance test is a blind drive: a local tester drives a random 5 km of in-game road and must identify where they are within 60 s. Any failed segment gets a fix-up pass: an artist corrects it from orthophotos and Mapillary, or, if it's still wrong, that segment alone is photographed.

### 8.8 Parked vehicles you can steal

Real vehicles are never copied from imagery: the imagery goes stale, and copying them is a privacy problem. Parked cars are **generated** from the real driveway and building layout, so every farmstead looks lived-in.

- **Spawn points.** Driveways come from the statewide address points, or from the nearest-road link of each residential footprint. Each driveway gets 0–3 `AParkedVehicleSpawn` points along its last 30 m and in front of garages and machine sheds.
- **Vehicle choice.** A weighted pick from `DA_RuralVehicleSet` by building class. Farmhouses favour pickups, SUVs and older sedans. Farmsteads with machine sheds add a tractor, a skid steer or a truck with a stock trailer. In-town houses favour sedans and minivans. All models are fictional (no licensed brands unless a deal is signed).
- **Behaviour.** A `BP_Vehicle_Base` child (§4.2) in *parked* state: physics asleep, doors locked by probability. It can be stolen with a break-in or hotwire ability (a GAS ability). The owner NPC (Mass, promoted to an actor when a player is near) may come out and react; police respond through the open-world crime system.
- **Storms move them.** Parked vehicles are T3 wind receivers (§4.5): a tornado can roll them across the yard or carry them into a field, and they stay there (Damage Ledger).
- **Streaming and netcode.** The spawn points are World Partition actors in `Grid_Props`. The server seeds which vehicle goes where per in-game week, so parked cars change slowly over time. A stolen vehicle becomes player-owned state and persists.

### 8.9 Places and things to do (from the real map)

An OpenStreetMap census of the 49 km square (`mapbuilder.py osm`; the named list stays in the git-ignored `out/`) found the real places below. Each one becomes gameplay. Real business names are renamed (§8.5); the place types and positions stay real.

| Real feature (count) | What it becomes in-game |
|---|---|
| **Interstate corridor** (about 40 motorway segments, interchanges, a truck stop with a weigh scale, a motel) | Highway pursuits, a trucking and freight job, semis tipping in derecho winds (§2.0.6), the truck stop as a social hub |
| **1 town + 11 villages + 21 hamlets** | Each has real streets, a main street, churches (16), schools (28), fire stations, bars and taverns, gas stations and convenience stores (20). Property to buy, shops, jobs, crime and police |
| **Furniture-factory complex** (industrial) and **sand quarries** (12) | Factory and haul-truck jobs, heavy equipment to drive or steal, big industrial destruction set pieces when a tornado hits them |
| **Motorsport:** a raceway, 7 dirt tracks, motocross, a hill-climb | Weekly dirt-track races, motocross and hill-climb events, a demolition derby at the fairgrounds, street and gravel-road racing |
| **Airfields** (6, including private strips) + **hospital helipads** (2) | Small planes and a helicopter to fly (storm chasing from the air is dangerous and spectacular), a medevac job, respawn points |
| **Hospitals** (2), fire and police stations | EMS, firefighting (grass fires, §2.0.6) and police jobs. Storm response calls come to you after real damage |
| **Outdoors:** wildlife and public hunting areas, 33 parks, 6 campgrounds/RV parks, 4 golf courses, a state trail, 188 field tracks, the river and creeks | Hunting and fishing seasons, ATVs and dirt bikes on field tracks, snowmobiles on the state trail in winter, camping (a tent is the worst place to be in a storm) |
| **FM radio tower** | The in-game local radio station: music, ads and live weather bulletins (§1.2). A tornado can take the tower down, and the station goes off-air |
| **Farms** (thousands of fields, farmsteads with lidar-accurate barns and bins) | Farmhand and harvest jobs, tractors and combines, crop damage from hail, livestock to rescue after storms |

**Detail budget follows the places.** Towns, the interstate and activity sites get full-detail streets and interiors. Farmland between them is generated from the lidar, aerial photos and crop data (§8.7), so it's accurate but cheap to build. Everywhere is 1:1, but the art hours go where players spend their time.
