// ═══════════════════════════════════════════ BOOT
// ═══════════════════════════════════════════ BOOT
var _appReady = false;
var _justRegistered = false;
var _loadingProfile = false; // prevents double loadP() from auth + onAuthStateChange

var _bootFallback = setTimeout(function() {
  if (!_appReady) {
    _appReady = true;
    showScr('loginScreen');
  }
}, 5000);

sb.auth.onAuthStateChange(function(ev, sess) {
  if (ev === 'INITIAL_SESSION') {
    clearTimeout(_bootFallback);
    _appReady = true;
    if (sess && sess.user) {
      U = sess.user;
      loadP();
    } else {
      showScr('loginScreen');
    }
  } else if (ev === 'SIGNED_IN') {
    // auth.js calls loadP() directly after signIn/signUp.
    // _loadingProfile guards against this duplicate trigger.
    if (_loadingProfile) return;
    // Same user, profile already loaded — skip
    if (U && U.id === sess.user.id && P) return;
    U = sess.user;
    loadP();
  } else if (ev === 'SIGNED_OUT') {
    U = null; P = null;
    _justRegistered = false;
    _loadingProfile = false;
    showScr('loginScreen');
  }
});
var _justRegistered = false;
var _loadingProfile = false; // guard against double loadP()

var _bootFallback = setTimeout(function() {
  if (!_appReady) {
    _appReady = true;
    showScr('loginScreen');
  }
}, 5000);

sb.auth.onAuthStateChange(function(ev, sess) {
  if (ev === 'INITIAL_SESSION') {
    clearTimeout(_bootFallback);
    _appReady = true;
    if (sess && sess.user) {
      U = sess.user;
      loadP();
    } else {
      showScr('loginScreen');
    }
  } else if (ev === 'SIGNED_IN') {
    // If auth.js already called loadP() directly (login/register flow),
    // skip the duplicate trigger from onAuthStateChange
    if (_loadingProfile) return;
    // If same user already loaded, skip
    if (U && U.id === sess.user.id && P) return;
    U = sess.user;
    loadP();
  } else if (ev === 'SIGNED_OUT') {
    U = null; P = null;
    _justRegistered = false;
    _loadingProfile = false;
    showScr('loginScreen');
  }
});
