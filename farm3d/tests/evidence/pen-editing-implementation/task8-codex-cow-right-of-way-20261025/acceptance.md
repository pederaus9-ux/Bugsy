# Captured cow route-corner deadlock: correction criteria before code

Historical RED: dog-nook assembly Apply, seed 1/30 Hz, all 46 animals; night two misses the unchanged 500-second bed deadline with Cow 1 and Cow 3 approaching the same static corner for different reserved beds. The captured-state VM replay also remains RED for 500 seconds with 0.85 m separation preserved.

Any correction must:

1. Make both cows physically clear the contested waypoint and eventually reach their own reserved beds within the original 500-second deadline, regardless of update order or which stable cow identity starts on each side. A persistent fixed priority must not starve one cow; after the first passes, the yielding cow resumes its original station route.
2. Keep pairwise separation at least 0.85 m, directed horizontal speed at most 0.8 m/s plus the existing numerical tolerance, supported hoof/soil contact, pen containment, solid posts/fences and real station tokens. No teleport, forced waypoint shift, reduced margin, duplicate reservation or fabricated bed hold.
3. If there is no physically reachable yield/detour space, leave the original collision guard active and report a blocked route; do not return a direct fallback or move through an obstacle. Retry only when geometry changes, with bounded work.
4. Pass focused captured-state controls at 30/60/120 Hz, symmetric actor/update order and a blocked-detour control. Then pass the **original** full 46-animal dog-nook seed-1/30 Hz three-night case without changing its seed/deadline/assertions, plus directly affected default cow traffic and separation tests. Prior whole-pen results remain historical until affected rates/seeds are checked on the changed runtime.

Research so far: a one-step sidestep cannot resolve a shared corner. The existing static visibility planner can generate alternative nodes if the other cow is modeled as a circle of radius 0.43 m and the moving cow's existing 0.42 m route padding is retained. Using an axis-aligned square placed the start inside its inflated bounds and silently skipped the dynamic obstacle. A detour is a hypothesis to verify, not yet an accepted fix. [This primary robotics paper](https://arxiv.org/abs/2210.04231) supports combining explicit priority with obstacle-aware safe corridors for dense multi-agent deadlocks; its algorithm is not being copied wholesale into the game.
