// Begin Forever — UI v21
// Changes from v20:
// - showLockToast() added
// - ldBrowse() updated: pre-launch shows anonymous cards for ALL approved profiles
// - post-launch restores gender filter, age/marital/faith filters, full cards
// - Interests + Chat banners updated to June 21
// - blink keyframe injected at runtime

// ═══ SCREEN MANAGEMENT
function showScr(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.style.display = 'none'; s.classList.remove('active'); });
  var el = document.getElementById(id); if (!el) return;
  el.classList.add('active');
  el.style.display = (id === 'mainApp') ? 'block' : 'flex';
}
function show(id) { showScr(id); }

// Inject blink keyframe if missing
(function() {
  if (!document.getElementById('bf-blink-style')) {
    var s = document.createElement('style');
    s.id = 'bf-blink-style';
    s.textContent = '@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}';
    document.head.appendChild(s);
  }
})();

// ═══ LAUNCH AUTO-DETECTION
var _wasPreLaunch = isPreLaunch ? isPreLaunch() : true;
var _launchPollInterval = setInterval(function() {
  if (!_wasPreLaunch) { clearInterval(_launchPollInterval); return; }
  var nowPreLaunch = (typeof isPreLaunch === 'function') ? isPreLaunch() : true;
  if (_wasPreLaunch && !nowPreLaunch) {
    _wasPreLaunch = false;
    clearInterval(_launchPollInterval);
    if (typeof goTab === 'function' && P && P.status === 'approved') {
      goTab('home');
      var t = document.createElement('div');
      t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#9B30C9,#C13DBF);color:#1A0830;padding:14px 24px;border-radius:50px;font-size:14px;font-weight:800;z-index:9999;box-shadow:0 6px 24px rgba(155,48,201,0.5);';
      t.textContent = '🎉 Begin Forever is LIVE! Discover your matches now.';
      document.body.appendChild(t);
      setTimeout(function() { if (document.body.contains(t)) t.remove(); }, 6000);
    }
  }
}, 30000);

