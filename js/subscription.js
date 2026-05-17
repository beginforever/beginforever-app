// Begin Forever — Subscription v10
// Cycles: Monthly · 3 Months · 6 Months (no weekly)
// Shows actual plan name (e.g. "Basic · Monthly") not just "Premium"

var SUB_CYCLE = 'monthly';

var PLANS = {
  basic: {
    name: 'Basic',
    tag: 'Get started on your journey',
    monthly:    { price: 499,  label: 'Monthly',   per: '/month',     save: '' },
    quarterly:  { price: 1299, label: '3 Months',  per: '/3 months',  save: '13% off' },
    halfyearly: { price: 2199, label: '6 Months',  per: '/6 months',  save: '27% off' },
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
    monthly:    { price: 899,  label: 'Monthly',   per: '/month',     save: '' },
    quarterly:  { price: 2157, label: '3 Months',  per: '/3 months',  save: '20% off' },
    halfyearly: { price: 3613, label: '6 Months',  per: '/6 months',  save: '33% off' },
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

// ── Helpers
function isPreLaunch() { try { return new Date() < LAUNCH; } catch(e) { return true; } }
function msUntilLaunch() { try { return LAUNCH - new Date(); } catch(e) { return 0; } }
function fmtCountdown(ms) {
  if (ms <= 0) return 'Launching now';
  var d = Math.floor(ms/86400000), h = Math.floor((ms%86400000)/3600000), m = Math.floor((ms%3600000)/60000);
  return d + 'd ' + h + 'h ' + m + 'm';
}

// ── Friendly plan label for profile display
// e.g. "Basic · Monthly" or "Premium · 3 Months"
function getPlanLabel(planTier, planCycle) {
  if (!planTier || !planCycle) return null;
  var tierName = planTier === 'premium' ? 'Premium ✦' : 'Basic';
  var cycleMap = { monthly: 'Monthly', quarterly: '3 Months', halfyearly: '6 Months' };
  var cycleName = cycleMap[planCycle] || planCycle;
  return tierName + ' · ' + cycleName;
}

// ── Show subscription tab
function showSub() {
  var profile = P || {};
  var isFounding = profile.is_founding_member === true;
  var preLaunch  = isPreLaunch();
  var c = document.getElementById('mainApp') || document.body;

  c.innerHTML = '' +
    '<div style="min-height:100vh;background:#FDFAF4;padding:14px 12px 100px;font-family:Nunito,sans-serif;">' +

    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">' +
    '<button onclick="goTab(\'profile\')" style="background:none;border:none;font-size:24px;color:#3B0764;cursor:pointer;padding:4px;">←</button>' +
    '<h2 style="font-family:Cinzel,serif;color:#3B0764;margin:0;font-size:18px;letter-spacing:1px;">Subscription</h2>' +
    '</div>' +

    '<div style="text-align:center;margin-bottom:14px;">' +
    '<p style="font-family:EB Garamond,serif;font-style:italic;color:#5B1A8F;margin:0;font-size:13px;">Choose your path to forever</p>' +
    '</div>' +

    // Current plan banner
    _currentPlanBanner(profile) +

    // Founding member banner
    (isFounding ? '<div style="background:linear-gradient(135deg,rgba(232,184,48,.12),rgba(123,31,162,.12));border:1px solid rgba(232,184,48,.3);border-radius:14px;padding:14px;margin-bottom:16px;text-align:center;"><p style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">✦ Founding Member #'+(profile.founding_number||'—')+'</p><p style="font-size:13px;color:#fff;margin:0;line-height:1.5;">You get <strong style="color:var(--gold-bright);">Premium free for 1 week</strong> automatically at launch.</p></div>' : '') +

    // Cycle toggle — 3 options only
    '<div style="background:var(--w05);border-radius:14px;padding:4px;display:flex;margin-bottom:14px;border:1px solid var(--w10);">' +
    _tab('monthly','Monthly') + _tab('quarterly','3 Months') + _tab('halfyearly','6 Months') +
    '</div>' +

    // Plan cards
    '<div style="position:relative;' + (preLaunch ? 'filter:blur(5px);pointer-events:none;user-select:none;' : '') + '">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch;">' +
    _basicCard() + _premiumCard() +
    '</div>' +
    '<div style="text-align:center;margin-top:14px;font-size:10px;color:#7B6BA0;">🔒 Secure payment via Razorpay · Cancel anytime</div>' +
    '</div>' +

    // Pre-launch overlay
    (preLaunch ? _overlay() : '') +

    '</div>';

  if (preLaunch) _startSubCountdown();
}

function _currentPlanBanner(profile) {
  if (!profile.subscription_status || profile.subscription_status !== 'active') return '';
  var label = getPlanLabel(profile.subscription_plan ? profile.subscription_plan.split('_')[0] : '', profile.subscription_plan ? profile.subscription_plan.split('_').slice(1).join('_') : '');
  if (!label) return '';
  var expiry = profile.subscription_expires_at ? new Date(profile.subscription_expires_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : '';
  return '<div style="background:linear-gradient(135deg,rgba(39,174,96,.12),rgba(39,174,96,.06));border:1px solid rgba(39,174,96,.3);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">' +
    '<div><p style="font-size:10px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px;">✅ Active Plan</p>' +
    '<p style="font-size:14px;font-weight:700;color:#fff;margin:0;">' + label + '</p></div>' +
    (expiry ? '<p style="font-size:10px;color:rgba(255,255,255,.4);margin:0;">Renews<br/>' + expiry + '</p>' : '') +
    '</div>';
}

function _tab(cycle, label) {
  var on = SUB_CYCLE === cycle;
  return '<button onclick="setCycle(\'' + cycle + '\')" style="flex:1;padding:9px 4px;border:none;border-radius:7px;cursor:pointer;font-weight:700;font-size:12px;font-family:Nunito,sans-serif;' +
    (on ? 'background:#3B0764;color:#fff;' : 'background:transparent;color:#3B0764;') + '">' + label + '</button>';
}

function setCycle(c) { SUB_CYCLE = c; showSub(); }

function _basicCard() {
  var c = PLANS.basic[SUB_CYCLE];
  var feats = PLANS.basic.features.map(function(f){
    return '<li style="padding:5px 0;font-size:11px;color:#3B0764;line-height:1.4;display:flex;gap:5px;"><span style="color:#D4A017;flex-shrink:0;">✓</span><span>'+f+'</span></li>';
  }).join('');
  return '<div style="background:#fff;border:1.5px solid #E8DCC4;border-radius:14px;padding:14px 10px;display:flex;flex-direction:column;">' +
    '<div style="text-align:center;border-bottom:1px solid #F0E8D8;padding-bottom:10px;margin-bottom:10px;">' +
    '<div style="font-family:Cinzel,serif;font-size:15px;color:#3B0764;font-weight:600;">BASIC</div>' +
    '<div style="font-family:EB Garamond,serif;font-style:italic;color:#9B7BBA;font-size:10px;margin:2px 0 4px;">' + PLANS.basic.tag + '</div>' +
    '<div style="font-family:Cinzel,serif;font-size:22px;font-weight:700;color:#3B0764;">₹' + c.price.toLocaleString('en-IN') + '</div>' +
    '<div style="font-size:10px;color:#7B6BA0;">' + c.per + '</div>' +
    (c.save ? '<div style="display:inline-block;background:#FDF0D5;color:#3B0764;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">' + c.save + '</div>' : '') +
    '</div>' +
    '<ul style="list-style:none;padding:0;margin:0;flex:1;">' + feats + '</ul>' +
    '<button onclick="choosePlan(\'basic\')" style="width:100%;margin-top:12px;background:linear-gradient(135deg,#D4A017,#F5C842);color:#3B0764;border:none;border-radius:8px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;">Choose Basic</button>' +
    '</div>';
}

function _premiumCard() {
  var c = PLANS.premium[SUB_CYCLE];
  var feats = PLANS.premium.features.map(function(f){
    var highlight = f.indexOf('⭐') === 0;
    return '<li style="padding:5px 0;font-size:11px;color:#fff;line-height:1.4;display:flex;gap:5px;' + (highlight ? 'background:rgba(245,200,66,.15);margin:2px -3px;padding-left:5px;border-radius:4px;' : '') + '"><span style="color:#F5C842;flex-shrink:0;">✓</span><span>' + f.replace('⭐ ','') + '</span></li>';
  }).join('');
  return '<div style="background:linear-gradient(160deg,#3B0764,#5B1A8F);border-radius:14px;padding:14px 10px;color:#fff;position:relative;box-shadow:0 4px 12px rgba(59,7,100,.25);display:flex;flex-direction:column;">' +
    '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#F5C842;color:#3B0764;padding:3px 10px;border-radius:10px;font-weight:800;font-size:9px;letter-spacing:.5px;white-space:nowrap;">★ RECOMMENDED</div>' +
    '<div style="text-align:center;border-bottom:1px solid rgba(245,200,66,.3);padding-bottom:10px;margin-bottom:10px;padding-top:4px;">' +
    '<div style="font-family:Cinzel,serif;font-size:15px;color:#F5C842;font-weight:600;">' + PLANS.premium.name + '</div>' +
    '<div style="font-family:EB Garamond,serif;font-style:italic;color:#F5C842;opacity:.8;font-size:10px;margin:2px 0 4px;">' + PLANS.premium.tag + '</div>' +
    '<div style="font-family:Cinzel,serif;font-size:22px;font-weight:700;color:#fff;">₹' + c.price.toLocaleString('en-IN') + '</div>' +
    '<div style="font-size:10px;color:#F5C842;opacity:.85;">' + c.per + '</div>' +
    (c.save ? '<div style="display:inline-block;background:#F5C842;color:#3B0764;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">' + c.save + '</div>' : '') +
    '</div>' +
    '<ul style="list-style:none;padding:0;margin:0;flex:1;">' + feats + '</ul>' +
    '<button onclick="choosePlan(\'premium\')" style="width:100%;margin-top:12px;background:#F5C842;color:#3B0764;border:none;border-radius:8px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;">Choose Premium ✦</button>' +
    '</div>';
}

function _overlay() {
  return '<div style="position:absolute;top:180px;left:12px;right:12px;background:rgba(253,250,244,.96);border:2px solid #D4A017;border-radius:14px;padding:22px 16px;text-align:center;box-shadow:0 6px 18px rgba(59,7,100,.15);">' +
    '<div style="font-size:36px;margin-bottom:6px;">🔒</div>' +
    '<h3 style="font-family:Cinzel,serif;color:#3B0764;font-size:17px;margin:0 0 6px;">Plans unlock at launch</h3>' +
    '<p style="font-family:EB Garamond,serif;font-style:italic;color:#5B1A8F;font-size:13px;margin:0 0 12px;">Founding members get Premium FREE for 1 week</p>' +
    '<div style="background:#3B0764;color:#F5C842;padding:11px 14px;border-radius:10px;font-family:Cinzel,serif;font-size:19px;font-weight:700;margin-bottom:4px;" id="subCountdown">—</div>' +
    '<div style="font-size:10px;color:#7B6BA0;letter-spacing:1px;">UNTIL 7 JUNE 2026</div>' +
    '</div>';
}

function _startSubCountdown() {
  function tick() {
    var e = document.getElementById('subCountdown');
    if (!e) return;
    e.textContent = fmtCountdown(msUntilLaunch());
  }
  tick();
  if (window._subCdInt) clearInterval(window._subCdInt);
  window._subCdInt = setInterval(tick, 60000);
}

// ── Choose plan — calls verify-payment Edge Function server-side
function choosePlan(tier) {
  if (isPreLaunch()) {
    alert('Plans unlock on 7 June 2026. Founding members get Premium FREE for the first week!');
    return;
  }
  if (!U) { alert('Please log in first'); return; }

  var c = PLANS[tier][SUB_CYCLE];
  var cycleLabel = { monthly: 'Monthly', quarterly: '3 Months', halfyearly: '6 Months' }[SUB_CYCLE] || SUB_CYCLE;
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
        // Server-side verification via Edge Function
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
          alert('Payment received but activation failed. Please contact support.\nPayment ID: ' + response.razorpay_payment_id);
          return;
        }
        alert('🎉 ' + planLabel + ' activated!\nValid until ' + new Date(verifyData.expires_at).toLocaleDateString('en-IN'));
        // Reload profile to reflect new plan
        var r2 = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
        if (r2.data && r2.data[0]) P = r2.data[0];
        showSub();
      } catch(e) {
        alert('Payment received but activation failed. Contact info@beginforever.in\nPayment ID: ' + response.razorpay_payment_id);
      }
    },
    prefill: {
      name:    P ? P.full_name : '',
      email:   P ? P.email : '',
      contact: P ? P.phone : ''
    },
    theme: { color: '#3B0764' }
  };
  new Razorpay(options).open();
}

