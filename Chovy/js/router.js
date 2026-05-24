/**
 * Chovy SPA Router - Hash-based routing
 */

const ChovyRouter = (() => {
  const routes = {};
  let currentView = null;
  let beforeNavigate = null;

  function register(path, handler) {
    routes[path] = handler;
  }

  function setBeforeNavigate(fn) {
    beforeNavigate = fn;
  }

  function navigate(path) {
    if (beforeNavigate) {
      const ok = beforeNavigate(path, currentView);
      if (ok === false) return;
    }
    window.location.hash = path;
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1) || '/home';
    const viewId = hash.replace('/', '');

    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
      v.classList.remove('view-active');
    });

    // Show target view
    const target = document.getElementById(`view-${viewId}`);
    if (target) {
      target.classList.add('view-active');
    }

    // Update tab bar
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.classList.toggle('tab-active', tab.dataset.view === viewId);
    });

    // Show/hide tab bar (hide during comic)
    const tabBar = document.getElementById('tabBar');
    if (tabBar) {
      tabBar.style.display = (viewId === 'comic' || viewId === 'thinking') ? 'none' : '';
    }

    // Scroll phone content to top on view change
    const content = document.querySelector('.phone-content');
    if (content) {
      content.scrollTop = 0;
    }

    // Call route handler
    if (routes[hash]) {
      routes[hash]();
    }

    currentView = hash;
  }

  function init() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
  }

  function getCurrentView() {
    return currentView;
  }

  return { register, navigate, init, getCurrentView, setBeforeNavigate };
})();
