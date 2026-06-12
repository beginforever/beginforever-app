// Begin Forever — Onboarding v121
// Fix: _onbFaithPrefs() closing brace was missing — caused JS crash on Step 4
// Fix: _onbPrivacy() now correctly separate from _onbFaithPrefs()

var _onbStep = 0;
var _onbRunning = false;
var _onbData = {};
var ONB_STEPS = ['welcome','intent','partner_prefs','family','hobbies','faith_prefs','privacy','done'];
var ALL_RELIGIONS = ['Christian','Hindu','Muslim','Sikh','Jain','Buddhist','Parsi','Jewish','Spiritual','Other'];
var ALL_MARITAL   = ['Never Married','Awaiting Divorce','Divorced','Widowed','Annulled'];

var ONB_STYLE = [
  '#onboardingScreen{background:var(--dark1);min-height:100vh;display:block;overflow-y:auto;position:relative;}',
  '.onb-card{background:#FDFAF4;max-width:520px;margin:0 auto;min-height:100vh;padding:28px 22px 140px;box-sizing:border-box;}',
  '.onb-card .field{background:#fff!important;border:1.5px solid rgba(59,7,100,.25)!important;color:#1C0530!important;border-radius:10px!important;}',
  '.onb-card .field:focus{border-color:#3B0764!important;box-shadow:0 0 0 3px rgba(59,7,100,.1)!important;outline:none!important;}',
  '.onb-card .field-label{color:#3B0764!important;font-weight:700!important;}',
  '.onb-card input::placeholder,.onb-card textarea::placeholder{color:rgba(59,7,100,.35)!important;}',
  '.onb-card select option{background:#fff;color:#1C0530;}',
  '.onb-lbl{font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:8px;}',
  '.onb-foot{position:fixed;bottom:0;left:0;right:0;max-width:520px;margin:0 auto;padding:14px 20px calc(14px + env(safe-area-inset-bottom,0px));background:#FDFAF4;border-top:1px solid rgba(59,7,100,.12);display:flex;gap:10px;z-index:200;box-sizing:border-box;}',
  '.onb-title{font-family:Cinzel,serif;font-size:22px;color:#1C0530;margin:0 0 4px;}',
  '.onb-sub{font-size:13px;color:#5B3A7A;margin-bottom:20px;line-height:1.6;}',
  '.onb-chip{padding:8px 14px;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;font-family:Nunito,sans-serif;border:2px solid #3B0764;background:#3B0764;color:#fff;margin:0 4px 6px 0;display:inline-block;transition:all .15s;}',
  '.onb-chip.on{background:#F24E96;border-color:#F24E96;color:#fff;}',
  '.onb-progress-bg{height:3px;background:rgba(59,7,100,.12);border-radius:2px;margin-bottom:16px;}',
  '.onb-progress-fill{height:3px;background:linear-gradient(135deg,#F24E96,#9B30C9);border-radius:2px;transition:width .3s;}',
  '#onboardingScreen .btn-gold{background:#3B0764!important;color:#fff!important;border:none!important;}',
  '.onb-range{position:relative;height:56px;margin:4px 0 18px;}',
  '.onb-range-val{display:flex;justify-content:space-between;font-family:Cinzel,serif;font-size:22px;color:#1C0530;font-weight:600;margin-bottom:14px;}',
  '.onb-range-track{position:absolute;left:0;right:0;top:46px;height:4px;background:rgba(59,7,100,.12);border-radius:2px;}',
  '.onb-range-fill{position:absolute;top:0;bottom:0;left:0;right:0;background:linear-gradient(135deg,#F24E96,#9B30C9);border-radius:2px;}',
  '.onb-range-input{position:absolute;left:0;right:0;top:38px;width:100%;height:20px;margin:0;-webkit-appearance:none;appearance:none;background:transparent;pointer-events:none;}',
  '.onb-range-input::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:22px;height:22px;border-radius:50%;background:#3B0764;border:3px solid #fff;box-shadow:0 1px 5px rgba(59,7,100,.4);cursor:pointer;pointer-events:auto;}',
  '.onb-range-input::-moz-range-thumb{width:22px;height:22px;border-radius:50%;background:#3B0764;border:3px solid #fff;cursor:pointer;pointer-events:auto;}'
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
    intent:P.intent||'',_lifeHappy:[],_lifeLiving:[],_lifeMeans:[],_lifePace:[],
    family_type:P.family_type||'',family_values:P.family_values||'',
    siblings:P.siblings||'',father_occupation:P.father_occupation||'',mother_occupation:P.mother_occupation||'',
    hobbies:[],faith_browse:[],faith_receive:[],
    photos_visible_to:P.photos_visible_to||'all',contact_visible_to:P.contact_visible_to||'premium'
  };
  try{_onbData.pref_marital_statuses=JSON.parse(P.pref_marital_statuses||'[]');}catch(x){}
  try{_onbData.hobbies=JSON.parse(P.hobbies||'[]');}catch(x){}

  var sc=document.getElementById('onboardingScreen');
  if(!sc){_onbRunning=false;showScr('mainApp');goTab('home');return;}

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
  else if(s==='intent')_onbIntent(sc);
  else if(s==='partner_prefs')_onbPartnerPrefs(sc);
  else if(s==='family')_onbFamily(sc);
  else if(s==='hobbies')_onbHobbies(sc);
  else if(s==='faith_prefs')_onbFaithPrefs(sc);
  else if(s==='privacy')_onbPrivacy(sc);
  else if(s==='done')_onbComplete();
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
    var _ic=_onbData.intent||'';
    if(_ic==='companionship'||_ic==='later_life'||_ic==='friendship'){
      var _p=[].concat(_onbData._lifeHappy||[],_onbData._lifeMeans||[]);
      if(_p.length)_onbData.looking_for=_p.join(', ');
      _onbData.family_type='';_onbData.family_values='';_onbData.siblings='';_onbData.father_occupation='';_onbData.mother_occupation='';
    }else{
      _onbData.family_type=val('onbFamType');
      _onbData.family_values=val('onbFamVals');
      _onbData.siblings=val('onbSiblings');
      _onbData.father_occupation=val('onbFatherOcc');
      _onbData.mother_occupation=val('onbMotherOcc');
    }
  }
  if(s==='faith_prefs'){
    // Collect from checkboxes
    var allBrowseChk=document.getElementById('onbFpb_all');
    var allReceiveChk=document.getElementById('onbFpr_all');
    var browseAll=allBrowseChk&&allBrowseChk.checked;
    var receiveAll=allReceiveChk&&allReceiveChk.checked;
    _onbData.faith_browse=browseAll?ALL_RELIGIONS.slice():Array.from(document.querySelectorAll('.onb-fpb-opt:checked')).map(function(o){return o.value;});
    _onbData.faith_receive=receiveAll?ALL_RELIGIONS.slice():Array.from(document.querySelectorAll('.onb-fpr-opt:checked')).map(function(o){return o.value;});
    if(!_onbData.faith_browse.length)_onbData.faith_browse=ALL_RELIGIONS.slice();
    if(!_onbData.faith_receive.length)_onbData.faith_receive=ALL_RELIGIONS.slice();
  }
  if(s==='privacy'){
    _onbData.photos_visible_to=val('onbPhotos');
    _onbData.contact_visible_to=val('onbContact');
  }
}

