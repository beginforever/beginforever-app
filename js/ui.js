// ═══════════════════════════════════════════ SCREEN MANAGEMENT
function showScr(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.style.display = 'none'; s.classList.remove('active');
  });
  var el = document.getElementById(id); if (!el) return;
  el.classList.add('active');
  el.style.display = (id === 'mainApp') ? 'block' : 'flex';
}
function show(id) { showScr(id); }

// ═══════════════════════════════════════════ COUNTDOWN
function updateCountdown() {
  var diff = LAUNCH - new Date();
  var pad = function(n){return String(Math.max(0,n)).padStart(2,'0');};
  var days = Math.max(0,Math.floor(diff/86400000));
  var hrs  = Math.max(0,Math.floor((diff%86400000)/3600000));
  var mins = Math.max(0,Math.floor((diff%3600000)/60000));
  var secs = Math.max(0,Math.floor((diff%60000)/1000));
  function set(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  set('cdDays',pad(days));set('cdHours',pad(hrs));set('cdMins',pad(mins));set('cdSecs',pad(secs));
  set('discoverDays',days);set('interestDays',days);
  updatePricingCountdown();
}
setInterval(updateCountdown,1000);
updateCountdown();

// ═══════════════════════════════════════════ TABS
function goTab(t) {
  if (P) {
    if (P.status==='rejected')     {renderRejectedScreen(P);showScr('rejectedScreen');return;}
    if (P.status==='pending')      {showScr('pendingScreen');return;}
    if (P.status==='resubmitting') {prefillSetupWizard(P);showScr('setupScreen');step=1;updUI();return;}
  }
  ['tHome','tBrowse','tInterests','tChat','tViews','tProfile','tPlans','tReviews','tAdmin'].forEach(function(x){
    var el=document.getElementById(x);if(el)el.style.display='none';
  });
  var key=t.charAt(0).toUpperCase()+t.slice(1);
  var target=document.getElementById('t'+key);
  if(target)target.style.display='';
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active');});
  var tabMap={home:'tabHome',browse:'tabBrowse',interests:'tabInterests',chat:'tabChat',
    views:'tabProfile',profile:'tabProfile',plans:'tabHome',reviews:'tabHome',admin:'adTab'};
  var ab=document.getElementById(tabMap[t]);if(ab)ab.classList.add('active');
  if(t==='home')      renderHome();
  if(t==='browse')    ldBrowse();
  if(t==='interests') ldInt('received');
  if(t==='chat')      ldChats();
  if(t==='views')     ldViews();
  if(t==='profile')   renP();
  if(t==='admin')     ldAdmin('pending');
}

// ═══════════════════════════════════════════ HOME
function renderHome() {
  if (!P || P.status==='rejected' || P.status==='pending') return;
  var logo=document.getElementById('appLogoImg');
  var hLogo=document.getElementById('homeLogoImg');
  if(logo&&hLogo&&logo.src)hLogo.src=logo.src;
  var wn=document.getElementById('hWelcomeName');if(wn&&P)wn.textContent=P.full_name?P.full_name.split(' ')[0]:'Friend';
  var ws=document.getElementById('hWelcomeSub');
  if(ws&&P){var f=faithByKey(P.religion||'Other');ws.innerHTML='<span style="color:'+f.color+'">'+f.icon+' '+(P.denomination||P.religion||'')+'</span> &nbsp;·&nbsp; '+P.city;}
  var av=document.getElementById('homeAvatarThumb');
  if(av&&P&&P.photo_url){av.style.backgroundImage='url('+P.photo_url+')';av.innerHTML='';}
  var hn=document.getElementById('hName');if(hn&&P)hn.textContent=P.full_name?P.full_name.split(' ')[0]:'';
  var pb=document.getElementById('pendingBannerHome');if(pb)pb.style.display=(P&&P.status==='pending')?'':'none';
  var sc=document.getElementById('homeSafetyCard');if(sc)sc.style.display=(P&&P.gender==='Female')?'':'none';
  loadStats();
}

async function loadStats() {
  try {
    var [v,i,m]=await Promise.all([
      sb.from('profile_views').select('id',{count:'exact',head:true}).eq('viewed_id',U.id),
      sb.from('interests').select('id',{count:'exact',head:true}).eq('to_user',U.id),
      sb.from('messages').select('id',{count:'exact',head:true}).eq('receiver_id',U.id)
    ]);
    ['statViews','pStatViews'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=v.count||0;});
    ['statInt','pStatInt'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=i.count||0;});
    ['statMsg','pStatMsg'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=m.count||0;});
  }catch(x){}
}

