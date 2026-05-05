// ═══════════════════════════════════════════ BOOT
// Always loaded last. Single source of truth for auth state.

var _bootFallback = setTimeout(function() {
  showScr('loginScreen');
}, 4000);

sb.auth.onAuthStateChange(function(ev, sess) {
  if (ev === 'INITIAL_SESSION' || ev === 'SIGNED_IN') {
    clearTimeout(_bootFallback);
    if (sess && sess.user) {
      U = sess.user;
      loadP();
    } else {
      showScr('loginScreen');
    }
  } else if (ev === 'SIGNED_OUT') {
    U = null; P = null;
    showScr('loginScreen');
  }
});
