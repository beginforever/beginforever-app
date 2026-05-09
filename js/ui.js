// ═══════════════════════════════════════════ SCREEN MANAGEMENT
function showScr(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.style.display = 'none';
    s.classList.remove('active');
  });
  var el = document.getElementById(id);
  if (!el) return;
  el.classList.add('active');
  el.style.display = (id === 'mainApp') ? 'block' : 'flex';
}
function show(id) { showScr(id); }

// ═══════════════════════════════════════════ COUNTDOWN
function updateCountdown() {
  var diff = LAUNCH - new Date();
  var pad = function(n) { return String(Math.max(0, n)).padStart(2, '0'); };
  var days = Math.max(0, Math.floor(diff / 86400000));
  var hrs  = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  var mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
  var secs = Math.max(0, Math.floor((diff % 60000) / 1000));
  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  set('cdDays', pad(days)); set('cdHours', pad(hrs));
  set('cdMins', pad(mins)); set('cdSecs', pad(secs));
  set('discoverDays', days); set('interestDays', days);
  updatePricingCountdown();
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ═══════════════════════════════════════════ TABS
function goTab(t) {
  ['tHome','tBrowse','tInterests','tChat','tViews','tProfile','tPlans','tReviews','tAdmin'].forEach(function(x) {
    var el = document.getElementById(x); if (el) el.style.display = 'none';
  });
  var key = t.charAt(0).toUpperCase() + t.slice(1);
  var target = document.getElementById('t' + key);
  if (target) target.style.display = '';
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  var tabMap = {home:'tabHome',browse:'tabBrowse',interests:'tabInterests',chat:'tabChat',
    views:'tabProfile',profile:'tabProfile',plans:'tabHome',reviews:'tabHome',admin:'adTab'};
  var ab = document.getElementById(tabMap[t]);
  if (ab) ab.classList.add('active');
  if (t === 'home')      renderHome();
  if (t === 'browse')    ldBrowse();
  if (t === 'interests') ldInt('received');
  if (t === 'chat')      ldChats();
  if (t === 'views')     ldViews();
  if (t === 'profile')   renP();
  if (t === 'admin')     ldAdmin('pending');
}

// ═══════════════════════════════════════════ PRE-LAUNCH LOCK
function isTabLocked(tab) {
  if (!isPreLaunch()) return false;
  if (P && P.is_admin) return false;
  return ['browse','interests','chat','chatWin','views'].indexOf(tab) > -1;
}

function renderPreLaunchBanner(tabName) {
  var diff = LAUNCH - new Date();
  var days = Math.max(0, Math.floor(diff / 86400000));
  var hrs  = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  var mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
  var labels = {
    browse:    { icon:'🔍', title:'Discover opens on 20 May',      sub:'Your profile is verified and ready. The moment we launch, your matches will appear here.' },
    interests: { icon:'💝', title:'Interests open on 20 May',      sub:'Every interest you receive will appear here at launch. 300+ verified members are waiting.' },
    chat:      { icon:'💬', title:'Chat opens on 20 May',          sub:'Connections, conversations, beginnings — all of it unlocks in just a few days.' },
    views:     { icon:'👁️', title:'Who Viewed Me opens on 20 May', sub:"Once launch begins, you'll be able to see everyone who visited your profile." },
  };
  var info = labels[tabName] || labels.browse;
  return '<div style="padding:20px 16px 90px;">' +
    '<div style="background:linear-gradient(160deg,#1C0530,#130220);border:1px solid rgba(212,160,23,.25);border-radius:18px;padding:24px 20px;position:relative;overflow:hidden;">' +
      '<div style="position:absolute;top:-60px;right:-40px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(212,160,23,.1),transparent 70%);pointer-events:none;"></div>' +
      '<div style="position:relative;z-index:1;">' +
        '<div style="font-size:38px;margin-bottom:10px;">'+info.icon+'</div>' +
        '<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(212,160,23,.12);border:1px solid rgba(212,160,23,.3);border-radius:20px;padding:4px 12px;font-size:9px;font-weight:800;color:var(--gold2);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;">' +
          '<span style="width:5px;height:5px;border-radius:50%;background:var(--gold2);animation:blink 1.6s infinite;display:inline-block;"></span>Launching 20 May 2026' +
        '</div>' +
        '<h2 style="font-family:\'Cinzel\',serif;font-size:20px;font-weight:700;color:#fff;line-height:1.3;margin-bottom:10px;">'+info.title+'</h2>' +
        '<p style="font-size:12px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:18px;">'+info.sub+'</p>' +
        '<div style="display:flex;gap:8px;margin-bottom:18px;">' +
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(212,160,23,.2);border-radius:11px;padding:10px 4px;text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:24px;font-weight:900;color:var(--gold2);line-height:1;">'+String(days).padStart(2,'0')+'</div><div style="font-size:9px;color:rgba(255,255,255,.3);margin-top:3px;text-transform:uppercase;letter-spacing:1px;">Days</div></div>' +
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(212,160,23,.2);border-radius:11px;padding:10px 4px;text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:24px;font-weight:900;color:var(--gold2);line-height:1;">'+String(hrs).padStart(2,'0')+'</div><div style="font-size:9px;color:rgba(255,255,255,.3);margin-top:3px;text-transform:uppercase;letter-spacing:1px;">Hrs</div></div>' +
          '<div style="flex:1;background:rgba(255,255,255,.04);border:1px solid rgba(212,160,23,.2);border-radius:11px;padding:10px 4px;text-align:center;"><div style="font-family:\'Cinzel\',serif;font-size:24px;font-weight:900;color:var(--gold2);line-height:1;">'+String(mins).padStart(2,'0')+'</div><div style="font-size:9px;color:rgba(255,255,255,.3);margin-top:3px;text-transform:uppercase;letter-spacing:1px;">Mins</div></div>' +
        '</div>' +
        '<div style="background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.2);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px;margin-bottom:14px;">' +
          '<span style="font-size:20px;">✅</span>' +
          '<div><p style="font-size:12px;font-weight:700;color:#4ade80;margin:0;">Your profile is verified &amp; ready</p>' +
          '<p style="font-size:11px;color:rgba(255,255,255,.4);margin:2px 0 0;">You\'ll be among the first visible to matches at launch</p></div>' +
        '</div>' +
        '<button style="width:100%;padding:12px;background:linear-gradient(135deg,#D4A017,#F5C842);color:#1A0830;font-family:\'Cinzel\',serif;font-size:13px;font-weight:700;border:none;border-radius:10px;cursor:pointer;" onclick="shareApp()">✦ Invite someone special</button>' +
        '<p style="font-family:\'EB Garamond\',serif;font-style:italic;font-size:11px;color:rgba(255,255,255,.25);text-align:center;margin-top:12px;">"A time to love." — Ecclesiastes 3:8</p>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// ═══════════════════════════════════════════ HOME
function renderHome() {
  var logo = document.getElementById('appLogoImg');
  var hLogo = document.getElementById('homeLogoImg');
  if (logo && hLogo && logo.src) hLogo.src = logo.src;
  var wn = document.getElementById('hWelcomeName');
  if (wn && P) wn.textContent = P.full_name ? P.full_name.split(' ')[0] : 'Friend';
  var ws = document.getElementById('hWelcomeSub');
  if (ws && P) {
    var f = faithByKey(P.religion || 'Other');
    ws.innerHTML = '<span style="color:'+f.color+'">'+f.icon+' '+(P.denomination||P.religion||'')+'</span> &nbsp;·&nbsp; '+P.city;
  }
  var av = document.getElementById('homeAvatarThumb');
  if (av && P && P.photo_url) { av.style.backgroundImage = 'url('+P.photo_url+')'; av.innerHTML = ''; }
  var hn = document.getElementById('hName');
  if (hn && P) hn.textContent = P.full_name ? P.full_name.split(' ')[0] : '';
  var pb = document.getElementById('pendingBannerHome');
  if (pb) pb.style.display = (P && P.status === 'pending') ? '' : 'none';
  var sc = document.getElementById('homeSafetyCard');
  if (sc) sc.style.display = (P && P.gender === 'Female') ? '' : 'none';
  loadStats();
}

async function loadStats() {
  try {
    var [v, i, m] = await Promise.all([
      sb.from('profile_views').select('id',{count:'exact',head:true}).eq('viewed_id', U.id),
      sb.from('interests').select('id',{count:'exact',head:true}).eq('to_user_id', U.id),
      sb.from('messages').select('id',{count:'exact',head:true}).eq('receiver_id', U.id)
    ]);
    ['statViews','pStatViews'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=v.count||0;});
    ['statInt','pStatInt'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=i.count||0;});
    ['statMsg','pStatMsg'].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=m.count||0;});
  } catch(x) {}
}

