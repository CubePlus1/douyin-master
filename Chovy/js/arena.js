/**
 * Chovy Arena View V2 - LLM-driven debate group chat with DeepSeek
 * Products debate each other, user observes with optional feedback
 */

const ChovyArena = (() => {
  // State
  let contestants = [];
  let labels = ['product_a', 'product_b', 'product_c', 'product_d'];
  let eliminated = [];       // product IDs
  let roundHistory = [];     // {round, eliminated_id, eliminated_name, exit_line}
  let champion = null;
  let userSignals = [];      // {type: 'like'|'dislike', product_id, context}
  let debateHistory = [];    // {speaker, text} for LLM context
  let currentPhase = 'debate'; // debate | finale | eliminate
  let currentRound = 1;
  let isActive = false;
  let prefPanelOpen = false;
  let feedbackPromptCount = 0;
  let championQuotes = [];
  let championProduct = null;

  // Color palette for product avatars
  const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

  async function init() {
    // Pref icon click handler
    const prefIcon = document.getElementById('prefIcon');
    if (prefIcon) {
      prefIcon.addEventListener('click', togglePrefPanel);
    }
  }

  async function startArena() {
    contestants = ChovyAppState.get('contestants') || [];
    if (contestants.length < 2) {
      contestants = getFallbackContestants();
    }

    // Reset state
    eliminated = [];
    roundHistory = [];
    champion = null;
    userSignals = [];
    debateHistory = [];
    currentPhase = 'debate';
    currentRound = 1;
    isActive = true;
    prefPanelOpen = false;
    feedbackPromptCount = 0;
    championQuotes = [];
    championProduct = null;

    const group = document.getElementById('chatGroup');
    if (!group) return;
    group.innerHTML = '';

    // Show pref icon
    const prefIcon = document.getElementById('prefIcon');
    if (prefIcon) prefIcon.style.display = '';

    // Start the debate flow
    await renderIntro();
    await runDebateLoop();
  }

  function getFallbackContestants() {
    return [
      { id: 'b001', name: '丝绒唇釉 #405', brand: '阿玛尼', price: '320元/6.5ml', price_num: 320, power: 95, source: { platform: '抖音', author: '美妆师小鱼' }, argument: '丝绒质地不拔干，#405显白王者色号', details: { color_type: '正红色系', texture: '丝绒哑光', lasting: '8小时持妆', lasting_num: 8, suitable: '所有肤色', highlights: ['丝绒质地', '显白王者', '不拔干', '经典色号'] } },
      { id: 'b002', name: '烈艳蓝金唇膏 #999', brand: '迪奥', price: '350元/3.5g', price_num: 350, power: 93, source: { platform: '抖音', author: '成分党Lisa' }, argument: '正红色天花板，质地滋润不卡纹', details: { color_type: '经典正红', texture: '滋润缎光', lasting: '6小时持妆', lasting_num: 6, suitable: '所有肤色', highlights: ['正红天花板', '滋润不卡纹', '送礼首选', '高显色度'] } },
      { id: 'b003', name: '小金条 #1966', brand: 'YSL', price: '340元/2.2g', price_num: 340, power: 91, source: { platform: '抖音', author: '毛蛋MAODAN' }, argument: '复古红棕调，黄皮显白神器', details: { color_type: '红棕复古', texture: '柔雾哑光', lasting: '7小时持妆', lasting_num: 7, suitable: '黄皮/暖皮', highlights: ['复古红棕', '黄皮显白', '秋冬必备', '高级感'] } },
      { id: 'b004', name: '子弹头 #Chili', brand: 'MAC', price: '170元/3g', price_num: 170, power: 89, source: { platform: '抖音', author: '口红达人' }, argument: '小辣椒色号，性价比之王', details: { color_type: '铁锈红', texture: '哑光雾面', lasting: '5小时持妆', lasting_num: 5, suitable: '所有肤色', highlights: ['性价比之王', '小辣椒经典', '日常百搭', '色号齐全'] } },
    ];
  }

  // ─── Intro ────────────────────────────────────────────

  async function renderIntro() {
    const group = document.getElementById('chatGroup');

    await addDmBubble(group, '欢迎来到选品辩论赛！今天4位选手要争夺你的青睐。');
    await sleep(600);

    // Show each contestant joining
    for (let i = 0; i < contestants.length; i++) {
      const c = contestants[i];
      const joinText = getJoinLine(c, i);
      await addProductBubble(group, c, i, joinText);
      await sleep(400);
    }

    await sleep(500);
  }

  function getJoinLine(product, index) {
    const lines = [
      `大家好，我是${product.brand}${product.name}，今天来证明谁才是真正的王者！`,
      `${product.brand}${product.name}在此！${product.argument}`,
      `来了来了～${product.brand}报道！我的${product.details?.texture || ''}质地可不是吹的。`,
      `${product.brand}${product.name}，性价比选手就位，准备battle！`
    ];
    return lines[index] || `${product.name}来了！`;
  }

  // ─── Debate Loop ──────────────────────────────────────

  async function runDebateLoop() {
    const maxRounds = 3; // Max debate rounds before finale

    while (isActive && currentRound <= maxRounds) {
      const remaining = getRemaining();
      if (remaining.length <= 2) break;

      updateHeader(`第${currentRound}轮辩论`, currentRound);

      // Call LLM for this debate round
      const success = await streamDebateRound('debate');

      if (!success) {
        // Fallback: simulate a round
        await simulateDebateRound();
      }

      // Check if we got an elimination
      const newRemaining = getRemaining();
      if (newRemaining.length <= 2) break;

      currentRound++;
      await sleep(1000);
    }

    // Finale phase
    if (isActive && !champion) {
      await runFinale();
    }
  }

  async function streamDebateRound(phase) {
    const group = document.getElementById('chatGroup');

    try {
      // Show streaming status
      const statusEl = showStreamStatus(group, 'AI正在生成辩论内容...');

      const faceProfile = ChovyAppState.get('faceProfile') || ChovyStorage.getFaceProfile();

      const response = await fetch('/api/arena/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestants: contestants,
          eliminated_ids: eliminated,
          user_signals: userSignals,
          phase: phase,
          round: currentRound,
          history: debateHistory,
          face_profile: faceProfile
        })
      });

      if (!response.ok) {
        statusEl?.remove();
        return false;
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let gotMessages = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const msg = JSON.parse(dataStr);
            statusEl?.remove();
            gotMessages = true;
            await handleStreamMessage(msg, group);
          } catch (e) {
            // Not valid JSON, skip
            console.warn('Invalid SSE data:', dataStr);
          }
        }
      }

      statusEl?.remove();
      return gotMessages;

    } catch (e) {
      console.error('Stream error:', e);
      return false;
    }
  }

  async function handleStreamMessage(msg, group) {
    if (msg.type === 'eliminate') {
      // Elimination event
      await handleElimination(msg.product_id, msg.exit_line || '好吧，下次再战！');
      roundHistory.push({
        round: currentRound,
        eliminated_id: msg.product_id,
        exit_line: msg.exit_line
      });
      debateHistory.push({ speaker: 'dm', text: `[淘汰] ${msg.product_id}` });

    } else if (msg.type === 'champion') {
      // Champion announcement
      const product = contestants.find(c => c.id === msg.product_id);
      if (product) {
        champion = product;
      }

    } else if (msg.type === 'feedback_prompt') {
      // Show dimensional feedback card
      if (feedbackPromptCount < 3) {
        showDimensionalFeedback(group, msg.question || msg.context, msg.options, msg.context);
        feedbackPromptCount++;
      }

    } else if (msg.type === 'error') {
      console.error('LLM error:', msg.message);

    } else if (msg.speaker && msg.text) {
      // Regular message
      const speaker = msg.speaker;

      if (speaker === 'dm') {
        await addDmBubble(group, msg.text);
      } else {
        // Find product by label
        const labelIdx = labels.indexOf(speaker);
        if (labelIdx >= 0 && labelIdx < contestants.length) {
          const product = contestants[labelIdx];
          if (!eliminated.includes(product.id)) {
            await addProductBubble(group, product, labelIdx, msg.text);

            // Track quotes for potential champion
            if (!product._quotes) product._quotes = [];
            product._quotes.push(msg.text);
          }
        }
      }

      debateHistory.push({ speaker, text: msg.text });
    }
  }

  // ─── Fallback Simulation ──────────────────────────────

  async function simulateDebateRound() {
    const group = document.getElementById('chatGroup');
    const remaining = getRemaining();

    await addDmBubble(group, `第${currentRound}轮辩论开始！`);
    await sleep(400);

    const fallbackLines = [
      '持久度方面，我8小时不脱色，谁能比？',
      '持久归持久，滋润才是王道！我质地滋润不卡纹。',
      '两位都别吵了，复古红棕才是今年的流行趋势。',
      '流行什么不重要，170块搞定日常通勤才是硬道理。'
    ];

    for (let i = 0; i < remaining.length; i++) {
      const product = remaining[i];
      const idx = contestants.indexOf(product);
      const text = fallbackLines[i] || `${product.argument}`;
      await addProductBubble(group, product, idx, text);
      debateHistory.push({ speaker: labels[idx], text });
      await sleep(350);
    }

    // Eliminate weakest
    if (remaining.length > 2) {
      const weakest = remaining.reduce((w, c) => (c.power || 0) < (w.power || 0) ? c : w);
      await handleElimination(weakest.id, '好吧，你们继续，我去性价比赛道等你们 😏');
      roundHistory.push({
        round: currentRound,
        eliminated_id: weakest.id,
        exit_line: '好吧，你们继续，我去性价比赛道等你们 😏'
      });
    }
  }

  // ─── Finale ───────────────────────────────────────────

  async function runFinale() {
    const group = document.getElementById('chatGroup');
    const remaining = getRemaining();

    if (remaining.length < 2) {
      // Only one left, they're the champion
      champion = remaining[0] || contestants.find(c => !eliminated.includes(c.id));
      await announceChampion();
      return;
    }

    updateHeader('决赛', 'final');

    await addDmBubble(group, '经过激烈角逐，最后两位选手进入决赛！');
    await sleep(600);

    // Try LLM finale
    const success = await streamDebateRound('finale');

    if (!success) {
      // Fallback finale
      await simulateFinale(remaining);
    }

    if (!champion) {
      // If still no champion, pick the one with higher power
      champion = remaining.reduce((w, c) => (c.power || 0) > (w.power || 0) ? c : w);
    }

    await announceChampion();
  }

  async function simulateFinale(remaining) {
    const group = document.getElementById('chatGroup');

    for (let i = 0; i < remaining.length; i++) {
      const product = remaining[i];
      const idx = contestants.indexOf(product);
      const text = `最后的对决了。${product.argument}`;
      await addProductBubble(group, product, idx, text);
      await sleep(500);
    }
  }

  // ─── Champion Announcement ────────────────────────────

  async function announceChampion() {
    if (!champion) return;

    const group = document.getElementById('chatGroup');

    await addDmBubble(group, `最终冠军是——${champion.brand} ${champion.name}！`);
    await sleep(800);

    // Finish arena and go to result
    finishArena();
  }

  // ─── Elimination ──────────────────────────────────────

  async function handleElimination(productId, exitLine) {
    const group = document.getElementById('chatGroup');
    const product = contestants.find(c => c.id === productId);
    if (!product) return;

    const idx = contestants.indexOf(product);

    // DM announces elimination
    const remaining = getRemaining().filter(c => c.id !== productId);
    await addDmBubble(group, `很遗憾，${product.brand} ${product.name}本次淘汰。`);
    await sleep(300);

    // Product exit line
    await addProductBubble(group, product, idx, exitLine, true);
    await sleep(200);

    // Mark as eliminated
    eliminated.push(productId);
    markEliminated(group, productId);

    // Update header
    updateHeader(`剩余 ${remaining.length} 位选手`, currentRound);
  }

  function markEliminated(group, productId) {
    const els = group.querySelectorAll(`[data-product-id="${productId}"]`);
    els.forEach(el => {
      el.classList.add('product-eliminated');
      // Add badge if not exists
      if (!el.querySelector('.eliminated-badge')) {
        const cross = document.createElement('div');
        cross.className = 'eliminated-badge';
        cross.textContent = '已退群';
        el.appendChild(cross);
      }
    });
  }

  // ─── UI Rendering ─────────────────────────────────────

  async function addDmBubble(group, text) {
    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'dm-bubble typing-indicator-wrap';
    typing.innerHTML = `
      <div class="dm-avatar"><span class="material-icons-outlined">smart_toy</span></div>
      <div class="dm-bubble-content typing">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
      </div>
    `;
    group.appendChild(typing);
    scrollToBottom();
    await sleep(500);
    typing.remove();

    // Actual message
    const el = document.createElement('div');
    el.className = 'dm-bubble anim-fade-in-up';
    el.innerHTML = `
      <div class="dm-avatar"><span class="material-icons-outlined">smart_toy</span></div>
      <div class="dm-bubble-content">
        <div class="dm-name">Chovy 主持人</div>
        <div>${text}</div>
      </div>
    `;
    group.appendChild(el);
    scrollToBottom();
    await sleep(150);
  }

  async function addProductBubble(group, product, index, text, isExit = false) {
    const el = document.createElement('div');
    el.className = `product-bubble anim-fade-in-up${isExit ? ' exit-bubble' : ''}`;
    el.dataset.productId = product.id;

    const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
    const initial = (product.brand || product.name || '?').charAt(0);

    el.innerHTML = `
      <div class="product-avatar" style="background:${color};color:#fff;">${initial}</div>
      <div class="product-bubble-content">
        <div class="product-name">${product.brand || ''} ${product.name || ''}</div>
        <div class="product-brand">${product.source?.platform || '抖音'} @${product.source?.author || ''}</div>
        <div>${text}</div>
      </div>
    `;
    group.appendChild(el);
    scrollToBottom();
    await sleep(150);
  }

  function showFeedbackButtons(group, product, index, context) {
    // Legacy - replaced by showDimensionalFeedback
  }

  function showDimensionalFeedback(group, question, options, context) {
    const card = document.createElement('div');
    card.className = 'feedback-dim-card';

    const defaultOptions = options || ['非常重要', '一般般', '无所谓'];
    const icon = '🎯';

    card.innerHTML = `
      <div class="feedback-dim-question">${icon} ${question}</div>
      <div class="feedback-dim-options">
        ${defaultOptions.map(opt => `
          <button class="feedback-dim-btn" data-value="${opt}">${opt}</button>
        `).join('')}
      </div>
    `;

    // Auto-collapse after 15 seconds
    const timeout = setTimeout(() => {
      card.classList.add('feedback-dim-collapsed');
    }, 15000);

    card.querySelectorAll('.feedback-dim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        clearTimeout(timeout);
        card.querySelectorAll('.feedback-dim-btn').forEach(b => b.classList.remove('feedback-dim-selected'));
        btn.classList.add('feedback-dim-selected');

        userSignals.push({
          type: 'dimensional',
          context: context || question,
          value: btn.dataset.value
        });
        updatePrefPanel();

        setTimeout(() => {
          card.classList.add('feedback-dim-collapsed');
        }, 1000);
      });
    });

    group.appendChild(card);
    scrollToBottom();
  }

  function recordFeedback(type, product, context) {
    userSignals.push({
      type,
      product_id: product.id,
      context: context || product.argument
    });
    updatePrefPanel();
  }

  function showStreamStatus(group, text) {
    const el = document.createElement('div');
    el.className = 'debate-status';
    el.innerHTML = `<div class="spinner"></div><span>${text}</span>`;
    group.appendChild(el);
    scrollToBottom();
    return el;
  }

  // ─── Preference Panel ─────────────────────────────────

  function togglePrefPanel() {
    const panel = document.getElementById('prefPanel');
    if (!panel) return;

    prefPanelOpen = !prefPanelOpen;
    panel.style.display = prefPanelOpen ? '' : 'none';

    if (prefPanelOpen) {
      updatePrefPanel();
    }
  }

  function updatePrefPanel() {
    const panel = document.getElementById('prefPanel');
    if (!panel) return;

    if (userSignals.length === 0) {
      panel.innerHTML = `
        <div class="pref-panel-title">当前偏好信号</div>
        <div class="pref-panel-empty">暂无反馈</div>
      `;
      return;
    }

    // Count likes/dislikes per product
    const productNames = {};
    contestants.forEach(c => { productNames[c.id] = `${c.brand} ${c.name}`; });

    const likes = userSignals.filter(s => s.type === 'like');
    const dislikes = userSignals.filter(s => s.type === 'dislike');

    let html = '<div class="pref-panel-title">当前偏好信号</div>';

    if (likes.length > 0) {
      html += '<div class="pref-panel-item"><span class="material-icons-outlined">thumb_up</span> 偏好：</div>';
      likes.forEach(s => {
        html += `<div class="pref-panel-item" style="padding-left:18px;font-size:0.72rem;">${productNames[s.product_id] || s.product_id}</div>`;
      });
    }

    if (dislikes.length > 0) {
      html += '<div class="pref-panel-item"><span class="material-icons-outlined">thumb_down</span> 不偏好：</div>';
      dislikes.forEach(s => {
        html += `<div class="pref-panel-item" style="padding-left:18px;font-size:0.72rem;">${productNames[s.product_id] || s.product_id}</div>`;
      });
    }

    panel.innerHTML = html;
  }

  // ─── Header Updates ───────────────────────────────────

  function updateHeader(text, round) {
    const label = document.getElementById('arenaRoundLabel');
    if (label) label.textContent = text;

    const progress = document.getElementById('arenaProgress');
    if (progress && typeof round === 'number') {
      const dots = progress.querySelectorAll('.arena-dot');
      dots.forEach((dot, i) => {
        dot.className = 'arena-dot';
        if (i < round - 1) dot.classList.add('done');
        else if (i === round - 1) dot.classList.add('current');
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────

  function getRemaining() {
    return contestants.filter(c => !eliminated.includes(c.id));
  }

  function scrollToBottom() {
    const screen = document.querySelector('.phone-screen');
    if (screen) {
      setTimeout(() => { screen.scrollTop = screen.scrollHeight; }, 80);
    }
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function finishArena() {
    isActive = false;

    // Determine champion
    if (!champion) {
      const remaining = getRemaining();
      champion = remaining[0] || contestants[0];
    }

    // Save session
    const video = ChovyAppState.get('currentVideo') || {};
    ChovyStorage.recordSession({
      video: { title: video.title, url: ChovyAppState.get('sourceUrl') || '', category: video.category || '美妆' },
      rounds: roundHistory,
      champion_id: champion.id,
      champion_name: champion.name,
      champion_brand: champion.brand,
    });

    // Pick the best quote from champion
    const bestQuote = champion._quotes && champion._quotes.length > 0
      ? champion._quotes[champion._quotes.length - 1]
      : champion.argument;

    // Store results
    ChovyAppState.set('champion', champion);
    ChovyAppState.set('roundHistory', roundHistory);
    ChovyAppState.set('championQuote', bestQuote);
    ChovyAppState.set('userSignals', userSignals);

    // Navigate to result
    setTimeout(() => {
      ChovyRouter.navigate('/result');
    }, 1200);
  }

  return { init, startArena };
})();
