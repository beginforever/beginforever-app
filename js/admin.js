// Begin Forever — Admin v25
// Changes from v24:
// - Gender split counts on all tabs (M: X · F: X)
// - Remove ⚠️ No ID warning for female profiles
// - Show Phone Verified badge for females without ID
// - Show ID Verified badge for females with ID
// - Male without ID still flagged ⚠️

async function ldAdmin(filter) {
  ['all','pending','approved','rejected','founders','male','female'].forEach(function(f) {
    var el = document.getElementById('adTab' + f.charAt(0).toUpperCase() + f.slice(1));
    if (el) el.className = 'btn btn-sm ' + (f === filter ? 'btn-gold' : 'btn-dark');
  });

  var d = [];

  if (filter === 'all') {
    try {
      var res = await sb.rpc('admin_get_all_users');
      d = res.data || [];
    } catch(e) { d = []; }
  } else if (filter === 'male') {
    var q = sb.from('profiles').select('*').eq('gender', 'Male').order('created_at', { ascending: false });
    var r = await q; d = r.data || [];
  } else if (filter === 'female') {
    var q2 = sb.from('profiles').select('*').eq('gender', 'Female').order('created_at', { ascending: false });
    var r2 = await q2; d = r2.data || [];
  } else {
    var q3 = sb.from('profiles').select('*');
    if (filter === 'founders') q3 = q3.eq('is_founding_member', true).eq('status', 'approved').order('founding_number', { ascending: true });
    else q3 = q3.eq('status', filter).order('created_at', { ascending: false });
    var r3 = await q3;
    d = r3.data || [];
  }

  // Gender split counts
  var maleCount = d.filter(function(p){ return p.gender === 'Male'; }).length;
  var femaleCount = d.filter(function(p){ return p.gender === 'Female'; }).length;

  var countEl = document.getElementById('adCount' + filter.charAt(0).toUpperCase() + filter.slice(1));
  if (countEl) {
    if (filter === 'male' || filter === 'female') {
      countEl.textContent = d.length ? ' (' + d.length + ')' : '';
    } else {
      countEl.textContent = d.length ? ' (' + d.length + ' · M:' + maleCount + ' F:' + femaleCount + ')' : '';
    }
  }

  var empty = document.getElementById('adEmpty');
  var list  = document.getElementById('adList');
  if (!list) return;

  if (!d.length) { if (empty) empty.style.display = ''; list.innerHTML = ''; return; }
  if (empty) empty.style.display = 'none';
  list.innerHTML = '';

  d.forEach(function(p) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '12px';

    var hasProfile = !!p.full_name;
    var isFemale = p.gender === 'Female';
    var statusColor = { approved: '#27ae60', pending: '#C13DBF', rejected: '#e74c3c', resubmitting: '#9B59B6' }[p.status] || '#888';
    var statusLabel = p.status || (hasProfile ? 'incomplete' : 'no-profile');

    var photoHtml = p.photo_url
      ? '<div style="width:56px;height:56px;border-radius:50%;background-image:url('+p.photo_url+');background-size:cover;background-position:center;border:2px solid var(--gold);flex-shrink:0;"></div>'
      : '<div style="width:56px;height:56px;border-radius:50%;background:var(--dark3);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:20px;opacity:.4">👤</span></div>';

    // ID / verification badge logic
    var idHtml = '';
    if (p.id_proof_url) {
      // Has ID — show for both genders
      idHtml = '<div style="margin-top:10px;display:flex;align-items:center;gap:8px;">'
        + '<span style="font-size:11px;color:#4ade80;font-weight:700;">✅ ID Verified</span>'
        + '<a href="#" onclick="viewIdProof(\''+p.id_proof_url+'\');return false;" style="font-size:11px;color:var(--gold);text-decoration:none;">View '+(p.id_proof_type||'Document')+'</a>'
        + '</div>';
    } else if (isFemale) {
      // Female without ID — show Phone Verified, no warning
      idHtml = '<div style="margin-top:8px;">'
        + '<span style="font-size:11px;color:#60a5fa;font-weight:700;">📱 Phone Verified</span>'
        + (p.phone_verified ? '' : '<span style="font-size:10px;color:var(--w40);margin-left:6px;">· Phone not verified</span>')
        + '</div>';
    } else if (hasProfile) {
      // Male without ID — show warning
      idHtml = '<div style="margin-top:8px;font-size:11px;color:#e74c3c;">⚠️ No ID uploaded — required for males</div>';
    }

    var actionBtns = '';
    if (p.status) {
      actionBtns +=
        (p.status !== 'approved' ? '<button class="btn btn-grn btn-sm" onclick="adAct(\''+p.id+'\',\'approved\')">✅ Approve</button>' : '') +
        (p.status !== 'pending'  ? '<button class="btn btn-dark btn-sm" onclick="adAct(\''+p.id+'\',\'pending\')">⏳ Pending</button>' : '') +
        (p.status !== 'rejected' ? '<button class="btn btn-sm" style="background:var(--red);color:#fff;" onclick="openRejectModal(\''+p.id+'\',\''+(p.full_name||'').replace(/'/g,'')+'\')">❌ Reject</button>' : '') +
        '<button class="btn btn-dark btn-sm" onclick="adAct(\''+p.id+'\',\'deleted\')">🗑 Delete</button>';
    } else {
      actionBtns = '<button class="btn btn-dark btn-sm" style="background:#7B1FA2;color:#fff;" onclick="sendReminder(\''+p.id+'\',\''+(p.email||'')+'\',\''+(p.full_name||'')+'\',this)">📲 Send Reminder</button>';
    }

    // Gender badge
    var genderBadge = p.gender
      ? '<span style="font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700;margin-left:5px;background:' + (isFemale ? 'rgba(244,114,182,.15)' : 'rgba(96,165,250,.15)') + ';color:' + (isFemale ? '#f472b6' : '#60a5fa') + ';">' + (isFemale ? '♀ Female' : '♂ Male') + '</span>'
      : '';

    card.innerHTML =
      '<div style="display:flex;gap:12px;align-items:flex-start;">' +
        photoHtml +
        '<div style="flex:1;min-width:0;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
            '<h3 style="font-size:14px;font-weight:700;margin:0;color:#fff;">' + (p.full_name || p.email || '—') + genderBadge + '</h3>' +
            '<span style="font-size:10px;font-weight:700;color:' + statusColor + ';flex-shrink:0;margin-left:6px;">' + statusLabel + '</span>' +
          '</div>' +
          (hasProfile ? '<p style="font-size:11px;color:var(--w50);margin:3px 0;">'+(p.age||'—')+' · '+(p.religion||'—')+(p.denomination?' / '+p.denomination:'')+'</p>' : '') +
          (hasProfile ? '<p style="font-size:11px;color:var(--w50);margin:2px 0;">'+(p.city||'')+', '+(p.state||'')+'</p>' : '') +
          '<p style="font-size:11px;color:var(--w50);margin:2px 0;">'+(p.email||'')+(p.phone?' · '+p.phone:'')+'</p>' +
          (p.registered_at ? '<p style="font-size:10px;color:var(--w50);margin:2px 0;">Registered: '+new Date(p.registered_at).toLocaleDateString('en-IN')+'</p>' : '') +
          (p.is_founding_member ? '<p style="font-size:10px;color:var(--gold);margin:2px 0;">✦ Founding Member #'+(p.founding_number||'—')+'</p>' : '') +
          (p.education ? '<p style="font-size:11px;color:var(--w50);margin:2px 0;">'+p.education+' · '+(p.occupation||'')+'</p>' : '') +
        '</div>' +
      '</div>' +
      idHtml +
      (p.photo_url ? '<div style="display:flex;gap:6px;margin-top:10px;overflow-x:auto;">' +
        [p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(Boolean).map(function(u) {
          return '<img src="'+u+'" style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;" onclick="window.open(\''+u+'\',\'_blank\')"/>';
        }).join('') + '</div>' : '') +
      '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">' + actionBtns + '</div>';

    list.appendChild(card);
  });
}

async function viewIdProof(storagePath) {
  try {
    var path = storagePath;
    var marker = '/object/public/id-proofs/';
    if (path.indexOf(marker) !== -1) path = path.split(marker)[1];
    var r = await sb.storage.from('id-proofs').createSignedUrl(path, 60);
    if (r.error) throw r.error;
    window.open(r.data.signedUrl, '_blank');
  } catch(e) {
    alert('Could not load ID: ' + (e.message || 'Please try again'));
  }
}

async function sendReminder(userId, email, name, btn) {
  if (!email) { alert('No email for this user'); return; }
  btn.disabled = true; btn.textContent = 'Sending…';
  try {
    await fetch(SB_URL + '/functions/v1/smart-function', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
      body: JSON.stringify({ type: 'reminder', email: email, full_name: name || email })
    });
    await sb.from('reminder_log').upsert({ user_id: userId, email: email, reminder_type: 'incomplete_profile' }, { onConflict: 'user_id,reminder_type' });
    btn.textContent = '✅ Sent';
  } catch(e) {
    btn.disabled = false; btn.textContent = '📲 Send Reminder';
    alert('Failed: ' + (e.message || 'Please try again'));
  }
}

