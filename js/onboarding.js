// ═══════════════════════════════════════════════════════════════════
// Begin Forever — js/onboarding.js
// Mandatory profile completion flow after approval.
// Triggered on first login when status='approved' AND onboarding_completed=false.
// ═══════════════════════════════════════════════════════════════════

var _onbStep = 1;
var _onbHobbies = [];
var _onbPrefAgeRanges = [];
var _onbPrefMaritalStatuses = [];

function needsOnboarding() {
  return P && P.status === 'approved' && P.onboarding_completed !== true;
}

function startOnboarding() {
  _onbStep = 1;
  _onbHobbies = [];
  try { _onbHobbies = JSON.parse(P.hobbies || '[]'); } catch(e) { _onbHobbies = []; }
  _onbPrefAgeRanges = [];
  try { _onbPrefAgeRanges = JSON.parse(P.pref_age_ranges || '[]'); } catch(e) { _onbPrefAgeRanges = []; }
  _onbPrefMaritalStatuses = [];
  try { _onbPrefMaritalStatuses = JSON.parse(P.pref_marital_statuses || '[]'); } catch(e) { _onbPrefMaritalStatuses = []; }
  renderOnbScreen();
  showScr('onboardingScreen');
}

function renderOnbScreen() {
  var titles = [
    'Complete your profile',
    'About you',
    'Your hobbies',
    'What you\'re looking for',
    'Partner preferences'
  ];
  var dots = '';
  for (var i = 0; i < 5; i++) {
    dots += '<div class="step-dot' + (i < _onbStep ? ' active' : '') + '"></div>';
  }

  var body = '';
  if (_onbStep === 1) body = onbStep1();
  else if (_onbStep === 2) body = onbStep2();
  else if (_onbStep === 3) body = onbStep3();
  else if (_onbStep === 4) body = onbStep4();
  else if (_onbStep === 5) body = onbStep5();

  var el = document.getElementById('onboardingScreen');
  if (!el) return;
  el.innerHTML =
    '<div style="background:var(--dark1);padding:24px;padding-bottom:100px;min-height:100vh;width:100%;">' +
      '<div style="max-width:440px;margin:0 auto;">' +
        '<div style="text-align:center;margin-bottom:24px;">' +
          '<h1 style="font-family:\'Cinzel\',serif;font-size:22px;color:var(--gold-bright);margin-bottom:6px;">' + titles[_onbStep-1] + '</h1>' +
          '<div style="display:flex;gap:6px;justify-content:center;margin:12px 0;">' + dots + '</div>' +
          '<p style="font-size:12px;color:var(--white40);">Step ' + _onbStep + ' of 5</p>' +
        '</div>' +
        '<div style="background:rgba(212,160,23,.08);border:1px solid rgba(212,160,23,.25);border-radius:12px;padding:12px 14px;margin-bottom:16px;">' +
          '<p style="font-size:11px;color:#F5C842;font-weight:700;margin-bottom:3px;">✦ Almost there!</p>' +
          '<p style="font-size:11px;color:rgba(255,255,255,.6);line-height:1.5;">A few more details so we can find your best matches. This helps us match you with people who truly align with you.</p>' +
        '</div>' +
        '<div style="background:var(--dark2);border-radius:20px;padding:24px;border:1px solid var(--white08);">' +
          body +
          '<p id="onbErr" style="color:#ff6b6b;font-size:12px;text-align:center;margin:12px 0;display:none;"></p>' +
          '<div style="display:flex;gap:12px;margin-top:20px;">' +
            (_onbStep > 1 ? '<button class="btn btn-dark" onclick="onbBack()">← Back</button>' : '') +
            '<button class="btn btn-gold" id="onbNxBtn" onclick="onbNext()">' + (_onbStep < 5 ? 'Next →' : 'Complete Profile ✦') + '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  if (_onbStep === 3) renderOnbHobbyChips();
  if (_onbStep === 5) {
    renderAgeRangeChips();
    renderMaritalChips();
  }
}

