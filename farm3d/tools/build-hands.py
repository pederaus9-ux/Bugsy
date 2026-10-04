"""Original editable topology/rig study. Design-reference comparison is pending.

Run with Blender 4.5.14 --background --factory-startup --python SCRIPT -- OUT.
This is an isolated art study, not an installed production asset.
"""
import bpy
import bmesh
import json
import math
import pathlib
import sys
from mathutils import Vector

OUT = pathlib.Path(sys.argv[sys.argv.index('--') + 1]).resolve()
OUT.mkdir(parents=True, exist_ok=True)
if bpy.data.filepath:
    raise RuntimeError('Run with --factory-startup; do not replace an open Blender project')
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.fps = 30
scene.frame_start, scene.frame_end = 0, 24

def material(name, rgba, roughness):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = rgba
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = rgba
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

skin = material('WardrobeSkin', (.64, .36, .20, 1), .68)
sleeve = material('WardrobeSleeve', (.94, .61, .035, 1), .82)
root = bpy.data.objects.new('SunnyHands', None)
scene.collection.objects.link(root)
armdata = bpy.data.armatures.new('HandsSkeleton')
rig = bpy.data.objects.new('HandsRig', armdata)
scene.collection.objects.link(rig)
rig.parent = root
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')

def bone(name, head, tail, parent=None):
    b = armdata.edit_bones.new(name)
    b.head, b.tail = head, tail
    if parent:
        b.parent = armdata.edit_bones[parent]
    return b

def point(side, x, y, z, bend=False):
    if bend:
        # Anatomical rest wrist exposes the back of the hand to the Walk camera.
        dy, dz = y, z-.07
        theta = .7*min(1,max(0,y/.025))
        y = dy*math.cos(theta)-dz*math.sin(theta)
        z = .07+dy*math.sin(theta)+dz*math.cos(theta)
    # Reduce each arm around its own lateral anchor, keeping the center view
    # open without pulling the left/right hands together. Apply the same map
    # to skin and joints so the exported bind pose remains coherent.
    return (side * (.22 + x*.89), .44 + y*.89, -.27 + z*.89)

for side, label in [(-1, 'L'), (1, 'R')]:
    bone(label + '_arm', point(side, 0, -.20, .03), point(side, 0, 0, .07))
    bone(label + '_wrist', point(side, 0, 0, .07, True), point(side, 0, .115, .098, True), label + '_arm')
    for f, length in enumerate([.064, .073, .068, .051]):
        x = -.031 + f * .0207
        for j in range(3):
            bone(f'{label}_finger{f}_{j}', point(side, x, .115 + length*j/3, .098, True),
                 point(side, x, .115 + length*(j+1)/3, .098, True),
                 label + '_wrist' if j == 0 else f'{label}_finger{f}_{j-1}')
    for j in range(2):
        bone(f'{label}_thumb{j}', point(side, -.032-j*.016, .067+j*.014, .092-j*.006, True),
             point(side, -.048-j*.016, .081+j*.014, .086-j*.006, True),
             label + '_wrist' if j == 0 else f'{label}_thumb{j-1}')
bpy.ops.object.mode_set(mode='OBJECT')

reports = []
def mesh_object(name, vertices, faces, weights, mat):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    ob = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(ob)
    # glTF skinned surfaces must be scene roots. The named root owns the rig;
    # the runtime must transform/own gltf.scene, including its four surfaces.
    ob.parent = None
    ob.data.materials.append(mat)
    groups = {}
    for index, mapping in enumerate(weights):
        for name, value in mapping.items():
            if name not in groups:
                groups[name] = ob.vertex_groups.new(name=name)
            groups[name].add([index], value, 'REPLACE')
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    boundary = sum(e.is_boundary for e in bm.edges)
    nonmanifold = sum(not e.is_manifold for e in bm.edges)
    unseen = set(bm.verts)
    components = 0
    while unseen:
        components += 1
        stack = [unseen.pop()]
        while stack:
            for edge in stack.pop().link_edges:
                for v in edge.verts:
                    if v in unseen:
                        unseen.remove(v)
                        stack.append(v)
    assert components == 1 and boundary == 0 and nonmanifold == 0, (name, components, boundary, nonmanifold)
    bm.to_mesh(mesh)
    bm.free()
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    bpy.context.view_layer.objects.active = ob
    sub = ob.modifiers.new('Authored smooth surface', 'SUBSURF')
    sub.levels = 1
    bpy.ops.object.modifier_apply(modifier=sub.name)
    mesh.calc_loop_triangles()
    max_influences = 0
    for v in mesh.vertices:
        values = [group.weight for group in v.groups if group.weight > 1e-7]
        assert values and abs(sum(values)-1) < 1e-5, (name, v.index, values)
        max_influences = max(max_influences, len(values))
    assert max_influences <= 4, (name, max_influences)
    arm = ob.modifiers.new('Independent finger deformation', 'ARMATURE')
    arm.object = rig
    reports.append({'mesh': ob.name, 'baseConnectedComponents': components,
                    'baseBoundaryEdges': boundary, 'baseNonManifoldEdges': nonmanifold,
                    'triangles': len(mesh.loop_triangles), 'vertices': len(mesh.vertices),
                    'normalizedWeights': True, 'maxInfluences': max_influences})
    return ob