// ═══════════════════════════════════════════ TAB FUNCTIONS
// NOTE: ldBrowse, ldInt, ldChats, ldViews are defined in browse.js / their own files.
// This file only provides the pre-launch banner helper + isTabLocked().
// DO NOT redefine those functions here — that would overwrite the real implementations.

function showInt(t) { if(typeof ldInt === 'function') ldInt(t); }
async function actInt(id,st) { await sb.from('interests').update({status:st}).eq('id',id); if(typeof ldInt==='function') ldInt('received'); }
async function openChat(pid) {}
async function ldMsgs() {}
async function sendMsg() {}

// ═══════════════════════════════════════════ FAITH CARDS UI
function renderFaithCards(containerId, arr) {
  var c = document.getElementById(containerId); if (!c) return;
  c.innerHTML = '';
  FAITH_CARDS.forEach(function(f) {
    var on = arr.indexOf(f.key) > -1;
    var card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:12px;cursor:pointer;transition:all .15s;margin-bottom:7px;border:1.5px solid '+(on?f.color:'rgba(255,255,255,.08)')+';background:'+(on?'rgba(255,255,255,.07)':'rgba(255,255,255,.02)')+';';
    card.innerHTML = '<span style="font-size:22px;flex-shrink:0;">'+f.icon+'</span><div style="flex:1;min-width:0;"><p style="font-size:13px;font-weight:700;color:'+(on?'#fff':'rgba(255,255,255,.5)')+';margin:0;">'+f.key+'</p>'+(f.denoms?'<p style="font-size:10px;color:rgba(255,255,255,.3);margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+f.denoms+'</p>':'')+'</div><span style="flex-shrink:0;font-size:16px;color:'+f.color+';width:20px;text-align:center;">'+(on?'✓':'')+'</span>';
    card.onclick = function() { var ix=arr.indexOf(f.key); if(ix>-1) arr.splice(ix,1); else arr.push(f.key); renderFaithCards(containerId,arr); };
    c.appendChild(card);
  });
}
function renderFaithGrid(cid, arr) { renderFaithCards(cid, arr); }

// ═══════════════════════════════════════════ MISC HELPERS
function togglePw(inputId, btn) {
  var inp = document.getElementById(inputId);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? 'Show' : 'Hide';
}

function shareApp() {
  var code = P ? P.id.slice(0,8) : 'friend';
  var link = 'https://beginforever.in?ref=' + code;
  var msg = "I just joined Begin Forever — India's first 100% ID-verified matrimony platform! Join: " + link;
  if (navigator.share) navigator.share({title:'Begin Forever', text:msg, url:link});
  else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function(){ alert('Referral link copied! 🔗'); });
}

