// The Spark release: the dormant Phase 7I economy (features.js) must be OFF on the public game whatever the visitor
// does, and can be turned on only by the local test harness (a 127.0.0.1/localhost page plus a flag set before load).
import {test} from "node:test";
import assert from "node:assert/strict";

let n = 0;
async function load(hostname, win = {}, search = "") {
  globalThis.location = {hostname, search, href: "https://" + hostname + "/farm3d/" + search};
  globalThis.window = win;
  return (await import("../features.js?case=" + (++n))).FEATURES;
}

test("public site: the verified economy is off, even with a debug URL, a saved setting or the test flag itself", async () => {
  for (const host of ["pederaus9-ux.github.io", "sunny-acres.example.com", "127.0.0.1.evil.example", "localhost.example.com"]) {
    assert.equal((await load(host)).verifiedEconomy, false, host);
    assert.equal((await load(host, {}, "?debug&economy&verifiedEconomy=1")).verifiedEconomy, false, host + " with URL parameters");
    assert.equal((await load(host, {__saTestEconomy: true})).verifiedEconomy, false, host + " with the test flag forced in");
  }
});

test("local test server: off unless the harness set the flag (exactly true) before load", async () => {
  assert.equal((await load("127.0.0.1")).verifiedEconomy, false);
  assert.equal((await load("127.0.0.1", {}, "?debug&economy")).verifiedEconomy, false, "URL parameters do nothing even locally");
  assert.equal((await load("localhost", {__saTestEconomy: "true"})).verifiedEconomy, false, "only the boolean true counts");
  assert.equal((await load("127.0.0.1", {__saTestEconomy: true})).verifiedEconomy, true);
  assert.equal((await load("localhost", {__saTestEconomy: true})).verifiedEconomy, true);
});

test("the switch can't be changed after load", async () => {
  const F = await load("pederaus9-ux.github.io");
  assert.throws(() => { "use strict"; F.verifiedEconomy = true; });
  assert.equal(F.verifiedEconomy, false);
});
