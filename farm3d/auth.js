// Sunny Acres 3D: player accounts with Firebase Authentication (modular Web SDK), email and password,
// and cloud saves in Firestore so a farm belongs to its account and follows it to any phone.
// Until the config below is filled in (it still says YOUR_…), accounts stay switched off and the game plays as before.
// To switch them on: Firebase console › Project settings › Your apps › Web app › copy the config here;
// Authentication › Sign-in method › turn on Email/Password; Firestore Database › create it, and use these rules:
//   match /farms/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }
import {installAnalytics} from './analytics.js?v=1';
const firebaseConfig = {
  apiKey: "AIzaSyCgijKMHpJqvzl5IdQxIE_4yu1_oH2Twtk",
  authDomain: "fir-config-18b64.firebaseapp.com",
  projectId: "fir-config-18b64",
  storageBucket: "fir-config-18b64.firebasestorage.app",
  messagingSenderId: "899020605923",
  appId: "1:899020605923:web:d7e1d51888451d991eb8d6",
};
const SDK = "https://www.gstatic.com/firebasejs/12.19.0/";
const REMEMBER = "sa3d-account";      // this phone has signed in before, so it can keep playing without internet
const SAVE_KEY = "sunny-acres-3d-v1"; // the farm, as game.js saves it
const OWNER = "sa3d-save-owner";      // which account the farm on this phone belongs to ("" = a farm from before accounts)
const SYNC_REV = "sa3d-sync-rev";     // the cloud version this phone's farm was last in step with
const DIRTY = "sa3d-dirty";           // "1" when this phone's farm has changed since then
const GUEST = "sa3d-guest";           // "1": playing without an account (the farm is saved on this phone only)
const RECOVER = "sa3d-recover";       // "1": game.js couldn't read this account's farm on this phone; get it back from the cloud

const $ = (id) => document.getElementById(id);
const gate = $("authGate"), form = $("authForm"), title = $("authTitle"), sub = $("authSub"), msg = $("authMsg"), go = $("authGo"), note = $("authNote");
const email = $("authEmail"), pass = $("authPass"), pass2 = $("authPass2"), forgot = $("authForgot"), tabs = $("authTabs"), choose = $("authChoose"), guestBtn = $("authGuest");
window.saAuth = {user:null, signOut:async () => {}}; // the game's Settings panel reads this
// ---------- anonymous stats: how far players get, so we can see where they stop ----------
// Each phone reports each milestone once ("opened the game", "tutorial step 3", "reached level 5", "came back the next day").
// Only the milestone's name and the date are sent: no name, email, account or farm. The players page counts them.
const STATS_DONE = "sa3d-stats";
const statQueue = [];
window.saStats = (name) => {
  if (/[?&](testfarm|shot)\b/.test(location.search)) return; // the test farm and picture-taking don't count
  try { window.saMetrics?.milestone(name); } catch {}
  let done = {}; try { done = JSON.parse(ls.get(STATS_DONE) || "{}"); } catch (e) {}
  if (done[name]) return; done[name] = 1; ls.set(STATS_DONE, JSON.stringify(done));
  statQueue.push(name); flushStats();
};
function flushStats() {
  void window.saMetrics?.flush();
  const fb = window.saAuth.fb; if (!fb) return; // Firebase isn't loaded yet: they're sent once it is
  while (statQueue.length) { const e = statQueue.shift();
    fb.F.addDoc(fb.F.collection(fb.db, "events"), {e, d:new Date().toLocaleDateString("en-CA")}).catch(() => { // offline: try again next time the game opens
      let done = {}; try { done = JSON.parse(ls.get(STATS_DONE) || "{}"); } catch (err) {} delete done[e]; ls.set(STATS_DONE, JSON.stringify(done)); }); }
}
let mode = "signin", fb = null, cloud = null;