async function checkNotifs() {
  if (!U) return;
  try {
    var r = await sb.from('interests').select('id',{count:'exact',head:true}).eq('to_user_id', U.id).eq('status','pending');
    var dot = document.getElementById('intDot');
    if (dot && r.count > 0) dot.style.display = '';
  } catch(x) {}
}

function submitReview() {
  var txt = document.getElementById('revText');
  if (txt && !txt.value.trim()) { alert('Please write your review.'); return; }
  alert('Thank you! Your review will be published after moderation.');
  if (txt) txt.value = '';
}

// ═══════════════════════════════════════════ SUBSCRIPTION HELPERS
function planTierFromType(planType) {
  if (!planType) return 'none';
  return planType.toLowerCase().indexOf('premium') > -1 ? 'premium' : 'basic';
}

async function getActiveSub() {
  if (!U) return null;
  try {
    var r = await sb.from('subscriptions').select('*').eq('user_id',U.id).eq('status','active')
      .gt('expires_at',new Date().toISOString()).order('expires_at',{ascending:false}).limit(1);
    return (r.data && r.data.length > 0) ? r.data[0] : null;
  } catch(x) { return null; }
}

function isFoundingWithinFreeWeek() {
  if (!P || !P.is_founding_member) return false;
  var launchPlus7 = new Date(LAUNCH.getTime() + 7*24*60*60*1000);
  return new Date() >= LAUNCH && new Date() < launchPlus7;
}

async function hasPremium() {
  if (P && P.is_admin) return true;
  if (isFoundingWithinFreeWeek()) return true;
  var sub = await getActiveSub();
  if (!sub) return false;
  return planTierFromType(sub.plan_type) === 'premium';
}

async function hasAnySub() {
  if (P && P.is_admin) return true;
  if (isFoundingWithinFreeWeek()) return true;
  return (await getActiveSub()) !== null;
}

async function openFaithPrefsGated() {
  if (isPreLaunch()) { openFaithPrefs(); return; }
  var ok = await hasPremium();
  if (ok) openFaithPrefs();
  else showSubscribeModal('faith');
}

