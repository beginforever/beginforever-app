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

  try { sessionStorage.setItem('bf_reg_em', em); sessionStorage.setItem('bf_reg_pw', pw); } catch(x) {}

  var phoneInp = document.getElementById('otpPhoneInput');
  if (phoneInp && (!phoneInp.value || phoneInp.value === '+91')) phoneInp.value = '+91';

  showScr('otpScreen');
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