// ═══ COUNTDOWN
function updateCountdown() {
  var diff = LAUNCH - new Date();
  var pad = function(n) { return String(Math.max(0, n)).padStart(2, '0'); };
  var days = Math.max(0, Math.floor(diff / 86400000));
  var hrs  = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  var mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
  var secs = Math.max(0, Math.floor((diff % 60000) / 1000));
  function set(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  set('cdDays', pad(days)); set('cdHours', pad(hrs)); set('cdMins', pad(mins)); set('cdSecs', pad(secs));
  set('discoverDays', days); set('interestDays', days);
  if (typeof updatePricingCountdown === 'function') updatePricingCountdown();
}
setInterval(updateCountdown, 1000);
updateCountdown();

// ═══ TABS
function goTab(t) {
  if (P) {
    if (P.status === 'rejected')     { renderRejectedScreen(P); showScr('rejectedScreen'); return; }
    if (P.status === 'pending')      { showScr('pendingScreen'); return; }
    if (P.status === 'resubmitting') { prefillSetupWizard(P); showScr('setupScreen'); step = 1; updUI(); return; }
  }

  var cw = document.getElementById('tChatWin');
  if (cw) cw.style.display = 'none';
  var ma = document.getElementById('mainApp');
  if (ma) { ma.style.display = 'block'; ma.classList.add('active'); }
  var obs = document.getElementById('onboardingScreen'); if (obs) { obs.style.display = 'none'; obs.classList.remove('active'); }

  ['tHome','tBrowse','tInterests','tChat','tViews','tProfile','tPlans','tReviews','tAdmin'].forEach(function(x) {
    var el = document.getElementById(x); if (el) el.style.display = 'none';
  });
  if (t !== 'admin') { var adL = document.getElementById('adList'); if (adL) adL.innerHTML = ''; }
  if (t !== 'chatWin') _destroyChatRealtime();

  if (typeof _editMode !== 'undefined' && _editMode) { _editMode = false; }

  var key = t.charAt(0).toUpperCase() + t.slice(1);
  var target = document.getElementById('t' + key);
  if (target) target.style.display = '';
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  var tabMap = { home: 'tabHome', browse: 'tabBrowse', interests: 'tabInterests', chat: 'tabChat',
    views: 'tabProfile', profile: 'tabProfile', plans: 'tabHome', reviews: 'tabHome', admin: 'adTab' };
  var ab = document.getElementById(tabMap[t]); if (ab) ab.classList.add('active');

  if (t === 'home')      renderHome();
  if (t === 'browse')    ldBrowse();
  if (t === 'interests') ldInt('received');
  if (t === 'chat')      ldChats();
  if (t === 'views')     ldViews();
  if (t === 'profile')   { if (typeof _editMode !== 'undefined') _editMode = false; renP(); }
  if (t === 'admin') {
    if (!P || !P.is_admin) { goTab('home'); return; }
    ldAdmin('pending');
  }
  var adTabEl = document.getElementById('adTab');
  if (adTabEl) adTabEl.style.display = (P && P.is_admin) ? '' : 'none';

  if (typeof _handleToastOnTabChange === 'function') _handleToastOnTabChange(t);
}

// ═══ HOME
function renderHome() {
  if (!P || P.status === 'rejected' || P.status === 'pending') return;
  var logo = document.getElementById('appLogoImg'), hLogo = document.getElementById('homeLogoImg');
  if (logo && hLogo && logo.src) hLogo.src = logo.src;
  var wn = document.getElementById('hWelcomeName'); if (wn && P) wn.textContent = P.full_name ? P.full_name.split(' ')[0] : 'Friend';
  var ws = document.getElementById('hWelcomeSub');
  if (ws && P) { var f = faithByKey(P.religion || 'Other'); ws.innerHTML = '<span style="color:' + f.color + '">' + f.icon + ' ' + (P.denomination || P.religion || '') + '</span> &nbsp;·&nbsp; ' + P.city; }
  var av = document.getElementById('homeAvatarThumb');
  if (av && P && P.photo_url) { av.style.backgroundImage = 'url(' + P.photo_url + ')'; av.innerHTML = ''; }
  var hn = document.getElementById('hName'); if (hn && P) hn.textContent = P.full_name ? P.full_name.split(' ')[0] : '';
  var pb = document.getElementById('pendingBannerHome'); if (pb) pb.style.display = (P && P.status === 'pending') ? '' : 'none';
  var sc = document.getElementById('homeSafetyCard'); if (sc) sc.style.display = (P && P.gender === 'Female') ? '' : 'none';
  loadStats();
}

var _statsTimer = null;
function loadStats() {
  if (_statsTimer) return;
  _statsTimer = setTimeout(function() { _statsTimer = null; }, 3000);
  _doLoadStats();
}
async function _doLoadStats() {
  try {
    var [v, i, m] = await Promise.all([
      sb.from('profile_views').select('id', { count: 'exact', head: true }).eq('viewed_id', U.id),
      sb.from('interests').select('id', { count: 'exact', head: true }).eq('to_user', U.id),
      sb.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', U.id)
    ]);
    ['statViews','pStatViews'].forEach(function(id) { var e = document.getElementById(id); if (e) e.textContent = v.count || 0; });
    ['statInt','pStatInt'].forEach(function(id) { var e = document.getElementById(id); if (e) e.textContent = i.count || 0; });
    ['statMsg','pStatMsg'].forEach(function(id) { var e = document.getElementById(id); if (e) e.textContent = m.count || 0; });
  } catch(x) {}
}

// ═══ LOCK TOAST — shown when anonymous card is tapped pre-launch
function showLockToast() {
  var t = document.getElementById('lockToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'lockToast';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#3B0764;color:#C13DBF;padding:10px 20px;border-radius:20px;font-size:12px;font-weight:700;z-index:9999;border:1px solid rgba(155,48,201,.4);white-space:nowrap;display:none;';
    t.textContent = '🔒 Full profile unlocks June 21';
    document.body.appendChild(t);
  }
  t.style.display = 'block';
  setTimeout(function(){ t.style.display = 'none'; }, 2500);
}

// ═══ INTENT (Phase 2)
var _INTENT_META={marriage_soon:{label:'Marriage',grp:'marriage',c:'#C13DBF'},marriage_intime:{label:'Marriage',grp:'marriage',c:'#C13DBF'},partnership:{label:'Partnership',grp:'both',c:'#9B30C9'},companionship:{label:'Companionship',grp:'companion',c:'#2E7D52'},later_life:{label:'Companionship',grp:'companion',c:'#2E7D52'},friendship:{label:'Friendship',grp:'friend',c:'#3F7DC0'}};
function _intentCompat(mine,theirs){if(!mine||!theirs)return true;var a=_INTENT_META[mine],b=_INTENT_META[theirs];if(!a||!b)return true;if(a.grp==='both'||b.grp==='both')return true;return a.grp===b.grp;}
function _intentBadge(k){var m=_INTENT_META[k];if(!m)return '';return '<span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:.04em;padding:2px 8px;border-radius:20px;background:'+m.c+'22;color:'+m.c+';border:1px solid '+m.c+'55;">'+m.label+'</span>';}

// ═══ BROWSE
async function ldBrowse() {
  if (!P) return;
  if (P.status === 'pending') {
    var l = document.getElementById('bList');
    if (l) l.innerHTML = '<div style="text-align:center;padding:40px 20px"><div style="font-size:40px">🔒</div><p style="color:#C13DBF;font-size:14px;font-weight:700;margin-top:12px">Profile Under Review</p></div>';
    return;
  }
  if (typeof loadBlockedIds === 'function') await loadBlockedIds();

  var preLaunch = isPreLaunch();
  var q = sb.from('profiles').select('*').eq('status', 'approved').neq('id', U.id);

  if (!preLaunch) {
    // Post-launch: gender filter + all preference filters restored
    var g = P.gender === 'Male' ? 'Female' : 'Male';
    q = q.eq('gender', g);

    // Faith filter
    var browseFaiths = [];
    try { browseFaiths = JSON.parse(P.faith_browse || '[]'); } catch(x) {}
    if (quickFaithFilter !== 'All') {
      q = q.eq('religion', quickFaithFilter);
    } else if (browseFaiths.length > 0 && browseFaiths.length < FAITHS.length) {
      q = q.in('religion', browseFaiths);
    }

    // Age filter
    if (P.pref_age_min && P.pref_age_min > 18) q = q.gte('age', P.pref_age_min);
    if (P.pref_age_max && P.pref_age_max < 70) q = q.lte('age', P.pref_age_max);

    // Marital status filter
    var prefMarital = [];
    try { prefMarital = JSON.parse(P.pref_marital_statuses || '[]'); } catch(x) {}
    if (prefMarital.length > 0) q = q.in('marital_status', prefMarital);
  }

  var r = await q.order('created_at', { ascending: false });
  var d = r.data || [];
  if (typeof BLOCKED_IDS !== 'undefined' && BLOCKED_IDS.length > 0) {
    d = d.filter(function(p) { return BLOCKED_IDS.indexOf(p.id) === -1; });
  }

  if (!preLaunch && P.intent) { d = d.filter(function(p){ return _intentCompat(P.intent, p.intent); }); }
  var be = document.getElementById('bEmpty'); if (be) be.style.display = d.length ? 'none' : '';
  var l = document.getElementById('bList'); if (!l) return; l.innerHTML = '';

  d.forEach(function(p) {
    var f = faithByKey(p.religion || 'Other');
    if (preLaunch) {
      // Anonymous card
      l.innerHTML +=
        '<div style="background:#1C0530;border-radius:14px;padding:14px;margin-bottom:8px;border:1px solid ' + f.color + '33;display:flex;align-items:center;gap:12px;" onclick="showLockToast()">'
        + '<div style="width:52px;height:52px;border-radius:50%;background:' + f.bg + ';border:2px solid ' + f.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;">' + f.icon + '</div>'
        + '<div style="flex:1;">'
        + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">'
        + '<span style="font-size:13px;font-weight:700;color:#fff;">Member</span>'
        + (p.denomination ? '<span style="font-size:10px;padding:2px 8px;background:' + f.bg + ';border:1px solid ' + f.color + '59;border-radius:20px;color:' + f.color + ';font-weight:700;">' + p.denomination + '</span>' : '')
        + '</div>'
        + '<div style="font-size:11px;color:rgba(255,255,255,.5);">' + p.city + ', ' + p.state + '</div>'
        + (_intentBadge(p.intent) ? '<div style="margin-top:5px;">' + _intentBadge(p.intent) + '</div>' : '')
        + '<div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:3px;">Joins full discovery on Jun 21</div>'
        + '</div>'
        + '<div style="width:28px;height:28px;border-radius:50%;background:rgba(155,48,201,.08);border:1px solid rgba(155,48,201,.2);display:flex;align-items:center;justify-content:center;font-size:13px;">🔒</div>'
        + '</div>';
    } else {
      // Full card post-launch
      renderBrowseChips();
      var ph = p.photo_url ? 'background-image:url(' + p.photo_url + ');background-size:cover;background-position:center' : '';
      l.innerHTML +=
        '<div class="card" onclick="viewProfile(\'' + p.id + '\')"><div style="display:flex;gap:12px;align-items:center">'
        + '<div class="avatar" style="' + ph + ';border-color:' + f.color + '">' + (!p.photo_url ? '<span style="font-size:20px;opacity:.3">👤</span>' : '') + '</div>'
        + '<div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">' + p.full_name + ', ' + p.age + '</h3>'
        + '<p style="font-size:11px;margin:3px 0"><span style="color:' + f.color + '">' + f.icon + ' ' + (p.religion || '') + '</span>' + (p.denomination ? ' · <span style="color:var(--w50)">' + p.denomination + '</span>' : '') + '</p>'
        + '<p style="font-size:10px;color:var(--w50)">' + p.city + ', ' + p.state + '</p>' + (_intentBadge(p.intent) ? '<div style="margin-top:4px;">' + _intentBadge(p.intent) + '</div>' : '') + '</div>'
        + '<span style="font-size:18px">→</span></div>'
        + (p.bio ? '<p style="font-size:12px;color:var(--w50);margin-top:8px;line-height:1.4;overflow:hidden;max-height:36px">' + p.bio + '</p>' : '')
        + '</div>';
    }
  });
}

// ═══ INTERESTS
async function ldInt(type) {
  ['intRecBtn','intSentBtn','intMutBtn'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.className = 'btn btn-sm btn-dark';
  });
  var activeId = { received: 'intRecBtn', sent: 'intSentBtn', mutual: 'intMutBtn' }[type];
  var activeEl = document.getElementById(activeId); if (activeEl) activeEl.className = 'btn btn-sm btn-gold';
  var r;
  if (type === 'received') r = await sb.from('interests').select('*,profiles!interests_from_user_fkey(*)').eq('to_user', U.id).eq('status', 'pending').order('created_at', { ascending: false });
  else if (type === 'sent') r = await sb.from('interests').select('*,profiles!interests_to_user_fkey(*)').eq('from_user', U.id).order('created_at', { ascending: false });
  else r = await sb.from('interests').select('*,profiles!interests_from_user_fkey(*)').eq('to_user', U.id).eq('status', 'accepted').order('created_at', { ascending: false });
  var d = r.data || [];
  var ie = document.getElementById('intEmpty'); if (ie) ie.style.display = d.length ? 'none' : '';
  var l = document.getElementById('intList'); if (!l) return; l.innerHTML = '';
  d.forEach(function(i) {
    var p = i.profiles; if (!p) return;
    var f = faithByKey(p.religion || 'Other');
    l.innerHTML += '<div class="card"><div style="display:flex;gap:10px;align-items:center">' +
      '<div class="avatar" style="' + (p.photo_url ? 'background-image:url(' + p.photo_url + ');background-size:cover;background-position:center' : '') + ';border-color:' + f.color + '">' + (!p.photo_url ? '<span style="font-size:18px;opacity:.3">👤</span>' : '') + '</div>' +
      '<div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">' + p.full_name + ', ' + p.age + '</h3>' +
      '<p style="font-size:11px;color:' + f.color + '">' + f.icon + ' ' + (p.denomination || p.religion || '') + '<span style="color:var(--w50)"> · ' + p.city + '</span></p></div></div>' +
      (type === 'received' ? '<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-grn btn-sm" style="flex:1" onclick="actInt(\'' + i.id + '\',\'accepted\',\'' + (p.id||'') + '\')">✅ Accept</button><button class="btn btn-red btn-sm" style="flex:1" onclick="actInt(\'' + i.id + '\',\'declined\',\'\')">✗ Decline</button></div>' : '') +
      '</div>';
  });
}
function showInt(t) { ldInt(t); }

