# Cow hip gap

Branch: grok/sunny-acres-cow-hip-gap
Base: main ed9a345

Hips are children of the body bone. Rest offset is body-local: hip y = 0.77 - 1.03.
poseCowLeg no longer drops hip.position.y for the stride. It only rewrites the body-local rest so body breath scale does not sink the hoof.
One haunch oval per hip overlaps the torso and the upper thigh.
Bone count stays 24. Economy files were not changed.

Residual: planted hoof slip is up to 1.7 cm at a run because the hip no longer drops to extend reach. Hoof stays above 0.052 m.
