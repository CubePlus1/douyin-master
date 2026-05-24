/**
 * Chovy Home View - 微信列表风格
 */

const ChovyHome = (() => {
  let videos = [];
  let allVideos = [];
  let allProducts = [];
  let selectedCategory = 'lipstick';

  async function init() {
    await loadVideos();
    renderQuickList();
    renderHistory();
    setupEvents();
  }

  async function loadVideos() {
    try {
      // Fetch preset videos
      const resp = await fetch('/api/videos');
      const data = await resp.json();
      allVideos = data.videos;
      videos = allVideos;

      // Fetch products database
      const pResp = await fetch('/data/battles.json');
      const pData = await pResp.json();
      allProducts = pData.products || [];
    } catch (e) {
      console.error('Failed to load videos or products:', e);
      allVideos = getFallbackVideos();
      videos = allVideos;
      allProducts = getFallbackProducts();
    }
  }

  function getFallbackVideos() {
    return [
      { id: 'v009', title: '6款粉底液大横评！油皮干皮各有推荐', author: '美妆师小鱼', platform: '抖音', likes: '45.2万', category: 'foundation' },
      { id: 'v010', title: '干皮亲妈粉底液合集！不卡粉不起皮才是王道', author: '成分党Lisa', platform: '抖音', likes: '28.7万', category: 'foundation' },
      { id: 'v011', title: '阿玛尼权力vs迪奥锁妆 粉底液巅峰对决', author: '毛蛋MAODAN', platform: '抖音', likes: '52.1万', category: 'foundation' },
      { id: 'v012', title: '百元粉底液真的能替代大牌吗？实测给你看', author: '老爸评测', platform: '抖音', likes: '89.3万', category: 'foundation' }
    ];
  }

  function getFallbackProducts() {
    return [
      {
        id: "b001",
        category: "lipstick",
        name: "丝绒唇釉 #405",
        brand: "阿玛尼",
        price: "320元/6.5ml",
        price_num: 320,
        power: 95,
        source: { author: "美妆师小鱼" },
        argument: "丝绒质地不拔干，#405显白王者色号，黄皮亲妈",
        details: { highlights: ["丝绒质地", "显白王者", "不拔干"] }
      },
      {
        id: "b002",
        category: "lipstick",
        name: "烈艳蓝金唇膏 #999",
        brand: "迪奥",
        price: "350元/3.5g",
        price_num: 350,
        power: 93,
        source: { author: "成分党Lisa" },
        argument: "正红色天花板，质地滋润不卡纹，送礼首选",
        details: { highlights: ["正红天花板", "滋润不卡纹", "送礼首选"] }
      }
    ];
  }

  function renderQuickList() {
    const el = document.getElementById('videoQuickList');
    if (!el) return;

    // Use allProducts to render beautiful cards
    const list = allProducts.slice(0, 4);
    el.innerHTML = list.map(p => {
      const highlightsHtml = (p.details?.highlights || [])
        .slice(0, 3)
        .map(h => `<span class="prod-tag">${h}</span>`)
        .join('');

      return `
        <div class="product-card" data-product-id="${p.id}" data-author="${p.source?.author || ''}">
          <div class="prod-header">
            <span class="prod-brand-badge">${p.brand}</span>
            <div class="prod-power">
              <span class="material-icons-outlined" style="font-size: 14px; vertical-align: middle;">bolt</span>
              <span>战力 ${p.power}</span>
            </div>
          </div>
          <div class="prod-title">${p.name}</div>
          <div class="prod-argument">${p.argument}</div>
          <div class="prod-highlights">${highlightsHtml}</div>
          <div class="prod-footer">
            <span class="prod-price">${p.price}</span>
            <span class="prod-action-tip">
              <span>进入评测</span>
              <span class="material-icons-outlined" style="font-size: 12px; vertical-align: middle;">arrow_forward</span>
            </span>
          </div>
        </div>
      `;
    }).join('');

    // Setup click events on the cards to trigger the video that mentioned the product
    el.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => {
        const author = card.dataset.author;
        const matchedVideo = allVideos.find(v => v.author === author);
        if (matchedVideo) {
          startAnalysis(matchedVideo.id);
        } else if (allVideos.length > 0) {
          startAnalysis(allVideos[0].id);
        }
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

    // Add search bar event listener for search_index.html
    const searchBtn = document.getElementById('searchBarBtn');
    const searchInput = document.getElementById('searchBarInput');

    if (searchBtn && searchInput) {
      const handleSearch = () => {
        const query = searchInput.value.trim().toLowerCase();
        
        let matchedVideo = null;
        if (query.includes('粉底') || query.includes('液') || query.includes('foundation')) {
          matchedVideo = allVideos.find(v => v.category === 'foundation');
        } else if (query.includes('口红') || query.includes('唇') || query.includes('lipstick')) {
          matchedVideo = allVideos.find(v => v.category === 'lipstick');
        } else if (query) {
          // Attempt to match query with titles or authors
          matchedVideo = allVideos.find(v => v.title.toLowerCase().includes(query) || v.author.toLowerCase().includes(query));
        }

        // If empty search, or no match found, pick a random video for a fun surprise!
        if (!matchedVideo && allVideos.length > 0) {
          const randomIndex = Math.floor(Math.random() * allVideos.length);
          matchedVideo = allVideos[randomIndex];
        }

        if (matchedVideo) {
          startAnalysis(matchedVideo.id);
        }
      };

      searchBtn.addEventListener('click', handleSearch);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleSearch();
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
      ChovyAppState.set('selectedCategory', 'foundation');
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
