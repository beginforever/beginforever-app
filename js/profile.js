// ═══════════════════════════════════════════════════════════
// Begin Forever — Photo Upload Fix
// ═══════════════════════════════════════════════════════════

function compressImage(file, maxWidth, quality) {
  maxWidth = maxWidth || 1200;
  quality = quality || 0.82;
  return new Promise(function(resolve) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function(blob) {
          if (!blob) { resolve(file); return; }
          var compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          resolve(compressed);
        }, 'image/jpeg', quality);
      };
      img.onerror = function() { resolve(file); };
      img.src = e.target.result;
    };
    reader.onerror = function() { resolve(file); };
    reader.readAsDataURL(file);
  });
}

function initPG() {
  var g = document.getElementById('photoGrid');
  if (!g) return;
  g.innerHTML = '';
  for (var i = 0; i < 5; i++) {
    _makePhotoSlot(g, i, 'ps', 'pi', photos, false);
  }
}

function initEditPG() {
  var g = document.getElementById('epGrid');
  if (!g) return;
  g.innerHTML = '';
  var urls = [P.photo_url, P.photo_2_url, P.photo_3_url, P.photo_4_url, P.photo_5_url];
  editPhotos = [null, null, null, null, null];
  for (var i = 0; i < 5; i++) {
    _makePhotoSlot(g, i, 'eps', 'epi', editPhotos, true, urls[i]);
  }
}

function _makePhotoSlot(grid, idx, slotPrefix, inputPrefix, photoArr, isEdit, existingUrl) {
  var slot = document.createElement('div');
  slot.className = 'photo-slot';
  slot.id = slotPrefix + idx;
  if (existingUrl) {
    slot.style.backgroundImage = 'url(' + existingUrl + ')';
    slot.style.backgroundSize = 'cover';
    slot.style.backgroundPosition = 'center';
    slot.style.borderColor = 'var(--gold)';
    slot.style.borderStyle = 'solid';
  } else {
    var icon = document.createElement('span');
    icon.style.cssText = 'font-size:15px;opacity:.4;pointer-events:none;';
    icon.textContent = '📷';
    var label = document.createElement('span');
    label.style.cssText = 'font-size:9px;color:var(--w40);pointer-events:none;';
    label.textContent = idx === 0 ? 'Main *' : '# ' + (idx + 1);
    slot.appendChild(icon);
    slot.appendChild(label);
  }
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.id = inputPrefix + idx;
  inp.style.display = 'none';
  slot.appendChild(inp);
  slot.addEventListener('click', function() { inp.click(); });
  inp.addEventListener('change', function() {
    var f = inp.files[0];
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) {
      alert('Photo is too large (max 20MB). Please choose a smaller image.');
      inp.value = '';
      return;
    }
    _handlePhotoSelected(slot, inp, idx, f, photoArr);
  });
  grid.appendChild(slot);
}

function _handlePhotoSelected(slot, inp, idx, file, photoArr) {
  var previewURL = URL.createObjectURL(file);
  slot.style.backgroundImage = 'url(' + previewURL + ')';
  slot.style.backgroundSize = 'cover';
  slot.style.backgroundPosition = 'center';
  slot.style.borderColor = 'var(--gold)';
  slot.style.borderStyle = 'solid';
  Array.from(slot.childNodes).forEach(function(child) {
    if (child !== inp && child.tagName !== 'INPUT') slot.removeChild(child);
  });
  var spinner = document.createElement('div');
  spinner.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;border-radius:inherit;pointer-events:none;';
  spinner.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#C13DBF;border-radius:50%;animation:spin .6s linear infinite;"></div>';
  slot.style.position = 'relative';
  slot.appendChild(spinner);
  compressImage(file).then(function(compressed) {
    photoArr[idx] = compressed;
    if (spinner.parentNode) slot.removeChild(spinner);
    var kb = Math.round(compressed.size / 1024);
    var badge = document.createElement('div');
    badge.style.cssText = 'position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,.6);color:#4ade80;font-size:9px;font-weight:700;padding:2px 5px;border-radius:4px;pointer-events:none;';
    badge.textContent = kb < 1024 ? kb + 'KB' : (kb/1024).toFixed(1) + 'MB';
    slot.appendChild(badge);
  });
}

function pickP(i, inp) {
  var f = inp.files[0]; if (!f) return;
  var slot = document.getElementById('ps' + i);
  if (slot) _handlePhotoSelected(slot, inp, i, f, photos);
}

function pickEP(i, inp) {
  var f = inp.files[0]; if (!f) return;
  var slot = document.getElementById('eps' + i);
  if (slot) _handlePhotoSelected(slot, inp, i, f, editPhotos);
}

// ═══════════════════════════════════════════════════════════
// Begin Forever — Profile v18
// ═══════════════════════════════════════════════════════════

var _setupPrefReligions = [];
var _profileToastTimer = null;

function showProfileToast() {
  if (!P || P.status !== 'approved') return;
  var missing = !P.bio || !P.diet || !P.smoking || !P.drinking || !P.hobbies || P.hobbies === '[]';
  if (!missing) return;
  if (document.getElementById('profileCompletionToast')) return;
  var tHome = document.getElementById('tHome');
  if (!tHome || tHome.style.display === 'none') return;
  var toast = document.createElement('div');
  toast.id = 'profileCompletionToast';
  toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#3B0764;border:1px solid rgba(155,48,201,.5);color:#C13DBF;padding:14px 40px 14px 18px;border-radius:14px;font-size:13px;font-weight:700;z-index:9998;text-align:center;max-width:320px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.5);line-height:1.5;';
  var closeBtn = document.createElement('button');
  closeBtn.style.cssText = 'position:absolute;top:8px;right:10px;background:none;border:none;color:rgba(193,61,191,.6);font-size:18px;cursor:pointer;line-height:1;';
  closeBtn.textContent = '✕';
  closeBtn.onclick = function(){_dismissProfileToast();};
  var msg = document.createElement('span');
  msg.innerHTML = '✨ Complete your profile to attract better matches!<br/>';
  var completeBtn = document.createElement('button');
  completeBtn.style.cssText = 'margin-top:10px;background:#C13DBF;color:#3B0764;border:none;border-radius:8px;padding:8px 18px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;display:block;width:100%;';
  completeBtn.textContent = 'Complete Now →';
  completeBtn.onclick = function(){goTab('profile');openEdit();_dismissProfileToast();};
  toast.appendChild(closeBtn);
  toast.appendChild(msg);
  toast.appendChild(completeBtn);
  document.body.appendChild(toast);
  setTimeout(function() { _dismissProfileToast(true); }, 8000);
}

function _dismissProfileToast(requeue) {
  var t = document.getElementById('profileCompletionToast');
  if (t) t.remove();
  if (_profileToastTimer) clearTimeout(_profileToastTimer);
  if (requeue !== false) {
    _profileToastTimer = setTimeout(function() { showProfileToast(); }, 5 * 60 * 1000);
  }
}

function _handleToastOnTabChange(tab) {
  if (tab !== 'home') {
    var t = document.getElementById('profileCompletionToast');
    if (t) t.remove();
  } else {
    setTimeout(showProfileToast, 800);
  }
}

