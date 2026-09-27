// Sunny Acres 3D: player accounts with Firebase Authentication (v9 modular Web SDK), email and password.
// Until the config below is filled in (it still says YOUR_…), accounts stay switched off and the game plays as before.
// To switch them on: Firebase console › Project settings › Your apps › Web app › copy the config here,
// then Authentication › Sign-in method › turn on Email/Password.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID",
};
const SDK = "https://www.gstatic.com/firebasejs/9.23.0/";
const REMEMBER = "sa3d-account"; // this phone has signed in before, so it can keep playing without internet

const $ = (id) => document.getElementById(id);
const gate = $("authGate"), form = $("authForm"), title = $("authTitle"), sub = $("authSub"), msg = $("authMsg"), go = $("authGo");
const email = $("authEmail"), pass = $("authPass"), pass2 = $("authPass2"), forgot = $("authForgot"), tabs = $("authTabs");
window.saAuth = {user:null, signOut:async () => {}}; // the game's Settings panel reads this
let mode = "signin", fb = null;

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
  mode = m; gate.hidden = false; say("");
  const t = {
    checking:["🌻 Sunny Acres", "Checking your account…"],
    signin:["Welcome back!", "Sign in to play Sunny Acres"],
    register:["Join the farm!", "Make an account to start playing"],
    reset:["Forgot your password?", "We'll email you a link to make a new one"],
    offline:["No connection", "Can't reach the sign-in service right now"],
  }[m];
  title.textContent = t[0]; sub.textContent = t[1];
  const fields = m === "signin" || m === "register" || m === "reset";
  tabs.hidden = !(m === "signin" || m === "register");
  for (const b of tabs.querySelectorAll("button")) b.classList.toggle("on", b.dataset.mode === m);
  $("fEmail").hidden = !fields; $("fPass").hidden = !(m === "signin" || m === "register"); $("fPass2").hidden = m !== "register";
  pass.autocomplete = m === "register" ? "new-password" : "current-password";
  go.hidden = m === "checking";
  go.textContent = {signin:"Sign in", register:"Create account", reset:"Send reset link", offline:"Try again"}[m] || "";
  forgot.hidden = !(m === "signin" || m === "reset"); forgot.textContent = m === "reset" ? "← Back to sign in" : "Forgot your password?";
  if (fields) setTimeout(() => (email.value ? pass : email).focus(), 50);
}
function unlock(user) {
  window.saAuth.user = {email:user.email, uid:user.uid};
  try { localStorage.setItem(REMEMBER, JSON.stringify(window.saAuth.user)); } catch (e) {}
  gate.hidden = true; pass.value = pass2.value = "";
}

async function start() {
  show("checking");
  try {
    const [{initializeApp}, A] = await Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js")]);
    const auth = A.getAuth(initializeApp(firebaseConfig));
    fb = {A, auth};
    window.saAuth.signOut = () => A.signOut(auth);
    // fires straight away with the saved sign-in (kept on this phone), and again on every sign-in and sign-out
    A.onAuthStateChanged(auth, (user) => {
      if (user) return unlock(user);
      window.saAuth.user = null; try { localStorage.removeItem(REMEMBER); } catch (e) {}
      show("signin");
    });
  } catch (e) {
    // the sign-in service didn't load (usually no internet): a phone that has signed in before keeps playing
    let known = null; try { known = JSON.parse(localStorage.getItem(REMEMBER)); } catch (err) {}
    if (known) { window.saAuth.user = known; gate.hidden = true; return; }
    show("offline");
  }
}

tabs.addEventListener("click", (e) => { const b = e.target.closest("[data-mode]"); if (b) show(b.dataset.mode); });
forgot.addEventListener("click", () => show(mode === "reset" ? "signin" : "reset"));
$("authEye").addEventListener("click", () => { const t = pass.type === "password" ? "text" : "password"; pass.type = pass2.type = t; });
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (mode === "offline") return location.reload(); // a failed download is remembered until the page reloads
  if (!fb) return;
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
if (configured) start();
