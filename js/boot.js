// ═══════════════════════════════════════════ BOOT
var _appReady = false;
var _justRegistered = false; // set true by doRegister() before calling loadP()

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
  } else if (ev === 'SIGNED_OUT') {
    U = null; P = null;
    _justRegistered = false;
    showScr('loginScreen');
  }
});
