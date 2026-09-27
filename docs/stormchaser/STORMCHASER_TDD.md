# STORMCHASER — Technical Design Document

**Engine:** Unreal Engine 5.6 · **Targets:** PC (DX12/Vulkan, SM6), iOS/Android high tier · **Genre:** Open-world disaster survival, 1–8 player co-op (dedicated server)
**Doc owner:** Lead Systems Architect / TD · **Status:** v1.0, ready for pre-production review

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

**The core design decision:** the wind field is a **closed-form, deterministic function** `V(P, t | StormNetState)`. The server replicates only a few bytes of storm state (seed, path keys, lifecycle time). Every machine can then evaluate the same wind at any point. This one choice drives:
1. **Netcode.** Player wind forces run inside client-side movement prediction with zero corrections, and cosmetic debris costs no bandwidth.
2. **Visual coherence.** Grass, trees, cloth, Niagara and physics all read the same field.
3. **Performance.** No fluid sim. A field sample costs about 60 flops.

---

## 1. Core Loop Breakdown

### 1.1 The 30-Second Survival Panic Loop (micro)

This is the clip generator. It triggers on every storm "threat pulse": touchdown, direction change, a satellite vortex, a debris barrage, or a hail core.

| t (s) | Beat | Player verbs | Systems / signals |
|---|---|---|---|
| 0–3 | **Read** | Look, listen | `Event.Storm.ThreatPulse` → siren GameplayCue, pressure-drop audio (low-pass sweep plus ear-pop), sky darkens (Lumen skylight lerp), the HUD wind-vector ring points to the threat |
| 3–10 | **Decide** | Shelter / Brace / Chase | Exposure meter starts to rise. Probe "data multiplier" shows on the HUD (risk/reward bait) |
| 10–25 | **Execute** | Sprint, slide, grapple, anchor, drive, deploy probe | Wind forces active. Tier-1/2 debris ramps up. Hits apply `GE_DebrisImpact` |
| 25–30 | **Resolve** | Survive / ragdoll / get launched | Reward popup (Data, Salvage). **Clip flag**: the server fires `Event.Clip.Highlight` when a player exceeds 25 m/s airborne or is hit by an object heavier than 200 kg, or when a base breaks with more than 20 joints. The client saves the rolling replay buffer (§4.8) |

**Three decisions, all valid, all clippable:**
- **Shelter.** Reach a cellar or reinforced core. Safe, but earns nothing.
- **Brace** (`GA_Brace`). Anchor to a structure or a ground stake. Your Grip attribute has to beat the wind force (§2.6). Medium risk and medium reward.
- **Chase** (`GA_DeployProbe`, `GA_Grapple`, `GA_WindSurf`). Ride the edge of the inflow and drop probes as close to the core as you dare. Data reward scales with `v_local²` (§2.9). High risk and a huge payoff. This is the streamer moment.

### 1.2 The 5-Minute Storm Phase (meso)

The storm is one `AStormActor` driven by a lifecycle curve `I(t) ∈ [0,1]` from `UStormArchetypeDataAsset`.

| Phase (tag) | Window | I(t) | What happens |
|---|---|---|---|
| `Storm.Phase.Forming` | 0:00–0:60 | 0 → 0.35 | Wall cloud and rotating mesocyclone VFX. Rain curtains, gust front (straight-line wind `V_amb` ramps up). The forecast cone on the map narrows |
| `Storm.Phase.Touchdown` | 0:60–1:30 | 0.35 → 0.8 | Condensation funnel descends (funnel-shader `CloudBase → 0`). Ground debris ring spawns. **Threat pulse #1** |
| `Storm.Phase.Mature` | 1:30–3:30 | 0.8 → 1.0 | Peak V_max. Path wander plus player-heat bias (§2.8). 1–2 satellite vortices at EF3+. **Threat pulses #2–#4** |
| `Storm.Phase.Roping` | 3:30–4:30 | 1.0 → 0.4 | Core radius shrinks and the funnel ropes out. Tangential speed briefly spikes (angular momentum conservation, `V_max ∝ 1/r_c` with a clamp). **Final pulse**, the most violent |
| `Storm.Phase.Dissipated` | 4:30–5:00 | 0.4 → 0 | Debris settles. Fragments sleep → converted to salvage ISM piles. Damage ledger is committed (§4.6) |

### 1.3 The 30-Minute Session (macro): Recovery and Building

A session runs 3 cycles with escalating intensity, then an extraction/bank step. Cross-progression persists the **Home Base blueprint** (the layout), unlocks and cosmetics. The session base itself is disposable.

