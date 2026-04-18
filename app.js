// ═══════════════════════════════════════════ CONFIG
var SB_URL="https://neftjxvovxocqabxjvme.supabase.co";
var SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZnRqeHZvdnhvY3FhYnhqdm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgyMjksImV4cCI6MjA5MDM3NDIyOX0.qWIVda-i5MsCy1OinW4JLLciI1B4ArBWviWIuGcOPBc";
var sb=supabase.createClient(SB_URL,SB_KEY);
var U=null,P=null,step=1,photos=[null,null,null,null,null],idFile=null,mode='login',chatPid=null,editPhotos=[null,null,null,null,null];
var quickFaithFilter='All';

// ── FAITH DATA
var FAITHS=[
  {key:'Christian',icon:'✝️',color:'#9B59B6',bg:'rgba(155,89,182,0.15)'},
  {key:'Hindu',    icon:'🕉️',color:'#E07020',bg:'rgba(224,112,32,0.15)'},
  {key:'Muslim',   icon:'☪️', color:'#2E8B57',bg:'rgba(46,139,87,0.15)'},
  {key:'Sikh',     icon:'☬', color:'#C8960C',bg:'rgba(200,150,12,0.15)'},
  {key:'Jain',     icon:'🕊️',color:'#4A90D9',bg:'rgba(74,144,217,0.15)'},
  {key:'Buddhist', icon:'☸️',color:'#D4700A',bg:'rgba(212,112,10,0.15)'},
  {key:'Other',    icon:'🌐',color:'#888',   bg:'rgba(136,136,136,0.15)'}
];
function faithByKey(k){return FAITHS.find(function(f){return f.key===k})||FAITHS[6]}
// ── MULTI-SELECT FAITH HELPERS
function getSelectValues(id){var s=document.getElementById(id);if(!s)return FAITHS.map(function(f){return f.key});return Array.from(s.selectedOptions).map(function(o){return o.value})}
function setSelectValues(id,arr){var s=document.getElementById(id);if(!s)return;Array.from(s.options).forEach(function(o){o.selected=arr.indexOf(o.value)>-1})}
function setupSelectAllNew(t){var id=t==='browse'?'setupBrowseSelect':'setupReceiveSelect';var s=document.getElementById(id);if(s)Array.from(s.options).forEach(function(o){o.selected=true})}
function setupClearAllNew(t){var id=t==='browse'?'setupBrowseSelect':'setupReceiveSelect';var s=document.getElementById(id);if(s)Array.from(s.options).forEach(function(o){o.selected=false})}
function fpSelectAllNew(t){var id=t==='browse'?'fpBrowseSelect':'fpReceiveSelect';var s=document.getElementById(id);if(s)Array.from(s.options).forEach(function(o){o.selected=true})}
function fpClearAllNew(t){var id=t==='browse'?'fpBrowseSelect':'fpReceiveSelect';var s=document.getElementById(id);if(s)Array.from(s.options).forEach(function(o){o.selected=false})}


// ── FAITH PREFS STATE (loaded from localStorage + Supabase)
var fpBrowse=FAITHS.map(function(f){return f.key});   // default: all
var fpReceive=FAITHS.map(function(f){return f.key});  // default: all

function loadFaithPrefs(){
  try{
    var b=localStorage.getItem('bf_browse');
    var r=localStorage.getItem('bf_receive');
    if(b)fpBrowse=JSON.parse(b);
    if(r)fpReceive=JSON.parse(r);
  }catch(x){}
}
function saveFaithPrefsLocal(){
  localStorage.setItem('bf_browse',JSON.stringify(fpBrowse));
  localStorage.setItem('bf_receive',JSON.stringify(fpReceive));
}

// ═══════════════════════════════════════════ HELPERS
function show(id){document.querySelectorAll('.screen').forEach(function(s){s.style.display='none';s.classList.remove('active')});var el=document.getElementById(id);if(el){el.style.display='flex';el.classList.add('active')}}
function toggleDenom(){var r=document.getElementById('fReligion').value;document.getElementById('denomGroup').style.display=r==='Christian'?'':'none'}

// ═══════════════════════════════════════════ AUTH
function setMode(m){mode=m;document.getElementById('aErr').style.display='none';document.getElementById('aOk').style.display='none';var t=document.getElementById('aTitle'),pg=document.getElementById('aPassG'),cg=document.getElementById('aConfG'),b=document.getElementById('aBtn'),tg=document.getElementById('aToggle'),bk=document.getElementById('aBack');if(m==='login'){t.textContent='Welcome Back';pg.style.display='';cg.style.display='none';b.textContent='Sign In';tg.style.display='';bk.style.display='none'}else if(m==='signup'){t.textContent='Create Account';pg.style.display='';cg.style.display='';b.textContent='Create Account';tg.style.display='none';bk.style.display=''}else{t.textContent='Reset Password';pg.style.display='none';cg.style.display='none';b.textContent='Send Reset Link';tg.style.display='none';bk.style.display=''}}
async function doAuth(){var em=document.getElementById('aEmail').value.trim(),pw=document.getElementById('aPass').value,cf=document.getElementById('aConf').value,er=document.getElementById('aErr'),ok=document.getElementById('aOk');er.style.display='none';ok.style.display='none';if(!em){er.textContent='Enter email';er.style.display='';return}if(mode!=='forgot'&&!pw){er.textContent='Enter password';er.style.display='';return}var b=document.getElementById('aBtn'),o=b.textContent;b.disabled=true;b.innerHTML='<div class="spinner spinner-sm" style="margin:0 auto"></div>';try{if(mode==='signup'){if(pw.length<6)throw{message:'Password: 6+ characters'};if(pw!==cf)throw{message:'Passwords must match'};var r=await sb.auth.signUp({email:em,password:pw});if(r.error)throw r.error;ok.innerHTML='✅ Account created! Please <strong>sign in</strong> now with your email and password.';ok.style.display='';ok.style.padding='10px';ok.style.background='rgba(46,213,115,.1)';ok.style.borderRadius='8px';ok.style.border='1px solid #2ED573';b.disabled=false;b.textContent=o;authHandled=false;setMode('login')}else if(mode==='login'){var r=await sb.auth.signInWithPassword({email:em,password:pw});if(r.error)throw r.error}else{var r=await sb.auth.resetPasswordForEmail(em);if(r.error)throw r.error;ok.textContent='Reset link sent!';ok.style.display='';b.disabled=false;b.textContent=o}}catch(e){er.textContent=e.message||'Error';er.style.display='';b.disabled=false;b.textContent=o}}
async function doSignOut(){await sb.auth.signOut();U=null;P=null;show('authScreen')}

