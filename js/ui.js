// Begin Forever — UI v14c
// Fixes:
// - blink keyframe injected at runtime (was missing from CSS)
// - goTab('chatWin') back-nav: chat window hides itself and restores mainApp properly
// - loadStats() debounced — no duplicate Supabase calls on rapid tab switches
// - Chat gated on canChat() (subscription required)

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

  // Hide chat window if open — fix: ensure mainApp stays visible
  var cw = document.getElementById('tChatWin');
  if (cw) cw.style.display = 'none';
  var ma = document.getElementById('mainApp');
  if (ma) { ma.style.display = 'block'; ma.classList.add('active'); }
  // Hide onboarding screen if somehow visible
  var obs = document.getElementById('onboardingScreen'); if (obs) { obs.style.display = 'none'; obs.classList.remove('active'); }

  ['tHome','tBrowse','tInterests','tChat','tViews','tProfile','tPlans','tReviews','tAdmin'].forEach(function(x) {
    var el = document.getElementById(x); if (el) el.style.display = 'none';
  });
  if (t !== 'admin') { var adL = document.getElementById('adList'); if (adL) adL.innerHTML = ''; }
  if (t !== 'chatWin') _destroyChatRealtime();

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
    if (!P || !P.is_admin) { goTab('home'); return; } // non-admins blocked
    ldAdmin('pending');
  }
  // Hide admin tab button from non-admins
  var adTabEl = document.getElementById('adTab');
  if (adTabEl) adTabEl.style.display = (P && P.is_admin) ? '' : 'none';
}

REPLACE WITH (adds ONE line before the closing brace):

  if (t === 'profile')   { if (typeof _editMode !== 'undefined') _editMode = false; renP(); }
  if (t === 'admin') {
    if (!P || !P.is_admin) { goTab('home'); return; } // non-admins blocked
    ldAdmin('pending');
  }
  // Hide admin tab button from non-admins
  var adTabEl = document.getElementById('adTab');
  if (adTabEl) adTabEl.style.display = (P && P.is_admin) ? '' : 'none';
  // Handle profile completion toast visibility per tab
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

// Debounced loadStats — max once per 3 seconds
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

// ═══ BROWSE
async function ldBrowse() {
  if (!P) return;
  if (P.status === 'pending') {
    var l = document.getElementById('bList');
    if (l) l.innerHTML = '<div style="text-align:center;padding:40px 20px"><div style="font-size:40px">🔒</div><p style="color:#FFD54F;font-size:14px;font-weight:700;margin-top:12px">Profile Under Review</p></div>';
    return;
  }
  if (isPreLaunch()) { var l0 = document.getElementById('bList'); if (l0) l0.innerHTML = ''; return; }
  if (typeof loadBlockedIds === 'function') await loadBlockedIds();
  var g = P.gender === 'Male' ? 'Female' : 'Male';
  var q = sb.from('profiles').select('*').eq('status', 'approved').eq('gender', g).neq('id', U.id);
  var browseFaiths = []; try { browseFaiths = JSON.parse(P.faith_browse || '[]'); } catch(x) {}
  if (browseFaiths.length > 0 && browseFaiths.length < FAITHS.length) q = q.in('religion', browseFaiths);
  var r = await q.order('created_at', { ascending: false });
  var d = r.data || [];
  if (typeof BLOCKED_IDS !== 'undefined' && BLOCKED_IDS.length > 0) d = d.filter(function(p) { return BLOCKED_IDS.indexOf(p.id) === -1; });
  var be = document.getElementById('bEmpty'); if (be) be.style.display = d.length ? 'none' : '';
  var l = document.getElementById('bList'); if (!l) return; l.innerHTML = '';
  d.forEach(function(p) {
    var f = faithByKey(p.religion || 'Other');
    l.innerHTML += '<div class="card" onclick="viewProfile(\'' + p.id + '\')">' +
      '<div style="display:flex;gap:12px;align-items:center">' +
      '<div class="avatar" style="' + (p.photo_url ? 'background-image:url(' + p.photo_url + ');background-size:cover;background-position:center' : '') + ';border-color:' + f.color + '">' + (!p.photo_url ? '<span style="font-size:20px;opacity:.3">👤</span>' : '') + '</div>' +
      '<div style="flex:1"><h3 style="font-size:14px;margin:0;font-weight:600">' + p.full_name + ', ' + p.age + '</h3>' +
      '<p style="font-size:11px;margin:3px 0"><span style="color:' + f.color + '">' + f.icon + ' ' + (p.religion || '') + '</span>' + (p.denomination ? ' · <span style="color:var(--w50)">' + p.denomination + '</span>' : '') + '</p>' +
      '<p style="font-size:10px;color:var(--w50)">' + p.city + ', ' + p.state + '</p></div><span style="font-size:18px">→</span></div>' +
      (p.bio ? '<p style="font-size:12px;color:var(--w50);margin-top:8px;line-height:1.4;overflow:hidden;max-height:36px">' + p.bio + '</p>' : '') +
      '</div>';
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
      (type === 'received' ? '<div style="display:flex;gap:6px;margin-top:10px"><button class="btn btn-grn btn-sm" style="flex:1" onclick="actInt(\'' + i.id + '\',\'accepted\')">✅ Accept</button><button class="btn btn-red btn-sm" style="flex:1" onclick="actInt(\'' + i.id + '\',\'declined\')">✗ Decline</button></div>' : '') +
      '</div>';
  });
}
function showInt(t) { ldInt(t); }
async function actInt(id, st) { await sb.from('interests').update({ status: st }).eq('id', id); ldInt('received'); }

