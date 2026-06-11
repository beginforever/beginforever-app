// Begin Forever — PWA Install v2
// Fix: A2HS nudge shows automatically in Chrome (not just post-registration)
// Fix: beforeinstallprompt captured reliably, nudge shown after 3s in Chrome

(function() {

  var ua = navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua);
  var isAndroid = /android/i.test(ua);
  var isInStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  var isMetaIAB = /FBAN|FBAV|Instagram|FB_IAB|FBIOS|FBDV|MessengerLite|LinkedIn|Twitter|TikTok/i.test(ua);
  var isChrome = /Chrome/i.test(ua) && !/Chromium|Edge/i.test(ua);

  var _deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    _deferredPrompt = e;
    // Auto-show nudge after 3s if user hasn't dismissed before
    try { if (sessionStorage.getItem('bf_a2hs_dismissed')) return; } catch(x) {}
    setTimeout(function() { _renderA2HSNudge(); }, 3000);
  });

  // Also listen for appinstalled to clean up
  window.addEventListener('appinstalled', function() {
    _deferredPrompt = null;
    var nudge = document.getElementById('bfA2HSNudge');
    if (nudge) nudge.remove();
  });

  // ── IN-APP BROWSER BANNER
  function showIABBanner() {
    if (isInStandalone) return;
    if (!isMetaIAB) return;
    if (document.getElementById('bfIABBanner')) return;

    var banner = document.createElement('div');
    banner.id = 'bfIABBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#1C0530;border-bottom:2px solid #9B30C9;padding:12px 16px;font-family:Nunito,sans-serif;box-shadow:0 4px 24px rgba(0,0,0,.6)';

    var inner = '';
    if (isIOS) {
      inner =
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<span style="font-size:22px;flex-shrink:0;">🔗</span>' +
          '<div style="flex:1;">' +
            '<p style="font-size:13px;font-weight:800;color:#C13DBF;margin:0 0 2px;">Open in Safari to install the app</p>' +
            '<p style="font-size:11px;color:rgba(255,255,255,.6);margin:0 0 8px;line-height:1.5;">Tap <strong style="color:#fff;">⋯</strong> menu → <strong style="color:#fff;">"Open in Safari"</strong></p>' +
            '<button onclick="document.getElementById(\'bfIABBanner\').remove();document.body.style.paddingTop=\'\';" style="padding:9px 16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:rgba(255,255,255,.5);font-size:12px;font-family:Nunito,sans-serif;cursor:pointer;">Continue here</button>' +
          '</div>' +
        '</div>';
    } else {
      var intentUrl = 'intent://' + window.location.host + window.location.pathname + window.location.search + '#Intent;scheme=https;package=com.android.chrome;end';
      inner =
        '<div style="display:flex;align-items:flex-start;gap:12px;">' +
          '<span style="font-size:22px;flex-shrink:0;">📲</span>' +
          '<div style="flex:1;">' +
            '<p style="font-size:13px;font-weight:800;color:#C13DBF;margin:0 0 2px;">Open in Chrome to install the app</p>' +
            '<p style="font-size:11px;color:rgba(255,255,255,.6);margin:0 0 10px;line-height:1.5;">This browser cannot install apps. Open in Chrome — takes 2 seconds.</p>' +
            '<div style="display:flex;gap:6px;">' +
              '<a href="' + intentUrl + '" style="flex:2;display:block;padding:10px;background:linear-gradient(135deg,#F24E96,#9B30C9);border-radius:8px;color:#FFFFFF;font-size:13px;font-weight:800;font-family:Nunito,sans-serif;text-decoration:none;text-align:center;">Open in Chrome ↗</a>' +
              '<button onclick="document.getElementById(\'bfIABBanner\').remove();document.body.style.paddingTop=\'\';" style="flex:1;padding:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:rgba(255,255,255,.5);font-size:12px;font-family:Nunito,sans-serif;cursor:pointer;">Skip</button>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    banner.innerHTML = inner;
    document.body.appendChild(banner);
    document.body.style.paddingTop = (banner.offsetHeight + 4) + 'px';
  }

  // ── A2HS NUDGE (Android Chrome + iOS Safari)
  function _renderA2HSNudge() {
    if (isInStandalone) return;
    if (isMetaIAB) return;
    if (document.getElementById('bfA2HSNudge')) return;
    try { if (sessionStorage.getItem('bf_a2hs_dismissed')) return; } catch(x) {}

    // iOS Safari: show if in Safari (not IAB)
    var showForIOS = isIOS && !isMetaIAB;
    // Android: only show if we have the prompt OR it's Chrome
    var showForAndroid = isAndroid && (_deferredPrompt || isChrome);

    if (!showForIOS && !showForAndroid) return;

    var nudge = document.createElement('div');
    nudge.id = 'bfA2HSNudge';
    nudge.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#1C0530;border-top:2px solid rgba(155,48,201,.6);border-radius:20px 20px 0 0;padding:20px 18px 32px;font-family:Nunito,sans-serif;box-shadow:0 -8px 40px rgba(0,0,0,.7);transform:translateY(100%);transition:transform .35s cubic-bezier(.32,1.2,.5,1)';

    var content = '';

    if (isIOS) {
      content =
        '<div style="text-align:center;">' +
          '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 16px;"></div>' +
          '<p style="font-size:22px;margin:0 0 6px;">✦</p>' +
          '<h3 style="font-family:Cinzel,serif;color:#C13DBF;font-size:17px;margin:0 0 6px;">Add Begin Forever to Home Screen</h3>' +
          '<p style="font-size:12px;color:rgba(255,255,255,.5);margin:0 0 20px;line-height:1.6;">Get instant access — no App Store needed</p>' +
          '<div style="display:flex;flex-direction:column;gap:10px;text-align:left;margin-bottom:20px;">' +
            '<div style="display:flex;align-items:center;gap:12px;"><span style="background:rgba(155,48,201,.15);border:1px solid rgba(155,48,201,.4);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#C13DBF;flex-shrink:0;">1</span><span style="font-size:13px;color:rgba(255,255,255,.8);">Tap <strong style="color:#fff;">Share ⎙</strong> at the bottom of Safari</span></div>' +
            '<div style="display:flex;align-items:center;gap:12px;"><span style="background:rgba(155,48,201,.15);border:1px solid rgba(155,48,201,.4);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#C13DBF;flex-shrink:0;">2</span><span style="font-size:13px;color:rgba(255,255,255,.8);">Tap <strong style="color:#fff;">"Add to Home Screen"</strong></span></div>' +
            '<div style="display:flex;align-items:center;gap:12px;"><span style="background:rgba(155,48,201,.15);border:1px solid rgba(155,48,201,.4);border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#C13DBF;flex-shrink:0;">3</span><span style="font-size:13px;color:rgba(255,255,255,.8);">Tap <strong style="color:#fff;">"Add"</strong> — done ✦</span></div>' +
          '</div>' +
          '<button onclick="_dismissA2HS()" style="width:100%;padding:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:rgba(255,255,255,.4);font-size:13px;font-family:Nunito,sans-serif;cursor:pointer;">Maybe later</button>' +
        '</div>';
    } else {
      content =
        '<div style="text-align:center;">' +
          '<div style="width:40px;height:4px;background:rgba(255,255,255,.15);border-radius:2px;margin:0 auto 16px;"></div>' +
          '<p style="font-size:22px;margin:0 0 6px;">✦</p>' +
          '<h3 style="font-family:Cinzel,serif;color:#C13DBF;font-size:17px;margin:0 0 6px;">Install Begin Forever</h3>' +
          '<p style="font-size:12px;color:rgba(255,255,255,.5);margin:0 0 20px;line-height:1.6;">Add to your home screen for instant access — works like a native app</p>' +
          '<button id="a2hsInstallBtn" onclick="_triggerA2HSInstall()" style="width:100%;padding:14px;background:linear-gradient(135deg,#F24E96,#9B30C9);color:#FFFFFF;font-family:Cinzel,serif;font-size:15px;font-weight:700;border:none;border-radius:12px;cursor:pointer;margin-bottom:10px;">📲 Add to Home Screen</button>' +
          '<button onclick="_dismissA2HS()" style="width:100%;padding:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:rgba(255,255,255,.4);font-size:13px;font-family:Nunito,sans-serif;cursor:pointer;">Maybe later</button>' +
        '</div>';
    }

    nudge.innerHTML = content;
    document.body.appendChild(nudge);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { nudge.style.transform = 'translateY(0)'; });
    });
  }

  window._triggerA2HSInstall = function() {
    if (_deferredPrompt) {
      _deferredPrompt.prompt();
      _deferredPrompt.userChoice.then(function(result) {
        _deferredPrompt = null;
        if (result.outcome === 'accepted') _dismissA2HS();
      });
    } else {
      // Prompt not available — show manual instructions
      var btn = document.getElementById('a2hsInstallBtn');
      if (btn) {
        btn.innerHTML = 'Tap <strong>⋮</strong> menu → <strong>"Add to Home Screen"</strong>';
        btn.style.fontSize = '12px';
        btn.onclick = null;
      }
    }
  };

  window._dismissA2HS = function() {
    var nudge = document.getElementById('bfA2HSNudge');
    if (!nudge) return;
    nudge.style.transform = 'translateY(100%)';
    setTimeout(function() { if (nudge.parentNode) nudge.remove(); }, 350);
    try { sessionStorage.setItem('bf_a2hs_dismissed', '1'); } catch(x) {}
  };

  // Post-registration nudge (called from auth.js)
  window.showA2HSNudge = function() {
    if (isInStandalone) return;
    if (isMetaIAB) return;
    try { sessionStorage.removeItem('bf_a2hs_dismissed'); } catch(x) {} // Always show post-registration
    setTimeout(function() { _renderA2HSNudge(); }, 1500);
  };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showIABBanner);
  } else {
    showIABBanner();
  }

  // iOS: show A2HS nudge after 5s on first visit (Safari only)
  if (isIOS && !isInStandalone && !isMetaIAB) {
    try {
      if (!sessionStorage.getItem('bf_a2hs_dismissed')) {
        setTimeout(function() { _renderA2HSNudge(); }, 5000);
      }
    } catch(x) {}
  }

})();
