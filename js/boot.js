var _appReady = false;
var _justRegistered = false;
var _loadingProfile = false;

var _bootFallback = setTimeout(function() {
  if (!_appReady) { _appReady = true; showScr('loginScreen'); }
}, 5000);

sb.auth.onAuthStateChange(function(ev, sess) {
  if (ev === 'INITIAL_SESSION') {
    clearTimeout(_bootFallback);
    _appReady = true;
    if (sess && sess.user) { U = sess.user; loadP(); }
    else { showScr('loginScreen'); }
  } else if (ev === 'SIGNED_IN') {
    if (_loadingProfile || _justRegistered) return;  // block both
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