async function adAct(id, status) {
  if (status === 'deleted' && !confirm('Permanently delete this profile?')) return;

  var updates = { status: status };
  if (status === 'approved') {
    updates.approved_at = new Date().toISOString();
    updates.rejection_reason = null;
  } else {
    updates.approved_at = null;
  }
  if (status === 'pending') updates.rejection_reason = null;

  try {
    var r = await sb.from('profiles').update(updates).eq('id', id);
    if (r.error) throw r.error;

    if (status === 'approved') {
      try {
        var pr = await sb.from('profiles').select('*').eq('id', id).limit(1);
        var profile = pr.data && pr.data[0];
        if (profile) {
          fetch(SB_URL + '/functions/v1/smart-function', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
            body: JSON.stringify({
              type: 'approved',
              full_name: profile.full_name || '',
              email: profile.email || '',
              phone: profile.phone || '',
              religion: profile.religion || '',
              denomination: profile.denomination || '',
              city: profile.city || '',
              state: profile.state || ''
            })
          });
        }
      } catch(x) {}
    }

    var activeFilter = 'pending';
    ['all','pending','approved','rejected','founders','male','female'].forEach(function(f) {
      var el = document.getElementById('adTab' + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && el.classList.contains('btn-gold')) activeFilter = f;
    });
    ldAdmin(activeFilter);
  } catch(ex) {
    alert('Error: ' + (ex.message || 'Could not update profile'));
  }
}

