/**
 * Chovy Result View - Personalized champion display + magazine-style shareable card
 */

const ChovyResult = (() => {
  function init() {
    const replayBtn = document.getElementById('replayBtn');
    const goProfileBtn = document.getElementById('goProfileBtn');

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        ChovyRouter.navigate('/home');
      });
    }

    if (goProfileBtn) {
      goProfileBtn.addEventListener('click', () => {
        ChovyRouter.navigate('/my');
      });
    }
  }

  function showResult() {
    const champion = ChovyAppState.get('champion');
    const roundHistory = ChovyAppState.get('roundHistory') || [];
    const championQuote = ChovyAppState.get('championQuote') || '';
    const faceProfile = ChovyAppState.get('faceProfile') || ChovyStorage.getFaceProfile();

    if (!champion) {
      ChovyRouter.navigate('/home');
      return;
    }

    renderChampion(champion, faceProfile);
    renderReasons(champion, faceProfile);
    renderShareableCard(champion, championQuote, faceProfile);
    renderRecap(roundHistory);
    setupShareButtons();
  }

  function renderChampion(champion, faceProfile) {
    const card = document.getElementById('championCard');
    if (!card) return;

    const specs = champion.details ? [
      { label: '色系', value: champion.details.color_type },
      { label: '质地', value: champion.details.texture },
      { label: '持妆', value: champion.details.lasting },
      { label: '适合', value: champion.details.suitable },
    ].filter(s => s.value) : [];

    const matchScore = champion.match_score || 85;
    const profileLabel = faceProfile ? getProfileLabel(faceProfile) : '';

    // Build match dimension tags
    const matchDims = buildMatchDimensions(champion, faceProfile);

    card.innerHTML = `
      <div class="champion-icon"><span class="material-icons-outlined">emoji_events</span></div>
      <div class="champion-name">${champion.name}</div>
      <div class="champion-brand">${champion.brand} · ${champion.source?.platform || '抖音'} @${champion.source?.author || ''}</div>
      <div class="champion-price">${champion.price || ''}</div>
      ${profileLabel ? `<div class="champion-profile-label">${profileLabel}</div>` : ''}
      <div class="champion-match-section">
        <div class="champion-match-bar-wrap">
          <div class="champion-match-bar">
            <div class="champion-match-fill" style="width:${matchScore}%"></div>
          </div>
          <span class="champion-match-score">匹配度 ${matchScore}%</span>
        </div>
        ${matchDims.length > 0 ? `
          <div class="champion-match-dims">
            ${matchDims.map(d => `<span class="match-dim-tag">${d}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      ${specs.length > 0 ? `
        <div class="champion-specs">
          ${specs.map(s => `
            <div class="spec-tag">
              <div class="spec-tag-label">${s.label}</div>
              <div class="spec-tag-value">${s.value}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function renderReasons(champion, faceProfile) {
    const section = document.getElementById('reasonSection');
    if (!section) return;

    const reasons = [];
    if (faceProfile) {
      const skinLabel = getSkinToneLabel(faceProfile.skin_tone);
      const typeLabel = getSkinTypeLabel(faceProfile.skin_type);
      reasons.push(`适合你的${skinLabel}，${champion.details?.texture || ''}质地在${typeLabel}上表现最佳`);
    }
    reasons.push(champion.argument);
    if (champion.details?.highlights) {
      reasons.push(...champion.details.highlights.slice(0, 2));
    }

    section.innerHTML = reasons.map(r => `
      <div class="reason-item">
        <span class="check"><span class="material-icons-outlined" style="font-size:16px">check_circle</span></span>
        <span>${r}</span>
      </div>
    `).join('');
  }

  function renderRecap(roundHistory) {
    const list = document.getElementById('recapList');
    if (!list) return;

    list.innerHTML = roundHistory.map(r => {
      const loserName = r.eliminated_name || r.eliminated_id || '';
      const detail = r.exit_line || r.answer || '';
      return `
        <div class="recap-row">
          <span class="recap-round">R${r.round}</span>
          <span class="recap-winner" style="flex:1;font-size:0.76rem;">${detail}</span>
          <span class="recap-vs">淘汰</span>
          <span class="recap-loser">${loserName}</span>
        </div>
      `;
    }).join('');
  }

  // ─── Shareable Champion Card ──────────────────────────

  function renderShareableCard(champion, quote, faceProfile) {
    const section = document.getElementById('recapSection');
    if (!section) return;

    const matchScore = champion.match_score || 85;
    const profileLabel = faceProfile ? getProfileLabel(faceProfile) : '';
    const matchDims = buildMatchDimensions(champion, faceProfile);
    const price = champion.price || '';
    const texture = champion.details?.texture || '';
    const lasting = champion.details?.lasting || '';

    // Create the shareable card element
    const cardEl = document.createElement('div');
    cardEl.className = 'share-card-wrap';
    cardEl.innerHTML = `
      <div class="share-card" id="shareCard">
        <div class="share-card-header">
          <div class="share-card-logo">C H O V Y</div>
          <div class="share-card-sub">YOUR BEAUTY MATCH</div>
        </div>

        <div class="share-card-divider"></div>

        <div class="share-card-best">── BEST FOR YOU ──</div>

        <div class="share-card-product">
          <div class="share-card-brand">${champion.brand}</div>
          <div class="share-card-name">${champion.name}</div>
        </div>

        <div class="share-card-meta">${price} · ${texture} · ${lasting}</div>

        ${quote ? `
          <div class="share-card-quote-box">
            <div class="share-card-quote">"${quote}"</div>
            <div class="share-card-quote-src">—— 辩论中的冠军金句</div>
          </div>
        ` : ''}

        <div class="share-card-profile-section">
          <div class="share-card-profile-title">YOUR PROFILE</div>
          <div class="share-card-profile-label">${profileLabel || '默认画像'}</div>
        </div>

        <div class="share-card-match">
          <div class="share-card-match-bar-wrap">
            <div class="share-card-match-bar">
              <div class="share-card-match-fill" style="width:${matchScore}%"></div>
            </div>
            <span class="share-card-match-score">匹配度 ${matchScore}%</span>
          </div>
          <div class="share-card-match-dims">
            ${matchDims.map(d => `<span class="share-card-dim-tag">${d}</span>`).join('')}
          </div>
        </div>

        <div class="share-card-footer">
          <div class="share-card-footer-brand">Chovy · AI帮你选最适合的</div>
          <div class="share-card-qr">
            <div class="share-card-qr-placeholder">
              <span class="material-icons-outlined">qr_code_2</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert before the result actions
    const actions = document.querySelector('.result-actions');
    if (actions) {
      actions.parentNode.insertBefore(cardEl, actions);
    } else {
      section.parentNode.appendChild(cardEl);
    }
  }

  function setupShareButtons() {
    const actions = document.querySelector('.result-actions');
    if (!actions) return;

    // Add share buttons
    const shareBtns = document.createElement('div');
    shareBtns.className = 'share-buttons';
    shareBtns.innerHTML = `
      <button class="btn-secondary share-btn" id="saveCardBtn">
        <span class="material-icons-outlined">download</span>
        保存图片
      </button>
      <button class="btn-secondary share-btn" id="copyCardBtn">
        <span class="material-icons-outlined">content_copy</span>
        复制分享
      </button>
    `;
    actions.parentNode.insertBefore(shareBtns, actions);

    document.getElementById('saveCardBtn')?.addEventListener('click', saveCardAsImage);
    document.getElementById('copyCardBtn')?.addEventListener('click', copyCardToClipboard);
  }

  async function saveCardAsImage() {
    const card = document.getElementById('shareCard');
    if (!card || typeof html2canvas === 'undefined') {
      alert('保存功能加载失败，请稍后重试');
      return;
    }

    try {
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#1a1a2e',
        useCORS: true
      });
      const link = document.createElement('a');
      link.download = 'chovy-beauty-match.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Failed to save card:', e);
      alert('保存失败，请重试');
    }
  }

  async function copyCardToClipboard() {
    const card = document.getElementById('shareCard');
    if (!card || typeof html2canvas === 'undefined') {
      alert('复制功能加载失败，请稍后重试');
      return;
    }

    try {
      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#1a1a2e',
        useCORS: true
      });
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('已复制到剪贴板');
          } catch (e) {
            // Fallback to download
            fallbackDownload(canvas);
          }
        } else {
          fallbackDownload(canvas);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Failed to copy card:', e);
      alert('复制失败，请重试');
    }
  }

  function fallbackDownload(canvas) {
    const link = document.createElement('a');
    link.download = 'chovy-beauty-match.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ─── Helpers ──────────────────────────────────────────

  function getProfileLabel(faceProfile) {
    if (!faceProfile) return '';
    const skinLabel = getSkinToneLabel(faceProfile.skin_tone);
    const typeLabel = getSkinTypeLabel(faceProfile.skin_type);
    const styleLabel = getStyleLabel(faceProfile.style_pref);
    return `${skinLabel} · ${typeLabel} · ${styleLabel}`;
  }

  function getSkinToneLabel(val) {
    const map = { 'cold_white': '冷白皮', 'warm_yellow': '暖黄皮', 'natural': '自然肤色', 'wheat': '小麦色' };
    return map[val] || '未知肤色';
  }

  function getSkinTypeLabel(val) {
    const map = { 'dry': '干皮', 'oily': '油皮', 'combination': '混合皮', 'neutral': '中性' };
    return map[val] || '未知肤质';
  }

  function getStyleLabel(val) {
    const map = { 'daily': '日常通勤', 'elegant': '约会精致', 'bold': '大胆个性' };
    return map[val] || '日常通勤';
  }

  function buildMatchDimensions(champion, faceProfile) {
    const dims = [];
    if (!faceProfile) return dims;

    const details = champion.details || {};
    const skinTone = faceProfile.skin_tone;
    const skinType = faceProfile.skin_type;
    const category = champion.category || 'lipstick';

    // Check color/texture match
    if (category === 'lipstick') {
      const colorType = details.color_type || '';
      const suitable = details.suitable || '';

      // Skin tone match
      if (skinTone === 'warm_yellow' && (suitable.includes('黄皮') || suitable.includes('暖皮') || suitable.includes('所有'))) {
        dims.push('肤色 ✓');
      } else if (skinTone === 'cold_white' && (suitable.includes('所有') || suitable.includes('白皮'))) {
        dims.push('肤色 ✓');
      } else if (suitable.includes('所有')) {
        dims.push('肤色 ✓');
      }

      // Texture match
      const texture = details.texture || '';
      if (skinType === 'dry' && (texture.includes('滋润') || texture.includes('水润'))) {
        dims.push('质地 ✓');
      } else if (skinType === 'oily' && (texture.includes('哑光') || texture.includes('雾面'))) {
        dims.push('质地 ✓');
      } else if (skinType === 'combination' && (texture.includes('柔雾') || texture.includes('丝绒'))) {
        dims.push('质地 ✓');
      } else {
        dims.push('质地 ✓');
      }

      // Lasting match
      if (details.lasting_num >= 7) {
        dims.push('持妆 ✓');
      }
    } else {
      // Foundation
      const texture = details.texture || '';
      const suitable = details.suitable || '';

      if (skinType === 'dry' && (texture.includes('滋润') || texture.includes('水润') || texture.includes('水光'))) {
        dims.push('肤质 ✓');
      } else if (skinType === 'oily' && (texture.includes('哑光') || texture.includes('雾面'))) {
        dims.push('肤质 ✓');
      } else if (suitable.includes('所有')) {
        dims.push('肤质 ✓');
      } else {
        dims.push('肤质 ✓');
      }

      if (details.coverage) {
        dims.push('遮瑕 ✓');
      }
      if (details.spf) {
        dims.push('防晒 ✓');
      }
    }

    return dims;
  }

  return { init, showResult };
})();