for side, label in [(-1, 'L'), (1, 'R')]:
    verts, faces, weights = [], [], []
    bend_skin = True
    def vertex(p, mapping):
        verts.append(point(side, *p, bend=bend_skin)); weights.append(mapping)
        return len(verts)-1
    # Two continuous palm surfaces, connected wrist and branched finger tubes.
    rows = [(-.045, .025, .063, .015), (0, .026, .071, .016),
            (.025, .034, .086, .018), (.050, .040, .096, .018),
            (.070, .042, .100, .018), (.093, .041, .100, .017),
            (.115, .040, .098, .013)]
    top, bottom = [], []
    for row, (y, width, z, thick) in enumerate(rows):
        upper, lower = [], []
        for col in range(12):
            x = width * (col/11*2-1)
            arch = .007*(1-(x/width)**2)
            upper.append(vertex((x, y, z+thick+arch), {label+'_wrist': 1}))
            lower.append(vertex((x, y, z-thick-arch*.35), {label+'_wrist': 1}))
        top.append(upper); bottom.append(lower)
    for row in range(6):
        for col in range(11):
            faces += [(top[row][col], top[row+1][col], top[row+1][col+1], top[row][col+1]),
                      (bottom[row][col+1], bottom[row+1][col+1], bottom[row+1][col], bottom[row][col])]
        for col in [0, 11]:
            if col == 0 and row == 3:
                continue  # Thumb socket, filled by its connected extrusion below.
            faces.append((top[row][col], bottom[row][col], bottom[row+1][col], top[row+1][col]))
    for col in range(11):
        faces.append((top[0][col+1], bottom[0][col+1], bottom[0][col], top[0][col]))
    for col in [2, 5, 8]:
        faces.append((top[-1][col], bottom[-1][col], bottom[-1][col+1], top[-1][col+1]))
    for f, length in enumerate([.064, .073, .068, .051]):
        col = f*3
        old = top[-1][col:col+3] + list(reversed(bottom[-1][col:col+3]))
        # Socket center in authoring coordinates, before the common size map.
        cx = rows[-1][1]*((col+1)/11*2-1)
        for r, t in enumerate([.12, .32, .52, .76, .97]):
            taper = 1-.18*t
            # All digits are volumetric tubes sharing the palm's actual vertices.
            ring = []
            for k in range(6):
                # Match the socket winding: upper left -> top -> upper right.
                angle = math.pi*5/6 - k*math.tau/6
                p = (cx + math.cos(angle)*.009*taper, .115+length*t,
                     .098 + math.sin(angle)*.011*taper)
                along = max(0, min(2, t*3-.4))
                a, blend = int(along), along-int(along)
                mapping = {f'{label}_finger{f}_{a}': 1-blend}
                if blend > 0 and a < 2:
                    mapping[f'{label}_finger{f}_{a+1}'] = blend
                ring.append(vertex(p, mapping))
            faces.extend(tuple([old[k], old[(k+1)%6], ring[(k+1)%6], ring[k]]) for k in range(6))
            old = ring
        faces.append(tuple(reversed(old)))
    old = [top[3][0], bottom[3][0], bottom[4][0], top[4][0]]
    for t in [.18, .38, .58, .78, .96]:
        ring = []
        for k in range(4):
            # Socket starts at proximal upper corner, then proximal lower.
            angle = math.pi*3/4 + k*math.tau/4
            radius = .011*(1-.25*t)
            ring.append(vertex((-.042-.025*t, .061+.036*t+math.cos(angle)*radius,
                                .094-.014*t+math.sin(angle)*radius),
                               {label+'_thumb0': 1-min(1,t*1.5), label+'_thumb1': min(1,t*1.5)}))
        faces.extend((old[k], old[(k+1)%4], ring[(k+1)%4], ring[k]) for k in range(4))
        old = ring
    faces.append(tuple(reversed(old)))
    mesh_object(label+'_continuous_skin', verts, faces, weights, skin)
    verts, faces, weights = [], [], []
    bend_skin = False
    # Connected tapered sleeve with rolled cuff; one surface/material per arm.
    rings = []
    for y, rx, rz, z in [(-.21,.044,.042,.029),(-.16,.042,.040,.04),
                         (-.065,.037,.036,.063),(-.037,.035,.032,.071),
                         (-.027,.046,.042,.074),(-.014,.046,.042,.078),
                         (-.010,.034,.030,.080),(-.005,.034,.030,.080),
                         (.001,.030,.027,.080)]:
        ring = []
        for k in range(8):
            angle = math.tau*k/8
            ring.append(vertex((math.cos(angle)*rx,y,z+math.sin(angle)*rz), {label+'_arm':1}))
        rings.append(ring)
    for a,b in zip(rings,rings[1:]):
        faces.extend((a[k],a[(k+1)%8],b[(k+1)%8],b[k]) for k in range(8))
    faces += [tuple(reversed(rings[0])), tuple(rings[-1])]
    mesh_object(label+'_sleeve_cuff', verts, faces, weights, sleeve)