var _rejectTargetId = null;

function openRejectModal(id, name) {
  _rejectTargetId = id;
  var nm = document.getElementById('rejectModalName'); if (nm) nm.textContent = name;
  var ra = document.getElementById('rejectReason'); if (ra) ra.value = '';
  var re = document.getElementById('rejectReasonErr'); if (re) re.style.display = 'none';
  var m = document.getElementById('rejectModal'); if (m) m.classList.add('show');
}

function closeRejectModal() {
  _rejectTargetId = null;
  var m = document.getElementById('rejectModal'); if (m) m.classList.remove('show');
}

function setRejectReason(text) {
  var ra = document.getElementById('rejectReason'); if (ra) ra.value = text;
}

async function submitReject() {
  var reason = (document.getElementById('rejectReason') || {}).value || '';
  if (!reason.trim()) {
    var re = document.getElementById('rejectReasonErr');
    if (re) { re.textContent = 'Please enter a rejection reason.'; re.style.display = ''; }
    return;
  }
  if (!_rejectTargetId) return;

  var btn = document.getElementById('rejectSubmitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Rejecting…'; }

  try {
    var r = await sb.from('profiles').update({
      status: 'rejected', rejection_reason: reason, approved_at: null
    }).eq('id', _rejectTargetId);
    if (r.error) throw r.error;

    try {
      var pr = await sb.from('profiles').select('*').eq('id', _rejectTargetId).limit(1);
      var profile = pr.data && pr.data[0];
      if (profile) {
        fetch(SB_URL + '/functions/v1/smart-function', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
          body: JSON.stringify({
            type: 'rejected',
            full_name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
            rejection_reason: reason
          })
        });
      }
    } catch(x) {}

    closeRejectModal();
    ldAdmin('pending');
  } catch(ex) {
    alert('Error: ' + (ex.message || 'Could not reject'));
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Confirm Rejection & Send Email'; }
}
