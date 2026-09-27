"""Road/terrain fit: samples road-mesh triangle centroids, edge midpoints and vertices against the carved terrain,
taking the worst of bilinear and both landscape triangle splits. Usage: python verify/check_roads.py"""
import json, struct, numpy as np, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mapbuilder import Frame, load_location, OUT
from ue_export import Ground
fr=Frame(load_location()); g=Ground(fr, OUT, tile_dir=os.path.join(OUT,'ue','terrain'))
def worst_terrain(x, y):
    col=np.clip((x+fr.half_x)/fr.res,0,fr.nx-1.001); row=np.clip((fr.half_y-y)/fr.res,0,fr.ny-1.001)
    c0,r0=np.floor(col),np.floor(row); fc,frr=col-c0,row-r0
    pts=lambda dc,dr: g.z_cm(-fr.half_x+(c0+dc)*fr.res, fr.half_y-(r0+dr)*fr.res)
    z00,z10,z01,z11=pts(0,0),pts(1,0),pts(0,1),pts(1,1)
    bil=z00*(1-fc)*(1-frr)+z10*fc*(1-frr)+z01*(1-fc)*frr+z11*fc*frr
    # diagonal 00-11
    tA=np.where(fc>=frr, z00+(z10-z00)*fc+(z11-z10)*frr, z00+(z01-z00)*frr+(z11-z01)*fc)
    # diagonal 10-01
    tB=np.where(fc+frr<=1, z00+(z10-z00)*fc+(z01-z00)*frr, z11+(z01-z11)*(1-fc)+(z10-z11)*(1-frr))
    return np.maximum(bil, np.maximum(tA,tB))
m=json.load(open(f'{OUT}/ue/manifest.json'))
es=[]
for mesh in [x for x in m['meshes'] if x['layer']=='Road'][::4]:
    px,py,_=mesh['pivot_cm']; b=open(f"{OUT}/ue/meshes/{mesh['name']}.bin",'rb').read()
    nv,nt=struct.unpack('<II',b[:8]); v=np.frombuffer(b[8:8+nv*12],'<f4').reshape(-1,3).astype(float)
    t=np.frombuffer(b[8+nv*12:],'<u4').reshape(-1,3)
    A,B,Cc=v[t[:,0]],v[t[:,1]],v[t[:,2]]
    for p in ((A+B+Cc)/3,(A+B)/2,(B+Cc)/2,(A+Cc)/2, A):
        es.append(p[:,2]-worst_terrain((p[:,0]+px)/100, -(p[:,1]+py)/100))
e=np.concatenate(es)
print(f"road above carved terrain (worst of bilinear/both triangle splits, {len(e):,} samples): median {np.median(e):.1f} cm, "
      f"p1 {np.percentile(e,1):.1f}, below terrain {(e<0).mean()*100:.2f}%, below -2 cm {(e<-2).mean()*100:.3f}%, below -5 cm {(e<-5).mean()*100:.3f}%")
