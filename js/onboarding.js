// Begin Forever — Onboarding v16
// Fixes:
//   - Slide-left bug: onb-foot now uses bottom:0 with safe padding, card uses padding-bottom:120px
//   - After complete: directs user to Profile tab with edit prompt (not home)
//   - onbNext() validates mandatory fields properly
//   - Welcome step shows correctly

var _onbStep = 0;
var _onbRunning = false;
var _onbData = {};
var ONB_STEPS = ['welcome','partner_prefs','family','hobbies','faith_prefs','privacy','done'];
var ALL_RELIGIONS = ['Christian','Hindu','Muslim','Sikh','Jain','Buddhist','Parsi','Jewish','Spiritual','Other'];
var ALL_MARITAL   = ['Never Married','Awaiting Divorce','Divorced','Widowed','Annulled'];

// Inject styles once
var ONB_STYLE = [
  '#onboardingScreen{background:var(--dark1);min-height:100vh;display:block;overflow-y:auto;position:relative;}',
  '.onb-card{background:#FDFAF4;max-width:520px;margin:0 auto;min-height:100vh;padding:28px 22px 140px;box-sizing:border-box;}',
  '.onb-card .field{background:#fff!important;border:1.5px solid rgba(59,7,100,.25)!important;color:#1C0530!important;border-radius:10px!important;}',
  '.onb-card .field:focus{border-color:#3B0764!important;box-shadow:0 0 0 3px rgba(59,7,100,.1)!important;outline:none!important;}',
  '.onb-card .field-label{color:#3B0764!important;font-weight:700!important;}',
  '.onb-card input::placeholder,.onb-card textarea::placeholder{color:rgba(59,7,100,.35)!important;}',
  '.onb-card select option{background:#fff;color:#1C0530;}',
  '.onb-lbl{font-size:10px;font-weight:700;color:#C8960C;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;}',
  // FIX: foot is fixed to bottom of viewport, not the card — card has padding-bottom:140px to clear it
  '.onb-foot{position:fixed;bottom:0;left:0;right:0;max-width:520px;margin:0 auto;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));background:#FDFAF4;border-top:1px solid rgba(59,7,100,.12);display:flex;gap:10px;z-index:200;box-sizing:border-box;}',
  '.onb-title{font-family:Cinzel,serif;font-size:22px;color:#1C0530;margin:0 0 4px;}',
  '.onb-sub{font-size:13px;color:#5B3A7A;margin-bottom:20px;line-height:1.6;}',
  '.onb-chip{padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;border:2px solid #3B0764;background:#3B0764;color:#fff;margin:0 4px 6px 0;display:inline-block;transition:all .15s;}',
  '.onb-chip.on{background:#D4A017;border-color:#D4A017;color:#fff;}',
  '.onb-progress-bg{height:3px;background:rgba(59,7,100,.12);border-radius:2px;margin-bottom:16px;}',
  '.onb-progress-fill{height:3px;background:#D4A017;border-radius:2px;transition:width .3s;}'
].join('\n');

function _injectOnbStyle(){
  if(document.getElementById('onb-style'))return;
  var s=document.createElement('style');s.id='onb-style';s.textContent=ONB_STYLE;
  document.head.appendChild(s);
}
function _removeOnbStyle(){var s=document.getElementById('onb-style');if(s)s.remove();}

function needsOnboarding(){
  if(!P)return false;
  if(P.status!=='approved')return false;
  if(P.onboarding_completed===true)return false;
  return true;
}

