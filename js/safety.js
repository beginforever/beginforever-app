// ═══════════════════════════════════════════════════════════════════
// Begin Forever — js/safety.js
// Block, Report, Deactivate, Delete account flows
// Load AFTER js/config.js, BEFORE js/ui.js
// ═══════════════════════════════════════════════════════════════════

var REPORT_REASONS = [
  'Fake profile / impersonation',
  'Inappropriate photos',
  'Harassment or abusive language',
  'Spam or scam',
  'Underage user',
  'Already married',
  'Asking for money',
  'Other'
];

var BLOCKED_IDS = [];

async function loadBlockedIds() {
  if (!U) return;
  BLOCKED_IDS = [];
  try {
    var bA = await sb.from('user_blocks').select('blocked_id').eq('blocker_id', U.id);
    var bB = await sb.from('user_blocks').select('blocker_id').eq('blocked_id', U.id);
    if (bA.data) BLOCKED_IDS = BLOCKED_IDS.concat(bA.data.map(function(x){return x.blocked_id;}));
    if (bB.data) BLOCKED_IDS = BLOCKED_IDS.concat(bB.data.map(function(x){return x.blocker_id;}));
  } catch(x) {}
}

// ─── BLOCK USER ────────────────────────────────────────────────────
function openBlockModal(userId, userName) {
  var safeName = (userName || 'this user').replace(/[<>]/g, '');
  var h = '' +
    '<div style="padding:8px 4px;">' +
      '<h3 style="font-family:Cinzel,serif;color:#ff6b6b;font-size:18px;margin-bottom:6px;">Block ' + safeName + '?</h3>' +
      '<p style="font-size:12px;color:var(--w60);margin-bottom:14px;line-height:1.5;">' +
        'They will not be able to view your profile, send you interest, or message you. You will not see them either. To unblock later, contact support.' +
      '</p>' +
      '<p style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px;">Reason (optional)</p>' +
      '<select id="blkReason" style="width:100%;padding:11px;background:var(--w05);border:1px solid var(--w10);border-radius:10px;color:#fff;font-size:13px;margin-bottom:16px;">' +
        '<option value="">— Select a reason —</option>' +
        REPORT_REASONS.map(function(r){ return '<option value="'+r+'">'+r+'</option>'; }).join('') +
      '</select>' +
      '<button class="btn" style="background:#ff6b6b;color:#fff;margin-bottom:10px;" onclick="confirmBlock(\''+userId+'\')">Block User</button>' +
      '<button class="btn btn-dark" onclick="closeSafetyModal()">Cancel</button>' +
    '</div>';
  showSafetyModal(h);
}

async function confirmBlock(userId) {
  var reasonEl = document.getElementById('blkReason');
  var reason = reasonEl ? reasonEl.value : '';
  try {
    var r = await sb.from('user_blocks').insert({
      blocker_id: U.id,
      blocked_id: userId,
      reason: reason || null
    });
    if (r.error) throw r.error;
    closeSafetyModal();
    if (typeof closeModal === 'function') closeModal();
    alert('User blocked. You will not see each other again.');
    await loadBlockedIds();
    if (typeof ldBrowse === 'function') ldBrowse();
  } catch(e) {
    alert(e.message || 'Could not block. Please try again.');
  }
}

// ─── REPORT USER ───────────────────────────────────────────────────
function openReportModal(userId, userName) {
  var safeName = (userName || 'this user').replace(/[<>]/g, '');
  var h = '' +
    '<div style="padding:8px 4px;">' +
      '<h3 style="font-family:Cinzel,serif;color:#fff;font-size:18px;margin-bottom:6px;">Report ' + safeName + '</h3>' +
      '<p style="font-size:12px;color:var(--w60);margin-bottom:14px;line-height:1.5;">' +
        'Our team reviews every report within 24 hours. Your identity is kept confidential.' +
      '</p>' +
      '<p style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px;">Reason *</p>' +
      '<select id="rptReason" style="width:100%;padding:11px;background:var(--w05);border:1px solid var(--w10);border-radius:10px;color:#fff;font-size:13px;margin-bottom:12px;">' +
        '<option value="">— Select a reason —</option>' +
        REPORT_REASONS.map(function(r){ return '<option value="'+r+'">'+r+'</option>'; }).join('') +
      '</select>' +
      '<p style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px;">Details (optional)</p>' +
      '<textarea id="rptDetails" placeholder="Anything else our team should know…" style="width:100%;padding:11px;background:var(--w05);border:1px solid var(--w10);border-radius:10px;color:#fff;font-size:13px;min-height:80px;margin-bottom:14px;resize:vertical;font-family:inherit;"></textarea>' +
      '<label style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--w70);margin-bottom:14px;cursor:pointer;">' +
        '<input type="checkbox" id="rptAlsoBlock" checked style="margin-top:3px;"/> Also block this user' +
      '</label>' +
      '<button class="btn btn-gold" style="margin-bottom:10px;" onclick="confirmReport(\''+userId+'\')">Submit Report</button>' +
      '<button class="btn btn-dark" onclick="closeSafetyModal()">Cancel</button>' +
    '</div>';
  showSafetyModal(h);
}

async function confirmReport(userId) {
  var reason = document.getElementById('rptReason').value;
  var details = document.getElementById('rptDetails').value;
  var alsoBlock = document.getElementById('rptAlsoBlock').checked;
  if (!reason) { alert('Please select a reason.'); return; }
  try {
    var r = await sb.from('user_reports').insert({
      reporter_id: U.id,
      reported_id: userId,
      reason: reason,
      details: details || null
    });
    if (r.error) throw r.error;
    if (alsoBlock) {
      try { await sb.from('user_blocks').insert({
        blocker_id: U.id, blocked_id: userId, reason: reason
      }); } catch(x) {}
    }
    closeSafetyModal();
    if (typeof closeModal === 'function') closeModal();
    alert('Report submitted. Our team will review within 24 hours.');
    if (alsoBlock) {
      await loadBlockedIds();
      if (typeof ldBrowse === 'function') ldBrowse();
    }
  } catch(e) {
    alert(e.message || 'Could not submit report. Please try again.');
  }
}