function _validateStep(){
  var s=ONB_STEPS[_onbStep];
  if(s==='intent'&&!_onbData.intent){alert('Please choose what you are looking for.');return false;}
  if(s==='partner_prefs'){
    if(!_onbData.pref_religions.length){alert('Please select at least one preferred religion you are open to matching with.');return false;}
    var ageMin=parseInt((document.getElementById('onbAgeMin')||{}).value||0);
    var ageMax=parseInt((document.getElementById('onbAgeMax')||{}).value||0);
    if(!ageMin||!ageMax||ageMin<18||ageMax<18){alert('Please enter a valid age range (minimum 18).');return false;}
    if(ageMin>ageMax){alert('Minimum age cannot be greater than maximum age.');return false;}
    _onbData.pref_age_min=ageMin;_onbData.pref_age_max=ageMax;
  }
  if(s==='hobbies'&&_onbData.hobbies.length<3){alert('Please select at least 3 hobbies — this helps us find you better matches.');return false;}
  if(s==='faith_prefs'){
    if(!_onbData.faith_browse.length){alert('Please select at least one faith to browse profiles from.');return false;}
    if(!_onbData.faith_receive.length){alert('Please select at least one faith to receive interests from.');return false;}
  }
  return true;
}

function _onbHdr(title,step,total){
  var pct=Math.round((step/total)*100);
  return '<p style="font-size:10px;font-weight:700;color:#9B30C9;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 8px;">'+step+' OF '+total+'</p>'+
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
    '<div style="width:96px;height:96px;border-radius:22px;background:#fff;box-shadow:0 14px 40px -22px rgba(59,7,100,.4);display:flex;align-items:center;justify-content:center;margin:0 auto 18px;"><img src="https://beginforever.in/logo.png" alt="Begin Forever" style="width:72px;height:72px;object-fit:contain;" onerror="this.style.display=&apos;none&apos;"/></div>'+
    '<h2 class="onb-title" style="font-size:26px;margin-bottom:8px;">Congratulations, '+name+'!</h2>'+
    '<p style="font-size:14px;color:#1C0530;font-weight:600;margin-bottom:8px;">Your profile has been <span style="color:#2E7D32;">approved</span>.</p>'+
    '<p style="font-size:13px;color:#5B3A7A;line-height:1.7;margin-bottom:32px;max-width:360px;">Let\'s take 3 minutes to set your match preferences so we can show you the most compatible profiles.</p>'+
    '<button class="btn btn-gold" style="width:auto;padding:14px 36px;" onclick="onbNext()">Set My Preferences →</button>'+
    '</div>';
}

