// Begin Forever — Subscription v5
var SUB_CYCLE = 'monthly';

var PLANS = {
  basic: {
    name: 'Basic',
    weekly: { price: 399, per: '/week' },
    monthly: { price: 799, per: '/month' },
    quarterly: { price: 1999, per: '/3 months', save: 'Save 17%' },
    features: [
      'Send up to 10 interests per month',
      'See who liked you (count only)',
      'Basic filters (age, city, religion)',
      'Standard support'
    ]
  },
  premium: {
    name: 'Premium',
    weekly: { price: 699, per: '/week' },
    monthly: { price: 1799, per: '/month' },
    quarterly: { price: 3999, per: '/3 months', save: 'Save 26%' },
    features: [
      'Unlimited interests',
      '⭐ Faith filter — control who can send you interests',
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
  return d+'d '+h+'h '+m+'m';
}

function showSub() {
  var profile = window.currentProfile || {};
  var isFounding = profile.is_founding_member === true;
  var preLaunch = isPreLaunch();
  var c = document.getElementById('mainApp') || document.body;

  c.innerHTML = ''
    + '<div style="min-height:100vh;background:#FDFAF4;padding:16px 14px 100px;font-family:Nunito,sans-serif;">'

    + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">'
    +   '<button onclick="goTab(\'profile\')" style="background:none;border:none;font-size:26px;color:#3B0764;cursor:pointer;padding:4px 8px;">←</button>'
    +   '<h2 style="font-family:Cinzel,serif;color:#3B0764;margin:0;font-size:20px;letter-spacing:1px;">Subscription</h2>'
    + '</div>'

    + (isFounding ? '<div style="background:linear-gradient(135deg,#F5C842,#D4A017);color:#3B0764;padding:12px 14px;border-radius:10px;margin-bottom:14px;font-weight:700;text-align:center;font-size:13px;">🌟 Founding Member #'+(profile.founding_number||'—')+' — Premium FREE for week 1</div>' : '')

    + '<div style="background:#fff;border-radius:12px;padding:4px;display:flex;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">'
    +   tab('weekly','Weekly') + tab('monthly','Monthly') + tab('quarterly','3 Months')
    + '</div>'

    + '<div style="position:relative;' + (preLaunch ? 'filter:blur(5px);pointer-events:none;user-select:none;' : '') + '">'
    +   premiumCard() + basicCard()
    + '</div>'

    + (preLaunch ? overlay() : '')

    + '</div>';

  if (preLaunch) startCountdown();
}

function tab(cycle, label) {
  var on = SUB_CYCLE === cycle;
  return '<button onclick="setCycle(\''+cycle+'\')" style="flex:1;padding:10px 4px;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;'+(on?'background:#3B0764;color:#fff;':'background:transparent;color:#3B0764;')+'">'+label+'</button>';
}

function setCycle(c) { SUB_CYCLE = c; showSub(); }

function premiumCard() {
  var p = PLANS.premium[SUB_CYCLE];
  var feats = PLANS.premium.features.map(function(f){
    return '<li style="padding:5px 0;font-size:13px;display:flex;gap:8px;line-height:1.4;"><span style="color:#F5C842;font-weight:700;flex-shrink:0;">✓</span><span>'+f+'</span></li>';
  }).join('');
  return ''
    + '<div style="background:linear-gradient(160deg,#3B0764,#5B1A8F);border-radius:16px;padding:20px 18px;margin-bottom:14px;color:#fff;box-shadow:0 6px 18px rgba(59,7,100,0.25);position:relative;">'
    +   '<div style="position:absolute;top:14px;right:14px;background:#F5C842;color:#3B0764;padding:3px 10px;border-radius:10px;font-weight:800;font-size:10px;letter-spacing:0.5px;">RECOMMENDED</div>'
    +   '<div style="font-family:Cinzel,serif;font-size:20px;margin-bottom:2px;">Premium ✦</div>'
    +   '<div style="font-family:EB Garamond,serif;font-style:italic;color:#F5C842;font-size:13px;margin-bottom:14px;">Find your forever, faster</div>'
    +   '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:6px;">'
    +     '<span style="font-family:Cinzel,serif;font-size:30px;font-weight:700;">₹'+p.price.toLocaleString('en-IN')+'</span>'
    +     '<span style="font-size:13px;opacity:0.85;">'+p.per+'</span>'
    +   '</div>'
    +   (p.save ? '<div style="display:inline-block;background:#F5C842;color:#3B0764;padding:2px 9px;border-radius:8px;font-size:10px;font-weight:700;margin-bottom:14px;">'+p.save+'</div>' : '<div style="height:14px;"></div>')
    +   '<ul style="list-style:none;padding:0;margin:0 0 16px;">'+feats+'</ul>'
    +   '<button onclick="choosePlan(\'premium\')" style="width:100%;background:#F5C842;color:#3B0764;border:none;border-radius:10px;padding:13px;font-weight:800;font-size:14px;cursor:pointer;">Choose Premium</button>'
    + '</div>';
}

function basicCard() {
  var p = PLANS.basic[SUB_CYCLE];
  var feats = PLANS.basic.features.map(function(f){
    return '<li style="padding:5px 0;font-size:13px;color:#3B0764;display:flex;gap:8px;line-height:1.4;"><span style="color:#D4A017;flex-shrink:0;">✓</span><span>'+f+'</span></li>';
  }).join('');
  return ''
    + '<div style="background:#fff;border:1.5px solid #E8DCC4;border-radius:16px;padding:18px;margin-bottom:14px;">'
    +   '<div style="font-family:Cinzel,serif;font-size:18px;color:#3B0764;margin-bottom:2px;">Basic</div>'
    +   '<div style="font-family:EB Garamond,serif;font-style:italic;color:#9B7BBA;font-size:13px;margin-bottom:14px;">Get started on your journey</div>'
    +   '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:6px;">'
    +     '<span style="font-family:Cinzel,serif;font-size:26px;font-weight:700;color:#3B0764;">₹'+p.price.toLocaleString('en-IN')+'</span>'
    +     '<span style="font-size:13px;color:#7B6BA0;">'+p.per+'</span>'
    +   '</div>'
    +   (p.save ? '<div style="display:inline-block;background:#FDF0D5;color:#3B0764;padding:2px 9px;border-radius:8px;font-size:10px;font-weight:700;margin-bottom:14px;">'+p.save+'</div>' : '<div style="height:14px;"></div>')
    +   '<ul style="list-style:none;padding:0;margin:0 0 16px;">'+feats+'</ul>'
    +   '<button onclick="choosePlan(\'basic\')" style="width:100%;background:#fff;color:#3B0764;border:2px solid #3B0764;border-radius:10px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;">Choose Basic</button>'
    + '</div>';
}

function overlay() {
  return ''
    + '<div style="position:absolute;top:200px;left:14px;right:14px;background:rgba(253,250,244,0.96);border:2px solid #D4A017;border-radius:16px;padding:24px 18px;text-align:center;box-shadow:0 6px 18px rgba(59,7,100,0.15);">'
    +   '<div style="font-size:38px;margin-bottom:8px;">🔒</div>'
    +   '<h3 style="font-family:Cinzel,serif;color:#3B0764;font-size:18px;margin:0 0 6px;">Plans unlock at launch</h3>'
    +   '<p style="font-family:EB Garamond,serif;font-style:italic;color:#5B1A8F;font-size:14px;margin:0 0 14px;">Founding members get Premium FREE for 1 week</p>'
    +   '<div style="background:#3B0764;color:#F5C842;padding:12px 16px;border-radius:10px;font-family:Cinzel,serif;font-size:20px;font-weight:700;margin-bottom:4px;" id="subCountdown">—</div>'
    +   '<div style="font-size:11px;color:#7B6BA0;letter-spacing:1px;">UNTIL 7 JUNE 2026</div>'
    + '</div>';
}

function startCountdown() {
  function tick() {
    var e = document.getElementById('subCountdown');
    if (!e) return;
    e.textContent = fmtCountdown(msUntilLaunch());
  }
  tick();
  if (window._subCdInt) clearInterval(window._subCdInt);
  window._subCdInt = setInterval(tick, 60000);
}

function choosePlan(tier) {
  if (isPreLaunch()) { alert('Plans unlock on 7 June 2026. Founding members get Premium FREE for the first week!'); return; }
  var u = window.currentUser; if (!u) { alert('Please log in first'); return; }
  var p = PLANS[tier][SUB_CYCLE];
  var options = {
    key: 'rzp_live_SausbldU6Vqpy0',
    amount: p.price * 100,
    currency: 'INR',
    name: 'Begin Forever',
    description: PLANS[tier].name + ' — ' + SUB_CYCLE,
    image: 'https://beginforever.github.io/beginforever-app/logo.png',
    handler: async function(response) {
      try {
        var days = SUB_CYCLE === 'weekly' ? 7 : (SUB_CYCLE === 'monthly' ? 30 : 90);
        var exp = new Date(Date.now() + days*86400000).toISOString();
        await sb.from('subscriptions').insert({
          user_id: u.id, plan_type: SUB_CYCLE, plan_tier: tier,
          amount_paid: p.price, razorpay_payment_id: response.razorpay_payment_id,
          status: 'active', expires_at: exp
        });
        await sb.from('profiles').update({
          is_premium: tier === 'premium', subscription_status: 'active',
          subscription_plan: tier + '_' + SUB_CYCLE, subscription_expires_at: exp
        }).eq('id', u.id);
        alert('🎉 Subscription activated! Welcome to ' + PLANS[tier].name);
        window.location.reload();
      } catch (e) {
        alert('Payment received but activation failed. Contact info@beginforever.in');
      }
    },
    prefill: {
      name: window.currentProfile?.full_name || '',
      email: window.currentProfile?.email || '',
      contact: window.currentProfile?.phone || ''
    },
    theme: { color: '#3B0764' }
  };
  new Razorpay(options).open();
}

function showSubModal(featureName) {
  var profile = window.currentProfile || {};
  if (profile.is_founding_member || profile.is_premium) return false;
  var msg = featureName ? '"'+featureName+'" is a Premium feature.\n\nUpgrade to unlock it.' : 'Upgrade to Premium to unlock this feature.';
  if (confirm(msg + '\n\nView subscription plans?')) showSub();
  return true;
}

window.showSub = showSub;
window.setCycle = setCycle;
window.choosePlan = choosePlan;
window.showSubModal = showSubModal;