async function loadP() {
  if (!U) {
    try { var s2 = await sb.auth.getUser(); if (s2.data && s2.data.user) U = s2.data.user; } catch(x) {}
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
    alert('This account has been deleted.');
    await sb.auth.signOut(); U = null; P = null; showScr('loginScreen'); return;
  }
  if (P.status === 'deactivated') {
    if (confirm('Your account is deactivated. Reactivate now?')) {
      try { await sb.from('profiles').update({ status: 'approved', deactivated_at: null }).eq('id', U.id); P.status = 'approved'; }
      catch(x) { alert('Could not reactivate.'); await sb.auth.signOut(); U = null; P = null; showScr('loginScreen'); return; }
    } else { await sb.auth.signOut(); U = null; P = null; showScr('loginScreen'); return; }
  }
  try { fpBrowse  = P.faith_browse  ? JSON.parse(P.faith_browse)  : FAITHS.map(function(f){return f.key;}); } catch(x) { fpBrowse  = FAITHS.map(function(f){return f.key;}); }
  try { fpReceive = P.faith_receive ? JSON.parse(P.faith_receive) : FAITHS.map(function(f){return f.key;}); } catch(x) { fpReceive = FAITHS.map(function(f){return f.key;}); }
  if (P.is_admin) {
    var bar = document.getElementById('tBar');
    if (bar && !document.getElementById('adTab')) {
      var ab = document.createElement('button');
      ab.className = 'tab-btn'; ab.id = 'adTab'; ab.onclick = function(){goTab('admin');};
      ab.innerHTML = '<span class="tab-icon">⚙️</span><span class="tab-label">Admin</span>';
      bar.appendChild(ab);
    }
  }
  try { if (typeof checkAndExpireSubscription==='function') await checkAndExpireSubscription(); } catch(x) {}
  try { if (typeof activateFoundingPremium==='function') await activateFoundingPremium(); } catch(x) {}
  if (P.status === 'approved' && P.onboarding_completed !== true && typeof needsOnboarding==='function' && needsOnboarding()) {
    startOnboarding(); return;
  }
  showScr('mainApp');
  goTab('home');
  checkNotifs();
  if (P.status === 'approved' && P.onboarding_completed === true) {
    setTimeout(showProfileToast, 2000);
  }
}

function toggleDenom() {
  var r = document.getElementById('fReligion').value;
  var denoms = DENOM_MAP[r] || [];
  var dg = document.getElementById('denomGroup'), dd = document.getElementById('fDenom');
  if (denoms.length > 0) {
    dg.style.display = '';
    dd.innerHTML = '<option value="">Select denomination</option>' + denoms.map(function(d){return '<option>'+d+'</option>';}).join('');
  } else { dg.style.display = 'none'; }
}

function filterPrefDenoms() {
  var rel = document.getElementById('fPR'), den = document.getElementById('fPD');
  if (!rel||!den) return;
  var map = { Christian:['Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','Orthodox','Mar Thoma','Brethren','Lutheran','Anglican','Non-Denom'], Hindu:['Shaivism','Vaishnavism','Shaktism','ISKCON','Arya Samaj'], Muslim:['Sunni','Shia','Sufi','Ahmadiyya','Ismaili'], Sikh:['Amritdhari','Sahajdhari','Nanakpanthi'], Jain:['Digambara','Shvetambara'], Buddhist:['Theravada','Mahayana','Vajrayana','Zen'], Jewish:['Orthodox','Conservative','Reform'], Parsi:['Zoroastrian'], Any:['Any Denomination'] };
  var options = map[rel.value] || ['Any Denomination'];
  den.innerHTML = options.map(function(o){return '<option value="'+o+'">'+o+'</option>';}).join('');
}

function fillC() {
  var s = document.getElementById('fState').value, c = document.getElementById('fCity');
  c.innerHTML = '<option value="">Select city</option>';
  (CT[s]||[]).forEach(function(v){c.innerHTML+='<option>'+v+'</option>';});
}

function pickId(inp) {
  var f=inp.files[0]; if(!f||f.size>5*1024*1024){alert('Max 5MB');return;}
  idFile=f;
  document.getElementById('idSlot').innerHTML='<span style="font-size:28px">✅</span><br/><span style="font-size:11px;color:var(--gold2)">ID uploaded</span><input type="file" accept="image/*,.pdf" id="idInp" style="display:none" onchange="pickId(this)"/>';
  var idN=document.getElementById('idN'); if(idN){idN.textContent='📄 '+f.name;idN.style.display='';}
}

function updUI() {
  var titles=['Personal Details','About You','Photos','Government ID','Match Preferences'];
  var st=document.getElementById('sTitle'); if(st) st.textContent=titles[step-1];
  var sl=document.getElementById('sLabel'); if(sl) sl.textContent='Step '+step+' of 5';
  document.querySelectorAll('#sDots .step-dot').forEach(function(d,i){d.classList.toggle('active',i<step);});
  for(var i=1;i<=5;i++){var el=document.getElementById('s'+i);if(el)el.style.display=(i===step)?'':'none';}
  var bk=document.getElementById('bkBtn'); if(bk) bk.style.display=step>1?'':'none';
  var nx=document.getElementById('nxBtn'); if(nx) nx.textContent=step<5?'Next →':'Submit for Review ✦';
  var se=document.getElementById('sErr'); if(se) se.style.display='none';
  if(step===3) initPG();
  if(step===5) {
    setTimeout(function(){
      var chipsEl=document.getElementById('fPRChips'); if(!chipsEl) return;
      var ALL_REL=['Christian','Hindu','Muslim','Sikh','Jain','Buddhist','Parsi','Jewish','Spiritual','Other'];
      chipsEl.innerHTML='';
      ALL_REL.forEach(function(r){
        var on=_setupPrefReligions.indexOf(r)>-1;
        var btn=document.createElement('button');
        btn.type='button'; btn.textContent=r;
        btn.style.cssText='padding:8px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;font-family:Nunito,sans-serif;border:1px solid '+(on?'var(--gold)':'rgba(255,255,255,.2)')+';background:'+(on?'rgba(155,48,201,.2)':'rgba(255,255,255,.05)')+';color:'+(on?'#C13DBF':'rgba(255,255,255,.6)')+';margin-bottom:4px;transition:all .15s;';
        btn.onclick=function(){
          var ix=_setupPrefReligions.indexOf(r);
          if(ix>-1) _setupPrefReligions.splice(ix,1); else _setupPrefReligions.push(r);
          chipsEl.querySelectorAll('button').forEach(function(b){
            var sel=_setupPrefReligions.indexOf(b.textContent)>-1;
            b.style.borderColor=sel?'var(--gold)':'rgba(255,255,255,.2)';
            b.style.background=sel?'rgba(155,48,201,.2)':'rgba(255,255,255,.05)';
            b.style.color=sel?'#C13DBF':'rgba(255,255,255,.6)';
          });
        };
        chipsEl.appendChild(btn);
      });
    },50);
  }
  if(step===1) {
    var verifiedPhone=''; try{verifiedPhone=sessionStorage.getItem('bf_verified_phone')||'';}catch(x){}
    if(verifiedPhone) {
      setTimeout(function(){
        var pg=document.getElementById('fPhoneGroup');
        if(pg){
          pg.style.display='none';
          if(!document.getElementById('phoneVerifiedBadge')){
            var badge=document.createElement('div');
            badge.id='phoneVerifiedBadge';
            badge.style.cssText='background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;';
            badge.innerHTML='<span style="font-size:18px;">✅</span><div><p style="font-size:12px;font-weight:700;color:#4ade80;margin:0;">Phone Verified</p><p style="font-size:11px;color:rgba(255,255,255,.5);margin:0;">'+verifiedPhone+'</p></div>';
            pg.parentNode.insertBefore(badge,pg);
          }
        }
      },50);
    }
  }
}

