// ═══════════════════════════════════════════ LOAD PROFILE
async function loadP() {
  if (!U) { showScr('loginScreen'); return; }

  var profileData = null;
  try {
    var r = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
    if (r.error) throw r.error;
    profileData = (r.data && r.data.length > 0) ? r.data[0] : null;
  } catch(x) {
    showScr('loginScreen'); return;
  }

  P = profileData;

  // No profile yet → go to setup wizard
  if (!P) {
    showScr('setupScreen');
    step = 1;
    updUI();
    return;
  }

  // Profile exists — route by status
  if (P.status === 'pending') {
    showScr('pendingScreen');
    return;
  }

  if (P.status === 'rejected') {
    showScr('rejectedScreen');
    return;
  }

  // Approved — load faith prefs and enter app
  try {
    fpBrowse  = P.faith_browse  ? JSON.parse(P.faith_browse)  : FAITHS.map(function(f){ return f.key; });
  } catch(x) {
    fpBrowse  = FAITHS.map(function(f){ return f.key; });
  }
  try {
    fpReceive = P.faith_receive ? JSON.parse(P.faith_receive) : FAITHS.map(function(f){ return f.key; });
  } catch(x) {
    fpReceive = FAITHS.map(function(f){ return f.key; });
  }

  // Add admin tab if needed
  if (P.is_admin) {
    var bar = document.getElementById('tBar');
    if (bar && !document.getElementById('adTab')) {
      var ab = document.createElement('button');
      ab.className = 'tab-btn'; ab.id = 'adTab';
      ab.onclick = function(){ goTab('admin'); };
      ab.innerHTML = '<span class="tab-icon">⚙️</span><span class="tab-label">Admin</span>';
      bar.appendChild(ab);
    }
  }

  showScr('mainApp');
  goTab('home');
  checkNotifs();
}

// ═══════════════════════════════════════════ SETUP WIZARD
function toggleDenom() {
  var r      = document.getElementById('fReligion').value;
  var denoms = DENOM_MAP[r] || [];
  var dg     = document.getElementById('denomGroup');
  var dd     = document.getElementById('fDenom');
  if (denoms.length > 0) {
    dg.style.display = '';
    dd.innerHTML = '<option value="">Select denomination</option>' +
      denoms.map(function(d){ return '<option>'+d+'</option>'; }).join('');
  } else {
    dg.style.display = 'none';
  }
}

function fillC() {
  var s = document.getElementById('fState').value;
  var c = document.getElementById('fCity');
  c.innerHTML = '<option value="">Select city</option>';
  (CT[s] || []).forEach(function(v){ c.innerHTML += '<option>'+v+'</option>'; });
}

function initPG() {
  var g = document.getElementById('photoGrid'); if (!g) return; g.innerHTML = '';
  for (var i = 0; i < 5; i++) {
    g.innerHTML += '<div class="photo-slot" id="ps'+i+'" onclick="document.getElementById(\'pi'+i+'\').click()">'+
      '<span style="font-size:15px;opacity:.4">📷</span>'+
      '<span style="font-size:9px;color:var(--w40)">'+(i===0?'Main*':'#'+(i+1))+'</span>'+
      '<input type="file" accept="image/*" id="pi'+i+'" style="display:none" onchange="pickP('+i+',this)"/></div>';
  }
}

function pickP(i, inp) {
  var f = inp.files[0]; if (!f) return;
  photos[i] = f;
  var s = document.getElementById('ps'+i);
  s.style.backgroundImage = 'url('+URL.createObjectURL(f)+')';
  s.style.borderColor = 'var(--gold)'; s.style.borderStyle = 'solid';
  s.innerHTML = '<input type="file" accept="image/*" id="pi'+i+'" style="display:none" onchange="pickP('+i+',this)"/>';
}

function pickId(inp) {
  var f = inp.files[0]; if (!f || f.size > 5*1024*1024) { alert('Max 5MB'); return; }
  idFile = f;
  document.getElementById('idSlot').innerHTML =
    '<span style="font-size:28px">✅</span><br/>'+
    '<span style="font-size:11px;color:var(--gold2)">ID uploaded</span>'+
    '<input type="file" accept="image/*,.pdf" id="idInp" style="display:none" onchange="pickId(this)"/>';
  var idN = document.getElementById('idN');
  if (idN) { idN.textContent = '📄 ' + f.name; idN.style.display = ''; }
}

