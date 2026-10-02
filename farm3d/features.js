// Sunny Acres 3D: feature switches.
//
// verifiedEconomy: the Phase 7I server-checked economy (the Verified Field and the trading post). It needs Firebase
// Cloud Functions, which the free (Spark) plan can't run, so it is OFF wherever the game is really played. The code
// stays in the game and in the test suites so it keeps working for later.
//
// It can be turned on ONLY by the local test harness: the page must come from this computer (127.0.0.1 / localhost)
// AND the harness must have set window.__saTestEconomy before any game script ran. No URL parameter, saved setting or
// player action can turn it on, on the public site or anywhere else.
const LOCAL_TEST_HOST = ["127.0.0.1", "localhost", "[::1]"].includes(location.hostname);

export const FEATURES = Object.freeze({
  verifiedEconomy: LOCAL_TEST_HOST && window.__saTestEconomy === true,
});
