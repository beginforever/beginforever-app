// ═══════════════════════════════════════════ AUTH

async function doLogin() {
  var em    = document.getElementById('lEmail').value.trim();
  var pw    = document.getElementById('lPass').value;
  var errEl = document.getElementById('lErr');
  errEl.style.display = 'none';
  if (!em || !pw) {
    errEl.textContent = 'Please enter your email and password.';
    errEl.style.display = 'block'; return;
  }
  var btn = document.getElementById('lBtn');
  var origText = btn.textContent;
  btn.disabled = true; btn.textContent = 'Signing in…'; btn.style.opacity = '0.7';
  try {
    var r = await sb.auth.signInWithPassword({email: em, password: pw});
    btn.disabled = false; btn.textContent = origText; btn.style.opacity = '1';
    if (r.error) {
      errEl.textContent = r.error.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : r.error.message;
      errEl.style.display = 'block'; return;
    }
    U = r.data.user;
    _loadingProfile = true;
    await loadP();
    _loadingProfile = false;
  } catch(e) {
    btn.disabled = false; btn.textContent = origText; btn.style.opacity = '1';
    errEl.textContent = e.message || 'Connection error. Please check your internet.';
    errEl.style.display = 'block';
    _loadingProfile = false;
  }
}

async function doRegister() {
  var em    = document.getElementById('rEmail').value.trim();
  var pw    = document.getElementById('rPass').value;
  var cf    = document.getElementById('rConf').value;
  var terms = document.getElementById('rTerms').checked;
  var err   = document.getElementById('rErr');
  err.style.display = 'none';

  if (!em)           { err.textContent = 'Please enter your email.'; err.style.display = 'block'; return; }
  if (pw.length < 8) { err.textContent = 'Password must be at least 8 characters.'; err.style.display = 'block'; return; }
  if (pw !== cf)     { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }
  if (!terms)        { err.textContent = 'Please agree to the Terms & conditions.'; err.style.display = 'block'; return; }

  var btn = document.getElementById('rBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';

  // Set flags BEFORE signUp so auth event is blocked immediately
  _justRegistered = true;
  _loadingProfile = true;

  try {
    var res = await sb.auth.signUp({email: em, password: pw});
    btn.disabled = false; btn.textContent = 'Create Account ✦';

    if (res.error) {
      _justRegistered = false; _loadingProfile = false;
      err.textContent = res.error.message; err.style.display = 'block'; return;
    }

    var newUser = res.data && res.data.user;
    if (!newUser) {
      _justRegistered = false; _loadingProfile = false;
      err.textContent = 'Account creation failed. Please try again.';
      err.style.display = 'block'; return;
    }

    U = newUser;

    if (typeof fbq !== 'undefined') fbq('track', 'Lead');

    // Fire and forget — no await
    try {
      fetch(SB_URL + '/functions/v1/smart-function', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({type: 'registered', full_name: '', email: em})
      });
    } catch(x) {}

    // Non-blocking referral save
    if (U) { saveReferral(U.id, em).catch(function(){}); }

    await loadP();
    _loadingProfile = false;
    _justRegistered = false;

  } catch(e) {
    btn.disabled = false; btn.textContent = 'Create Account ✦';
    err.textContent = e.message || 'Something went wrong. Please try again.';
    err.style.display = 'block';
    _loadingProfile = false;
    _justRegistered = false;
  }
}

async function doForgot() {
  var em  = document.getElementById('fgEmail').value.trim();
  var err = document.getElementById('fgErr');
  var ok  = document.getElementById('fgOk');
  err.style.display = 'none'; ok.style.display = 'none';

  if (!em) { err.textContent = 'Please enter your email.'; err.style.display = 'block'; return; }

  var btn = document.getElementById('fgBtn');
  btn.disabled = true; btn.textContent = 'Sending…';

  var res = await sb.auth.resetPasswordForEmail(em, {
    redirectTo: 'https://beginforever.app/reset-password.html'
  });
  btn.disabled = false; btn.textContent = 'Send Reset Link';

  if (res.error) { err.textContent = res.error.message; err.style.display = 'block'; return; }
  ok.textContent = '✅ Reset link sent! Check your inbox.'; ok.style.display = 'block';
}

async function doSignOut() {
  await sb.auth.signOut();
  U = null; P = null;
  showScr('loginScreen');
}