function initSetupFaithGrids() {
  setupBrowse  = FAITHS.map(function(f){ return f.key; });
  setupReceive = FAITHS.map(function(f){ return f.key; });
  renderFaithCards('s6BrowseCards',  setupBrowse);
  renderFaithCards('s6ReceiveCards', setupReceive);
}

function s6All(type) {
  if (type === 'browse')  { setupBrowse  = FAITHS.map(function(f){return f.key;}); renderFaithCards('s6BrowseCards',  setupBrowse);  }
  else                    { setupReceive = FAITHS.map(function(f){return f.key;}); renderFaithCards('s6ReceiveCards', setupReceive); }
}
function s6None(type) {
  if (type === 'browse')  { setupBrowse  = []; renderFaithCards('s6BrowseCards',  setupBrowse);  }
  else                    { setupReceive = []; renderFaithCards('s6ReceiveCards', setupReceive); }
}

function updUI() {
  var titles = ['Personal Details','About You','Photos','Government ID','Match Preferences','Faith Privacy'];
  var st = document.getElementById('sTitle'); if (st) st.textContent = titles[step-1];
  var sl = document.getElementById('sLabel'); if (sl) sl.textContent = 'Step '+step+' of 6';
  document.querySelectorAll('#sDots .step-dot').forEach(function(d,i){ d.classList.toggle('active', i < step); });
  for (var i = 1; i <= 6; i++) { var el = document.getElementById('s'+i); if (el) el.style.display = i===step?'':'none'; }
  var bk = document.getElementById('bkBtn'); if (bk) bk.style.display = step > 1 ? '' : 'none';
  var nx = document.getElementById('nxBtn'); if (nx) nx.textContent = step < 6 ? 'Next →' : 'Submit for Review ✦';
  var se = document.getElementById('sErr'); if (se) se.style.display = 'none';
  if (step === 3) initPG();
  if (step === 6) initSetupFaithGrids();
}

function goBack() { if (step > 1) { step--; updUI(); } }

