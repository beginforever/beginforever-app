// Begin Forever — Admin v16
// Fix: adAct() and submitReject() now fetch full profile before calling smart-function
// Fix: tab highlight logic corrected
// Fix: pid → p.id bug in approved-tab revoke button

async function ldAdmin(filter) {
  ['pending','approved','rejected','founders'].forEach(function(f) {
    var el = document.getElementById('adTab' + f.charAt(0).toUpperCase() + f.slice(1));
    if (el) el.className = 'btn btn-sm ' + (f === filter ? 'btn-gold' : 'btn-dark');
  });

  var q = sb.from('profiles').select('*');
  if (filter === 'founders') q = q.eq('is_founding_member', true).order('founding_number', { ascending: true });
  else q = q.eq('status', filter).order('created_at', { ascending: false });

  var r = await q;
  var d = r.data || [];

  var countId = 'adCount' + filter.charAt(0).toUpperCase() + filter.slice(1);
  var countEl = document.getElementById(countId);
  if (countEl) countEl.textContent = d.length ? ' (' + d.length + ')' : '';

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

    var photoHtml = p.photo_url
      ? '<div style="width:56px;height:56px;border-radius:50%;background-image:url('+p.photo_url+');background-size:cover;background-position:center;border:2px solid var(--gold);flex-shrink:0;"></div>'
      : '<div style="width:56px;height:56px;border-radius:50%;background:var(--dark3);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><span style="font-size:20px;opacity:.4">👤</span></div>';

    var statusColor = { approved: '#27ae60', pending: '#F5C842', rejected: '#e74c3c', resubmitting: '#9B59B6' }[p.status] || 'var(--w50)';

    card.innerHTML =
      '<div style="display:flex;gap:12px;align-items:flex-start;">'+
        photoHtml+
        '<div style="flex:1;min-width:0;">'+
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;">'+
            '<h3 style="font-size:14px;font-weight:700;margin:0;color:#fff;">'+(p.full_name||'—')+'</h3>'+
            '<span style="font-size:10px;font-weight:700;color:'+statusColor+';flex-shrink:0;margin-left:6px;">'+p.status+'</span>'+
          '</div>'+
          '<p style="font-size:11px;color:var(--w50);margin:3px 0;">'+(p.age||'—')+' · '+(p.gender||'—')+' · '+(p.religion||'—')+(p.denomination?' / '+p.denomination:'')+'</p>'+
          '<p style="font-size:11px;color:var(--w50);margin:2px 0;">'+(p.city||'')+', '+(p.state||'')+'</p>'+
          '<p style="font-size:11px;color:var(--w50);margin:2px 0;">'+(p.email||'')+' · '+(p.phone||'')+'</p>'+
          (p.is_founding_member ? '<p style="font-size:10px;color:var(--gold);margin:2px 0;">✦ Founding Member #'+(p.founding_number||'—')+'</p>' : '')+
          (p.education ? '<p style="font-size:11px;color:var(--w50);margin:2px 0;">'+p.education+' · '+(p.occupation||'')+'</p>' : '')+
        '</div>'+
      '</div>'+
      (p.id_proof_url ? '<div style="margin-top:10px;"><a href="'+p.id_proof_url+'" target="_blank" style="font-size:11px;color:var(--gold);text-decoration:none;">🪪 View ID: '+(p.id_proof_type||'Document')+'</a></div>' : '<div style="margin-top:8px;font-size:11px;color:#e74c3c;">⚠️ No ID uploaded</div>')+
      (p.photo_url ? '<div style="display:flex;gap:6px;margin-top:10px;overflow-x:auto;">'+
        [p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(Boolean).map(function(u){
          return '<img src="'+u+'" style="width:60px;height:60px;border-radius:8px;object-fit:cover;flex-shrink:0;" onclick="window.open(\''+u+'\',\'_blank\')"/>';
        }).join('')+'</div>' : '')+
      '<div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">'+
        (p.status !== 'approved'  ? '<button class="btn btn-grn btn-sm" onclick="adAct(\''+p.id+'\',\'approved\')">✅ Approve</button>' : '')+
        (p.status !== 'pending'   ? '<button class="btn btn-dark btn-sm" onclick="adAct(\''+p.id+'\',\'pending\')">⏳ Pending</button>' : '')+
        (p.status !== 'rejected'  ? '<button class="btn btn-sm" style="background:var(--red);color:#fff;" onclick="openRejectModal(\''+p.id+'\',\''+(p.full_name||'').replace(/'/g,'')+'\')">❌ Reject</button>' : '')+
        '<button class="btn btn-dark btn-sm" onclick="adAct(\''+p.id+'\',\'deleted\')">🗑 Delete</button>'+
      '</div>';

    list.appendChild(card);
  });
}

// FIXED: fetch full profile before calling smart-function so notifications have all data
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

    // Fetch full profile for notification data
    if (status === 'approved') {
      try {
        var pr = await sb.from('profiles').select('*').eq('id', id).limit(1);
        var profile = pr.data && pr.data[0];
        if (profile) {
          fetch(SB_URL + '/functions/v1/smart-function', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

    // Refresh whichever tab is currently active
    var activeFilter = 'pending';
    ['pending','approved','rejected','founders'].forEach(function(f) {
      var el = document.getElementById('adTab' + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && el.classList.contains('btn-gold')) activeFilter = f;
    });
    ldAdmin(activeFilter);
  } catch(ex) {
    alert('Error: ' + (ex.message || 'Could not update profile'));
  }
}

// ── Reject modal
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

// FIXED: fetch full profile before calling smart-function
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
      status: 'rejected',
      rejection_reason: reason,
      approved_at: null
    }).eq('id', _rejectTargetId);
    if (r.error) throw r.error;

    // Fetch full profile for notification
    try {
      var pr = await sb.from('profiles').select('*').eq('id', _rejectTargetId).limit(1);
      var profile = pr.data && pr.data[0];
      if (profile) {
        fetch(SB_URL + '/functions/v1/smart-function', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

// openDeactivateModal() and openDeleteModal() handled by safety.js
