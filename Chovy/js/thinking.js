/**
 * Chovy Thinking View - Chat bubble engine with typing animation and 8-bit sound effects
 */

// ─── Programmatic Retro 8-bit Audio Synthesizer (Chiptune Engine) ──────────────────
const RetroAudio = (() => {
  let ctx = null;

  function initContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  // Tiny retro 8-bit blip sound (perfect for character text typing!)
  function playBlip() {
    try {
      initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square'; // classic sharp chiptune sound
      
      // Slight pitch variation for retro organic typing feel
      const baseFreq = 480 + Math.random() * 240;
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {
      console.warn('Web Audio playBlip failed:', e);
    }
  }

  // 8-bit tool task completion chime
  function playChime() {
    try {
      initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle'; // smooth, classic triangle arpeggio
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.21); // C6

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.21);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.40);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(now + 0.40);
    } catch (e) {
      console.warn('Web Audio playChime failed:', e);
    }
  }

  // Retro sci-fi sweep sound (perfect for final matching scores)
  function playSweep() {
    try {
      initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth'; // retro transition sweep
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.32);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.32);
    } catch (e) {
      console.warn('Web Audio playSweep failed:', e);
    }
  }

  return { initContext, playBlip, playChime, playSweep };
})();

// ─── Thinking Page Controller ────────────────────────────────────────────────────────
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

    // Initialize AudioContext
    RetroAudio.initContext();

    // Get face profile and category from app state
    const faceProfile = ChovyAppState.get('faceProfile') || ChovyStorage.getFaceProfile();
    const category = ChovyAppState.get('selectedCategory') || 'foundation';

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
      
      // Play retro chiptune blip on every second character for a polished pacing (like Zelda/Pokémon dialogues)
      if (i % 2 === 0) {
        RetroAudio.playBlip();
      }

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
        
        // Play task completion chime
        RetroAudio.playChime();
        await sleep(200);
      }
      const statusEl = el.querySelector('.tool-card-status');
      if (statusEl) statusEl.textContent = '完成';
    } else {
      // Play task completion chime immediately if not searching
      RetroAudio.playChime();
    }
  }

  async function renderMatchResults(contestants) {
    // Play sci-fi sweep sound when results arrive
    RetroAudio.playSweep();

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
              <div class="match-bar-row">
                <div class="match-score-bar">
                  <div class="match-score-fill" style="width:${c.match_score}%"></div>
                </div>
                <span class="match-item-score">${c.match_score}%</span>
              </div>
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