// ═══════════════════════════════════════════ STATE / CITIES
var CT={'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur','Other'],'Assam':['Guwahati','Other'],'Bihar':['Patna','Other'],'Chhattisgarh':['Raipur','Other'],'Delhi':['New Delhi','South Delhi','Other'],'Goa':['Panaji','Other'],'Gujarat':['Ahmedabad','Surat','Other'],'Haryana':['Gurugram','Other'],'Himachal Pradesh':['Shimla','Other'],'Jharkhand':['Ranchi','Other'],'Karnataka':['Bengaluru','Mysuru','Mangalore','Other'],'Kerala':['Kochi','Thiruvananthapuram','Kozhikode','Thrissur','Other'],'Madhya Pradesh':['Bhopal','Indore','Other'],'Maharashtra':['Mumbai','Pune','Nagpur','Nashik','Other'],'Manipur':['Imphal','Other'],'Meghalaya':['Shillong','Other'],'Mizoram':['Aizawl','Other'],'Nagaland':['Kohima','Other'],'Odisha':['Bhubaneswar','Other'],'Punjab':['Ludhiana','Amritsar','Other'],'Rajasthan':['Jaipur','Other'],'Tamil Nadu':['Chennai','Coimbatore','Other'],'Telangana':['Hyderabad','Other'],'Tripura':['Agartala','Other'],'Uttar Pradesh':['Lucknow','Noida','Other'],'Uttarakhand':['Dehradun','Other'],'West Bengal':['Kolkata','Other'],'Other / Outside India':['Other']};
function fillC(){var s=document.getElementById('fState').value,c=document.getElementById('fCity');c.innerHTML='<option value="">Select</option>';(CT[s]||[]).forEach(function(v){c.innerHTML+='<option>'+v+'</option>'})}
function initPG(){var g=document.getElementById('photoGrid');g.innerHTML='';for(var i=0;i<5;i++)g.innerHTML+='<div class="photo-slot" id="ps'+i+'" onclick="document.getElementById(\'pi'+i+'\').click()"><span style="font-size:16px;opacity:.4">📷</span><span>'+(i===0?'Main*':'#'+(i+1))+'</span><input type="file" accept="image/*" id="pi'+i+'" style="display:none" onchange="pickP('+i+',this)"/></div>'}
function pickP(i,inp){var f=inp.files[0];if(!f)return;photos[i]=f;var s=document.getElementById('ps'+i);s.style.backgroundImage='url('+URL.createObjectURL(f)+')';s.style.borderColor='var(--gold)';s.style.borderStyle='solid';s.innerHTML='<input type="file" accept="image/*" id="pi'+i+'" style="display:none" onchange="pickP('+i+',this)"/>'}
function pickId(inp){var f=inp.files[0];if(!f||f.size>5*1024*1024){alert('Max 5MB');return}idFile=f;document.getElementById('idSlot').style.borderColor='var(--gold)';document.getElementById('idSlot').style.borderStyle='solid';document.getElementById('idSlot').innerHTML='<span style="font-size:32px">✅</span><br/><span style="font-size:12px;color:#D4A017">ID uploaded</span><input type="file" accept="image/*,.pdf" id="idInp" style="display:none" onchange="pickId(this)"/>';document.getElementById('idN').textContent='📄 '+f.name;document.getElementById('idN').style.display=''}

// ═══════════════════════════════════════════ SETUP STEPS (now 6)
function updUI(){
  var t=['Personal Details','About You','Photos','Government ID','Match Preferences','Faith Privacy'];
  document.getElementById('sTitle').textContent=t[step-1];
  document.getElementById('sLabel').textContent='Step '+step+' of 6';
  document.querySelectorAll('.step-dot').forEach(function(d,i){d.classList.toggle('active',i<step)});
  for(var i=1;i<=6;i++)document.getElementById('s'+i).style.display=i===step?'':'none';
  document.getElementById('bkBtn').style.display=step>1?'':'none';
  document.getElementById('nxBtn').textContent=step<6?'Next →':'Submit for Review ✦';
  document.getElementById('sErr').style.display='none';
  if(step===3)initPG();
  if(step===6)initSetupFaithGrids();
}
function goBack(){if(step>1){step--;updUI()}}

