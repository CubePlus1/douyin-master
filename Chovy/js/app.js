/**
 * Chovy SPA Orchestrator - app.js
 * Global state, route registration, view lifecycle, and phone time ticks
 */

// Global app state
const ChovyAppState = (() => {
  const state = {};

  function set(key, value) {
    state[key] = value;
  }

  function get(key) {
    return state[key];
  }

  function clear() {
    Object.keys(state).forEach(k => delete state[k]);
  }

  return { set, get, clear };
})();

// App initialization
(function () {
  // Register routes
  ChovyRouter.register('/home', () => {
    ChovyHome.renderHistory();
  });



  ChovyRouter.register('/thinking', () => {
    const videoId = ChovyAppState.get('currentVideoId');
    if (videoId) {
      ChovyThinking.startThinking(videoId);
    } else {
      ChovyRouter.navigate('/home');
    }
  });

  ChovyRouter.register('/comic', () => {
    ChovyArena.startArena();
  });

  ChovyRouter.register('/discover', () => {
    // Discover view is static, no dynamic loading needed
  });

  ChovyRouter.register('/my', () => {
    ChovyProfile.showProfile();
  });

  // Initialize all modules
  ChovyHome.init();

  ChovyThinking.init();
  ChovyArena.init();
  ChovyResult.init();
  ChovyDiscover.init();
  ChovyProfile.init();

  // Start ticking clock for iPhone Status Bar
  setupPhoneClock();

  // Start router
  ChovyRouter.init();
})();

// Setup dynamic ticking clock for the iPhone frame
function setupPhoneClock() {
  const timeEl = document.getElementById('phoneTime');
  if (!timeEl) return;

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();

    // Zero padding
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;

    timeEl.textContent = `${hours}:${minutes}`;
  }

  updateClock();
  setInterval(updateClock, 30000); // refresh every 30 seconds
}

// ─── Global Retro 8-bit Button Click Sound Engine ──────────────────
(function() {
  let ctx = null;

  function initCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playClickSound(isDanger = false) {
    try {
      initCtx();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isDanger) {
        // Deeper warning chiptune buzz for negative actions (like clear data)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        // Crisp, clean high-end retro click blip
        osc.type = 'square';
        const startFreq = 780 + Math.random() * 200; // organic chiptune randomness
        osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 1.35, ctx.currentTime + 0.035);
        gain.gain.setValueAtTime(0.012, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.035);
      }
    } catch (e) {
      console.warn('Retro click audio failed:', e);
    }
  }

  // Bind click event globally to document body (highly robust event delegation)
  document.addEventListener('click', (e) => {
    const target = e.target;
    // Match any interactive buttons, tabs, pills, cards, history items or custom click handlers
    const clickable = target.closest('button, .btn, .btn-primary, .btn-secondary, .btn-danger, .link-submit-btn, .tab-item, .cat-pill, .product-card, .demo-card, .history-item, .trending-list, .goods, [onclick]');
    
    if (clickable) {
      const isDanger = clickable.classList.contains('btn-danger') || clickable.id === 'clearDataBtn';
      playClickSound(isDanger);
    }
  }, { passive: true });
})();
