// ═══════════════════════════════════════════ LOAD PROFILE
async function loadP() {
  if (!U) { showScr('loginScreen'); return; }
  var profileData = null;
  try {
    var r = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
    if (r.error) throw r.error;
    profileData = (r.data && r.data.length > 0) ? r.data[0] : null;
  } catch(x) { showScr('loginScreen'); return; }
  P = profileData;
  if (!P) {
    if (_justRegistered) {
      _justRegistered = false;
      showScr('setupScreen'); step = 1; updUI();
    } else {
      await sb.auth.signOut(); U = null; showScr('loginScreen');
    }
    return;
  }
  if (P.status === 'pending')       { showScr('pendingScreen'); return; }
  if (P.status === 'rejected')      { renderRejectedScreen(P); showScr('rejectedScreen'); return; }
  if (P.status === 'resubmitting')  { prefillSetupWizard(P); showScr('setupScreen'); step=1; updUI(); return; }
  try { fpBrowse  = P.faith_browse  ? JSON.parse(P.faith_browse)  : FAITHS.map(function(f){return f.key;}); } catch(x) { fpBrowse  = FAITHS.map(function(f){return f.key;}); }
  try { fpReceive = P.faith_receive ? JSON.parse(P.faith_receive) : FAITHS.map(function(f){return f.key;}); } catch(x) { fpReceive = FAITHS.map(function(f){return f.key;}); }
  if (P.is_admin) {
    var bar = document.getElementById('tBar');
    if (bar && !document.getElementById('adTab')) {
      var ab = document.createElement('button');
      ab.className='tab-btn'; ab.id='adTab';
      ab.onclick=function(){goTab('admin');};
      ab.innerHTML='<span class="tab-icon">⚙️</span><span class="tab-label">Admin</span>';
      bar.appendChild(ab);
    }
  }
  showScr('mainApp'); goTab('home'); checkNotifs();
}

// ═══════════════════════════════════════════ SETUP WIZARD — 5 steps, no bio, no faith
function toggleDenom() {
  var r      = document.getElementById('fReligion').value;
  var denoms = DENOM_MAP[r] || [];
  var dg     = document.getElementById('denomGroup');
  var dd     = document.getElementById('fDenom');
  if (denoms.length > 0) {
    dg.style.display = '';
    dd.innerHTML = '<option value="">Select denomination</option>' +
      denoms.map(function(d){ return '<option>'+d+'</option>'; }).join('');
  } else { dg.style.display = 'none'; }
}

function fillC() {
  var s = document.getElementById('fState').value;
  var c = document.getElementById('fCity');
  c.innerHTML = '<option value="">Select city</option>';
  (CT[s]||[]).forEach(function(v){ c.innerHTML += '<option>'+v+'</option>'; });
}

function initPG() {
  var g = document.getElementById('photoGrid'); if (!g) return; g.innerHTML = '';
  for (var i=0;i<5;i++) {
    g.innerHTML += '<div class="photo-slot" id="ps'+i+'" onclick="document.getElementById(\'pi'+i+'\').click()">'+
      '<span style="font-size:15px;opacity:.4">📷</span>'+
      '<span style="font-size:9px;color:var(--w40)">'+(i===0?'Main*':'#'+(i+1))+'</span>'+
      '<input type="file" accept="image/*" id="pi'+i+'" style="display:none" onchange="pickP('+i+',this)"/></div>';
  }
}

function pickP(i,inp) {
  var f=inp.files[0]; if(!f) return;
  photos[i]=f;
  var s=document.getElementById('ps'+i);
  s.style.backgroundImage='url('+URL.createObjectURL(f)+')';
  s.style.borderColor='var(--gold)'; s.style.borderStyle='solid';
  s.innerHTML='<input type="file" accept="image/*" id="pi'+i+'" style="display:none" onchange="pickP('+i+',this)"/>';
}

function pickId(inp) {
  var f=inp.files[0]; if(!f||f.size>5*1024*1024){alert('Max 5MB');return;}
  idFile=f;
  document.getElementById('idSlot').innerHTML=
    '<span style="font-size:28px">✅</span><br/>'+
    '<span style="font-size:11px;color:var(--gold2)">ID uploaded</span>'+
    '<input type="file" accept="image/*,.pdf" id="idInp" style="display:none" onchange="pickId(this)"/>';
  var idN=document.getElementById('idN');
  if(idN){idN.textContent='📄 '+f.name;idN.style.display='';}
}

