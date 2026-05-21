// Begin Forever — Profile v14b
// Fixes:
//   - Cancel button no longer shows "saving" — properly separated from save flow
//   - Save button disabled only during actual save, re-enabled on error
//   - Phone field hidden + verified badge shown when OTP verified in session
//   - Subscription status strip on profile hero
//   - Phone shows ✅ Verified badge in profile view
//   - All edit mode functions intact

// ═══════════════════════════════════════════ LOAD PROFILE
async function loadP() {
  if (!U) {
    try { var sessRes2 = await sb.auth.getUser(); if (sessRes2.data && sessRes2.data.user) U = sessRes2.data.user; } catch(x) {}
  }
  if (!U) { if (_justRegistered || _loadingProfile) return; showScr('loginScreen'); return; }

  var profileData = null;
  try {
    var r = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
    if (r.error) throw r.error;
    profileData = (r.data && r.data.length > 0) ? r.data[0] : null;
  } catch(x) { if (!_justRegistered && !_loadingProfile) showScr('loginScreen'); return; }

  P = profileData;
  if (!P) { showScr('setupScreen'); step = 1; updUI(); return; }
  if (P.status === 'pending')      { showScr('pendingScreen'); return; }
  if (P.status === 'rejected')     { renderRejectedScreen(P); showScr('rejectedScreen'); return; }
  if (P.status === 'resubmitting') { prefillSetupWizard(P); showScr('setupScreen'); step = 1; updUI(); return; }
  if (P.status === 'deleted') {
    alert('This account has been deleted. Please register again.');
    await sb.auth.signOut(); U = null; P = null; showScr('loginScreen'); return;
  }
  if (P.status === 'deactivated') {
    if (confirm('Your account is deactivated. Reactivate now?')) {
      try { await sb.from('profiles').update({ status: 'approved', deactivated_at: null }).eq('id', U.id); P.status = 'approved'; }
      catch(x) { alert('Could not reactivate.'); await sb.auth.signOut(); U = null; P = null; showScr('loginScreen'); return; }
    } else { await sb.auth.signOut(); U = null; P = null; showScr('loginScreen'); return; }
  }

  try { fpBrowse  = P.faith_browse  ? JSON.parse(P.faith_browse)  : FAITHS.map(function(f) { return f.key; }); } catch(x) { fpBrowse  = FAITHS.map(function(f) { return f.key; }); }
  try { fpReceive = P.faith_receive ? JSON.parse(P.faith_receive) : FAITHS.map(function(f) { return f.key; }); } catch(x) { fpReceive = FAITHS.map(function(f) { return f.key; }); }

  if (P.is_admin) {
    var bar = document.getElementById('tBar');
    if (bar && !document.getElementById('adTab')) {
      var ab = document.createElement('button');
      ab.className = 'tab-btn'; ab.id = 'adTab'; ab.onclick = function() { goTab('admin'); };
      ab.innerHTML = '<span class="tab-icon">⚙️</span><span class="tab-label">Admin</span>';
      bar.appendChild(ab);
    }
  }

  try { if (typeof checkAndExpireSubscription === 'function') await checkAndExpireSubscription(); } catch(x) {}
  try { if (typeof activateFoundingPremium === 'function') await activateFoundingPremium(); } catch(x) {}
  if (typeof needsOnboarding === 'function' && needsOnboarding()) { startOnboarding(); return; }

  showScr('mainApp');
  // Post-approval prompt: if key profile fields are missing, go to profile tab with prompt
  if (P && P.status === 'approved' && P.onboarding_completed === true) {
    var _needsProfileFill = !P.bio || !P.looking_for_intent || !P.hobbies || P.hobbies === '[]';
    if (_needsProfileFill && !sessionStorage.getItem('bf_profile_prompted')) {
      sessionStorage.setItem('bf_profile_prompted', '1');
      goTab('home');
      setTimeout(function() {
        var toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#3B0764;border:1px solid rgba(212,160,23,.4);color:#F5C842;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:700;z-index:9999;text-align:center;max-width:320px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.4);';
        toast.innerHTML = '✨ Complete your profile to get better matches!<br/><button onclick="goTab('profile');openEdit();this.closest('div').remove();" style="margin-top:8px;background:#F5C842;color:#3B0764;border:none;border-radius:8px;padding:6px 16px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;">Complete Now →</button><button onclick="this.closest('div').remove();" style="margin-top:8px;margin-left:8px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-family:Nunito,sans-serif;font-size:11px;">Later</button>';
        document.body.appendChild(toast);
      }, 1500);
      checkNotifs();
      return;
    }
  }
  goTab('home'); checkNotifs();
}

