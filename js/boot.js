// ═══════════════════════════════════════════ BOOT
var _bootFallback = setTimeout(function() {
  showScr('loginScreen');
}, 4000);

sb.auth.onAuthStateChange(function(ev, sess) {
  if (ev === 'INITIAL_SESSION' || ev === 'SIGNED_IN') {
    clearTimeout(_bootFallback);
    if (sess && sess.user) {
      U = sess.user;
      var otpScr = document.getElementById('otpScreen');
      if (otpScr && otpScr.style.display !== 'none') return;
      loadP();
    } else {
      showScr('loginScreen');
    }
  } else if (ev === 'SIGNED_OUT') {
    U = null; P = null;
    showScr('loginScreen');
  }
});