// Setup faith grids
var setupBrowse=FAITHS.map(function(f){return f.key});
var setupReceive=FAITHS.map(function(f){return f.key});
function renderFaithGrid(containerId,arr,onToggle){
  var g=document.getElementById(containerId);if(!g)return;
  g.innerHTML='';
  FAITHS.forEach(function(f){
    var on=arr.indexOf(f.key)>-1;
    var d=document.createElement('div');
    d.className='faith-chip'+(on?' on':'');
    d.style.background=on?f.bg:'var(--w05)';
    d.style.borderColor=on?f.color:'var(--w20)';
    d.innerHTML='<span style="font-size:18px">'+f.icon+'</span><span style="color:'+(on?f.color:'var(--w70)')+';font-size:12px;font-weight:600;flex:1">'+f.key+'</span><span style="font-size:13px;color:'+(on?f.color:'var(--w20)')+'">'+( on?'✓':'○')+'</span>';
    d.onclick=function(){onToggle(f.key)};
    g.appendChild(d);
  });
}
function initSetupFaithGrids(){
  renderFaithGrid('setupBrowseGrid',setupBrowse,function(k){
    var i=setupBrowse.indexOf(k);if(i>-1)setupBrowse.splice(i,1);else setupBrowse.push(k);
    renderFaithGrid('setupBrowseGrid',setupBrowse,arguments.callee);
  });
  renderFaithGrid('setupReceiveGrid',setupReceive,function(k){
    var i=setupReceive.indexOf(k);if(i>-1)setupReceive.splice(i,1);else setupReceive.push(k);
    renderFaithGrid('setupReceiveGrid',setupReceive,arguments.callee);
  });
}
function setupSelectAll(t){if(t==='browse'){setupBrowse=FAITHS.map(function(f){return f.key});renderFaithGrid('setupBrowseGrid',setupBrowse,function(k){var i=setupBrowse.indexOf(k);if(i>-1)setupBrowse.splice(i,1);else setupBrowse.push(k);renderFaithGrid('setupBrowseGrid',setupBrowse,arguments.callee)})}else{setupReceive=FAITHS.map(function(f){return f.key});renderFaithGrid('setupReceiveGrid',setupReceive,function(k){var i=setupReceive.indexOf(k);if(i>-1)setupReceive.splice(i,1);else setupReceive.push(k);renderFaithGrid('setupReceiveGrid',setupReceive,arguments.callee)})}}
function setupClearAll(t){if(t==='browse'){setupBrowse=[];renderFaithGrid('setupBrowseGrid',setupBrowse,function(k){setupBrowse.push(k);renderFaithGrid('setupBrowseGrid',setupBrowse,arguments.callee)})}else{setupReceive=[];renderFaithGrid('setupReceiveGrid',setupReceive,function(k){setupReceive.push(k);renderFaithGrid('setupReceiveGrid',setupReceive,arguments.callee)})}}

async function goNext(){
  var e=document.getElementById('sErr');e.style.display='none';
  if(step===1){if(!document.getElementById('fName').value.trim()||!document.getElementById('fAge').value||!document.getElementById('fGender').value||!document.getElementById('fReligion').value||!document.getElementById('fState').value||!document.getElementById('fCity').value||!document.getElementById('fPhone').value.trim()){e.textContent='Please fill all required fields';e.style.display='';return}step++;updUI();return}
  if(step===2){step++;updUI();return}
  if(step===3){if(!photos[0]){e.textContent='Primary photo is required';e.style.display='';return}step++;updUI();return}
  if(step===4){if(!document.getElementById('fIdT').value||!idFile){e.textContent='ID type and upload are required';e.style.display='';return}step++;updUI();return}
  if(step===5){step++;updUI();return}
  // step 6 — submit
  if(setupBrowse.length===0){e.textContent='Select at least one faith to browse';e.style.display='';return}
  if(setupReceive.length===0){e.textContent='Select at least one faith to receive interests from';e.style.display='';return}
  fpBrowse=getSelectValues('setupBrowseSelect');fpReceive=getSelectValues('setupReceiveSelect');saveFaithPrefsLocal();
  var btn=document.getElementById('nxBtn');btn.disabled=true;btn.innerHTML='<div class="spinner spinner-sm" style="margin:0 auto"></div>';
  try{
    var urls=['','','','',''];
    for(var i=0;i<5;i++){if(photos[i]){var ext=photos[i].name.split('.').pop(),path=U.id+'/p'+i+'_'+Date.now()+'.'+ext;var r=await sb.storage.from('profile-photos').upload(path,photos[i],{upsert:true});if(!r.error)urls[i]=sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl}}
    var idUrl='';if(idFile){var ext2=idFile.name.split('.').pop(),idP=U.id+'/id_'+Date.now()+'.'+ext2;try{var r2=await sb.storage.from('id-proofs').upload(idP,idFile,{upsert:true});if(!r2.error)idUrl=sb.storage.from('id-proofs').getPublicUrl(idP).data.publicUrl}catch(x){var r3=await sb.storage.from('profile-photos').upload(idP,idFile,{upsert:true});if(!r3.error)idUrl=sb.storage.from('profile-photos').getPublicUrl(idP).data.publicUrl}}
    var pd={id:U.id,email:U.email,full_name:document.getElementById('fName').value.trim(),age:parseInt(document.getElementById('fAge').value),gender:document.getElementById('fGender').value,religion:document.getElementById('fReligion').value,denomination:document.getElementById('fDenom').value||null,city:document.getElementById('fCity').value,state:document.getElementById('fState').value,phone:document.getElementById('fPhone').value.trim(),registered_by:document.getElementById('fRegFor').value,bio:document.getElementById('fBio').value.trim(),education:document.getElementById('fEdu').value.trim(),occupation:document.getElementById('fOcc').value.trim(),height_cm:document.getElementById('fHt').value?parseInt(document.getElementById('fHt').value):null,mother_tongue:document.getElementById('fMT').value.trim(),marital_status:document.getElementById('fMS').value,photo_url:urls[0],photo_2_url:urls[1],photo_3_url:urls[2],photo_4_url:urls[3],photo_5_url:urls[4],id_proof_type:document.getElementById('fIdT').value,id_proof_url:idUrl,pref_age_min:parseInt(document.getElementById('fPMin').value)||18,pref_age_max:parseInt(document.getElementById('fPMax').value)||70,pref_denomination:document.getElementById('fPD').value,pref_city:document.getElementById('fPC').value.trim()||'Any',faith_browse:JSON.stringify(fpBrowse),faith_receive:JSON.stringify(fpReceive),status:'pending'};
    var r=await sb.from('profiles').insert(pd);if(r.error)throw r.error;P=pd;show('pendingScreen')
  }catch(ex){e.textContent=ex.message||'Error submitting';e.style.display='';btn.disabled=false;btn.textContent='Submit for Review ✦'}
}