async function actInt(id, st, fromUserId) {
  await sb.from('interests').update({ status: st }).eq('id', id);
  if (st === 'accepted' && fromUserId && P) {
    try {
      var senderRes = await sb.from('profiles').select('full_name,email,phone').eq('id', fromUserId).limit(1);
      var sender = senderRes.data && senderRes.data[0];
      if (sender) {
        fetch(SB_URL + '/functions/v1/smart-function', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
          body: JSON.stringify({
            type: 'interest_accepted',
            sender_email: sender.email || '',
            sender_name: sender.full_name || '',
            sender_phone: sender.phone || '',
            acceptor_name: P.full_name || '',
            acceptor_faith: P.denomination || P.religion || ''
          })
        });
      }
    } catch(x) {}
  }
  ldInt('received');
}

// ═══ CHAT LIST
async function ldChats() {
  if (isPreLaunch()) return;
  if (!canChat()) {
    var tChat = document.getElementById('tChat'); if (!tChat) return;
    tChat.innerHTML =
      '<div style="text-align:center;padding:40px 20px;">' +
      '<div style="font-size:48px;margin-bottom:16px;">💬</div>' +
      '<h3 style="font-family:Cinzel,serif;color:#C13DBF;font-size:18px;margin-bottom:8px;">Chat requires a subscription</h3>' +
      '<p style="font-size:13px;color:rgba(255,255,255,.55);line-height:1.7;margin-bottom:20px;">Subscribe to Basic or Premium to chat with your matches.<br/>Sending interests is always free.</p>' +
      '<button class="btn btn-gold" style="width:auto;padding:12px 28px;" onclick="showSub()">View Plans ✦</button>' +
      '</div>';
    return;
  }
  var r = await sb.from('interests').select('*').or('from_user.eq.' + U.id + ',to_user.eq.' + U.id).eq('status', 'accepted');
  var d = r.data || [];
  var pids = [];
  d.forEach(function(i) { var pid = i.from_user === U.id ? i.to_user : i.from_user; if (pids.indexOf(pid) === -1) pids.push(pid); });
  var cl = document.getElementById('chatList');
  if (!pids.length) {
    if (cl) cl.innerHTML =
      '<div style="text-align:center;padding:40px 20px;">' +
      '<div style="font-size:40px;margin-bottom:12px;">💬</div>' +
      '<p style="font-size:14px;font-weight:700;color:var(--w70);margin-bottom:8px;">No conversations yet</p>' +
      '<p style="font-size:12px;color:var(--w40);line-height:1.6;">Accept interests to start chatting.</p>' +
      '<button class="btn btn-gold" style="margin-top:16px;width:auto;padding:10px 24px;" onclick="goTab(\'interests\')">View Interests 💝</button></div>';
    return;
  }
  var pr = await sb.from('profiles').select('*').in('id', pids);
  var profiles = pr.data || [];
  if (cl) cl.innerHTML = '';
  var lastMsgs = {};
  try {
    var msgQ = await sb.from('messages').select('sender_id,receiver_id,content,created_at,is_read')
      .or(pids.map(function(pid) {
        return 'and(sender_id.eq.' + U.id + ',receiver_id.eq.' + pid + '),and(sender_id.eq.' + pid + ',receiver_id.eq.' + U.id + ')';
      }).join(','))
      .order('created_at', { ascending: false });
    (msgQ.data || []).forEach(function(m) {
      var otherId = m.sender_id === U.id ? m.receiver_id : m.sender_id;
      if (!lastMsgs[otherId]) lastMsgs[otherId] = m;
    });
  } catch(x) {}
  profiles.forEach(function(p) {
    var f = faithByKey(p.religion || 'Other');
    var last = lastMsgs[p.id];
    var preview = last ? last.content.substring(0, 40) + (last.content.length > 40 ? '…' : '') : 'Tap to say hello 👋';
    var timeStr = last ? _formatMsgTime(last.created_at) : '';
    var unread = last && last.sender_id !== U.id && !last.is_read;
    if (cl) cl.innerHTML +=
      '<div class="card" onclick="openChat(\'' + p.id + '\')" style="cursor:pointer;">' +
        '<div style="display:flex;gap:10px;align-items:center;">' +
          '<div style="position:relative;">' +
            '<div class="avatar" style="' + (p.photo_url ? 'background-image:url(' + p.photo_url + ');background-size:cover;background-position:center' : '') + ';border-color:' + f.color + ';">' + (!p.photo_url ? '<span style="font-size:18px;opacity:.3">👤</span>' : '') + '</div>' +
            (unread ? '<div style="position:absolute;top:0;right:0;width:10px;height:10px;border-radius:50%;background:var(--gold);border:2px solid var(--dark1);"></div>' : '') +
          '</div>' +
          '<div style="flex:1;min-width:0;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
              '<h3 style="font-size:14px;margin:0;font-weight:' + (unread ? '800' : '600') + ';">' + p.full_name + '</h3>' +
              '<span style="font-size:10px;color:var(--w40);flex-shrink:0;margin-left:6px;">' + timeStr + '</span>' +
            '</div>' +
            '<p style="font-size:12px;color:' + (unread ? 'var(--w80)' : 'var(--w40)') + ';margin:3px 0 0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:' + (unread ? '700' : '400') + ';">' + preview + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
  });
}