function goBack(){if(step>1){step--;updUI();}}

async function goNext(){
  var e=document.getElementById('sErr'); if(e) e.style.display='none';
  if(step===1){
    var verifiedPhone=''; try{verifiedPhone=sessionStorage.getItem('bf_verified_phone')||'';}catch(x){}
    var phoneVal=verifiedPhone||(document.getElementById('fPhone')?document.getElementById('fPhone').value.trim():'');
    if(!document.getElementById('fName').value.trim()||!document.getElementById('fAge').value||!document.getElementById('fGender').value||!document.getElementById('fReligion').value||!document.getElementById('fState').value||!document.getElementById('fCity').value||!phoneVal){
      if(e){e.textContent='Please fill all required fields.';e.style.display='block';} return;
    }
    step++;updUI();return;
  }
  if(step===2){step++;updUI();return;}
  if(step===3){
    if(!photos[0]){if(e){e.textContent='Primary photo is required.';e.style.display='block';}return;}
    step++;updUI();return;
  }
  if(step===4){
    if(!document.getElementById('fIdT').value||!idFile){if(e){e.textContent='ID type and upload are required.';e.style.display='block';}return;}
    step++;updUI();return;
  }
  var btn=document.getElementById('nxBtn');
  btn.disabled=true;
  btn.innerHTML='<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.2);border-top-color:var(--gold2);border-radius:50%;animation:spin .6s linear infinite;margin:0 auto;"></div>';
  if(!U){
    try{var sr=await sb.auth.getUser();if(sr.data&&sr.data.user)U=sr.data.user;else{if(e){e.textContent='Session expired.';e.style.display='block';}btn.disabled=false;btn.textContent='Submit for Review ✦';return;}}
    catch(x){if(e){e.textContent='Session error.';e.style.display='block';}btn.disabled=false;btn.textContent='Submit for Review ✦';return;}
  }
  var verifiedPhone=''; try{verifiedPhone=sessionStorage.getItem('bf_verified_phone')||'';}catch(x){}
  var phoneVal=verifiedPhone||(document.getElementById('fPhone')?document.getElementById('fPhone').value.trim():'');
  try {
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
      try{var r2=await sb.storage.from('id-proofs').upload(idP,idFile,{upsert:true});if(!r2.error)idUrl=sb.storage.from('id-proofs').getPublicUrl(idP).data.publicUrl;}
      catch(x){try{var r3=await sb.storage.from('profile-photos').upload(idP,idFile,{upsert:true});if(!r3.error)idUrl=sb.storage.from('profile-photos').getPublicUrl(idP).data.publicUrl;}catch(y){}}
    }
    var FOUNDER_CAP=300;
    var apprRes=await sb.from('profiles').select('id',{count:'exact',head:true}).eq('is_founding_member',true).eq('status','approved');
    var apprCount=apprRes.count||0;
    var allCountRes=await sb.from('profiles').select('id',{count:'exact',head:true});
    var foundingNum=(allCountRes.count||0)+1;
    var qualifiesAsFounder=apprCount<FOUNDER_CAP;
    var allFaithKeys=JSON.stringify(FAITHS.map(function(f){return f.key;}));
    var browseVal=setupBrowse.length>0?JSON.stringify(setupBrowse):allFaithKeys;
    var receiveVal=setupReceive.length>0?JSON.stringify(setupReceive):allFaithKeys;
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
      phone:phoneVal,phone_verified:verifiedPhone?true:false,
      registered_by:document.getElementById('fRegFor').value,
      profile_for:document.getElementById('fRegFor').value,
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
      pref_religion:(_setupPrefReligions.length>0)?_setupPrefReligions[0]:'Any',
      pref_religions:JSON.stringify(_setupPrefReligions.length>0?_setupPrefReligions:['Any']),
      pref_denomination:document.getElementById('fPD').value||'Any',
      pref_city:document.getElementById('fPC').value.trim()||'Any',
      faith_browse:browseVal,faith_receive:receiveVal,
      founding_number:isResubmit?undefined:foundingNum,
      is_founding_member:isResubmit?undefined:qualifiesAsFounder,
      referred_by:isResubmit?undefined:(getReferrerId()||null),
      onboarding_completed:false,status:'pending'
    };
    Object.keys(pd).forEach(function(k){if(pd[k]===undefined)delete pd[k];});
    var res=await sb.from('profiles').upsert(pd,{onConflict:'id'});
    if(res.error) throw res.error;
    try{fetch(SB_URL+'/functions/v1/smart-function',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SB_KEY},body:JSON.stringify({type:isResubmit?'resubmitted':'pending',full_name:pd.full_name,email:pd.email,phone:pd.phone,city:pd.city,state:pd.state,religion:pd.religion,denomination:pd.denomination||pd.religion,gender:pd.gender,founding_number:foundingNum})});}catch(x){}
    P=pd;
    if(!isResubmit) clearReferrerId();
    if(!isResubmit&&typeof fbq!=='undefined') fbq('track','CompleteRegistration');
    showScr('pendingScreen');
  } catch(ex){
    if(e){e.textContent=ex.message||'Error. Please try again.';e.style.display='block';}
    btn.disabled=false;btn.textContent='Submit for Review ✦';
  }
}