// ═══════════════════════════════════════════ BROWSE
async function ldBrowse() {
  if(!P)return;
  if(P.status==='pending'){
    var l=document.getElementById('bList');if(l)l.innerHTML='<div style="text-align:center;padding:40px 20px"><div style="font-size:40px">🔒</div><p style="color:#FFD54F;font-size:14px;font-weight:700;margin-top:12px">Profile Under Review</p></div>';
    return;
  }
  var g=P.gender==='Male'?'Female':'Male';
  var q=sb.from('profiles').select('*').eq('status','approved').eq('gender',g).neq('id',U.id);
  var browseFaiths=[];
  try{browseFaiths=JSON.parse(P.faith_browse||'[]');}catch(x){}
  if(browseFaiths.length>0&&browseFaiths.length<FAITHS.length)q=q.in('religion',browseFaiths);
  var r=await q.order('created_at',{ascending:false});
  var d=r.data||[];
  var be=document.getElementById('bEmpty');if(be)be.style.display=d.length?'none':'';
  var l=document.getElementById('bList');if(!l)return;l.innerHTML='';
  d.forEach(function(p){
    var f=faithByKey(p.religion||'Other');
    l.innerHTML+='<div class="card" onclick="viewProfile(\''+p.id+'\')"><div style="display:flex;gap:12px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+');background-size:cover;background-position:center':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:20px;opacity:.3">👤</span>':'')+'</div><div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+', '+p.age+'</h3><p style="font-size:11px;margin:3px 0"><span style="color:'+f.color+'">'+f.icon+' '+(p.religion||'')+'</span>'+(p.denomination?' · <span style="color:var(--w50)">'+p.denomination+'</span>':'')+'</p><p style="font-size:10px;color:var(--w50)">'+p.city+', '+p.state+'</p></div><span style="font-size:18px">→</span></div>'+(p.bio?'<p style="font-size:12px;color:var(--w50);margin-top:8px;line-height:1.4;overflow:hidden;max-height:36px">'+p.bio+'</p>':'')+'</div>';
  });
}

// ═══════════════════════════════════════════ INTERESTS
async function ldInt(type) {
  ['intRecBtn','intSentBtn','intMutBtn'].forEach(function(id){
    var el=document.getElementById(id);if(el)el.className='btn btn-sm btn-dark';
  });
  var activeId={received:'intRecBtn',sent:'intSentBtn',mutual:'intMutBtn'}[type];
  var activeEl=document.getElementById(activeId);if(activeEl)activeEl.className='btn btn-sm btn-gold';
  var r;
  if(type==='received') r=await sb.from('interests').select('*,profiles!interests_from_user_fkey(*)').eq('to_user',U.id).eq('status','pending').order('created_at',{ascending:false});
  else if(type==='sent') r=await sb.from('interests').select('*,profiles!interests_to_user_fkey(*)').eq('from_user',U.id).order('created_at',{ascending:false});
  else r=await sb.from('interests').select('*,profiles!interests_from_user_fkey(*)').eq('to_user',U.id).eq('status','accepted').order('created_at',{ascending:false});
  var d=r.data||[];
  var ie=document.getElementById('intEmpty');if(ie)ie.style.display=d.length?'none':'';
  var l=document.getElementById('intList');if(!l)return;l.innerHTML='';
  d.forEach(function(i){
    var p=i.profiles;if(!p)return;
    var f=faithByKey(p.religion||'Other');
    l.innerHTML+='<div class="card"><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+');background-size:cover;background-position:center':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+'</div><div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+', '+p.age+'</h3><p style="font-size:11px;color:'+f.color+'">'+f.icon+' '+(p.denomination||p.religion||'')+'<span style="color:var(--w50)"> · '+p.city+'</span></p></div></div>'+(type==='received'?'<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-grn btn-sm" style="flex:1" onclick="actInt(\''+i.id+'\',\'accepted\')">✅ Accept</button><button class="btn btn-red btn-sm" style="flex:1" onclick="actInt(\''+i.id+'\',\'declined\')">✗ Decline</button></div>':'')+'</div>';
  });
}
function showInt(t){ldInt(t);}
async function actInt(id,st){await sb.from('interests').update({status:st}).eq('id',id);ldInt('received');}

