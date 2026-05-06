// ═══════════════════════════════════════════════════════════════════
// REFERRAL SYSTEM — add to js/referral.js in beginforever-app repo
// ═══════════════════════════════════════════════════════════════════
// This file handles:
// 1. Reading ?ref= param on app load and storing it
// 2. Saving referral to DB when user registers
// 3. Updating referral status when profile approved
// 4. Granting premium days at thresholds (3 = +7 days, 5 = +10 days)
// 5. Showing referral stats on home screen

// ── STEP 1: Read ?ref= from URL and store it ─────────────────────
(function captureRef() {
  var params = new URLSearchParams(window.location.search);
  var ref = params.get('ref');
  if (ref) {
    try { sessionStorage.setItem('bf_pending_ref', ref); } catch(e) {}
    // Clean URL without reloading
    var clean = window.location.pathname;
    window.history.replaceState({}, '', clean);
  }
})();

// ── STEP 2: Save referral when user registers ─────────────────────
// Call this from auth.js after successful registration
async function saveReferral(newUserId, newUserEmail) {
  try {
    var refCode = sessionStorage.getItem('bf_pending_ref');
    if (!refCode) return;

    // Find the referrer profile by their user ID prefix (first 8 chars)
    var { data: referrers } = await sb
      .from('profiles')
      .select('id')
      .ilike('id', refCode + '%')
      .limit(1);

    if (!referrers || referrers.length === 0) return;
    var referrerId = referrers[0].id;

    // Don't let someone refer themselves
    if (referrerId === newUserId) return;

    // Insert referral record
    await sb.from('referrals').upsert({
      referrer_id: referrerId,
      referred_id: newUserId,
      referred_email: newUserEmail,
      status: 'registered'
    }, { onConflict: 'referred_id' });

    // Save referred_by on the new user's profile when it's created later
    try { sessionStorage.setItem('bf_referrer_id', referrerId); } catch(e) {}

    // Clear the pending ref
    try { sessionStorage.removeItem('bf_pending_ref'); } catch(e) {}
  } catch(x) {
    console.warn('saveReferral error:', x);
  }
}

// ── STEP 3: Attach referrer_id when profile is created ───────────
// Call this from profile.js inside goNext() before the upsert
function getReferrerId() {
  try { return sessionStorage.getItem('bf_referrer_id') || null; } catch(e) { return null; }
}
function clearReferrerId() {
  try { sessionStorage.removeItem('bf_referrer_id'); } catch(e) {}
}

// ── STEP 4: Update referral status to 'approved' ─────────────────
// Call this from admin.js when admin approves a profile
async function markReferralApproved(approvedUserId) {
  try {
    // Update referral status
    var { data: ref } = await sb
      .from('referrals')
      .update({ status: 'approved', approved_at: new Date().toISOString() })
      .eq('referred_id', approvedUserId)
      .select('referrer_id')
      .single();

    if (!ref) return;

    // Count how many approved referrals the referrer now has
    var { count } = await sb
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', ref.referrer_id)
      .eq('status', 'approved');

    // Grant rewards at thresholds
    await grantReferralReward(ref.referrer_id, count);
  } catch(x) {
    console.warn('markReferralApproved error:', x);
  }
}

// ── STEP 5: Grant premium days at thresholds ─────────────────────
async function grantReferralReward(referrerId, approvedCount) {
  try {
    // Reward tiers: {minCount, days}
    var TIERS = [
      { count: 3, days: 7 },
      { count: 5, days: 10 },
      { count: 10, days: 21 }
    ];

    for (var tier of TIERS) {
      if (approvedCount === tier.count) {
        // Check if reward already given for this tier
        var { data: existing } = await sb
          .from('referral_rewards')
          .select('id')
          .eq('user_id', referrerId)
          .eq('referrals_count', tier.count);

        if (existing && existing.length > 0) continue; // already rewarded

        // Log the reward
        await sb.from('referral_rewards').insert({
          user_id: referrerId,
          referrals_count: tier.count,
          days_granted: tier.days
        });

        // Add days to their referral_premium_days total
        var { data: prof } = await sb
          .from('profiles')
          .select('referral_premium_days')
          .eq('id', referrerId)
          .single();

        var currentDays = (prof && prof.referral_premium_days) || 0;
        await sb.from('profiles')
          .update({ referral_premium_days: currentDays + tier.days })
          .eq('id', referrerId);

        console.log('Referral reward granted:', tier.days, 'days to', referrerId);
      }
    }
  } catch(x) {
    console.warn('grantReferralReward error:', x);
  }
}