function renP() {
  if(!P) return;
  if(_editMode){renPEditMode();return;}
  var f=faithByKey(P.religion||'Other');
  var ap=[P.photo_url,P.photo_2_url,P.photo_3_url,P.photo_4_url,P.photo_5_url].filter(Boolean);
  var ph=ap[0]?'background-image:url('+ap[0]+');background-size:cover;background-position:center':'';
  var heroEl=document.getElementById('profileHero');
  if(heroEl) heroEl.innerHTML=
    '<div style="width:88px;height:88px;border-radius:50%;margin:0 auto;border:3px solid '+f.color+';'+ph+';background-color:var(--dark3);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 4px rgba(59,7,100,.4);">'+(ap[0]?'':'<span style="font-size:32px;opacity:.3">👤</span>')+'</div>'+
    '<h2 style="font-family:Cinzel,serif;font-size:20px;margin-top:10px;color:#fff;">'+P.full_name+'</h2>'+
    '<p style="color:'+f.color+';font-size:12px;margin-top:3px;">'+f.icon+' '+(P.denomination?P.denomination+' · ':'')+P.religion+'</p>'+
    '<p style="color:var(--w50);font-size:11px;margin-top:2px;">'+P.city+', '+P.state+'</p>'+
    '<span style="display:inline-block;margin-top:8px;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:'+(P.status==='approved'?'var(--green)':'var(--gold)')+';color:'+(P.status==='approved'?'#fff':'#1A0830')+';">'+(P.status==='approved'?'✅ Verified Member':'⏳ Pending Review')+'</span>'+
    (P.founding_number?'<p style="font-size:10px;color:var(--gold);margin-top:6px;">✦ Founding Member #'+P.founding_number+'</p>':'')+
    (isPremiumUser()?'<div style="background:rgba(155,48,201,.1);border:1px solid rgba(155,48,201,.3);border-radius:10px;padding:8px 12px;margin-top:10px;"><p style="font-size:11px;color:#C13DBF;font-weight:700;margin:0;">✦ Premium Active'+(P.subscription_expires_at?' · Expires '+new Date(P.subscription_expires_at).toLocaleDateString('en-IN'):'')+'</p></div>':'')+
    (ap.length>1?'<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:12px;">'+ap.slice(1).map(function(u){return '<div style="width:56px;height:56px;border-radius:10px;background-image:url('+u+');background-size:cover;background-position:center;border:2px solid '+f.color+'"></div>';}).join('')+'</div>':'');
  var h='';
  var rows=[
    {l:'Profile For',v:P.profile_for||P.registered_by},
    {l:'Age',v:P.age},
    {l:'Height',v:P.height_cm?P.height_cm+' cm ('+cmToFtIn(P.height_cm)+')':''},
    {l:'Marital Status',v:P.marital_status},
    {l:'Mother Tongue',v:P.mother_tongue},
    {l:'Education',v:P.education},
    {l:'Occupation',v:P.occupation},
    {l:'Religion',v:P.religion},
    {l:'Denomination',v:P.denomination},
    {l:'Email',v:P.email?P.email.replace(/(.{2}).+(@.+)/,'$1***$2'):''},
    {l:'Phone',v:P.phone?(P.phone.replace(/(\d{2})\d+(\d{2})/,'$1*****$2')+(P.phone_verified?' <span style="background:rgba(39,174,96,.2);color:#4ade80;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;border:1px solid rgba(39,174,96,.4);">✅ Verified</span>':'')):'' }
  ];
  rows.forEach(function(d){
    if(d.v) h+='<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;letter-spacing:.5px;">'+d.l+'</span><span style="font-size:13px;color:var(--w80);font-weight:600;text-align:right;max-width:60%;">'+d.v+'</span></div>';
  });
  if(P.bio) h+='<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--w08);"><p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">About Me</p><p style="font-size:13px;color:var(--w70);line-height:1.7;">'+P.bio+'</p></div>';
  var mi=document.getElementById('mInfo'); if(mi) mi.innerHTML=h;
  var hobbies=[]; try{hobbies=JSON.parse(P.hobbies||'[]');}catch(e){}
  var hobEl=document.getElementById('profileHobbies');
  if(hobEl){
    if(hobbies.length){hobEl.style.display='';var hp=document.getElementById('hobbyPills');if(hp)hp.innerHTML=hobbies.map(function(h2){return '<span style="display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid rgba(155,48,201,.35);background:rgba(155,48,201,.1);color:#C13DBF;margin:2px;">'+h2+'</span>';}).join('');}
    else hobEl.style.display='none';
  }
  var lfEl=document.getElementById('profileLookingFor');
  if(lfEl){if(P.looking_for){lfEl.style.display='';var lft=document.getElementById('lookingForText');if(lft)lft.textContent=P.looking_for;}else lfEl.style.display='none';}
  var fbEl=document.getElementById('profileFaithBeliefs');
  if(fbEl){
    var frows='';
    if(P.faith_importance)frows+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Faith Importance</span><span style="font-size:13px;color:var(--w80);font-weight:600;">'+P.faith_importance+'</span></div>';
    if(P.home_church)frows+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Place of Worship</span><span style="font-size:13px;color:var(--w80);font-weight:600;">'+P.home_church+'</span></div>';
    if(P.scripture)frows+='<div style="margin-top:8px;font-family:\'EB Garamond\',serif;font-style:italic;font-size:13px;color:var(--gold);border-left:3px solid var(--gold);padding-left:10px;">"'+P.scripture+'"</div>';
    fbEl.style.display=frows?'':'none';
    var fbc=document.getElementById('faithBeliefsContent');if(fbc)fbc.innerHTML=frows;
  }
  var lsEl=document.getElementById('profileLifestyle');
  if(lsEl){
    var lrows='';
    if(P.diet)lrows+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Diet</span><span style="font-size:13px;color:var(--w80);font-weight:600;">'+P.diet+'</span></div>';
    if(P.smoking)lrows+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Smoking</span><span style="font-size:13px;color:var(--w80);font-weight:600;">'+P.smoking+'</span></div>';
    if(P.drinking)lrows+='<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--w05);"><span style="font-size:10px;color:var(--w50);text-transform:uppercase;">Drinking</span><span style="font-size:13px;color:var(--w80);font-weight:600;">'+P.drinking+'</span></div>';
    lsEl.style.display=lrows?'':'none';
    var lsc=document.getElementById('lifestyleContent');if(lsc)lsc.innerHTML=lrows;
  }
  var pvb=document.getElementById('privacyBadge');
  if(pvb)pvb.textContent='Photos: '+(P.photos_visible_to==='all'?'Everyone':P.photos_visible_to==='interests_only'?'Interests only':'Hidden')+' · Contact: '+(P.contact_visible_to==='premium'?'Premium members':P.contact_visible_to==='interests_only'?'Interests only':'Hidden');
  renderFaithPrefCard();
  loadStats();
  if(typeof renderReferralCard==='function') renderReferralCard();
}

function renderFaithPrefCard(){
  var el=document.getElementById('profileFaithSummary');if(!el)return;
  var premium=isPremiumUser();
  var lockBadge=premium?'':'<span style="background:#C13DBF;color:#3B0764;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px;margin-left:6px;">✦ PREMIUM</span>';
  var editBtn=premium
    ?'<button onclick="openFaithPrefs()" style="background:rgba(155,48,201,.12);border:1px solid rgba(155,48,201,.3);color:var(--gold2);font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;">Edit ✦</button>'
    :'<button onclick="showSubModal(\'Faith filter\')" style="background:rgba(193,61,191,.12);border:1px solid rgba(193,61,191,.4);color:#C13DBF;font-size:11px;font-weight:700;padding:6px 12px;border-radius:8px;cursor:pointer;font-family:Nunito,sans-serif;">🔒 Unlock</button>';
  el.innerHTML=
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div><p style="font-size:13px;font-weight:700;color:#fff;margin:0;">Faith Preferences'+lockBadge+'</p><p style="font-size:11px;color:var(--w40);margin:3px 0 0;">Who you see &amp; who can reach you</p></div>'+editBtn+'</div>'+
    '<div style="'+(premium?'':'opacity:.45;filter:grayscale(.4);')+'">'+
    '<div style="margin-bottom:10px;"><p style="font-size:9px;font-weight:700;color:var(--w40);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">🔍 Browsing from</p><div id="fpBrowsePills" style="display:flex;flex-wrap:wrap;gap:5px;"></div></div>'+
    '<div><p style="font-size:9px;font-weight:700;color:var(--w40);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">💌 Receiving from</p><div id="fpReceivePills" style="display:flex;flex-wrap:wrap;gap:5px;"></div></div>'+
    '</div>';
  renderFpPills('fpBrowsePills',fpBrowse);
  renderFpPills('fpReceivePills',fpReceive);
}

