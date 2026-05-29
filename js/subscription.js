// Begin Forever — Subscription v15
// Changes:
//   - Razorpay key removed from client; orders created via Edge Function
//   - Google Play Billing added for Android TWA (via Digital Goods API / Payment Request API)
//   - Falls back to Razorpay web for non-Android
//   - choosePlan() detects environment and routes accordingly

var SUB_CYCLE = 'monthly';

var PLANS = {
  basic: {
    name: 'Basic',
    tag: 'Get started on your journey',
    monthly:    { price: 499,  per: '/month',    days: 30  },
    quarterly:  { price: 1299, per: '/3 months', days: 90,  save: '13% off' },
    halfyearly: { price: 2199, per: '/6 months', days: 180, save: '27% off' },
    // Google Play product IDs (must match Play Console in-app products)
    gpb: {
      monthly:    'basic_monthly',
      quarterly:  'basic_quarterly',
      halfyearly: 'basic_halfyearly',
    },
    features: [
      { text: 'Browse all verified profiles',           locked: false },
      { text: 'Unlimited interests',                    locked: false },
      { text: 'Unlimited chat with matches',            locked: false },
      { text: 'See who liked you (count only)',         locked: false },
      { text: 'Basic filters (age, city, religion)',    locked: false },
      { text: 'Standard support',                       locked: false },
      { text: 'See who liked you — names & photos',     locked: true  },
      { text: 'Faith filter — control who reaches you', locked: true, star: true },
      { text: 'See profile viewers',                    locked: true  },
      { text: 'Contact reveal (phone & email)',         locked: true  },
      { text: 'Read receipts',                          locked: true  },
      { text: 'Advanced filters + Priority support',    locked: true  }
    ]
  },
  premium: {
    name: 'Premium',
    tag: 'Find your forever, faster',
    monthly:    { price: 899,  per: '/month',    days: 30  },
    quarterly:  { price: 2157, per: '/3 months', days: 90,  save: '20% off' },
    halfyearly: { price: 3613, per: '/6 months', days: 180, save: '33% off' },
    gpb: {
      monthly:    'premium_monthly',
      quarterly:  'premium_quarterly',
      halfyearly: 'premium_halfyearly',
    },
    features: [
      { text: 'Browse all verified profiles',           locked: false },
      { text: 'Unlimited interests',                    locked: false },
      { text: 'Unlimited chat with matches',            locked: false },
      { text: 'See who liked you — names & photos',     locked: false },
      { text: 'Faith filter — control who reaches you', locked: false, star: true },
      { text: 'See profile viewers',                    locked: false },
      { text: 'Contact reveal (phone & email)',         locked: false },
      { text: 'Read receipts on messages',              locked: false },
      { text: 'Advanced filters (edu, occ, lifestyle)', locked: false },
      { text: 'Priority support',                       locked: false },
      { text: 'Profile boost (1 per week)',             locked: false }
    ]
  }
};

// ═══ ENVIRONMENT DETECTION
function isAndroidTWA() {
  // TWA sets document.referrer to android-app://package or window.matchMedia display-mode=standalone
  // Most reliable: check for Digital Goods API presence
  if (typeof window !== 'undefined' && window.getDigitalGoodsService) return true;
  // Fallback: TWA user-agent hint
  if (navigator.userAgent && navigator.userAgent.includes('wv') && /Android/.test(navigator.userAgent)) return true;
  return false;
}

// ═══ FEATURE GATES
function canSendInterest() { return !!P && P.status === 'approved'; }
function canChat() { if (!P || P.status !== 'approved') return false; return isSubscribed(); }
function isSubscribed() {
  if (!P) return false;
  if (P.is_admin) return true;
  var now = new Date();
  if (P.subscription_expires_at) {
    var exp = new Date(P.subscription_expires_at);
    if (exp > now && P.subscription_status === 'active') return true;
  }
  if (P.is_founding_member) {
    try { var lp7 = new Date(LAUNCH.getTime() + 7*24*60*60*1000); if (now >= LAUNCH && now < lp7) return true; } catch(x) {}
  }
  return false;
}
function canViewContactDetails()  { return isPremiumUser(); }
function canSeeLikerNames()       { return isPremiumUser(); }
function canSeeProfileViewers()   { return isPremiumUser(); }
function canUseFaithFilter()      { return isPreLaunch() || isPremiumUser(); }
function canUseAdvancedFilters()  { return isPremiumUser(); }
function canSeeReadReceipts()     { return isPremiumUser(); }