function _formatMsgTime(ts) {
  if (!ts) return '';
  var d = new Date(ts), now = new Date(), diff = now - d;
  if (diff < 60000) return 'now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ═══ CHAT WINDOW + REALTIME
var chatPid = null;
var _chatRealtimeChannel = null;

function _destroyChatRealtime() {
  if (_chatRealtimeChannel) {
    try { sb.removeChannel(_chatRealtimeChannel); } catch(x) {}
    _chatRealtimeChannel = null;
  }
}

async function openChat(pid) {
  if (!canChat()) { showChatSubModal(); return; }
  chatPid = pid;
  _destroyChatRealtime();
  var pr = await sb.from('profiles').select('*').eq('id', pid).limit(1);
  var p = pr.data[0];
  var cn = document.getElementById('cwNm'); if (cn) cn.textContent = p.full_name;
  var ci = document.getElementById('cwIn'); if (ci) ci.textContent = (p.denomination || p.religion || '') + ' · ' + p.city;
  var ca = document.getElementById('cwAv'); if (ca && p.photo_url) ca.style.backgroundImage = 'url(' + p.photo_url + ')';
  ['tHome','tBrowse','tInterests','tChat','tViews','tProfile','tPlans','tReviews','tAdmin'].forEach(function(x) {
    var el = document.getElementById(x); if (el) el.style.display = 'none';
  });
  var ma = document.getElementById('mainApp');
  if (ma) { ma.style.display = 'block'; ma.classList.add('active'); }
  var cw = document.getElementById('tChatWin'); if (cw) cw.style.display = 'flex';
  await ldMsgs();
  _subscribeChatRealtime(pid);
}

function _subscribeChatRealtime(pid) {
  _chatRealtimeChannel = sb.channel('chat-' + U.id + '-' + pid)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'receiver_id=eq.' + U.id }, function(payload) {
      if (payload.new && payload.new.sender_id === pid) {
        _appendMsg(payload.new);
        sb.from('messages').update({ is_read: true }).eq('id', payload.new.id).then(function() {});
        checkNotifs();
      }
    }).subscribe();
}

