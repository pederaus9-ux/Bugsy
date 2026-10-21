// The legacy rig probe commands its own stroll. Release autonomous courtyard
// care first, then use the clear central aisle rather than a sleeping bay.
// Trusted gameplay/robot tests never call this test-only setup helper.
export function prepareCowStroll(d, a) {
  const before = {position:a.g.position.toArray(), task:a.cowTask?.kind||null, stage:a.cowTask?.stage||null};
  if (a.cowTask?.token) d.cowStations.release(a.cowTask.token);
  a.carePose?.reset();
  a.cowTask=null; a.target=null; a.path=null; a.vel.set(0,0);
  const north=d.cowYard?.group.position.z??0;
  a.g.position.set(-8.2,.08,-11.2+north); a.lastPos?.set(-8.2,-11.2+north);
  a.mode='fair'; a.until=9e15; a.act='idle'; a.doing=null;
  a.need={hunger:0,tired:0,lonely:0};
  a.go(a.g.position.x+.9,a.g.position.z+.6,false,'Test stroll');
  return {before, after:{position:a.g.position.toArray(),task:a.cowTask,target:a.target?.toArray()||null,path:a.path?.map(p=>p.toArray())||[]}};
}
