import {measureChickenTurns} from './chicken-turn-matrix.mjs';
const allowed=['reach-only-a','early-lift-b','early-lift-cubic-c','landing-hold-d'];
const name=process.argv[2];if(!allowed.includes(name))throw Error('Choose '+allowed.join(', '));
const m=await import('./experiments/chicken-motion/'+name+'.mjs');
const result=measureChickenTurns(m.createChicken3D,m.updateChicken3D);console.log(JSON.stringify({variant:name,...result},null,2));if(result.failed)process.exitCode=1;
