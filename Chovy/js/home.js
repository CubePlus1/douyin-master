/**
 * Chovy Home View - 微信列表风格
 */

const ChovyHome = (() => {
  let videos = [];
  let allVideos = [];
  let selectedCategory = 'lipstick';

  async function init() {
    await loadVideos();
    renderQuickList();
    renderHistory();
    setupEvents();
  }

  async function loadVideos() {
    try {
      const resp = await fetch('/api/videos');
      const data = await resp.json();
      allVideos = data.videos;
      videos = allVideos;
    } catch (e) {
      console.error('Failed to load videos:', e);
      allVideos = getFallbackVideos();
      videos = allVideos;
    }
  }

  function getFallbackVideos() {
    return [
      { id: 'v001', title: '2024年度口红榜单！这5支闭眼入不出错', author: '美妆师小鱼', platform: '抖音', likes: '23.6万', category: 'lipstick' },
      { id: 'v002', title: '黄皮显白口红合集！这几支素颜也能涂', author: '成分党Lisa', platform: '抖音', likes: '15.8万', category: 'lipstick' },
      { id: 'v003', title: '阿玛尼vs迪奥vsYSL 大牌口红到底谁更值？', author: '毛蛋MAODAN', platform: '抖音', likes: '67.3万', category: 'lipstick' },
      { id: 'v009', title: '6款粉底液大横评！油皮干皮各有推荐', author: '美妆师小鱼', platform: '抖音', likes: '45.2万', category: 'foundation' }
    ];
  }

  function renderQuickList() {
    const el = document.getElementById('videoQuickList');
    if (!el) return;

    const list = videos.slice(0, 4);
    el.innerHTML = list.map(v => `
      <div class="quick-item" data-video-id="${v.id}">
        <div class="quick-item-icon">
          <span class="material-icons-outlined">play_circle</span>
        </div>
        <div class="quick-item-text">
          <div class="quick-item-title">${v.title}</div>
          <div class="quick-item-meta">${v.author} · ${v.platform} · ${v.likes}</div>
        </div>
      </div>
    `).join('');

    el.querySelectorAll('.quick-item').forEach(item => {
      item.addEventListener('click', () => {
        const vid = item.dataset.videoId;
        startAnalysis(vid);
      });
    });
  }

  function renderHistory() {
    const section = document.getElementById('historySection');
    const list = document.getElementById('historyList');
    if (!section || !list) return;

    const history = ChovyStorage.getSessionHistory();
    if (history.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';
    list.innerHTML = history.slice(0, 5).map(s => {
      const time = formatTime(s.timestamp);
      return `
        <div class="history-item">
          <div class="history-item-icon"><span class="material-icons-outlined">history</span></div>
          <div class="history-item-info">
            <div class="history-item-name">${s.champion_name || '冠军产品'}</div>
            <div class="history-item-time">${time}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setupEvents() {
    const btn = document.getElementById('daoDunBtn');

    if (btn) {
      btn.addEventListener('click', () => {
        if (videos.length > 0) {
          // Pick a random video for high variety and fun!
          const randomIndex = Math.floor(Math.random() * videos.length);
          startAnalysis(videos[randomIndex].id);
        }
      });
    }
  }

  function startAnalysis(videoId, sourceUrl) {
    // Find the video in allVideos to get its category dynamically
    const video = allVideos.find(v => v.id === videoId);
    if (video && video.category) {
      ChovyAppState.set('selectedCategory', video.category);
    } else {
      ChovyAppState.set('selectedCategory', 'lipstick');
    }
    ChovyAppState.set('currentVideoId', videoId);
    ChovyAppState.set('sourceUrl', sourceUrl || '');
    ChovyRouter.navigate('/thinking');
  }

  function formatTime(timestamp) {
    const d = new Date(timestamp * 1000);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    return Math.floor(diff / 86400) + '天前';
  }

  return { init, renderHistory, startAnalysis };
})();
