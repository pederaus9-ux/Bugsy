# 3D preview

iRacing's own car models are locked inside the sim, so this renders the paint on a stand-in sports car: the three.js example Ferrari 458 (`ferrari.glb`). The script closes it into a coupe with a hardtop and adds a GT wing. The paint is projected onto the body straight from the template layout (sides, hood, roof, decklid, rear).

It's a mock-up for the look and colours, not the exact Mustang shape.

```
npm i three@0.170.0 playwright
curl -LO https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/models/gltf/ferrari.glb
cp ../output/preview_flat.png paint.png
python3 -m http.server 8765 &
node shoot.js             # writes shot_*.png
python3 poster.py         # writes ../output/render_3d.jpg
```