const ls = {
  get:(k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set:(k, v) => { try { localStorage.setItem(k, v); } catch (e) {} },
  del:(k) => { try { localStorage.removeItem(k); } catch (e) {} },
};
window.saMetrics = installAnalytics();
const ERR = {
  "auth/invalid-email":"That email address doesn't look right.",
  "auth/missing-email":"Type your email address.",
  "auth/missing-password":"Type your password.",
  "auth/user-not-found":"Wrong email or password.",
  "auth/wrong-password":"Wrong email or password.",
  "auth/invalid-credential":"Wrong email or password.",
  "auth/invalid-login-credentials":"Wrong email or password.",
  "auth/email-already-in-use":"There's already an account with that email. Try signing in.",
  "auth/weak-password":"Use at least 6 characters for your password.",
  "auth/too-many-requests":"Too many tries. Wait a minute and try again.",
  "auth/network-request-failed":"No internet connection. Check it and try again.",
  "auth/operation-not-allowed":"Email sign-in isn't switched on in Firebase yet.",
};
const say = (text, ok) => { msg.textContent = text || ""; msg.classList.toggle("ok", !!ok); };

function show(m) {
  try { window.saMetrics?.end(performance.now()); } catch {}
  mode = m; gate.hidden = false; say("");
  const t = {
    checking:["🌻 Sunny Acres", "Checking your account…"],
    syncing:["🌻 Sunny Acres", "Getting your farm ready…"],
    signin:[returning() ? "Welcome back!" : "Welcome!", "Sign in to play Sunny Acres"],
    register:["Join the farm!", "Make an account. Your farm comes with you."],
    reset:["Forgot your password?", "We'll email you a link to make a new one"],
    offline:["No connection", "Can't reach the sign-in service right now"],
    choose:["Two farms found", "This phone and your account each have a farm. Which one do you want to keep playing?"],
  }[m];
  title.textContent = t[0]; sub.textContent = t[1];
  note.hidden = !(m === "signin" || m === "register"); if (!note.hidden) note.textContent = farmNote();
  const fields = m === "signin" || m === "register" || m === "reset";
  tabs.hidden = !(m === "signin" || m === "register");
  for (const b of tabs.querySelectorAll("button")) b.classList.toggle("on", b.dataset.mode === m);
  $("fEmail").hidden = !fields; $("fPass").hidden = !(m === "signin" || m === "register"); $("fPass2").hidden = m !== "register";
  pass.autocomplete = m === "register" ? "new-password" : "current-password";
  choose.hidden = m !== "choose";
  go.hidden = m === "checking" || m === "syncing" || m === "choose";
  go.textContent = {signin:"Sign in", register:"Create account", reset:"Send reset link", offline:"Try again"}[m] || "";
  forgot.hidden = !(m === "signin" || m === "reset"); forgot.textContent = m === "reset" ? "← Back to sign in" : "Forgot your password?";
  guestBtn.hidden = !(m === "signin" || m === "register" || m === "offline");
  guestBtn.textContent = ls.get(GUEST) ? "🌱 Keep playing as a guest" : "🌱 Play as a guest";
  if (fields) setTimeout(() => (email.value ? pass : email).focus(), 50);
}
// "Welcome back!" is only for people who have played on this phone before
const SEEN = "sa3d-seen";
const returning = () => !!(ls.get(SEEN) || ls.get(REMEMBER) || ls.get(OWNER) || (summary(ls.get(SAVE_KEY) || "") || {}).real);
// players who were already farming before accounts must see straight away that nothing is lost
function farmNote() {
  const raw = ls.get(SAVE_KEY), s = raw && summary(raw);
  if (s && s.real && !ls.get(OWNER)) return `🌻 Your farm is safe! (Level ${s.level} · ${s.coins.toLocaleString()} 🪙) Make an account or sign in and it comes right along with you.`;
  if (s && s.real) return "🌻 Your farm is safe in your account. Sign in to keep playing where you left off.";
  return "🌻 Played before? Your farm is safe. Sign in or make an account and it will be waiting for you.";
}
function open(user) {
  try { window.saMetrics?.end(performance.now()); } catch {}
  window.saAuth.user = {email:user.email, uid:user.uid};
  ls.set(REMEMBER, JSON.stringify(window.saAuth.user)); ls.set(SEEN, "1");
  ls.del(GUEST); window.saAuth.guest = false; banner(false); window.saStats("account");
  gate.hidden = true; pass.value = pass2.value = "";
  if (beat) { beat(); clearInterval(open.iv); open.iv = setInterval(beat, 60000); }
}
// ---------- playing as a guest ----------
// No account: the farm is saved on this phone only. It is a farm "from before accounts" (no owner), so if the guest makes an
// account later, linkFarm moves it into the new account like any other (or lets them choose, if the account has a farm already).
function playAsGuest() {
  try { window.saMetrics?.end(performance.now()); } catch {}
  const owner = ls.get(OWNER) || "";
  ls.set(GUEST, "1"); ls.set(SEEN, "1"); window.saStats("guest");
  if (owner) { // the farm on this phone belongs to an account: keep it safe for them and start the guest on a new farm
    window.__saHold = true;
    const raw = ls.get(SAVE_KEY); if (raw) ls.set(SAVE_KEY + "@" + owner, raw);
    for (const k of [SAVE_KEY, OWNER, SYNC_REV, DIRTY]) ls.del(k);
    location.reload(); return;
  }
  window.saAuth.user = null; window.saAuth.guest = true; gate.hidden = true;
  clearTimeout(banner.t); banner.t = setTimeout(() => banner(true), 45000); // a gentle reminder, once per visit
}
// "Create an account to save your farm to the cloud": never in the way, and it can be closed
function banner(on) {
  let el = $("guestBanner");
  if (!on) { clearTimeout(banner.t); if (el) el.hidden = true; return; }
  if (!window.saAuth.guest || !gate.hidden) return;
  const tut = $("tut"); if (tut && !tut.hidden) { clearTimeout(banner.t); banner.t = setTimeout(() => banner(true), 30000); return; } // not in the middle of the tutorial
  if (!el) {
    el = document.createElement("div"); el.id = "guestBanner"; el.className = "guestbar";
    el.innerHTML = `<span>☁️ Create an account to save your farm to the cloud</span><button type="button" class="btn sm" data-g="make">Create account</button><button type="button" class="gx" data-g="x" aria-label="Not now">✕</button>`;
    el.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (!b) return; el.hidden = true; if (b.dataset.g === "make") window.saAuth.upgrade(); });
    document.body.appendChild(el);
  }
  el.hidden = false;
}
window.saAuth.upgrade = () => { banner(false); show("register"); };

