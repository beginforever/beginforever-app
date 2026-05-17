// Begin Forever — Subscription v11
// Cycles: Monthly · 3 Months · 6 Months (no weekly)
// Shows actual plan name on profile. Uses tPlans tab — does NOT rewrite mainApp.

var SUB_CYCLE = 'monthly';

var PLANS = {
  basic: {
    name: 'Basic',
    tag: 'Get started on your journey',
    monthly:    { price: 499,  per: '/month',    save: '' },
    quarterly:  { price: 1299, per: '/3 months', save: '13% off' },
    halfyearly: { price: 2199, per: '/6 months', save: '27% off' },
    features: [
      'Unlimited chat with matches',
      'Send up to 10 interests per month',
      'See who liked you (count only)',
      'Basic filters (age, city, religion)',
      'Standard support'
    ]
  },
  premium: {
    name: 'Premium ✦',
    tag: 'Find your forever, faster',
    monthly:    { price: 899,  per: '/month',    save: '' },
    quarterly:  { price: 2157, per: '/3 months', save: '20% off' },
    halfyearly: { price: 3613, per: '/6 months', save: '33% off' },
    features: [
      'Unlimited chat',
      'Unlimited interests',
      '⭐ Faith filter — control who can send interests',
      'See who liked you (names + photos)',
      'See profile viewers',
      'Read receipts on messages',
      'Advanced filters (education, occupation, lifestyle)',
      'Contact reveal (phone & email)',
      'Priority support',
      'Profile boost (1 per week)'
    ]
  }
};

function isPreLaunch() { try { return new Date() < LAUNCH; } catch(e) { return true; } }
function msUntilLaunch() { try { return LAUNCH - new Date(); } catch(e) { return 0; } }
function fmtCountdown(ms) {
  if (ms <= 0) return 'Launching now';
  var d = Math.floor(ms/86400000), h = Math.floor((ms%86400000)/3600000), m = Math.floor((ms%3600000)/60000);
  return d + 'd ' + h + 'h ' + m + 'm';
}

// Friendly label for profile display e.g. "Basic · Monthly"
function getPlanLabel(planTier, planCycle) {
  if (!planTier || !planCycle) return null;
  var tierName = planTier === 'premium' ? 'Premium ✦' : 'Basic';
  var cycleMap = { monthly: 'Monthly', quarterly: '3 Months', halfyearly: '6 Months' };
  return tierName + ' · ' + (cycleMap[planCycle] || planCycle);
}

// ── showSub: navigates to tPlans tab and renders content there
function showSub() {
  goTab('plans');
  renderPlansTab();
}

// ── renderPlansTab: renders into #tPlans — called by goTab('plans') via ui.js
function renderPlansTab() {
  var container = document.getElementById('tPlans');
  if (!container) return;

  var profile   = P || {};
  var isFounding = profile.is_founding_member === true;
  var preLaunch  = isPreLaunch();

  // Current active plan banner
  var planBanner = '';
  if (profile.subscription_status === 'active' && profile.subscription_plan) {
    var parts    = (profile.subscription_plan || '').split('_');
    var tier     = parts[0] || '';
    var cycle    = parts.slice(1).join('_') || '';
    var label    = getPlanLabel(tier, cycle);
    var expiry   = profile.subscription_expires_at
      ? new Date(profile.subscription_expires_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})
      : '';
    if (label) {
      planBanner = '<div style="background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">' +
        '<div><p style="font-size:10px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px;">✅ Active Plan</p>' +
        '<p style="font-size:14px;font-weight:700;color:#fff;margin:0;">' + label + '</p></div>' +
        (expiry ? '<p style="font-size:10px;color:var(--w40);margin:0;text-align:right;">Renews<br/>' + expiry + '</p>' : '') +
        '</div>';
    }
  }

  // Founding member banner
  var foundingBanner = isFounding
    ? '<div style="background:linear-gradient(135deg,rgba(232,184,48,.12),rgba(123,31,162,.12));border:1px solid rgba(232,184,48,.3);border-radius:14px;padding:14px;margin-bottom:16px;text-align:center;">' +
      '<p style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">✦ Founding Member #' + (profile.founding_number || '—') + '</p>' +
      '<p style="font-size:13px;color:#fff;margin:0;line-height:1.5;">You get <strong style="color:var(--gold-bright);">Premium free for 1 week</strong> automatically at launch. No payment needed.</p>' +
      '</div>'
    : '';

  // Cycle toggle
  var cycleToggle =
    '<div style="background:var(--w05);border-radius:14px;padding:4px;display:flex;margin-bottom:18px;border:1px solid var(--w10);">' +
    _tab('monthly','Monthly') + _tab('quarterly','3 Months') + _tab('halfyearly','6 Months') +
    '</div>';

  // Cards area (blurred if pre-launch)
  var cardsHtml =
    '<div style="position:relative;">' +
    '<div style="' + (preLaunch ? 'filter:blur(5px);pointer-events:none;user-select:none;' : '') + '">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch;">' +
    _basicCard() + _premiumCard() +
    '</div>' +
    '<p style="text-align:center;font-size:10px;color:var(--w40);margin-top:14px;">🔒 Secure payment via Razorpay · Cancel anytime</p>' +
    '</div>' +
    (preLaunch ? _overlay() : '') +
    '</div>';

  container.innerHTML =
    '<div style="padding:0 0 20px;">' +
    '<div style="text-align:center;margin-bottom:16px;">' +
    '<p style="font-family:\'Cinzel\',serif;font-size:20px;color:var(--gold-bright);margin:0 0 4px;">Subscription Plans</p>' +
    '<p style="font-size:12px;color:var(--w60);margin:0;">Unlock unlimited matches · Cancel anytime</p>' +
    '</div>' +
    planBanner +
    foundingBanner +
    cycleToggle +
    cardsHtml +
    '</div>';

  if (preLaunch) _startSubCountdown();
}