function _appendMsg(m) {
  var c = document.getElementById('cwMs'); if (!c) return;
  var isSent = m.sender_id === U.id;
  var tick = '';
  if (isSent && typeof isPremiumUser === 'function' && isPremiumUser()) {
    tick = '<span style="font-size:10px;margin-left:4px;color:' + (m.is_read ? '#C13DBF' : 'rgba(255,255,255,.35)') + ';">' + (m.is_read ? '✓✓' : '✓') + '</span>';
  }
  var div = document.createElement('div');
  div.className = 'msg-bubble ' + (isSent ? 'msg-sent' : 'msg-recv');
  div.dataset.msgId = m.id || '';
  div.innerHTML = m.content +
    '<div class="msg-time">' + new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + tick + '</div>';
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

async function ldMsgs() {
  if (!chatPid) return;
  var r = await sb.from('messages').select('*')
    .or('and(sender_id.eq.' + U.id + ',receiver_id.eq.' + chatPid + '),and(sender_id.eq.' + chatPid + ',receiver_id.eq.' + U.id + ')')
    .order('created_at', { ascending: true });
  var d = r.data || [];
  var c = document.getElementById('cwMs'); if (!c) return;
  c.innerHTML = '';
  if (d.length === 0) {
    c.innerHTML = '<div style="text-align:center;padding:40px 20px;color:var(--w40);"><div style="font-size:32px;margin-bottom:8px;">👋</div><p style="font-size:13px;">Say hello! You\'re now connected.</p></div>';
  } else {
    d.forEach(function(m) { _appendMsg(m); });
  }
  c.scrollTop = c.scrollHeight;
  await sb.from('messages').update({ is_read: true }).eq('receiver_id', U.id).eq('sender_id', chatPid);
}

async function sendMsg() {
  if (!canChat()) { showChatSubModal(); return; }
  var inp = document.getElementById('cwTx'); if (!inp) return;
  var txt = inp.value.trim(); if (!txt) return;
  inp.value = '';
  var optimistic = { id: 'tmp', sender_id: U.id, receiver_id: chatPid, content: txt, created_at: new Date().toISOString(), is_read: false };
  _appendMsg(optimistic);
  try {
    await sb.from('messages').insert({ sender_id: U.id, receiver_id: chatPid, content: txt });
  } catch(x) {
    var c = document.getElementById('cwMs');
    if (c && c.lastChild) c.removeChild(c.lastChild);
    alert('Could not send. Please try again.');
  }
}

// ═══ WHO VIEWED — GATED on Premium
async function ldViews() {
  var vl = document.getElementById('viewList');
  var ve = document.getElementById('viewEmpty');
  if (!isPreLaunch() && !isPremiumUser()) {
    if (vl) vl.innerHTML = '';
    if (ve) ve.style.display = 'none';
    var container = document.getElementById('tViews'); if (!container) return;
    if (!document.getElementById('viewsPaywall')) {
      var pw = document.createElement('div');
      pw.id = 'viewsPaywall';
      pw.style.cssText = 'text-align:center;padding:40px 20px;';
      pw.innerHTML =
        '<div style="font-size:48px;margin-bottom:14px;">👁️</div>' +
        '<h3 style="font-family:Cinzel,serif;color:#C13DBF;font-size:17px;margin-bottom:8px;">See who viewed your profile</h3>' +
        '<p style="font-size:13px;color:rgba(255,255,255,.5);line-height:1.7;margin-bottom:20px;">Know who\'s interested before they send a request.<br/>This is a <strong style="color:#C13DBF;">Premium</strong> feature.</p>' +
        '<button class="btn btn-gold" style="width:auto;padding:12px 28px;" onclick="showSub()">Upgrade to Premium ✦</button>';
      container.appendChild(pw);
    }
    return;
  }
  var existingPw = document.getElementById('viewsPaywall');
  if (existingPw) existingPw.remove();
  var r = await sb.from('profile_views').select('*,profiles!profile_views_viewer_id_fkey(*)').eq('viewed_id', U.id).order('viewed_at', { ascending: false });
  var d = r.data || [];
  if (ve) ve.style.display = d.length ? 'none' : '';
  if (!vl) return; vl.innerHTML = '';
  d.forEach(function(v) {
    var p = v.profiles; if (!p) return;
    var f = faithByKey(p.religion || 'Other');
    vl.innerHTML += '<div class="card" onclick="viewProfile(\'' + p.id + '\')">' +
      '<div style="display:flex;gap:10px;align-items:center">' +
      '<div class="avatar" style="' + (p.photo_url ? 'background-image:url(' + p.photo_url + ');background-size:cover;background-position:center' : '') + ';border-color:' + f.color + '">' + (!p.photo_url ? '<span style="font-size:18px;opacity:.3">👤</span>' : '') + '</div>' +
      '<div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">' + p.full_name + ', ' + p.age + '</h3>' +
      '<p style="font-size:11px;color:' + f.color + '">' + f.icon + ' ' + (p.denomination || p.religion || '') + '</p></div>' +
      '<p style="font-size:10px;color:var(--w50)">' + new Date(v.viewed_at).toLocaleDateString() + '</p></div></div>';
  });
}

// ═══ NOTIFICATIONS
async function checkNotifs() {
  if (!U) return;
  try {
    var r = await sb.from('interests').select('id', { count: 'exact', head: true }).eq('to_user', U.id).eq('status', 'pending');
    var dot = document.getElementById('intDot');
    var badge = document.getElementById('intBadge');
    if (dot) dot.style.display = (r.count > 0) ? '' : 'none';
    if (badge) {
      if (r.count > 0) { badge.style.display = ''; badge.textContent = r.count; }
      else badge.style.display = 'none';
    }
    var mr = await sb.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', U.id).eq('is_read', false);
    var mdot = document.getElementById('msgDot'); if (mdot) mdot.style.display = mr.count > 0 ? '' : 'none';
  } catch(x) {}
}

// ═══ MISC
function togglePw(inputId, btn) {
  var inp = document.getElementById(inputId);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? 'Show' : 'Hide';
}

function shareApp() {
  var code = P && P.referral_code ? P.referral_code : (P ? P.id.slice(0, 8) : 'friend');
  var link = 'https://beginforever.in?ref=' + code;
  var msg = "I just joined Begin Forever — India's first 100% ID-verified matrimony platform! Join: " + link;
  if (navigator.share) navigator.share({ title: 'Begin Forever', text: msg, url: link });
  else if (navigator.clipboard) navigator.clipboard.writeText(link).then(function() { alert('Referral link copied! 🔗'); });
}

function submitReview() {
  var txt = document.getElementById('revText');
  if (txt && !txt.value.trim()) { alert('Please write your review.'); return; }
  alert('Thank you! Your review will be published after moderation.');
  if (txt) txt.value = '';
}

function renderFaithCards(containerId, arr) {
  var c = document.getElementById(containerId); if (!c) return; c.innerHTML = '';
  FAITH_CARDS.forEach(function(f) {
    var on = arr.indexOf(f.key) > -1;
    var card = document.createElement('div');
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:12px;cursor:pointer;transition:all .15s;margin-bottom:7px;border:1.5px solid ' + (on ? f.color : 'rgba(255,255,255,.08)') + ';background:' + (on ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.02)') + ';';
    card.innerHTML = '<span style="font-size:22px;flex-shrink:0;">' + f.icon + '</span><div style="flex:1;min-width:0;"><p style="font-size:13px;font-weight:700;color:' + (on ? '#fff' : 'rgba(255,255,255,.5)') + ';margin:0;">' + f.key + '</p>' + (f.denoms ? '<p style="font-size:10px;color:rgba(255,255,255,.3);margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + f.denoms + '</p>' : '') + '</div><span style="flex-shrink:0;font-size:16px;color:' + f.color + ';width:20px;text-align:center;">' + (on ? '✓' : '') + '</span>';
    card.onclick = function() { var ix = arr.indexOf(f.key); if (ix > -1) arr.splice(ix, 1); else arr.push(f.key); renderFaithCards(containerId, arr); };
    c.appendChild(card);
  });
}
function renderFaithGrid(cid, arr) { renderFaithCards(cid, arr); }

function showSubscribeModal(feature) {
  var m = document.getElementById('subscribeModal'); if (!m) return;
  var sub = m.querySelector('.subscribe-subtitle');
  if (sub) sub.textContent = feature ? feature + ' requires a subscription.' : 'Choose a plan to connect.';
  m.classList.add('active');
}
function closeSubscribeModal() { var m = document.getElementById('subscribeModal'); if (m) m.classList.remove('active'); }

async function openFaithPrefsGated() {
  if (isPreLaunch()) { openFaithPrefs(); return; }
  if (isPremiumUser()) openFaithPrefs(); else showSubModal('Faith filter');
}

async function sendInt(to) {
  if (!isPreLaunch() && !isSubscribed()) { showChatSubModal(); return; }
  try {
    var gRes = await sb.from('profiles').select('gender,who_initiates').eq('id', to).limit(1);
    var tgt = gRes.data && gRes.data[0];
    if (tgt && tgt.gender === 'Female' && tgt.who_initiates === 'me_first') {
      alert("This member chooses who they connect with — she'll reach out if interested.");
      return;
    }
  } catch(x) {}
  try {
    await sb.from('interests').insert({ from_user: U.id, to_user: to, status: 'pending' });
    closeModal();
    try {
      var receiverRes = await sb.from('profiles').select('full_name,email,phone').eq('id', to).limit(1);
      var receiver = receiverRes.data && receiverRes.data[0];
      if (receiver && P) {
        fetch(SB_URL + '/functions/v1/smart-function', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
          body: JSON.stringify({
            type: 'interest_received',
            receiver_email: receiver.email || '',
            receiver_name: receiver.full_name || '',
            receiver_phone: receiver.phone || '',
            sender_name: P.full_name || '',
            sender_email: P.email || '',
            sender_faith: P.denomination || P.religion || ''
          })
        });
      }
    } catch(x) {}
    alert('Interest sent! 💝');
  } catch(x) { alert(x.message || 'Already sent'); }
}