// ═══════════════════════════════════════════ LOAD PROFILE
async function loadP(){
  try{var r=await sb.from('profiles').select('*').eq('id',U.id).limit(1);P=(r.data&&r.data.length>0)?r.data[0]:null}catch(x){P=null}
  if(!P){show('setupScreen');updUI();return}
  if(P.status==='pending'){show('pendingScreen');return}
  if(P.status==='rejected'){show('rejectedScreen');return}
  loadFaithPrefs();
  if(P.faith_browse){try{fpBrowse=JSON.parse(P.faith_browse)}catch(x){}}
  if(P.faith_receive){try{fpReceive=JSON.parse(P.faith_receive)}catch(x){}}
  document.getElementById('hName').textContent=P.full_name.split(' ')[0];
  if(P.is_admin){var bar=document.getElementById('tBar');if(!document.getElementById('adTab')){var ab=document.createElement('button');ab.className='tab-btn';ab.id='adTab';ab.onclick=function(){goTab('admin')};ab.innerHTML='<span style="font-size:18px">⚙️</span><span style="font-size:9px">Admin</span>';bar.appendChild(ab)}}
  show('mainApp');renderHome();checkNotifs()
}

// ═══════════════════════════════════════════ TABS
function goTab(t){
  ['tHome','tBrowse','tInterests','tChat','tChatWin','tViews','tProfile','tPlans','tReviews','tAdmin'].forEach(function(x){var el=document.getElementById(x);if(el)el.style.display='none'});
  var key=t.charAt(0).toUpperCase()+t.slice(1);
  var target=document.getElementById('t'+key);if(target)target.style.display='';
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  var activeMap={home:'tabHome',browse:'tabBrowse',interests:'tabInterests',chat:'tabChat',chatWin:'tabChat',views:'tabProfile',plans:'tabPlansTab',profile:'tabProfile',reviews:'tabHome',admin:'tabHome'};
  var activeId=activeMap[t];if(activeId){var ab=document.getElementById(activeId);if(ab)ab.classList.add('active')}
  if(t==='home')renderHome();
  if(t==='browse')ldBrowse();
  if(t==='interests')ldInt('received');
  if(t==='chat')ldChats();
  if(t==='views')ldViews();
  if(t==='profile')renP();
  if(t==='admin')ldAdmin('pending');
}

// ═══════════════════════════════════════════ HOME
function renderHome(){
  var n=document.getElementById('hWelcomeName');
  if(n&&P)n.textContent=P.full_name.split(' ')[0];
  loadStats();
}
async function loadStats(){
  try{
    var v=await sb.from('profile_views').select('id',{count:'exact'}).eq('viewed_id',U.id);
    var iv=v.count||0;
    var i=await sb.from('interests').select('id',{count:'exact'}).eq('to_user',U.id);
    var ii=i.count||0;
    var m=await sb.from('messages').select('id',{count:'exact'}).eq('receiver_id',U.id);
    var im=m.count||0;
    // home stats
    var sv=document.getElementById('statViews');var si=document.getElementById('statInt');var sm=document.getElementById('statMsg');
    if(sv)sv.textContent=iv;if(si)si.textContent=ii;if(sm)sm.textContent=im;
    // profile stats
    var pv=document.getElementById('pStatViews');var pi=document.getElementById('pStatInt');var pm=document.getElementById('pStatMsg');
    if(pv)pv.textContent=iv;if(pi)pi.textContent=ii;if(pm)pm.textContent=im;
  }catch(x){}
}

// ═══════════════════════════════════════════ FAITH PREF SUMMARY (profile tab)


// ═══════════════════════════════════════════ FAITH PREFS MODAL
function openFaithPrefs(){
  setSelectValues('fpBrowseSelect',fpBrowse);
  setSelectValues('fpReceiveSelect',fpReceive);
  document.getElementById('faithModal').classList.add('show');
}
function closeFaithPrefs(){document.getElementById('faithModal').classList.remove('show')}
function renderFpGrid(containerId,arr,type){
  renderFaithGrid(containerId,arr,function(k){
    var target=type==='browse'?fpBrowse:fpReceive;
    var i=target.indexOf(k);if(i>-1)target.splice(i,1);else target.push(k);
    renderFpGrid(containerId,target,type);
  });
}
function fpSelectAll(t){if(t==='browse'){fpBrowse=FAITHS.map(function(f){return f.key});renderFpGrid('fpBrowseGrid',fpBrowse,'browse')}else{fpReceive=FAITHS.map(function(f){return f.key});renderFpGrid('fpReceiveGrid',fpReceive,'receive')}}
function fpClearAll(t){if(t==='browse'){fpBrowse=[];renderFpGrid('fpBrowseGrid',fpBrowse,'browse')}else{fpReceive=[];renderFpGrid('fpReceiveGrid',fpReceive,'receive')}}
async function saveFaithPrefs(){
  fpBrowse=getSelectValues('fpBrowseSelect');fpReceive=getSelectValues('fpReceiveSelect');
  saveFaithPrefsLocal();
  try{await sb.from('profiles').update({faith_browse:JSON.stringify(fpBrowse),faith_receive:JSON.stringify(fpReceive)}).eq('id',U.id)}catch(x){}
  closeFaithPrefs();renderFaithPrefSummary();renderBrowseChips();
}