// ═══════════════════════════════════════════ PREMIUM CHECK (fallback — subscription.js is authoritative)
function isPremiumUser() {
  if (!P) return false;
  if (P.is_admin) return true;
  var now = new Date();
  if (P.subscription_expires_at) {
    var exp = new Date(P.subscription_expires_at);
    if (exp > now && (P.is_premium === true || P.subscription_status === 'active')) return true;
  }
  try {
    if (P.is_founding_member) {
      var lp7 = new Date(LAUNCH.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (now >= LAUNCH && now < lp7) return true;
    }
  } catch(x) {}
  return false;
}

// ═══════════════════════════════════════════ SETUP WIZARD
function toggleDenom() {
  var r = document.getElementById('fReligion').value;
  var denoms = DENOM_MAP[r] || [];
  var dg = document.getElementById('denomGroup'), dd = document.getElementById('fDenom');
  if (denoms.length > 0) {
    dg.style.display = '';
    dd.innerHTML = '<option value="">Select denomination</option>' + denoms.map(function(d) { return '<option>' + d + '</option>'; }).join('');
  } else { dg.style.display = 'none'; }
}

function filterPrefDenoms() {
  var rel = document.getElementById('fPR'), den = document.getElementById('fPD');
  if (!rel || !den) return;
  var map = {
    Christian: ['Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','Orthodox','Mar Thoma','Brethren','Lutheran','Anglican','Non-Denom'],
    Hindu: ['Shaivism','Vaishnavism','Shaktism','ISKCON','Arya Samaj'],
    Muslim: ['Sunni','Shia','Sufi','Ahmadiyya','Ismaili'],
    Sikh: ['Amritdhari','Sahajdhari','Nanakpanthi'],
    Jain: ['Digambara','Shvetambara'],
    Buddhist: ['Theravada','Mahayana','Vajrayana','Zen'],
    Jewish: ['Orthodox','Conservative','Reform'],
    Parsi: ['Zoroastrian'], Any: ['Any Denomination']
  };
  var options = map[rel.value] || ['Any Denomination'];
  den.innerHTML = options.map(function(o) { return '<option value="' + o + '">' + o + '</option>'; }).join('');
}

function fillC() {
  var s = document.getElementById('fState').value, c = document.getElementById('fCity');
  c.innerHTML = '<option value="">Select city</option>';
  (CT[s] || []).forEach(function(v) { c.innerHTML += '<option>' + v + '</option>'; });
}

function initPG() {
  var g = document.getElementById('photoGrid'); if (!g) return; g.innerHTML = '';
  for (var i = 0; i < 5; i++) {
    g.innerHTML += '<div class="photo-slot" id="ps' + i + '" onclick="document.getElementById(\'pi' + i + '\').click()">' +
      '<span style="font-size:15px;opacity:.4">📷</span>' +
      '<span style="font-size:9px;color:var(--w40)">' + (i === 0 ? 'Main*' : '#' + (i + 1)) + '</span>' +
      '<input type="file" accept="image/*" id="pi' + i + '" style="display:none" onchange="pickP(' + i + ',this)"/></div>';
  }
}

function pickP(i, inp) {
  var f = inp.files[0]; if (!f) return;
  photos[i] = f;
  var s = document.getElementById('ps' + i);
  s.style.backgroundImage = 'url(' + URL.createObjectURL(f) + ')';
  s.style.borderColor = 'var(--gold)'; s.style.borderStyle = 'solid';
  s.innerHTML = '<input type="file" accept="image/*" id="pi' + i + '" style="display:none" onchange="pickP(' + i + ',this)"/>';
}

function pickId(inp) {
  var f = inp.files[0]; if (!f || f.size > 5 * 1024 * 1024) { alert('Max 5MB'); return; }
  idFile = f;
  document.getElementById('idSlot').innerHTML =
    '<span style="font-size:28px">✅</span><br/><span style="font-size:11px;color:var(--gold2)">ID uploaded</span>' +
    '<input type="file" accept="image/*,.pdf" id="idInp" style="display:none" onchange="pickId(this)"/>';
  var idN = document.getElementById('idN'); if (idN) { idN.textContent = '📄 ' + f.name; idN.style.display = ''; }
}

function updUI() {
  var titles = ['Personal Details', 'About You', 'Photos', 'Government ID', 'Match Preferences'];
  var st = document.getElementById('sTitle'); if (st) st.textContent = titles[step - 1];
  var sl = document.getElementById('sLabel'); if (sl) sl.textContent = 'Step ' + step + ' of 5';
  document.querySelectorAll('#sDots .step-dot').forEach(function(d, i) { d.classList.toggle('active', i < step); });
  for (var i = 1; i <= 5; i++) { var el = document.getElementById('s' + i); if (el) el.style.display = (i === step) ? '' : 'none'; }
  var bk = document.getElementById('bkBtn'); if (bk) bk.style.display = step > 1 ? '' : 'none';
  var nx = document.getElementById('nxBtn'); if (nx) nx.textContent = step < 5 ? 'Next →' : 'Submit for Review ✦';
  var se = document.getElementById('sErr'); if (se) se.style.display = 'none';
  if (step === 3) initPG();

  // Step 5: init religion multi-select chips
  if (step === 5) {
    setTimeout(function() {
      var chipsEl = document.getElementById('fPRChips');
      if (!chipsEl) return;
      var ALL_REL = ['Christian','Hindu','Muslim','Sikh','Jain','Buddhist','Parsi','Jewish','Spiritual','Other'];
      if (typeof _setupPrefReligions === 'undefined') window._setupPrefReligions = [];
      chipsEl.innerHTML = '';
      ALL_REL.forEach(function(r) {
        var on = _setupPrefReligions.indexOf(r) > -1;
        var btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = r;
        btn.style.cssText = 'padding:8px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;font-family:Nunito,sans-serif;border:1px solid '+(on?'var(--gold)':'rgba(255,255,255,.2)')+';background:'+(on?'rgba(212,160,23,.2)':'rgba(255,255,255,.05)')+';color:'+(on?'#F5C842':'rgba(255,255,255,.6)')+';margin-bottom:4px;transition:all .15s;';
        btn.onclick = function() {
          var ix = _setupPrefReligions.indexOf(r);
          if (ix > -1) _setupPrefReligions.splice(ix,1); else _setupPrefReligions.push(r);
          // Update hidden input
          var fpr = document.getElementById('fPR');
          if (fpr) fpr.value = _setupPrefReligions.length ? _setupPrefReligions[0] : 'Any';
          var parent = this.closest ? this.closest('[id]') : chipsEl;
          // Re-render
          if (chipsEl) chipsEl.querySelectorAll('button').forEach(function(b){
            var sel = _setupPrefReligions.indexOf(b.textContent) > -1;
            b.style.borderColor = sel ? 'var(--gold)' : 'rgba(255,255,255,.2)';
            b.style.background  = sel ? 'rgba(212,160,23,.2)' : 'rgba(255,255,255,.05)';
            b.style.color       = sel ? '#F5C842' : 'rgba(255,255,255,.6)';
          });
        };
        chipsEl.appendChild(btn);
      });
    }, 50);
  }

  // Step 1: hide phone if already OTP-verified this session
  if (step === 1) {
    var verifiedPhone = '';
    try { verifiedPhone = sessionStorage.getItem('bf_verified_phone') || ''; } catch(x) {}
    if (verifiedPhone) {
      setTimeout(function() {
        var phoneGroup = document.getElementById('fPhoneGroup');
        if (phoneGroup) {
          phoneGroup.style.display = 'none';
          var existing = document.getElementById('phoneVerifiedBadge');
          if (!existing) {
            var badge = document.createElement('div');
            badge.id = 'phoneVerifiedBadge';
            badge.style.cssText = 'background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;';
            badge.innerHTML = '<span style="font-size:18px;">✅</span><div><p style="font-size:12px;font-weight:700;color:#4ade80;margin:0;">Phone Verified</p><p style="font-size:11px;color:rgba(255,255,255,.5);margin:0;">' + verifiedPhone + '</p></div>';
            phoneGroup.parentNode.insertBefore(badge, phoneGroup);
          }
        }
      }, 50);
    }
  }
}

function goBack() { if (step > 1) { step--; updUI(); } }

async function goNext() {
  var e = document.getElementById('sErr'); if (e) e.style.display = 'none';
  if (step === 1) {
    var verifiedPhone = ''; try { verifiedPhone = sessionStorage.getItem('bf_verified_phone') || ''; } catch(x) {}
    var phoneVal = verifiedPhone || (document.getElementById('fPhone') ? document.getElementById('fPhone').value.trim() : '');
    if (!document.getElementById('fName').value.trim() || !document.getElementById('fAge').value ||
        !document.getElementById('fGender').value || !document.getElementById('fReligion').value ||
        !document.getElementById('fState').value || !document.getElementById('fCity').value || !phoneVal) {
      if (e) { e.textContent = 'Please fill all required fields.'; e.style.display = 'block'; } return;
    }
    step++; updUI(); return;
  }
  if (step === 2) { step++; updUI(); return; }
  if (step === 3) {
    if (!photos[0]) { if (e) { e.textContent = 'Primary photo is required.'; e.style.display = 'block'; } return; }
    step++; updUI(); return;
  }
  if (step === 4) {
    if (!document.getElementById('fIdT').value || !idFile) {
      if (e) { e.textContent = 'ID type and upload are required.'; e.style.display = 'block'; } return;
    }
    step++; updUI(); return;
  }

  var btn = document.getElementById('nxBtn');
  btn.disabled = true;
  btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--gold2);border-radius:50%;animation:spin .6s linear infinite;margin:0 auto;"></div>';

  if (!U) {
    try {
      var sessRes = await sb.auth.getUser();
      if (sessRes.data && sessRes.data.user) U = sessRes.data.user;
      else { if (e) { e.textContent = 'Session expired.'; e.style.display = 'block'; } btn.disabled = false; btn.textContent = 'Submit for Review ✦'; return; }
    } catch(x) { if (e) { e.textContent = 'Session error.'; e.style.display = 'block'; } btn.disabled = false; btn.textContent = 'Submit for Review ✦'; return; }
  }

  var verifiedPhone = ''; try { verifiedPhone = sessionStorage.getItem('bf_verified_phone') || ''; } catch(x) {}
  var phoneVal = verifiedPhone || (document.getElementById('fPhone') ? document.getElementById('fPhone').value.trim() : '');

  try {
    var urls = ['', '', '', '', ''];
    for (var i = 0; i < 5; i++) {
      if (photos[i]) {
        var ext = photos[i].name.split('.').pop();
        var path = U.id + '/p' + i + '_' + Date.now() + '.' + ext;
        var r = await sb.storage.from('profile-photos').upload(path, photos[i], { upsert: true });
        if (!r.error) urls[i] = sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
      }
    }
    var idUrl = '';
    if (idFile) {
      var ext2 = idFile.name.split('.').pop();
      var idP = U.id + '/id_' + Date.now() + '.' + ext2;
      try {
        var r2 = await sb.storage.from('id-proofs').upload(idP, idFile, { upsert: true });
        if (!r2.error) idUrl = sb.storage.from('id-proofs').getPublicUrl(idP).data.publicUrl;
      } catch(x) {
        try {
          var r3 = await sb.storage.from('profile-photos').upload(idP, idFile, { upsert: true });
          if (!r3.error) idUrl = sb.storage.from('profile-photos').getPublicUrl(idP).data.publicUrl;
        } catch(y) {}
      }
    }

    var FOUNDER_CAP = 300;
    var apprRes = await sb.from('profiles').select('id', { count: 'exact', head: true }).eq('is_founding_member', true).eq('status', 'approved');
    var apprCount = apprRes.count || 0;
    var allCountRes = await sb.from('profiles').select('id', { count: 'exact', head: true });
    var foundingNum = (allCountRes.count || 0) + 1;
    var qualifiesAsFounder = apprCount < FOUNDER_CAP;
    var allFaithKeys = JSON.stringify(FAITHS.map(function(f) { return f.key; }));
    var isResubmit = P && P.status === 'resubmitting';

    var pd = {
      id: U.id, email: U.email,
      full_name: document.getElementById('fName').value.trim(),
      age: parseInt(document.getElementById('fAge').value),
      gender: document.getElementById('fGender').value,
      religion: document.getElementById('fReligion').value,
      denomination: document.getElementById('fDenom').value || null,
      city: document.getElementById('fCity').value,
      state: document.getElementById('fState').value,
      phone: phoneVal, phone_verified: verifiedPhone ? true : false,
      registered_by: document.getElementById('fRegFor').value,
      profile_for: document.getElementById('fRegFor').value,
      education: document.getElementById('fEdu').value.trim(),
      occupation: document.getElementById('fOcc').value.trim(),
      height_cm: document.getElementById('fHt').value ? parseInt(document.getElementById('fHt').value) : null,
      mother_tongue: document.getElementById('fMT').value.trim(),
      marital_status: document.getElementById('fMS').value,
      photo_url: urls[0], photo_2_url: urls[1], photo_3_url: urls[2], photo_4_url: urls[3], photo_5_url: urls[4],
      id_proof_type: document.getElementById('fIdT').value,
      id_proof_url: idUrl,
      pref_age_min: parseInt(document.getElementById('fPMin').value) || 18,
      pref_age_max: parseInt(document.getElementById('fPMax').value) || 70,
      pref_religion: (_setupPrefReligions && _setupPrefReligions.length) ? _setupPrefReligions[0] : 'Any',
      pref_religions: JSON.stringify(typeof _setupPrefReligions !== 'undefined' && _setupPrefReligions.length ? _setupPrefReligions : ['Any']),
      pref_denomination: document.getElementById('fPD').value || 'Any',
      pref_city: document.getElementById('fPC').value.trim() || 'Any',
      faith_browse: P && P.faith_browse ? P.faith_browse : allFaithKeys,
      faith_receive: P && P.faith_receive ? P.faith_receive : allFaithKeys,
      founding_number: isResubmit ? undefined : foundingNum,
      is_founding_member: isResubmit ? undefined : qualifiesAsFounder,
      referred_by: isResubmit ? undefined : (getReferrerId() || null),
      onboarding_completed: false, status: 'pending'
    };
    Object.keys(pd).forEach(function(k) { if (pd[k] === undefined) delete pd[k]; });

    var res = await sb.from('profiles').upsert(pd, { onConflict: 'id' });
    if (res.error) throw res.error;

    try {
      fetch(SB_URL + '/functions/v1/smart-function', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isResubmit ? 'resubmitted' : 'pending',
          full_name: pd.full_name, email: pd.email, phone: pd.phone,
          city: pd.city, state: pd.state, religion: pd.religion,
          denomination: pd.denomination || pd.religion, gender: pd.gender,
          founding_number: foundingNum
        })
      });
    } catch(x) {}

    P = pd;
    if (!isResubmit) clearReferrerId();
    if (!isResubmit && typeof fbq !== 'undefined') fbq('track', 'CompleteRegistration');
    showScr('pendingScreen');
  } catch(ex) {
    if (e) { e.textContent = ex.message || 'Error. Please try again.'; e.style.display = 'block'; }
    btn.disabled = false; btn.textContent = 'Submit for Review ✦';
  }
}

