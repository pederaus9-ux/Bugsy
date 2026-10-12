// Test-only continuous clips. Reset once before each clip, never between frames.
export const HORSE_MOTION_CLIPS=[
  {name:'idle',seconds:1,mode:'idle',speed:0},
  {name:'walk',seconds:2,mode:'walk',speed:1},
  {name:'trot',seconds:2,mode:'run',speed:1.2},
  {name:'canter',seconds:2,mode:'run',speed:1.8},
  {name:'acceleration',seconds:2,ramp:[0,1.8]},
  {name:'deceleration',seconds:2,warm:1,ramp:[1.8,0]},
  {name:'hard-stop',seconds:2,warm:1,mode:'idle',speed:0},
  {name:'turn-90',seconds:1.5,warm:1,mode:'walk',speed:1,yaw:Math.PI/2},
  {name:'tight-circle',seconds:4,warm:.5,mode:'walk',speed:1,circle:true},
  {name:'reverse-180',seconds:2,warm:1,mode:'walk',speed:1,yaw:Math.PI},
  {name:'teleport-reset',seconds:1,warm:.5,mode:'idle',speed:0,teleport:true}
];
export function horseMotionInput(clip,frame,hz=60){
  const frames=Math.round(clip.seconds*hz),t=frames>1?frame/(frames-1):1;
  const speed=clip.ramp?clip.ramp[0]+(clip.ramp[1]-clip.ramp[0])*t:clip.speed;
  const mode=clip.ramp?(speed<.001?'idle':speed<.8?'walk':'run'):clip.mode;
  const yaw=clip.circle?2*Math.PI*t:clip.yaw||0;
  return {dx:clip.teleport&&frame===0?3:-Math.sin(yaw)*speed/hz,
    dz:clip.teleport&&frame===0?0:-Math.cos(yaw)*speed/hz,dt:1/hz,mode,speed};
}