// ─── DEACTIVATE ACCOUNT ────────────────────────────────────────────
function openDeactivateModal() {
  var founderNote = (P && P.is_founding_member && new Date() < LAUNCH)
    ? '<p style="font-size:11px;color:#FFD54F;background:rgba(232,184,48,.08);border:1px solid rgba(232,184,48,.25);border-radius:8px;padding:9px;margin-bottom:12px;line-height:1.5;">⚠️ You are a founding member. If you miss the 7-day free Premium window (24–31 May), message us on WhatsApp +91 97000 25345 to claim it later.</p>'
    : '';
  var h = '' +
    '<div style="padding:8px 4px;">' +
      '<div style="font-size:36px;text-align:center;margin-bottom:10px;">⏸️</div>' +
      '<h3 style="font-family:Cinzel,serif;color:#fff;font-size:18px;margin-bottom:8px;text-align:center;">Deactivate Account?</h3>' +
      '<p style="font-size:13px;color:var(--w70);margin-bottom:14px;line-height:1.6;">' +
        'Your profile will be hidden from Discover and no one can send you new interests. ' +
        '<strong style="color:var(--gold2);">Sign in any time to reactivate</strong> — your data, matches, and conversations are kept safely.' +
      '</p>' +
      founderNote +
      '<button class="btn btn-gold" style="margin-bottom:10px;" onclick="confirmDeactivate()">Deactivate</button>' +
      '<button class="btn btn-dark" onclick="closeSafetyModal()">Cancel</button>' +
    '</div>';
  showSafetyModal(h);
}

async function confirmDeactivate() {
  try {
    var r = await sb.from('profiles').update({
      status: 'deactivated',
      deactivated_at: new Date().toISOString()
    }).eq('id', U.id);
    if (r.error) throw r.error;
    closeSafetyModal();
    alert('Account deactivated. Sign in any time to reactivate.');
    if (typeof doSignOut === 'function') await doSignOut();
  } catch(e) {
    alert(e.message || 'Could not deactivate. Please try again.');
  }
}

// ─── DELETE ACCOUNT (two-step) ─────────────────────────────────────
function openDeleteModal() {
  var h = '' +
    '<div style="padding:8px 4px;">' +
      '<div style="font-size:36px;text-align:center;margin-bottom:10px;">⚠️</div>' +
      '<h3 style="font-family:Cinzel,serif;color:#ff6b6b;font-size:18px;margin-bottom:8px;text-align:center;">Delete Account?</h3>' +
      '<p style="font-size:13px;color:var(--w70);margin-bottom:14px;line-height:1.6;">' +
        'This will <strong style="color:#ff6b6b;">permanently remove</strong> your profile, photos, matches and messages. ' +
        'Data is anonymised immediately and erased after 30 days. <strong>This cannot be undone.</strong>' +
      '</p>' +
      '<p style="font-size:11px;color:var(--w50);background:rgba(255,255,255,.03);border-radius:8px;padding:9px;margin-bottom:12px;line-height:1.5;">Need help instead? WhatsApp us on +91 97000 25345 or email info@beginforever.in</p>' +
      '<p style="font-size:11px;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin-bottom:6px;">Type DELETE to confirm</p>' +
      '<input id="delConfirm" placeholder="DELETE" autocomplete="off" style="width:100%;padding:11px;background:var(--w05);border:1px solid var(--w10);border-radius:10px;color:#fff;font-size:13px;margin-bottom:14px;letter-spacing:2px;text-align:center;"/>' +
      '<button class="btn" style="background:#ff6b6b;color:#fff;margin-bottom:10px;" onclick="confirmDelete()">Permanently Delete</button>' +
      '<button class="btn btn-dark" onclick="closeSafetyModal()">Cancel</button>' +
    '</div>';
  showSafetyModal(h);
}

async function confirmDelete() {
  var v = (document.getElementById('delConfirm').value || '').trim();
  if (v !== 'DELETE') { alert('Please type DELETE in capitals to confirm.'); return; }
  try {
    var r = await sb.from('profiles').update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      full_name: 'Deleted User',
      phone: null,
      photo_url: null, photo_2_url: null, photo_3_url: null,
      photo_4_url: null, photo_5_url: null,
      bio: null
    }).eq('id', U.id);
    if (r.error) throw r.error;
    closeSafetyModal();
    alert('Account deleted. Your data has been anonymised.');
    if (typeof doSignOut === 'function') await doSignOut();
  } catch(e) {
    alert(e.message || 'Could not delete. Please contact info@beginforever.in');
  }
}

// ─── MODAL HELPER ──────────────────────────────────────────────────
function showSafetyModal(html) {
  var existing = document.getElementById('safetyModal');
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = 'safetyModal';
  modal.className = 'modal-overlay show';
  modal.style.display = 'flex';
  modal.onclick = closeSafetyModal;
  modal.innerHTML =
    '<div class="modal-content" onclick="event.stopPropagation()" style="max-width:420px;">' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">' +
        '<button onclick="closeSafetyModal()" style="background:var(--w10);border:none;color:#fff;border-radius:50%;width:32px;height:32px;cursor:pointer;font-size:16px;">✕</button>' +
      '</div>' +
      html +
    '</div>';
  document.body.appendChild(modal);
}
function closeSafetyModal() {
  var m = document.getElementById('safetyModal');
  if (m) m.remove();
}
