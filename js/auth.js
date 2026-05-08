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

  // ── REFERRAL: save who referred this new user ──────────────────
  if (U) { try { await saveReferral(U.id, em); } catch(x) {} }

  var evEl = document.getElementById('evEmail');
  if (evEl) evEl.textContent = em;
  showScr('otpScreen');
  document.getElementById('otpPhoneEntry').style.display = '';
  document.getElementById('otpCodeEntry').style.display = 'none';
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

// ═══════════════════════════════════════════ OTP

async function sendOtp() {
  var phoneInput = document.getElementById('otpPhoneInput').value.trim();
  if (!phoneInput) { alert('Please enter your phone number.'); return; }
  otpPhone = phoneInput;
  var btn = document.getElementById('otpSendBtn');
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    var r = await fetch(OTP_FN, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:otpPhone, action:'send'})});
    var d = await r.json();
    if (d.error) throw new Error(d.error);
    var masked = otpPhone.replace(/(\+?\d{2,3})\d+(\d{4})/, function(_,a,b){ return a+' ···· '+b; });
    document.getElementById('otpPhoneDisplay').textContent = masked;
    document.getElementById('otpPhoneEntry').style.display = 'none';
    document.getElementById('otpCodeEntry').style.display  = '';
    buildOtpBoxes();
    startResendTimer(42);
  } catch(e) { alert('Failed to send OTP: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Send Code →';
}

function buildOtpBoxes() {
  var row = document.getElementById('otpBoxes'); row.innerHTML = '';
  for (var i = 0; i < 6; i++) {
    (function(idx){
      var inp = document.createElement('input');
      inp.type = 'text'; inp.maxLength = 1; inp.inputMode = 'numeric';
      inp.className = 'otp-box'; inp.id = 'ob' + idx;
      inp.addEventListener('input', function(){
        if (inp.value) { inp.classList.add('filled'); if (idx < 5) document.getElementById('ob'+(idx+1)).focus(); }
        else inp.classList.remove('filled');
      });
      inp.addEventListener('keydown', function(e){
        if (e.key === 'Backspace' && !inp.value && idx > 0) document.getElementById('ob'+(idx-1)).focus();
      });
      row.appendChild(inp);
    })(i);
  }
  document.getElementById('ob0').focus();
}

function getOtpCode() {
  return Array.from({length:6}, function(_,i){ return (document.getElementById('ob'+i)||{}).value||''; }).join('');
}

async function verifyOtp() {
  var code  = getOtpCode();
  var errEl = document.getElementById('otpErr');
  errEl.style.display = 'none';
  if (code.length < 6) { errEl.textContent = 'Please enter all 6 digits.'; errEl.style.display = ''; return; }
  var btn = document.getElementById('otpVerifyBtn');
  btn.disabled = true; btn.textContent = 'Verifying...';
  try {
    var r = await fetch(OTP_FN, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:otpPhone, action:'verify', code:code})});
    var d = await r.json();
    if (d.error) throw new Error(d.error);
    if (U) { try { await sb.from('profiles').update({phone_verified:true, phone:otpPhone}).eq('id', U.id); } catch(x){} }
    if (resendInterval) clearInterval(resendInterval);
    if (typeof fbq !== 'undefined') fbq('track', 'CompleteRegistration');
    await loadP();
  } catch(e) { errEl.textContent = e.message; errEl.style.display = ''; }
  btn.disabled = false; btn.textContent = 'Verify & Continue';
}

function startResendTimer(seconds) {
  var s = seconds;
  var btn   = document.getElementById('resendBtn');
  var timer = document.getElementById('resendTimer');
  btn.disabled = true;
  resendInterval = setInterval(function(){
    s--;
    var m  = String(Math.floor(s/60)).padStart(2,'0');
    var sc = String(s%60).padStart(2,'0');
    timer.textContent = m+':'+sc;
    if (s <= 0) { clearInterval(resendInterval); btn.disabled = false; timer.textContent = ''; }
  }, 1000);
}

async function resendOtp() {
  try {
    var r = await fetch(OTP_FN, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({phone:otpPhone, action:'send'})});
    var d = await r.json();
    if (d.error) throw new Error(d.error);
    buildOtpBoxes(); startResendTimer(42);
  } catch(e) { alert('Failed to resend: ' + e.message); }
}

// ─── EMAIL VERIFICATION ──────────────────────────────────────────────────────
async function checkEmailVerified() {
  var errEl = document.getElementById('evErr');
  errEl.style.display = 'none';
  var r = await sb.auth.getUser();
  if (r.error || !r.data || !r.data.user) {
    errEl.textContent = 'Could not verify. Please try again.';
    errEl.style.display = 'block';
    return;
  }
  var user = r.data.user;
  if (!user.email_confirmed_at) {
    errEl.textContent = 'Email not yet verified. Please check your inbox and click the link, then tap the button again.';
    errEl.style.display = 'block';
    return;
  }
  U = user;
  try {
    fetch(SB_URL + '/functions/v1/smart-function', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: 'registered', full_name: user.user_metadata?.full_name || '', email: user.email})
    });
  } catch(x) {}
  showScr('otpScreen');
  document.getElementById('otpPhoneEntry').style.display = '';
  document.getElementById('otpCodeEntry').style.display = 'none';
}

async function resendVerifyEmail() {
  var errEl = document.getElementById('evErr');
  errEl.style.display = 'none';
  var btn = document.getElementById('evResendBtn');
  btn.disabled = true; btn.textContent = 'Sending...';
  try {
    var r = await sb.auth.resend({type:'signup', email: U ? U.email : ''});
    if (r.error) throw r.error;
    btn.textContent = 'Sent! Check your inbox.';
    setTimeout(function(){ btn.disabled = false; btn.textContent = 'Resend verification email'; }, 30000);
  } catch(e) {
    errEl.textContent = e.message || 'Failed to resend. Please try again.';
    errEl.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Resend verification email';
  }
}