function updUI() {
  var titles=['Personal Details','About You','Photos','Government ID','Match Preferences'];
  var st=document.getElementById('sTitle'); if(st) st.textContent=titles[step-1];
  var sl=document.getElementById('sLabel'); if(sl) sl.textContent='Step '+step+' of 5';
  document.querySelectorAll('#sDots .step-dot').forEach(function(d,i){d.classList.toggle('active',i<step);});
  for(var i=1;i<=6;i++){var el=document.getElementById('s'+i);if(el)el.style.display=(i===step&&i<=5)?'':'none';}
  var bk=document.getElementById('bkBtn'); if(bk) bk.style.display=step>1?'':'none';
  var nx=document.getElementById('nxBtn'); if(nx) nx.textContent=step<5?'Next →':'Submit for Review ✦';
  var se=document.getElementById('sErr'); if(se) se.style.display='none';
  if(step===3) initPG();
}

function goBack(){if(step>1){step--;updUI();}}

async function goNext(){
  var e=document.getElementById('sErr'); if(e) e.style.display='none';
  if(step===1){
    if(!document.getElementById('fName').value.trim()||!document.getElementById('fAge').value||
       !document.getElementById('fGender').value||!document.getElementById('fReligion').value||
       !document.getElementById('fState').value||!document.getElementById('fCity').value||
       !document.getElementById('fPhone').value.trim()){
      if(e){e.textContent='Please fill all required fields.';e.style.display='block';}return;
    }
    step++;updUI();return;
  }
  if(step===2){step++;updUI();return;}
  if(step===3){
    if(!photos[0]){if(e){e.textContent='Primary photo is required.';e.style.display='block';}return;}
    step++;updUI();return;
  }
  if(step===4){
    if(!document.getElementById('fIdT').value||!idFile){
      if(e){e.textContent='ID type and upload are required.';e.style.display='block';}return;
    }
    step++;updUI();return;
  }
  // Step 5 — submit
  var btn=document.getElementById('nxBtn');
  btn.disabled=true;
  btn.innerHTML='<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--gold2);border-radius:50%;animation:spin .6s linear infinite;margin:0 auto;"></div>';
  try{
    var urls=['','','','',''];
    for(var i=0;i<5;i++){
      if(photos[i]){
        var ext=photos[i].name.split('.').pop();
        var path=U.id+'/p'+i+'_'+Date.now()+'.'+ext;
        var r=await sb.storage.from('profile-photos').upload(path,photos[i],{upsert:true});
        if(!r.error) urls[i]=sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
      }
    }
    var idUrl='';
    if(idFile){
      var ext2=idFile.name.split('.').pop();
      var idP=U.id+'/id_'+Date.now()+'.'+ext2;
      try{
        var r2=await sb.storage.from('id-proofs').upload(idP,idFile,{upsert:true});
        if(!r2.error) idUrl=sb.storage.from('id-proofs').getPublicUrl(idP).data.publicUrl;
      }catch(x){
        try{
          var r3=await sb.storage.from('profile-photos').upload(idP,idFile,{upsert:true});
          if(!r3.error) idUrl=sb.storage.from('profile-photos').getPublicUrl(idP).data.publicUrl;
        }catch(y){}
      }
    }
    var countRes=await sb.from('profiles').select('id',{count:'exact',head:true});
    var foundingNum=(countRes.count||0)+1;
    var allFaithKeys=JSON.stringify(FAITHS.map(function(f){return f.key;}));
    var isResubmit=P&&P.status==='resubmitting';
    var pd={
      id:U.id,email:U.email,
      full_name:document.getElementById('fName').value.trim(),
      age:parseInt(document.getElementById('fAge').value),
      gender:document.getElementById('fGender').value,
      religion:document.getElementById('fReligion').value,
      denomination:document.getElementById('fDenom').value||null,
      city:document.getElementById('fCity').value,
      state:document.getElementById('fState').value,
      phone:document.getElementById('fPhone').value.trim(),
      registered_by:document.getElementById('fRegFor').value,
      education:document.getElementById('fEdu').value.trim(),
      occupation:document.getElementById('fOcc').value.trim(),
      height_cm:document.getElementById('fHt').value?parseInt(document.getElementById('fHt').value):null,
      mother_tongue:document.getElementById('fMT').value.trim(),
      marital_status:document.getElementById('fMS').value,
      photo_url:urls[0],photo_2_url:urls[1],photo_3_url:urls[2],photo_4_url:urls[3],photo_5_url:urls[4],
      id_proof_type:document.getElementById('fIdT').value,
      id_proof_url:idUrl,
      pref_age_min:parseInt(document.getElementById('fPMin').value)||18,
      pref_age_max:parseInt(document.getElementById('fPMax').value)||70,
      pref_denomination:document.getElementById('fPD').value,
      pref_city:document.getElementById('fPC').value.trim()||'Any',
      faith_browse: P&&P.faith_browse ? P.faith_browse : allFaithKeys,
      faith_receive:P&&P.faith_receive? P.faith_receive: allFaithKeys,
      founding_number:isResubmit?undefined:foundingNum,
      is_founding_member:isResubmit?undefined:true,
      referred_by:isResubmit?undefined:(getReferrerId()||null),
      status:'pending'
    };
    Object.keys(pd).forEach(function(k){if(pd[k]===undefined)delete pd[k];});
    var res=await sb.from('profiles').upsert(pd,{onConflict:'id'});
    if(res.error) throw res.error;
    try{
      await fetch(SB_URL+'/functions/v1/smart-function',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          type:isResubmit?'resubmitted':'pending',
          full_name:pd.full_name,email:pd.email,phone:pd.phone,
          city:pd.city,state:pd.state,religion:pd.religion,
          denomination:pd.denomination||pd.religion,gender:pd.gender,founding_number:foundingNum
        })
      });
    }catch(x){}
    P=pd; if(!isResubmit) clearReferrerId();
    showScr('pendingScreen');
  }catch(ex){
    if(e){e.textContent=ex.message||'Error. Please try again.';e.style.display='block';}
    btn.disabled=false;btn.textContent='Submit for Review ✦';
  }
}