function startOnboarding(){
  if(_onbRunning)return;
  _onbRunning=true;
  _onbStep=0;

  var existingRel=[];
  try{existingRel=JSON.parse(P.pref_religions||'[]');}catch(x){}
  if(!existingRel.length&&P.pref_religion&&P.pref_religion!=='Any')existingRel=[P.pref_religion];

  _onbData={
    pref_age_min:P.pref_age_min||21,pref_age_max:P.pref_age_max||45,
    pref_religions:existingRel,pref_marital_statuses:[],
    pref_city:P.pref_city||'',pref_state:'',
    pref_education:P.pref_education||'Any',pref_occupation:P.pref_occupation||'',
    pref_height_min_cm:P.pref_height_min_cm||152,pref_height_max_cm:P.pref_height_max_cm||196,
    income_bracket:P.income_bracket||'',looking_for:P.looking_for||'',
    family_type:P.family_type||'',family_values:P.family_values||'',
    siblings:P.siblings||'',father_occupation:P.father_occupation||'',mother_occupation:P.mother_occupation||'',
    hobbies:[],faith_browse:[],faith_receive:[],
    photos_visible_to:P.photos_visible_to||'all',contact_visible_to:P.contact_visible_to||'premium'
  };
  try{_onbData.pref_marital_statuses=JSON.parse(P.pref_marital_statuses||'[]');}catch(x){}
  try{_onbData.hobbies=JSON.parse(P.hobbies||'[]');}catch(x){}

  var sc=document.getElementById('onboardingScreen');
  if(!sc){_onbRunning=false;showScr('mainApp');goTab('home');return;}

  // Hide mainApp + tabbar during onboarding
  var ma=document.getElementById('mainApp');if(ma)ma.style.display='none';
  var tb=document.getElementById('tBar');if(tb)tb.style.display='none';

  _injectOnbStyle();
  showScr('onboardingScreen');
  _renderOnbStep();
}

function _renderOnbStep(){
  var sc=document.getElementById('onboardingScreen');if(!sc)return;
  var s=ONB_STEPS[_onbStep];
  if(s==='welcome')_onbWelcome(sc);
  else if(s==='partner_prefs')_onbPartnerPrefs(sc);
  else if(s==='family')_onbFamily(sc);
  else if(s==='hobbies')_onbHobbies(sc);
  else if(s==='faith_prefs')_onbFaithPrefs(sc);
  else if(s==='privacy')_onbPrivacy(sc);
  else if(s==='done')_onbComplete();
  // FIX: scroll card to top on each step change
  window.scrollTo({top:0,behavior:'smooth'});
}

function onbNext(){_collectStep();if(!_validateStep())return;if(_onbStep<ONB_STEPS.length-1){_onbStep++;_renderOnbStep();}}
function onbBack(){if(_onbStep>0){_onbStep--;_renderOnbStep();}}

function _collectStep(){
  function val(id){var e=document.getElementById(id);return e?e.value:'';}
  var s=ONB_STEPS[_onbStep];
  if(s==='partner_prefs'){
    _onbData.pref_age_min=parseInt(val('onbAgeMin'))||21;
    _onbData.pref_age_max=parseInt(val('onbAgeMax'))||45;
    _onbData.pref_height_min_cm=parseInt(val('onbHtMinCm'))||152;
    _onbData.pref_height_max_cm=parseInt(val('onbHtMaxCm'))||196;
    _onbData.income_bracket=val('onbIncome');
    _onbData.looking_for=val('onbLookingFor');
    _onbData.pref_education=val('onbEdu');
    _onbData.pref_occupation=val('onbOcc');
    var cityEl=document.getElementById('onbCity');
    var stateEl=document.getElementById('onbState');
    _onbData.pref_city=(cityEl&&cityEl.value&&cityEl.value!=='Any City')?cityEl.value:(stateEl?stateEl.value:'');
  }
  if(s==='family'){
    _onbData.family_type=val('onbFamType');
    _onbData.family_values=val('onbFamVals');
    _onbData.siblings=val('onbSiblings');
    _onbData.father_occupation=val('onbFatherOcc');
    _onbData.mother_occupation=val('onbMotherOcc');
  }
  if(s==='privacy'){
    _onbData.photos_visible_to=val('onbPhotos');
    _onbData.contact_visible_to=val('onbContact');
  }
}

function _validateStep(){
  var s=ONB_STEPS[_onbStep];
  if(s==='partner_prefs'&&!_onbData.pref_religions.length){alert('Please select at least one preferred religion.');return false;}
  if(s==='hobbies'&&_onbData.hobbies.length<3){alert('Please select at least 3 hobbies.');return false;}
  return true;
}