// STEP: INTENT SELECTOR
function _onbIntent(sc){
  var opts=[['marriage_soon','Marriage — ready soon','Looking to marry within 6–12 months','\u25C6'],['marriage_intime','Marriage — in time','Marriage-minded, 1–2 year horizon','\u25C6'],['partnership','Life partnership','A committed partner, marriage optional','\u25C7'],['companionship','Companionship','Emotional connection & shared life','\u2665'],['later_life','Later in life','A partner or companion for this chapter','\u2726'],['friendship','Friendship first','Begin as friends, open to where it leads','\u25CB']];
  var h='<div class="onb-card"><span class="onb-lbl" style="display:block;margin-bottom:4px;">Begin Forever</span><h2 class="onb-title" style="font-size:22px;margin-bottom:6px;">What are you looking for?</h2><p class="onb-sub">This shapes everything you see. Be honest \u2014 we match by intent, so you only meet people looking for the same.</p><div id="onbIntentList">';
  opts.forEach(function(o){var on=_onbData.intent===o[0];h+='<div class="onb-intent" onclick="_onbPickIntent(\''+o[0]+'\')" style="border:1.5px solid '+(on?'#C13DBF':'rgba(59,7,100,.12)')+';background:'+(on?'#F1E4F8':'#fff')+';border-radius:14px;padding:13px 15px;display:flex;align-items:center;gap:12px;margin-bottom:9px;cursor:pointer;"><div style="width:34px;height:34px;border-radius:50%;background:'+(on?'linear-gradient(135deg,#F24E96,#9B30C9)':'rgba(59,7,100,.06)')+';color:'+(on?'#fff':'#9B30C9')+';display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">'+o[3]+'</div><div style="flex:1;"><div style="font-family:Cinzel,serif;font-size:15px;color:#1C0530;font-weight:600;">'+o[1]+'</div><div style="font-size:11px;color:#5B3A7A;margin-top:2px;">'+o[2]+'</div></div></div>';});
  h+='</div>'+_onbFoot(true)+'</div>';sc.innerHTML=h;
}
function _onbPickIntent(v){_onbData.intent=v;_onbIntent(document.getElementById('onboardingScreen'));}