// ═══════════════════════════════════════════ MY PROFILE TAB
function renP(){
  if(!P) return;
  var f=faithByKey(P.religion||'Other');
  var ap=[P.photo_url,P.photo_2_url,P.photo_3_url,P.photo_4_url,P.photo_5_url].filter(Boolean);
  var ph=ap[0]?'background-image:url('+ap[0]+');background-size:cover;background-position:center':'';
  var heroEl=document.getElementById('profileHero');
  if(heroEl) heroEl.innerHTML=
    '<div style="width:80px;height:80px;border-radius:50%;margin:0 auto;border:2px solid '+f.color+';'+ph+';background-color:var(--dark3);display:flex;align-items:center;justify-content:center;">'+(ap[0]?'':'<span style="font-size:32px;opacity:.3">👤</span>')+'</div>'+
    '<h2 style="font-family:Cinzel,serif;font-size:20px;margin-top:10px;color:#fff;">'+P.full_name+'</h2>'+
    '<p style="color:'+f.color+';font-size:12px;margin-top:3px;">'+f.icon+' '+(P.denomination?P.denomination+' · ':'')+P.religion+'</p>'+
    '<p style="color:var(--w50);font-size:11px;margin-top:2px;">'+P.city+', '+P.state+'</p>'+
    '<span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:'+(P.status==='approved'?'var(--green)':'var(--gold)')+';color:'+(P.status==='approved'?'#fff':'#1A0830')+';">'+(P.status==='approved'?'✅ Verified Member':'⏳ Pending Review')+'</span>'+
    (P.founding_number?'<p style="font-size:10px;color:var(--gold);margin-top:6px;">✦ Founding Member #'+P.founding_number+'</p>':'');

  var h='';
  [{l:'Email',v:P.email},{l:'Phone',v:P.phone},{l:'Religion',v:P.religion},{l:'Denomination',v:P.denomination},
   {l:'Age',v:P.age},{l:'Education',v:P.education},{l:'Occupation',v:P.occupation},
   {l:'Mother Tongue',v:P.mother_tongue},{l:'Marital Status',v:P.marital_status},
   {l:'Height',v:P.height_cm?P.height_cm+' cm':''}].forEach(function(d){
    if(d.v) h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--w05);">'+
      '<span style="font-size:10px;color:var(--w50);text-transform:uppercase;letter-spacing:.5px;">'+d.l+'</span>'+
      '<span style="font-size:13px;color:var(--w80);font-weight:600;">'+d.v+'</span></div>';
  });
  // Bio shown here in profile (not in setup)
  if(P.bio) h+='<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--w08);">'+
    '<p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px;">About Me</p>'+
    '<p style="font-size:13px;color:var(--w70);line-height:1.7;">'+P.bio+'</p></div>';

  var mi=document.getElementById('mInfo'); if(mi) mi.innerHTML=h;
  renderFaithPrefCard();
  loadStats();
  if(typeof renderReferralCard==='function') renderReferralCard();
}

// ═══════════════════════════════════════════ FAITH PREF CARD (profile tab)
function renderFaithPrefCard(){
  var el=document.getElementById('profileFaithSummary'); if(!el) return;
  el.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'+
      '<div>'+
        '<p style="font-size:13px;font-weight:700;color:#fff;margin:0;">Faith Preferences</p>'+
        '<p style="font-size:11px;color:var(--w40);margin:3px 0 0;">Who you see &amp; who can reach you</p>'+
      '</div>'+
      '<button onclick="openFaithPrefs()" style="background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.3);color:var(--gold2);font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;">Edit ✦</button>'+
    '</div>'+
    '<div style="margin-bottom:10px;">'+
      '<p style="font-size:9px;font-weight:700;color:var(--w40);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">🔍 Browsing profiles from</p>'+
      '<div id="fpBrowsePills" style="display:flex;flex-wrap:wrap;gap:5px;"></div>'+
    '</div>'+
    '<div>'+
      '<p style="font-size:9px;font-weight:700;color:var(--w40);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">💌 Receiving interest from</p>'+
      '<div id="fpReceivePills" style="display:flex;flex-wrap:wrap;gap:5px;"></div>'+
    '</div>';
  renderFpPills('fpBrowsePills',fpBrowse);
  renderFpPills('fpReceivePills',fpReceive);
}