async function goNext() {
  var e = document.getElementById('sErr'); if (e) e.style.display = 'none';

  if (step === 1) {
    var name   = document.getElementById('fName').value.trim();
    var age    = document.getElementById('fAge').value;
    var gender = document.getElementById('fGender').value;
    var relig  = document.getElementById('fReligion').value;
    var state  = document.getElementById('fState').value;
    var city   = document.getElementById('fCity').value;
    var phone  = document.getElementById('fPhone').value.trim();
    if (!name || !age || !gender || !relig || !state || !city || !phone) {
      if (e) { e.textContent = 'Please fill all required fields.'; e.style.display = 'block'; }
      return;
    }
    step++; updUI(); return;
  }

  if (step === 2) { step++; updUI(); return; }

  if (step === 3) {
    if (!photos[0]) {
      if (e) { e.textContent = 'Primary photo is required.'; e.style.display = 'block'; }
      return;
    }
    step++; updUI(); return;
  }

  if (step === 4) {
    if (!document.getElementById('fIdT').value || !idFile) {
      if (e) { e.textContent = 'ID type and upload are required.'; e.style.display = 'block'; }
      return;
    }
    step++; updUI(); return;
  }

  if (step === 5) { step++; updUI(); return; }

  // Step 6 — submit
  if (setupBrowse.length === 0) {
    if (e) { e.textContent = 'Please select at least one faith to browse.'; e.style.display = 'block'; }
    return;
  }

  var btn = document.getElementById('nxBtn');
  btn.disabled = true;
  btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--gold2);border-radius:50%;animation:spin .6s linear infinite;margin:0 auto;"></div>';

  try {
    // Upload photos
    var urls = ['','','','',''];
    for (var i = 0; i < 5; i++) {
      if (photos[i]) {
        var ext  = photos[i].name.split('.').pop();
        var path = U.id+'/p'+i+'_'+Date.now()+'.'+ext;
        var r    = await sb.storage.from('profile-photos').upload(path, photos[i], {upsert:true});
        if (!r.error) urls[i] = sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
      }
    }

    // Upload ID
    var idUrl = '';
    if (idFile) {
      var ext2 = idFile.name.split('.').pop();
      var idP  = U.id+'/id_'+Date.now()+'.'+ext2;
      try {
        var r2 = await sb.storage.from('id-proofs').upload(idP, idFile, {upsert:true});
        if (!r2.error) idUrl = sb.storage.from('id-proofs').getPublicUrl(idP).data.publicUrl;
      } catch(x) {
        try {
          var r3 = await sb.storage.from('profile-photos').upload(idP, idFile, {upsert:true});
          if (!r3.error) idUrl = sb.storage.from('profile-photos').getPublicUrl(idP).data.publicUrl;
        } catch(y) {}
      }
    }

    var countRes = await sb.from('profiles').select('id',{count:'exact',head:true});
    var foundingNum = (countRes.count || 0) + 1;

    var pd = {
      id:U.id, email:U.email,
      full_name:document.getElementById('fName').value.trim(),
      age:parseInt(document.getElementById('fAge').value),
      gender:document.getElementById('fGender').value,
      religion:document.getElementById('fReligion').value,
      denomination:document.getElementById('fDenom').value||null,
      city:document.getElementById('fCity').value,
      state:document.getElementById('fState').value,
      phone:document.getElementById('fPhone').value.trim(),
      registered_by:document.getElementById('fRegFor').value,
      bio:document.getElementById('fBio').value.trim(),
      education:document.getElementById('fEdu').value.trim(),
      occupation:document.getElementById('fOcc').value.trim(),
      height_cm:document.getElementById('fHt').value ? parseInt(document.getElementById('fHt').value) : null,
      mother_tongue:document.getElementById('fMT').value.trim(),
      marital_status:document.getElementById('fMS').value,
      photo_url:urls[0], photo_2_url:urls[1], photo_3_url:urls[2], photo_4_url:urls[3], photo_5_url:urls[4],
      id_proof_type:document.getElementById('fIdT').value,
      id_proof_url:idUrl,
      pref_age_min:parseInt(document.getElementById('fPMin').value)||18,
      pref_age_max:parseInt(document.getElementById('fPMax').value)||70,
      pref_denomination:document.getElementById('fPD').value,
      pref_city:document.getElementById('fPC').value.trim()||'Any',
      faith_browse:JSON.stringify(setupBrowse),
      faith_receive:JSON.stringify(setupReceive),
      founding_number:foundingNum,
      is_founding_member:true,
      referred_by:getReferrerId()||null,
      status:'pending'
    };

    var res = await sb.from('profiles').upsert(pd, {onConflict:'id'});
    if (res.error) throw res.error;

    // Send pending notification
    try {
      await fetch(SB_URL+'/functions/v1/smart-function', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          type:'pending',
          full_name:pd.full_name, email:pd.email, phone:pd.phone,
          city:pd.city, state:pd.state,
          religion:pd.religion, denomination:pd.denomination||pd.religion,
          gender:pd.gender, founding_number:foundingNum
        })
      });
    } catch(x) {}

    P = pd;
    clearReferrerId();
    showScr('pendingScreen');

  } catch(ex) {
    if (e) { e.textContent = ex.message || 'Error. Please try again.'; e.style.display = 'block'; }
    btn.disabled = false; btn.textContent = 'Submit for Review ✦';
  }
}