function _tab(cycle, label) {
  var on = SUB_CYCLE === cycle;
  return '<button onclick="setCycle(\'' + cycle + '\')" style="flex:1;padding:9px;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:12px;font-family:Nunito,sans-serif;' +
    (on ? 'background:var(--gold);color:#1a0a2e;' : 'background:transparent;color:var(--w70);') + '">' + label + '</button>';
}

function setCycle(c) { SUB_CYCLE = c; renderPlansTab(); }

function _basicCard() {
  var c = PLANS.basic[SUB_CYCLE];
  var feats = PLANS.basic.features.map(function(f){
    return '<li style="display:flex;gap:6px;padding:5px 0;font-size:11px;color:var(--w70);line-height:1.4;"><span style="color:var(--gold);flex-shrink:0;">✓</span><span>' + f + '</span></li>';
  }).join('');
  return '<div style="background:var(--w05);border:1.5px solid var(--w10);border-radius:16px;padding:16px 12px;display:flex;flex-direction:column;">' +
    '<div style="text-align:center;border-bottom:1px solid var(--w10);padding-bottom:10px;margin-bottom:10px;">' +
    '<p style="font-family:\'Cinzel\',serif;font-size:16px;color:#fff;margin:0;">Basic</p>' +
    '<p style="font-size:10px;color:var(--w50);margin:2px 0 6px;">' + PLANS.basic.tag + '</p>' +
    '<p style="font-size:22px;font-weight:700;color:#fff;margin:0;">₹' + c.price.toLocaleString('en-IN') + '</p>' +
    '<p style="font-size:10px;color:var(--w50);margin:0;">' + c.per + '</p>' +
    (c.save ? '<span style="display:inline-block;background:rgba(212,160,23,.15);color:var(--gold);padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">' + c.save + '</span>' : '') +
    '</div>' +
    '<ul style="list-style:none;padding:0;margin:0;flex:1;">' + feats + '</ul>' +
    '<button onclick="choosePlan(\'basic\')" class="btn btn-gold" style="margin-top:12px;">Choose Basic</button>' +
    '</div>';
}

function _premiumCard() {
  var c = PLANS.premium[SUB_CYCLE];
  var feats = PLANS.premium.features.map(function(f){
    var hi = f.indexOf('⭐') === 0;
    return '<li style="display:flex;gap:6px;padding:5px 0;font-size:11px;color:#fff;line-height:1.4;' + (hi ? 'background:rgba(245,200,66,.1);margin:1px -4px;padding-left:4px;border-radius:4px;' : '') + '"><span style="color:#F5C842;flex-shrink:0;">✓</span><span>' + f.replace('⭐ ','') + '</span></li>';
  }).join('');
  return '<div style="background:linear-gradient(160deg,#2d1655,#3B0764);border:1.5px solid rgba(212,160,23,.5);border-radius:16px;padding:16px 12px;display:flex;flex-direction:column;position:relative;">' +
    '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--gold);color:#1a0a2e;font-size:9px;font-weight:800;padding:3px 10px;border-radius:6px;white-space:nowrap;">★ RECOMMENDED</div>' +
    '<div style="text-align:center;border-bottom:1px solid rgba(245,200,66,.3);padding-bottom:10px;margin-bottom:10px;padding-top:4px;">' +
    '<p style="font-family:\'Cinzel\',serif;font-size:16px;color:var(--gold-bright);margin:0;">' + PLANS.premium.name + '</p>' +
    '<p style="font-size:10px;color:var(--w60);margin:2px 0 6px;">' + PLANS.premium.tag + '</p>' +
    '<p style="font-size:22px;font-weight:700;color:var(--gold-bright);margin:0;">₹' + c.price.toLocaleString('en-IN') + '</p>' +
    '<p style="font-size:10px;color:var(--w60);margin:0;">' + c.per + '</p>' +
    (c.save ? '<span style="display:inline-block;background:var(--gold);color:#1A0830;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">' + c.save + '</span>' : '') +
    '</div>' +
    '<ul style="list-style:none;padding:0;margin:0;flex:1;">' + feats + '</ul>' +
    '<button onclick="choosePlan(\'premium\')" class="btn btn-gold" style="margin-top:12px;">Choose Premium ✦</button>' +
    '</div>';
}