function renderFpPills(containerId,arr){
  var el=document.getElementById(containerId); if(!el) return;
  if(arr.length===FAITHS.length){el.innerHTML='<span style="font-size:12px;color:var(--w50);font-style:italic;">All faiths</span>';return;}
  if(arr.length===0){el.innerHTML='<span style="font-size:12px;color:#ff6b6b;font-style:italic;">None selected</span>';return;}
  el.innerHTML=arr.map(function(k){
    var f=faithByKey(k);
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid '+f.color+';background:'+f.bg+';color:'+f.color+';">'+f.icon+' '+k+'</span>';
  }).join('');
}

// ═══════════════════════════════════════════ FAITH PREFS MODAL — styled multi-select
var fpBrowseDenoms  = [];
var fpReceiveDenoms = [];
 
var FP_DENOM_MAP = {
  Christian: ['Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','SDA','Orthodox','Mar Thoma','Brethren','Lutheran','Anglican','Non-Denom'],
  Hindu:     ['Shaivism','Vaishnavism','Shaktism','ISKCON','Arya Samaj'],
  Muslim:    ['Sunni','Shia','Sufi','Ahmadiyya','Ismaili'],
  Sikh:      ['Amritdhari','Sahajdhari','Nanakpanthi'],
  Jain:      ['Digambara','Shvetambara'],
  Buddhist:  ['Theravada','Mahayana','Vajrayana','Zen'],
  Jewish:    ['Orthodox','Conservative','Reform']
};
 
function openFaithPrefs() {
  // My Faith badge
  var f = faithByKey(P && P.religion ? P.religion : 'Other');
  var iconEl  = document.getElementById('fpMyFaithIcon');
  var nameEl  = document.getElementById('fpMyFaithName');
  var denomEl = document.getElementById('fpMyFaithDenom');
  if (iconEl)  iconEl.textContent  = f.icon || '🌐';
  if (nameEl)  nameEl.textContent  = (P && P.religion)    || 'Not set';
  if (denomEl) denomEl.textContent = (P && P.denomination) || '';
 
  // Restore saved Browse prefs
  var savedBrowse = [];
  try { savedBrowse = JSON.parse((P && P.faith_browse) || '[]'); } catch(e) {}
  var bRel = (savedBrowse.length === 1) ? savedBrowse[0] : 'all';
  var bRelSel = document.getElementById('fpBrowseReligion');
  if (bRelSel) { bRelSel.value = bRel; }
  fpBrowseDenoms = [];
  _buildFpChips('browse', bRel, fpBrowseDenoms);
 
  // Restore saved Receive prefs
  var savedReceive = [];
  try { savedReceive = JSON.parse((P && P.faith_receive) || '[]'); } catch(e) {}
  var rRel = (savedReceive.length === 1) ? savedReceive[0] : 'all';
  var rRelSel = document.getElementById('fpReceiveReligion');
  if (rRelSel) { rRelSel.value = rRel; }
  fpReceiveDenoms = [];
  _buildFpChips('receive', rRel, fpReceiveDenoms);
 
  // Show modal
  var m = document.getElementById('faithModal');
  if (m) m.classList.add('show');
}
 
function closeFaithPrefs() {
  var m = document.getElementById('faithModal');
  if (m) m.classList.remove('show');
}
 
// Called by onchange on religion <select>
function fpSyncDenom(type) {
  var relId = type === 'browse' ? 'fpBrowseReligion' : 'fpReceiveReligion';
  var rel = document.getElementById(relId).value;
  if (type === 'browse') fpBrowseDenoms = [];
  else fpReceiveDenoms = [];
  _buildFpChips(type, rel, []);
}
 
