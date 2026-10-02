// Sunny Acres 3D, Phase 7I: Cloud Functions entry point.
// economyAct is the only way to change the canonical economy. Call it from the game with the Firebase callable
// protocol: httpsCallable(functions, "economyAct")({op, ...}). The signed-in account is taken from the verified ID
// token, never from the request body.
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore, FieldValue} = require("firebase-admin/firestore");
const {act, EconomyError, OPS} = require("./economy");

initializeApp();
// The game's Firestore database is NAMED "default" (auth.js: getFirestore(app, "default")); it is not the unnamed
// "(default)" database the admin SDK would pick by itself. The economy must live in the same database the game reads.
const DATABASE = "default";
const db = getFirestore(DATABASE);

exports.economyAct = onCall({region: "us-central1", enforceAppCheck: false}, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in to use the farm economy.", {reason: "SIGN_IN"});
  const data = request.data && typeof request.data === "object" ? request.data : {};
  try {
    return await act(db, FieldValue, uid, String(data.op || ""), data, OPS);
  } catch (e) {
    if (e instanceof EconomyError) throw new HttpsError(e.code, e.message, {reason: e.reason});
    console.error("economyAct failed", data.op, e);
    throw new HttpsError("internal", "The farm economy is having trouble. Try again.", {reason: "INTERNAL"});
  }
});