// STEP 1: PARTNER PREFERENCES
function _onbPartnerPrefs(sc){
  var eduOpts=['Any','Graduate and above','Post Graduate','Doctorate','Professional Degree'];
  var states=['Any','Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Other / Outside India'];

  sc.innerHTML='<div class="onb-card">'+_onbHdr('Partner Preferences',1,5)+
    '<span class="onb-lbl">Age Range *</span>'+
    '<div class="onb-range">'+
      '<div class="onb-range-val"><span id="onbAgeMinLbl">'+_onbData.pref_age_min+'</span><span style="color:#9B30C9;">—</span><span id="onbAgeMaxLbl">'+_onbData.pref_age_max+'</span></div>'+
      '<div class="onb-range-track"><div class="onb-range-fill" id="onbAgeFill"></div></div>'+
      '<input type="range" class="onb-range-input" id="onbAgeMin" min="18" max="70" value="'+_onbData.pref_age_min+'" oninput="_onbAgeSlide(\'min\')"/>'+
      '<input type="range" class="onb-range-input" id="onbAgeMax" min="18" max="70" value="'+_onbData.pref_age_max+'" oninput="_onbAgeSlide(\'max\')"/>'+
    '</div>'+
    '<span class="onb-lbl">Preferred Religion * <span style="font-size:10px;color:#7A6090;text-transform:none;letter-spacing:0;">(select all that apply)</span></span>'+
    '<details style="margin-bottom:16px;"><summary style="list-style:none;cursor:pointer;padding:13px 15px;background:#fff;border:1.5px solid rgba(59,7,100,.2);border-radius:12px;font-size:13px;color:#1C0530;font-weight:600;display:flex;align-items:center;justify-content:space-between;"><span id="onbRelSum">'+_onbRelSummary()+'</span><span style="color:#9B30C9;">\u25BE</span></summary>'+
      '<div id="onbRelDD" style="background:#FDFAF4;border:1.5px solid rgba(59,7,100,.2);border-top:none;border-radius:0 0 12px 12px;overflow:hidden;"></div></details>'+
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

  _onbRelRender();
  _onbChips('onbMarChips',ALL_MARITAL,_onbData.pref_marital_statuses,null,null,false);
  _onbAgeSlide();
}