// "I'm playing": while the game is open on screen, a signed-in player's presence/{uid} is refreshed every minute,
// so the players page (players.html) can count who is playing now, today and this week
let beat = null;
addEventListener("sa3d:uploaded", () => { if (beat) beat(); }); // and the level shown there keeps up with each cloud save

// ---------- the farm and the account ----------
// what a saved farm amounts to, for the "which farm?" choice and to tell a real farm from a brand-new one
function summary(raw) {
  try { const s = JSON.parse(raw); return {level:s.level || 1, coins:s.coins || 0, real:(s.level || 1) > 1 || (s.xp || 0) > 0 || ((s.stats || {}).harvests || 0) > 0}; }
  catch (e) { return null; }
}
// put a farm on this phone and restart the game with it (the game mustn't save its old farm over it on the way out)
function useFarm(raw, uid, rev, dirty) {
  window.__saHold = true;
  if (raw) ls.set(SAVE_KEY, raw); else ls.del(SAVE_KEY);
  ls.set(OWNER, uid); ls.set(SYNC_REV, String(rev || 0)); if (dirty) ls.set(DIRTY, "1"); else ls.del(DIRTY);
  location.reload();
  return new Promise(() => {}); // the page is reloading
}
// Save this phone's farm to the account. Only over the version this phone last saw: if another phone saved
// in between, nothing is overwritten and the player chooses next time the game opens. `force` is for when the
// player has already chosen (or a farm from before accounts moves in).
async function upload(force) {
  clearTimeout(upload.t);
  const raw = ls.get(SAVE_KEY), s = raw && summary(raw);
  if (!cloud || !cloud.uid || !s || ls.get(OWNER) !== cloud.uid) return false;
  if (ls.get(RECOVER)) return false; // the farm here is a stand-in for one that couldn't be read: never send it over the cloud copy
  if (!force && ls.get(DIRTY) !== "1") return true; // nothing new
  try {
    const rev = await cloud.put(raw, s, force ? null : +ls.get(SYNC_REV) || 0);
    if (rev == null) { console.warn("This farm was saved from another phone meanwhile; you'll get to choose next time."); return false; }
    ls.set(SYNC_REV, String(rev)); ls.del(DIRTY); window.dispatchEvent(new CustomEvent("sa3d:uploaded", {detail:raw})); return true;
  } catch (e) { console.warn("Cloud save will try again later:", e.code || e.message); return false; }
}
// the game saves often, even when nothing changed (like when the app is closed), and refreshes truck orders and
// events by itself: only a change the player made counts
function progressOf(raw) {
  try { const s = JSON.parse(raw); for (const k of ["orders", "event", "nextEventAt", "lastNag", "lastBackup"]) delete s[k]; return JSON.stringify(s); } catch (e) { return raw; }
}
let lastProgress = progressOf(ls.get(SAVE_KEY));
addEventListener("sa3d:saved", () => {
  const p = progressOf(ls.get(SAVE_KEY)); if (p === lastProgress) return; lastProgress = p; ls.set(DIRTY, "1");
  if (cloud && cloud.uid) { clearTimeout(upload.t); upload.t = setTimeout(upload, 15000); }
});
document.addEventListener("visibilitychange", () => { if (document.hidden) upload(); else if (beat) beat(); }); // leaving the app: save to the cloud now

