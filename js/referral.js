// ═══════════════════════════════════════════ REFERRAL

// ── Capture ref code from URL on page load
(function captureRef(){
  var params = new URLSearchParams(window.location.search);
  var ref = params.get('ref');
  if (ref) {
    try { localStorage.setItem('bf_pending_ref', ref); } catch(e) {}
    window.history.replaceState({}, '', window.location.pathname);
  }
})();

// ── Save referral when new user registers
async function saveReferral(newUserId, newUserEmail) {
  try {
    var refCode = localStorage.getItem('bf_pending_ref');
    if (!refCode) return;

    var referrerId = null;

    // Primary: look up by referral_code column
    var res = await sb.from('profiles').select('id').eq('referral_code', refCode).limit(1);
    if (res.data && res.data.length) {
      referrerId = res.data[0].id;
    } else {
      // Fallback: first 8 chars of UUID (backwards compat)
      var res2 = await sb.from('profiles').select('id').ilike('id', refCode + '%').limit(1);
      if (res2.data && res2.data.length) referrerId = res2.data[0].id;
    }

    if (!referrerId || referrerId === newUserId) return;

    await sb.from('referrals').upsert({
      referrer_id: referrerId,
      referred_id: newUserId,
      referred_email: newUserEmail,
      status: 'registered'
    }, { onConflict: 'referred_id' });

    try { localStorage.setItem('bf_referrer_id', referrerId); } catch(e) {}
    try { localStorage.removeItem('bf_pending_ref'); } catch(e) {}

  } catch(x) {
    console.warn('saveReferral error:', x);
  }
}

function getReferrerId() {
  try { return localStorage.getItem('bf_referrer_id') || null; } catch(e) { return null; }
}

function clearReferrerId() {
  try { localStorage.removeItem('bf_referrer_id'); } catch(e) {}
}

// ── Mark referral approved and grant rewards
async function markReferralApproved(approvedUserId) {
  try {
    var res = await sb.from('referrals')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('referred_id', approvedUserId)
      .select('referrer_id')
      .single();
    if (!res.data) return;
    var cnt = await sb.from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', res.data.referrer_id)
      .eq('status', 'approved');
    await grantReferralReward(res.data.referrer_id, cnt.count || 0);
  } catch(x) {}
}

// ── 2 tiers only: 3 friends = 7 days, 5 friends = 10 days
// Uses >= so rewards fire even if counts are non-sequential
async function grantReferralReward(referrerId, approvedCount) {
  var TIERS = [
    { count: 3, days: 7  },
    { count: 5, days: 10 }
  ];
  for (var i = 0; i < TIERS.length; i++) {
    var tier = TIERS[i];
    if (approvedCount >= tier.count) {
      var existing = await sb.from('referral_rewards')
        .select('id')
        .eq('user_id', referrerId)
        .eq('referrals_count', tier.count);
      if (existing.data && existing.data.length > 0) continue;
      await sb.from('referral_rewards').insert({
        user_id: referrerId,
        referrals_count: tier.count,
        days_granted: tier.days
      });
      var prof = await sb.from('profiles')
        .select('referral_premium_days')
        .eq('id', referrerId)
        .single();
      var cur = (prof.data && prof.data.referral_premium_days) || 0;
      await sb.from('profiles')
        .update({ referral_premium_days: cur + tier.days })
        .eq('id', referrerId);
    }
  }
}

// ── Render referral card
async function renderReferralCard() {
  var card = document.getElementById('referralCard'); if (!card) return;

  // Use referral_code from profile if available, else fallback to UUID prefix
  var code = U ? U.id.slice(0, 8) : 'friend';
  if (P && P.referral_code) code = P.referral_code;
  var link = 'https://beginforever.in?ref=' + code;

  var stats = { total: 0, approved: 0, earnedDays: 0 };
  try {
    var allRefs = await sb.from('referrals').select('status').eq('referrer_id', U.id);
    var rewards = await sb.from('referral_rewards').select('days_granted').eq('user_id', U.id);
    stats.total    = (allRefs.data || []).length;
    stats.approved = (allRefs.data || []).filter(function(r){ return r.status === 'approved'; }).length;
    stats.earnedDays = (rewards.data || []).reduce(function(s, r){ return s + r.days_granted; }, 0);
  } catch(x) {}

  // Next tier message — only 2 tiers now
  var nextMsg = stats.approved < 3
    ? 'Get <strong>7 days free</strong> when 3 friends join'
    : stats.approved < 5
      ? 'Get <strong>10 days free</strong> when 5 friends join'
      : '🎉 Max referral rewards unlocked!';

  card.innerHTML =
    '<p style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:rgba(212,160,23,.8);margin-bottom:4px;">✦ Refer &amp; Earn</p>' +
    '<p style="font-family:\'Cinzel\',serif;font-size:14px;color:#fff;font-weight:700;margin-bottom:10px;">Invite friends · unlock <span style="color:var(--gold2);">free premium</span></p>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px;">' +
    '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(212,160,23,.15);border-radius:10px;padding:10px;text-align:center;">' +
    '<div style="font-family:\'Cinzel\',serif;font-size:22px;font-weight:900;color:var(--gold2);line-height:1;">3</div>' +
    '<div style="font-size:9px;color:var(--w40);margin:3px 0;">friends join</div>' +
    '<div style="font-size:10px;font-weight:700;color:#4ade80;">+7 days free</div></div>' +
    '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(212,160,23,.15);border-radius:10px;padding:10px;text-align:center;">' +
    '<div style="font-family:\'Cinzel\',serif;font-size:22px;font-weight:900;color:var(--gold2);line-height:1;">5</div>' +
    '<div style="font-size:9px;color:var(--w40);margin:3px 0;">friends join</div>' +
    '<div style="font-size:10px;font-weight:700;color:#4ade80;">+10 days free</div></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">' +
    '<div style="background:rgba(0,0,0,.2);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--gold2);">' + stats.total + '</div><div style="font-size:9px;color:var(--w40);">invited</div></div>' +
    '<div style="background:rgba(0,0,0,.2);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:700;color:#4ade80;">' + stats.approved + '</div><div style="font-size:9px;color:var(--w40);">joined</div></div>' +
    '<div style="background:rgba(0,0,0,.2);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:700;color:var(--gold2);">' + stats.earnedDays + 'd</div><div style="font-size:9px;color:var(--w40);">earned</div></div>' +
    '</div>' +
    '<div style="background:rgba(212,160,23,.08);border-radius:8px;padding:7px 10px;font-size:11px;color:rgba(255,255,255,.7);text-align:center;margin-bottom:10px;">' + nextMsg + '</div>' +
    '<p style="font-size:10px;color:rgba(255,255,255,.3);text-align:center;margin-bottom:8px;">🎁 Your friend also gets 1 week free when they join</p>' +
    '<button style="display:block;width:100%;padding:10px;background:linear-gradient(135deg,#D4A017,#F5C842);color:#3B0764;font-weight:800;font-size:12px;border:none;border-radius:50px;cursor:pointer;font-family:\'Nunito\',sans-serif;" onclick="shareApp()">🔗 Copy &amp; Share My Link</button>';
}