function _onbRelSummary(){var a=_onbData.pref_religions;if(!a||!a.length)return 'Select religions…';if(a.length>=ALL_RELIGIONS.length)return 'All religions';if(a.length===1)return a[0];return a.length+' selected';}
function _onbRelRender(){var dd=document.getElementById('onbRelDD');if(!dd)return;var fcol={'Christian':'#7C4DA0','Hindu':'#C2691E','Muslim':'#2E7D52','Sikh':'#B8860B','Jain':'#3F7DC0','Buddhist':'#C0641E','Parsi':'#B5482E','Jewish':'#3A6EA5','Spiritual':'#2E9E63','Other':'#8A7CA8'};dd.innerHTML=ALL_RELIGIONS.map(function(r){var on=_onbData.pref_religions.indexOf(r)>-1;return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(59,7,100,.08);font-size:13px;color:#1C0530;"><input type="checkbox" value="'+r+'" onchange="_onbRelToggle(this.value,this.checked)" style="accent-color:#9B30C9;width:16px;height:16px;"'+(on?' checked':'')+'/><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+(fcol[r]||'#8A7CA8')+';"></span>'+r+'</label>';}).join('');}
function _onbRelToggle(v,on){var a=_onbData.pref_religions;var i=a.indexOf(v);if(on&&i<0)a.push(v);else if(!on&&i>-1)a.splice(i,1);var s=document.getElementById('onbRelSum');if(s)s.textContent=_onbRelSummary();}
function _onbAgeSlide(which){var a=document.getElementById('onbAgeMin'),b=document.getElementById('onbAgeMax');if(!a||!b)return;var lo=parseInt(a.value),hi=parseInt(b.value);if(lo>hi){if(which==='max'){b.value=lo;hi=lo;}else{a.value=hi;lo=hi;}}var mn=document.getElementById('onbAgeMinLbl'),mx=document.getElementById('onbAgeMaxLbl');if(mn)mn.textContent=lo;if(mx)mx.textContent=hi;var fill=document.getElementById('onbAgeFill');if(fill){var span=70-18;fill.style.left=((lo-18)/span*100)+'%';fill.style.right=(100-((hi-18)/span*100))+'%';}}
function _onbLoadCities(){
  var st=document.getElementById('onbState');var ct=document.getElementById('onbCity');if(!st||!ct)return;
  ct.innerHTML='<option>Any City</option>';
  if(typeof CT!=='undefined'&&CT[st.value])CT[st.value].forEach(function(c){ct.innerHTML+='<option>'+c+'</option>';});
  if(_onbData.pref_city)ct.value=_onbData.pref_city;
}

// STEP 2: FAMILY (adaptive by intent)
function _onbFamily(sc){
  var _ic=_onbData.intent||'';
  if(_ic==='companionship'||_ic==='later_life'||_ic==='friendship'){
    sc.innerHTML='<div class="onb-card">'+_onbHdr('Your Life',2,5)+      '<p class="onb-sub">Where marriage asks about family, companionship asks about you \u2014 your days, your space, your pace.</p>'+      '<span class="onb-lbl">I am at my happiest…</span><div id="onbLifeHappy" style="margin-bottom:16px;"></div>'+      '<span class="onb-lbl">My living situation</span><div id="onbLifeLiving" style="margin-bottom:16px;"></div>'+      '<span class="onb-lbl">What companionship means to me</span><div id="onbLifeMeans" style="margin-bottom:16px;"></div>'+      '<span class="onb-lbl">Pace I am comfortable with</span><div id="onbLifePace" style="margin-bottom:16px;"></div>'+      _onbFoot(true)+'</div>';
    _onbChips('onbLifeHappy',['With a few close people','Out in nature','In a full house','Quiet & solo'],_onbData._lifeHappy,null,null,false);
    _onbChips('onbLifeLiving',['Live independently','With family','Open to change'],_onbData._lifeLiving,null,null,false);
    _onbChips('onbLifeMeans',['Someone to share days with','Travel & experiences','Faith & community','Quiet routine together'],_onbData._lifeMeans,null,null,false);
    _onbChips('onbLifePace',['Slow & unhurried','See where it goes'],_onbData._lifePace,null,null,false);
    return;
  }
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

// STEP 4: FAITH PREFS — FIXED: function now properly closed
function _onbFaithPrefs(sc){
  if(!_onbData.faith_browse.length)_onbData.faith_browse=ALL_RELIGIONS.slice();
  if(!_onbData.faith_receive.length)_onbData.faith_receive=ALL_RELIGIONS.slice();

  var faithOpts=ALL_RELIGIONS.map(function(r){
    var fcol={'Christian':'#7C4DA0','Hindu':'#C2691E','Muslim':'#2E7D52','Sikh':'#B8860B','Jain':'#3F7DC0','Buddhist':'#C0641E','Parsi':'#B5482E','Jewish':'#3A6EA5','Spiritual':'#2E9E63','Other':'#8A7CA8'};var icons={};Object.keys(fcol).forEach(function(k){icons[k]='<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+fcol[k]+';flex-shrink:0;"></span>';});
    return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(59,7,100,.08);font-size:13px;color:#1C0530;">'+
      '<input type="checkbox" value="'+r+'" class="BROWSE_CLS" onchange="_onbFpUpdateLabel(\'browse\')" style="accent-color:#9B30C9;width:16px;height:16px;"'+((_onbData.faith_browse.indexOf(r)>-1)?' checked':'')+'/> '+(icons[r]||'')+'  '+r+'</label>';
  }).join('').replace(/BROWSE_CLS/g,'onb-fpb-opt');

  var faithOptsR=ALL_RELIGIONS.map(function(r){
    var fcol={'Christian':'#7C4DA0','Hindu':'#C2691E','Muslim':'#2E7D52','Sikh':'#B8860B','Jain':'#3F7DC0','Buddhist':'#C0641E','Parsi':'#B5482E','Jewish':'#3A6EA5','Spiritual':'#2E9E63','Other':'#8A7CA8'};var icons={};Object.keys(fcol).forEach(function(k){icons[k]='<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+fcol[k]+';flex-shrink:0;"></span>';});
    return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid rgba(59,7,100,.08);font-size:13px;color:#1C0530;">'+
      '<input type="checkbox" value="'+r+'" class="RECEIVE_CLS" onchange="_onbFpUpdateLabel(\'receive\')" style="accent-color:#9B30C9;width:16px;height:16px;"'+((_onbData.faith_receive.indexOf(r)>-1)?' checked':'')+'/> '+(icons[r]||'')+'  '+r+'</label>';
  }).join('').replace(/RECEIVE_CLS/g,'onb-fpr-opt');

  var browseAllChecked=_onbData.faith_browse.length>=ALL_RELIGIONS.length;
  var receiveAllChecked=_onbData.faith_receive.length>=ALL_RELIGIONS.length;

  sc.innerHTML='<style>#onboardingScreen details>summary::-webkit-details-marker{display:none}#onboardingScreen details[open]>summary .onb-cv{transform:rotate(180deg)}</style><div class="onb-card">'+_onbHdr('Faith Preferences',4,5)+
    '<p class="onb-sub">Control who you see and who can reach you. You can change this anytime.</p>'+

    '<span class="onb-lbl">🔍 Browse profiles from</span>'+
    '<details style="margin-bottom:20px;"><summary style="list-style:none;cursor:pointer;padding:13px 15px;background:#fff;border:1.5px solid rgba(59,7,100,.2);border-radius:12px;font-size:13px;color:#1C0530;font-weight:600;display:flex;align-items:center;justify-content:space-between;"><span id="onbFpbSum">'+_onbFpSummary('browse')+'</span><span class="onb-cv" style="color:#9B30C9;transition:transform .2s;">\u25BE</span></summary>'+
      '<div style="background:#FDFAF4;border:1.5px solid rgba(59,7,100,.2);border-top:none;border-radius:0 0 12px 12px;overflow:hidden;">'+
      '<label style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:2px solid rgba(59,7,100,.12);font-size:13px;color:#3B0764;font-weight:700;background:rgba(59,7,100,.04);">'+
        '<input type="checkbox" id="onbFpb_all" onchange="_onbFpHandleAll(\'browse\')" style="accent-color:#9B30C9;width:16px;height:16px;"'+(browseAllChecked?' checked':'')+'/> All Faiths</label>'+
      faithOpts+
    '</div></details>'+

    '<span class="onb-lbl">💌 Receive interests from</span>'+
    '<details style="margin-bottom:20px;"><summary style="list-style:none;cursor:pointer;padding:13px 15px;background:#fff;border:1.5px solid rgba(59,7,100,.2);border-radius:12px;font-size:13px;color:#1C0530;font-weight:600;display:flex;align-items:center;justify-content:space-between;"><span id="onbFprSum">'+_onbFpSummary('receive')+'</span><span class="onb-cv" style="color:#9B30C9;transition:transform .2s;">\u25BE</span></summary>'+
      '<div style="background:#FDFAF4;border:1.5px solid rgba(59,7,100,.2);border-top:none;border-radius:0 0 12px 12px;overflow:hidden;">'+
      '<label style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;border-bottom:2px solid rgba(59,7,100,.12);font-size:13px;color:#3B0764;font-weight:700;background:rgba(59,7,100,.04);">'+
        '<input type="checkbox" id="onbFpr_all" onchange="_onbFpHandleAll(\'receive\')" style="accent-color:#9B30C9;width:16px;height:16px;"'+(receiveAllChecked?' checked':'')+'/> All Faiths</label>'+
      faithOptsR+
    '</div></details>'+

    '<div style="background:rgba(59,7,100,.05);border:1px solid rgba(59,7,100,.12);border-radius:10px;padding:12px;margin-bottom:16px;font-size:11px;color:#5B3A7A;line-height:1.6;">🔒 These settings only affect your discovery feed. Other members cannot see your preferences.</div>'+
    _onbFoot(true)+'</div>';
}  // ← THIS CLOSING BRACE WAS MISSING IN v120

function _onbFpSummary(type){var arr=type==='browse'?_onbData.faith_browse:_onbData.faith_receive;if(!arr||!arr.length||arr.length>=ALL_RELIGIONS.length)return 'All Faiths';if(arr.length===1)return arr[0];return arr.length+' faiths selected';}
function _onbFpRefreshSum(type){var sumEl=document.getElementById(type==='browse'?'onbFpbSum':'onbFprSum');if(!sumEl)return;var cls=type==='browse'?'onb-fpb-opt':'onb-fpr-opt';var allChk=document.getElementById(type==='browse'?'onbFpb_all':'onbFpr_all');var sel=Array.from(document.querySelectorAll('.'+cls+':checked')).map(function(o){return o.value;});sumEl.textContent=(allChk&&allChk.checked)?'All Faiths':(sel.length===0?'All Faiths':(sel.length===1?sel[0]:sel.length+' faiths selected'));}
function _onbFpHandleAll(type){
  var cls=type==='browse'?'onb-fpb-opt':'onb-fpr-opt';
  var allId=type==='browse'?'onbFpb_all':'onbFpr_all';
  var allChk=document.getElementById(allId);
  document.querySelectorAll('.'+cls).forEach(function(o){o.checked=allChk&&allChk.checked;});
  _onbFpRefreshSum(type);
}

function _onbFpUpdateLabel(type){
  var cls=type==='browse'?'onb-fpb-opt':'onb-fpr-opt';
  var allId=type==='browse'?'onbFpb_all':'onbFpr_all';
  var selected=Array.from(document.querySelectorAll('.'+cls+':checked')).map(function(o){return o.value;});
  var allChk=document.getElementById(allId);
  if(allChk) allChk.checked=selected.length>=ALL_RELIGIONS.length;
  _onbFpRefreshSum(type);
}

// STEP 5: PRIVACY — now correctly its own function
function _onbPrivacy(sc){
  sc.innerHTML='<div class="onb-card">'+_onbHdr('Privacy Settings',5,5)+
    '<p class="onb-sub">Changeable anytime from Profile → Privacy Settings.</p>'+
    '<div class="field-group"><label class="field-label">📷 Who can see my photos?</label><select class="field" id="onbPhotos"><option value="all"'+(_onbData.photos_visible_to==='all'?' selected':'')+'>Everyone (recommended)</option><option value="interests_only"'+(_onbData.photos_visible_to==='interests_only'?' selected':'')+'>Only mutual interests</option><option value="none"'+(_onbData.photos_visible_to==='none'?' selected':'')+'>Hidden</option></select></div>'+
    '<div class="field-group" style="margin-top:14px;"><label class="field-label">📞 Who can see my contact details?</label><select class="field" id="onbContact"><option value="premium"'+(_onbData.contact_visible_to==='premium'?' selected':'')+'>Premium members only (recommended)</option><option value="interests_only"'+(_onbData.contact_visible_to==='interests_only'?' selected':'')+'>Only mutual interests</option><option value="none"'+(_onbData.contact_visible_to==='none'?' selected':'')+'>Hidden</option></select></div>'+
    '<div style="background:rgba(59,7,100,.05);border:1px solid rgba(59,7,100,.12);border-radius:10px;padding:12px;margin-top:16px;font-size:11px;color:#5B3A7A;line-height:1.6;">🛡️ Begin Forever never shares your data with third parties. Your ID is for verification only.</div>'+
    _onbFoot(true)+'</div>';
}

// COMPLETE
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
      intent:_onbData.intent||null,
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

  var tb=document.getElementById('tBar');if(tb)tb.style.display='';
  var ma=document.getElementById('mainApp');if(ma){ma.style.display='block';ma.classList.add('active');}
  var obs=document.getElementById('onboardingScreen');if(obs){obs.style.display='none';obs.classList.remove('active');}

  showScr('mainApp');
  checkNotifs();
  goTab('profile');

  setTimeout(function(){
    var toast=document.createElement('div');
    toast.id='onbCompletionToast';
    toast.style.cssText='position:fixed;top:70px;left:50%;transform:translateX(-50%);background:#3B0764;border:1px solid rgba(155,48,201,.4);color:#F24E96;padding:14px 20px;border-radius:14px;font-size:13px;font-weight:700;z-index:9999;text-align:center;max-width:320px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.5);line-height:1.5;';
    var closeBtn=document.createElement('button');
    closeBtn.style.cssText='position:absolute;top:8px;right:10px;background:none;border:none;color:rgba(255,255,255,.55);font-size:18px;cursor:pointer;line-height:1;';
    closeBtn.textContent='✕';
    closeBtn.onclick=function(){var t=document.getElementById('onbCompletionToast');if(t)t.remove();};
    var msg=document.createElement('span');
    msg.innerHTML='✨ Almost done! Add your bio, lifestyle &amp; hobbies to attract better matches.<br/>';
    var btn=document.createElement('button');
    btn.style.cssText='margin-top:10px;background:#F24E96;color:#3B0764;border:none;border-radius:8px;padding:8px 18px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;font-size:12px;display:block;width:100%;';
    btn.textContent='Complete Profile →';
    btn.onclick=function(){openEdit();var t=document.getElementById('onbCompletionToast');if(t)t.remove();};
    toast.appendChild(closeBtn);toast.appendChild(msg);toast.appendChild(btn);
    document.body.appendChild(toast);
  },600);
}