// Decide which farm this account plays, the moment it signs in. No farm is ever thrown away:
// - a farm from before accounts moves into the brand-new account (or, if the account already has one, the player picks)
// - someone else's farm on this phone is put aside for them (they get it back when they sign in again)
// - a new phone gets the account's farm from the cloud
// Recovery: this account's farm on this phone can't be read (or game.js flagged it): bring the cloud copy back, never the
// other way round. auth.js checks the phone copy itself, because it may get here before game.js has even read the save.
const keepUnreadable = (raw) => { if (raw && !summary(raw) && !ls.get(SAVE_KEY + "-unreadable")) ls.set(SAVE_KEY + "-unreadable", raw); };
let recoveryTry = 0, linkAttempt = 0;
// The first cloud read can hang without ever answering or failing (seen on a busy page). After this long it counts as
// "unavailable": the farm is NOT treated as missing, nothing is uploaded, and the normal retry below takes over.
const CLOUD_READ_MS = 20000;
function readCloud(attempt) {
  const ms = CLOUD_READ_MS;
  // tests only: hold back the first ANSWER by this long (set before the page loads by the test harness; never set by the
  // game). A read that fails on its own doesn't use it up, so the hold always lands on a real answer.
  const get = cloud.get().then((v) => { const hold = window.__saTestHoldCloudRead; if (!hold) return v; window.__saTestHoldCloudRead = 0; return new Promise((r) => setTimeout(() => r(v), hold)); });
  return new Promise((resolve, reject) => {
    let done = false;
    const t = setTimeout(() => { done = true; console.warn("Cloud farm read #" + attempt + " got no answer in " + ms / 1000 + " s; giving up on it."); reject(Object.assign(new Error("cloud read timed out"), {code:"timeout"})); }, ms);
    get.then(
      (v) => { if (done) return console.warn("Cloud farm read #" + attempt + " answered after it was given up; ignored."); done = true; clearTimeout(t); resolve(v); },
      (e) => { if (done) return; done = true; clearTimeout(t); reject(e); });
  });
}
async function linkFarm(user) {
  const attempt = ++linkAttempt; // only the newest attempt may act: an older one that answers late changes nothing
  const uid = user.uid, owner = ls.get(OWNER) || "", raw = ls.get(SAVE_KEY), here = raw && summary(raw), dirty = ls.get(DIRTY) === "1";
  const recovering = owner === uid && (!!ls.get(RECOVER) || (!!raw && !here));
  if (recovering) ls.set(RECOVER, "1"); // until it's done, nothing from this phone is uploaded (upload() checks this)
  let remote = null;
  try { remote = await readCloud(attempt); }
  catch (e) {
    if (attempt !== linkAttempt) return; // a newer attempt has started: leave everything to it
    console.warn("Cloud farm unavailable, playing the farm on this phone:", e.code || e.message); cloud.uid = null;
    // A slow or busy phone often misses the first try (Firestore gives up after 10 s while the 3D farm is being built).
    // Without another try the whole visit never syncs, and a pending recovery never finishes. So keep trying, a little
    // slower each time, while this same account stays signed in and isn't linked yet. Each try makes exactly the same
    // decisions as opening the game again; until one succeeds nothing is uploaded (cloud.uid stays null).
    const wait = Math.min(60e3, 5e3 * ++recoveryTry);
    console.warn((recovering ? "Farm recovery is waiting for the cloud" : "Cloud sync is waiting") + "; trying again in " + wait / 1000 + " s.");
    clearTimeout(linkFarm.retry);
    linkFarm.retry = setTimeout(() => { if (window.saAuth.user && window.saAuth.user.uid === uid && !cloud.uid) linkFarm(user); }, wait);
    return open(user);
  }
  if (attempt !== linkAttempt) return console.warn("Cloud farm read #" + attempt + " was overtaken by a newer one; ignored.");
  recoveryTry = 0;
  cloud.uid = uid;
  if (owner !== uid) ls.del("sa3d-restored");
  let rrev = remote ? remote.rev || 0 : 0;
  // a cloud copy that can't be read is never brought to this phone: it would replace a good farm here, or make an
  // unreadable phone copy "recover" into another unreadable one, again and again
  if (remote && !summary(remote.save)) {
    console.warn("The cloud farm can't be read; keeping the farm on this phone.");
    if (recovering) { // neither copy can be read: keep playing here (the phone's unreadable copy is kept);
      keepUnreadable(raw); ls.del(RECOVER); ls.set(SYNC_REV, String(rrev)); return open(user); // the next real change replaces the unreadable cloud copy
    }
    if (owner === uid && here) { await upload(true); return open(user); } // this phone's good farm repairs the cloud copy
    remote = null; rrev = 0;
  }
  if (recovering) {
    keepUnreadable(raw);
    if (remote) {
      window.__saHold = true; ls.set(SAVE_KEY, remote.save); // (ls.set swallows errors: check the farm really landed)
      if (ls.get(SAVE_KEY) !== remote.save) { // storage full: reloading would only find the unreadable state again
        window.__saHold = false; console.warn("Couldn't put the cloud farm on this phone (storage full?). It will be tried again next time.");
        return open(user); // recovery stays pending, so nothing is uploaded over the cloud copy meanwhile
      }
      console.warn("This phone's farm couldn't be read: bringing back the cloud farm.");
      ls.del(RECOVER); return useFarm(remote.save, uid, rrev);
    }
    // A missing-cloud answer can arrive before game.js reads the damaged local save.
    // Let startup mark it for recovery first; otherwise load() sets RECOVER again after
    // we clear it here, leaving this visit permanently unable to upload its fresh farm.
    while (!window.__ready) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (attempt !== linkAttempt || window.saAuth.fb.auth.currentUser?.uid !== uid) return;
    }
    if (attempt !== linkAttempt || window.saAuth.fb.auth.currentUser?.uid !== uid) return;
    ls.del(RECOVER); ls.set(SYNC_REV, "0"); // nothing in the cloud to protect: this farm may start the account's cloud save
  } else if (ls.get(RECOVER)) ls.del(RECOVER); // a leftover from another account's farm on this phone: never acts for this one
  if (owner === uid && ls.get("sa3d-restored")) { ls.del("sa3d-restored"); await upload(true); return open(user); } // just restored from a backup: that's the farm now, here and in the cloud
  if (owner === uid) { // this account's own farm
    if (remote && rrev > (+ls.get(SYNC_REV) || 0)) { // it was saved from another phone since this one last synced
      if (!dirty) return useFarm(remote.save, uid, rrev);
      return pickFarm(user, raw, here, remote); // and this phone changed it too: the player decides
    }
    await upload(); return open(user);
  }
  if (owner) { // another account's farm is on this phone: keep it safe for them
    if (raw) ls.set(SAVE_KEY + "@" + owner, raw);
    if (remote) return useFarm(remote.save, uid, rrev);
    const mine = ls.get(SAVE_KEY + "@" + uid); if (mine) { ls.del(SAVE_KEY + "@" + uid); return useFarm(mine, uid, 0, true); }
    return useFarm(null, uid); // a fresh farm for a new player
  }
  // a farm from before accounts (or a phone that has never been played)
  if (!here || !here.real) {
    if (remote) return useFarm(remote.save, uid, rrev);
    ls.set(OWNER, uid); await upload(true); return open(user);
  }
  if (!remote || remote.save === raw) { ls.set(OWNER, uid); await upload(true); open(user); window.__saLinked = true; window.dispatchEvent(new Event("sa3d:linked")); return; } // the farm moves into the account
  return pickFarm(user, raw, here, remote);
}
// two different farms for one account: show both and let the player keep one; the other stays on this phone as a backup
async function pickFarm(user, raw, here, remote) {
  const uid = user.uid, there = summary(remote.save) || {level:1, coins:0}; here = here || {level:1, coins:0};
  choose.querySelector('[data-pick="phone"] small').textContent = `Level ${here.level} · ${here.coins.toLocaleString()} 🪙`;
  choose.querySelector('[data-pick="cloud"] small').textContent = `Level ${there.level} · ${there.coins.toLocaleString()} 🪙`;
  show("choose");
  const pick = await new Promise((res) => { choose.onclick = (e) => { const b = e.target.closest("[data-pick]"); if (b) res(b.dataset.pick); }; });
  if (pick === "phone") { ls.set(SAVE_KEY + "-backup-account", remote.save); ls.set(OWNER, uid); await upload(true); return open(user); }
  ls.set(SAVE_KEY + "-backup-phone", raw); return useFarm(remote.save, uid, remote.rev || 0);
}

