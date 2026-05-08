// ═══════════════════════════════════════════ AUTH

async function doLogin() {
  var em    = document.getElementById('lEmail').value.trim();
  var pw    = document.getElementById('lPass').value;
  var errEl = document.getElementById('lErr');
  errEl.style.display = 'none';
  if (!em || !pw) { errEl.textContent = 'Please enter your email and password.'; errEl.style.display = 'block'; return; }
  var btn = document.getElementById('lBtn');
  var origHTML = btn.innerHTML;
  btn.disabled = true; btn.innerHTML = 'Signing in...'; btn.style.opacity = '0.7';
  try {
    var r = await sb.auth.signInWithPassword({email:em, password:pw});
    btn.disabled = false; btn.innerHTML = origHTML; btn.style.opacity = '1';
    if (r.error) { errEl.textContent = r.error.message; errEl.style.display = 'block'; return; }
    U = r.data.user;
    await loadP();
  } catch(e) {
    btn.disabled = false; btn.innerHTML = origHTML; btn.style.opacity = '1';
    errEl.textContent = e.message || 'Connection error. Please check your internet.';
    errEl.style.display = 'block';
  }
}

async function doRegister() {
  var em    = document.getElementById('rEmail').value.trim();
  var pw    = document.getElementById('rPass').value;
  var cf    = document.getElementById('rConf').value;
  var terms = document.getElementById('rTerms').checked;
  var err   = document.getElementById('rErr');
  err.style.display = 'none';
  if (!em)        { err.textContent = 'Please enter your email.'; err.style.display = 'block'; return; }
  if (pw.length < 8) { err.textContent = 'Password must be at least 8 characters.'; err.style.display = 'block'; return; }
  if (pw !== cf)  { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }
  if (!terms)     { err.textContent = 'Please agree to the Terms & conditions.'; err.style.display = 'block'; return; }
  var btn = document.getElementById('rBtn');
  btn.disabled = true; btn.textContent = 'Creating account...';
  var res = await sb.auth.signUp({email:em, password:pw});
  btn.disabled = false; btn.textContent = 'Create Account ✦';
  if (res.error) { err.textContent = res.error.message; err.style.display = 'block'; return; }
  U = res.data.user;
  if (typeof fbq !== 'undefined') fbq('track','Lead');

  // ── Welcome email ──
  try {
    fetch(SB_URL + '/functions/v1/smart-function', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'registered', full_name: '', email: em})
    });
  } catch(x) {}

  // ── REFERRAL ──
  if (U) { try { await saveReferral(U.id, em); } catch(x) {} }

  await loadP();
}

async function doForgot() {
  var em  = document.getElementById('fgEmail').value.trim();
  var err = document.getElementById('fgErr');
  var ok  = document.getElementById('fgOk');
  err.style.display = 'none'; ok.style.display = 'none';
  if (!em) { err.textContent = 'Please enter your email.'; err.style.display = 'block'; return; }
  var btn = document.getElementById('fgBtn');
  btn.disabled = true; btn.textContent = 'Sending...';
  var res = await sb.auth.resetPasswordForEmail(em);
  btn.disabled = false; btn.textContent = 'Send Reset Link';
  if (res.error) { err.textContent = res.error.message; err.style.display = 'block'; return; }
  ok.textContent = 'Reset link sent! Check your inbox.'; ok.style.display = 'block';
}

async function doSignOut() {
  await sb.auth.signOut();
  U = null; P = null;
  showScr('loginScreen');
}