// ═══════════════════════════════════════════ PROFILE VIEW
function renP() {
  if (!P) return;
  if (_editMode) { renPEditMode(); return; }

  var f = faithByKey(P.religion || 'Other');
  var ap = [P.photo_url, P.photo_2_url, P.photo_3_url, P.photo_4_url, P.photo_5_url].filter(Boolean);
  var ph = ap[0] ? 'background-image:url(' + ap[0] + ');background-size:cover;background-position:center' : '';
  var heroEl = document.getElementById('profileHero');
  if (heroEl) heroEl.innerHTML =
    '<div style="width:80px;height:80px;border-radius:50%;margin:0 auto;border:2px solid ' + f.color + ';' + ph + ';background-color:var(--dark3);display:flex;align-items:center;justify-content:center;">' + (ap[0] ? '' : '<span style="font-size:32px;opacity:.3">👤</span>') + '</div>' +
    '<h2 style="font-family:Cinzel,serif;font-size:20px;margin-top:10px;color:#fff;">' + P.full_name + '</h2>' +
    '<p style="color:' + f.color + ';font-size:12px;margin-top:3px;">' + f.icon + ' ' + (P.denomination ? P.denomination + ' · ' : '') + P.religion + '</p>' +
    '<p style="color:var(--w50);font-size:11px;margin-top:2px;">' + P.city + ', ' + P.state + '</p>' +
    '<span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:' + (P.status === 'approved' ? 'var(--green)' : 'var(--gold)') + ';color:' + (P.status === 'approved' ? '#fff' : '#1A0830') + ';">' + (P.status === 'approved' ? '✅ Verified Member' : '⏳ Pending Review') + '</span>' +
    (P.founding_number ? '<p style="font-size:10px;color:var(--gold);margin-top:6px;">✦ Founding Member #' + P.founding_number + '</p>' : '');

  // Subscription strip
  var subStrip = '';
  if (isPremiumUser()) {
    var expStr = P.subscription_expires_at ? ' · Expires ' + new Date(P.subscription_expires_at).toLocaleDateString('en-IN') : '';
    subStrip = '<div style="background:rgba(212,160,23,.1);border:1px solid rgba(212,160,23,.3);border-radius:10px;padding:8px 12px;margin-top:10px;text-align:center;"><p style="font-size:11px;color:#F5C842;font-weight:700;margin:0;">✦ Premium Active' + expStr + '</p></div>';
  } else if (P.subscription_expires_at && new Date(P.subscription_expires_at) < new Date()) {
    subStrip = '<div style="background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.25);border-radius:10px;padding:8px 12px;margin-top:10px;text-align:center;"><p style="font-size:11px;color:#ff6b6b;font-weight:700;margin:0;">Subscription expired · <span onclick="showSub()" style="text-decoration:underline;cursor:pointer;">Renew</span></p></div>';
  }
  if (subStrip && heroEl) heroEl.innerHTML += subStrip;

  var h = '';
  var rows = [
    { l: 'Profile For', v: P.profile_for || P.registered_by },
    { l: 'Age', v: P.age },
    { l: 'Height', v: P.height_cm ? P.height_cm + ' cm (' + cmToFtIn(P.height_cm) + ')' : '' },
    { l: 'Email', v: P.email ? P.email.replace(/(.{2}).+(@.+)/, '$1***$2') : '' },
    { l: 'Phone', v: P.phone ? (P.phone.replace(/(\d{2})\d+(\d{2})/, '$1*****$2') + (P.phone_verified ? ' <span style="background:rgba(39,174,96,.2);color:#4ade80;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;border:1px solid rgba(39,174,96,.4);">✅ Verified</span>' : '')) : '' },
    { l: 'Religion', v: P.religion },
    { l: 'Denomination', v: P.denomination },
    { l: 'Education', v: P.education },
    { l: 'Occupation', v: P.occupation },
    { l: 'Mother Tongue', v: P.mother_tongue },
    { l: 'Marital Status', v: P.marital_status }
  ];
  rows.forEach(function(d) {
    if (d.v) h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--w05);">' +
      '<span style="font-size:10px;color:var(--w50);text-transform:uppercase;letter-spacing:.5px;">' + d.l + '</span>' +
      '<span style="font-size:13px;color:var(--w80);font-weight:600;text-align:right;">' + d.v + '</span></div>';
  });
  if (P.bio) h += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--w08);"><p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">About Me</p><p style="font-size:13px;color:var(--w70);line-height:1.7;">' + P.bio + '</p></div>';
  var mi = document.getElementById('mInfo'); if (mi) mi.innerHTML = h;

  // Hobbies
  var hobbies = []; try { hobbies = JSON.parse(P.hobbies || '[]'); } catch(e) {}
  var hobEl = document.getElementById('profileHobbies');
  if (hobEl) {
    if (hobbies.length) {
      hobEl.style.display = '';
      var hp = document.getElementById('hobbyPills');
      if (hp) hp.innerHTML = hobbies.map(function(h2) {
        return '<span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(212,160,23,.35);background:rgba(212,160,23,.1);color:#F5C842;margin:2px;">' + h2 + '</span>';
      }).join('');
    } else hobEl.style.display = 'none';
  }

  var lfEl = document.getElementById('profileLookingFor');
  if (lfEl) {
    if (P.looking_for) { lfEl.style.display = ''; var lft = document.getElementById('lookingForText'); if (lft) lft.textContent = P.looking_for; }
    else lfEl.style.display = 'none';
  }

  var fbEl = document.getElementById('profileFaithBeliefs');
  if (fbEl) {
    var frows = '';
    if (P.faith_importance) frows += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Faith Importance</span><span style="font-size:13px;color:var(--w80);font-weight:600;">' + P.faith_importance + '</span></div>';
    if (P.home_church) frows += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Place of Worship</span><span style="font-size:13px;color:var(--w80);font-weight:600;">' + P.home_church + '</span></div>';
    if (P.scripture) frows += '<div style="margin-top:8px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--gold);border-left:3px solid var(--gold);padding-left:10px;">"' + P.scripture + '"</div>';
    fbEl.style.display = frows ? '' : 'none';
    var fbc = document.getElementById('faithBeliefsContent'); if (fbc) fbc.innerHTML = frows;
  }

  var lsEl = document.getElementById('profileLifestyle');
  if (lsEl) {
    var lrows = '';
    if (P.diet) lrows += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Diet</span><span style="font-size:13px;color:var(--w80);font-weight:600;">' + P.diet + '</span></div>';
    if (P.smoking) lrows += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Smoking</span><span style="font-size:13px;color:var(--w80);font-weight:600;">' + P.smoking + '</span></div>';
    if (P.drinking) lrows += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Drinking</span><span style="font-size:13px;color:var(--w80);font-weight:600;">' + P.drinking + '</span></div>';
    lsEl.style.display = lrows ? '' : 'none';
    var lsc = document.getElementById('lifestyleContent'); if (lsc) lsc.innerHTML = lrows;
  }

  var pvb = document.getElementById('privacyBadge');
  if (pvb) pvb.textContent =
    'Photos: ' + (P.photos_visible_to === 'all' ? 'Everyone' : P.photos_visible_to === 'interests_only' ? 'Interests only' : 'Hidden') +
    ' · Contact: ' + (P.contact_visible_to === 'premium' ? 'Premium members' : P.contact_visible_to === 'interests_only' ? 'Interests only' : 'Hidden');

  renderFaithPrefCard();
  loadStats();
  if (typeof renderReferralCard === 'function') renderReferralCard();
}