async function maybeActivateFoundingPremium() {
  if (!P || !P.is_founding_member || isPreLaunch()) return;
  if (P.founding_premium_activated) return;
  try {
    var existing = await sb.from('subscriptions').select('id').eq('user_id',U.id).eq('plan_type','Founding Premium').limit(1);
    if (existing.data && existing.data.length > 0) return;
    var launchPlus7 = new Date(LAUNCH.getTime() + 7*24*60*60*1000);
    await sb.from('subscriptions').insert({
      user_id:U.id, plan_type:'Founding Premium', plan_tier:'premium', amount_paid:0,
      status:'active', started_at:LAUNCH.toISOString(), expires_at:launchPlus7.toISOString()
    });
    await sb.from('profiles').update({founding_premium_activated:true}).eq('id',U.id);
    if (P) P.founding_premium_activated = true;
  } catch(x) { console.warn('Founding premium activation:', x); }
}

// Legacy aliases
function isFoundingMember() { return !!(P && P.is_founding_member); }
function checkSubscription(onAllowed) {
  hasAnySub().then(function(ok){ if(ok) onAllowed(); else showSubscribeModal(); });
}

// ═══════════════════════════════════════════ SUBSCRIBE MODAL
function showSubscribeModal(feature) {
  var m = document.getElementById('subscribeModal'); if (!m) return;
  var msgs = {
    faith:   'Faith Preferences require a Premium plan — control exactly who you discover and who can reach you.',
    browse:  'Browsing profiles requires a subscription.',
    chat:    'Messaging requires a subscription.',
    default: 'Choose a plan to browse, connect and find your forever.'
  };
  var sub = m.querySelector('.subscribe-subtitle');
  if (sub) sub.textContent = msgs[feature] || msgs.default;
  m.classList.add('active');
}
function closeSubscribeModal() {
  var m = document.getElementById('subscribeModal'); if (m) m.classList.remove('active');
}

// ═══════════════════════════════════════════ RAZORPAY
function payRzp(plan, amt) {
  var tier = planTierFromType(plan);
  var days = plan.indexOf('Quarterly')!==-1 ? 90 : plan.indexOf('Monthly')!==-1 ? 30 : 7;
  var opts = {
    key:'rzp_live_SausbldU6Vqpy0', amount:amt, currency:'INR',
    name:'Begin Forever', description:plan+' Plan',
    handler: async function(resp) {
      try {
        await sb.from('subscriptions').insert({
          user_id:U.id, plan_type:plan, plan_tier:tier, amount_paid:amt,
          razorpay_payment_id:resp.razorpay_payment_id, status:'active',
          started_at:new Date().toISOString(),
          expires_at:new Date(Date.now()+days*24*60*60*1000).toISOString()
        });
      } catch(x) {}
      closeSubscribeModal();
      alert('✦ Welcome to '+plan+'!\nYour plan is now active.');
      await loadP();
    },
    prefill:{name:P?P.full_name:'', email:P?P.email:'', contact:P?P.phone:''},
    theme:{color:'#3B0764'}
  };
  new Razorpay(opts).open();
}

// ═══════════════════════════════════════════ PRICING COUNTDOWN
function updatePricingCountdown() {
  if (!LAUNCH) return;
  var diff = LAUNCH - new Date();
  if (diff <= 0) {
    var overlay = document.querySelector('.pricing-teaser-overlay');
    if (overlay) overlay.style.display = 'none';
    var blur = document.querySelector('.pricing-blur');
    if (blur) { blur.style.filter='none'; blur.style.opacity='1'; blur.style.pointerEvents=''; }
    var fm = document.getElementById('pricingFounderMsg');
    if (fm && P && P.is_founding_member && !P.founding_premium_activated) fm.style.display = 'block';
    return;
  }
  var days = Math.max(0,Math.floor(diff/86400000));
  var hrs  = Math.max(0,Math.floor((diff%86400000)/3600000));
  var mins = Math.max(0,Math.floor((diff%3600000)/60000));
  var pad = function(n){ return String(Math.max(0,n)).padStart(2,'0'); };
  var d=document.getElementById('pcDays'); if(d) d.textContent=pad(days);
  var h=document.getElementById('pcHrs');  if(h) h.textContent=pad(hrs);
  var m=document.getElementById('pcMins'); if(m) m.textContent=pad(mins);
}

// ═══════════════════════════════════════════ HAMBURGER MENU
var _menuOpen = false;
function toggleMenu() {
  _menuOpen = !_menuOpen;
  var d=document.getElementById('menuDrawer');
  var b1=document.getElementById('mb1');
  var b2=document.getElementById('mb2');
  var b3=document.getElementById('mb3');
  if(d)  d.style.maxHeight  = _menuOpen ? '600px' : '0';
  if(b1) b1.style.transform = _menuOpen ? 'translateY(6.5px) rotate(45deg)' : '';
  if(b2) b2.style.opacity   = _menuOpen ? '0' : '1';
  if(b3) b3.style.transform = _menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : '';
}