// ═══════════════════════════════════════════ BROWSE
function renderBrowseChips(){
  var chips=document.getElementById('browseChips');if(!chips)return;
  var opts=['All'].concat(fpBrowse);
  chips.innerHTML='';
  opts.forEach(function(k){
    var f=k==='All'?null:faithByKey(k);
    var on=quickFaithFilter===k;
    var btn=document.createElement('button');
    btn.style.cssText='white-space:nowrap;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;font-family:DM Sans,sans-serif;cursor:pointer;transition:all .2s;border:1px solid '+(on?(f?f.color:'var(--gold)'):'var(--w20)')+';background:'+(on?(f?f.bg:'rgba(232,184,48,.15)'):'transparent')+';color:'+(on?(f?f.color:'var(--gold)'):'var(--w50)');
    btn.textContent=(k==='All'?'🌍 All':(f?f.icon+' '+k:k));
    btn.onclick=function(){quickFaithFilter=k;renderBrowseChips();ldBrowse()};
    chips.appendChild(btn);
  });
  // receive bar
  var bar=document.getElementById('receiveBar');if(bar){
    var pills=fpReceive.map(function(k){var f=faithByKey(k);return '<span style="color:'+f.color+'">'+f.icon+' '+k+'</span>'}).join(' · ');
    bar.innerHTML='💌 Receiving interest from: '+pills;
  }
}
async function ldBrowse(){
  renderBrowseChips();
  var g=P.gender==='Male'?'Female':'Male';
  var q=sb.from('profiles').select('*').eq('status','approved').eq('gender',g).neq('id',U.id);
  // apply faith browse filter
  if(quickFaithFilter!=='All'){q=q.eq('religion',quickFaithFilter)}
  else if(fpBrowse.length>0&&fpBrowse.length<FAITHS.length){q=q.in('religion',fpBrowse)}
  var fd=document.getElementById('fltDenom').value;if(fd)q=q.eq('denomination',fd);
  var fa=document.getElementById('fltAge').value;if(fa){var pp=fa.split('-');if(pp.length===2)q=q.gte('age',parseInt(pp[0])).lte('age',parseInt(pp[1]));else q=q.gte('age',41)}
  var r=await q.order('created_at',{ascending:false});
  var d=r.data||[];
  document.getElementById('bEmpty').style.display=d.length?'none':'';
  var l=document.getElementById('bList');l.innerHTML='';
  d.forEach(function(p){
    var f=faithByKey(p.religion||'Other');
    l.innerHTML+='<div class="card" onclick="viewProfile(\''+p.id+'\')"><div style="display:flex;gap:12px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+')':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:20px;opacity:.3">👤</span>':'')+'</div><div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+', '+p.age+'</h3><p style="font-size:11px;margin:3px 0"><span style="color:'+f.color+'">'+f.icon+' '+(p.religion||'')+'</span>'+(p.denomination?' · <span style="color:var(--w50)">'+p.denomination+'</span>':'')+'</p><p style="font-size:10px;color:var(--w50)">'+p.city+', '+p.state+'</p></div><span style="font-size:18px">→</span></div>'+(p.bio?'<p style="font-size:12px;color:var(--w50);margin-top:8px;line-height:1.4;overflow:hidden;max-height:36px">'+p.bio+'</p>':'')+'</div>'
  });
}