function renderFpPills(containerId,arr){
  var el=document.getElementById(containerId);if(!el)return;
  if(!arr||arr.length===0){el.innerHTML='<span style="font-size:12px;color:#ff6b6b;font-style:italic;">None selected</span>';return;}
  if(arr.length>=FAITHS.length){el.innerHTML='<span style="font-size:12px;color:var(--w50);font-style:italic;">All faiths</span>';return;}
  el.innerHTML=arr.map(function(k){var f=faithByKey(k);return '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid '+f.color+';background:'+f.bg+';color:'+f.color+';">'+f.icon+' '+k+'</span>';}).join('');
}

function openFaithPrefs(){
  if(!isPreLaunch()&&!isPremiumUser()){if(typeof showSubModal==='function')showSubModal('Faith filter');return;}
  var f=faithByKey(P&&P.religion?P.religion:'Other');
  var iconEl=document.getElementById('fpMyFaithIcon'),nameEl=document.getElementById('fpMyFaithName'),denomEl=document.getElementById('fpMyFaithDenom');
  if(iconEl)iconEl.textContent=f.icon||'🌐';
  if(nameEl)nameEl.textContent=(P&&P.religion)||'Not set';
  if(denomEl)denomEl.textContent=(P&&P.denomination)||'';
  var savedBrowse=[];try{savedBrowse=JSON.parse((P&&P.faith_browse)||'[]');}catch(e){}
  var savedReceive=[];try{savedReceive=JSON.parse((P&&P.faith_receive)||'[]');}catch(e){}
  if(!savedBrowse.length) savedBrowse=FAITHS.map(function(f){return f.key;});
  if(!savedReceive.length) savedReceive=FAITHS.map(function(f){return f.key;});
  var allFaithKeys=FAITHS.map(function(f){return f.key;});
var browseAll=!savedBrowse.length||savedBrowse.length>=allFaithKeys.length;
var allBChk=document.getElementById('fpb_all');
if(allBChk)allBChk.checked=browseAll;
document.querySelectorAll('.fpb-opt').forEach(function(o){o.checked=!browseAll&&savedBrowse.indexOf(o.value)>-1;});
fpUpdateLabel('browse');
var receiveAll=!savedReceive.length||savedReceive.length>=allFaithKeys.length;
var allRChk=document.getElementById('fpr_all');
if(allRChk)allRChk.checked=receiveAll;
document.querySelectorAll('.fpr-opt').forEach(function(o){o.checked=!receiveAll&&savedReceive.indexOf(o.value)>-1;});
fpUpdateLabel('receive');
  var m=document.getElementById('faithModal');if(m)m.classList.add('show');
}

function _setSelectValues(id, arr){
  var s=document.getElementById(id);if(!s)return;
  Array.from(s.options).forEach(function(o){o.selected=arr.indexOf(o.value)>-1;});
}
function _getSelectValues(id){
  var s=document.getElementById(id);if(!s)return FAITHS.map(function(f){return f.key;});
  return Array.from(s.selectedOptions).map(function(o){return o.value;});
}
function fpSelectAll(t){var id=t==='browse'?'fpBrowseSelect':'fpReceiveSelect';var s=document.getElementById(id);if(s)Array.from(s.options).forEach(function(o){o.selected=true;});}
function fpClearAll(t){var id=t==='browse'?'fpBrowseSelect':'fpReceiveSelect';var s=document.getElementById(id);if(s)Array.from(s.options).forEach(function(o){o.selected=false;});}
function closeFaithPrefs(){var m=document.getElementById('faithModal');if(m)m.classList.remove('show');}
function toggleFpDropdown(type){
  var menuId=type==='browse'?'fpBrowseMenu':'fpReceiveMenu';
  var otherId=type==='browse'?'fpReceiveMenu':'fpBrowseMenu';
  var menu=document.getElementById(menuId);
  var other=document.getElementById(otherId);
  if(other)other.style.display='none';
  if(menu)menu.style.display=menu.style.display==='none'?'':'none';
}
function closeAllFpDropdowns(){
  var bm=document.getElementById('fpBrowseMenu');
  var rm=document.getElementById('fpReceiveMenu');
  if(bm)bm.style.display='none';
  if(rm)rm.style.display='none';
}
function fpHandleAll(type){
  var cls=type==='browse'?'fpb-opt':'fpr-opt';
  document.querySelectorAll('.'+cls).forEach(function(o){o.checked=false;});
  fpUpdateLabel(type);
}
function fpUpdateLabel(type){
  var cls=type==='browse'?'fpb-opt':'fpr-opt';
  var allId=type==='browse'?'fpb_all':'fpr_all';
  var labelId=type==='browse'?'fpBrowseLabel':'fpReceiveLabel';
  var selected=Array.from(document.querySelectorAll('.'+cls+':checked')).map(function(o){return o.value;});
  var allChk=document.getElementById(allId);
  var label=document.getElementById(labelId);
  if(!label)return;
  if(selected.length===0){label.textContent='All Faiths';if(allChk)allChk.checked=true;}
  else if(selected.length<=3)label.textContent=selected.join(', ');
  else label.textContent=selected.length+' faiths selected';
  if(selected.length>0&&allChk)allChk.checked=false;
}
async function saveFaithPrefs(){
  var allFaithKeys=FAITHS.map(function(f){return f.key;});
  var browseAllChk=document.getElementById('fpb_all');
  var newBrowse=browseAllChk&&browseAllChk.checked?allFaithKeys:Array.from(document.querySelectorAll('.fpb-opt:checked')).map(function(o){return o.value;});
  var receiveAllChk=document.getElementById('fpr_all');
  var newReceive=receiveAllChk&&receiveAllChk.checked?allFaithKeys:Array.from(document.querySelectorAll('.fpr-opt:checked')).map(function(o){return o.value;});
  if(!newBrowse.length)newBrowse=allFaithKeys;
  if(!newReceive.length)newReceive=allFaithKeys;
  fpBrowse=newBrowse;fpReceive=newReceive;
  var btn=document.getElementById('fpSaveBtn');
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    await sb.from('profiles').update({faith_browse:JSON.stringify(fpBrowse),faith_receive:JSON.stringify(fpReceive)}).eq('id',U.id);
    if(P){P.faith_browse=JSON.stringify(fpBrowse);P.faith_receive=JSON.stringify(fpReceive);}
    closeFaithPrefs();
    if(typeof renderFaithPrefCard==='function')renderFaithPrefCard();
  }catch(x){alert('Could not save preferences.');}
  if(btn){btn.disabled=false;btn.textContent='Save Preferences ✦';}
}

var _editMode=false;
var _editHobbies=[],_editMaritalStatuses=[];
var editPhotos=[null,null,null,null,null];