function _buildFpChips(type, religion, selectedDenoms) {
  var wrapId = type === 'browse' ? 'fpBrowseDenomWrap' : 'fpReceiveDenomWrap';
  var contId = type === 'browse' ? 'fpBrowseChips'     : 'fpReceiveChips';
  var wrap = document.getElementById(wrapId);
  var cont = document.getElementById(contId);
  if (!wrap || !cont) return;
 
  var list = FP_DENOM_MAP[religion] || [];
  if (!list.length || religion === 'all') {
    wrap.style.display = 'none';
    cont.innerHTML = '';
    return;
  }
 
  wrap.style.display = '';
  cont.innerHTML = '';
  var state = type === 'browse' ? fpBrowseDenoms : fpReceiveDenoms;
 
  list.forEach(function(d) {
    var on = state.indexOf(d) > -1;
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = d;
    chip.style.cssText =
      'padding:5px 10px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;' +
      'font-family:Nunito,sans-serif;transition:all .15s;margin-bottom:4px;' +
      'border:1px solid ' + (on ? '#9B59B6' : 'rgba(255,255,255,.18)') + ';' +
      'background:' + (on ? 'rgba(155,89,182,.3)' : 'rgba(255,255,255,.05)') + ';' +
      'color:' + (on ? '#C39BD3' : 'rgba(255,255,255,.5)') + ';';
    chip.onclick = function() {
      var ix = state.indexOf(d);
      if (ix > -1) state.splice(ix, 1);
      else state.push(d);
      _buildFpChips(type, religion, state);
    };
    cont.appendChild(chip);
  });
}
 
async function saveFaithPrefs() {
  var bRel = document.getElementById('fpBrowseReligion').value;
  var rRel = document.getElementById('fpReceiveReligion').value;
  var allFaiths = ['Christian','Hindu','Muslim','Sikh','Jain','Buddhist','Parsi','Jewish','Spiritual','Other'];
  var fpBrowse  = bRel === 'all' ? allFaiths : [bRel];
  var fpReceive = rRel === 'all' ? allFaiths : [rRel];
  var btn = document.getElementById('fpSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    await sb.from('profiles').update({
      faith_browse:  JSON.stringify(fpBrowse),
      faith_receive: JSON.stringify(fpReceive)
    }).eq('id', U.id);
    if (P) { P.faith_browse = JSON.stringify(fpBrowse); P.faith_receive = JSON.stringify(fpReceive); }
    closeFaithPrefs();
    if (typeof renderFaithPrefCard === 'function') renderFaithPrefCard();
  } catch(x) {
    alert('Could not save preferences. Please try again.');
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Save Preferences ✦'; }
}
// ═══════════════════════════════════════════ EDIT PROFILE (includes bio)
function openEdit(){
  document.getElementById('eBio').value=P.bio||'';
  document.getElementById('eEdu').value=P.education||'';
  document.getElementById('eOcc').value=P.occupation||'';
  document.getElementById('ePh').value=P.phone||'';
  editPhotos=[null,null,null,null,null];
  var g=document.getElementById('epGrid'); g.innerHTML='';
  var urls=[P.photo_url,P.photo_2_url,P.photo_3_url,P.photo_4_url,P.photo_5_url];
  for(var i=0;i<5;i++){
    var has=urls[i]&&urls[i].length>0;
    g.innerHTML+='<div class="photo-slot" id="eps'+i+'" onclick="document.getElementById(\'epi'+i+'\').click()" style="'+(has?'background-image:url('+urls[i]+');border-color:var(--gold);border-style:solid':'')+'">'+
      '<span style="font-size:13px;opacity:.4">📷</span>'+
      '<input type="file" accept="image/*" id="epi'+i+'" style="display:none" onchange="pickEP('+i+',this)"/></div>';
  }
  document.getElementById('editModal').classList.add('show');
}
function closeEdit(){document.getElementById('editModal').classList.remove('show');}

function pickEP(i,inp){
  var f=inp.files[0]; if(!f) return;
  editPhotos[i]=f;
  var s=document.getElementById('eps'+i);
  s.style.backgroundImage='url('+URL.createObjectURL(f)+')';
  s.style.borderColor='var(--gold)'; s.style.borderStyle='solid';
  s.innerHTML='<input type="file" accept="image/*" id="epi'+i+'" style="display:none" onchange="pickEP('+i+',this)"/>';
}

async function saveEdit(){
  var upd={
    bio:document.getElementById('eBio').value.trim(),
    education:document.getElementById('eEdu').value.trim(),
    occupation:document.getElementById('eOcc').value.trim(),
    phone:document.getElementById('ePh').value.trim()
  };
  for(var i=0;i<5;i++){
    if(editPhotos[i]){
      var ext=editPhotos[i].name.split('.').pop();
      var path=U.id+'/p'+i+'_'+Date.now()+'.'+ext;
      var r=await sb.storage.from('profile-photos').upload(path,editPhotos[i],{upsert:true});
      if(!r.error){
        var url=sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
        if(i===0) upd.photo_url=url; else upd['photo_'+(i+1)+'_url']=url;
      }
    }
  }
  await sb.from('profiles').update(upd).eq('id',U.id);
  var r2=await sb.from('profiles').select('*').eq('id',U.id).limit(1);
  P=r2.data[0]; closeEdit(); renP();
  alert('Profile updated! ✅');
}