// ═══ LAUNCH
function isPreLaunch() { try { return new Date() < LAUNCH; } catch(e) { return true; } }
function msUntilLaunch() { try { return Math.max(0, LAUNCH - new Date()); } catch(e) { return 0; } }
function fmtCountdown(ms) {
  if (ms <= 0) return 'Launching now';
  var d = Math.floor(ms/86400000), h = Math.floor((ms%86400000)/3600000), m = Math.floor((ms%3600000)/60000);
  return d+'d '+h+'h '+m+'m';
}

// ═══ PREMIUM CHECK
function isPremiumUser() {
  if (!P) return false;
  if (P.is_admin) return true;
  var now = new Date();
  if (P.subscription_expires_at) {
    var exp = new Date(P.subscription_expires_at);
    if (exp > now && (P.is_premium === true || P.subscription_status === 'active')) return true;
  }
  if (P.is_founding_member) {
    try { var lp7 = new Date(LAUNCH.getTime() + 7*24*60*60*1000); if (now >= LAUNCH && now < lp7) return true; } catch(x) {}
  }
  if (P.referral_premium_days > 0 && P.subscription_expires_at) {
    var be = new Date(P.subscription_expires_at);
    var re = new Date(be.getTime() + P.referral_premium_days*24*60*60*1000);
    if (re > now) return true;
  }
  return false;
}

async function checkAndExpireSubscription() {
  if (!P || !U || !P.subscription_expires_at) return;
  var now = new Date(), exp = new Date(P.subscription_expires_at);
  if (exp < now && (P.is_premium || P.subscription_status === 'active')) {
    try { await sb.from('profiles').update({ is_premium: false, subscription_status: 'expired' }).eq('id', U.id); P.is_premium = false; P.subscription_status = 'expired'; } catch(x) {}
  }
}

async function activateFoundingPremium() {
  if (!P || !P.is_founding_member || P.founding_premium_activated) return;
  var now = new Date(); if (now < LAUNCH) return;
  var lp7 = new Date(LAUNCH.getTime() + 7*24*60*60*1000); if (now > lp7) return;
  try {
    var expiresAt = lp7.toISOString();
    await sb.from('profiles').update({ is_premium: true, subscription_status: 'active', subscription_plan: 'premium_founding_week', subscription_expires_at: expiresAt, founding_premium_activated: true }).eq('id', U.id);
    P.is_premium = true; P.subscription_expires_at = expiresAt; P.subscription_status = 'active'; P.founding_premium_activated = true;
  } catch(x) {}
}

// ═══ CHOOSE PLAN — routes to GPB on Android, Razorpay on web
async function choosePlan(tier) {
  if (isPreLaunch()) { alert('Plans unlock on 7 June 2026.\nFounding members get Premium FREE for the first week!'); return; }
  if (!U) { alert('Please log in first'); return; }

  if (isAndroidTWA()) {
    await _choosePlanGPB(tier);
  } else {
    await _choosePlanRazorpay(tier);
  }
}

// ─── GOOGLE PLAY BILLING (Digital Goods API)
async function _choosePlanGPB(tier) {
  try {
    var service = await window.getDigitalGoodsService('https://play.google.com/billing');
    var productId = PLANS[tier].gpb[SUB_CYCLE];
    var details = await service.getDetails([productId]);
    if (!details || !details.length) { alert('Product not available. Please try again.'); return; }

    var item = details[0];
    var payRequest = new PaymentRequest(
      [{ supportedMethods: 'https://play.google.com/billing', data: { sku: productId } }],
      { total: { label: item.title || (tier+' '+SUB_CYCLE), amount: { currency: 'INR', value: '0' } } }
    );
    var payResponse = await payRequest.show();
    var token = payResponse.details && payResponse.details.purchaseToken;
    if (!token) { await payResponse.complete('fail'); alert('Payment failed. Please try again.'); return; }

    await payResponse.complete('success');
    await _activateSubscription(tier, SUB_CYCLE, PLANS[tier][SUB_CYCLE].days, null, token);
  } catch(e) {
    if (e.name === 'AbortError') return; // user cancelled
    console.error('GPB error:', e);
    // Fallback to Razorpay if Digital Goods API fails unexpectedly
    await _choosePlanRazorpay(tier);
  }
}