// ═══════════════════════════════════════════ CHAT
async function ldChats() {
  var r=await sb.from('interests').select('*').or('from_user.eq.'+U.id+',to_user.eq.'+U.id).eq('status','accepted');
  var d=r.data||[];
  var pids=[];
  d.forEach(function(i){var pid=i.from_user===U.id?i.to_user:i.from_user;if(pids.indexOf(pid)===-1)pids.push(pid);});
  var ce=document.getElementById('chatEmpty');var cl=document.getElementById('chatList');
  if(!pids.length){if(ce)ce.style.display='';if(cl)cl.innerHTML='';return;}
  if(ce)ce.style.display='none';
  var pr=await sb.from('profiles').select('*').in('id',pids);
  var profiles=pr.data||[];
  if(cl)cl.innerHTML='';
  profiles.forEach(function(p){
    var f=faithByKey(p.religion||'Other');
    if(cl)cl.innerHTML+='<div class="card" onclick="openChat(\''+p.id+'\')"><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+');background-size:cover;background-position:center':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+'</div><div><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+'</h3><p style="font-size:11px;color:'+f.color+'">'+f.icon+' '+(p.denomination||p.religion||'')+' · '+p.city+'</p></div><span style="font-size:16px;color:var(--w50)">💬</span></div></div>';
  });
}

var chatPid=null;
async function openChat(pid){
  chatPid=pid;
  var pr=await sb.from('profiles').select('*').eq('id',pid).limit(1);
  var p=pr.data[0];
  var cn=document.getElementById('cwNm');if(cn)cn.textContent=p.full_name;
  var ci=document.getElementById('cwIn');if(ci)ci.textContent=(p.denomination||p.religion||'')+' · '+p.city;
  var ca=document.getElementById('cwAv');if(ca&&p.photo_url)ca.style.backgroundImage='url('+p.photo_url+')';
  goTab('chatWin');ldMsgs();
}
async function ldMsgs(){
  if(!chatPid)return;
  var r=await sb.from('messages').select('*').or('and(sender_id.eq.'+U.id+',receiver_id.eq.'+chatPid+'),and(sender_id.eq.'+chatPid+',receiver_id.eq.'+U.id+')').order('created_at',{ascending:true});
  var d=r.data||[];
  var c=document.getElementById('cwMs');if(!c)return;c.innerHTML='';
  d.forEach(function(m){
    var t=new Date(m.created_at);
    c.innerHTML+='<div class="msg-bubble '+(m.sender_id===U.id?'msg-sent':'msg-recv')+'">'+m.content+'<div class="msg-time">'+t.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div>';
  });
  c.scrollTop=c.scrollHeight;
  await sb.from('messages').update({is_read:true}).eq('receiver_id',U.id).eq('sender_id',chatPid);
}
async function sendMsg(){
  var inp=document.getElementById('cwTx');if(!inp)return;
  var txt=inp.value.trim();if(!txt)return;
  inp.value='';
  await sb.from('messages').insert({sender_id:U.id,receiver_id:chatPid,content:txt});
  ldMsgs();
}

