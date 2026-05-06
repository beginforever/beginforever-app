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
  if (diff <= 0) {
    ['cdDays','cdHours','cdMins','cdSecs','discoverDays','interestDays'].forEach(function(id) {
      var e = document.getElementById(id); if (e) e.textContent = '0';
    });
    return;
  }
  var days = Math.floor(diff / 86400000);
  var hrs  = Math.floor((diff % 86400000) / 3600000);
  var mins = Math.floor((diff % 3600000) / 60000);
  var secs = Math.floor((diff % 60000) / 1000);
  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  set('cdDays', pad(days)); set('cdHours', pad(hrs));
  set('cdMins', pad(mins)); set('cdSecs', pad(secs));
  set('discoverDays', days); set('interestDays', days);
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

// ═══════════════════════════════════════════ HOME
function renderHome() {
  var logo  = document.getElementById('appLogoImg');
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
  updatePricingCountdown();
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

// ═══════════════════════════════════════════ FAITH CARDS UI
function renderFaithCards(containerId, arr) {
  var c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = '';
  FAITH_CARDS.forEach(function(f) {
    var on = arr.indexOf(f.key) > -1;
    var card = document.createElement('div');
    card.style.cssText = [
      'display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:12px;',
      'cursor:pointer;transition:all .15s;margin-bottom:7px;',
      'border:1.5px solid '+(on?f.color:'rgba(255,255,255,.08)')+';',
      'background:'+(on?'rgba(255,255,255,.07)':'rgba(255,255,255,.02)')+';'
    ].join('');
    card.innerHTML =
      '<span style="font-size:22px;flex-shrink:0;">'+f.icon+'</span>'+
      '<div style="flex:1;min-width:0;">'+
        '<p style="font-size:13px;font-weight:700;color:'+(on?'#fff':'rgba(255,255,255,.5)')+';margin:0;">'+f.key+'</p>'+
        (f.denoms?'<p style="font-size:10px;color:rgba(255,255,255,.3);margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+f.denoms+'</p>':'')+
      '</div>'+
      '<span style="flex-shrink:0;font-size:16px;color:'+f.color+';width:20px;text-align:center;">'+(on?'✓':'')+'</span>';
    card.onclick = function() {
      var ix = arr.indexOf(f.key);
      if (ix > -1) arr.splice(ix, 1); else arr.push(f.key);
      renderFaithCards(containerId, arr);
    };
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
  var msg  = "I just joined Begin Forever — India's first 100% ID-verified matrimony platform! Join: " + link;
  if (navigator.share) navigator.share({title:'Begin Forever', text:msg, url:link});
  else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function(){ alert('Referral link copied!'); });
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


// ═══════════════════════════════════════════ SUBSCRIPTION & ACCESS

var SOFT_LAUNCH_DATE = new Date('2025-06-15T00:00:00Z'); // ← update to your real launch date

function isFoundingMember() {
  if (!P) return false;
  if (P.is_founding_member) return true;
  if (P.created_at && new Date(P.created_at) < SOFT_LAUNCH_DATE) return true;
  return false;
}

function checkSubscription(onAllowed) {
  if (isFoundingMember()) { onAllowed(); return; }
  sb.from('subscriptions')
    .select('id')
    .eq('user_id', U.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .then(function(r) {
      if (r.data && r.data.length > 0) { onAllowed(); }
      else { showSubscribeModal(); }
    }).catch(function() { onAllowed(); });
}

function showSubscribeModal() {
  var m = document.getElementById('subscribeModal');
  if (m) m.classList.add('active');
}
function closeSubscribeModal() {
  var m = document.getElementById('subscribeModal');
  if (m) m.classList.remove('active');
}

// Pricing teaser countdown (mirrors main countdown but targets pricing overlay)
function updatePricingCountdown() {
  if (!LAUNCH) return;
  var diff = LAUNCH - new Date();
  var el = document.getElementById('pricingCdWrap');
  if (!el) return;
  if (diff <= 0) {
    // Launch passed — hide overlay, show plans
    var overlay = el.closest('.pricing-teaser-wrap') && el.closest('.pricing-teaser-wrap').querySelector('.pricing-teaser-overlay');
    if (overlay) overlay.style.display = 'none';
    var blur = el.closest('.pricing-teaser-wrap') && el.closest('.pricing-teaser-wrap').querySelector('.pricing-blur');
    if (blur) { blur.style.filter = 'none'; blur.style.opacity = '1'; blur.style.pointerEvents = ''; }
    return;
  }
  var days = Math.floor(diff / 86400000);
  var hrs  = Math.floor((diff % 86400000) / 3600000);
  var mins = Math.floor((diff % 3600000) / 60000);
  var pad = function(n){ return String(Math.max(0,n)).padStart(2,'0'); };
  var d = document.getElementById('pcDays'); if(d) d.textContent = pad(days);
  var h = document.getElementById('pcHrs');  if(h) h.textContent = pad(hrs);
  var m = document.getElementById('pcMins'); if(m) m.textContent = pad(mins);
  // Show founding member message
  var fm = document.getElementById('pricingFounderMsg');
  if (fm && P && isFoundingMember()) fm.style.display = 'block';
}
setInterval(updatePricingCountdown, 30000);

function payRzp(plan, amt) {
  // Calculate expiry based on plan
  var days = 7; // default weekly
  if (plan.indexOf('Monthly') !== -1) days = 30;
  if (plan.indexOf('Quarterly') !== -1) days = 90;
  var tier = plan.indexOf('Premium') !== -1 ? 'premium' : 'basic';
  var opts = {
    key:'rzp_live_SausbldU6Vqpy0', amount:amt, currency:'INR',
    name:'Begin Forever', description:plan+' Plan',
    handler:async function(resp){
      try {
        await sb.from('subscriptions').insert({
          user_id:U.id, plan_type:plan, plan_tier:tier,
          amount_paid:amt, razorpay_payment_id:resp.razorpay_payment_id,
          status:'active',
          expires_at:new Date(Date.now()+days*24*60*60*1000).toISOString()
        });
      } catch(x){}
      closeSubscribeModal();
      alert('\u2726 Welcome to '+plan+'!\nYour plan is now active. Enjoy Begin Forever!');
      await loadP();
    },
    prefill:{name:P?P.full_name:'', email:P?P.email:'', contact:P?P.phone:''},
    theme:{color:'#3B0764'}
  };
  var rzp = new Razorpay(opts);
  rzp.open();
}
var _menuOpen = false;
function toggleMenu(){
  _menuOpen = !_menuOpen;
  var d  = document.getElementById('menuDrawer');
  var b1 = document.getElementById('mb1');
  var b2 = document.getElementById('mb2');
  var b3 = document.getElementById('mb3');
  d.style.maxHeight  = _menuOpen ? '600px' : '0';
  b1.style.transform = _menuOpen ? 'translateY(6.5px) rotate(45deg)' : '';
  b2.style.opacity   = _menuOpen ? '0' : '1';
  b3.style.transform = _menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : '';
}