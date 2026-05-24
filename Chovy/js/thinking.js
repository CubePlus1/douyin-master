/**
 * Chovy Thinking View - Chat bubble engine with typing animation
 */

const ChovyThinking = (() => {
  let aiMessages = null;
  let chatContainer = null;

  async function init() {
    chatContainer = document.getElementById('chatContainer');
    await loadMessages();
  }

  async function loadMessages() {
    try {
      const resp = await fetch('/data/ai_messages.json');
      aiMessages = await resp.json();
    } catch (e) {
      console.error('Failed to load AI messages:', e);
      aiMessages = getDefaultMessages();
    }
  }

  function getDefaultMessages() {
    return {
      thinking_sequence: [
        { type: 'ai_bubble', text: '收到！我来看看这个视频讲了什么。', delay: 800 },
        { type: 'ai_bubble', text: '正在分析视频内容...', delay: 1500 },
        { type: 'ai_bubble', text: '找到4个候选产品，准备进入群聊！', delay: 1000 },
      ]
    };
  }

  async function startThinking(videoId) {
    if (!chatContainer) return;
    chatContainer.innerHTML = '';

    // Get face profile and category from app state
    const faceProfile = ChovyAppState.get('faceProfile') || ChovyStorage.getFaceProfile();
    const category = ChovyAppState.get('selectedCategory') || 'lipstick';

    // Fetch thinking data from backend
    let thinkingData = null;
    try {
      const resp = await fetch('/api/thinking-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: videoId,
          face_profile: faceProfile,
          category: category
        })
      });
      thinkingData = await resp.json();
    } catch (e) {
      console.error('Failed to fetch thinking data:', e);
    }

    const video = thinkingData?.video || { title: '种草视频', author: '博主', platform: '抖音' };
    const contestants = thinkingData?.contestants || [];

    // Store contestants for arena
    ChovyAppState.set('contestants', contestants);
    ChovyAppState.set('currentVideo', video);

    // Build the sequence with variable substitution
    const sequence = (aiMessages?.thinking_sequence || []).map(step => {
      const s = { ...step };
      if (s.text) {
        s.text = s.text
          .replace('{title}', video.title || '种草视频')
          .replace('{author}', video.author || '博主')
          .replace('{platform}', video.platform || '抖音');
      }
      return s;
    });

    // Render each step with delays
    for (let i = 0; i < sequence.length; i++) {
      const step = sequence[i];
      await sleep(step.delay || 1000);

      if (step.type === 'ai_bubble') {
        await renderBubble(step.text);
      } else if (step.type === 'tool_card') {
        await renderToolCard(step);
      }
    }

    // Show match results if we have contestants with scores
    if (contestants.length > 0 && contestants[0].match_score !== undefined) {
      await sleep(800);
      await renderMatchResults(contestants);
    }

    // Wait a moment then navigate to comic
    await sleep(1200);
    ChovyRouter.navigate('/comic');
  }

  async function renderBubble(text) {
    const el = document.createElement('div');
    el.className = 'chat-bubble';
    el.innerHTML = `
      <div class="bubble-avatar"><span class="material-icons-outlined">smart_toy</span></div>
      <div class="bubble-content"><span class="typing-cursor"></span></div>
    `;
    chatContainer.appendChild(el);
    scrollToBottom();

    const contentEl = el.querySelector('.bubble-content');

    // Typing animation
    const chars = text.split('');
    let displayed = '';
    for (let i = 0; i < chars.length; i++) {
      displayed += chars[i];
      contentEl.innerHTML = displayed + '<span class="typing-cursor"></span>';
      await sleep(30 + Math.random() * 40);
    }
    // Remove cursor
    contentEl.innerHTML = displayed;
  }

  async function renderToolCard(step) {
    const isSearching = step.status === 'searching';

    const el = document.createElement('div');
    el.className = 'tool-card';
    el.innerHTML = `
      <div class="bubble-avatar"><span class="material-icons-outlined">smart_toy</span></div>
      <div class="tool-card-content">
        <div class="tool-card-header">
          <span class="tool-card-icon"><span class="material-icons-outlined">${step.tool_icon || 'build'}</span></span>
          <span class="tool-card-name">${step.tool_name || '工具'}</span>
          <span class="tool-card-status">${isSearching ? '检索中...' : '完成'}</span>
        </div>
        <div class="tool-platforms">
          <div class="tool-platform-chip ${isSearching ? 'searching' : 'done'}">
            <span class="chip-icon"><span class="material-icons-outlined">video_library</span></span>
            <span>抖音</span>
          </div>
        </div>
      </div>
    `;
    chatContainer.appendChild(el);
    scrollToBottom();

    // Animate from searching to done
    if (isSearching) {
      await sleep(1500);
      const chips = el.querySelectorAll('.tool-platform-chip');
      for (const chip of chips) {
        chip.classList.remove('searching');
        chip.classList.add('done');
        await sleep(200);
      }
      const statusEl = el.querySelector('.tool-card-status');
      if (statusEl) statusEl.textContent = '完成';
    }
  }

  async function renderMatchResults(contestants) {
    const el = document.createElement('div');
    el.className = 'match-results-card';
    el.innerHTML = `
      <div class="bubble-avatar"><span class="material-icons-outlined">smart_toy</span></div>
      <div class="match-results-content">
        <div class="match-results-title">为你匹配了最适合的产品</div>
        <div class="match-results-list">
          ${contestants.map(c => `
            <div class="match-item">
              <span class="match-item-name">${c.brand} ${c.name}</span>
              <div class="match-score-bar">
                <div class="match-score-fill" style="width:${c.match_score}%"></div>
              </div>
              <span class="match-item-score">${c.match_score}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    chatContainer.appendChild(el);
    scrollToBottom();
  }

  function scrollToBottom() {
    const screen = document.querySelector('.phone-screen');
    if (screen) {
      setTimeout(() => { screen.scrollTop = screen.scrollHeight; }, 50);
    } else {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  return { init, startThinking };
})();