// ═══════════════════════════════════════════ WHO VIEWED
async function ldViews(){
  var r=await sb.from('profile_views').select('*,profiles!profile_views_viewer_id_fkey(*)').eq('viewed_id',U.id).order('viewed_at',{ascending:false});
  var d=r.data||[];
  var ve=document.getElementById('viewEmpty');if(ve)ve.style.display=d.length?'none':'';
  var l=document.getElementById('viewList');if(!l)return;l.innerHTML='';
  d.forEach(function(v){
    var p=v.profiles;if(!p)return;
    var f=faithByKey(p.religion||'Other');
    l.innerHTML+='<div class="card" onclick="viewProfile(\''+p.id+'\')"><div style="display:flex;gap:10px;align-items:center"><div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+');background-size:cover;background-position:center':'')+';border-color:'+f.color+'">'+(!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+'</div><div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">'+p.full_name+', '+p.age+'</h3><p style="font-size:11px;color:'+f.color+'">'+f.icon+' '+(p.denomination||p.religion||'')+'</p></div><p style="font-size:10px;color:var(--w50)">'+new Date(v.viewed_at).toLocaleDateString()+'</p></div></div>';
  });
}

// ═══════════════════════════════════════════ NOTIFICATIONS
async function checkNotifs(){
  if(!U)return;
  try{
    var r=await sb.from('interests').select('id',{count:'exact',head:true}).eq('to_user',U.id).eq('status','pending');
    var dot=document.getElementById('intDot');if(dot&&r.count>0)dot.style.display='';
    var badge=document.getElementById('intBadge');if(badge&&r.count>0){badge.style.display='';badge.textContent=r.count;}
    var mr=await sb.from('messages').select('id',{count:'exact',head:true}).eq('receiver_id',U.id).eq('is_read',false);
    var mdot=document.getElementById('msgDot');if(mdot&&mr.count>0)mdot.style.display='';
  }catch(x){}
}

// ═══════════════════════════════════════════ MISC
function togglePw(inputId,btn){
  var inp=document.getElementById(inputId);
  inp.type=inp.type==='password'?'text':'password';
  btn.textContent=inp.type==='password'?'Show':'Hide';
}

function shareApp(){
  var code=P?P.id.slice(0,8):'friend';
  var link='https://beginforever.in?ref='+code;
  var msg="I just joined Begin Forever — India's first 100% ID-verified matrimony platform! Join: "+link;
  if(navigator.share)navigator.share({title:'Begin Forever',text:msg,url:link});
  else if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){alert('Referral link copied! 🔗');});
}

function submitReview(){
  var txt=document.getElementById('revText');
  if(txt&&!txt.value.trim()){alert('Please write your review.');return;}
  alert('Thank you! Your review will be published after moderation.');
  if(txt)txt.value='';
}