// ─── RAZORPAY (web / non-Android)
async function _choosePlanRazorpay(tier) {
  var planData = PLANS[tier][SUB_CYCLE];
  var cycleLabel = { monthly: 'Monthly', quarterly: '3 Months', halfyearly: '6 Months' }[SUB_CYCLE] || SUB_CYCLE;
  var planLabel = (tier === 'premium' ? 'Premium' : 'Basic') + ' · ' + cycleLabel;

  try {
    // Create order server-side — key_secret never touches client
    var res = await fetch(SB_URL + '/functions/v1/create-razorpay-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
      body: JSON.stringify({ amount: planData.price * 100, currency: 'INR', plan_label: planLabel })
    });
    var orderData = await res.json();
    if (orderData.error) { alert('Could not create order: ' + orderData.error); return; }

    var options = {
      key: orderData.key_id,          // public key only, returned from server
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.order_id,   // Razorpay now verifies against this
      name: 'Begin Forever',
      description: planLabel,
      image: 'https://beginforever.github.io/beginforever-app/logo.png',
      handler: async function(response) {
        await _activateSubscription(tier, SUB_CYCLE, planData.days, response.razorpay_payment_id, null);
      },
      prefill: { name: P ? P.full_name : '', email: P ? P.email : '', contact: P ? P.phone : '' },
      theme: { color: '#3B0764' }
    };
    new Razorpay(options).open();
  } catch(e) {
    alert('Payment error: ' + (e.message || 'Please try again.'));
  }
}

// ─── SHARED ACTIVATION
async function _activateSubscription(tier, cycle, days, razorpayPaymentId, gpbPurchaseToken) {
  try {
    var now = new Date(), baseDate = now;
    if (P && P.subscription_expires_at) {
      var existing = new Date(P.subscription_expires_at);
      if (existing > now) baseDate = existing;
    }
    var referralDays = (P && P.referral_premium_days) ? parseInt(P.referral_premium_days) : 0;
    var expiresAt = new Date(baseDate.getTime() + (days + referralDays) * 24 * 60 * 60 * 1000);
    var cycleLabel = { monthly: 'Monthly', quarterly: '3 Months', halfyearly: '6 Months' }[cycle] || cycle;
    var planLabel = (tier === 'premium' ? 'Premium' : 'Basic') + ' · ' + cycleLabel;

    await sb.from('subscriptions').insert({
      user_id: U.id,
      plan_type: cycle,
      plan_tier: tier,
      amount_paid: PLANS[tier][cycle].price,
      razorpay_payment_id: razorpayPaymentId || null,
      gpb_purchase_token: gpbPurchaseToken || null,
      payment_method: gpbPurchaseToken ? 'google_play' : 'razorpay',
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });

    await sb.from('profiles').update({
      is_premium: tier === 'premium',
      subscription_status: 'active',
      subscription_plan: tier + '_' + cycle,
      subscription_expires_at: expiresAt.toISOString(),
      referral_premium_days: 0
    }).eq('id', U.id);

    var r2 = await sb.from('profiles').select('*').eq('id', U.id).limit(1);
    if (r2.data && r2.data.length) P = r2.data[0];

// ── Notify user via email + WhatsApp
    try {
      await fetch(SB_URL + '/functions/v1/smart-function', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY },
        body: JSON.stringify({
          type: 'subscription_activated',
          email: P.email || (U && U.email) || '',
          full_name: P.full_name || '',
          phone: P.phone || '',
          plan_name: tier === 'premium' ? 'Premium' : 'Basic',
          plan_duration: cycleLabel,
          expiry_date: expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        })
      });
    } catch(notifyErr) {
      console.warn('smart-function notify failed:', notifyErr);
    }
    alert('🎉 ' + planLabel + ' activated!\nExpires: ' + expiresAt.toLocaleDateString('en-IN') +
      (referralDays > 0 ? '\n(+' + referralDays + ' referral bonus days)' : ''));
    showSub();
  } catch(e) {
    var ref = razorpayPaymentId || gpbPurchaseToken || 'N/A';
    alert('Payment received but activation failed.\nContact info@beginforever.in\nRef: ' + ref);
  }
}

