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

// ── OTP STATE
var _otpPhone = '';
var _otpResendTimer = null;

async function sendOtp() {
  var raw = document.getElementById('otpPhoneInput').value.trim();
  if (!raw || raw.replace(/\D/g,'').length < 10) {
    alert('Please enter a valid 10-digit mobile number.');
    return;
  }
  var btn = document.getElementById('otpSendBtn');
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    var res = await fetch(SB_URL + '/functions/v1/send-otp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({phone: raw, action: 'send'})
    });
    var data = await res.json();
    if (data.error) { alert(data.error); btn.disabled = false; btn.textContent = 'Send Code →'; return; }
    _otpPhone = raw;
    var disp = document.getElementById('otpPhoneDisplay');
    if (disp) disp.textContent = raw;
    document.getElementById('otpPhoneEntry').style.display = 'none';
    document.getElementById('otpCodeEntry').style.display = '';
    _buildOtpBoxes();
    _startResendTimer();
  } catch(e) {
    alert('Could not send OTP. Please check your connection.');
    btn.disabled = false; btn.textContent = 'Send Code →';
  }
}

function _buildOtpBoxes() {
  var row = document.getElementById('otpBoxes'); if (!row) return;
  row.innerHTML = '';
  for (var i = 0; i < 6; i++) {
    var inp = document.createElement('input');
    inp.type = 'tel'; inp.maxLength = 1; inp.className = 'otp-box';
    inp.dataset.idx = i;
    inp.addEventListener('input', function(e) {
      var v = e.target.value.replace(/\D/g,'');
      e.target.value = v;
      if (v && parseInt(e.target.dataset.idx) < 5) {
        var next = row.querySelector('[data-idx="'+(parseInt(e.target.dataset.idx)+1)+'"]');
        if (next) next.focus();
      }
      if (v) e.target.classList.add('filled'); else e.target.classList.remove('filled');
    });
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !e.target.value && parseInt(e.target.dataset.idx) > 0) {
        var prev = row.querySelector('[data-idx="'+(parseInt(e.target.dataset.idx)-1)+'"]');
        if (prev) { prev.value = ''; prev.classList.remove('filled'); prev.focus(); }
      }
    });
    row.appendChild(inp);
  }
  row.querySelector('[data-idx="0"]').focus();
}

function _startResendTimer() {
  var secs = 42;
  var btn = document.getElementById('resendBtn');
  var timerEl = document.getElementById('resendTimer');
  if (btn) btn.disabled = true;
  if (_otpResendTimer) clearInterval(_otpResendTimer);
  _otpResendTimer = setInterval(function() {
    secs--;
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    if (timerEl) timerEl.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    if (secs <= 0) {
      clearInterval(_otpResendTimer);
      if (btn) { btn.disabled = false; btn.innerHTML = 'Resend code'; }
    }
  }, 1000);
}

async function resendOtp() {
  var btn = document.getElementById('resendBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  try {
    var res = await fetch(SB_URL + '/functions/v1/send-otp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({phone: _otpPhone, action: 'send'})
    });
    var data = await res.json();
    if (data.error) { alert(data.error); return; }
    _buildOtpBoxes();
    _startResendTimer();
  } catch(e) {
    alert('Could not resend. Please try again.');
  }
}

async function verifyOtp() {
  var row = document.getElementById('otpBoxes'); if (!row) return;
  var boxes = row.querySelectorAll('.otp-box');
  var code = '';
  boxes.forEach(function(b) { code += b.value; });
  if (code.length < 6) {
    var e = document.getElementById('otpErr');
    if(e){e.textContent='Enter the 6-digit code.';e.style.display='block';}
    return;
  }
  var btn = document.getElementById('otpVerifyBtn');
  btn.disabled = true; btn.textContent = 'Verifying…';
  try {
    var res = await fetch(SB_URL + '/functions/v1/send-otp', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({phone: _otpPhone, action: 'verify', code: code})
    });
    var data = await res.json();
    if (data.error) {
      var e = document.getElementById('otpErr');
      if(e){e.textContent=data.error;e.style.display='block';}
      btn.disabled = false; btn.textContent = 'Verify & Continue';
      return;
    }
    _doRegisterAfterOtp();
  } catch(e) {
    var err = document.getElementById('otpErr');
    if(err){err.textContent='Verification failed. Please try again.';err.style.display='block';}
    btn.disabled = false; btn.textContent = 'Verify & Continue';
  }
}

async function _doRegisterAfterOtp() {
  var em, pw;
  try { em = sessionStorage.getItem('bf_reg_em'); pw = sessionStorage.getItem('bf_reg_pw'); } catch(x) {}
  if (!em || !pw) { showScr('registerScreen'); return; }

  var btn = document.getElementById('otpVerifyBtn');
  btn.disabled = true; btn.textContent = 'Creating account…';

  _justRegistered = true;
  _loadingProfile = true;

  try {
    var res = await sb.auth.signUp({email: em, password: pw});
    if (res.error) {
      _justRegistered = false; _loadingProfile = false;
      btn.disabled = false; btn.textContent = 'Verify & Continue';
      alert(res.error.message); return;
    }
    var newUser = res.data && res.data.user;
    if (!newUser) {
      _justRegistered = false; _loadingProfile = false;
      btn.disabled = false; btn.textContent = 'Verify & Continue';
      alert('Account creation failed. Please try again.'); return;
    }
    U = newUser;
    try {
      sessionStorage.setItem('bf_uid', newUser.id);
      sessionStorage.setItem('bf_verified_phone', _otpPhone);
      sessionStorage.removeItem('bf_reg_em');
      sessionStorage.removeItem('bf_reg_pw');
    } catch(x) {}
    if (typeof fbq !== 'undefined') fbq('track', 'Lead');
    try {
      fetch(SB_URL + '/functions/v1/smart-function', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({type: 'registered', full_name: '', email: em})
      });
    } catch(x) {}
    if (U) { saveReferral(U.id, em).catch(function(){}); }
    await loadP();
    _loadingProfile = false;
    _justRegistered = false;
  } catch(e) {
    btn.disabled = false; btn.textContent = 'Verify & Continue';
    _loadingProfile = false; _justRegistered = false;
    alert(e.message || 'Something went wrong. Please try again.');
  }
}