// ─── STEP 1: Profile For + Income + Height
function onbStep1() {
  var heightSel = HEIGHT_OPTIONS.map(function(h) {
    var sel = (P.height_cm && Math.abs(P.height_cm - h.cm) < 2) ? ' selected' : '';
    return '<option value="' + h.cm + '"' + sel + '>' + h.label + '</option>';
  }).join('');
  var profForSel = PROFILE_FOR_OPTIONS.map(function(o) {
    var cur = P.profile_for || P.registered_by || 'Myself';
    return '<option value="' + o + '"' + (cur === o ? ' selected' : '') + '>' + o + '</option>';
  }).join('');
  var incomeSel = INCOME_BRACKETS.map(function(b) {
    return '<option value="' + b.v + '"' + (P.income_bracket === b.v ? ' selected' : '') + '>' + b.l + '</option>';
  }).join('');
  return '' +
    '<div class="field-group"><label class="field-label">This profile is for *</label>' +
      '<select class="field" id="onb_profileFor"><option value="">Select</option>' + profForSel + '</select></div>' +
    '<div class="field-group"><label class="field-label">Height *</label>' +
      '<select class="field" id="onb_height"><option value="">Select height</option>' + heightSel + '</select></div>' +
    '<div class="field-group"><label class="field-label">Annual income *</label>' +
      '<select class="field" id="onb_income"><option value="">Select bracket</option>' + incomeSel + '</select></div>';
}

// ─── STEP 2: About + Bio + Looking For intent
function onbStep2() {
  var lfSel = LOOKING_FOR_OPTIONS.map(function(o) {
    return '<option value="' + o.v + '"' + (P.looking_for_intent === o.v ? ' selected' : '') + '>' + o.l + '</option>';
  }).join('');
  return '' +
    '<div class="field-group"><label class="field-label">A short bio about you</label>' +
      '<textarea class="field" id="onb_bio" placeholder="Tell potential matches a bit about yourself..." style="min-height:90px;resize:vertical;">' + (P.bio || '') + '</textarea></div>' +
    '<div class="field-group"><label class="field-label">What are you looking for? *</label>' +
      '<select class="field" id="onb_lookingFor"><option value="">Select intent</option>' + lfSel + '</select></div>';
}

// ─── STEP 3: Hobbies (min 5 mandatory)
function onbStep3() {
  return '' +
    '<p style="font-size:13px;color:var(--white70);margin-bottom:8px;">Pick at least <strong style="color:var(--gold-bright);">5 hobbies</strong> that describe you.</p>' +
    '<p style="font-size:11px;color:var(--white40);margin-bottom:12px;">Selected: <span id="onbHobbyCount">0</span> / 5 minimum</p>' +
    '<div id="onbHobbyChips" style="display:flex;flex-wrap:wrap;gap:5px;"></div>';
}

function renderOnbHobbyChips() {
  var c = document.getElementById('onbHobbyChips'); if (!c) return;
  c.innerHTML = '';
  ALL_HOBBIES.forEach(function(h) {
    var on = _onbHobbies.indexOf(h) > -1;
    var chip = document.createElement('button');
    chip.type = 'button'; chip.textContent = h;
    chip.style.cssText =
      'padding:7px 13px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;' +
      'font-family:Nunito,sans-serif;transition:all .15s;margin:3px;' +
      'border:1px solid ' + (on ? 'var(--gold)' : 'rgba(255,255,255,.18)') + ';' +
      'background:' + (on ? 'rgba(212,160,23,.2)' : 'rgba(255,255,255,.05)') + ';' +
      'color:' + (on ? '#F5C842' : 'rgba(255,255,255,.6)') + ';';
    chip.onclick = function() {
      var ix = _onbHobbies.indexOf(h);
      if (ix > -1) _onbHobbies.splice(ix, 1); else _onbHobbies.push(h);
      renderOnbHobbyChips();
    };
    c.appendChild(chip);
  });
  var ct = document.getElementById('onbHobbyCount');
  if (ct) {
    ct.textContent = _onbHobbies.length;
    ct.style.color = _onbHobbies.length >= 5 ? '#4ade80' : '#FFD54F';
  }
}

// ─── STEP 4: What I'm looking for (free text)
function onbStep4() {
  return '' +
    '<p style="font-size:13px;color:var(--white70);margin-bottom:14px;">Describe the kind of partner and life you envision.</p>' +
    '<div class="field-group"><label class="field-label">What I\'m looking for *</label>' +
      '<textarea class="field" id="onb_lookingForText" placeholder="Describe the kind of person and relationship you want..." style="min-height:120px;resize:vertical;">' + (P.looking_for || '') + '</textarea></div>' +
    '<p style="font-size:11px;color:var(--white40);text-align:center;">Be honest — this helps us find the right matches for you.</p>';
}