// ═══ SHOW SUBSCRIPTION TAB
function showSub() {
  var isFounding = P && P.is_founding_member === true;
  var preLaunch  = isPreLaunch();
  var isAndroid  = isAndroidTWA();

  ['tHome','tBrowse','tInterests','tChat','tViews','tProfile','tPlans','tReviews','tAdmin'].forEach(function(x) {
    var el = document.getElementById(x); if (el) el.style.display = 'none';
  });
  var ma = document.getElementById('mainApp'); if (ma) ma.style.display = 'block';
  var planTab = document.getElementById('tPlans');
  if (!planTab) { if (typeof goTab === 'function') goTab('home'); return; }
  planTab.style.display = 'block';
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });

  var banner = '';
  if (P && P.subscription_expires_at) {
    var expDate = new Date(P.subscription_expires_at), now = new Date();
    if (expDate > now && isSubscribed()) {
      var daysLeft = Math.ceil((expDate - now) / 86400000);
      var pLabel = (P.subscription_plan || 'Active').replace(/_/g,' · ');
      banner = '<div style="background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);border-radius:12px;padding:12px 16px;margin-bottom:14px;text-align:center;"><p style="font-size:12px;color:#27ae60;font-weight:700;margin:0 0 2px;">Active: '+pLabel+'</p><p style="font-size:11px;color:#7A6090;margin:0;">'+daysLeft+' day'+(daysLeft!==1?'s':'')+' remaining · expires '+expDate.toLocaleDateString('en-IN')+'</p></div>';
    } else if (expDate <= now) {
      banner = '<div style="background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.25);border-radius:12px;padding:12px 16px;margin-bottom:14px;text-align:center;"><p style="font-size:12px;color:#e74c3c;font-weight:700;margin:0 0 2px;">Subscription expired</p><p style="font-size:11px;color:#9B8FAA;margin:0;">Renew below to restore chat access</p></div>';
    }
  }

  var paymentNote = isAndroid
    ? '<p style="font-size:10px;color:#9B8FAA;text-align:center;margin-top:8px;">Secured by Google Play Billing</p>'
    : '<p style="font-size:10px;color:#9B8FAA;text-align:center;margin-top:8px;">Secured by Razorpay · Cancel anytime</p>';

  planTab.innerHTML =
    '<div style="padding:14px 12px 100px;font-family:Nunito,sans-serif;background:#FDFAF4;min-height:100vh;">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><button onclick="goTab(\'home\')" style="background:none;border:none;font-size:24px;color:#3B0764;cursor:pointer;padding:4px;">←</button><h2 style="font-family:Cinzel,serif;color:#3B0764;margin:0;font-size:18px;letter-spacing:1px;">Subscription</h2></div>' +
    banner +
    '<p style="font-family:\'EB Garamond\',serif;font-style:italic;color:#7A6090;text-align:center;margin:0 0 14px;font-size:13px;">Choose your path to forever</p>' +
    (isFounding ? '<div style="background:linear-gradient(135deg,rgba(232,184,48,.12),rgba(123,31,162,.12));border:1px solid rgba(212,160,23,.3);border-radius:14px;padding:14px;margin-bottom:16px;text-align:center;"><p style="font-size:11px;font-weight:700;color:#D4A017;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">Founding Member #'+((P&&P.founding_number)||'—')+'</p><p style="font-size:13px;color:#1C0530;margin:0;line-height:1.5;">You get <strong style="color:#D4A017;">Premium free for 1 week</strong> at launch — automatically.</p></div>' : '') +
    '<div style="background:rgba(59,7,100,.06);border-radius:14px;padding:4px;display:flex;margin-bottom:16px;border:1px solid rgba(59,7,100,.12);">' +
    _tabBtn('monthly','Monthly') + _tabBtn('quarterly','3 Months') + _tabBtn('halfyearly','6 Months') +
    '</div>' +
    '<div style="position:relative;' + (preLaunch ? 'filter:blur(5px);pointer-events:none;user-select:none;' : '') + '">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch;">' +
    _basicCard() + _premiumCard() +
    '</div>' + paymentNote + '</div>' +
    (preLaunch ? _launchOverlay() : '') +
    '</div>';

  if (preLaunch) _startSubCountdown();
}

function _tabBtn(cycle, label) {
  var on = SUB_CYCLE === cycle;
  return '<button onclick="setCycle(\''+cycle+'\')" style="flex:1;padding:9px 4px;border:none;border-radius:7px;cursor:pointer;font-weight:700;font-size:12px;font-family:Nunito,sans-serif;transition:all .2s;'+(on?'background:#3B0764;color:#F5C842;':'background:transparent;color:#7A6090;')+'">'+label+'</button>';
}