// ═══════════════════════════════════════════ VIEW PROFILE MODAL
async function viewProfile(id){
  try{await sb.from('profile_views').upsert({viewer_id:U.id,viewed_id:id,viewed_at:new Date().toISOString()},{onConflict:'viewer_id,viewed_id'})}catch(x){}
  var r=await sb.from('profiles').select('*').eq('id',id).limit(1);if(!r.data||!r.data.length)return;
  var p=r.data[0];var f=faithByKey(p.religion||'Other');
  var ap=[p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(function(x){return x});
  var ir=await sb.from('interests').select('*').eq('from_user',U.id).eq('to_user',id).limit(1);var sent=(ir.data&&ir.data.length>0);
  var h='<div style="text-align:center;padding-top:8px"><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:14px">';
  ap.forEach(function(u){h+='<div style="width:72px;height:72px;border-radius:14px;background-image:url('+u+');background-size:cover;background-position:center;border:2px solid '+f.color+'"></div>'});
  if(!ap.length)h+='<div class="avatar avatar-lg"><span style="font-size:32px;opacity:.3">👤</span></div>';
  h+='</div><h2 style="font-family:Playfair Display,serif;font-size:22px">'+p.full_name+', '+p.age+'</h2>';
  h+='<p style="margin-top:4px"><span style="color:'+f.color+';font-size:14px">'+f.icon+' '+(p.religion||'')+'</span>'+(p.denomination?' <span style="color:var(--w50);font-size:12px">· '+p.denomination+'</span>':'')+'</p>';
  h+='<p style="color:var(--w50);font-size:12px">'+p.city+', '+p.state+'</p></div>';
  h+='<div style="background:var(--w05);border-radius:14px;padding:14px;margin-top:16px">';
  [{l:'Bio',v:p.bio},{l:'Education',v:p.education},{l:'Occupation',v:p.occupation},{l:'Mother Tongue',v:p.mother_tongue},{l:'Marital Status',v:p.marital_status},{l:'Height',v:p.height_cm?p.height_cm+' cm':''}].forEach(function(d){if(d.v)h+='<div style="margin-bottom:10px"><p style="font-size:10px;color:#3B0764;text-transform:uppercase;letter-spacing:1px">'+d.l+'</p><p style="font-size:13px;margin-top:2px;color:var(--w80)">'+d.v+'</p></div>'});
  h+='</div>';
  if(!sent&&p.id!==U.id){
    // check receive filter before showing interest button
    var canSend=fpReceive.length===0||fpReceive.indexOf(p.religion)>-1||true; // always show, Supabase enforces
    h+='<button class="btn btn-gold" style="margin-top:16px" onclick="sendInt(\''+p.id+'\')">💝 Express Interest</button>';
  }else if(sent)h+='<p style="text-align:center;color:#3B0764;margin-top:16px;font-size:13px">✅ Interest sent</p>';
  document.getElementById('pmC').innerHTML=h;
  document.getElementById('profileModal').classList.add('show');
}
function closeModal(){document.getElementById('profileModal').classList.remove('show')}
async function sendInt(to){
  // check receive filter on target user's side (client hint — Supabase RLS enforces server side)
  try{await sb.from('interests').insert({from_user:U.id,to_user:to,status:'pending'});closeModal();alert('Interest sent! 💝')}catch(x){alert(x.message||'Already sent')}
}

// ═══════════════════════════════════════════ INTERESTS
async function ldInt(type){
  document.getElementById('intRecBtn').className='btn btn-sm '+(type==='received'?'btn-gold':'btn-dark');
  document.getElementById('intSentBtn').className='btn btn-sm '+(type==='sent'?'btn-gold':'btn-dark');
  document.getElementById('intMutBtn').className='btn btn-sm '+(type==='mutual'?'btn-gold':'btn-dark');
  var r;
  if(type==='received')r=await sb.from('interests').select('*,profiles!interests_from_user_fkey(*)').eq('to_user',U.id).eq('status','pending').order('created_at',{ascending:false});
  else if(type==='sent')r=await sb.from('interests').select('*,profiles!interests_to_user_fkey(*)').eq('from_user',U.id).order('created_at',{ascending:false});
  else r=await sb.from('interests').select('*,profiles!interests_from_user_fkey(*)').eq('to_user',U.id).eq('status','accepted').order('created_at',{ascending:false});
  var d=r.data||[];
  document.getElementById('intEmpty').style.display=d.length?'none':'';
  var l=document.getElementById('intList');l.innerHTML='';
  d.forEach(function(i){
    var p=i.profiles;if(!p)return;
    var f=faithByKey(p.religion||'Other');
    l.innerHTML+='<div class="card"><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+')':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+'</div><div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+', '+p.age+'</h3><p style="font-size:11px;color:'+f.color+'">'+f.icon+' '+(p.denomination||p.religion||'')+'<span style="color:var(--w50)"> · '+p.city+'</span></p></div></div>'+(type==='received'?'<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-grn btn-sm" style="flex:1" onclick="actInt(\''+i.id+'\',\'accepted\')">✅ Accept</button><button class="btn btn-red btn-sm" style="flex:1" onclick="actInt(\''+i.id+'\',\'declined\')">✗ Decline</button></div>':'')+(type==='mutual'?'<button class="btn btn-gold btn-sm" style="margin-top:10px" onclick="openChat(\''+p.id+'\')">💬 Message</button>':'')+'</div>'
  });
}
function showInt(t){ldInt(t)}
async function actInt(id,st){await sb.from('interests').update({status:st}).eq('id',id);ldInt('received')}