// ═══ FAITH PREF CARD
function renderFaithPrefCard() {
  var el = document.getElementById('profileFaithSummary'); if (!el) return;
  var premium = isPremiumUser();
  var lockBadge = premium ? '' : '<span style="background:#F5C842;color:#3B0764;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px;margin-left:6px;letter-spacing:.5px;">✦ PREMIUM</span>';
  var editBtn = premium
    ? '<button onclick="openFaithPrefs()" style="background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.3);color:var(--gold2);font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;">Edit ✦</button>'
    : '<button onclick="showSubModal(\'Faith filter\')" style="background:rgba(245,200,66,.12);border:1px solid rgba(245,200,66,.4);color:#F5C842;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;">🔒 Unlock</button>';
  el.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
      '<div><p style="font-size:13px;font-weight:700;color:#fff;margin:0;">Faith Preferences' + lockBadge + '</p>' +
      '<p style="font-size:11px;color:var(--w40);margin:3px 0 0;">Who you see &amp; who can reach you</p></div>' + editBtn + '</div>' +
    '<div style="' + (premium ? '' : 'opacity:.45;filter:grayscale(.4);') + '">' +
      '<div style="margin-bottom:10px;"><p style="font-size:9px;font-weight:700;color:var(--w40);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">🔍 Browsing profiles from</p><div id="fpBrowsePills" style="display:flex;flex-wrap:wrap;gap:5px;"></div></div>' +
      '<div><p style="font-size:9px;font-weight:700;color:var(--w40);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">💌 Receiving interest from</p><div id="fpReceivePills" style="display:flex;flex-wrap:wrap;gap:5px;"></div></div>' +
    '</div>';
  renderFpPills('fpBrowsePills', fpBrowse);
  renderFpPills('fpReceivePills', fpReceive);
}