// ═══════════════════════════════════════════ FAITH CARDS UI
function renderFaithCards(containerId,arr){
  var c=document.getElementById(containerId);if(!c)return;
  c.innerHTML='';
  FAITH_CARDS.forEach(function(f){
    var on=arr.indexOf(f.key)>-1;
    var card=document.createElement('div');
    card.style.cssText='display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:12px;cursor:pointer;transition:all .15s;margin-bottom:7px;border:1.5px solid '+(on?f.color:'rgba(255,255,255,.08)')+';background:'+(on?'rgba(255,255,255,.07)':'rgba(255,255,255,.02)')+';';
    card.innerHTML='<span style="font-size:22px;flex-shrink:0;">'+f.icon+'</span><div style="flex:1;min-width:0;"><p style="font-size:13px;font-weight:700;color:'+(on?'#fff':'rgba(255,255,255,.5)')+';margin:0;">'+f.key+'</p>'+(f.denoms?'<p style="font-size:10px;color:rgba(255,255,255,.3);margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+f.denoms+'</p>':'')+'</div><span style="flex-shrink:0;font-size:16px;color:'+f.color+';width:20px;text-align:center;">'+(on?'✓':'')+'</span>';
    card.onclick=function(){var ix=arr.indexOf(f.key);if(ix>-1)arr.splice(ix,1);else arr.push(f.key);renderFaithCards(containerId,arr);};
    c.appendChild(card);
  });
}
function renderFaithGrid(cid,arr){renderFaithCards(cid,arr);}

// ═══════════════════════════════════════════ SUBSCRIPTION
function showSubscribeModal(feature){
  var m=document.getElementById('subscribeModal');if(!m)return;
  var msgs={faith:'Faith Preferences require a Premium plan.',browse:'Browsing requires a subscription.',chat:'Messaging requires a subscription.',default:'Choose a plan to browse and connect.'};
  var sub=m.querySelector('.subscribe-subtitle');if(sub)sub.textContent=msgs[feature]||msgs.default;
  m.classList.add('active');
}
function closeSubscribeModal(){var m=document.getElementById('subscribeModal');if(m)m.classList.remove('active');}

function isFoundingWithinFreeWeek(){
  if(!P||!P.is_founding_member)return false;
  var launchPlus7=new Date(LAUNCH.getTime()+7*24*60*60*1000);
  return new Date()>=LAUNCH&&new Date()<launchPlus7;
}
async function hasPremium(){
  if(P&&P.is_admin)return true;
  if(isFoundingWithinFreeWeek())return true;
  var sub=await getActiveSub();
  if(!sub)return false;
  var t=sub.plan_type||'';
  return t.toLowerCase().indexOf('premium')>-1;
}
async function getActiveSub(){
  if(!U)return null;
  try{
    var r=await sb.from('subscriptions').select('*').eq('user_id',U.id).eq('status','active').gt('expires_at',new Date().toISOString()).order('expires_at',{ascending:false}).limit(1);
    return(r.data&&r.data.length>0)?r.data[0]:null;
  }catch(x){return null;}
}
async function openFaithPrefsGated(){
  if(isPreLaunch()){openFaithPrefs();return;}
  var ok=await hasPremium();
  if(ok)openFaithPrefs();else showSubscribeModal('faith');
}

function payRzp(plan,amt){
  var tier=plan.toLowerCase().indexOf('premium')>-1?'premium':'basic';
  var days=plan.indexOf('Quarterly')!==-1?90:plan.indexOf('Monthly')!==-1?30:7;
  var opts={
    key:'rzp_live_SausbldU6Vqpy0',amount:amt,currency:'INR',
    name:'Begin Forever',description:plan+' Plan',
    handler:async function(resp){
      try{await sb.from('subscriptions').insert({user_id:U.id,plan_type:plan,plan_tier:tier,amount_paid:amt,razorpay_payment_id:resp.razorpay_payment_id,status:'active',started_at:new Date().toISOString(),expires_at:new Date(Date.now()+days*24*60*60*1000).toISOString()});}catch(x){}
      closeSubscribeModal();
      alert('✦ Welcome to '+plan+'!\nYour plan is now active.');
      await loadP();
    },
    prefill:{name:P?P.full_name:'',email:P?P.email:'',contact:P?P.phone:''},
    theme:{color:'#3B0764'}
  };
  new Razorpay(opts).open();
}

function updatePricingCountdown(){
  if(!LAUNCH)return;
  var diff=LAUNCH-new Date();
  if(diff<=0){
    var overlay=document.querySelector('.pricing-teaser-overlay');if(overlay)overlay.style.display='none';
    var blur=document.querySelector('.pricing-blur');if(blur){blur.style.filter='none';blur.style.opacity='1';blur.style.pointerEvents='';}
    return;
  }
  var days=Math.max(0,Math.floor(diff/86400000));
  var hrs=Math.max(0,Math.floor((diff%86400000)/3600000));
  var mins=Math.max(0,Math.floor((diff%3600000)/60000));
  var pad=function(n){return String(Math.max(0,n)).padStart(2,'0');};
  var d=document.getElementById('pcDays');if(d)d.textContent=pad(days);
  var h=document.getElementById('pcHrs');if(h)h.textContent=pad(hrs);
  var m=document.getElementById('pcMins');if(m)m.textContent=pad(mins);
}

// ═══════════════════════════════════════════ HAMBURGER MENU
var _menuOpen=false;
function toggleMenu(){
  _menuOpen=!_menuOpen;
  var d=document.getElementById('menuDrawer');
  var b1=document.getElementById('mb1');var b2=document.getElementById('mb2');var b3=document.getElementById('mb3');
  if(d)d.style.maxHeight=_menuOpen?'600px':'0';
  if(b1)b1.style.transform=_menuOpen?'translateY(6.5px) rotate(45deg)':'';
  if(b2)b2.style.opacity=_menuOpen?'0':'1';
  if(b3)b3.style.transform=_menuOpen?'translateY(-6.5px) rotate(-45deg)':'';
}

// ═══════════════════════════════════════════ SEND INTEREST (missing from split)
async function sendInt(to) {
  try {
    await sb.from('interests').insert({from_user:U.id, to_user:to, status:'pending'});
    closeModal();
    alert('Interest sent! 💝');
  } catch(x) {
    alert(x.message || 'Already sent');
  }
}

// ═══════════════════════════════════════════ BROWSE CHIPS (faith filter bar)
var quickFaithFilter = 'All';
function renderBrowseChips() {
  var chips = document.getElementById('browseChips'); if (!chips) return;
  var browseFaiths = [];
  try { browseFaiths = JSON.parse((P && P.faith_browse) || '[]'); } catch(x) { browseFaiths = FAITHS.map(function(f){return f.key;}); }
  var opts = ['All'].concat(browseFaiths);
  chips.innerHTML = '';
  opts.forEach(function(k) {
    var f = k === 'All' ? null : faithByKey(k);
    var on = quickFaithFilter === k;
    var btn = document.createElement('button');
    btn.style.cssText = 'white-space:nowrap;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid '+(on?(f?f.color:'var(--gold)'):'var(--w20)')+';background:'+(on?(f?f.bg:'rgba(232,184,48,.15)'):'transparent')+';color:'+(on?(f?f.color:'var(--gold)'):'var(--w50)');
    btn.textContent = k === 'All' ? '🌍 All' : (f ? f.icon+' '+k : k);
    btn.onclick = function(){ quickFaithFilter = k; renderBrowseChips(); ldBrowse(); };
    chips.appendChild(btn);
  });
}

// renderFaithPrefSummary — alias for backward compat
function renderFaithPrefSummary() {
  if (typeof renderFaithPrefCard === 'function') renderFaithPrefCard();
}
function filterPrefDenoms() {
  var rel = document.getElementById('fPR');
  var den = document.getElementById('fPD');
  if (!rel || !den) return;
  var map = {
    Christian: ['Any Denomination','Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','Orthodox','Mar Thoma','Brethren','Lutheran','Anglican','Non-Denom'],
    Hindu:     ['Any Denomination','Shaivism','Vaishnavism','Shaktism','ISKCON','Arya Samaj'],
    Muslim:    ['Any Denomination','Sunni','Shia','Sufi','Ahmadiyya','Ismaili'],
    Sikh:      ['Any Denomination','Amritdhari','Sahajdhari','Nanakpanthi'],
    Jain:      ['Any Denomination','Digambara','Shvetambara'],
    Buddhist:  ['Any Denomination','Theravada','Mahayana','Vajrayana','Zen'],
    Jewish:    ['Any Denomination','Orthodox','Conservative','Reform'],
    Parsi:     ['Any Denomination','Zoroastrian'],
    Any:       ['Any Denomination']
  };
  var options = map[rel.value] || ['Any Denomination'];
  den.innerHTML = options.map(function(o) {
    return '<option value="'+o+'">'+o+'</option>';
  }).join('');
}