// ─── STEP 5: Partner Preferences (Age range + Height range + Marital status)
function onbStep5() {
  var curMinCm = P.pref_height_min_cm || 152;
  var curMaxCm = P.pref_height_max_cm || 196;
  var minSel = HEIGHT_OPTIONS.map(function(h) {
    return '<option value="' + h.cm + '"' + (curMinCm === h.cm ? ' selected' : '') + '>' + h.label + '</option>';
  }).join('');
  var maxSel = HEIGHT_OPTIONS.map(function(h) {
    return '<option value="' + h.cm + '"' + (curMaxCm === h.cm ? ' selected' : '') + '>' + h.label + '</option>';
  }).join('');

  return '' +
    '<div style="background:rgba(155,89,182,.08);border:1px solid rgba(155,89,182,.25);border-radius:10px;padding:11px 13px;margin-bottom:16px;">' +
      '<p style="font-size:11px;color:#C39BD3;font-weight:700;margin-bottom:3px;">🪶 Your preferences shape your matches</p>' +
      '<p style="font-size:11px;color:rgba(255,255,255,.6);line-height:1.5;">Begin Forever uses these to find profiles where love truly begins to last. Be open — narrow filters mean fewer matches.</p>' +
    '</div>' +

    '<div class="field-group">' +
      '<label class="field-label">Preferred age ranges * (select 1 or more)</label>' +
      '<div id="onbAgeChips" style="display:flex;flex-wrap:wrap;gap:5px;"></div>' +
    '</div>' +

    '<div class="field-group">' +
      '<label class="field-label">Preferred height range</label>' +
      '<div class="field-row">' +
        '<div><p style="font-size:10px;color:var(--white50);margin-bottom:4px;">Minimum</p>' +
          '<select class="field" id="onb_prefHeightMin">' + minSel + '</select></div>' +
        '<div><p style="font-size:10px;color:var(--white50);margin-bottom:4px;">Maximum</p>' +
          '<select class="field" id="onb_prefHeightMax">' + maxSel + '</select></div>' +
      '</div>' +
    '</div>' +

    '<div class="field-group">' +
      '<label class="field-label">Preferred marital status * (select 1 or more)</label>' +
      '<div id="onbMaritalChips" style="display:flex;flex-wrap:wrap;gap:5px;"></div>' +
    '</div>';
}

function renderAgeRangeChips() {
  var c = document.getElementById('onbAgeChips'); if (!c) return;
  c.innerHTML = '';
  AGE_RANGES.forEach(function(r) {
    var on = _onbPrefAgeRanges.indexOf(r.v) > -1;
    var label = r.v === '50_plus' ? '50+' : r.v;
    var chip = document.createElement('button');
    chip.type = 'button'; chip.textContent = label;
    chip.style.cssText =
      'padding:7px 13px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;' +
      'font-family:Nunito,sans-serif;margin:3px;' +
      'border:1px solid ' + (on ? 'var(--gold)' : 'rgba(255,255,255,.18)') + ';' +
      'background:' + (on ? 'rgba(212,160,23,.2)' : 'rgba(255,255,255,.05)') + ';' +
      'color:' + (on ? '#F5C842' : 'rgba(255,255,255,.6)') + ';';
    chip.onclick = function() {
      var ix = _onbPrefAgeRanges.indexOf(r.v);
      if (ix > -1) _onbPrefAgeRanges.splice(ix, 1); else _onbPrefAgeRanges.push(r.v);
      renderAgeRangeChips();
    };
    c.appendChild(chip);
  });
}

function renderMaritalChips() {
  var c = document.getElementById('onbMaritalChips'); if (!c) return;
  c.innerHTML = '';
  MARITAL_STATUSES.forEach(function(m) {
    var on = _onbPrefMaritalStatuses.indexOf(m) > -1;
    var chip = document.createElement('button');
    chip.type = 'button'; chip.textContent = m;
    chip.style.cssText =
      'padding:7px 13px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;' +
      'font-family:Nunito,sans-serif;margin:3px;' +
      'border:1px solid ' + (on ? 'var(--gold)' : 'rgba(255,255,255,.18)') + ';' +
      'background:' + (on ? 'rgba(212,160,23,.2)' : 'rgba(255,255,255,.05)') + ';' +
      'color:' + (on ? '#F5C842' : 'rgba(255,255,255,.6)') + ';';
    chip.onclick = function() {
      var ix = _onbPrefMaritalStatuses.indexOf(m);
      if (ix > -1) _onbPrefMaritalStatuses.splice(ix, 1); else _onbPrefMaritalStatuses.push(m);
      renderMaritalChips();
    };
    c.appendChild(chip);
  });
}

// ─── NAVIGATION
function onbBack() { if (_onbStep > 1) { _onbStep--; renderOnbScreen(); } }