async function start() {
  show("checking");
  try {
    const [{initializeApp}, A, F] = await Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-firestore.js")]);
    const app = initializeApp(firebaseConfig), auth = A.getAuth(app), db = F.getFirestore(app, "default"); // this project's Firestore database is named "default"
    fb = {A, auth};
    // Phase 7I: the verified farm economy runs on the server (Cloud Function economyAct). Its SDK loads the first time
    // it is needed. call(data) resolves to the result, or rejects with error.details.reason for a refusal.
    let fns = null;
    const call = async (data) => {
      if (!fns) { const Fn = await import(SDK + "firebase-functions.js"); fns = {Fn, f:Fn.getFunctions(app, "us-central1")}; }
      return (await fns.Fn.httpsCallable(fns.f, "economyAct")(data)).data;
    };
    window.saAuth.fb = {F, db, auth, call}; // friends.js uses the same Firebase app
    flushStats();
    cloud = {uid:null,
      get:async () => { const d = await F.getDoc(F.doc(db, "farms", auth.currentUser.uid)); return d.exists() ? d.data() : null; },
      // write a new version, only if the cloud still has the version this phone expects (null: write regardless)
      put:(raw, s, expect) => F.runTransaction(db, async (tx) => {
        const ref = F.doc(db, "farms", cloud.uid), d = await tx.get(ref), cur = d.exists() ? d.data().rev || 0 : 0;
        if (expect != null && cur !== expect) return null;
        tx.set(ref, {save:raw, level:s.level, coins:s.coins, rev:cur + 1, updatedAt:Date.now()});
        return cur + 1;
      })};
    beat = () => {
      if (!cloud.uid || document.hidden) return;
      const s = summary(ls.get(SAVE_KEY)) || {level:1}, joined = Date.parse(auth.currentUser.metadata.creationTime) || null;
      F.setDoc(F.doc(db, "presence", cloud.uid), {seen:F.serverTimestamp(), level:s.level, joined}, {merge:true}).catch(() => {});
    };
    window.saAuth.signOut = async () => { await upload(); cloud.uid = null; await A.signOut(auth); };
    // fires straight away with the saved sign-in (kept on this phone), and again on every sign-in and sign-out
    A.onAuthStateChanged(auth, async (user) => {
      if (user) { show("syncing"); return linkFarm(user); }
      window.saAuth.user = null; ls.del(REMEMBER);
      if (ls.get(GUEST)) return playAsGuest();
      show("signin");
    });
  } catch (e) {
    // the sign-in service didn't load (usually no internet): a phone that has signed in before keeps playing
    let known = null; try { known = JSON.parse(ls.get(REMEMBER)); } catch (err) {}
    if (known) { window.saAuth.user = known; gate.hidden = true; return; }
    if (ls.get(GUEST)) { window.saAuth.guest = true; gate.hidden = true; return; }
    show("offline");
  }
}