// ═══════════════════════════════════════════ MY PROFILE TAB
function renP() {
  if (!P) return;
  var f  = faithByKey(P.religion || 'Other');
  var ap = [P.photo_url,P.photo_2_url,P.photo_3_url,P.photo_4_url,P.photo_5_url].filter(Boolean);
  var ph = ap[0] ? 'background-image:url('+ap[0]+');background-size:cover;background-position:center' : '';

  var heroEl = document.getElementById('profileHero');
  if (heroEl) heroEl.innerHTML =
    '<div style="width:80px;height:80px;border-radius:50%;margin:0 auto;border:2px solid '+f.color+';'+ph+';background-color:var(--dark3);display:flex;align-items:center;justify-content:center;">'+(ap[0]?'':'<span style="font-size:32px;opacity:.3">👤</span>')+'</div>'+
    '<h2 style="font-family:Cinzel,serif;font-size:20px;margin-top:10px;color:#fff;">'+P.full_name+'</h2>'+
    '<p style="color:'+f.color+';font-size:12px;margin-top:3px;">'+f.icon+' '+(P.denomination?P.denomination+' · ':'')+P.religion+'</p>'+
    '<p style="color:var(--w50);font-size:11px;margin-top:2px;">'+P.city+', '+P.state+'</p>'+
    '<span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:'+(P.status==='approved'?'var(--green)':'var(--gold)')+';color:'+(P.status==='approved'?'#fff':'#1A0830')+';">'+(P.status==='approved'?'✅ Verified Member':'⏳ Pending Review')+'</span>'+
    (P.founding_number?'<p style="font-size:10px;color:var(--gold);margin-top:6px;">✦ Founding Member #'+P.founding_number+'</p>':'');

  var h = '';
  [{l:'Email',v:P.email},{l:'Phone',v:P.phone},{l:'Religion',v:P.religion},{l:'Denomination',v:P.denomination},
   {l:'Age',v:P.age},{l:'Education',v:P.education},{l:'Occupation',v:P.occupation},
   {l:'Mother Tongue',v:P.mother_tongue},{l:'Marital Status',v:P.marital_status},
   {l:'Height',v:P.height_cm?P.height_cm+' cm':''}].forEach(function(d){
    if (d.v) h += '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--w05);">'+
      '<span style="font-size:10px;color:var(--w50);text-transform:uppercase;letter-spacing:.5px;">'+d.l+'</span>'+
      '<span style="font-size:13px;color:var(--w80);font-weight:600;">'+d.v+'</span></div>';
  });
  if (P.bio) h += '<div style="margin-top:10px;"><p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">About</p><p style="font-size:13px;color:var(--w70);line-height:1.6;">'+P.bio+'</p></div>';

  var mi = document.getElementById('mInfo'); if (mi) mi.innerHTML = h;
  renderProfileFaithSummary();
  loadStats();
  renderReferralCard();
}

function renderProfileFaithSummary() {
  var h = '<div style="margin-bottom:10px;"><p style="font-size:9px;color:var(--w50);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">🔍 Browsing from</p><div style="display:flex;flex-wrap:wrap;gap:4px;">';
  fpBrowse.forEach(function(k){ var f=faithByKey(k); h+='<span class="faith-pill" style="background:'+f.bg+';border-color:'+f.color+';color:'+f.color+';">'+f.icon+' '+k+'</span>'; });
  h += '</div></div><div><p style="font-size:9px;color:var(--w50);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">💌 Receiving from</p><div style="display:flex;flex-wrap:wrap;gap:4px;">';
  fpReceive.forEach(function(k){ var f=faithByKey(k); h+='<span class="faith-pill" style="background:'+f.bg+';border-color:'+f.color+';color:'+f.color+';">'+f.icon+' '+k+'</span>'; });
  h += '</div></div>';
  var el = document.getElementById('profileFaithSummary'); if (el) el.innerHTML = h;
}

// ═══════════════════════════════════════════ EDIT PROFILE
function openEdit() {
  document.getElementById('eBio').value = P.bio||'';
  document.getElementById('eEdu').value = P.education||'';
  document.getElementById('eOcc').value = P.occupation||'';
  document.getElementById('ePh').value  = P.phone||'';
  editPhotos = [null,null,null,null,null];
  var g    = document.getElementById('epGrid'); g.innerHTML = '';
  var urls = [P.photo_url,P.photo_2_url,P.photo_3_url,P.photo_4_url,P.photo_5_url];
  for (var i = 0; i < 5; i++) {
    var has = urls[i] && urls[i].length > 0;
    g.innerHTML += '<div class="photo-slot" id="eps'+i+'" onclick="document.getElementById(\'epi'+i+'\').click()" style="'+(has?'background-image:url('+urls[i]+');border-color:var(--gold);border-style:solid':'')+'">'+
      '<span style="font-size:13px;opacity:.4">📷</span>'+
      '<input type="file" accept="image/*" id="epi'+i+'" style="display:none" onchange="pickEP('+i+',this)"/></div>';
  }
  document.getElementById('editModal').classList.add('show');
}
function closeEdit() { document.getElementById('editModal').classList.remove('show'); }

function pickEP(i, inp) {
  var f = inp.files[0]; if (!f) return;
  editPhotos[i] = f;
  var s = document.getElementById('eps'+i);
  s.style.backgroundImage = 'url('+URL.createObjectURL(f)+')';
  s.style.borderColor = 'var(--gold)'; s.style.borderStyle = 'solid';
  s.innerHTML = '<input type="file" accept="image/*" id="epi'+i+'" style="display:none" onchange="pickEP('+i+',this)"/>';
}