// ── STEP 6: Load referral stats for home screen ───────────────────
async function loadReferralStats() {
  if (!U) return { total: 0, approved: 0, pendingDays: 0, earnedDays: 0 };
  try {
    var [allRefs, rewards, prof] = await Promise.all([
      sb.from('referrals').select('status').eq('referrer_id', U.id),
      sb.from('referral_rewards').select('days_granted').eq('user_id', U.id),
      sb.from('profiles').select('referral_premium_days').eq('id', U.id).single()
    ]);

    var total    = (allRefs.data || []).length;
    var approved = (allRefs.data || []).filter(r => r.status === 'approved').length;
    var earnedDays = (rewards.data || []).reduce((s, r) => s + r.days_granted, 0);

    // Calculate next tier
    var nextTier = approved < 3 ? { need: 3, days: 7 }
                 : approved < 5 ? { need: 5, days: 10 }
                 : approved < 10 ? { need: 10, days: 21 }
                 : null;

    return { total, approved, earnedDays, nextTier };
  } catch(x) {
    return { total: 0, approved: 0, earnedDays: 0, nextTier: { need: 3, days: 7 } };
  }
}

// ── STEP 7: Render referral card on home screen ───────────────────
async function renderReferralCard() {
  var card = document.getElementById('referralCard');
  if (!card) return;

  var stats = await loadReferralStats();
  var code = U ? U.id.slice(0, 8) : 'friend';
  var link = 'https://beginforever.in?ref=' + code;

  var nextMsg = stats.nextTier
    ? 'Get <strong>' + stats.nextTier.days + ' days free</strong> when ' + stats.nextTier.need + ' friends join'
    : '&#127881; Max rewards unlocked! Keep sharing.';

  card.innerHTML =
    '<p style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:rgba(212,160,23,.8);margin-bottom:4px;">&#10022; Refer &amp; Earn</p>' +
    '<p style="font-family:\'Cinzel\',serif;font-size:14px;color:#fff;font-weight:700;margin-bottom:10px;">Invite friends &middot; unlock <span style="color:var(--gold2);">free premium</span></p>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:10px;">' +
      '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(212,160,23,.15);border-radius:10px;padding:10px;text-align:center;">' +
        '<div style="font-family:\'Cinzel\',serif;font-size:22px;font-weight:900;color:var(--gold2);line-height:1;">' + stats.total + '</div>' +
        '<div style="font-size:9px;color:var(--w40);margin:3px 0;">invited</div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(212,160,23,.15);border-radius:10px;padding:10px;text-align:center;">' +
        '<div style="font-family:\'Cinzel\',serif;font-size:22px;font-weight:900;color:#4ade80;line-height:1;">' + stats.approved + '</div>' +
        '<div style="font-size:9px;color:var(--w40);margin:3px 0;">joined</div>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,.06);border:1px solid rgba(212,160,23,.15);border-radius:10px;padding:10px;text-align:center;">' +
        '<div style="font-family:\'Cinzel\',serif;font-size:22px;font-weight:900;color:var(--gold2);line-height:1;">' + stats.earnedDays + '</div>' +
        '<div style="font-size:9px;color:var(--w40);margin:3px 0;">days earned</div>' +
      '</div>' +
    '</div>' +
    '<div style="background:rgba(212,160,23,.08);border-radius:8px;padding:7px 10px;font-size:11px;color:rgba(255,255,255,.7);text-align:center;margin-bottom:10px;">' +
      nextMsg +
    '</div>' +
    '<button style="display:block;width:100%;padding:10px;background:linear-gradient(135deg,#D4A017,#F5C842);color:#3B0764;font-weight:800;font-size:12px;border:none;border-radius:50px;cursor:pointer;font-family:\'Nunito\',sans-serif;" onclick="shareApp()">' +
      '&#128279; Copy &amp; Share My Link' +
    '</button>';

  card.onclick = null; // remove old handler
}