guestBtn.addEventListener("click", () => playAsGuest());
tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) show(b.dataset.mode); });
forgot.addEventListener("click", () => show(mode === "reset" ? "signin" : "reset"));
$("authEye").addEventListener("click", () => { const t = pass.type === "password" ? "text" : "password"; pass.type = pass2.type = t; });
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (mode === "offline") return location.reload(); // a failed download is remembered until the page reloads
  if (!fb || mode === "choose") return;
  const {A, auth} = fb, em = email.value.trim(), pw = pass.value;
  if (!em) return say(ERR["auth/missing-email"]);
  if (mode !== "reset" && !pw) return say(ERR["auth/missing-password"]);
  if (mode === "register" && pw !== pass2.value) return say("The two passwords don't match.");
  go.disabled = true; const label = go.textContent; go.textContent = "One moment…"; say("");
  try {
    if (mode === "signin") await A.signInWithEmailAndPassword(auth, em, pw);
    else if (mode === "register") await A.createUserWithEmailAndPassword(auth, em, pw);
    else { await A.sendPasswordResetEmail(auth, em); say("Check your email for a link to make a new password.", true); }
  } catch (err) { say(ERR[err.code] || "Something went wrong. Please try again."); }
  go.disabled = false; go.textContent = label;
});

const configured = !Object.values(firebaseConfig).some(v => String(v).includes("YOUR_"));
// ?testfarm opens a throwaway test farm (see game.js): no sign-in, no cloud
if (new URLSearchParams(location.search).has("testfarm")) { window.saAuth.guest = false; gate.hidden = true; }
else if (configured) start();