function updatePricingCountdown() {
  if (!LAUNCH) return;
  var diff = LAUNCH - new Date(); if (diff <= 0) return;
  var pad = function(n) { return String(Math.max(0, Math.floor(n))).padStart(2, '0'); };
  var d = document.getElementById('pcDays'); if (d) d.textContent = pad(Math.floor(diff / 86400000));
  var h = document.getElementById('pcHrs');  if (h) h.textContent = pad(Math.floor((diff % 86400000) / 3600000));
  var m = document.getElementById('pcMins'); if (m) m.textContent = pad(Math.floor((diff % 3600000) / 60000));
}

var _menuOpen = false;
function toggleMenu() {
  _menuOpen = !_menuOpen;
  var d = document.getElementById('menuDrawer');
  var b1 = document.getElementById('mb1'), b2 = document.getElementById('mb2'), b3 = document.getElementById('mb3');
  if (d) d.style.maxHeight = _menuOpen ? '600px' : '0';
  if (b1) b1.style.transform = _menuOpen ? 'translateY(6.5px) rotate(45deg)' : '';
  if (b2) b2.style.opacity = _menuOpen ? '0' : '1';
  if (b3) b3.style.transform = _menuOpen ? 'translateY(-6.5px) rotate(-45deg)' : '';
}