// ═══ CHAT LIST — gated on subscription
async function ldChats() {
  if (isPreLaunch()) return;

  if (!canChat()) {
    var tChat = document.getElementById('tChat'); if (!tChat) return;
    tChat.innerHTML =
      '<div style="text-align:center;padding:40px 20px;">' +
      '<div style="font-size:48px;margin-bottom:16px;">💬</div>' +
      '<h3 style="font-family:Cinzel,serif;color:#F5C842;font-size:18px;margin-bottom:8px;">Chat requires a subscription</h3>' +
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

  // Hide all tabs but keep mainApp visible — fix back-nav
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
  var div = document.createElement('div');
  div.className = 'msg-bubble ' + (m.sender_id === U.id ? 'msg-sent' : 'msg-recv');
  div.innerHTML = m.content + '<div class="msg-time">' + new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div>';
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
  var optimistic = { id: 'tmp', sender_id: U.id, receiver_id: chatPid, content: txt, created_at: new Date().toISOString() };
  _appendMsg(optimistic);
  try {
    await sb.from('messages').insert({ sender_id: U.id, receiver_id: chatPid, content: txt });
  } catch(x) {
    var c = document.getElementById('cwMs');
    if (c && c.lastChild) c.removeChild(c.lastChild);
    alert('Could not send. Please try again.');
  }
}

// ═══ WHO VIEWED
async function ldViews() {
  var r = await sb.from('profile_views').select('*,profiles!profile_views_viewer_id_fkey(*)').eq('viewed_id', U.id).order('viewed_at', { ascending: false });
  var d = r.data || [];
  var ve = document.getElementById('viewEmpty'); if (ve) ve.style.display = d.length ? 'none' : '';
  var l = document.getElementById('viewList'); if (!l) return; l.innerHTML = '';
  d.forEach(function(v) {
    var p = v.profiles; if (!p) return;
    var f = faithByKey(p.religion || 'Other');
    l.innerHTML += '<div class="card" onclick="viewProfile(\'' + p.id + '\')">' +
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
    var dot = document.getElementById('intDot'); if (dot && r.count > 0) dot.style.display = '';
    var badge = document.getElementById('intBadge'); if (badge && r.count > 0) { badge.style.display = ''; badge.textContent = r.count; }
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

function payRzp(plan, amt) {
  var tier = plan.toLowerCase().indexOf('premium') > -1 ? 'premium' : 'basic';
  SUB_CYCLE = plan.indexOf('Quarterly') !== -1 ? 'quarterly' : plan.indexOf('Monthly') !== -1 ? 'monthly' : 'halfyearly';
  choosePlan(tier);
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

async function sendInt(to) {
  try {
    await sb.from('interests').insert({ from_user: U.id, to_user: to, status: 'pending' });
    closeModal(); alert('Interest sent! 💝');
  } catch(x) { alert(x.message || 'Already sent'); }
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