```
[Cycle 1 ~10 min]  Forecast(0:30) → Prep/Build(4:00) → STORM EF1–EF2(5:00) → Salvage(0:30)
[Cycle 2 ~10 min]  Forecast(0:30) → Repair/Upgrade(3:30) → STORM EF2–EF3(5:00) → Salvage(1:00)
[Cycle 3 ~10 min]  Forecast(0:30) → Fortify(3:00) → FINALE EF4–EF5 / twin vortex(5:30) → Bank & Extract(1:00)
```

| Recovery verb | System | Output |
|---|---|---|
| Salvage | Line trace → `ASalvagePile` (ISM, from slept Chaos fragments) | Material currency by `Build.Material.*` |
| Repair | `GA_Repair` → UStructuralIntegrityComponent resets fatigue `D` | Structures back to 100% |
| Build / Upgrade | `GA_Build` → UBuildGridComponent snapping → part added to the SoA graph | New parts, upgraded material tier |
| Forecast | `UStormScheduleDataAsset` rolls the next archetype and shows a probability cone | Players plan base orientation (wind load is directional, §3.3) |
| Research | Data currency → unlocks (anchors, shutters, grapple upgrades) | Persistent meta (cross-progression) |

**Retention hook:** the storm path is seeded and shown as a forecast cone, so players can *engineer* their bases against a known threat. Engineering choices matter because the physics are real: aerodynamic orientation, bracing and material tiers all change the outcome.

---

## 2. Physics and Math Spec: Tornado Wind Field

### 2.1 Symbols and frame

| Symbol | Meaning | Default (EF3) |
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

Three profiles are shipped, and the archetype selects one (`EVortexProfile`).

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

**Enhanced Fujita calibration** (use `V_peak` = mid-band, `B(10m)` ≈ 0.86, so ground-level gusts land in the band):

| Rating | 3-s gust (m/s) | `V_peak` authored (m/s) | `R_m0` (m) | Gameplay intent |
|---|---|---|---|---|
| EF0 | 29–38 | 38 | 30 | Tutorial. Props tumble, players stagger |
| EF1 | 38–49 | 50 | 40 | Unbraced players lift inside the core |
| EF2 | 50–60 | 63 | 50 | Wood walls fail on direct hit |
| EF3 | 61–74 | 78 | 60 | Metal-tier bases needed. Vehicles slide |
| EF4 | 74–89 | 95 | 80 | Two-cell. Concrete survives only when braced |
| EF5 | > 89 | 115 | 100 | Finale. Only reinforced bunkers survive |

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
            + V_amb(P,t)                                               (gust front / RFD, archetype curve)
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
Player (80 kg, C_D·A_z ≈ 0.7 m²): v_liftoff ≈ 42.8 m/s  → unbraced players lift in an EF1 core. Intended.
```

**Brace / Grip check** (`GA_Brace`): the anchor holds while `|F_total,horizontal + F_total,vertical⁺| < Grip`. `Grip` is a GAS attribute in N (base 3 kN, upgrades up to 8 kN). On failure: `State.Airborne.Wind`, a ragdoll blend, and a clip flag.

### 2.7 Numerically stable integration

With explicit Euler, light bodies explode under quadratic drag when `dt > m / (½ρC_DA|u|)`. Use the semi-implicit relaxation instead. It is unconditionally stable:

```
k      = ½ · ρ · C_D · A_eff / m
u'     = u / (1 + k·|u|·Δt)                          (implicit quadratic drag, |u| frozen)
Δv_D   = u − u'
F_D,applied = m · Δv_D / Δt                          (feed to Chaos as force, or apply Δv directly for Tier-1)
```

The other terms (`F_L`, `F_P`, `F_orb`) are explicit, with a clamp of `|a| ≤ a_max` (archetype, default 60 m/s²) so that nothing gets launched at orbital speed.

### 2.8 Storm path

```
C_g(t+Δt) = C_g(t) + Δt·( V_steer(t) + V_wander(t) + V_heat(t) )
V_wander  : Ornstein–Uhlenbeck,  dW = −W/τ_w·dt + σ_w·√dt·N(0,1)  (seeded PCG, server-only)
V_heat    : h_max · normalize(Σ_i w_i·(P_i − C_g)) ,  w_i = PlayerHeat_i / |P_i − C_g|²,  capped turn rate 6°/s
```

The server bakes the path into **Hermite keys every 2 s with 10 s look-ahead** and replicates them. Clients evaluate the spline, so the path is smooth and cheap and never mispredicts more than 10 s ahead. `PlayerHeat` rises with probe deployments, which is the design lever that makes storms *chase the chasers*.

### 2.9 Chaser reward

```
DataRate = k_d · (|V_wind(P_probe)| / V_liftoff,player)² · (1 − Shelter) · ProbeMult
```

### 2.10 Reference implementation (StormCore, C++, exposed to BP)

```cpp
// StormFieldMath.h — header-only, ISPC-friendly, no UObject access. Units: SI.
#pragma once
#include "CoreMinimal.h"

