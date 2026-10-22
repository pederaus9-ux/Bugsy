import test from 'node:test';import assert from 'node:assert/strict';
import * as V from '../animal-pen-validation.js';import {makePenWorld} from './fixtures/animal-pen-world.mjs';
// The live editor and the calibrated validator fixtures must share one land definition.
test('pen-editable land is one shared definition equal to the calibrated validator world',()=>{
 assert.equal(typeof V.penEditableLand,'function','penEditableLand must be exported for the live snapshot');
 assert.deepEqual(JSON.parse(JSON.stringify(V.penEditableLand())),JSON.parse(JSON.stringify(makePenWorld().land)));
});