// ═══════════════════════════════════════════ CHAT
async function ldChats(){var r=await sb.from('interests').select('*').or('from_user.eq.'+U.id+',to_user.eq.'+U.id).eq('status','accepted');var d=r.data||[];var pids=[];d.forEach(function(i){var pid=i.from_user===U.id?i.to_user:i.from_user;if(pids.indexOf(pid)===-1)pids.push(pid)});if(!pids.length){document.getElementById('chatEmpty').style.display='';document.getElementById('chatList').innerHTML='';return}document.getElementById('chatEmpty').style.display='none';var pr=await sb.from('profiles').select('*').in('id',pids);var profiles=pr.data||[];var l=document.getElementById('chatList');l.innerHTML='';profiles.forEach(function(p){var f=faithByKey(p.religion||'Other');l.innerHTML+='<div class="card" onclick="openChat(\''+p.id+'\')"><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+')':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+'</div><div><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+'</h3><p style="font-size:11px;color:'+f.color+'">'+f.icon+' '+(p.denomination||p.religion||'')+' · '+p.city+'</p></div><span style="font-size:16px;color:var(--w50)">💬</span></div></div>'})}
async function openChat(pid){chatPid=pid;var pr=await sb.from('profiles').select('*').eq('id',pid).limit(1);var p=pr.data[0];document.getElementById('cwNm').textContent=p.full_name;document.getElementById('cwIn').textContent=(p.denomination||p.religion||'')+' · '+p.city;if(p.photo_url)document.getElementById('cwAv').style.backgroundImage='url('+p.photo_url+')';goTab('chatWin');ldMsgs()}
async function ldMsgs(){if(!chatPid)return;var r=await sb.from('messages').select('*').or('and(sender_id.eq.'+U.id+',receiver_id.eq.'+chatPid+'),and(sender_id.eq.'+chatPid+',receiver_id.eq.'+U.id+')').order('created_at',{ascending:true});var d=r.data||[];var c=document.getElementById('cwMs');c.innerHTML='';d.forEach(function(m){var t=new Date(m.created_at);c.innerHTML+='<div class="msg-bubble '+(m.sender_id===U.id?'msg-sent':'msg-recv')+'">'+m.content+'<div class="msg-time">'+t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div>'});c.scrollTop=c.scrollHeight;await sb.from('messages').update({is_read:true}).eq('receiver_id',U.id).eq('sender_id',chatPid)}
async function sendMsg(){var inp=document.getElementById('cwTx'),txt=inp.value.trim();if(!txt)return;inp.value='';await sb.from('messages').insert({sender_id:U.id,receiver_id:chatPid,content:txt});ldMsgs()}

// ═══════════════════════════════════════════ WHO VIEWED
async function ldViews(){var r=await sb.from('profile_views').select('*,profiles!profile_views_viewer_id_fkey(*)').eq('viewed_id',U.id).order('viewed_at',{ascending:false});var d=r.data||[];document.getElementById('viewEmpty').style.display=d.length?'none':'';var l=document.getElementById('viewList');l.innerHTML='';d.forEach(function(v){var p=v.profiles;if(!p)return;var f=faithByKey(p.religion||'Other');l.innerHTML+='<div class="card" onclick="viewProfile(\''+p.id+'\')"><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+')':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+'</div><div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+', '+p.age+'</h3><p style="font-size:11px;color:'+f.color+'">'+f.icon+' '+(p.denomination||p.religion||'')+'</p></div><p style="font-size:10px;color:var(--w50)">'+new Date(v.viewed_at).toLocaleDateString()+'</p></div></div>'})}

// ═══════════════════════════════════════════ MY PROFILE TAB
function renP(){
  var p=P;
  var f=faithByKey(p.religion||'Other');
  var ap=[p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(function(x){return x});
  // hero
  var ph='';
  if(ap.length>0)ph='background-image:url('+ap[0]+');background-size:cover;background-position:center';
  document.getElementById('profileHero').innerHTML=
    '<div class="avatar avatar-lg glow-border" style="margin:0 auto;'+ph+'">'+(!ap.length?'<span style="font-size:36px;opacity:.3">👤</span>':'')+'</div>'+
    '<h2 style="font-family:Playfair Display,serif;font-size:22px;margin-top:12px">'+p.full_name+'</h2>'+
    '<p style="color:'+f.color+';font-size:13px;margin-top:4px">'+f.icon+' '+(p.denomination?p.denomination+' · ':'')+f.key+'</p>'+
    '<p style="color:var(--w50);font-size:12px">'+p.city+', '+p.state+'</p>'+
    '<span class="badge" style="margin-top:8px;background:'+(p.status==='approved'?'var(--grn)':'var(--gold)')+';color:'+(p.status==='approved'?'#fff':'#1A0830')+';">'+(p.status==='approved'?'✅ Verified Member':'⏳ Pending Review')+'</span>'+
    '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-top:12px">'+
    ap.slice(1).map(function(u){return '<div style="width:56px;height:56px;border-radius:10px;background-image:url('+u+');background-size:cover;background-position:center;border:2px solid '+f.color+'"></div>'}).join('')+
    '</div>';
  // details
  var h='<h3 style="font-size:13px;color:#3B0764;margin-bottom:12px;text-transform:uppercase;letter-spacing:1.5px">Profile Details</h3>';
  [{l:'Email',v:p.email},{l:'Phone',v:p.phone},{l:'Religion',v:p.religion},{l:'Denomination',v:p.denomination},{l:'Age',v:p.age},{l:'Education',v:p.education},{l:'Occupation',v:p.occupation},{l:'Mother Tongue',v:p.mother_tongue},{l:'Marital Status',v:p.marital_status},{l:'Height',v:p.height_cm?p.height_cm+' cm':''}].forEach(function(d){if(d.v)h+='<div class="info-row"><span class="info-label">'+d.l+'</span><span class="info-value">'+d.v+'</span></div>'});
  if(p.bio)h+='<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--w10)"><p style="font-size:11px;color:#3B0764;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">About</p><p style="font-size:13px;color:var(--w80);line-height:1.6">'+p.bio+'</p></div>';
  document.getElementById('mInfo').innerHTML=h;
  // faith summary
  renderProfileFaithSummary();
  loadStats();
}
function renderProfileFaithSummary(){
  var h='<div style="margin-bottom:8px"><p style="font-size:11px;color:var(--w50);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">🔍 Browsing from</p><div style="display:flex;flex-wrap:wrap;gap:5px">';
  fpBrowse.forEach(function(k){var f=faithByKey(k);h+='<span class="faith-pill" style="background:'+f.bg+';border-color:'+f.color+';color:'+f.color+'">'+f.icon+' '+k+'</span>'});
  h+='</div></div><div><p style="font-size:11px;color:var(--w50);text-transform:uppercase;letter-spacing:1px;margin-bottom:5px">💌 Receiving from</p><div style="display:flex;flex-wrap:wrap;gap:5px">';
  fpReceive.forEach(function(k){var f=faithByKey(k);h+='<span class="faith-pill" style="background:'+f.bg+';border-color:'+f.color+';color:'+f.color+'">'+f.icon+' '+k+'</span>'});
  h+='</div></div>';
  var el=document.getElementById('profileFaithSummary');if(el)el.innerHTML=h;
}

// ═══════════════════════════════════════════ EDIT PROFILE
function openEdit(){document.getElementById('eBio').value=P.bio||'';document.getElementById('eEdu').value=P.education||'';document.getElementById('eOcc').value=P.occupation||'';document.getElementById('ePh').value=P.phone||'';editPhotos=[null,null,null,null,null];var g=document.getElementById('epGrid');g.innerHTML='';var urls=[P.photo_url,P.photo_2_url,P.photo_3_url,P.photo_4_url,P.photo_5_url];for(var i=0;i<5;i++){var has=urls[i]&&urls[i].length>0;g.innerHTML+='<div class="photo-slot" id="eps'+i+'" onclick="document.getElementById(\'epi'+i+'\').click()" style="'+(has?'background-image:url('+urls[i]+');border-color:#3B0764;border-style:solid':'')+'">'+(!has?'<span style="font-size:14px;opacity:.4">📷</span><span>#'+(i+1)+'</span>':'')+'<input type="file" accept="image/*" id="epi'+i+'" style="display:none" onchange="pickEP('+i+',this)"/></div>'}document.getElementById('editModal').classList.add('show')}
function closeEdit(){document.getElementById('editModal').classList.remove('show')}
function pickEP(i,inp){var f=inp.files[0];if(!f)return;editPhotos[i]=f;var s=document.getElementById('eps'+i);s.style.backgroundImage='url('+URL.createObjectURL(f)+')';s.style.borderColor='var(--gold)';s.style.borderStyle='solid';s.innerHTML='<input type="file" accept="image/*" id="epi'+i+'" style="display:none" onchange="pickEP('+i+',this)"/>'}
async function saveEdit(){var upd={bio:document.getElementById('eBio').value.trim(),education:document.getElementById('eEdu').value.trim(),occupation:document.getElementById('eOcc').value.trim(),phone:document.getElementById('ePh').value.trim()};for(var i=0;i<5;i++){if(editPhotos[i]){var ext=editPhotos[i].name.split('.').pop(),path=U.id+'/p'+i+'_'+Date.now()+'.'+ext;var r=await sb.storage.from('profile-photos').upload(path,editPhotos[i],{upsert:true});if(!r.error){var url=sb.storage.from('profile-photos').getPublicUrl(path).data.publicUrl;if(i===0)upd.photo_url=url;else upd['photo_'+(i+1)+'_url']=url}}}await sb.from('profiles').update(upd).eq('id',U.id);var r2=await sb.from('profiles').select('*').eq('id',U.id).limit(1);P=r2.data[0];closeEdit();renderHome();alert('Profile updated! ✅')}

// ═══════════════════════════════════════════ ADMIN
async function ldAdmin(st){var r=await sb.from('profiles').select('*').eq('status',st).order('created_at',{ascending:false});var d=r.data||[];document.getElementById('adEmpty').style.display=d.length?'none':'';var l=document.getElementById('adList');l.innerHTML='';d.forEach(function(p){var f=faithByKey(p.religion||'Other');var act='';if(st==='pending')act='<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-grn btn-sm" style="flex:1" onclick="adAct(\''+p.id+'\',\'approved\')">✅ Approve</button><button class="btn btn-red btn-sm" style="flex:1" onclick="adAct(\''+p.id+'\',\'rejected\')">❌ Reject</button></div>';l.innerHTML+='<div class="card"><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+')':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+'</div><div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+', '+p.age+'</h3><p style="font-size:11px;color:'+f.color+'">'+f.icon+' '+(p.denomination?p.denomination+' · ':'')+p.city+'</p><p style="font-size:10px;color:var(--w50)">'+p.email+' · '+(p.phone||'')+'</p><p style="font-size:10px;color:var(--w50)">ID: '+(p.id_proof_type||'N/A')+'</p></div></div>'+(p.bio?'<p style="font-size:12px;color:var(--w50);margin-top:8px">'+p.bio+'</p>':'')+act+'</div>'})}
async function adAct(id,st){await sb.from('profiles').update({status:st}).eq('id',id);ldAdmin('pending')}

// ═══════════════════════════════════════════ NOTIFICATIONS
async function checkNotifs(){try{var r=await sb.from('interests').select('id',{count:'exact'}).eq('to_user',U.id).eq('status','pending');if(r.count>0){document.getElementById('intDot').style.display='';document.getElementById('intBadge').style.display='';document.getElementById('intBadge').textContent=r.count}var mr=await sb.from('messages').select('id',{count:'exact'}).eq('receiver_id',U.id).eq('is_read',false);if(mr.count>0)document.getElementById('msgDot').style.display=''}catch(x){}}

// ═══════════════════════════════════════════ PAYMENT
function payRzp(plan,amt){var opts={key:'rzp_live_SausbldU6Vqpy0',amount:amt,currency:'INR',name:'Begin Forever',description:plan+' Subscription',image:'https://beginforever.in/logo.png',handler:function(r){alert('Payment successful! 🎉 Your '+plan+' plan is now active.\nPayment ID: '+r.razorpay_payment_id);goTab('home')},prefill:{name:P?P.full_name:'',email:P?P.email:'',contact:P?P.phone:''},theme:{color:'#4A1080'}};var rzp=new Razorpay(opts);rzp.open()}

// ═══════════════════════════════════════════ REVIEWS
function submitReview(){var txt=document.getElementById('revText').value.trim();if(!txt){alert('Please write your review');return}alert('Thank you for your review! 🙏 It will be published after moderation.');document.getElementById('revText').value=''}

// ═══════════════════════════════════════════ AUTH STATE LISTENER
var authHandled = false;
sb.auth.onAuthStateChange(function(ev, sess) {
  if (authHandled) return;
  authHandled = true;
  if (sess && sess.user) {
    U = sess.user;
    loadP();
  } else {
    U = null; P = null;
    show('authScreen');
  }
});

// Fallback: if onAuthStateChange never fires within 4s, show auth screen
setTimeout(function() {
  if (!authHandled) {
    authHandled = true;
    show('authScreen');
  }
}, 4000);

