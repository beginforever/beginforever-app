// Begin Forever — PWA Install v1
// 1. Detects Meta/Instagram/Facebook in-app browser → shows "Open in Chrome" banner
// 2. After registration OTP success → shows timed "Add to Home Screen" nudge
// 3. Handles Android (beforeinstallprompt) and iOS (manual steps)
// Drop this file as js/pwa-install.js and add <script src="js/pwa-install.js"></script>
// just before </body> in index.html

(function() {

  var ua = navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua);
  var isAndroid = /android/i.test(ua);
  var isInStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // ── Detect in-app browsers (Meta, Instagram, TikTok, Twitter, etc.)
  var isMetaIAB = /FBAN|FBAV|Instagram|FB_IAB|FBIOS|FBDV|MessengerLite|LinkedIn|Twitter|TikTok/i.test(ua);

  // Store deferred install prompt for Android
  var _deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    _deferredPrompt = e;
  });

  // ════════════════════════════════════════
  // 1. IN-APP BROWSER BANNER
  // Shows immediately if detected
  // ════════════════════════════════════════
  function showIABBanner() {
    if (isInStandalone) return; // Already installed
    if (!isMetaIAB) return;     // Not in IAB
    if (document.getElementById('bfIABBanner')) return; // Already showing

    var banner = document.createElement('div');
    banner.id = 'bfIABBanner';
    banner.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'right:0',
      'z-index:99999',
      'background:#1C0530',
      'border-bottom:2px solid #D4A017',
      'padding:12px 16px',
      'font-family:Nunito,sans-serif',
      'box-shadow:0 4px 24px rgba(0,0,0,.6)'
    ].join(';');

    var currentURL = encodeURIComponent(window.location.href);

    var inner = '';

    if (isIOS) {
      // iOS in IAB: can't deep-link to Safari easily, show instructions
      inner =
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<span style="font-size:22px;flex-shrink:0;">🔗</span>' +
          '<div style="flex:1;">' +
            '<p style="font-size:13px;font-weight:800;color:#F5C842;margin:0 0 2px;">Open in Safari for the best experience</p>' +
            '<p style="font-size:11px;color:rgba(255,255,255,.6);margin:0 0 8px;line-height:1.5;">Tap the <strong style="color:#fff;">⋯</strong> menu at the bottom → <strong style="color:#fff;">"Open in Safari"</strong></p>' +
            '<div style="display:flex;gap:6px;">' +
              '<button onclick="document.getElementById(\'bfIABBanner\').remove()" style="flex:1;padding:9px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:rgba(255,255,255,.5);font-size:12px;font-family:Nunito,sans-serif;cursor:pointer;">Continue here</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else {
      // Android in IAB: can deep-link to Chrome using intent://
      var intentUrl = 'intent://' + window.location.host + window.location.pathname + window.location.search + '#Intent;scheme=https;package=com.android.chrome;end';
      inner =
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<span style="font-size:22px;flex-shrink:0;">📲</span>' +
          '<div style="flex:1;">' +
            '<p style="font-size:13px;font-weight:800;color:#F5C842;margin:0 0 2px;">Open in Chrome to install the app</p>' +
            '<p style="font-size:11px;color:rgba(255,255,255,.6);margin:0 0 10px;line-height:1.5;">This browser can\'t install apps. Open in Chrome — it takes 2 seconds.</p>' +
            '<div style="display:flex;gap:6px;">' +
              '<a href="' + intentUrl + '" style="flex:2;display:block;padding:10px;background:linear-gradient(135deg,#D4A017,#F5C842);border-radius:8px;color:#1A0830;font-size:13px;font-weight:800;font-family:Nunito,sans-serif;text-decoration:none;text-align:center;">Open in Chrome ↗</a>' +
              '<button onclick="document.getElementById(\'bfIABBanner\').remove()" style="flex:1;padding:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:rgba(255,255,255,.5);font-size:12px;font-family:Nunito,sans-serif;cursor:pointer;">Skip</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    banner.innerHTML = inner;
    document.body.appendChild(banner);

    // Push page content down so banner doesn't cover login form
    document.body.style.paddingTop = (banner.offsetHeight + 4) + 'px';
  }

  // ════════════════════════════════════════
  // 2. POST-REGISTRATION A2HS NUDGE
  // Call window.showA2HSNudge() from auth.js
  // after OTP registration success
  // ════════════════════════════════════════
  window.showA2HSNudge = function() {
    if (isInStandalone) return;   // Already installed
    if (isMetaIAB) return;        // IAB banner handles this instead

    setTimeout(function() { _renderA2HSNudge(); }, 1200);
  };

  function _renderA2HSNudge() {
    if (document.getElementById('bfA2HSNudge')) return;

    var nudge = document.createElement('div');
    nudge.id = 'bfA2HSNudge';
    nudge.style.cssText = [
      'position:fixed',
      'bottom:0',
      'left:0',
      'right:0',
      'z-index:9998',
      'background:#1C0530',
      'border-top:2px solid rgba(212,160,23,.6)',
      'border-radius:20px 20px 0 0',
      'padding:20px 18px 32px',
      'font-family:Nunito,sans-serif',
      'box-shadow:0 -8px 40px rgba(0,0,0,.7)',
      'transform:translateY(100%)',
      'transition:transform .35s cubic-bezier(.32,1.2,.5,1)'
    ].join(';');

    var content = '';

    if (isIOS) {
      content =
        '<div style="text-align:center;">' +
          '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 16px;"></div>' +
          '<p style="font-size:22px;margin:0 0 6px;">✦</p>' +
          '<h3 style="font-family:Cinzel,serif;color:#F5C842;font-size:17px;margin:0 0 6px;">Add Begin Forever to your Home Screen</h3>' +
          '<p style="font-size:12px;color:rgba(255,255,255,.5);margin:0 0 20px;line-height:1.6;">Get instant access — no app store needed</p>' +
          '<div style="display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:20px;">' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<span style="background:rgba(212,160,23,.15);border:1px solid rgba(212,160,23,.4);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#F5C842;flex-shrink:0;">1</span>' +
              '<span style="font-size:13px;color:rgba(255,255,255,.8);">Tap <strong style="color:#fff;">Share</strong> <span style="font-size:15px;">⎙</span> at the bottom of Safari</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<span style="background:rgba(212,160,23,.15);border:1px solid rgba(212,160,23,.4);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#F5C842;flex-shrink:0;">2</span>' +
              '<span style="font-size:13px;color:rgba(255,255,255,.8);">Tap <strong style="color:#fff;">"Add to Home Screen"</strong></span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
              '<span style="background:rgba(212,160,23,.15);border:1px solid rgba(212,160,23,.4);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#F5C842;flex-shrink:0;">3</span>' +
              '<span style="font-size:13px;color:rgba(255,255,255,.8);">Tap <strong style="color:#fff;">"Add"</strong> — you\'re done ✦</span>' +
            '</div>' +
          '</div>' +
          '<button onclick="_dismissA2HS()" style="width:100%;padding:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:rgba(255,255,255,.4);font-size:13px;font-family:Nunito,sans-serif;cursor:pointer;">I\'ll do it later</button>' +
        '</div>';
    } else {
      // Android — use beforeinstallprompt if available
      content =
        '<div style="text-align:center;">' +
          '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 16px;"></div>' +
          '<p style="font-size:22px;margin:0 0 6px;">✦</p>' +
          '<h3 style="font-family:Cinzel,serif;color:#F5C842;font-size:17px;margin:0 0 6px;">Install Begin Forever</h3>' +
          '<p style="font-size:12px;color:rgba(255,255,255,.5);margin:0 0 20px;line-height:1.6;">Add to your home screen for instant access — works like a native app</p>' +
          '<button id="a2hsInstallBtn" onclick="_triggerA2HSInstall()" style="width:100%;padding:14px;background:linear-gradient(135deg,#D4A017,#F5C842);color:#1A0830;font-family:Cinzel,serif;font-size:14px;font-weight:700;border:none;border-radius:12px;cursor:pointer;margin-bottom:10px;">Add to Home Screen ✦</button>' +
          '<button onclick="_dismissA2HS()" style="width:100%;padding:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:rgba(255,255,255,.4);font-size:13px;font-family:Nunito,sans-serif;cursor:pointer;">I\'ll do it later</button>' +
        '</div>';
    }

    nudge.innerHTML = content;
    document.body.appendChild(nudge);

    // Slide up
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        nudge.style.transform = 'translateY(0)';
      });
    });
  }

  window._triggerA2HSInstall = function() {
    if (!_deferredPrompt) {
      // No prompt available — show manual fallback
      var btn = document.getElementById('a2hsInstallBtn');
      if (btn) {
        btn.textContent = 'Tap ⋯ menu → "Add to Home Screen"';
        btn.style.fontSize = '12px';
      }
      return;
    }
    _deferredPrompt.prompt();
    _deferredPrompt.userChoice.then(function(result) {
      _deferredPrompt = null;
      if (result.outcome === 'accepted') {
        _dismissA2HS();
      }
    });
  };

  window._dismissA2HS = function() {
    var nudge = document.getElementById('bfA2HSNudge');
    if (!nudge) return;
    nudge.style.transform = 'translateY(100%)';
    setTimeout(function() { if (nudge.parentNode) nudge.remove(); }, 350);
    // Remember dismissal for this session
    try { sessionStorage.setItem('bf_a2hs_dismissed', '1'); } catch(x) {}
  };

  // ── Init: show IAB banner on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showIABBanner);
  } else {
    showIABBanner();
  }

})();
