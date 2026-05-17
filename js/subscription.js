// Begin Forever — Subscription v9 (aligned heights, gold buttons)
var SUB_CYCLE = 'monthly';

var PLANS = {
  basic: {
    name: 'Basic',
    tag: 'Get started on your journey',
    monthly:    { price: 499,  per: '/month' },
    quarterly:  { price: 1299, per: '/3 months', save: '13% off' },
    halfyearly: { price: 2199, per: '/6 months', save: '27% off' },
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
    monthly:    { price: 899,  per: '/month' },
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
  var d=Math.floor(ms/86400000), h=Math.floor((ms%86400000)/3600000), m=Math.floor((ms%3600000)/60000);
  return d+'d '+h+'h '+m+'m';
}

function showSub() {
  var profile = P || window.currentProfile || {};
  var isFounding = profile.is_founding_member === true;
  var preLaunch = isPreLaunch();

  // Hide all content tabs, show tPlans
  var allTabs = ['tHome','tBrowse','tInterests','tChat','tViews','tProfile','tPlans','tReviews','tAdmin'];
  allTabs.forEach(function(x){
    var el = document.getElementById(x);
    if (el) el.style.display = 'none';
  });

  // Make sure mainApp is visible
  var ma = document.getElementById('mainApp');
  if (ma) { ma.style.display = 'block'; }

  var planTab = document.getElementById('tPlans');
  if (!planTab) {
    // Fallback: goTab profile if tPlans missing
    if (typeof goTab === 'function') goTab('profile');
    return;
  }
  planTab.style.display = 'block';

  // Remove active from all tab buttons
  document.querySelectorAll('.tab-btn').forEach(function(b){ b.classList.remove('active'); });

  planTab.innerHTML = ''
    + '<div style="padding:14px 12px 100px;font-family:Nunito,sans-serif;">'

    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">'
    +   '<button onclick="goTab('home')" style="background:none;border:none;font-size:24px;color:var(--gold-bright);cursor:pointer;padding:4px;">←</button>'
    +   '<h2 style="font-family:Cinzel,serif;color:var(--gold-bright);margin:0;font-size:18px;letter-spacing:1px;">Subscription</h2>'
    + '</div>'

    + '<div style="text-align:center;margin-bottom:14px;">'
    +   '<p style="font-family:EB Garamond,serif;font-style:italic;color:var(--w60);margin:0;font-size:13px;">Choose your path to forever</p>'
    + '</div>'

    + (isFounding ? '<div style="background:linear-gradient(135deg,rgba(232,184,48,.12),rgba(123,31,162,.12));border:1px solid rgba(232,184,48,.3);border-radius:14px;padding:14px;margin-bottom:16px;text-align:center;"><p style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">✦ Founding Member #'+(profile.founding_number||'—')+'</p><p style="font-size:13px;color:#fff;margin:0;line-height:1.5;">You get <strong style="color:var(--gold-bright)">Premium free for 1 week</strong> automatically at launch.</p></div>' : '')

    + '<div style="background:var(--w05);border-radius:14px;padding:4px;display:flex;margin-bottom:14px;border:1px solid var(--w10);">'
    +   tab('monthly','Monthly') + tab('quarterly','3 Months') + tab('halfyearly','6 Months')
    + '</div>'

    + '<div style="position:relative;' + (preLaunch ? 'filter:blur(5px);pointer-events:none;user-select:none;' : '') + '">'
    +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:stretch;">'
    +     basicCard() + premiumCard()
    +   '</div>'
    +   '<div style="text-align:center;margin-top:14px;font-size:10px;color:var(--w40);">🔒 Secure payment via Razorpay · Cancel anytime</div>'
    + '</div>'

    + (preLaunch ? overlay() : '')

    + '</div>';

  if (preLaunch) startCountdown();
}

function tab(cycle, label) {
  var on = SUB_CYCLE === cycle;
  return '<button onclick="setCycle(''+cycle+'')" style="flex:1;padding:9px 4px;border:none;border-radius:7px;cursor:pointer;font-weight:700;font-size:12px;font-family:Nunito,sans-serif;'+(on?'background:var(--gold);color:#1a0a2e;':'background:transparent;color:var(--w70);')+'">'+label+'</button>';
}

function setCycle(c) { SUB_CYCLE = c; showSub(); }

function basicCard() {
  var c = PLANS.basic[SUB_CYCLE];
  var feats = PLANS.basic.features.map(function(f){
    return '<li style="padding:5px 0;font-size:11px;color:var(--w70);line-height:1.4;display:flex;gap:5px;"><span style="color:var(--gold);flex-shrink:0;">✓</span><span>'+f+'</span></li>';
  }).join('');
  return ''
    + '<div style="background:var(--w05);border:1.5px solid var(--w10);border-radius:14px;padding:14px 10px;display:flex;flex-direction:column;">'
    +   '<div style="text-align:center;border-bottom:1px solid var(--w10);padding-bottom:10px;margin-bottom:10px;">'
    +     '<div style="font-family:Cinzel,serif;font-size:15px;color:#fff;font-weight:600;">BASIC</div>'
    +     '<div style="font-family:EB Garamond,serif;font-style:italic;color:var(--w50);font-size:10px;margin:2px 0 4px;">'+PLANS.basic.tag+'</div>'
    +     '<div style="font-family:Cinzel,serif;font-size:22px;font-weight:700;color:#fff;">₹'+c.price.toLocaleString('en-IN')+'</div>'
    +     '<div style="font-size:10px;color:var(--w50);">'+c.per+'</div>'
    +     (c.save ? '<div style="display:inline-block;background:rgba(212,160,23,.15);color:var(--gold);padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">'+c.save+'</div>' : '')
    +   '</div>'
    +   '<ul style="list-style:none;padding:0;margin:0;flex:1;">'+feats+'</ul>'
    +   '<button onclick="choosePlan('basic')" style="width:100%;margin-top:12px;background:linear-gradient(135deg,var(--gold),var(--gold-bright));color:#1a0a2e;border:none;border-radius:8px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;">Choose Basic</button>'
    + '</div>';
}

function premiumCard() {
  var c = PLANS.premium[SUB_CYCLE];
  var feats = PLANS.premium.features.map(function(f){
    var highlight = f.indexOf('⭐') === 0;
    return '<li style="padding:5px 0;font-size:11px;color:#fff;line-height:1.4;display:flex;gap:5px;'+(highlight?'background:rgba(245,200,66,0.15);margin:2px -3px;padding-left:5px;border-radius:4px;':'')+'"><span style="color:#F5C842;flex-shrink:0;">✓</span><span>'+f.replace('⭐ ','')+'</span></li>';
  }).join('');
  return ''
    + '<div style="background:linear-gradient(160deg,#2d1655,#3B0764);border:1.5px solid rgba(212,160,23,.5);border-radius:14px;padding:14px 10px;color:#fff;position:relative;box-shadow:0 4px 12px rgba(59,7,100,0.25);display:flex;flex-direction:column;">'
    +   '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--gold);color:#1a0a2e;padding:3px 10px;border-radius:10px;font-weight:800;font-size:9px;letter-spacing:0.5px;white-space:nowrap;">★ RECOMMENDED</div>'
    +   '<div style="text-align:center;border-bottom:1px solid rgba(245,200,66,0.3);padding-bottom:10px;margin-bottom:10px;padding-top:4px;">'
    +     '<div style="font-family:Cinzel,serif;font-size:15px;color:var(--gold-bright);font-weight:600;">'+PLANS.premium.name+'</div>'
    +     '<div style="font-family:EB Garamond,serif;font-style:italic;color:var(--gold-bright);opacity:0.8;font-size:10px;margin:2px 0 4px;">'+PLANS.premium.tag+'</div>'
    +     '<div style="font-family:Cinzel,serif;font-size:22px;font-weight:700;color:var(--gold-bright);">₹'+c.price.toLocaleString('en-IN')+'</div>'
    +     '<div style="font-size:10px;color:var(--gold-bright);opacity:0.85;">'+c.per+'</div>'
    +     (c.save ? '<div style="display:inline-block;background:var(--gold);color:#1A0830;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:700;margin-top:5px;">'+c.save+'</div>' : '')
    +   '</div>'
    +   '<ul style="list-style:none;padding:0;margin:0;flex:1;">'+feats+'</ul>'
    +   '<button onclick="choosePlan('premium')" style="width:100%;margin-top:12px;background:linear-gradient(135deg,var(--gold),var(--gold-bright));color:#1A0830;border:none;border-radius:8px;padding:11px;font-weight:800;font-size:12px;cursor:pointer;font-family:Nunito,sans-serif;">Choose Premium ✦</button>'
    + '</div>';
}

function overlay() {
  return ''
    + '<div style="position:absolute;top:180px;left:12px;right:12px;background:rgba(13,1,24,.92);border:1.5px solid rgba(212,160,23,.4);border-radius:14px;padding:22px 16px;text-align:center;box-shadow:0 6px 18px rgba(59,7,100,0.3);backdrop-filter:blur(4px);">'
    +   '<div style="font-size:36px;margin-bottom:6px;">🔒</div>'
    +   '<h3 style="font-family:Cinzel,serif;color:#fff;font-size:17px;margin:0 0 6px;">Plans unlock at launch</h3>'
    +   '<p style="font-family:EB Garamond,serif;font-style:italic;color:var(--gold);font-size:13px;margin:0 0 12px;">Founding members get Premium FREE for 1 week</p>'
    +   '<div style="background:#3B0764;color:var(--gold2);padding:11px 14px;border-radius:10px;font-family:Cinzel,serif;font-size:19px;font-weight:700;margin-bottom:4px;" id="subCountdown">—</div>'
    +   '<div style="font-size:10px;color:var(--w40);letter-spacing:1px;">UNTIL 7 JUNE 2026</div>'
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
  var u = U; if (!u) { alert('Please log in first'); return; }
  var p = PLANS[tier][SUB_CYCLE];
  var cycleLabel = {monthly:'Monthly',quarterly:'3 Months',halfyearly:'6 Months'}[SUB_CYCLE]||SUB_CYCLE;
  var planLabel = (tier==='premium'?'Premium ✦':'Basic') + ' · ' + cycleLabel;
  var options = {
    key: 'rzp_live_SausbldU6Vqpy0',
    amount: p.price * 100, currency: 'INR',
    name: 'Begin Forever',
    description: planLabel,
    image: 'https://beginforever.github.io/beginforever-app/logo.png',
    handler: async function(response) {
      try {
        var months = SUB_CYCLE === 'monthly' ? 1 : (SUB_CYCLE === 'quarterly' ? 3 : 6);
        var exp = new Date(Date.now() + months*30*86400000).toISOString();
        await sb.from('subscriptions').insert({
          user_id: u.id, plan_type: SUB_CYCLE, plan_tier: tier,
          amount_paid: p.price, razorpay_payment_id: response.razorpay_payment_id,
          status: 'active', expires_at: exp
        });
        await sb.from('profiles').update({
          is_premium: tier === 'premium', subscription_status: 'active',
          subscription_plan: tier + '_' + SUB_CYCLE, subscription_expires_at: exp
        }).eq('id', u.id);
        alert('🎉 ' + planLabel + ' activated!');
        window.location.reload();
      } catch (e) {
        alert('Payment received but activation failed. Contact info@beginforever.in');
      }
    },
    prefill: {
      name: P ? P.full_name : '',
      email: P ? P.email : '',
      contact: P ? P.phone : ''
    },
    theme: { color: '#3B0764' }
  };
  new Razorpay(options).open();
}

function showSubModal(featureName) {
  var profile = P || {};
  if (profile.is_founding_member || profile.is_premium) return false;
  var msg = featureName ? '"'+featureName+'" is a Premium feature.\n\nUpgrade to unlock it.' : 'Upgrade to Premium to unlock this feature.';
  if (confirm(msg + '\n\nView subscription plans?')) showSub();
  return true;
}

window.showSub = showSub;
window.setCycle = setCycle;
window.choosePlan = choosePlan;
window.showSubModal = showSubModal;