function openEdit(){
  _editMode=true;
  try{_editHobbies=JSON.parse(P.hobbies||'[]');}catch(x){_editHobbies=[];}
  try{_editMaritalStatuses=JSON.parse(P.pref_marital_statuses||'[]');}catch(x){_editMaritalStatuses=[];}
  editPhotos=[null,null,null,null,null];
  renP();
  setTimeout(function(){window.scrollTo({top:0,behavior:'smooth'});},100);
}
function closeEditInline(){
  _editMode=false;
  var tp=document.getElementById('tProfile');
  if(tp)tp.style.background='';
  var mi=document.getElementById('mInfo');
  if(mi)mi.style.cssText='';
  renP();
}
function closeEdit(){var m=document.getElementById('editModal');if(m)m.classList.remove('show');_editMode=false;renP();}

async function saveEditInline(){
  var btn=document.getElementById('eSaveBtn');
  if(btn&&btn.disabled)return;
  var bio=(document.getElementById('e_bio')||{}).value||'';
  var diet=(document.getElementById('e_diet')||{}).value||'';
  var smoking=(document.getElementById('e_smoking')||{}).value||'';
  var drinking=(document.getElementById('e_drinking')||{}).value||'';
  var faithImp=(document.getElementById('e_faithImportance')||{}).value||'';
  if(!bio.trim()){alert('Please write your bio.');return;}
  if(!diet){alert('Please select your diet.');return;}
  if(!smoking){alert('Please select smoking preference.');return;}
  if(!drinking){alert('Please select drinking preference.');return;}
  if(!faithImp){alert('Please select how important faith is.');return;}
  if(_editHobbies.length<3){alert('Please select at least 3 hobbies.');return;}
  if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    var upd={
      bio:bio,
      education:(document.getElementById('e_edu')||{}).value||'',
      occupation:(document.getElementById('e_occ')||{}).value||'',
      looking_for:(document.getElementById('e_lookingFor')||{}).value||'',
      diet:diet,smoking:smoking,drinking:drinking,
      exercise:(document.getElementById('e_exercise')||{}).value||null,
      home_church:(document.getElementById('e_church')||{}).value||null,
      faith_importance:faithImp,
      scripture:(document.getElementById('e_scripture')||{}).value||null,
      hobbies:JSON.stringify(_editHobbies),
      pref_age_min:parseInt((document.getElementById('e_prefAgeMin')||{}).value)||P.pref_age_min||18,
      pref_age_max:parseInt((document.getElementById('e_prefAgeMax')||{}).value)||P.pref_age_max||70,
      pref_city:(document.getElementById('e_prefCity')||{}).value||P.pref_city||'Any',
      pref_denomination:(document.getElementById('e_prefDenom')||{}).value||P.pref_denomination||'Any',
      mother_tongue:(document.getElementById('e_motherTongue')||{}).value||P.mother_tongue||'',
      height_cm:(document.getElementById('e_height')||{}).value?parseInt((document.getElementById('e_height')||{}).value):P.height_cm||null,
      marital_status:(document.getElementById('e_marital')||{}).value||P.marital_status||''
    };
    for(var i=0;i<5;i++){
      if(editPhotos[i]){
        var ext=editPhotos[i].name.split('.').pop();
        var path=U.id+'/p'+i+'_'+Date.now()+'.'+ext;
        var r=await sb.storage.from('profile-photos').upload(path,editPhotos[i],{upsert:true});
        if(!r.error){
          var url=sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;
          var colMap=['photo_url','photo_2_url','photo_3_url','photo_4_url','photo_5_url'];
          upd[colMap[i]]=url;
        }
      }
 }
    await sb.from('profiles').update(upd).eq('id',U.id);
    var r2=await sb.from('profiles').select('*').eq('id',U.id).limit(1);
    if(r2.data&&r2.data.length) P=r2.data[0];
    _dismissProfileToast(false);
    if(btn){
      btn.disabled=false;
      btn.textContent='✅ Saved!';
      btn.style.background='var(--green)';
      setTimeout(function(){
        btn.textContent='Save Changes ✦';
        btn.style.background='';
        _editMode=false;
        renP();
      },1500);
    } else {
      _editMode=false;
      renP();
    }
  }catch(ex){
    alert('Could not save: '+(ex.message||'try again'));
    if(btn){btn.disabled=false;btn.textContent='Save Changes ✦';}
  }
}
async function saveEdit(){await saveEditInline();}

