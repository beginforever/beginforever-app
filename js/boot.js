// ═══════════════════════════════════════════ BOOT
var _appReady = false;
var _justRegistered = false;
var _loadingProfile = false;

var _bootFallback = setTimeout(function() {
  if (!_appReady) {
    _appReady = true;
    if (!_justRegistered && !_loadingProfile) showScr('loginScreen');
  }
}, 5000);

sb.auth.onAuthStateChange(function(ev, sess) {
  if (ev === 'INITIAL_SESSION') {
    clearTimeout(_bootFallback);
    _appReady = true;
    if (sess && sess.user) {
      U = sess.user;
      if (!_justRegistered && !_loadingProfile) loadP();
    } else {
      if (!_justRegistered && !_loadingProfile) showScr('loginScreen');
    }
  } else if (ev === 'SIGNED_IN') {
    if (_justRegistered || _loadingProfile) return;
    if (U && sess && sess.user && U.id === sess.user.id && P) return;
    U = sess.user;
    loadP();
  } else if (ev === 'SIGNED_OUT') {
    U = null; P = null;
    _justRegistered = false;
    _loadingProfile = false;
    showScr('loginScreen');
  }
});
