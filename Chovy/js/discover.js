/**
 * Chovy Discover View - Demo entry + trending
 */

const ChovyDiscover = (() => {
  function init() {
    setupDemoEntry();
    renderTrending();
  }

  function setupDemoEntry() {
    const card = document.getElementById('demoCard');
    if (card) {
      card.addEventListener('click', () => {
        ChovyHome.startAnalysis('v001');
      });
    }
  }

  function renderTrending() {
    const list = document.getElementById('trendingList');
    if (!list) return;

    const trending = [
      { icon: 'auto_awesome', name: '口红热门口碑榜', meta: '12.8万人在用', videoId: 'v001' },
      { icon: 'palette', name: '粉底液真实测评', meta: '8.3万人在用', videoId: 'v002' },
      { icon: 'science', name: '护肤品成分解析', meta: '5.6万人在用', videoId: 'v003' },
      { icon: 'build', name: '美妆工具推荐', meta: '3.2万人在用', videoId: 'v004' },
    ];

    list.innerHTML = trending.map(t => `
      <div class="trending-item" data-video-id="${t.videoId}">
        <div class="trending-icon"><span class="material-icons-outlined">${t.icon}</span></div>
        <div class="trending-info">
          <div class="trending-name">${t.name}</div>
          <div class="trending-meta">${t.meta}</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.trending-item').forEach(item => {
      item.addEventListener('click', () => {
        ChovyHome.startAnalysis(item.dataset.videoId);
      });
    });
  }

  return { init };
})();
