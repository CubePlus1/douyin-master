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

  ChovyRouter.register('/arena', () => {
    ChovyArena.startArena();
  });

  ChovyRouter.register('/result', () => {
    ChovyResult.showResult();
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