var quickFaithFilter = 'All';
function renderBrowseChips() {
  var chips = document.getElementById('browseChips'); if (!chips) return;
  var browseFaiths = []; try { browseFaiths = JSON.parse((P && P.faith_browse) || '[]'); } catch(x) { browseFaiths = FAITHS.map(function(f) { return f.key; }); }
  var opts = ['All'].concat(browseFaiths); chips.innerHTML = '';
  opts.forEach(function(k) {
    var f = k === 'All' ? null : faithByKey(k), on = quickFaithFilter === k;
    var btn = document.createElement('button');
    btn.style.cssText = 'white-space:nowrap;padding:6px 14px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;transition:all .2s;border:1px solid ' + (on ? (f ? f.color : 'var(--gold)') : 'var(--w20)') + ';background:' + (on ? (f ? f.bg : 'rgba(232,184,48,.15)') : 'transparent') + ';color:' + (on ? (f ? f.color : 'var(--gold)') : 'var(--w50)');
    btn.textContent = k === 'All' ? '🌍 All' : (f ? f.icon + ' ' + k : k);
    btn.onclick = function() { quickFaithFilter = k; renderBrowseChips(); ldBrowse(); };
    chips.appendChild(btn);
  });
}
function renderFaithPrefSummary() { if (typeof renderFaithPrefCard === 'function') renderFaithPrefCard(); }
function payRzp(plan, amt) {
  var tier = plan.toLowerCase().indexOf('premium') > -1 ? 'premium' : 'basic';
  SUB_CYCLE = plan.indexOf('Quarterly') !== -1 ? 'quarterly' : plan.indexOf('Monthly') !== -1 ? 'monthly' : 'halfyearly';
  choosePlan(tier);
}
