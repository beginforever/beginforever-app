// ═══════════════════════════════════════════════════════════════════
// Begin Forever — js/subscription.js
// Plan pricing toggle + Razorpay checkout
// Load AFTER js/config.js
// ═══════════════════════════════════════════════════════════════════

// Plan pricing (paise = ₹ × 100)
var PLAN_PRICES = {
  basic: {
    weekly:    { price: 399,  paise: 39900,  label: 'week'    },
    monthly:   { price: 799,  paise: 79900,  label: 'month'   },
    quarterly: { price: 1999, paise: 199900, label: '3 months'}
  },
  premium: {
    weekly:    { price: 699,  paise: 69900,  label: 'week'    },
    monthly:   { price: 1799, paise: 179900, label: 'month'   },
    quarterly: { price: 3999, paise: 399900, label: '3 months'}
  }
};

var currentPlanCycle = 'monthly';

function setPlanCycle(cycle) {
  currentPlanCycle = cycle;
  // Update toggle button styles
  ['Weekly','Monthly','Quarterly'].forEach(function(c){
    var b = document.getElementById('planCycle' + c);
    if (!b) return;
    if (c.toLowerCase() === cycle) {
      b.style.background = 'var(--gold)'; b.style.color = '#1a0a2e';
    } else {
      b.style.background = 'transparent'; b.style.color = 'var(--w70)';
    }
  });
  // Update prices
  var basic = PLAN_PRICES.basic[cycle];
  var premium = PLAN_PRICES.premium[cycle];
  var bp = document.getElementById('basicPrice');     if (bp) bp.textContent = basic.price;
  var bc = document.getElementById('basicCycle');     if (bc) bc.textContent = '/ ' + basic.label;
  var bw = document.getElementById('basicWindow');    if (bw) bw.textContent = basic.label;
  var pp = document.getElementById('premiumPrice');   if (pp) pp.textContent = premium.price;
  var pc = document.getElementById('premiumCycle');   if (pc) pc.textContent = '/ ' + premium.label;
}

// Show founder banner if user qualifies
function refreshFounderBanner() {
  var el = document.getElementById('planFounderBanner');
  if (!el) return;
  if (P && P.is_founding_member && new Date() < LAUNCH) {
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

// Hook into tab switch to refresh banner when plans tab opens
(function(){
  var origGoTab = window.goTab;
  if (typeof origGoTab === 'function') {
    window.goTab = function(t) {
      origGoTab(t);
      if (t === 'plans') {
        refreshFounderBanner();
        setPlanCycle(currentPlanCycle); // ensure prices render
      }
    };
  }
})();

function subscribe(planKey) {
  if (!P || !U) { alert('Please sign in first.'); return; }
  var cycle = currentPlanCycle;
  var plan = PLAN_PRICES[planKey][cycle];
  var planLabel = planKey.charAt(0).toUpperCase() + planKey.slice(1) + ' · ' + cycle.charAt(0).toUpperCase() + cycle.slice(1);

  // Pre-launch: show notice instead of charging
  if (new Date() < LAUNCH) {
    var founderMsg = (P.is_founding_member)
      ? '\n\nAs a founding member, you also get Premium FREE for 1 week at launch.'
      : '';
    alert('Subscriptions open at launch on 7 June 2026.' + founderMsg + '\n\nYou can subscribe from this screen the moment we go live.');
    return;
  }

  // Live flow: Razorpay
  if (typeof Razorpay === 'undefined') {
    alert('Payment unavailable. Please refresh and try again.');
    return;
  }
  var options = {
    key: 'rzp_live_SausbldU6Vqpy0',
    amount: plan.paise,
    currency: 'INR',
    name: 'Begin Forever',
    description: planLabel,
    image: '/logo.png',
    prefill: {
      name: P.full_name || '',
      email: P.email || '',
      contact: P.phone || ''
    },
    theme: { color: '#3B0764' },
    handler: async function(response) {
      try {
        var until = new Date();
        if (cycle === 'weekly')    until.setDate(until.getDate() + 7);
        if (cycle === 'monthly')   until.setMonth(until.getMonth() + 1);
        if (cycle === 'quarterly') until.setMonth(until.getMonth() + 3);
        await sb.from('profiles').update({
          plan: planKey,
          plan_cycle: cycle,
          plan_until: until.toISOString(),
          razorpay_payment_id: response.razorpay_payment_id
        }).eq('id', U.id);
        alert('Payment successful! ' + planLabel + ' active.');
        if (typeof loadP === 'function') await loadP();
      } catch(e) {
        alert('Payment received. We are activating your plan — please refresh in 30 seconds.');
      }
    },
    modal: {
      ondismiss: function() { /* user closed checkout */ }
    }
  };
  var rzp = new Razorpay(options);
  rzp.open();
}