function _overlay() {
  return '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:2;">' +
    '<div style="background:rgba(13,1,24,.9);border:1.5px solid rgba(212,160,23,.4);border-radius:16px;padding:24px 20px;text-align:center;max-width:280px;width:100%;backdrop-filter:blur(4px);">' +
    '<div style="font-size:32px;margin-bottom:8px;">🔒</div>' +
    '<p style="font-family:\'Cinzel\',serif;color:#fff;font-size:16px;font-weight:700;margin:0 0 6px;">Plans unlock at launch</p>' +
    '<p style="font-family:\'EB Garamond\',serif;font-style:italic;color:var(--gold);font-size:13px;margin:0 0 12px;">Founding members get Premium FREE for 1 week</p>' +
    '<div style="background:#3B0764;color:var(--gold2);padding:10px;border-radius:10px;font-family:\'Cinzel\',serif;font-size:18px;font-weight:700;margin-bottom:4px;" id="subCountdown">—</div>' +
    '<div style="font-size:10px;color:var(--w40);letter-spacing:1px;">UNTIL 7 JUNE 2026</div>' +
    '</div></div>';
}

function _startSubCountdown() {
  function tick() { var e = document.getElementById('subCountdown'); if(e) e.textContent = fmtCountdown(msUntilLaunch()); }
  tick();
  if (window._subCdInt) clearInterval(window._subCdInt);
  window._subCdInt = setInterval(tick, 60000);
}

// ── choosePlan — server-side Razorpay verification
function choosePlan(tier) {
  if (isPreLaunch()) { alert('Plans unlock on 7 June 2026. Founding members get Premium FREE for the first week!'); return; }
  if (!U) { alert('Please log in first'); return; }

  var c = PLANS[tier][SUB_CYCLE];
  var cycleLabel = { monthly:'Monthly', quarterly:'3 Months', halfyearly:'6 Months' }[SUB_CYCLE] || SUB_CYCLE;
  var planLabel = (tier === 'premium' ? 'Premium ✦' : 'Basic') + ' · ' + cycleLabel;

  var options = {
    key: 'rzp_live_SausbldU6Vqpy0',
    amount: c.price * 100,
    currency: 'INR',
    name: 'Begin Forever',
    description: planLabel,
    image: 'https://beginforever.github.io/beginforever-app/logo.png',
    handler: async function(response) {
      try {
        var verifyRes = await fetch(SB_URL + '/functions/v1/verify-payment', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            razorpay_order_id:   response.razorpay_order_id || '',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature || '',
            user_id:   U.id,
            plan_tier:  tier,
            plan_cycle: SUB_CYCLE,
            amount_paid: c.price * 100
          })
        });
        var verifyData = await verifyRes.json();
        if (verifyData.error) {
          alert('Payment received but activation failed. Contact support.\nPayment ID: ' + response.razorpay_payment_id);
          return;
        }
        alert('🎉 ' + planLabel + ' activated!');
        var r2 = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
        if (r2.data && r2.data[0]) P = r2.data[0];
        renderPlansTab();
      } catch(e) {
        alert('Payment received but activation failed. Contact info@beginforever.in\nPayment ID: ' + response.razorpay_payment_id);
      }
    },
    prefill: { name: P?P.full_name:'', email: P?P.email:'', contact: P?P.phone:'' },
    theme: { color: '#3B0764' }
  };
  new Razorpay(options).open();
}

function showSubscribeModal(feature) {
  var profile = P || {};
  if (profile.is_founding_member || profile.is_premium) return false;
  var msg = feature ? '"' + feature + '" is a Premium feature.\n\nUpgrade to unlock it.' : 'Upgrade to Premium to unlock this feature.';
  if (confirm(msg + '\n\nView subscription plans?')) showSub();
  return true;
}

function showSubModal(f) { return showSubscribeModal(f); }
function payRzp(plan, amt) { choosePlan(plan.toLowerCase().indexOf('premium') > -1 ? 'premium' : 'basic'); }
function subscribe(tier) { choosePlan(tier); }
function setPlanCycle(c) { SUB_CYCLE = c; renderPlansTab(); }

window.showSub            = showSub;
window.setCycle           = setCycle;
window.choosePlan         = choosePlan;
window.renderPlansTab     = renderPlansTab;
window.showSubscribeModal = showSubscribeModal;
window.showSubModal       = showSubModal;
window.getPlanLabel       = getPlanLabel;