struct FStormFieldParams            // built from UStormArchetypeDataAsset + FStormNetState each frame
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

**Single source of truth.** `MF_StormWind` (Material Function) and `NM_StormWind` (Niagara module) implement §2.5 in HLSL, and read storm params from `MPC_Storm` (max 4 storms × 8 float4). An **automation test** (`Stormchaser.Wind.Parity`) samples 10k points on CPU and GPU (a render-target readback) and fails if `|ΔV| > 0.5 m/s`.

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
AStormActor (C++)  →  BP_Storm_Base  →  BP_Storm_Tornado / BP_Storm_Derecho / BP_Storm_Finale (data-only)
 ├─ USceneComponent (Root, at C_g)
 ├─ UStormFieldComponent          builds FStormFieldParams from DA + NetState; registers with subsystem
 ├─ UStormPathComponent           server: OU wander + heat bias → Hermite keys; client: spline eval
 ├─ UStormLifecycleComponent      I(t), phase tags, threat-pulse scheduler (server) → GameplayEvents
 ├─ UStormDebrisSpawnerComponent  ground-scrape spawns (T0 Niagara via Data Channel, T1 Mass, T2 pool)
 ├─ UNiagaraComponent  (Funnel)   funnel particles/ribbons; params from MPC_Storm
 ├─ UStaticMeshComponent (FunnelShell) raymarched funnel material (PC Epic: Heterogeneous Volume [VERIFY 5.6])
 ├─ UAudioComponent ×3            MetaSounds: roar (distance+Vt), debris bed, pressure/ear-pop
 └─ UFieldSystemComponent         radial strain/force fields for ground-level destruction

UStormWorldSubsystem (UTickableWorldSubsystem, C++)
   Storms[] · SampleWind/Batch · ΔP lookup · MPC_Storm writer · Deferred Damage Ledger (server)

APlayerState (C++) → BP_PlayerState
 └─ UAbilitySystemComponent (Mixed)  + UCoreAttributeSet, UStormAttributeSet, UChaserAttributeSet

ACharacter (C++ AStormCharacter) → BP_Chaser
 ├─ UStormCharacterMovementComponent  wind force INSIDE predicted move (§5.3); custom mode MOVE_Custom:Tumble
 ├─ UWindReceiverComponent            profile = DA_Wind_Player; mode = Predicted (no physics body)
 ├─ UGrappleComponent                 rope constraint (predicted); anchor validation server-side
 ├─ UExposureComponent                reads Shelter + V_local → GAS Exposure attribute (server)
 ├─ UInventoryComponent / UEquipmentComponent
 └─ UClipBufferComponent (local only) rolling replay flagger

APawn (vehicles) → BP_Vehicle_Base  (Chaos Vehicles)
 └─ UWindReceiverComponent            mode = PhysicsBody (async physics tick)

AStormProp (C++) → BP_Prop_Base → BP_Prop_Car / BP_Prop_Hay / BP_Prop_Cow (data-only)
 ├─ UStaticMeshComponent (sim physics, pooled)
 ├─ UWindReceiverComponent            mode = PhysicsBody
 └─ UDebrisTierComponent              tier promotion/demotion, net relevancy, pooling

ABasePlot (C++) → BP_BasePlot
 ├─ UInstancedStaticMeshComponent ×N  one per (mesh, material tier); parts are instances
 ├─ UBuildGridComponent               snapping, placement validation, S-preview
 ├─ UStructuralIntegrityComponent     SoA graph, loads, fatigue, island detection (server tick 10 Hz)
 ├─ UWindShadowGridComponent          2-D shelter grid
 ├─ UFieldSystemComponent             strain on hand-off
 └─ FBasePartNetArray (FastArray)     replicated part state (§5.4)

ASalvagePile (C++) → BP_SalvagePile  (ISM of settled fragments, interactable)
AProbe (C++) → BP_Probe               deployable; reads V_local; feeds Data; physics-anchored (Grip)
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