async function viewProfile(id){
  try{await sb.from('profile_views').upsert({viewer_id:U.id,viewed_id:id,viewed_at:new Date().toISOString()},{onConflict:'viewer_id,viewed_id'});}catch(x){}
  var r=await sb.from('profiles').select('*').eq('id',id).limit(1);
  if(!r.data||!r.data.length)return;
  var p=r.data[0],f=faithByKey(p.religion||'Other');
  var ap=[p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(Boolean);
  var premium=isPremiumUser();
  var h='<div style="text-align:center;padding-top:8px">';
  if(ap.length) h+='<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">'+ap.map(function(u){return '<div style="width:70px;height:70px;border-radius:12px;background-image:url('+u+');background-size:cover;background-position:center;border:2px solid '+f.color+'"></div>';}).join('')+'</div>';
  h+='<h2 style="font-family:Cinzel,serif;font-size:20px;color:#fff;">'+p.full_name+', '+p.age+'</h2>';
  h+='<p style="margin-top:4px;"><span style="color:'+f.color+'">'+f.icon+' '+p.religion+'</span>'+(p.denomination?' <span style="color:var(--w50);font-size:12px">· '+p.denomination+'</span>':'')+'</p>';
  h+='<p style="color:var(--w50);font-size:12px;margin-top:3px;">'+p.city+', '+p.state+'</p></div>';
  h+='<div style="background:var(--w05);border-radius:12px;padding:13px;margin-top:14px;">';
  [{l:'Bio',v:p.bio},{l:'Education',v:p.education},{l:'Occupation',v:p.occupation},{l:'Mother Tongue',v:p.mother_tongue},{l:'Marital Status',v:p.marital_status},{l:'Height',v:p.height_cm?p.height_cm+' cm ('+cmToFtIn(p.height_cm)+')':''}].forEach(function(dd){
    if(dd.v) h+='<div style="margin-bottom:9px;"><p style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;">'+dd.l+'</p><p style="font-size:13px;margin-top:2px;color:var(--w80);">'+dd.v+'</p></div>';
  });
  h+='</div>';
  if(!isPreLaunch()){
    if(premium&&(p.phone||p.email)){
      h+='<div style="background:rgba(155,48,201,.08);border:1px solid rgba(155,48,201,.25);border-radius:12px;padding:13px;margin-top:10px;">';
      if(p.phone) h+='<p style="font-size:13px;color:#fff;margin:4px 0;">📱 '+p.phone+(p.phone_verified?' <span style="font-size:9px;color:#4ade80;font-weight:700;">✅ Verified</span>':'')+'</p>';
      if(p.email) h+='<p style="font-size:13px;color:#fff;margin:4px 0;">✉️ '+p.email+'</p>';
      h+='</div>';
    }else if(!premium){
      h+='<div onclick="event.stopPropagation();showSubModal(\'Contact reveal\')" style="background:rgba(193,61,191,.08);border:1px solid rgba(193,61,191,.3);border-radius:12px;padding:13px;margin-top:10px;cursor:pointer;text-align:center;"><p style="font-size:11px;color:#C13DBF;font-weight:700;margin:0 0 4px;">🔒 ✦ PREMIUM</p><p style="font-size:13px;color:#fff;margin:0;">Tap to unlock contact details</p></div>';
    }
  }
  var ir=await sb.from('interests').select('*').eq('from_user',U.id).eq('to_user',id).limit(1);
  var sent=(ir.data&&ir.data.length>0);
  if(!sent && p.id!==U.id){
    if(!isPreLaunch() && !isSubscribed()){
      h+='<button class="btn btn-gold" style="margin-top:16px" onclick="event.stopPropagation();showChatSubModal()">💝 Express Interest <span style="font-size:10px;opacity:.8;">(Subscribe)</span></button>';
    } else {
      h+='<button class="btn btn-gold" style="margin-top:16px" onclick="event.stopPropagation();sendInt(\''+p.id+'\')">💝 Express Interest</button>';
    }
  } else if(sent){
    h+='<p style="text-align:center;color:#4ade80;margin-top:16px;font-size:13px;">✅ Interest sent</p>';
  }
  h+='<div style="display:flex;gap:8px;padding:14px 4px 8px;">';
  h+='<button class="btn btn-dark" style="flex:1;font-size:12px;padding:10px;" onclick="event.stopPropagation();openReportModal(\''+p.id+'\',\''+(p.full_name||'').replace(/[\\\'\"]/g,'')+'\')">🚩 Report</button>';
  h+='<button class="btn btn-dark" style="flex:1;font-size:12px;padding:10px;color:#ff6b6b;" onclick="event.stopPropagation();openBlockModal(\''+p.id+'\',\''+(p.full_name||'').replace(/[\\\'\"]/g,'')+'\')">🚫 Block</button>';
  h+='</div>';
  document.getElementById('pmC').innerHTML=h;
  document.getElementById('profileModal').classList.add('show');
}
function closeModal(){document.getElementById('profileModal').classList.remove('show');}

function renderRejectedScreen(profile){
  var reason=profile.rejection_reason||'Your profile did not meet our verification requirements.';
  var el=document.getElementById('rejectedContent');if(!el)return;
  el.innerHTML='<div style="font-size:48px;margin-bottom:16px;">😔</div>'+
    '<h2 style="font-family:\'Cinzel\',serif;font-size:22px;color:#ff6b6b;margin-bottom:12px;">Profile Not Approved</h2>'+
    '<div style="background:rgba(231,76,60,.1);border:1px solid rgba(231,76,60,.3);border-radius:14px;padding:16px;margin-bottom:20px;text-align:left;">'+
    '<p style="font-size:10px;font-weight:700;color:#ff6b6b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📋 Reason from our team</p>'+
    '<p style="font-size:13px;color:rgba(255,255,255,.8);line-height:1.7;">'+reason+'</p></div>'+
    '<button class="btn btn-gold" style="margin-bottom:12px;" onclick="startResubmit()">✦ Fix &amp; Resubmit Profile</button>'+
    '<button class="btn btn-dark" style="font-size:12px;opacity:.6;" onclick="doSignOut()">Sign Out</button>';
}

async function startResubmit(){
  if(!confirm('This will let you edit and resubmit your profile. Continue?'))return;
  try{await sb.from('profiles').update({status:'resubmitting',rejection_reason:null}).eq('id',U.id);}
  catch(x){alert('Error.');return;}
  var r=await sb.from('profiles').select('*').eq('id',U.id).limit(1);
  P=r.data&&r.data[0]?r.data[0]:P;
  prefillSetupWizard(P);showScr('setupScreen');step=1;updUI();
}

function prefillSetupWizard(p){
  try{var ex=JSON.parse(p.pref_religions||'[]');_setupPrefReligions=ex.length?ex:(p.pref_religion&&p.pref_religion!=='Any'?[p.pref_religion]:[]);}catch(x){_setupPrefReligions=[];}
  setTimeout(function(){
    var fn=document.getElementById('fName');if(fn)fn.value=p.full_name||'';
    var fa=document.getElementById('fAge');if(fa)fa.value=p.age||'';
    var fg=document.getElementById('fGender');if(fg)fg.value=p.gender||'';
    var fr=document.getElementById('fReligion');
    if(fr){fr.value=p.religion||'';toggleDenom();setTimeout(function(){var fd=document.getElementById('fDenom');if(fd&&p.denomination)fd.value=p.denomination;},60);}
    var fst=document.getElementById('fState');
    if(fst){fst.value=p.state||'';fillC();setTimeout(function(){var fc=document.getElementById('fCity');if(fc&&p.city)fc.value=p.city;},60);}
    var fe=document.getElementById('fEdu');if(fe)fe.value=p.education||'';
    var fo=document.getElementById('fOcc');if(fo)fo.value=p.occupation||'';
    var fht=document.getElementById('fHt');if(fht)fht.value=p.height_cm||'';
    var fmt=document.getElementById('fMT');if(fmt)fmt.value=p.mother_tongue||'';
    var fms=document.getElementById('fMS');if(fms)fms.value=p.marital_status||'Never Married';
    photos=[null,null,null,null,null];idFile=null;
  },100);
}

var ALL_HOBBIES=['Reading','Travel','Music','Movies','Cooking','Photography','Fitness','Yoga','Hiking','Cricket','Football','Badminton','Painting','Dancing','Singing','Gaming','Cycling','Swimming','Volunteering','Gardening','Crafts','Writing','Meditation','Fashion','Foodie','Cars','Tech','Startups'];

function renderEditHobbyChips(){
  var c=document.getElementById('eHobbyChips');if(!c)return;c.innerHTML='';
  ALL_HOBBIES.forEach(function(h){
    var on=_editHobbies.indexOf(h)>-1;
    var chip=document.createElement('button');
    chip.type='button';chip.textContent=h;
    chip.style.cssText='padding:6px 11px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;margin:2px;border:1px solid '+(on?'var(--gold)':'rgba(255,255,255,.18)')+';background:'+(on?'rgba(155,48,201,.2)':'rgba(255,255,255,.05)')+';color:'+(on?'#C13DBF':'rgba(255,255,255,.5)')+';';
    chip.onclick=function(){
      var ix=_editHobbies.indexOf(h);
      if(ix>-1)_editHobbies.splice(ix,1);else{if(_editHobbies.length<12)_editHobbies.push(h);}
      renderEditHobbyChips();
      var ct=document.getElementById('eHobbyCount');if(ct)ct.textContent=_editHobbies.length;
    };
    c.appendChild(chip);
  });
}

function openPrivacySettings(){
  var m=document.getElementById('privacyModal');if(!m)return;
  var pv=document.getElementById('pvPhotos');if(pv)pv.value=P.photos_visible_to||'all';
  var pc=document.getElementById('pvContact');if(pc)pc.value=P.contact_visible_to||'premium';
  var pp=document.getElementById('pvProfile');if(pp)pp.value=P.profile_visible_to||'all';
  m.classList.add('show');
}
function closePrivacySettings(){var m=document.getElementById('privacyModal');if(m)m.classList.remove('show');}
async function savePrivacySettings(){
  var pv=document.getElementById('pvPhotos').value;
  var pc=document.getElementById('pvContact').value;
  var pp=document.getElementById('pvProfile').value;
  var btn=document.getElementById('pvSaveBtn');if(btn){btn.disabled=true;btn.textContent='Saving…';}
  try{
    await sb.from('profiles').update({photos_visible_to:pv,contact_visible_to:pc,profile_visible_to:pp}).eq('id',U.id);
    if(P){P.photos_visible_to=pv;P.contact_visible_to=pc;P.profile_visible_to=pp;}
    closePrivacySettings();renP();
  }catch(x){alert('Could not save.');}
  if(btn){btn.disabled=false;btn.textContent='Save Privacy Settings';}
}

function renPEditMode(){
  var heroEl=document.getElementById('profileHero');
  if(heroEl) heroEl.innerHTML=
    '<div style="background:#FDFAF4;border-radius:14px;padding:14px 16px;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;"><p style="font-family:Cinzel,serif;font-size:18px;color:#3B0764;margin:0;">✏️ Edit Profile</p></div>';
  var mi=document.getElementById('mInfo');if(!mi)return;
  var tp=document.getElementById('tProfile');
if(tp)tp.style.background='#1C0530';
  function sel(curVal,opts){return opts.map(function(o){return '<option value="'+o+'"'+(curVal===o?' selected':'')+'>'+o+'</option>';}).join('');}
  function inp(id,val,placeholder){return '<input class="field" id="'+id+'" value="'+(val||'')+'" placeholder="'+(placeholder||'')+'"/>';}
  var ap=[P.photo_url,P.photo_2_url,P.photo_3_url,P.photo_4_url,P.photo_5_url].filter(Boolean);
  var photoHtml='<div class="photo-grid" id="epGrid"></div>';
  mi.innerHTML=
    '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Photos</p>'+photoHtml+
    '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">About Me</p>'+
    '<div class="field-group"><label class="field-label">Bio <span style="color:#ff6b6b;">*</span></label><textarea class="field" id="e_bio" style="min-height:90px;resize:vertical;" placeholder="Tell potential matches about yourself...">'+(P.bio||'')+'</textarea></div>'+
    '<div class="field-group"><label class="field-label">What I\'m Looking For</label><textarea class="field" id="e_lookingFor" style="min-height:70px;resize:vertical;" placeholder="Describe what you are looking for...">'+(P.looking_for||'')+'</textarea></div>'+
    '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Basic Details</p>'+
    '<div class="field-group"><label class="field-label">Education</label>'+inp('e_edu',P.education,'e.g. B.Tech, MBA')+'</div>'+
    '<div class="field-group"><label class="field-label">Occupation</label>'+inp('e_occ',P.occupation,'e.g. Software Engineer')+'</div>'+
    '<div class="field-row">'+
      '<div class="field-group"><label class="field-label">Height (cm)</label><input class="field" type="number" id="e_height" value="'+(P.height_cm||'')+'" placeholder="170"/></div>'+
      '<div class="field-group"><label class="field-label">Mother Tongue</label>'+inp('e_motherTongue',P.mother_tongue,'e.g. Tamil')+'</div>'+
    '</div>'+
    '<div class="field-group"><label class="field-label">Marital Status</label><select class="field" id="e_marital"><option value="">Select</option>'+sel(P.marital_status,['Never Married','Divorced','Widowed','Annulled','Awaiting Divorce'])+'</select></div>'+
    '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Faith &amp; Beliefs</p>'+
    '<div class="field-group"><label class="field-label">Faith Importance <span style="color:#ff6b6b;">*</span></label><select class="field" id="e_faithImportance"><option value="">Select</option>'+sel(P.faith_importance,['Very important','Important','Somewhat important','Not important'])+'</select></div>'+
    '<div class="field-group"><label class="field-label">Favourite Scripture</label>'+inp('e_scripture',P.scripture,'e.g. Jeremiah 29:11')+'</div>'+
    '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Lifestyle</p>'+
    '<div class="field-row">'+
      '<div class="field-group"><label class="field-label">Diet <span style="color:#ff6b6b;">*</span></label><select class="field" id="e_diet"><option value="">Select</option>'+sel(P.diet,['Vegetarian','Non-Vegetarian','Vegan','Jain','No preference'])+'</select></div>'+
      '<div class="field-group"><label class="field-label">Exercise</label><select class="field" id="e_exercise"><option value="">Select</option>'+sel(P.exercise,['Daily','Often','Sometimes','Rarely'])+'</select></div>'+
    '</div>'+
    '<div class="field-row">'+
      '<div class="field-group"><label class="field-label">Smoking <span style="color:#ff6b6b;">*</span></label><select class="field" id="e_smoking"><option value="">Select</option>'+sel(P.smoking,['Never','Occasionally','Yes'])+'</select></div>'+
      '<div class="field-group"><label class="field-label">Drinking <span style="color:#ff6b6b;">*</span></label><select class="field" id="e_drinking"><option value="">Select</option>'+sel(P.drinking,['Never','Occasionally','Yes'])+'</select></div>'+
    '</div>'+
    '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;margin:16px 0 4px;">Hobbies <span style="color:#ff6b6b;">*</span> (min 3)</p>'+
    '<p style="font-size:11px;color:var(--w40);margin-bottom:8px;">Selected: <span id="eHobbyCount">'+_editHobbies.length+'</span></p>'+
    '<div id="eHobbyChips" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;"></div>'+
    '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;">Partner Preferences</p>'+
    '<div class="field-row">'+
      '<div class="field-group"><label class="field-label">Min Age</label><input class="field" type="number" id="e_prefAgeMin" value="'+(P.pref_age_min||18)+'" min="18" max="70"/></div>'+
      '<div class="field-group"><label class="field-label">Max Age</label><input class="field" type="number" id="e_prefAgeMax" value="'+(P.pref_age_max||70)+'" min="18" max="70"/></div>'+
    '</div>'+
    '<div class="field-group"><label class="field-label">Preferred Denomination</label><input class="field" id="e_prefDenom" value="'+(P.pref_denomination||'')+'" placeholder="e.g. Any, Catholic"/></div>'+
    '<div class="field-group"><label class="field-label">Preferred City</label>'+inp('e_prefCity',P.pref_city,'e.g. Pune or Any')+'</div>';

  initEditPG();
  renderEditHobbyChips();

  var existing=document.getElementById('profileButtonsBlock');
  if(existing)existing.remove();
  var btnBlock=document.createElement('div');
  btnBlock.id='profileButtonsBlock';
  btnBlock.style.cssText='margin-top:20px;padding-bottom:20px;';
  var saveBtn=document.createElement('button');
  saveBtn.id='eSaveBtn';
  saveBtn.className='btn btn-gold';
  saveBtn.style.marginBottom='10px';
  saveBtn.textContent='Save Changes ✦';
  saveBtn.onclick=function(){saveEditInline();};
  btnBlock.appendChild(saveBtn);
  mi.parentNode.appendChild(btnBlock);

  var hideIds=['profileHobbies','profileLookingFor','profilePartnerPrefs','profileFaithBeliefs','profileLifestyle','profileFaithSummary','referralCard'];
  hideIds.forEach(function(id){var el=document.getElementById(id);if(el)el.style.display='none';});
}
