# Cow hip gap

Branch: grok/sunny-acres-cow-hip-gap
Base: main ed9a345

Hips are children of the body bone. Rest offset is body-local: hip y = 0.77 - 1.03.
poseCowLeg no longer drops hip.position.y for the stride. It only rewrites the body-local rest so body breath scale does not sink the hoof.
One haunch oval per hip overlaps the torso and the upper thigh.
Bone count stays 24. Economy files were not changed.

Planted hoof slip after the reach adjustment: walk 0.74 mm, run 1.8 mm.
The reach adjustment is body-local and stays inside the haunch. It does not parent the hip back to the root.
Preview: farm3d/cow-hip-preview.html. Keys 1 idle, 2 walk, 3 run.