function _onbHdr(title,step,total){
  var pct=Math.round((step/total)*100);
  return '<p style="font-size:10px;font-weight:700;color:#C8960C;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">'+step+' OF '+total+'</p>'+
    '<div class="onb-progress-bg"><div class="onb-progress-fill" style="width:'+pct+'%;"></div></div>'+
    '<h2 class="onb-title">'+title+'</h2>';
}

function _onbFoot(showBack){
  var isLast=_onbStep>=ONB_STEPS.length-2;
  return '<div class="onb-foot">'+
    (showBack?'<button class="btn btn-dark" style="flex:1;color:#3B0764;background:rgba(59,7,100,.08);border:1.5px solid rgba(59,7,100,.2);" onclick="onbBack()">← Back</button>':'')+
    '<button class="btn btn-gold" style="flex:2;" onclick="onbNext()">'+(isLast?'Finish ✦':'Next →')+'</button>'+
    '</div>';
}

function _onbChips(containerId,list,selected,maxSelect,onChange,keepOne){
  var el=document.getElementById(containerId);if(!el)return;
  el.innerHTML='';
  list.forEach(function(item){
    var on=selected.indexOf(item)>-1;
    var btn=document.createElement('button');
    btn.type='button';btn.textContent=item;btn.className='onb-chip'+(on?' on':'');
    btn.onclick=function(){
      var ix=selected.indexOf(item);
      if(ix>-1){if(keepOne&&selected.length<=1)return;selected.splice(ix,1);btn.className='onb-chip';}
      else{if(maxSelect&&selected.length>=maxSelect)return;selected.push(item);btn.className='onb-chip on';}
      if(onChange)onChange();
    };
    el.appendChild(btn);
  });
}

// STEP 0: WELCOME
function _onbWelcome(sc){
  var name=P&&P.full_name?P.full_name.split(' ')[0]:'Friend';
  sc.innerHTML='<div class="onb-card" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 32px 140px;">'+
    '<div style="font-size:56px;margin-bottom:16px;">🎉</div>'+
    '<h2 class="onb-title" style="font-size:26px;margin-bottom:8px;">Congratulations, '+name+'!</h2>'+
    '<p style="font-size:14px;color:#1C0530;font-weight:600;margin-bottom:8px;">Your profile has been <span style="color:#2E7D32;">approved</span>.</p>'+
    '<p style="font-size:13px;color:#5B3A7A;line-height:1.7;margin-bottom:32px;max-width:360px;">Let\'s take 3 minutes to set your match preferences so we can show you the most compatible profiles.</p>'+
    '<button class="btn btn-gold" style="width:auto;padding:14px 36px;" onclick="onbNext()">Set My Preferences →</button>'+
    '</div>';
}