function renderFpPills(containerId, arr) {
  var el = document.getElementById(containerId); if (!el) return;
  if (arr.length === FAITHS.length) { el.innerHTML = '<span style="font-size:12px;color:var(--w50);font-style:italic;">All faiths</span>'; return; }
  if (arr.length === 0) { el.innerHTML = '<span style="font-size:12px;color:#ff6b6b;font-style:italic;">None selected</span>'; return; }
  el.innerHTML = arr.map(function(k) {
    var f = faithByKey(k);
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid ' + f.color + ';background:' + f.bg + ';color:' + f.color + ';">' + f.icon + ' ' + k + '</span>';
  }).join('');
}

// ═══ FAITH PREFS MODAL
var fpBrowseDenoms = [], fpReceiveDenoms = [];
var FP_DENOM_MAP = {
  Christian: ['Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','SDA','Orthodox','Mar Thoma','Brethren','Lutheran','Anglican','Non-Denom'],
  Hindu: ['Shaivism','Vaishnavism','Shaktism','ISKCON','Arya Samaj'],
  Muslim: ['Sunni','Shia','Sufi','Ahmadiyya','Ismaili'],
  Sikh: ['Amritdhari','Sahajdhari','Nanakpanthi'],
  Jain: ['Digambara','Shvetambara'],
  Buddhist: ['Theravada','Mahayana','Vajrayana','Zen'],
  Jewish: ['Orthodox','Conservative','Reform']
};

function openFaithPrefs() {
  if (!isPreLaunch() && !isPremiumUser()) { if (typeof showSubModal === 'function') showSubModal('Faith filter'); return; }
  var f = faithByKey(P && P.religion ? P.religion : 'Other');
  var iconEl = document.getElementById('fpMyFaithIcon'), nameEl = document.getElementById('fpMyFaithName'), denomEl = document.getElementById('fpMyFaithDenom');
  if (iconEl) iconEl.textContent = f.icon || '🌐';
  if (nameEl) nameEl.textContent = (P && P.religion) || 'Not set';
  if (denomEl) denomEl.textContent = (P && P.denomination) || '';
  var savedBrowse = []; try { savedBrowse = JSON.parse((P && P.faith_browse) || '[]'); } catch(e) {}
  var bRel = (savedBrowse.length === 1) ? savedBrowse[0] : 'all';
  var bRelSel = document.getElementById('fpBrowseReligion'); if (bRelSel) bRelSel.value = bRel;
  fpBrowseDenoms = []; _buildFpChips('browse', bRel, fpBrowseDenoms);
  var savedReceive = []; try { savedReceive = JSON.parse((P && P.faith_receive) || '[]'); } catch(e) {}
  var rRel = (savedReceive.length === 1) ? savedReceive[0] : 'all';
  var rRelSel = document.getElementById('fpReceiveReligion'); if (rRelSel) rRelSel.value = rRel;
  fpReceiveDenoms = []; _buildFpChips('receive', rRel, fpReceiveDenoms);
  var m = document.getElementById('faithModal'); if (m) m.classList.add('show');
}
function closeFaithPrefs() { var m = document.getElementById('faithModal'); if (m) m.classList.remove('show'); }

function fpSyncDenom(type) {
  var rel = document.getElementById(type === 'browse' ? 'fpBrowseReligion' : 'fpReceiveReligion').value;
  if (type === 'browse') fpBrowseDenoms = []; else fpReceiveDenoms = [];
  _buildFpChips(type, rel, []);
}

function _buildFpChips(type, religion, selectedDenoms) {
  var wrapId = type === 'browse' ? 'fpBrowseDenomWrap' : 'fpReceiveDenomWrap';
  var contId = type === 'browse' ? 'fpBrowseChips' : 'fpReceiveChips';
  var wrap = document.getElementById(wrapId), cont = document.getElementById(contId);
  if (!wrap || !cont) return;
  var list = FP_DENOM_MAP[religion] || [];
  if (!list.length || religion === 'all') { wrap.style.display = 'none'; cont.innerHTML = ''; return; }
  wrap.style.display = ''; cont.innerHTML = '';
  var state = type === 'browse' ? fpBrowseDenoms : fpReceiveDenoms;
  list.forEach(function(d) {
    var on = state.indexOf(d) > -1;
    var chip = document.createElement('button');
    chip.type = 'button'; chip.textContent = d;
    chip.style.cssText = 'padding:5px 10px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;transition:all .15s;margin-bottom:4px;border:1px solid ' + (on ? '#9B59B6' : 'rgba(255,255,255,.18)') + ';background:' + (on ? 'rgba(155,89,182,.3)' : 'rgba(255,255,255,.05)') + ';color:' + (on ? '#C39BD3' : 'rgba(255,255,255,.5)') + ';';
    chip.onclick = function() { var ix = state.indexOf(d); if (ix > -1) state.splice(ix, 1); else state.push(d); _buildFpChips(type, religion, state); };
    cont.appendChild(chip);
  });
}

