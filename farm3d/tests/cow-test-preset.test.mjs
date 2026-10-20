import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the actual integration fixture and production weather-transition
// branch. Night must cancel a fair-weather target; a fair-weather stroll must
// therefore establish matching daylight before advancing its existing120steps.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const browser=readFileSync(new URL('./cow3d.browser.cjs',import.meta.url),'utf8');
function part(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i);return s.slice(i,j);}
const prepare=part(browser,'const lighting=','const start=');
const transition=part(html,'const mode = PRESET.night','if (this.act === "sleeping" && Math.floor');
function fixture(){
 const a={card:{material:{emissive:{toArray:()=>[0,0,0]}}},g:{position:{x:1,z:1}},target:null,
  go(x,z){this.target={x,z};this.act='moving';},emote(){}};
 const env={a,PRESET:{night:false,rain:false,snowing:false}};
 env.d={setPreset(name){env.PRESET={night:name==='night',rain:name==='rain',snowing:name==='snow'};}};
 vm.createContext(env);const reset=vm.runInContext('(function(){'+transition+'})',env);
 return {a,env,reset};
}
test('lighting inspection leaves matching fair-weather conditions for the real travel probe',()=>{
 const{a,env,reset}=fixture();vm.runInContext(prepare,env);const target=a.target;
 assert(target);reset.call(a);assert.equal(a.target,target,'fixture must not cancel its requested stroll on the first production update');assert.equal(a.mode,'fair');
});
test('the unchanged production night transition still cancels a fair-weather target',()=>{
 const{a,env,reset}=fixture();Object.assign(a,{mode:'fair',target:{x:2,z:2},act:'moving',until:100});env.PRESET.night=true;
 reset.call(a);assert.equal(a.target,null);assert.equal(a.act,'idle');assert.equal(a.mode,'night');assert.equal(a.until,0);
});