// STEP 1: PARTNER PREFERENCES
function _onbPartnerPrefs(sc){
  var eduOpts=['Any','Graduate and above','Post Graduate','Doctorate','Professional Degree'];
  var incOpts=[{v:'',l:'Select…'},{v:'below_3l',l:'Below ₹3 LPA'},{v:'3_5l',l:'₹3–5 LPA'},{v:'5_10l',l:'₹5–10 LPA'},{v:'10_15l',l:'₹10–15 LPA'},{v:'15_25l',l:'₹15–25 LPA'},{v:'25_50l',l:'₹25–50 LPA'},{v:'above_50l',l:'Above ₹50 LPA'},{v:'prefer_not',l:'Prefer not to say'}];
  var states=['Any','Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Other / Outside India'];

  sc.innerHTML='<div class="onb-card">'+_onbHdr('Partner Preferences',1,5)+
    '<span class="onb-lbl">Age Range *</span>'+
    '<div style="display:flex;gap:10px;margin-bottom:16px;">'+
      '<div style="flex:1;"><label class="field-label">Min</label><input type="number" class="field" id="onbAgeMin" value="'+_onbData.pref_age_min+'" min="18" max="70"/></div>'+
      '<div style="flex:1;"><label class="field-label">Max</label><input type="number" class="field" id="onbAgeMax" value="'+_onbData.pref_age_max+'" min="18" max="70"/></div>'+
    '</div>'+
    '<span class="onb-lbl">Preferred Religion * <span style="font-size:10px;color:#7A6090;text-transform:none;letter-spacing:0;">(select all that apply)</span></span>'+
    '<div id="onbRelChips" style="margin-bottom:16px;"></div>'+
    '<span class="onb-lbl">Preferred Marital Status</span>'+
    '<div id="onbMarChips" style="margin-bottom:16px;"></div>'+
    '<span class="onb-lbl">Preferred Location</span>'+
    '<div style="display:flex;gap:10px;margin-bottom:16px;">'+
      '<div style="flex:1;"><label class="field-label">State</label><select class="field" id="onbState" onchange="_onbLoadCities()">'+states.map(function(s){return '<option'+(s===_onbData.pref_state?' selected':'')+'>'+s+'</option>';}).join('')+'</select></div>'+
      '<div style="flex:1;"><label class="field-label">City</label><select class="field" id="onbCity"><option>Any City</option></select></div>'+
    '</div>'+
    '<div class="field-group"><label class="field-label">Preferred Education</label><select class="field" id="onbEdu">'+eduOpts.map(function(e){return '<option'+(e===_onbData.pref_education?' selected':'')+'>'+e+'</option>';}).join('')+'</select></div>'+
    '<div class="field-group"><label class="field-label">Preferred Job Profile <span style="color:#9B8FAA;font-weight:400;">(optional)</span></label><input class="field" id="onbOcc" value="'+(_onbData.pref_occupation||'')+'" placeholder="e.g. Engineer, Doctor, Any"/></div>'+
    '<div class="field-group"><label class="field-label">What are you looking for? <span style="color:#9B8FAA;font-weight:400;">(optional)</span></label><textarea class="field" id="onbLookingFor" style="min-height:70px;resize:vertical;" placeholder="e.g. Someone who is family-oriented and shares my faith...">'+(_onbData.looking_for||'')+'</textarea></div>'+
    _onbFoot(true)+'</div>';

  _onbChips('onbRelChips',ALL_RELIGIONS,_onbData.pref_religions,null,null,false);
  _onbChips('onbMarChips',ALL_MARITAL,_onbData.pref_marital_statuses,null,null,false);
}

function _onbLoadCities(){
  var st=document.getElementById('onbState');var ct=document.getElementById('onbCity');if(!st||!ct)return;
  ct.innerHTML='<option>Any City</option>';
  if(typeof CT!=='undefined'&&CT[st.value])CT[st.value].forEach(function(c){ct.innerHTML+='<option>'+c+'</option>';});
  if(_onbData.pref_city)ct.value=_onbData.pref_city;
}

// STEP 2: FAMILY
function _onbFamily(sc){
  sc.innerHTML='<div class="onb-card">'+_onbHdr('Family Background',2,5)+
    '<p class="onb-sub">Helps matches understand your background. All optional.</p>'+
    '<div class="field-group"><label class="field-label">Family Type</label><select class="field" id="onbFamType">'+['','Nuclear','Joint','Extended'].map(function(v){return '<option value="'+v+'"'+(v===_onbData.family_type?' selected':'')+'>'+(v||'Select…')+'</option>';}).join('')+'</select></div>'+
    '<div class="field-group"><label class="field-label">Family Values</label><select class="field" id="onbFamVals">'+['','Traditional','Moderate','Liberal'].map(function(v){return '<option value="'+v+'"'+(v===_onbData.family_values?' selected':'')+'>'+(v||'Select…')+'</option>';}).join('')+'</select></div>'+
    '<div class="field-group"><label class="field-label">Siblings</label><select class="field" id="onbSiblings">'+['','Only child','1 sibling','2 siblings','3 or more'].map(function(v){return '<option value="'+v+'"'+(v===_onbData.siblings?' selected':'')+'>'+(v||'Select…')+'</option>';}).join('')+'</select></div>'+
    '<div class="field-group"><label class="field-label">Father\'s Occupation</label><input class="field" id="onbFatherOcc" value="'+(_onbData.father_occupation||'')+'" placeholder="e.g. Business / Retired"/></div>'+
    '<div class="field-group"><label class="field-label">Mother\'s Occupation</label><input class="field" id="onbMotherOcc" value="'+(_onbData.mother_occupation||'')+'" placeholder="e.g. Homemaker / Teacher"/></div>'+
    _onbFoot(true)+'</div>';
}