async function onbNext() {
  var err = document.getElementById('onbErr');
  if (err) err.style.display = 'none';

  if (_onbStep === 1) {
    var pf = document.getElementById('onb_profileFor').value;
    var ht = document.getElementById('onb_height').value;
    var inc = document.getElementById('onb_income').value;
    if (!pf || !ht || !inc) { showOnbErr('Please fill all required fields.'); return; }
    _onbStep++; renderOnbScreen(); return;
  }
  if (_onbStep === 2) {
    var lf = document.getElementById('onb_lookingFor').value;
    if (!lf) { showOnbErr('Please select what you\'re looking for.'); return; }
    _onbStep++; renderOnbScreen(); return;
  }
  if (_onbStep === 3) {
    if (_onbHobbies.length < 5) { showOnbErr('Please select at least 5 hobbies.'); return; }
    _onbStep++; renderOnbScreen(); return;
  }
  if (_onbStep === 4) {
    var lft = document.getElementById('onb_lookingForText').value.trim();
    if (!lft || lft.length < 10) { showOnbErr('Please tell us in a few words what you\'re looking for (min 10 chars).'); return; }
    _onbStep++; renderOnbScreen(); return;
  }

  // Step 5 - Submit
  if (_onbPrefAgeRanges.length < 1) { showOnbErr('Please select at least one age range.'); return; }
  if (_onbPrefMaritalStatuses.length < 1) { showOnbErr('Please select at least one marital status.'); return; }

  var btn = document.getElementById('onbNxBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--gold2);border-radius:50%;animation:spin .6s linear infinite;margin:0 auto;"></div>'; }

  try {
    var minH = parseInt(document.getElementById('onb_prefHeightMin').value) || 152;
    var maxH = parseInt(document.getElementById('onb_prefHeightMax').value) || 196;
    if (minH > maxH) { var t = minH; minH = maxH; maxH = t; }

    var upd = {
      profile_for: document.getElementById('onb_profileFor') ? (document.getElementById('onb_profileFor').value || P.profile_for) : P.profile_for,
      height_cm: parseInt(document.getElementById('onb_height') ? document.getElementById('onb_height').value : P.height_cm) || P.height_cm,
      income_bracket: document.getElementById('onb_income') ? document.getElementById('onb_income').value : P.income_bracket,
      bio: P.bio,
      looking_for_intent: P.looking_for_intent,
      hobbies: JSON.stringify(_onbHobbies),
      looking_for: P.looking_for,
      pref_age_ranges: JSON.stringify(_onbPrefAgeRanges),
      pref_height_min_cm: minH,
      pref_height_max_cm: maxH,
      pref_marital_statuses: JSON.stringify(_onbPrefMaritalStatuses),
      onboarding_completed: true
    };

    // Pick up bio/lookingFor/intent from earlier steps if those DOM nodes were left in memory state
    // Since each renderOnbScreen() wipes DOM, we re-read from P which we updated step-by-step below.
    // To keep it simple: save partials when leaving each step. Refactor minimal — re-grab from prior step state:
    // We didn't persist partials, so add a fallback: P already has them if user previously filled.
    // For first-time onboarding, ensure bio + looking_for_intent + looking_for are captured.
    // We update P in-memory at end of each step transition. Adjust onbNext to save partials:
    // (Implemented via _onbCache below.)
    if (_onbCache.bio !== undefined) upd.bio = _onbCache.bio;
    if (_onbCache.looking_for_intent !== undefined) upd.looking_for_intent = _onbCache.looking_for_intent;
    if (_onbCache.looking_for !== undefined) upd.looking_for = _onbCache.looking_for;

    var res = await sb.from('profiles').update(upd).eq('id', U.id);
    if (res.error) throw res.error;

    // Refresh P
    var r2 = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
    if (r2.data && r2.data.length) P = r2.data[0];

    showScr('mainApp'); goTab('home');
    setTimeout(function(){ alert('🎉 Profile complete! Welcome to Begin Forever.'); }, 400);

  } catch(ex) {
    showOnbErr(ex.message || 'Could not save. Please try again.');
    if (btn) { btn.disabled = false; btn.textContent = 'Complete Profile ✦'; }
  }
}

// Cache partials between steps so we don't lose data when DOM is wiped
var _onbCache = {};

// Patch onbNext to cache step 2 + step 4 fields BEFORE re-rendering
// Wrap original logic: capture from DOM before rendering next step
function _captureOnbPartials() {
  var bioEl = document.getElementById('onb_bio');
  if (bioEl) _onbCache.bio = bioEl.value;
  var lfEl = document.getElementById('onb_lookingFor');
  if (lfEl) _onbCache.looking_for_intent = lfEl.value;
  var lftEl = document.getElementById('onb_lookingForText');
  if (lftEl) _onbCache.looking_for = lftEl.value.trim();
}

// Re-define onbNext with partial-capture
var _origOnbNext = onbNext;
onbNext = async function() {
  _captureOnbPartials();
  return _origOnbNext();
};

function showOnbErr(msg) {
  var e = document.getElementById('onbErr');
  if (e) { e.textContent = msg; e.style.display = 'block'; }
}