**BP_Storm_Base: threat pulse → clip flag (server)**
```
Event OnThreatPulse (from UStormLifecycleComponent, C++ delegate)
 → Switch on Authority [Authority]
   → For Each Player in GetPlayersWithin(R_out * 1.5)
       → Send Gameplay Event to Actor (Player, Event.Storm.ThreatPulse, Payload{Magnitude=I(t)})
   → Execute GameplayCue On Owner (GameplayCue.Storm.Siren)   [multicast via GAS, unreliable]
```

**GA_Brace (LocalPredicted)**
```
ActivateAbility
 → Line Trace (ground/structure within 1.5 m) → fail → EndAbility(cancelled)
 → Apply GE_Braced (grants State.Braced, CMC reads it → wind force routed into GripCheck)
 → Wait Gameplay Event (Event.Grip.Broken)  ← fired by UStormCharacterMovementComponent when |F| > Grip
     → Remove GE_Braced → Apply GE_WindTumble (State.Airborne.Wind, 1.5 s) → EndAbility
 → Wait Input Release → EndAbility
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
Storm.Type.Tornado | Storm.Type.Derecho | Storm.Type.Hail | Storm.Type.Finale
Storm.Rating.EF0 … Storm.Rating.EF5
Storm.Phase.Forming | Touchdown | Mature | Roping | Dissipated
Storm.Feature.TwoCell | Storm.Feature.Satellite | Storm.Feature.RainWrapped

State.Exposed | State.Sheltered | State.Braced | State.Grappled | State.Gliding
State.Airborne.Wind | State.Tumbling | State.Downed | State.InVehicle | State.Stunned

Ability.Movement.Sprint | Ability.Movement.Slide | Ability.Movement.Grapple | Ability.Movement.WindSurf
Ability.Survival.Brace | Ability.Survival.Shelter
Ability.Chaser.DeployProbe | Ability.Chaser.Scan
Ability.Build.Place | Ability.Build.Repair | Ability.Build.Salvage | Ability.Build.Demolish

Damage.Type.Debris | Damage.Type.Fall | Damage.Type.Hail | Damage.Type.Lightning | Damage.Type.Crush
Build.Material.Wood | Metal | Concrete | Reinforced
Build.Part.Foundation | Wall | Roof | Floor | Brace | Door | Shutter | Anchor | Cellar

Event.Storm.Warning | Event.Storm.ThreatPulse | Event.Storm.Touchdown | Event.Storm.Dissipated
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
| `UStormAttributeSet` | Grip (N), MaxGrip, WindResist (multiplier on `C_D·A`, 0.5–1), Exposure (0–1), DebrisArmor | The CMC reads `Grip` and `WindResist` from a locally cached copy (predicted) |
| `UChaserAttributeSet` | Data, ProbeCharge, HeatGeneration | Heat feeds the storm path bias |

**Core effects:** `GE_DebrisImpact` (instant, SetByCaller.Damage = `k·½m v²`), `GE_ExposureTick` (periodic 0.5 s, stamina drain ∝ Exposure), `GE_Braced` (infinite, grants tag, +Grip), `GE_WindTumble` (duration, blocks `Ability.Movement.*`), `GE_FallDamage`, `GE_SpendMaterial`.

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
| **`StormArchetype`** (`UStormArchetypeDataAsset`) | `FGameplayTag Rating, Type` · `EVortexProfile Profile` · `float VPeak, Rm0, Flare, Height, Lean, InflowRatio, UpdraftRatio, DecayN, ROutMul` · `UCurveFloat* Lifecycle` (I(t)) · `UCurveFloat* RmOverLife` · path: `SteerSpeed, WanderSigma, WanderTau, HeatBias, MaxTurnRate` · `FThreatPulseSpec[] Pulses` · `int32 DebrisBudgetMul` · `TArray<FSatelliteSpec> Satellites` · `TSoftObjectPtr<UNiagaraSystem> FunnelFX` · `TSoftObjectPtr<UMetaSoundSource> Roar` · `TSoftObjectPtr<ULootTable> Rewards` | `Server` (math), `Client` (FX/audio) |
| **`StormSchedule`** | `TArray<FWeightedArchetype> PerCycle[3]` · `FForecastConeSpec` · seasonal modifiers | Server |
| **`WindProfile`** | `Mass (0 = use body)` · `FVector AreaXYZ` · `CD, CL curve, APlan, Volume` · `BetaOrbit` · `LiftoffSpeed (computed in PostEditChangeProperty)` · `DefaultTier` | Server, Client |
| **`BasePart`** | `FGameplayTag PartType` · `TSoftObjectPtr<UStaticMesh> Mesh` · `TSoftObjectPtr<UGeometryCollection> Fractured` · `UMaterialTier* Material` · `FVector Size, float Mass, Area, Cp, ClRoof` · `TArray<FSnapSocket> Sockets (type, transform, joint modifier)` · `bIsFoundation, bIsSolidForShadow, Porosity` · `FItemCost Cost` · `UIcon` | Server (graph), Client (mesh/GC) |
| **`MaterialTier`** | `Ct, Cc, Cs (N)` · `Lambda (support loss)` · `T0 (GC strain)` · `HPPerKg` · `ImpactK` · `ShelterMax` · salvage yield · cosmetic skins (IAP hook) | Server, Client |
| **`DebrisSet`** | Weighted `TArray<{WindProfile, Mesh/Mass config, Tier}>` per biome (farm, town, forest) | Client, Server |
| **`PlatformScalability`** | tier budgets (T0/T1/T2 counts), receiver Hz per bucket, integrity Hz, net budgets, funnel quality | Client |

**Content scaling rule:** designers add a storm or a part by creating a **new DataAsset only**. No new Blueprint class is needed unless there is new behaviour. Validation runs through `UEditorValidatorBase` subclasses: every BasePart needs a GC, sockets must be symmetric, liftoff speed must be sane, and `Φ` LUT generation must succeed.

---

## 5. Scalability and Netcode Plan

### 5.1 Server model

- **Dedicated server**, 30 Hz net tick. Chaos **async physics at a fixed 60 Hz** (Project Settings → Physics → *Tick Physics Async*, fixed Δt = 1/60), same on clients for parity.
- **Replication system:** Iris, for its per-connection prioritization and filtering (`SetupIrisSupport(Target)` in `Build.cs`, `net.Iris.UseIrisReplication 1`). The fallback is Replication Graph with spatial grid plus always-relevant nodes. **[VERIFY 5.6]** Iris maturity and the plugin set.
- **Session:** 1–8 players. Per-connection outgoing budget: PC 120 kbps, mobile 64 kbps sustained, burst 200 kbps.

### 5.2 What replicates, and how

| Thing | Method | Size / rate |
|---|---|---|
| Storm | `FStormNetState` (RepNotify): seed, archetype id (uint16), spawn server-time, lifecycle time, `TArray<FStormPathKey>` (6 keys × {pos NetQuantize10, vel NetQuantize10, t}) | ~150 B at 0.5 Hz |
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

**Map:** 8 × 8 km. Farmland, towns, forest, river valley. The playable storm arena is recentered per session.

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
- **Gauntlet perf test** `Perf.StormFinale`: a scripted EF5 through a 60-part base with 8 bots. The build fails if PC p95 exceeds 16.6 ms, mobile p95 exceeds 33.3 ms, server p99 exceeds 33 ms, or any connection's p95 goes above its budget.
- **Automation tests.** `Wind.Parity` (CPU vs GPU), `Wind.Determinism` (the same seed gives the same path, bit-exact on the server), `Integrity.KnownCases` (a wood wall fails at EF3 and a reinforced bunker survives EF5), `Net.WindPredictionNoCorrections` (8-bot soak, correction count must be 0 when no debris hits).

---

## 6. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| GC spawn hitch at touchdown | Frame spikes in the money shot | GC pool prewarmed; async-load bundles at Forecast; no more than 4 GC spawns per frame (queue) |
| Chaos non-determinism across platforms | Divergent debris on clients | Only T2/T3 can affect gameplay (server-owned); everything else is cosmetic by design |
| Players exploiting sheltered spots | Stale loop | Rain-wrapped storms shift direction; roof uplift ignores walls; storm path heat bias |
| Mobile thermal throttling in long sessions | Frame drops at the Finale | Thermal step-down; Chaos Cache playback for hero collapses; 30 fps default |
| Engine-version API drift (async physics handles, Iris, Heterogeneous Volumes) | Rework | Isolate behind `StormCore` interfaces; each marked **[VERIFY 5.6]** item gets a spike ticket in sprint 1 |

---

## 7. Sprint-1 Vertical Slice (deliverables)

1. `StormFieldMath.h` + subsystem + LUT bake, with the `Wind.Parity` test passing.
2. `UWindReceiverComponent` (Predicted + PhysicsBody), with a player bracing in EF2 over a netcode soak at 0 corrections.
3. `ABasePlot` with 30 parts: stability, loads, failure, GC hand-off, salvage conversion.
4. T0/T1/T2 debris with pools and the T2 net array at 73 kbps measured.
5. One 5-minute EF3 storm on a 2 × 2 km World Partition test map, profiled on an RTX 3060 and an iPhone 15 Pro.