function _buildFeatureList(tier) {
  var isDark = tier === 'premium';
  return PLANS[tier].features.map(function(f) {
    var lk = f.locked === true;
    var icon  = lk ? '🔒' : (f.star ? '⭐' : '✓');
    var color = lk ? (isDark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.2)') : (f.star ? '#D4A017' : (isDark ? '#4ade80' : '#3B0764'));
    var textC = lk ? (isDark ? 'rgba(255,255,255,.25)' : 'rgba(0,0,0,.25)') : (isDark ? '#fff' : '#2D1655');
    var rowBg = (f.star && !lk) ? 'background:rgba(212,160,23,.08);margin:2px -4px;padding-left:5px;border-radius:4px;' : '';
    return '<li style="padding:5px 0;font-size:11px;line-height:1.4;display:flex;gap:6px;'+rowBg+'"><span style="color:'+color+';flex-shrink:0;">'+icon+'</span><span style="color:'+textC+';">'+f.text+'</span></li>';
  }).join('');
}

function _basicCard() {
  var c = PLANS.basic[SUB_CYCLE];
  return '<div style="background:#fff;border:1.5px solid rgba(59,7,100,.12);border-radius:14px;padding:14px 10px;display:flex;flex-direction:column;box-shadow:0 2px 8px rgba(59,7,100,.06);">'+
    '<div style="text-align:center;border-bottom:1px solid rgba(59,7,100,.08);padding-bottom:10px;margin-bottom:10px;">'+
    '<div style="font-family:Cinzel,serif;font-size:15px;color:#1C0530;font-weight:600;">BASIC</div>'+
    '<div style="font-family:\'EB Garamond\',serif;font-style:italic;color:#9B8FAA;font-size:10px;margin:2px 0 4px;">'+PLANS.basic.tag+'</div>'+
    '<div style="font-family:Cinzel,serif;font-size:22px;font-weight:700;color:#1C0530;">₹'+c.price.toLocaleString('en-IN')+'</div>'+
    '<div style="font-size:10px;color:#9B8FAA;">'+c.per+' · '+c.days+' days</div>'+
    (c.save ? '<div style="display:inline-block;background:rgba(212,160,23,.12);color:#D4A017;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">'+c.save+'</div>' : '')+
    '</div>'+
    '<ul style="list-style:none;padding:0;margin:0;flex:1;">'+_buildFeatureList('basic')+'</ul>'+
    '<button onclick="choosePlan(\'basic\')" style="width:100%;margin-top:12px;background:#3B0764;color:#F5C842;border:none;border-radius:8px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;">Choose Basic</button>'+
    '</div>';
}

function _premiumCard() {
  var c = PLANS.premium[SUB_CYCLE];
  return '<div style="background:linear-gradient(160deg,#2d1655,#3B0764);border:1.5px solid rgba(212,160,23,.5);border-radius:14px;padding:14px 10px;position:relative;box-shadow:0 4px 16px rgba(59,7,100,.25);display:flex;flex-direction:column;">'+
    '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#D4A017;color:#fff;padding:3px 10px;border-radius:10px;font-weight:800;font-size:9px;letter-spacing:.5px;white-space:nowrap;">★ RECOMMENDED</div>'+
    '<div style="text-align:center;border-bottom:1px solid rgba(245,200,66,.3);padding-bottom:10px;margin-bottom:10px;padding-top:4px;">'+
    '<div style="font-family:Cinzel,serif;font-size:15px;color:#F5C842;font-weight:600;letter-spacing:.5px;">PREMIUM ✦</div>'+
    '<div style="font-family:\'EB Garamond\',serif;font-style:italic;color:#F5C842;opacity:.8;font-size:10px;margin:2px 0 4px;">'+PLANS.premium.tag+'</div>'+
    '<div style="font-family:Cinzel,serif;font-size:22px;font-weight:700;color:#fff;">₹'+c.price.toLocaleString('en-IN')+'</div>'+
    '<div style="font-size:10px;color:#F5C842;opacity:.85;">'+c.per+' · '+c.days+' days</div>'+
    (c.save ? '<div style="display:inline-block;background:#F5C842;color:#3B0764;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">'+c.save+'</div>' : '')+
    '</div>'+
    '<ul style="list-style:none;padding:0;margin:0;flex:1;">'+_buildFeatureList('premium')+'</ul>'+
    '<button onclick="choosePlan(\'premium\')" style="width:100%;margin-top:12px;background:#F5C842;color:#3B0764;border:none;border-radius:8px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;">Choose Premium</button>'+
    '</div>';
}

