// The server's copy of the game rules the canonical economy depends on.
// These numbers come from farm3d/game.js (CROPS for grow time and seed price, ITEMS for sale price). The economy tests
// read game.js and fail if the two ever disagree, so the server and the game can't drift apart silently.
//
// Canonical crops use only the BASE rules:
// - grow time = CROPS[crop].time; watering, soil, perks and weather change only local (legacy/guest) crops
// - yield = 2; golden harvests are random on the device and never canonical
const CROPS = {
  wheat: {time: 20, seed: 1, price: 2},
  corn: {time: 45, seed: 2, price: 4},
  carrot: {time: 90, seed: 3, price: 6},
  soybean: {time: 120, seed: 4, price: 7},
  sugarcane: {time: 180, seed: 5, price: 9},
  tomato: {time: 240, seed: 6, price: 11},
  strawberry: {time: 360, seed: 8, price: 14},
  pumpkin: {time: 600, seed: 12, price: 20},
};
const YIELD = 2;
const BOOTSTRAP_CROP = "wheat";
// canonical plots p0..p5: the six fields every farm starts with (more land is a later phase)
const PLOTS = ["p0", "p1", "p2", "p3", "p4", "p5"];

module.exports = {CROPS, YIELD, BOOTSTRAP_CROP, PLOTS};