// STEP 3: HOBBIES
function _onbHobbies(sc){
  var list=(typeof ALL_HOBBIES!=='undefined')?ALL_HOBBIES:['Reading','Travel','Music','Movies','Cooking','Photography','Fitness','Yoga','Hiking','Cricket','Football','Badminton','Painting','Dancing','Singing','Gaming','Cycling','Swimming','Volunteering','Gardening','Crafts','Writing','Meditation','Fashion','Foodie','Cars','Tech','Startups'];
  sc.innerHTML='<div class="onb-card">'+_onbHdr('Hobbies & Interests',3,5)+
    '<p class="onb-sub">Select at least 3 that describe you.</p>'+
    '<p style="font-size:12px;color:#7A6090;margin-bottom:12px;">Selected: <span id="onbHobCount">'+_onbData.hobbies.length+'</span></p>'+
    '<div id="onbHobChips" style="margin-bottom:24px;"></div>'+
    _onbFoot(true)+'</div>';
  _onbChips('onbHobChips',list,_onbData.hobbies,12,function(){var ct=document.getElementById('onbHobCount');if(ct)ct.textContent=_onbData.hobbies.length;});
}

// STEP 4: FAITH PREFS
function _onbFaithPrefs(sc){
  if(!_onbData.faith_browse.length)_onbData.faith_browse=ALL_RELIGIONS.slice();
  if(!_onbData.faith_receive.length)_onbData.faith_receive=ALL_RELIGIONS.slice();
  sc.innerHTML='<div class="onb-card">'+_onbHdr('Faith Preferences',4,5)+
    '<p class="onb-sub">Control who you see and who can reach you. You can change this anytime.</p>'+
    '<span class="onb-lbl">🔍 Browse profiles from</span>'+
    '<div id="onbBrowseChips" style="margin-bottom:20px;"></div>'+
    '<span class="onb-lbl">💌 Receive interests from</span>'+
    '<div id="onbReceiveChips" style="margin-bottom:24px;"></div>'+
    _onbFoot(true)+'</div>';
  _onbChips('onbBrowseChips',ALL_RELIGIONS,_onbData.faith_browse,null,null,true);
  _onbChips('onbReceiveChips',ALL_RELIGIONS,_onbData.faith_receive,null,null,true);
}

// STEP 5: PRIVACY
function _onbPrivacy(sc){
  sc.innerHTML='<div class="onb-card">'+_onbHdr('Privacy Settings',5,5)+
    '<p class="onb-sub">Changeable anytime from Profile → Privacy Settings.</p>'+
    '<div class="field-group"><label class="field-label">📷 Who can see my photos?</label><select class="field" id="onbPhotos"><option value="all"'+(_onbData.photos_visible_to==='all'?' selected':'')+'>Everyone (recommended)</option><option value="interests_only"'+(_onbData.photos_visible_to==='interests_only'?' selected':'')+'>Only mutual interests</option><option value="none"'+(_onbData.photos_visible_to==='none'?' selected':'')+'>Hidden</option></select></div>'+
    '<div class="field-group" style="margin-top:14px;"><label class="field-label">📞 Who can see my contact details?</label><select class="field" id="onbContact"><option value="premium"'+(_onbData.contact_visible_to==='premium'?' selected':'')+'>Premium members only (recommended)</option><option value="interests_only"'+(_onbData.contact_visible_to==='interests_only'?' selected':'')+'>Only mutual interests</option><option value="none"'+(_onbData.contact_visible_to==='none'?' selected':'')+'>Hidden</option></select></div>'+
    '<div style="background:rgba(59,7,100,.05);border:1px solid rgba(59,7,100,.12);border-radius:10px;padding:12px;margin-top:16px;font-size:11px;color:#5B3A7A;line-height:1.6;">🛡️ Begin Forever never shares your data with third parties. Your ID is for verification only.</div>'+
    _onbFoot(true)+'</div>';
}