async function saveEdit() {
  var upd = {
    bio:document.getElementById('eBio').value.trim(),
    education:document.getElementById('eEdu').value.trim(),
    occupation:document.getElementById('eOcc').value.trim(),
    phone:document.getElementById('ePh').value.trim()
  };
  for (var i = 0; i < 5; i++) {
    if (editPhotos[i]) {
      var ext  = editPhotos[i].name.split('.').pop();
      var path = U.id+'/p'+i+'_'+Date.now()+'.'+ext;
      var r    = await sb.storage.from('profile-photos').upload(path, editPhotos[i], {upsert:true});
      if (!r.error) {
        var url = sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
        if (i === 0) upd.photo_url = url; else upd['photo_'+(i+1)+'_url'] = url;
      }
    }
  }
  await sb.from('profiles').update(upd).eq('id', U.id);
  var r2 = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
  P = r2.data[0]; closeEdit(); renP();
  alert('Profile updated! ✅');
}

// ═══════════════════════════════════════════ FAITH PREFS MODAL
function openFaithPrefs() {
  document.getElementById('faithModal').classList.add('show');
  if (P) {
    var f = faithByKey(P.religion||'Other');
    var a = document.getElementById('fpMyFaithIcon');  if (a) a.textContent = f.icon;
    var b = document.getElementById('fpMyFaithName');  if (b) b.textContent = P.religion||'Not set';
    var c = document.getElementById('fpMyFaithDenom'); if (c) c.textContent = P.denomination||'';
  }
  renderFpCards('fpBrowseCards',  fpBrowse);
  renderFpCards('fpReceiveCards', fpReceive);
}
function closeFaithPrefs() { document.getElementById('faithModal').classList.remove('show'); }

function renderFpCards(cid, arr) {
  var FP = [
    {k:'Christian',i:'✝️',c:'#9B59B6'},{k:'Hindu',i:'🕉️',c:'#E07020'},
    {k:'Muslim',i:'☪️',c:'#2E8B57'},{k:'Sikh',i:'☬',c:'#C8960C'},
    {k:'Jain',i:'🕊️',c:'#4A90D9'},{k:'Buddhist',i:'☸️',c:'#D4700A'},
    {k:'Parsi',i:'🔥',c:'#C0392B'},{k:'Jewish',i:'✡️',c:'#2980B9'},
    {k:'Bahai',i:'⭐',c:'#8E44AD'},{k:'Spiritual',i:'🌱',c:'#27AE60'},
    {k:'Other',i:'🌐',c:'#888'}
  ];
  var el = document.getElementById(cid); if (!el) return; el.innerHTML = '';
  FP.forEach(function(f){
    var on = arr.indexOf(f.k) > -1;
    var d  = document.createElement('div');
    d.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:12px;cursor:pointer;transition:all .15s;margin-bottom:0;border:1.5px solid '+(on?f.c:'rgba(255,255,255,.1)')+';background:'+(on?'rgba(255,255,255,.08)':'rgba(255,255,255,.02)')+';';
    d.innerHTML = '<span style="font-size:19px">'+f.i+'</span><span style="font-size:12px;font-weight:700;color:'+(on?'#fff':'rgba(255,255,255,.4)')+'">'+f.k+'</span><span style="margin-left:auto;color:'+f.c+';font-size:15px">'+(on?'✓':'')+'</span>';
    d.onclick = function(){ var ix=arr.indexOf(f.k); if(ix>-1)arr.splice(ix,1); else arr.push(f.k); renderFpCards(cid,arr); };
    el.appendChild(d);
  });
}

function fpToggleAll(type, sel) {
  var K = ['Christian','Hindu','Muslim','Sikh','Jain','Buddhist','Parsi','Jewish','Bahai','Spiritual','Other'];
  if (type === 'browse')  { fpBrowse  = sel ? K.slice() : []; renderFpCards('fpBrowseCards',  fpBrowse);  }
  else                    { fpReceive = sel ? K.slice() : []; renderFpCards('fpReceiveCards', fpReceive); }
}

async function saveFaithPrefs() {
  try {
    await sb.from('profiles').update({
      faith_browse:JSON.stringify(fpBrowse),
      faith_receive:JSON.stringify(fpReceive)
    }).eq('id', U.id);
  } catch(x) {}
  closeFaithPrefs();
  renderProfileFaithSummary();
}

