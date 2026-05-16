// Begin Forever — Subscription v7 (Shaadi-style cards with discount badges)
var SUB_TIER = 'premium'; // basic | premium

var PLANS = {
  basic: {
    name: 'Basic',
    tag: 'Get started on your journey',
    cycles: [
      { id:'monthly',    label:'Monthly',     months:1, price:499,  per:499,  tag:null },
      { id:'quarterly',  label:'3 Months',    months:3, price:1299, per:433,  tag:null },
      { id:'halfyearly', label:'6 Months',    months:6, price:2199, per:367,  tag:'BEST VALUE' }
    ],
    features: [
      'Unlimited chat',
      'Send up to 10 interests per month',
      'See who liked you (count only)',
      'Basic filters (age, city, religion)',
      'Standard support'
    ]
  },
  premium: {
    name: 'Premium ✦',
    tag: 'Find your forever, faster',
    cycles: [
      { id:'monthly',    label:'Monthly',     months:1, price:899,  per:899,  tag:null },
      { id:'quarterly',  label:'3 Months',    months:3, price:2157, per:719,  tag:'TOP SELLER' },
      { id:'halfyearly', label:'6 Months',    months:6, price:3613, per:602,  tag:'BEST VALUE' }
    ],
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
  var d=Math.floor(ms/86400000), h=Math.floor((ms%86400000)/3600000), m=Math.floor((ms%3600000)/60000);
  return d+'d '+h+'h '+m+'m';
}
function fmtINR(n) { return '₹'+n.toLocaleString('en-IN'); }

function showSub() {
  var profile = window.currentProfile || {};
  var isFounding = profile.is_founding_member === true;
  var preLaunch = isPreLaunch();
  var c = document.getElementById('mainApp') || document.body;

  c.innerHTML = ''
    + '<div style="min-height:100vh;background:#FDFAF4;padding:14px 12px 100px;font-family:Nunito,sans-serif;">'

    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'
    +   '<button onclick="goTab(\'profile\')" style="background:none;border:none;font-size:24px;color:#3B0764;cursor:pointer;padding:4px;">←</button>'
    +   '<h2 style="font-family:Cinzel,serif;color:#3B0764;margin:0;font-size:18px;letter-spacing:1px;">Subscription Plans</h2>'
    + '</div>'

    + '<div style="text-align:center;margin-bottom:14px;">'
    +   '<p style="font-family:EB Garamond,serif;font-style:italic;color:#5B1A8F;margin:0;font-size:13px;">Choose your path to forever</p>'
    + '</div>'

    + (isFounding ? '<div style="background:linear-gradient(135deg,#F5C842,#D4A017);color:#3B0764;padding:10px 12px;border-radius:10px;margin-bottom:12px;font-weight:700;text-align:center;font-size:12px;">🌟 Founding Member #'+(profile.founding_number||'—')+' — Premium FREE for week 1</div>' : '')

    // Tier toggle
    + '<div style="background:#fff;border-radius:12px;padding:5px;display:flex;margin-bottom:16px;border:1px solid #E8DCC4;">'
    +   tierTab('basic','Basic') + tierTab('premium','Premium ✦')
    + '</div>'

    + '<div style="position:relative;' + (preLaunch ? 'filter:blur(5px);pointer-events:none;user-select:none;' : '') + '">'
    +   renderCards()
    +   featureList()
    +   '<div style="text-align:center;margin-top:14px;font-size:10px;color:#7B6BA0;">🔒 Secure payment via Razorpay · Auto-renews on expiry · Cancel anytime</div>'
    + '</div>'

    + (preLaunch ? overlay() : '')

    + '</div>';

  if (preLaunch) startCountdown();
}

function tierTab(tier, label) {
  var on = SUB_TIER === tier;
  return '<button onclick="setTier(\''+tier+'\')" style="flex:1;padding:11px 4px;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;font-family:Cinzel,serif;letter-spacing:0.5px;'+(on?(tier==='premium'?'background:linear-gradient(135deg,#3B0764,#5B1A8F);color:#F5C842;':'background:#3B0764;color:#fff;'):'background:transparent;color:#3B0764;')+'">'+label+'</button>';
}

function setTier(t) { SUB_TIER = t; showSub(); }

function renderCards() {
  var plan = PLANS[SUB_TIER];
  var monthlyPrice = plan.cycles[0].price; // baseline for strike-through
  var cards = plan.cycles.map(function(c, i){
    var fullPrice = monthlyPrice * c.months;
    var hasDiscount = c.months > 1 && c.price < fullPrice;
    var discountPct = hasDiscount ? Math.round((1 - c.price/fullPrice) * 100) : 0;
    var isPremium = SUB_TIER === 'premium';
    var border = c.tag === 'TOP SELLER' ? '2.5px solid #D4A017' : (c.tag === 'BEST VALUE' ? '2.5px solid #3B0764' : '1.5px solid #E8DCC4');

    return ''
      + '<div style="background:#fff;border:'+border+';border-radius:14px;padding:14px 10px 12px;position:relative;text-align:center;'+(c.tag?'margin-top:12px;':'')+'">'
      +   (c.tag ? '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:'+(c.tag==='TOP SELLER'?'#D4A017':'#3B0764')+';color:#fff;padding:3px 10px;border-radius:10px;font-weight:800;font-size:9px;letter-spacing:0.5px;white-space:nowrap;">'+c.tag+'</div>' : '')

      +   '<div style="font-family:Cinzel,serif;font-size:14px;color:#3B0764;font-weight:600;margin-bottom:6px;">'+c.label+'</div>'

      +   (hasDiscount ? '<div style="color:#0a8754;font-weight:800;font-size:12px;margin-bottom:2px;">'+discountPct+'% off <span style="color:#999;text-decoration:line-through;font-weight:600;font-size:11px;margin-left:4px;">'+fmtINR(fullPrice)+'</span></div>' : '<div style="height:14px;"></div>')

      +   '<div style="font-family:Cinzel,serif;font-size:24px;font-weight:700;color:#3B0764;line-height:1;margin-bottom:4px;">'+fmtINR(c.price)+'</div>'

      +   '<div style="font-size:10px;color:#7B6BA0;margin-bottom:10px;">'+fmtINR(c.per)+' per month</div>'

      +   '<button onclick="choosePlan(\''+SUB_TIER+'\',\''+c.id+'\')" style="width:100%;background:'+(isPremium?'#F5C842':'#3B0764')+';color:'+(isPremium?'#3B0764':'#fff')+';border:none;border-radius:8px;padding:9px;font-weight:800;font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;">Continue</button>'
      + '</div>';
  }).join('');

  return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px;">'+cards+'</div>';
}

function featureList() {
  var plan = PLANS[SUB_TIER];
  var isPremium = SUB_TIER === 'premium';
  var feats = plan.features.map(function(f){
    var highlight = f.indexOf('⭐') === 0;
    return '<li style="padding:7px 0;font-size:13px;color:'+(isPremium?'#fff':'#3B0764')+';line-height:1.4;display:flex;gap:8px;'+(highlight?'background:rgba(245,200,66,0.18);margin:3px -6px;padding-left:6px;border-radius:6px;':'')+'"><span style="color:'+(isPremium?'#F5C842':'#D4A017')+';font-weight:700;flex-shrink:0;">✓</span><span>'+f.replace('⭐ ','')+'</span></li>';
  }).join('');

  var bg = isPremium ? 'background:linear-gradient(160deg,#3B0764,#5B1A8F);color:#fff;' : 'background:#fff;border:1.5px solid #E8DCC4;';

  return ''
    + '<div style="'+bg+'border-radius:14px;padding:16px 14px;">'
    +   '<div style="font-family:Cinzel,serif;font-size:14px;color:'+(isPremium?'#F5C842':'#3B0764')+';font-weight:700;margin-bottom:4px;letter-spacing:0.5px;">'+plan.name+' includes</div>'
    +   '<div style="font-family:EB Garamond,serif;font-style:italic;font-size:12px;color:'+(isPremium?'#F5C842':'#9B7BBA')+';opacity:0.9;margin-bottom:10px;">'+plan.tag+'</div>'
    +   '<ul style="list-style:none;padding:0;margin:0;">'+feats+'</ul>'
    + '</div>';
}

function overlay() {
  return ''
    + '<div style="position:absolute;top:200px;left:12px;right:12px;background:rgba(253,250,244,0.96);border:2px solid #D4A017;border-radius:14px;padding:22px 16px;text-align:center;box-shadow:0 6px 18px rgba(59,7,100,0.15);">'
    +   '<div style="font-size:36px;margin-bottom:6px;">🔒</div>'
    +   '<h3 style="font-family:Cinzel,serif;color:#3B0764;font-size:17px;margin:0 0 6px;">Plans unlock at launch</h3>'
    +   '<p style="font-family:EB Garamond,serif;font-style:italic;color:#5B1A8F;font-size:13px;margin:0 0 12px;">Founding members get Premium FREE for 1 week</p>'
    +   '<div style="background:#3B0764;color:#F5C842;padding:11px 14px;border-radius:10px;font-family:Cinzel,serif;font-size:19px;font-weight:700;margin-bottom:4px;" id="subCountdown">—</div>'
    +   '<div style="font-size:10px;color:#7B6BA0;letter-spacing:1px;">UNTIL 7 JUNE 2026</div>'
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

function choosePlan(tier, cycleId) {
  if (isPreLaunch()) { alert('Plans unlock on 7 June 2026. Founding members get Premium FREE for the first week!'); return; }
  var u = window.currentUser; if (!u) { alert('Please log in first'); return; }
  var cycle = PLANS[tier].cycles.find(function(c){ return c.id === cycleId; });
  if (!cycle) return;
  var options = {
    key: 'rzp_live_SausbldU6Vqpy0',
    amount: cycle.price * 100, currency: 'INR',
    name: 'Begin Forever',
    description: PLANS[tier].name + ' — ' + cycle.label,
    image: 'https://beginforever.github.io/beginforever-app/logo.png',
    handler: async function(response) {
      try {
        var exp = new Date(Date.now() + cycle.months*30*86400000).toISOString();
        await sb.from('subscriptions').insert({
          user_id: u.id, plan_type: cycleId, plan_tier: tier,
          amount_paid: cycle.price, razorpay_payment_id: response.razorpay_payment_id,
          status: 'active', expires_at: exp
        });
        await sb.from('profiles').update({
          is_premium: tier === 'premium', subscription_status: 'active',
          subscription_plan: tier + '_' + cycleId, subscription_expires_at: exp
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
window.setTier = setTier;
window.choosePlan = choosePlan;
window.showSubModal = showSubModal;