// COMPLETE — save everything then go to Profile tab with prompt
async function _onbComplete(){
  var sc=document.getElementById('onboardingScreen');
  if(sc) sc.innerHTML='<div style="min-height:100vh;background:#1C0530;display:flex;align-items:center;justify-content:center;"><div style="background:#FDFAF4;border-radius:20px;padding:48px 40px;text-align:center;max-width:320px;width:90%;"><div class="spinner" style="margin:0 auto 20px;border-top-color:#3B0764;"></div><p style="color:#1C0530;font-family:Cinzel,serif;font-size:16px;margin:0;">Saving your preferences…</p><p style="color:#7A6090;font-size:12px;margin-top:8px;">Almost there!</p></div></div>';

  try{
    var upd={
      onboarding_completed:true,
      pref_age_min:_onbData.pref_age_min,pref_age_max:_onbData.pref_age_max,
      pref_religions:JSON.stringify(_onbData.pref_religions),
      pref_religion:_onbData.pref_religions.length===1?_onbData.pref_religions[0]:'Any',
      pref_marital_statuses:JSON.stringify(_onbData.pref_marital_statuses),
      pref_city:_onbData.pref_city||'Any',
      pref_education:_onbData.pref_education||'Any',
      pref_occupation:_onbData.pref_occupation||'',
      pref_height_min_cm:_onbData.pref_height_min_cm,pref_height_max_cm:_onbData.pref_height_max_cm,
      income_bracket:_onbData.income_bracket||null,
      looking_for:_onbData.looking_for,
      family_type:_onbData.family_type||null,family_values:_onbData.family_values||null,
      siblings:_onbData.siblings||null,
      father_occupation:_onbData.father_occupation||null,mother_occupation:_onbData.mother_occupation||null,
      hobbies:JSON.stringify(_onbData.hobbies),
      faith_browse:JSON.stringify(_onbData.faith_browse.length?_onbData.faith_browse:ALL_RELIGIONS),
      faith_receive:JSON.stringify(_onbData.faith_receive.length?_onbData.faith_receive:ALL_RELIGIONS),
      photos_visible_to:_onbData.photos_visible_to,contact_visible_to:_onbData.contact_visible_to
    };
    var res=await sb.from('profiles').update(upd).eq('id',U.id);
    if(res.error)throw res.error;
    var r2=await sb.from('profiles').select('*').eq('id',U.id).limit(1);
    if(r2.data&&r2.data.length)P=r2.data[0];
  }catch(ex){console.warn('Onboarding save error:',ex.message);}

  _removeOnbStyle();
  _onbRunning=false;

  // Restore tabbar and mainApp
  var tb=document.getElementById('tBar');if(tb)tb.style.display='';
  var ma=document.getElementById('mainApp');if(ma){ma.style.display='block';ma.classList.add('active');}
  var obs=document.getElementById('onboardingScreen');if(obs){obs.style.display='none';obs.classList.remove('active');}

  showScr('mainApp');
  checkNotifs();

  // FIX: go to Profile tab and prompt user to complete their profile details
  goTab('profile');
  setTimeout(function(){
    var toast=document.createElement('div');
    toast.style.cssText='position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#3B0764;border:1px solid rgba(212,160,23,.4);color:#F5C842;padding:14px 20px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;text-align:center;max-width:320px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.5);line-height:1.5;';
    toast.innerHTML='✨ Almost done! Add your bio, lifestyle &amp; hobbies to attract better matches.<br/><button onclick="openEdit();this.closest(\'div\').remove();" style="margin-top:10px;background:#F5C842;color:#3B0764;border:none;border-radius:8px;padding:8px 18px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;">Complete Profile →</button>';
    document.body.appendChild(toast);
  },600);
}