// ═══════════════════════════════════════════ PROFILE VIEW MODAL
async function viewProfile(id) {
  try { await sb.from('profile_views').upsert({viewer_id:U.id, viewed_id:id, viewed_at:new Date().toISOString()},{onConflict:'viewer_id,viewed_id'}); } catch(x){}
  var r = await sb.from('profiles').select('*').eq('id', id).limit(1);
  if (!r.data || !r.data.length) return;
  var p  = r.data[0];
  var f  = faithByKey(p.religion||'Other');
  var ap = [p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(Boolean);
  var h  = '<div style="text-align:center;padding-top:8px">';
  if (ap.length) h += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">' +
    ap.map(function(u){ return '<div style="width:70px;height:70px;border-radius:12px;background-image:url('+u+');background-size:cover;background-position:center;border:2px solid '+f.color+';"></div>'; }).join('') + '</div>';
  h += '<h2 style="font-family:Cinzel,serif;font-size:20px;color:#fff;">'+p.full_name+', '+p.age+'</h2>';
  h += '<p style="margin-top:4px;"><span style="color:'+f.color+'">'+f.icon+' '+p.religion+'</span>'+(p.denomination?' <span style="color:var(--w50);font-size:12px">· '+p.denomination+'</span>':'')+'</p>';
  h += '<p style="color:var(--w50);font-size:12px;margin-top:3px;">'+p.city+', '+p.state+'</p></div>';
  h += '<div style="background:var(--w05);border-radius:12px;padding:13px;margin-top:14px;">';
  [{l:'Bio',v:p.bio},{l:'Education',v:p.education},{l:'Occupation',v:p.occupation},
   {l:'Mother Tongue',v:p.mother_tongue},{l:'Marital Status',v:p.marital_status},
   {l:'Height',v:p.height_cm?p.height_cm+' cm':''}].forEach(function(dd){
    if (dd.v) h += '<div style="margin-bottom:9px;"><p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;">'+dd.l+'</p><p style="font-size:13px;margin-top:2px;color:var(--w80);">'+dd.v+'</p></div>';
  });
  h += '</div><p style="text-align:center;padding:14px;font-size:13px;color:var(--w40);">🔒 Interest &amp; messaging unlocks launch day</p>';
  document.getElementById('pmC').innerHTML = h;
  document.getElementById('profileModal').classList.add('show');
}
function closeModal() { document.getElementById('profileModal').classList.remove('show'); }

// ═══════════════════════════════════════════ VIEWS TAB
async function ldViews() {
  var r = await sb.from('profile_views').select('*,profiles!profile_views_viewer_id_fkey(*)').eq('viewed_id', U.id).order('viewed_at',{ascending:false});
  var d = r.data || [];
  var vEmpty = document.getElementById('viewEmpty'); if (vEmpty) vEmpty.style.display = d.length ? 'none' : '';
  var l = document.getElementById('viewList'); if (!l) return; l.innerHTML = '';
  d.forEach(function(v){
    var p = v.profiles; if (!p) return;
    var f = faithByKey(p.religion||'Other');
    l.innerHTML += '<div class="card" style="cursor:pointer" onclick="viewProfile(\''+p.id+'\')"><div style="display:flex;gap:10px;align-items:center">'+
      '<div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+')':'')+';border-color:'+f.color+';">'+(p.photo_url?'':'<span style="font-size:18px;opacity:.3">👤</span>')+'</div>'+
      '<div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600;color:#fff;">'+p.full_name+', '+p.age+'</h3>'+
      '<p style="font-size:11px;color:'+f.color+';">'+f.icon+' '+(p.denomination||p.religion||'')+'</p></div>'+
      '<p style="font-size:10px;color:var(--w50);">'+new Date(v.viewed_at).toLocaleDateString()+'</p>'+
      '</div></div>';
  });
}

// Locked feature stubs
async function ldBrowse()    { var l=document.getElementById('bList'); if(l)l.innerHTML='<div style="text-align:center;padding:30px 16px;"><p style="font-size:13px;color:var(--w40);">🔒 Discover unlocks on launch day</p></div>'; }
async function ldInt(type)   {}
function showInt(t)          { ldInt(t); }
async function actInt(id,st) { await sb.from('interests').update({status:st}).eq('id',id); ldInt('received'); }
async function ldChats()     {}
async function openChat(pid) {}
async function ldMsgs()      {}
async function sendMsg()     {}