function _launchOverlay() {
  return '<div style="position:absolute;top:260px;left:12px;right:12px;background:rgba(253,250,244,.96);border:2px solid #D4A017;border-radius:14px;padding:22px 16px;text-align:center;box-shadow:0 6px 18px rgba(59,7,100,.15);">'+
    '<div style="font-size:36px;margin-bottom:6px;">🔒</div>'+
    '<h3 style="font-family:\'Cinzel\',serif;color:#1C0530;font-size:17px;margin:0 0 6px;">Plans unlock at launch</h3>'+
    '<p style="font-family:\'EB Garamond\',serif;font-style:italic;color:#D4A017;font-size:13px;margin:0 0 12px;">Founding members get Premium FREE for 1 week</p>'+
    '<div id="subCountdown" style="background:#3B0764;color:#F5C842;padding:11px 14px;border-radius:10px;font-family:Cinzel,serif;font-size:19px;font-weight:700;margin-bottom:4px;">—</div>'+
    '<div style="font-size:10px;color:#9B8FAA;letter-spacing:1px;">UNTIL 7 JUNE 2026</div></div>';
}

function _startSubCountdown() {
  function tick() { var e = document.getElementById('subCountdown'); if (e) e.textContent = fmtCountdown(msUntilLaunch()); }
  tick();
  if (window._subCdInt) clearInterval(window._subCdInt);
  window._subCdInt = setInterval(tick, 60000);
}

function setCycle(c) { SUB_CYCLE = c; showSub(); }

function showSubModal(featureName) {
  if (isPremiumUser()) return false;
  var msg = featureName ? '"'+featureName+'" requires a subscription.' : 'Subscribe to unlock this feature.';
  if (confirm(msg + '\n\nView plans?')) showSub();
  return true;
}

function showChatSubModal() {
  if (confirm('Chat requires an active subscription.\n\nBasic or Premium plans unlock unlimited chat.\n\nView plans now?')) showSub();
}

function updatePricingCountdown() {
  if (!LAUNCH) return;
  var diff = LAUNCH - new Date(); if (diff <= 0) return;
  var pad = function(n) { return String(Math.max(0, Math.floor(n))).padStart(2,'0'); };
  var d = document.getElementById('pcDays'); if (d) d.textContent = pad(Math.floor(diff/86400000));
  var h = document.getElementById('pcHrs');  if (h) h.textContent = pad(Math.floor((diff%86400000)/3600000));
  var m = document.getElementById('pcMins'); if (m) m.textContent = pad(Math.floor((diff%3600000)/60000));
  var fm = document.getElementById('pricingFounderMsg');
  if (fm && P && P.is_founding_member) fm.style.display = '';
}

// Legacy alias — used in index.html subscribe modal buttons
function payRzp(plan, amt) {
  var tier = plan.toLowerCase().indexOf('premium') > -1 ? 'premium' : 'basic';
  SUB_CYCLE = plan.indexOf('Quarterly') !== -1 ? 'quarterly' : plan.indexOf('Monthly') !== -1 ? 'monthly' : 'halfyearly';
  choosePlan(tier);
}

window.showSub = showSub; window.setCycle = setCycle; window.choosePlan = choosePlan;
window.showSubModal = showSubModal; window.showChatSubModal = showChatSubModal;
window.payRzp = payRzp; window.isPremiumUser = isPremiumUser; window.isSubscribed = isSubscribed;
window.activateFoundingPremium = activateFoundingPremium;
window.checkAndExpireSubscription = checkAndExpireSubscription;
window.updatePricingCountdown = updatePricingCountdown;
window.canSendInterest = canSendInterest; window.canChat = canChat;
window.canViewContactDetails = canViewContactDetails; window.canSeeLikerNames = canSeeLikerNames;
window.canSeeProfileViewers = canSeeProfileViewers; window.canUseFaithFilter = canUseFaithFilter;
window.canUseAdvancedFilters = canUseAdvancedFilters; window.canSeeReadReceipts = canSeeReadReceipts;