// ── Show subscribe modal (from other parts of app)
function showSubscribeModal(feature) {
  var profile = P || {};
  if (profile.is_founding_member || profile.is_premium) return false;
  var msg = feature ? '"' + feature + '" is a Premium feature.\n\nUpgrade to unlock it.' : 'Upgrade to Premium to unlock this feature.';
  if (confirm(msg + '\n\nView subscription plans?')) showSub();
  return true;
}

function showSubModal(featureName) { return showSubscribeModal(featureName); }

// ── Legacy payRzp (kept for any remaining inline calls)
function payRzp(plan, amt) {
  var tier  = plan.toLowerCase().indexOf('premium') > -1 ? 'premium' : 'basic';
  var cycle = plan.indexOf('3 Month') > -1 ? 'quarterly' : plan.indexOf('6 Month') > -1 ? 'halfyearly' : 'monthly';
  choosePlan(tier); // redirect to new flow
}

// ── Plan cycle helpers for plans tab in mainApp
function setPlanCycle(c) { SUB_CYCLE = c; }

function subscribe(tier) { choosePlan(tier); }

window.showSub           = showSub;
window.setCycle          = setCycle;
window.choosePlan        = choosePlan;
window.showSubscribeModal = showSubscribeModal;
window.showSubModal      = showSubModal;
window.getPlanLabel      = getPlanLabel;
