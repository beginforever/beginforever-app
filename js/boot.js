// ═══════════════════════════════════════════ BOOT
var _appReady = false;

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
    if (sess && sess.user) {
      U = sess.user;
      // Only call loadP if we're not already in the app
      var mainApp = document.getElementById('mainApp');
      var isInApp = mainApp && mainApp.classList.contains('active');
      if (!isInApp) loadP();
    }
  } else if (ev === 'SIGNED_OUT') {
    U = null; P = null;
    showScr('loginScreen');
  }
});