async function saveFaithPrefs() {
  var bRel = document.getElementById('fpBrowseReligion').value;
  var rRel = document.getElementById('fpReceiveReligion').value;
  var allFaiths = ['Christian','Hindu','Muslim','Sikh','Jain','Buddhist','Parsi','Jewish','Spiritual','Other'];
  var fpBrowseNew = bRel === 'all' ? allFaiths : [bRel];
  var fpReceiveNew = rRel === 'all' ? allFaiths : [rRel];
  var btn = document.getElementById('fpSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    await sb.from('profiles').update({ faith_browse: JSON.stringify(fpBrowseNew), faith_receive: JSON.stringify(fpReceiveNew) }).eq('id', U.id);
    if (P) { P.faith_browse = JSON.stringify(fpBrowseNew); P.faith_receive = JSON.stringify(fpReceiveNew); }
    fpBrowse = fpBrowseNew; fpReceive = fpReceiveNew;
    closeFaithPrefs();
    if (typeof renderFaithPrefCard === 'function') renderFaithPrefCard();
  } catch(x) { alert('Could not save preferences.'); }
  if (btn) { btn.disabled = false; btn.textContent = 'Save Preferences ✦'; }
}

// ═══════════════════════════════════════════ EDIT MODE
// _editMode flag controls renP() rendering
// openEdit() → sets flag, calls renP() → renders inline edit form
// closeEditInline() → clears flag, calls renP() → back to view mode  ← FIX: was wired to modal
// saveEditInline() → saves, then clears flag and re-renders
var _editMode = false;
var _editHobbies = [], _editAgeRanges = [], _editMaritalStatuses = [];
var editPhotos = [null, null, null, null, null];