for name in ['idle','harvest','plant','water','pet','feed']:
    rig.animation_data_create()
    rig.animation_data.action = bpy.data.actions.new(name)
    for frame in [0, 4, 8, 12, 16, 20, 24]:
        phase = math.sin(math.pi*frame/24)**2
        for pb in rig.pose.bones:
            pb.rotation_mode = 'XYZ'
            pb.rotation_euler = (0,0,0)
            pb.location = (0,0,0)
            if '_finger' in pb.name:
                f = int(pb.name.split('_finger')[1].split('_')[0])
                joint = int(pb.name.rsplit('_',1)[1])
                curl = {'idle':.025,'harvest':.68,'plant':.48,'water':.26,'pet':.04,'feed':.39}[name]
                if name=='harvest':
                    # Offset digit closure and emphasize the middle joints:
                    # a rounded grab rather than one uniformly bent plate.
                    curl *= [1.08,1,.89,.81][f]*[.75,1.12,.76][joint]
                if pb.name.startswith('L') and name in ['harvest','plant','pet']:
                    curl *= .18
                pb.rotation_euler.x = -phase*curl
                pb.rotation_euler.z = phase*(f-1.5)*(.04 if name=='pet' else .01)
            elif '_thumb' in pb.name:
                pb.rotation_euler.y = phase*({'harvest':.34,'plant':.21,'feed':.23}.get(name,.04))
                if name=='harvest' and pb.name.startswith('R'):
                    pb.rotation_euler.y = phase*(.5 if pb.name.endswith('0') else .38)
                    pb.rotation_euler.x = -phase*(.16 if pb.name.endswith('0') else .06)
            elif '_wrist' in pb.name:
                pb.rotation_euler.x = phase*({'water':-.16,'feed':-.12,'pet':.08}.get(name,.025))
            pb.keyframe_insert('rotation_euler',frame=frame,group=pb.name)
            pb.keyframe_insert('location',frame=frame,group=pb.name)
    action = rig.animation_data.action
    action.use_fake_user = True
rig.animation_data.action = bpy.data.actions['idle']
scene.frame_set(0)
bpy.ops.object.select_all(action='DESELECT')
for ob in [root,rig]+[o for o in scene.objects if o.type=='MESH']:
    ob.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(OUT/'hands-candidate.glb'), export_format='GLB',
                          use_selection=True, export_animations=True, export_animation_mode='ACTIONS',
                          export_anim_single_armature=True, export_skins=True, export_force_sampling=True,
                          export_optimize_animation_size=True, export_optimize_animation_keep_anim_armature=False,
                          export_yup=True, export_apply=False, export_materials='EXPORT')
report = {'status':'technical topology study; original image comparison and runtime acceptance pending',
          'blender':bpy.app.version_string,'meshes':reports,
          'actions':[a.name for a in bpy.data.actions], 'bones':len(rig.data.bones)}
(OUT/'topology-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')

scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1100,700,100
scene.world.color = (.22,.22,.22)
scene.view_settings.view_transform = 'AgX'
def aim(ob, target):
    ob.rotation_euler = (Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
for loc, power, size in [((0,-.2,.8),6.5,.8),((-.5,.6,.4),3.5,.7),((.5,.8,.1),2.5,.6)]:
    data=bpy.data.lights.new('Study softbox','AREA'); data.energy=power; data.shape='DISK'; data.size=size
    ob=bpy.data.objects.new(data.name,data); scene.collection.objects.link(ob); ob.location=loc; aim(ob,(0,.48,-.1))
camdata=bpy.data.cameras.new('StudyCamera'); cam=bpy.data.objects.new('StudyCamera',camdata)
scene.collection.objects.link(cam); scene.camera=cam; camdata.type='ORTHO'; camdata.ortho_scale=.84
cam.location=(.08,-.16,.46); aim(cam,(0,.48,-.12))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'hands-source.blend'))
for name in ['idle','harvest','plant','water','pet','feed']:
    rig.animation_data.action=bpy.data.actions[name]; scene.frame_set(12)
    scene.render.filepath=str(OUT/f'study-{name}.png'); bpy.ops.render.render(write_still=True)
rig.animation_data.action=bpy.data.actions['harvest']; scene.frame_set(12)
cam.location=(.8,.42,.02); camdata.ortho_scale=.55; aim(cam,(.22,.48,-.10))
for ob in scene.objects:
    if ob.type=='MESH' and ob.name.startswith('L_'):
        ob.hide_render=True
scene.render.filepath=str(OUT/'study-harvest-side.png'); bpy.ops.render.render(write_still=True)
print(json.dumps(report))
