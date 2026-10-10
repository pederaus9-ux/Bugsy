# Horse R2 head revision: render evidence

Renders of the actual code. They are not a visual verdict.

## Files

| File | What it shows | Renderer |
| --- | --- | --- |
| `starting-head-0afea8b.jpg` | The rejected starting head | `createLiveAnimal('horse', 2.3)`, local SwiftShader |
| `before-after.jpg` | Starting head vs this revision: same pose, camera and light | Local SwiftShader |
| `isolated-head-poses.jpg` | This revision: neutral, raised and lowered head, from the front, side and three-quarter | Local SwiftShader |
| `isolated-turns-and-body.jpg` | This revision: head and neck turns, plus body views | Local SwiftShader |
| `farm-scene-head-closeups.jpg` | Production farm scene: neutral, lowered, head turned both ways and neck yaw, each from the front, side and three-quarter | `tests/animal-visual.browser.cjs` at 1280×720 |

## Not covered

- Software rendering, not a device.
- No comparison with photo `13326.jpg`: it was not available to the implementer.
- Gait, turning and stopping evidence is not part of this head task.