function openEdit() {
  _editMode = true;
  try { _editHobbies = JSON.parse(P.hobbies || '[]'); } catch(x) { _editHobbies = []; }
  try { _editAgeRanges = JSON.parse(P.pref_age_ranges || '[]'); } catch(x) { _editAgeRanges = []; }
  try { _editMaritalStatuses = JSON.parse(P.pref_marital_statuses || '[]'); } catch(x) { _editMaritalStatuses = []; }
  editPhotos = [null, null, null, null, null];
  renP();
  setTimeout(function() { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 100);
}

// ── FIX: Cancel cleanly exits edit mode without triggering save
function closeEditInline() {
  _editMode = false;
  renP();
}

// closeEdit() alias for any old modal references
function closeEdit() {
  var m = document.getElementById('editModal'); if (m) m.classList.remove('show');
  _editMode = false; renP();
}

async function saveEditInline() {
  // Get the save button immediately to control its state
  var btn = document.getElementById('eSaveBtn');

  // Guard: prevent double-click
  if (btn && btn.disabled) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  if (_editHobbies.length < 3) {
    alert('Please select at least 3 hobbies.');
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes ✦'; }
    return;
  }

  try {
    var upd = {
      bio:            (document.getElementById('e_bio')            || {}).value || P.bio,
      education:      (document.getElementById('e_edu')            || {}).value || P.education,
      occupation:     (document.getElementById('e_occ')            || {}).value || P.occupation,
      looking_for:    (document.getElementById('e_lookingForText') || {}).value || P.looking_for,
      diet:           (document.getElementById('e_diet')           || {}).value || null,
      smoking:        (document.getElementById('e_smoking')        || {}).value || null,
      drinking:       (document.getElementById('e_drinking')       || {}).value || null,
      home_church:    (document.getElementById('e_church')         || {}).value || null,
      faith_importance: (document.getElementById('e_faithImportance') || {}).value || null,
      scripture:      (document.getElementById('e_scripture')      || {}).value || null,
      hobbies:        JSON.stringify(_editHobbies),
      pref_city:      (document.getElementById('e_prefCity')       || {}).value || P.pref_city
    };

    // Upload any new photos
    for (var i = 0; i < 5; i++) {
      if (editPhotos[i]) {
        var ext = editPhotos[i].name.split('.').pop();
        var path = U.id + '/p' + i + '_' + Date.now() + '.' + ext;
        var r = await sb.storage.from('profile-photos').upload(path, editPhotos[i], { upsert: true });
        if (!r.error) {
          var url = sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
          var colMap = ['photo_url', 'photo_2_url', 'photo_3_url', 'photo_4_url', 'photo_5_url'];
          upd[colMap[i]] = url;
        }
      }
    }

    await sb.from('profiles').update(upd).eq('id', U.id);

    // Refresh local profile
    var r2 = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
    if (r2.data && r2.data.length) P = r2.data[0];

    // Reset button BEFORE re-rendering so it doesn't persist
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes ✦'; }
    _editMode = false;
    renP();
    // Brief success toast
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#27ae60;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:700;z-index:9999;';
    toast.textContent = '✅ Profile updated';
    document.body.appendChild(toast);
    setTimeout(function() { if (document.body.contains(toast)) document.body.removeChild(toast); }, 2500);
  } catch(ex) {
    alert('Could not save: ' + (ex.message || 'try again'));
    if (btn) { btn.disabled = false; btn.textContent = 'Save Changes ✦'; }
  }
}

// saveEdit() alias (modal used this)
async function saveEdit() { await saveEditInline(); }

// ═══ VIEW PROFILE MODAL
async function viewProfile(id) {
  try { await sb.from('profile_views').upsert({ viewer_id: U.id, viewed_id: id, viewed_at: new Date().toISOString() }, { onConflict: 'viewer_id,viewed_id' }); } catch(x) {}
  var r = await sb.from('profiles').select('*').eq('id', id).limit(1);
  if (!r.data || !r.data.length) return;
  var p = r.data[0], f = faithByKey(p.religion || 'Other');
  var ap = [p.photo_url, p.photo_2_url, p.photo_3_url, p.photo_4_url, p.photo_5_url].filter(Boolean);
  var premium = isPremiumUser();
  var h = '<div style="text-align:center;padding-top:8px">';
  if (ap.length) h += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">' +
    ap.map(function(u) { return '<div style="width:70px;height:70px;border-radius:12px;background-image:url(' + u + ');background-size:cover;background-position:center;border:2px solid ' + f.color + '"></div>'; }).join('') + '</div>';
  h += '<h2 style="font-family:Cinzel,serif;font-size:20px;color:#fff;">' + p.full_name + ', ' + p.age + '</h2>';
  h += '<p style="margin-top:4px;"><span style="color:' + f.color + '">' + f.icon + ' ' + p.religion + '</span>' + (p.denomination ? ' <span style="color:var(--w50);font-size:12px">· ' + p.denomination + '</span>' : '') + '</p>';
  h += '<p style="color:var(--w50);font-size:12px;margin-top:3px;">' + p.city + ', ' + p.state + '</p></div>';
  h += '<div style="background:var(--w05);border-radius:12px;padding:13px;margin-top:14px;">';
  [{ l: 'Bio', v: p.bio }, { l: 'Education', v: p.education }, { l: 'Occupation', v: p.occupation },
   { l: 'Mother Tongue', v: p.mother_tongue }, { l: 'Marital Status', v: p.marital_status },
   { l: 'Height', v: p.height_cm ? p.height_cm + ' cm (' + cmToFtIn(p.height_cm) + ')' : '' }].forEach(function(dd) {
    if (dd.v) h += '<div style="margin-bottom:9px;"><p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;">' + dd.l + '</p><p style="font-size:13px;margin-top:2px;color:var(--w80);">' + dd.v + '</p></div>';
  });
  h += '</div>';
  if (!isPreLaunch()) {
    if (premium && (p.phone || p.email)) {
      h += '<div style="background:rgba(212,160,23,.08);border:1px solid rgba(212,160,23,.25);border-radius:12px;padding:13px;margin-top:10px;">';
      h += '<p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">✦ Contact Details</p>';
      if (p.phone) h += '<p style="font-size:13px;color:#fff;margin:4px 0;">📱 ' + p.phone + (p.phone_verified ? ' <span style="font-size:9px;color:#4ade80;font-weight:700;">✅ Verified</span>' : '') + '</p>';
      if (p.email) h += '<p style="font-size:13px;color:#fff;margin:4px 0;">✉️ ' + p.email + '</p>';
      h += '</div>';
    } else if (!premium) {
      h += '<div onclick="event.stopPropagation();showSubModal(\'Contact reveal\')" style="background:rgba(245,200,66,.08);border:1px solid rgba(245,200,66,.3);border-radius:12px;padding:13px;margin-top:10px;cursor:pointer;text-align:center;">';
      h += '<p style="font-size:11px;color:#F5C842;font-weight:700;margin:0 0 4px;">🔒 ✦ PREMIUM</p>';
      h += '<p style="font-size:13px;color:#fff;margin:0;">Tap to unlock contact details</p></div>';
    }
  }
  h += '<div style="display:flex;gap:8px;padding:14px 4px 8px;">';
  h += '<button class="btn btn-dark" style="flex:1;font-size:12px;padding:10px;" onclick="event.stopPropagation();openReportModal(\'' + p.id + '\',\'' + (p.full_name || '').replace(/[\\\'\"]/g, '') + '\')">🚩 Report</button>';
  h += '<button class="btn btn-dark" style="flex:1;font-size:12px;padding:10px;color:#ff6b6b;" onclick="event.stopPropagation();openBlockModal(\'' + p.id + '\',\'' + (p.full_name || '').replace(/[\\\'\"]/g, '') + '\')">🚫 Block</button>';
  h += '</div>';
  document.getElementById('pmC').innerHTML = h;
  document.getElementById('profileModal').classList.add('show');
}
function closeModal() { document.getElementById('profileModal').classList.remove('show'); }

// ═══ REJECTED SCREEN
function renderRejectedScreen(profile) {
  var reason = profile.rejection_reason || 'Your profile did not meet our verification requirements.';
  var el = document.getElementById('rejectedContent'); if (!el) return;
  el.innerHTML = '<div style="font-size:48px;margin-bottom:16px;">😔</div>' +
    '<h2 style="font-family:\'Cinzel\',serif;font-size:22px;color:#ff6b6b;margin-bottom:12px;">Profile Not Approved</h2>' +
    '<div style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:14px;padding:16px;margin-bottom:20px;text-align:left;">' +
    '<p style="font-size:10px;font-weight:700;color:#ff6b6b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📋 Reason from our team</p>' +
    '<p style="font-size:13px;color:rgba(255,255,255,.8);line-height:1.7;">' + reason + '</p></div>' +
    '<button class="btn btn-gold" style="margin-bottom:12px;" onclick="startResubmit()">✦ Fix &amp; Resubmit Profile</button>' +
    '<button class="btn btn-dark" style="font-size:12px;opacity:.6;" onclick="doSignOut()">Sign Out</button>';
}

async function startResubmit() {
  if (!confirm('This will let you edit and resubmit your profile. Continue?')) return;
  try { await sb.from('profiles').update({ status: 'resubmitting', rejection_reason: null }).eq('id', U.id); }
  catch(x) { alert('Error.'); return; }
  var r = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
  P = r.data && r.data[0] ? r.data[0] : P;
  prefillSetupWizard(P); showScr('setupScreen'); step = 1; updUI();
}

function prefillSetupWizard(p) {
  setTimeout(function() {
    var fn = document.getElementById('fName'); if (fn) fn.value = p.full_name || '';
    var fa = document.getElementById('fAge'); if (fa) fa.value = p.age || '';
    var fg = document.getElementById('fGender'); if (fg) fg.value = p.gender || '';
    var fr = document.getElementById('fReligion');
    if (fr) { fr.value = p.religion || ''; toggleDenom(); setTimeout(function() { var fd = document.getElementById('fDenom'); if (fd && p.denomination) fd.value = p.denomination; }, 60); }
    var fst = document.getElementById('fState');
    if (fst) { fst.value = p.state || ''; fillC(); setTimeout(function() { var fc = document.getElementById('fCity'); if (fc && p.city) fc.value = p.city; }, 60); }
    var fe = document.getElementById('fEdu'); if (fe) fe.value = p.education || '';
    var fo = document.getElementById('fOcc'); if (fo) fo.value = p.occupation || '';
    var fht = document.getElementById('fHt'); if (fht) fht.value = p.height_cm || '';
    var fmt = document.getElementById('fMT'); if (fmt) fmt.value = p.mother_tongue || '';
    var fms = document.getElementById('fMS'); if (fms) fms.value = p.marital_status || 'Never Married';
    photos = [null, null, null, null, null]; idFile = null;
  }, 100);
}

// ═══ HOBBIES
var ALL_HOBBIES = ['Reading','Travel','Music','Movies','Cooking','Photography','Fitness','Yoga','Hiking','Cricket','Football','Badminton','Painting','Dancing','Singing','Gaming','Cycling','Swimming','Volunteering','Gardening','Crafts','Writing','Meditation','Fashion','Foodie','Cars','Tech','Startups'];

function pickEP(i, inp) {
  var f = inp.files[0]; if (!f) return;
  editPhotos[i] = f;
  var s = document.getElementById('eps' + i);
  if (s) { s.style.backgroundImage = 'url(' + URL.createObjectURL(f) + ')'; s.style.borderColor = 'var(--gold)'; s.style.borderStyle = 'solid'; s.innerHTML = '<input type="file" accept="image/*" id="epi' + i + '" style="display:none" onchange="pickEP(' + i + ',this)"/>'; }
}

function renderEditHobbyChips() {
  var c = document.getElementById('eHobbyChips'); if (!c) return; c.innerHTML = '';
  ALL_HOBBIES.forEach(function(h) {
    var on = _editHobbies.indexOf(h) > -1;
    var chip = document.createElement('button');
    chip.type = 'button'; chip.textContent = h;
    chip.style.cssText = 'padding:6px 11px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;margin:2px;border:1px solid ' + (on ? 'var(--gold)' : 'rgba(255,255,255,.18)') + ';background:' + (on ? 'rgba(212,160,23,.2)' : 'rgba(255,255,255,.05)') + ';color:' + (on ? '#F5C842' : 'rgba(255,255,255,.5)') + ';';
    chip.onclick = function() {
      var ix = _editHobbies.indexOf(h);
      if (ix > -1) _editHobbies.splice(ix, 1); else { if (_editHobbies.length < 12) _editHobbies.push(h); }
      renderEditHobbyChips();
      var ct = document.getElementById('eHobbyCount'); if (ct) ct.textContent = _editHobbies.length;
    };
    c.appendChild(chip);
  });
}

function updateEditReligionDenoms() {
  var r = document.getElementById('eReligion'); if (!r) return;
  var list = FP_DENOM_MAP[r.value] || [];
  var dg = document.getElementById('eDenomGroup'), dd = document.getElementById('eDenom'); if (!dg || !dd) return;
  if (list.length) { dg.style.display = ''; dd.innerHTML = '<option value="">Select denomination</option>' + list.map(function(d) { return '<option>' + d + '</option>'; }).join(''); if (P && P.denomination) dd.value = P.denomination; }
  else dg.style.display = 'none';
}

// ═══ PRIVACY
function openPrivacySettings() {
  var m = document.getElementById('privacyModal'); if (!m) return;
  var pv = document.getElementById('pvPhotos'); if (pv) pv.value = P.photos_visible_to || 'all';
  var pc = document.getElementById('pvContact'); if (pc) pc.value = P.contact_visible_to || 'premium';
  var pp = document.getElementById('pvProfile'); if (pp) pp.value = P.profile_visible_to || 'all';
  m.classList.add('show');
}
function closePrivacySettings() { var m = document.getElementById('privacyModal'); if (m) m.classList.remove('show'); }
async function savePrivacySettings() {
  var pv = document.getElementById('pvPhotos').value;
  var pc = document.getElementById('pvContact').value;
  var pp = document.getElementById('pvProfile').value;
  var btn = document.getElementById('pvSaveBtn'); if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    await sb.from('profiles').update({ photos_visible_to: pv, contact_visible_to: pc, profile_visible_to: pp }).eq('id', U.id);
    if (P) { P.photos_visible_to = pv; P.contact_visible_to = pc; P.profile_visible_to = pp; }
    closePrivacySettings(); renP();
  } catch(x) { alert('Could not save.'); }
  if (btn) { btn.disabled = false; btn.textContent = 'Save Privacy Settings'; }
}

// ═══════════════════════════════════════════ INLINE EDIT RENDERER
function renPEditMode() {
  var heroEl = document.getElementById('profileHero');
  if (heroEl) heroEl.innerHTML =
    '<p style="font-family:Cinzel,serif;font-size:18px;color:var(--gold-bright);">✏️ Edit Profile</p>' +
    '<p style="font-size:11px;color:var(--w50);margin-top:4px;">Update your details below.</p>';

  var mi = document.getElementById('mInfo'); if (!mi) return;

  function sel(curVal, opts) {
    return opts.map(function(o) { return '<option value="' + o + '"' + (curVal === o ? ' selected' : '') + '>' + o + '</option>'; }).join('');
  }

  mi.innerHTML =
    '<p style="font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">About Me</p>' +
    '<div class="field-group"><label class="field-label">Bio</label><textarea class="field" id="e_bio" style="min-height:80px;resize:vertical;">' + (P.bio || '') + '</textarea></div>' +
    '<p style="font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px;">Basic Details</p>' +
    '<div class="field-group"><label class="field-label">Education</label><input class="field" id="e_edu" value="' + (P.education || '') + '"/></div>' +
    '<div class="field-group"><label class="field-label">Occupation</label><input class="field" id="e_occ" value="' + (P.occupation || '') + '"/></div>' +
    '<p style="font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px;">Faith</p>' +
    '<div class="field-group"><label class="field-label">Place of Worship</label><input class="field" id="e_church" value="' + (P.home_church || '') + '"/></div>' +
    '<div class="field-group"><label class="field-label">Faith Importance</label><select class="field" id="e_faithImportance"><option value="">Select</option>' + sel(P.faith_importance, ['Very important', 'Important', 'Somewhat important', 'Not important']) + '</select></div>' +
    '<div class="field-group"><label class="field-label">Favourite Scripture</label><input class="field" id="e_scripture" value="' + (P.scripture || '') + '"/></div>' +
    '<p style="font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px;">Lifestyle</p>' +
    '<div class="field-group"><label class="field-label">Diet</label><select class="field" id="e_diet"><option value="">Select</option>' + sel(P.diet, ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Jain', 'No preference']) + '</select></div>' +
    '<div class="field-group"><label class="field-label">Smoking</label><select class="field" id="e_smoking"><option value="">Select</option>' + sel(P.smoking, ['Never', 'Occasionally', 'Yes']) + '</select></div>' +
    '<div class="field-group"><label class="field-label">Drinking</label><select class="field" id="e_drinking"><option value="">Select</option>' + sel(P.drinking, ['Never', 'Occasionally', 'Yes']) + '</select></div>';

  // Hobbies
  var hobEl = document.getElementById('profileHobbies');
  if (hobEl) {
    hobEl.style.display = '';
    hobEl.innerHTML = '<p style="font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Hobbies (select at least 3)</p>' +
      '<p style="font-size:11px;color:var(--w40);margin-bottom:8px;">Selected: <span id="eHobbyCount">' + _editHobbies.length + '</span></p>' +
      '<div id="eHobbyChips" style="display:flex;flex-wrap:wrap;gap:4px;"></div>';
    renderEditHobbyChips();
  }

  // Looking For
  var lfEl = document.getElementById('profileLookingFor');
  if (lfEl) {
    lfEl.style.display = '';
    lfEl.innerHTML = '<p style="font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">What I\'m Looking For</p>' +
      '<div class="field-group"><textarea class="field" id="e_lookingForText" style="min-height:80px;resize:vertical;">' + (P.looking_for || '') + '</textarea></div>' +
      '<div class="field-group"><label class="field-label">Preferred City</label><input class="field" id="e_prefCity" value="' + (P.pref_city || '') + '"/></div>';
  }

  var fb = document.getElementById('profileFaithSummary'); if (fb) fb.style.display = 'none';

  // Buttons — appended to mi's parent, NOT as part of mi (so Cancel never triggers save)
  var existing = document.getElementById('profileButtonsBlock');
  if (existing) existing.remove();
  var btnBlock = document.createElement('div');
  btnBlock.id = 'profileButtonsBlock';
  btnBlock.style.cssText = 'margin-top:16px;';
  // Save button
  var saveBtn = document.createElement('button');
  saveBtn.id = 'eSaveBtn';
  saveBtn.className = 'btn btn-gold';
  saveBtn.style.marginBottom = '10px';
  saveBtn.textContent = 'Save Changes ✦';
  saveBtn.onclick = function() { saveEditInline(); };
  btnBlock.appendChild(saveBtn);
  mi.parentNode.appendChild(btnBlock);
}