// ═══════════════════════════════════════════ PROFILE VIEW MODAL
async function viewProfile(id){
  try{await sb.from('profile_views').upsert({viewer_id:U.id,viewed_id:id,viewed_at:new Date().toISOString()},{onConflict:'viewer_id,viewed_id'});}catch(x){}
  var r=await sb.from('profiles').select('*').eq('id',id).limit(1);
  if(!r.data||!r.data.length) return;
  var p=r.data[0]; var f=faithByKey(p.religion||'Other');
  var ap=[p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(Boolean);
  var h='<div style="text-align:center;padding-top:8px">';
  if(ap.length) h+='<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">'+
    ap.map(function(u){return '<div style="width:70px;height:70px;border-radius:12px;background-image:url('+u+');background-size:cover;background-position:center;border:2px solid '+f.color+'"></div>';}).join('')+'</div>';
  h+='<h2 style="font-family:Cinzel,serif;font-size:20px;color:#fff;">'+p.full_name+', '+p.age+'</h2>';
  h+='<p style="margin-top:4px;"><span style="color:'+f.color+'">'+f.icon+' '+p.religion+'</span>'+(p.denomination?' <span style="color:var(--w50);font-size:12px">· '+p.denomination+'</span>':'')+'</p>';
  h+='<p style="color:var(--w50);font-size:12px;margin-top:3px;">'+p.city+', '+p.state+'</p></div>';
  h+='<div style="background:var(--w05);border-radius:12px;padding:13px;margin-top:14px;">';
  [{l:'Bio',v:p.bio},{l:'Education',v:p.education},{l:'Occupation',v:p.occupation},
   {l:'Mother Tongue',v:p.mother_tongue},{l:'Marital Status',v:p.marital_status},
   {l:'Height',v:p.height_cm?p.height_cm+' cm':''}].forEach(function(dd){
    if(dd.v) h+='<div style="margin-bottom:9px;"><p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;">'+dd.l+'</p><p style="font-size:13px;margin-top:2px;color:var(--w80);">'+dd.v+'</p></div>';
  });
  h+='</div><p style="text-align:center;padding:14px;font-size:13px;color:var(--w40);">🔒 Interest &amp; messaging unlocks launch day</p>';
  document.getElementById('pmC').innerHTML=h;
  document.getElementById('profileModal').classList.add('show');
}
function closeModal(){document.getElementById('profileModal').classList.remove('show');}

// ═══════════════════════════════════════════ REJECTED SCREEN
function renderRejectedScreen(profile){
  var reason=profile.rejection_reason||'Your profile did not meet our verification requirements.';
  var el=document.getElementById('rejectedContent'); if(!el) return;
  el.innerHTML=
    '<div style="font-size:48px;margin-bottom:16px;">😔</div>'+
    '<h2 style="font-family:\'Cinzel\',serif;font-size:22px;color:#ff6b6b;margin-bottom:12px;">Profile Not Approved</h2>'+
    '<div style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:14px;padding:16px;margin-bottom:20px;text-align:left;">'+
      '<p style="font-size:10px;font-weight:700;color:#ff6b6b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📋 Reason from our team</p>'+
      '<p style="font-size:13px;color:rgba(255,255,255,.8);line-height:1.7;">'+reason+'</p>'+
    '</div>'+
    '<div style="background:rgba(212,160,23,.08);border:1px solid rgba(212,160,23,.2);border-radius:14px;padding:16px;margin-bottom:24px;text-align:left;">'+
      '<p style="font-size:12px;font-weight:700;color:var(--gold2);margin-bottom:8px;">✦ What to do next</p>'+
      '<p style="font-size:12px;color:rgba(255,255,255,.6);line-height:1.9;">'+
        '✓ Fix the issue mentioned above<br/>✓ Re-upload a clear government ID<br/>'+
        '✓ Ensure your photo clearly shows your face<br/>✓ Resubmit — reviewed within 24 hrs'+
      '</p>'+
    '</div>'+
    '<button class="btn btn-gold" style="margin-bottom:12px;" onclick="startResubmit()">✦ Fix &amp; Resubmit Profile</button>'+
    '<button class="btn btn-dark" style="font-size:12px;opacity:.6;" onclick="doSignOut()">Sign Out</button>'+
    '<p style="font-size:11px;color:rgba(255,255,255,.3);margin-top:16px;">Need help? <a href="mailto:info@beginforever.in" style="color:var(--gold);text-decoration:none;">info@beginforever.in</a></p>';
}

async function startResubmit(){
  if(!confirm('This will let you edit and resubmit your profile. Continue?')) return;
  try{await sb.from('profiles').update({status:'resubmitting',rejection_reason:null}).eq('id',U.id);}
  catch(x){alert('Error. Please try again.');return;}
  var r=await sb.from('profiles').select('*').eq('id',U.id).limit(1);
  P=r.data&&r.data[0]?r.data[0]:P;
  prefillSetupWizard(P);
  showScr('setupScreen'); step=1; updUI();
}

function prefillSetupWizard(p){
  setTimeout(function(){
    var fn=document.getElementById('fName');    if(fn) fn.value=p.full_name||'';
    var fa=document.getElementById('fAge');     if(fa) fa.value=p.age||'';
    var fg=document.getElementById('fGender');  if(fg) fg.value=p.gender||'';
    var fr=document.getElementById('fReligion');
    if(fr){fr.value=p.religion||'';toggleDenom();setTimeout(function(){var fd=document.getElementById('fDenom');if(fd&&p.denomination)fd.value=p.denomination;},60);}
    var fst=document.getElementById('fState');
    if(fst){fst.value=p.state||'';fillC();setTimeout(function(){var fc=document.getElementById('fCity');if(fc&&p.city)fc.value=p.city;},60);}
    var fph=document.getElementById('fPhone'); if(fph) fph.value=p.phone||'';
    var frf=document.getElementById('fRegFor');if(frf&&p.registered_by) frf.value=p.registered_by;
    var fe=document.getElementById('fEdu');   if(fe)  fe.value=p.education||'';
    var fo=document.getElementById('fOcc');   if(fo)  fo.value=p.occupation||'';
    var fht=document.getElementById('fHt');   if(fht) fht.value=p.height_cm||'';
    var fmt=document.getElementById('fMT');   if(fmt) fmt.value=p.mother_tongue||'';
    var fms=document.getElementById('fMS');   if(fms) fms.value=p.marital_status||'Never Married';
    var fpmin=document.getElementById('fPMin');if(fpmin) fpmin.value=p.pref_age_min||18;
    var fpmax=document.getElementById('fPMax');if(fpmax) fpmax.value=p.pref_age_max||70;
    var fpd=document.getElementById('fPD');   if(fpd&&p.pref_denomination) fpd.value=p.pref_denomination;
    var fpc=document.getElementById('fPC');   if(fpc) fpc.value=p.pref_city||'';
    photos=[null,null,null,null,null]; idFile=null;
  },100);
}
// ═══════════════════════════════════════════════════════════════
// PROFILE ENRICHMENT — paste these functions into js/profile.js
// ═══════════════════════════════════════════════════════════════

// ── HOBBY / INTEREST CHIPS ────────────────────────────────────
var ALL_HOBBIES = [
  'Reading','Travel','Music','Movies','Cooking','Photography',
  'Fitness','Yoga','Hiking','Cricket','Football','Badminton',
  'Painting','Dancing','Singing','Gaming','Cycling','Swimming',
  'Volunteering','Gardening','Crafts','Writing','Meditation',
  'Fashion','Foodie','Cars','Tech','Startups'
];

var _selectedHobbies = [];

function renderHobbyChips(containerId, selectedArr) {
  var c = document.getElementById(containerId); if (!c) return;
  c.innerHTML = '';
  ALL_HOBBIES.forEach(function(h) {
    var on = selectedArr.indexOf(h) > -1;
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = h;
    chip.style.cssText =
      'padding:6px 12px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;' +
      'font-family:Nunito,sans-serif;transition:all .15s;margin:3px;' +
      'border:1px solid ' + (on ? 'var(--gold)' : 'rgba(255,255,255,.18)') + ';' +
      'background:' + (on ? 'rgba(212,160,23,.2)' : 'rgba(255,255,255,.05)') + ';' +
      'color:' + (on ? '#F5C842' : 'rgba(255,255,255,.5)') + ';';
    chip.onclick = function() {
      var ix = selectedArr.indexOf(h);
      if (ix > -1) selectedArr.splice(ix, 1); else selectedArr.push(h);
      renderHobbyChips(containerId, selectedArr);
    };
    c.appendChild(chip);
  });
}

// ── RENDER ENRICHED PROFILE CARD ─────────────────────────────
function renderEnrichedProfile() {
  // Hobbies
  var hob = document.getElementById('profileHobbies'); if (!hob) return;
  var hobbies = [];
  try { hobbies = JSON.parse(P.hobbies || '[]'); } catch(e) {}
  if (hobbies.length) {
    hob.style.display = '';
    var pills = document.getElementById('hobbyPills');
    if (pills) pills.innerHTML = hobbies.map(function(h) {
      return '<span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(212,160,23,.35);background:rgba(212,160,23,.1);color:#F5C842;margin:2px;">' + h + '</span>';
    }).join('');
  } else { hob.style.display = 'none'; }

  // Looking for
  var lf = document.getElementById('profileLookingFor'); if (lf) {
    if (P.looking_for) { lf.style.display = ''; document.getElementById('lookingForText').textContent = P.looking_for; }
    else lf.style.display = 'none';
  }

  // Faith & Beliefs card
  var fb = document.getElementById('profileFaithBeliefs'); if (fb) {
    fb.style.display = '';
    var rows = '';
    if (P.church_attendance) rows += '<div class="info-row"><span class="info-label">Church</span><span class="info-value">' + P.church_attendance + '</span></div>';
    if (P.faith_importance)  rows += '<div class="info-row"><span class="info-label">Faith matters</span><span class="info-value">' + P.faith_importance + '</span></div>';
    if (P.is_baptised !== null && P.is_baptised !== undefined) rows += '<div class="info-row"><span class="info-label">Baptised</span><span class="info-value">' + (P.is_baptised ? 'Yes' : 'No') + '</span></div>';
    if (!rows) fb.style.display = 'none';
    var fbc = document.getElementById('faithBeliefsContent'); if (fbc) fbc.innerHTML = rows;
  }

  // Lifestyle card
  var ls = document.getElementById('profileLifestyle'); if (ls) {
    var lrows = '';
    if (P.diet)     lrows += '<div class="info-row"><span class="info-label">Diet</span><span class="info-value">' + P.diet + '</span></div>';
    if (P.smoking)  lrows += '<div class="info-row"><span class="info-label">Smoking</span><span class="info-value">' + P.smoking + '</span></div>';
    if (P.drinking) lrows += '<div class="info-row"><span class="info-label">Drinking</span><span class="info-value">' + P.drinking + '</span></div>';
    if (P.exercise) lrows += '<div class="info-row"><span class="info-label">Exercise</span><span class="info-value">' + P.exercise + '</span></div>';
    ls.style.display = lrows ? '' : 'none';
    var lsc = document.getElementById('lifestyleContent'); if (lsc) lsc.innerHTML = lrows;
  }

  // Privacy status badge
  var pvb = document.getElementById('privacyBadge'); if (pvb) {
    pvb.textContent =
      'Photos: ' + (P.photos_visible_to === 'all' ? 'Everyone' : P.photos_visible_to === 'interests_only' ? 'Interests only' : 'Hidden') +
      ' · Contact: ' + (P.contact_visible_to === 'premium' ? 'Premium members' : P.contact_visible_to === 'interests_only' ? 'Interests only' : 'Hidden');
  }
}

// ── PRIVACY MODAL ─────────────────────────────────────────────
function openPrivacySettings() {
  var m = document.getElementById('privacyModal'); if (!m) return;
  var pv = document.getElementById('pvPhotos');     if (pv) pv.value = P.photos_visible_to  || 'all';
  var pc = document.getElementById('pvContact');    if (pc) pc.value = P.contact_visible_to || 'premium';
  var pp = document.getElementById('pvProfile');    if (pp) pp.value = P.profile_visible_to || 'all';
  m.classList.add('show');
}
function closePrivacySettings() {
  var m = document.getElementById('privacyModal'); if (m) m.classList.remove('show');
}
async function savePrivacySettings() {
  var pv = document.getElementById('pvPhotos').value;
  var pc = document.getElementById('pvContact').value;
  var pp = document.getElementById('pvProfile').value;
  var btn = document.getElementById('pvSaveBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  try {
    await sb.from('profiles').update({
      photos_visible_to: pv,
      contact_visible_to: pc,
      profile_visible_to: pp
    }).eq('id', U.id);
    if (P) { P.photos_visible_to = pv; P.contact_visible_to = pc; P.profile_visible_to = pp; }
    closePrivacySettings();
    renderEnrichedProfile();
  } catch(x) { alert('Could not save. Please try again.'); }
  if (btn) { btn.disabled = false; btn.textContent = 'Save Privacy Settings'; }
}

// ── UPDATE FAITH in Edit Profile ──────────────────────────────
function updateEditReligionDenoms() {
  var r = document.getElementById('eReligion'); if (!r) return;
  var rel = r.value;
  var DENOM_MAP_EDIT = {
    Christian: ['Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','SDA','Orthodox','Mar Thoma','Brethren','Lutheran','Anglican','Non-Denom'],
    Hindu:     ['Shaivism','Vaishnavism','Shaktism','ISKCON','Arya Samaj'],
    Muslim:    ['Sunni','Shia','Sufi','Ahmadiyya','Ismaili'],
    Sikh:      ['Amritdhari','Sahajdhari','Nanakpanthi']
  };
  var dg = document.getElementById('eDenomGroup'); if (!dg) return;
  var dd = document.getElementById('eDenom'); if (!dd) return;
  var list = DENOM_MAP_EDIT[rel] || [];
  if (list.length) {
    dg.style.display = '';
    dd.innerHTML = '<option value="">Select denomination</option>' + list.map(function(d){ return '<option>'+d+'</option>'; }).join('');
    if (P && P.denomination) dd.value = P.denomination;
  } else { dg.style.display = 'none'; }
}
