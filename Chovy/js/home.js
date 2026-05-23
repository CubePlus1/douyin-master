/**
 * Chovy Home View - 微信列表风格
 */

const ChovyHome = (() => {
  let videos = [];
  let allVideos = [];
  let selectedCategory = 'lipstick';

  async function init() {
    await loadVideos();
    setupCategoryPills();
    renderQuickList();
    renderHistory();
    setupEvents();
  }

  async function loadVideos() {
    try {
      const resp = await fetch('/api/videos');
      const data = await resp.json();
      allVideos = data.videos;
      videos = allVideos.filter(v => v.category === selectedCategory);
    } catch (e) {
      console.error('Failed to load videos:', e);
      allVideos = getFallbackVideos();
      videos = allVideos;
    }
  }

  function setupCategoryPills() {
    const pills = document.querySelectorAll('.cat-pill');
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('cat-pill-active'));
        pill.classList.add('cat-pill-active');
        selectedCategory = pill.dataset.category;
        ChovyAppState.set('selectedCategory', selectedCategory);
        videos = allVideos.filter(v => v.category === selectedCategory);
        renderQuickList();
      });
    });
    ChovyAppState.set('selectedCategory', selectedCategory);
  }

  function getFallbackVideos() {
    return [
      { id: 'v001', title: '2024年度口红榜单！这5支闭眼入不出错', author: '美妆师小鱼', platform: '抖音', likes: '23.6万' },
      { id: 'v002', title: '黄皮显白口红合集！这几支素颜也能涂', author: '成分党Lisa', platform: '抖音', likes: '15.8万' },
      { id: 'v003', title: '阿玛尼vs迪奥vsYSL 大牌口红到底谁更值？', author: '毛蛋MAODAN', platform: '抖音', likes: '67.3万' },
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
    const input = document.getElementById('linkInput');
    const btn = document.getElementById('linkSubmitBtn');

    if (btn) {
      btn.addEventListener('click', () => {
        const url = input ? input.value.trim() : '';
        if (url) {
          parseAndStart(url);
        } else if (videos.length > 0) {
          startAnalysis(videos[0].id);
        }
      });
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          btn.click();
        }
      });
    }
  }

  async function parseAndStart(url) {
    try {
      const resp = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await resp.json();
      if (data.success && data.video) {
        startAnalysis(data.video.id, url);
      }
    } catch (e) {
      console.error('Parse failed:', e);
      if (videos.length > 0) {
        startAnalysis(videos[0].id, url);
      }
    }
  }

  function startAnalysis(videoId, sourceUrl) {
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
